/**
 * scan(repoPath) → a sanitized RepositoryProfile plus the Capability and
 * Evidence nodes it can actually justify.
 *
 * The scanner only claims what it can point at. Every Capability it emits
 * carries at least one Evidence node with a `repo:` locator, and a capability
 * with no evidence is emitted as "watch", never "active".
 */

import fs from "node:fs"
import path from "node:path"

import { isDeniedDirectory, isDeniedFile, redactDeep } from "./sanitize.mjs"
import { meta } from "./schema.mjs"

const LANGUAGE_BY_EXTENSION = {
  ".ts": "TypeScript",
  ".tsx": "TypeScript",
  ".mjs": "JavaScript",
  ".cjs": "JavaScript",
  ".js": "JavaScript",
  ".jsx": "JavaScript",
  ".py": "Python",
  ".rs": "Rust",
  ".go": "Go",
  ".rb": "Ruby",
  ".sh": "Shell",
  ".ps1": "PowerShell",
}

const DOC_FILES = ["README.md", "AGENTS.md", "CLAUDE.md", "CONTRIBUTING.md", "SECURITY.md", "SCHEMA.md"]

const MAX_DEPTH = 4
const MAX_FILES = 4000

function walk(root) {
  /** @type {{relative: string, basename: string, denied: boolean}[]} */
  const files = []

  const visit = (directory, depth) => {
    if (depth > MAX_DEPTH || files.length >= MAX_FILES) return

    let entries
    try {
      entries = fs.readdirSync(directory, { withFileTypes: true })
    } catch {
      return
    }

    for (const entry of entries) {
      if (files.length >= MAX_FILES) return
      const absolute = path.join(directory, entry.name)

      if (entry.isDirectory()) {
        if (isDeniedDirectory(entry.name)) continue
        visit(absolute, depth + 1)
        continue
      }
      if (!entry.isFile()) continue

      files.push({
        relative: path.relative(root, absolute).split(path.sep).join("/"),
        basename: entry.name,
        denied: isDeniedFile(entry.name),
      })
    }
  }

  visit(root, 0)
  return files
}

function readSafely(root, relative, limit = 24_000) {
  try {
    return fs.readFileSync(path.join(root, relative), "utf8").slice(0, limit)
  } catch {
    return null
  }
}

function evidence(id, statement, sourceRef, collectedAt, owner) {
  return {
    kind: "Evidence",
    id,
    statement,
    sourceRef,
    collectedAt,
    meta: meta({
      owner,
      provenance: "scanned",
      visibility: "public",
      evaluation: "Open the sourceRef; the file exists and says what the statement says.",
    }),
  }
}

/**
 * @param {string} repoPath
 * @param {{owner?: string, repositoryId?: string, now?: string}} [options]
 */
