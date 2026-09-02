/**
 * AIS.v1 — the contract for making a workspace legible and routable.
 *
 * AIS is the public-safe discovery, AEO/GEO, capability-routing and workspace-
 * legibility layer. It is NOT a memory system and NOT an orchestration UI: it
 * answers "what can this repository do, who may ask, and what is the citation",
 * then hands the work to whatever runtime the caller already has.
 *
 * Nine node types. Every node carries `meta` — owner, provenance, version,
 * visibility, evaluation — so a reader can tell a scanned fact from an authored
 * one, and knows what would falsify it.
 *
 * Dependency-free ESM: this file runs under plain `node` with no install, which
 * is the point — a discovery layer that needs a build step cannot be the first
 * thing an agent reaches for.
 */

export const SCHEMA_ID = "ais.v1"

export const NODE_TYPES = /** @type {const} */ ([
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

export const PROVENANCE = ["scanned", "authored", "derived", "third-party"]
export const VISIBILITY = ["public", "internal", "private"]
export const POLICY_EFFECTS = ["allow", "deny", "require-approval"]
export const RESOLUTION_STATUS = ["resolved", "refused", "ambiguous"]
export const CAPABILITY_STATUS = ["active", "watch", "experimental", "deprecated", "retired"]

/**
 * The portable contracts owned by the AI Capability Registry
 * (`frankxai/ai-capability-registry`, `registry/schema/portable-profile-reference.schema.json`).
 * AIS binds to them by reference and never re-declares their canonical schema —
 * the registry stays the owner of repo and team identity.
 */
export const PORTABLE_CONTRACTS = {
  repository: "starlight.repo_profile.v2",
  team: "starlight.team_profile.v2",
}

const META_KEYS = ["owner", "provenance", "version", "visibility", "evaluation"]

class Report {
  constructor() {
    this.errors = []
  }

  error(code, path, message) {
    this.errors.push({ code, path, message })
  }
}

const isPlainObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value)

function requireShape(report, node, path, required, optional = []) {
  if (!isPlainObject(node)) {
    report.error("E_NOT_AN_OBJECT", path, "expected an object")
    return false
  }
  const allowed = new Set([...required, ...optional])
  for (const key of required) {
    if (!(key in node)) report.error("E_MISSING_KEY", `${path}.${key}`, `required key "${key}" is missing`)
  }
  for (const key of Object.keys(node)) {
    if (!allowed.has(key)) {
      report.error("E_UNKNOWN_KEY", `${path}.${key}`, `unknown key "${key}" — AIS.v1 is a closed schema`)
    }
  }
  return true
}

function requireString(report, value, path, min = 1) {
  if (typeof value !== "string" || value.trim().length < min) {
    report.error("E_NOT_A_STRING", path, `expected a string of at least ${min} characters`)
    return false
  }
  return true
}

function requireStringArray(report, value, path, { allowEmpty = true, min = 1 } = {}) {
  if (!Array.isArray(value)) {
    report.error("E_NOT_A_LIST", path, "expected an array")
    return false
  }
  if (!allowEmpty && value.length === 0) {
    report.error("E_EMPTY_LIST", path, "expected at least one entry")
    return false
  }
  value.forEach((entry, index) => requireString(report, entry, `${path}[${index}]`, min))
  return true
}

function requireEnum(report, value, path, allowed) {
  if (!allowed.includes(value)) {
    report.error("E_NOT_IN_ENUM", path, `expected one of ${allowed.join(", ")}`)
    return false
  }
  return true
}

function requireTimestamp(report, value, path) {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    report.error("E_NOT_A_TIMESTAMP", path, "expected an ISO 8601 timestamp")
    return false
  }
  return true
}

/**
 * A source reference an agent can actually follow: either an https URL or a
 * workspace-relative `repo:<path>` locator. Absolute machine paths are refused
 * on purpose — they leak the operator's filesystem into a public artifact.
 */
export function isSourceRef(value) {
  if (typeof value !== "string" || value.trim() === "") return false
  if (value.startsWith("https://")) return true
  if (!value.startsWith("repo:")) return false
  const target = value.slice("repo:".length)
  if (target === "" || target.startsWith("/") || target.startsWith("\\")) return false
  if (/^[A-Za-z]:[\\/]/.test(target)) return false
  return !target.includes("..")
}

