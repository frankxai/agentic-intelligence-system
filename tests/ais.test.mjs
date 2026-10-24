import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { test } from "node:test"

import { checkDrift, REGISTRY_CONTRACT } from "../lib/ais/drift.mjs"
import { isActivation, writeReceipt } from "../lib/ais/receipt.mjs"
import { deriveRoutes, resolve } from "../lib/ais/route.mjs"
import { DENYLIST, isDeniedDirectory, isDeniedFile, redact } from "../lib/ais/sanitize.mjs"
import { NODE_TYPES, SCHEMA_ID, meta, validateGraph, validateNode } from "../lib/ais/schema.mjs"
import { scan } from "../lib/ais/scan.mjs"

const fixture = fileURLToPath(new URL("./fixtures/sample-repo", import.meta.url))
const NOW = "2026-09-02T00:00:00.000Z"

// Token-shaped strings are assembled at runtime so this file never stores one.
const FAKE_GITHUB_TOKEN = `gh${"p"}_${"a".repeat(32)}`
const FAKE_API_KEY = `s${"k"}-${"b".repeat(24)}`

const ownerMeta = (overrides = {}) =>
  meta({
    owner: "test",
    provenance: "authored",
    visibility: "internal",
    evaluation: "Asserted by the test that constructed it.",
    ...overrides,
  })

test("AIS.v1 declares exactly the nine node types", () => {
  assert.equal(SCHEMA_ID, "ais.v1")
  assert.deepEqual(NODE_TYPES, [
    "RepositoryProfile",
    "TeamProfile",
    "Capability",
    "Route",
    "Policy",
    "Evidence",
    "Citation",
    "AgentRequest",
    "Resolution",
  ])
})

test("scanning the fixture produces a valid graph", () => {
  const result = scan(fixture, { owner: "test", now: NOW })
  const graph = validateGraph([result.profile, ...result.capabilities, ...result.evidence])
  assert.deepEqual(graph.errors, [])
  assert.ok(result.capabilities.length > 0)
})

test("the sanitized profile leaks nothing from the denylist", () => {
  // The fixture ships a denylisted env file with a key-shaped value and a
  // password. None of it, and no operator home path or email, may appear
  // anywhere in the output.
  const envPath = path.join(fixture, ".env.fixture")
  assert.ok(fs.existsSync(envPath), "the fixture must actually contain a denylisted file")
  const secretContent = fs.readFileSync(envPath, "utf8")

  const result = scan(fixture, { owner: "test", now: NOW })
  const serialized = JSON.stringify(result)

  assert.ok(result.deniedFileCount >= 1, "the scan must have seen the denylisted file")

  for (const forbidden of ["fixture0000", "hunter2", "OPENAI_API_KEY", "DATABASE_PASSWORD"]) {
    assert.ok(!serialized.includes(forbidden), `"${forbidden}" leaked into the profile`)
  }
  for (const line of secretContent.split("\n").map((entry) => entry.trim()).filter(Boolean)) {
    assert.ok(!serialized.includes(line), "a raw line from the denylisted file leaked into the profile")
  }

  assert.ok(!serialized.includes("fixtureperson"), "an operator home path leaked into the profile")
  assert.ok(!serialized.includes("fixture.person@example.com"), "an email address leaked into the profile")
  assert.ok(!/[A-Za-z]:\\\\Users/.test(serialized), "an absolute Windows user path leaked into the profile")

  // Withholding is reported rather than hidden.
  assert.ok(result.profile.redactions.some((entry) => entry.includes("denylisted")))
})

test("the denylist covers the file and directory classes that carry credentials", () => {
  for (const file of [".env", ".env.production", "id_rsa", "server.pem", "credentials.json", "cwallet.sso", ".npmrc"]) {
    assert.equal(isDeniedFile(file), true, `${file} must be denied`)
  }
  assert.equal(isDeniedFile("README.md"), false)

  for (const dir of [".git", ".ssh", ".aws", "node_modules", ".vercel", "secrets"]) {
    assert.equal(isDeniedDirectory(dir), true, `${dir} must not be descended into`)
  }
  assert.equal(isDeniedDirectory("src"), false)
  assert.ok(DENYLIST.redactionClasses.includes("[redacted:private-key]"))
})