export function scan(repoPath, options = {}) {
  const root = path.resolve(repoPath)
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    throw new Error(`scan: not a directory: ${repoPath}`)
  }

  const now = options.now ?? new Date().toISOString()
  const owner = options.owner ?? "unassigned"
  const files = walk(root)
  const byPath = new Set(files.map((file) => file.relative))

  const repositoryId = options.repositoryId ?? `repo.${path.basename(root).toLowerCase().replace(/[^a-z0-9._-]+/g, "-")}`

  // Languages, counted from what is present rather than declared.
  const languageCounts = new Map()
  for (const file of files) {
    const language = LANGUAGE_BY_EXTENSION[path.extname(file.basename).toLowerCase()]
    if (language) languageCounts.set(language, (languageCounts.get(language) ?? 0) + 1)
  }
  const languages = [...languageCounts.entries()].sort((a, b) => b[1] - a[1]).map(([language]) => language)

  const capabilities = []
  const evidenceNodes = []
  const push = (capability, evidenceNode) => {
    if (evidenceNode) evidenceNodes.push(evidenceNode)
    capabilities.push(capability)
  }

  // Commands come from package.json scripts, which is a claim the repository
  // makes about itself in a machine-readable place.
  /** @type {Record<string, string>} */
  let commands = {}
  const manifestRaw = byPath.has("package.json") ? readSafely(root, "package.json") : null
  let manifest = null
  if (manifestRaw) {
    try {
      manifest = JSON.parse(manifestRaw)
      commands = Object.fromEntries(
        Object.entries(manifest.scripts ?? {}).filter(([, value]) => typeof value === "string"),
      )
    } catch {
      manifest = null
    }
  }

  for (const [name, command] of Object.entries(commands)) {
    const capabilityId = `cap.${repositoryId}.script.${name}`
    const evidenceId = `ev.${capabilityId}`
    push(
      {
        kind: "Capability",
        id: capabilityId,
        name: `Run ${name}`,
        description: `The repository declares a "${name}" script: ${command}`,
        verbs: [name, "run"],
        repositoryId,
        registryRef: null,
        status: "active",
        evidenceIds: [evidenceId],
        meta: meta({
          owner,
          provenance: "scanned",
          visibility: "public",
          evaluation: `Running "${name}" in a clean checkout exits zero.`,
        }),
      },
      evidence(evidenceId, `package.json declares the script "${name}".`, "repo:package.json", now, owner),
    )
  }

  // Documented entrypoints an agent can read before touching anything.
  const docs = DOC_FILES.filter((doc) => byPath.has(doc)).map((doc) => `repo:${doc}`)
  for (const doc of DOC_FILES.filter((file) => byPath.has(file))) {
    const capabilityId = `cap.${repositoryId}.doc.${doc.replace(/\W+/g, "-").toLowerCase()}`
    const evidenceId = `ev.${capabilityId}`
    push(
      {
        kind: "Capability",
        id: capabilityId,
        name: `Read ${doc}`,
        description: `${doc} is present and is the repository's own instruction surface.`,
        verbs: ["read", "orient", "understand"],
        repositoryId,
        registryRef: null,
        status: "active",
        evidenceIds: [evidenceId],
        meta: meta({
          owner,
          provenance: "scanned",
          visibility: "public",
          evaluation: `${doc} exists at the repository root and is non-empty.`,
        }),
      },
      evidence(evidenceId, `${doc} exists at the repository root.`, `repo:${doc}`, now, owner),
    )
  }

  const entrypoints = ["src/index.ts", "src/index.mjs", "index.mjs", "index.js", "main.py", "bin"].filter((candidate) =>
    [...byPath].some((file) => file === candidate || file.startsWith(`${candidate}/`)),
  )

  // Denied files are counted, never described. The count is the honest signal:
  // "this repository holds secrets and none of them are in this profile".
  const deniedCount = files.filter((file) => file.denied).length
  const redactions = []
  if (deniedCount > 0) {
    redactions.push(`${deniedCount} denylisted file(s) were not opened`)
  }

  const profile = {
    kind: "RepositoryProfile",
    id: repositoryId,
    name: manifest?.name ?? path.basename(root),
    contractRef: null,
    languages,
    entrypoints,
    commands,
    capabilityIds: capabilities.map((capability) => capability.id),
    docs,
    scannedAt: now,
    redactions,
    meta: meta({
      owner,
      provenance: "scanned",
      visibility: "public",
      evaluation: "Re-running scan on the same commit produces the same profile, and no denylisted content appears in it.",
    }),
  }

  // One redaction pass at the boundary. Anything the walk let through — a script
  // body, a package name, a path — is scrubbed here before it can be published.
  const discovered = []
  const sanitized = redactDeep({ profile, capabilities, evidence: evidenceNodes }, discovered)
  for (const entry of discovered) {
    const note = `redacted ${entry.replace(/^\[redacted:|]$/g, "")} in scanned text`
    if (!sanitized.profile.redactions.includes(note)) sanitized.profile.redactions.push(note)
  }

  return {
    profile: sanitized.profile,
    capabilities: sanitized.capabilities,
    evidence: sanitized.evidence,
    scannedFileCount: files.length,
    deniedFileCount: deniedCount,
  }
}