function requireSourceRef(report, value, path) {
  if (!isSourceRef(value)) {
    report.error(
      "E_NOT_A_SOURCE_REF",
      path,
      'expected an https URL or a workspace-relative "repo:path" locator (absolute machine paths are refused)',
    )
    return false
  }
  return true
}

function validateMeta(report, meta, path) {
  if (!requireShape(report, meta, path, META_KEYS)) return
  requireString(report, meta.owner, `${path}.owner`, 2)
  requireEnum(report, meta.provenance, `${path}.provenance`, PROVENANCE)
  requireString(report, meta.version, `${path}.version`, 1)
  requireEnum(report, meta.visibility, `${path}.visibility`, VISIBILITY)
  requireString(report, meta.evaluation, `${path}.evaluation`, 12)
}

function validateContractRef(report, ref, path, expected) {
  if (ref === null) return
  if (!requireShape(report, ref, path, ["contractId", "profileId", "sourceRef"])) return
  if (ref.contractId !== expected) {
    report.error("E_WRONG_CONTRACT", `${path}.contractId`, `expected "${expected}"`)
  }
  requireString(report, ref.profileId, `${path}.profileId`, 3)
  requireSourceRef(report, ref.sourceRef, `${path}.sourceRef`)
}

const VALIDATORS = {
  RepositoryProfile(report, node, path) {
    if (
      !requireShape(report, node, path, [
        "kind",
        "id",
        "name",
        "contractRef",
        "languages",
        "entrypoints",
        "commands",
        "capabilityIds",
        "docs",
        "scannedAt",
        "redactions",
        "meta",
      ])
    )
      return
    requireString(report, node.id, `${path}.id`, 2)
    requireString(report, node.name, `${path}.name`, 2)
    validateContractRef(report, node.contractRef, `${path}.contractRef`, PORTABLE_CONTRACTS.repository)
    requireStringArray(report, node.languages, `${path}.languages`)
    requireStringArray(report, node.entrypoints, `${path}.entrypoints`)
    requireStringArray(report, node.capabilityIds, `${path}.capabilityIds`)
    requireTimestamp(report, node.scannedAt, `${path}.scannedAt`)

    if (!isPlainObject(node.commands)) {
      report.error("E_NOT_AN_OBJECT", `${path}.commands`, "expected an object of name -> command")
    }
    if (Array.isArray(node.docs)) {
      node.docs.forEach((doc, index) => requireSourceRef(report, doc, `${path}.docs[${index}]`))
    } else {
      report.error("E_NOT_A_LIST", `${path}.docs`, "expected an array")
    }
    if (!Array.isArray(node.redactions)) {
      report.error("E_NOT_A_LIST", `${path}.redactions`, "expected an array (empty means nothing was withheld)")
    }
    validateMeta(report, node.meta, `${path}.meta`)
  },

  TeamProfile(report, node, path) {
    if (!requireShape(report, node, path, ["kind", "id", "name", "contractRef", "roles", "repositoryIds", "escalation", "meta"]))
      return
    requireString(report, node.id, `${path}.id`, 2)
    requireString(report, node.name, `${path}.name`, 2)
    validateContractRef(report, node.contractRef, `${path}.contractRef`, PORTABLE_CONTRACTS.team)
    requireStringArray(report, node.roles, `${path}.roles`, { allowEmpty: false })
    requireStringArray(report, node.repositoryIds, `${path}.repositoryIds`)
    requireString(report, node.escalation, `${path}.escalation`, 8)
    validateMeta(report, node.meta, `${path}.meta`)
  },

  Capability(report, node, path) {
    if (
      !requireShape(report, node, path, [
        "kind",
        "id",
        "name",
        "description",
        "verbs",
        "repositoryId",
        "registryRef",
        "status",
        "evidenceIds",
        "meta",
      ])
    )
      return
    requireString(report, node.id, `${path}.id`, 2)
    requireString(report, node.name, `${path}.name`, 2)
    requireString(report, node.description, `${path}.description`, 12)
    requireStringArray(report, node.verbs, `${path}.verbs`, { allowEmpty: false, min: 2 })
    requireString(report, node.repositoryId, `${path}.repositoryId`, 2)
    requireEnum(report, node.status, `${path}.status`, CAPABILITY_STATUS)
    requireStringArray(report, node.evidenceIds, `${path}.evidenceIds`)
    if (node.registryRef !== null) requireString(report, node.registryRef, `${path}.registryRef`, 2)
    validateMeta(report, node.meta, `${path}.meta`)

    // A capability nobody can check is a marketing claim.
    if (Array.isArray(node.evidenceIds) && node.evidenceIds.length === 0 && node.status === "active") {
      report.error(
        "E_UNEVIDENCED_CAPABILITY",
        `${path}.evidenceIds`,
        'an "active" capability must point at evidence — downgrade it to "watch" until something in the repository proves it',
      )
    }
  },

  Route(report, node, path) {
    if (!requireShape(report, node, path, ["kind", "id", "match", "capabilityId", "priority", "policyIds", "meta"])) return
    requireString(report, node.id, `${path}.id`, 2)
    requireString(report, node.capabilityId, `${path}.capabilityId`, 2)
    requireStringArray(report, node.policyIds, `${path}.policyIds`)
    if (typeof node.priority !== "number" || !Number.isInteger(node.priority)) {
      report.error("E_NOT_AN_INTEGER", `${path}.priority`, "expected an integer (higher wins)")
    }
    if (requireShape(report, node.match, `${path}.match`, ["intents", "verbs"], ["repositoryId"])) {
      requireStringArray(report, node.match.intents, `${path}.match.intents`, { allowEmpty: false, min: 2 })
      requireStringArray(report, node.match.verbs, `${path}.match.verbs`)
    }
    validateMeta(report, node.meta, `${path}.meta`)
  },

  Policy(report, node, path) {
    if (!requireShape(report, node, path, ["kind", "id", "statement", "effect", "appliesTo", "meta"])) return
    requireString(report, node.id, `${path}.id`, 2)
    requireString(report, node.statement, `${path}.statement`, 12)
    requireEnum(report, node.effect, `${path}.effect`, POLICY_EFFECTS)
    requireStringArray(report, node.appliesTo, `${path}.appliesTo`, { allowEmpty: false })
    validateMeta(report, node.meta, `${path}.meta`)
  },

  Evidence(report, node, path) {
    if (!requireShape(report, node, path, ["kind", "id", "statement", "sourceRef", "collectedAt", "meta"])) return
    requireString(report, node.id, `${path}.id`, 2)
    requireString(report, node.statement, `${path}.statement`, 8)
    requireSourceRef(report, node.sourceRef, `${path}.sourceRef`)
    requireTimestamp(report, node.collectedAt, `${path}.collectedAt`)
    validateMeta(report, node.meta, `${path}.meta`)
  },

  Citation(report, node, path) {
    if (!requireShape(report, node, path, ["kind", "id", "evidenceId", "locator", "quote", "meta"])) return
    requireString(report, node.id, `${path}.id`, 2)
    requireString(report, node.evidenceId, `${path}.evidenceId`, 2)
    requireSourceRef(report, node.locator, `${path}.locator`)
    requireString(report, node.quote, `${path}.quote`, 4)
    validateMeta(report, node.meta, `${path}.meta`)
  },

  AgentRequest(report, node, path) {
    if (!requireShape(report, node, path, ["kind", "id", "intent", "verbs", "repositoryId", "requester", "receivedAt", "meta"]))
      return
    requireString(report, node.id, `${path}.id`, 2)
    requireString(report, node.intent, `${path}.intent`, 3)
    requireStringArray(report, node.verbs, `${path}.verbs`)
    requireString(report, node.requester, `${path}.requester`, 2)
    requireTimestamp(report, node.receivedAt, `${path}.receivedAt`)
    if (node.repositoryId !== null) requireString(report, node.repositoryId, `${path}.repositoryId`, 2)
    validateMeta(report, node.meta, `${path}.meta`)
  },

  Resolution(report, node, path) {
    if (
      !requireShape(report, node, path, [
        "kind",
        "id",
        "requestId",
        "status",
        "routeId",
        "capabilityId",
        "citations",
        "policyDecisions",
        "rationale",
        "resolvedAt",
        "meta",
      ])
    )
      return
    requireString(report, node.id, `${path}.id`, 2)
    requireString(report, node.requestId, `${path}.requestId`, 2)
    requireEnum(report, node.status, `${path}.status`, RESOLUTION_STATUS)
    requireString(report, node.rationale, `${path}.rationale`, 12)
    requireTimestamp(report, node.resolvedAt, `${path}.resolvedAt`)
    if (node.routeId !== null) requireString(report, node.routeId, `${path}.routeId`, 2)
    if (node.capabilityId !== null) requireString(report, node.capabilityId, `${path}.capabilityId`, 2)
    if (!Array.isArray(node.citations)) {
      report.error("E_NOT_A_LIST", `${path}.citations`, "expected an array")
    } else {
      node.citations.forEach((citation, index) => VALIDATORS.Citation(report, citation, `${path}.citations[${index}]`))
    }
    if (!Array.isArray(node.policyDecisions)) {
      report.error("E_NOT_A_LIST", `${path}.policyDecisions`, "expected an array")
    }
    validateMeta(report, node.meta, `${path}.meta`)

    // The activation event of this whole layer is a routed request that arrives
    // with a citation. A resolution without one is a guess with a receipt.
    if (node.status === "resolved" && Array.isArray(node.citations) && node.citations.length === 0) {
      report.error(
        "E_RESOLVED_WITHOUT_CITATION",
        `${path}.citations`,
        'a "resolved" answer must carry at least one citation — refuse or mark it ambiguous instead',
      )
    }
  },
}