test("redaction catches tokens, keys and home paths in surviving text", () => {
  const { text, redactions } = redact(
    `token ${FAKE_GITHUB_TOKEN} lives in /home/frank/notes and ${FAKE_API_KEY} is worse`,
  )
  assert.ok(!text.includes(FAKE_GITHUB_TOKEN))
  assert.ok(!text.includes("/home/frank"))
  assert.ok(!text.includes(FAKE_API_KEY))
  assert.ok(redactions.length >= 3)
})

test("an absolute machine path is refused as an evidence sourceRef", () => {
  const node = {
    kind: "Evidence",
    id: "ev.bad",
    statement: "Something is true here.",
    sourceRef: "repo:C:/Users/frank/secret.md",
    collectedAt: NOW,
    meta: ownerMeta({ provenance: "scanned", visibility: "public" }),
  }
  const result = validateNode(node)
  assert.equal(result.ok, false)
  assert.ok(result.errors.some((error) => error.code === "E_NOT_A_SOURCE_REF"))
})

test("a routed request resolves with a citation that points at real evidence", () => {
  const { profile, capabilities, evidence } = scan(fixture, { owner: "test", now: NOW })
  const routes = deriveRoutes(capabilities, { owner: "test" })

  const request = {
    kind: "AgentRequest",
    id: "req.1",
    intent: "run the build",
    verbs: ["build"],
    repositoryId: profile.id,
    requester: "test",
    receivedAt: NOW,
    meta: ownerMeta(),
  }

  const resolution = resolve(request, { routes, capabilities, policies: [], evidence, now: NOW, owner: "test" })

  assert.equal(resolution.status, "resolved")
  assert.equal(resolution.citations.length, 1)
  assert.match(resolution.capabilityId, /script\.build$/)

  const cited = evidence.find((node) => node.id === resolution.citations[0].evidenceId)
  assert.ok(cited, "the citation must point at an evidence node that exists")
  assert.equal(resolution.citations[0].locator, cited.sourceRef)
  assert.deepEqual(validateNode(resolution, "resolution").errors, [])
})

test("an unroutable request is refused, not guessed", () => {
  const { capabilities, evidence } = scan(fixture, { owner: "test", now: NOW })
  const routes = deriveRoutes(capabilities, { owner: "test" })

  const resolution = resolve(
    {
      kind: "AgentRequest",
      id: "req.2",
      intent: "negotiate a distribution contract",
      verbs: ["negotiate"],
      repositoryId: null,
      requester: "test",
      receivedAt: NOW,
      meta: ownerMeta(),
    },
    { routes, capabilities, policies: [], evidence, now: NOW, owner: "test" },
  )

  assert.equal(resolution.status, "refused")
  assert.equal(resolution.citations.length, 0)
  assert.match(resolution.rationale, /refuses rather than guessing/)
})

test("a deny policy on the route blocks the capability", () => {
  const { capabilities, evidence } = scan(fixture, { owner: "test", now: NOW })
  const policy = {
    kind: "Policy",
    id: "policy.no-build",
    statement: "Builds are not routed on a machine under a storage hold.",
    effect: "deny",
    appliesTo: ["build"],
    meta: ownerMeta({ visibility: "internal" }),
  }
  const routes = deriveRoutes(capabilities, { owner: "test", policyIds: [policy.id] })

  const resolution = resolve(
    {
      kind: "AgentRequest",
      id: "req.3",
      intent: "run the build",
      verbs: ["build"],
      repositoryId: null,
      requester: "test",
      receivedAt: NOW,
      meta: ownerMeta(),
    },
    { routes, capabilities, policies: [policy], evidence, now: NOW, owner: "test" },
  )

  assert.equal(resolution.status, "refused")
  assert.match(resolution.rationale, /policy\.no-build denies/)
})

test("a resolved answer with no citation is a schema error", () => {
  const bad = {
    kind: "Resolution",
    id: "res.bad",
    requestId: "req.bad",
    status: "resolved",
    routeId: null,
    capabilityId: null,
    citations: [],
    policyDecisions: [],
    rationale: "Answered from memory rather than from the repository.",
    resolvedAt: NOW,
    meta: ownerMeta({ provenance: "derived" }),
  }
  assert.ok(validateNode(bad).errors.some((error) => error.code === "E_RESOLVED_WITHOUT_CITATION"))
})

test("an active capability with no evidence is a schema error", () => {
  const bad = {
    kind: "Capability",
    id: "cap.claim",
    name: "Does everything",
    description: "A capability asserted with nothing behind it.",
    verbs: ["everything"],
    repositoryId: "repo.x",
    registryRef: null,
    status: "active",
    evidenceIds: [],
    meta: ownerMeta({ visibility: "public" }),
  }
  assert.ok(validateNode(bad).errors.some((error) => error.code === "E_UNEVIDENCED_CAPABILITY"))
})