/**
 * @param {unknown} node
 * @param {string} [path]
 */
export function validateNode(node, path = "node") {
  const report = new Report()
  if (!isPlainObject(node) || typeof node.kind !== "string" || !NODE_TYPES.includes(node.kind)) {
    report.error("E_UNKNOWN_NODE_KIND", `${path}.kind`, `expected one of ${NODE_TYPES.join(", ")}`)
    return { ok: false, errors: report.errors }
  }
  VALIDATORS[node.kind](report, node, path)
  return { ok: report.errors.length === 0, errors: report.errors }
}

/** Validate a whole graph of AIS.v1 nodes and check that every edge lands. */
export function validateGraph(nodes) {
  const errors = []
  if (!Array.isArray(nodes)) {
    return { ok: false, errors: [{ code: "E_NOT_A_LIST", path: "graph", message: "expected an array of nodes" }] }
  }

  const ids = new Map()
  nodes.forEach((node, index) => {
    const path = `graph[${index}]`
    const result = validateNode(node, path)
    errors.push(...result.errors)
    if (isPlainObject(node) && typeof node.id === "string") {
      if (ids.has(node.id)) {
        errors.push({ code: "E_DUPLICATE_ID", path: `${path}.id`, message: `id "${node.id}" is already used` })
      }
      ids.set(node.id, node.kind)
    }
  })

  const edge = (index, field, value, expectedKind) => {
    if (value === null || value === undefined) return
    const kind = ids.get(value)
    if (kind === undefined) {
      errors.push({
        code: "E_DANGLING_EDGE",
        path: `graph[${index}].${field}`,
        message: `no node with id "${value}"`,
      })
    } else if (kind !== expectedKind) {
      errors.push({
        code: "E_WRONG_EDGE_KIND",
        path: `graph[${index}].${field}`,
        message: `"${value}" is a ${kind}, expected a ${expectedKind}`,
      })
    }
  }

  nodes.forEach((node, index) => {
    if (!isPlainObject(node)) return
    switch (node.kind) {
      case "Capability":
        edge(index, "repositoryId", node.repositoryId, "RepositoryProfile")
        ;(node.evidenceIds ?? []).forEach((id, i) => edge(index, `evidenceIds[${i}]`, id, "Evidence"))
        break
      case "Route":
        edge(index, "capabilityId", node.capabilityId, "Capability")
        ;(node.policyIds ?? []).forEach((id, i) => edge(index, `policyIds[${i}]`, id, "Policy"))
        break
      case "Citation":
        edge(index, "evidenceId", node.evidenceId, "Evidence")
        break
      case "Resolution":
        edge(index, "requestId", node.requestId, "AgentRequest")
        edge(index, "routeId", node.routeId, "Route")
        edge(index, "capabilityId", node.capabilityId, "Capability")
        break
      default:
        break
    }
  })

  return { ok: errors.length === 0, errors }
}

/** Build a `meta` block. Present so no caller invents a fifth field. */
export function meta({ owner, provenance, version = "1.0.0", visibility, evaluation }) {
  return { owner, provenance, version, visibility, evaluation }
}