test("graph edges must land on a node of the right kind", () => {
  const { profile, capabilities, evidence } = scan(fixture, { owner: "test", now: NOW })
  const broken = JSON.parse(JSON.stringify(capabilities[0]))
  broken.id = "cap.broken"
  broken.repositoryId = "repo.does-not-exist"

  const result = validateGraph([profile, broken, ...evidence])
  assert.ok(result.errors.some((error) => error.code === "E_DANGLING_EDGE"))
})

test("a receipt records the activation event and can be replayed", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ais-receipt-"))
  try {
    const { profile, capabilities, evidence } = scan(fixture, { owner: "test", now: NOW })
    const routes = deriveRoutes(capabilities, { owner: "test" })
    const request = {
      kind: "AgentRequest",
      id: "req.receipt",
      intent: "run the test",
      verbs: ["test"],
      repositoryId: profile.id,
      requester: "test",
      receivedAt: NOW,
      meta: ownerMeta(),
    }
    const resolution = resolve(request, { routes, capabilities, policies: [], evidence, now: NOW, owner: "test" })

    const { file, receipt } = writeReceipt({ request, resolution, profileId: profile.id }, { cwd: dir, now: NOW })

    assert.ok(fs.existsSync(file))
    assert.equal(receipt.valid, true)
    assert.equal(isActivation(receipt), true)

    const reloaded = JSON.parse(fs.readFileSync(file, "utf8"))
    assert.equal(isActivation(reloaded), true)
    assert.equal(reloaded.schema, "ais.receipt.v1")

    // A refused resolution is still a receipt, but never an activation.
    const refused = { ...resolution, id: "res.refused", status: "refused", citations: [] }
    const second = writeReceipt({ request, resolution: refused, profileId: profile.id }, { cwd: dir, now: NOW })
    assert.equal(isActivation(second.receipt), false)
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test("drift reports unavailable rather than passing when the registry is absent", () => {
  const report = checkDrift([], null)
  assert.equal(report.status, "unavailable")
  assert.match(report.reason, /AIS_CAPABILITY_REGISTRY/)
  assert.equal(report.contract.repository, "frankxai/ai-capability-registry")
})

test("drift against the registry export finds status and staleness gaps", () => {
  const capabilities = [
    {
      kind: "Capability",
      id: "cap.a",
      name: "A",
      description: "Bound to a registry record.",
      verbs: ["a"],
      repositoryId: "repo.x",
      registryRef: "app.codex",
      status: "active",
      evidenceIds: ["ev.a"],
      meta: ownerMeta({ visibility: "public" }),
    },
    {
      kind: "Capability",
      id: "cap.b",
      name: "B",
      description: "Not bound to anything in the registry.",
      verbs: ["b"],
      repositoryId: "repo.x",
      registryRef: null,
      status: "watch",
      evidenceIds: [],
      meta: ownerMeta({ visibility: "public" }),
    },
  ]

  const records = [
    {
      id: "app.codex",
      name: "Codex Desktop",
      type: "app",
      status: "watch",
      trust_level: "high",
      last_reviewed: "2024-01-01",
    },
  ]

  const report = checkDrift(capabilities, records, { now: NOW })
  const codes = report.findings.map((finding) => finding.code)

  assert.equal(report.status, "drifted")
  assert.ok(codes.includes("STATUS_DRIFT"))
  assert.ok(codes.includes("STALE_REVIEW"))
  assert.ok(codes.includes("UNREGISTERED"))
})

test("the MCP tool definitions match the implemented workflow", () => {
  const definitions = JSON.parse(fs.readFileSync(new URL("../lib/ais/mcp-tools.json", import.meta.url), "utf8"))
  const names = definitions.tools.map((tool) => tool.name)

  assert.deepEqual(names, ["ais_scan_repository", "ais_route_request", "ais_write_receipt", "ais_check_registry_drift"])
  for (const tool of definitions.tools) {
    assert.equal(tool.inputSchema.additionalProperties, false, `${tool.name} must close its input schema`)
    assert.ok(tool.description.length > 40)
  }
  assert.ok(definitions.server.boundary.some((line) => /denylisted/.test(line)))
  assert.equal(REGISTRY_CONTRACT.exportFile, "exports/capabilities.json")
})
