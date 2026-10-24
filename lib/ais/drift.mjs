/**
 * Drift against the AI Capability Registry.
 *
 * The registry (`frankxai/ai-capability-registry`) is the estate's private source
 * of truth for what capabilities exist, who owns them, and how much they are
 * trusted. It publishes `exports/capabilities.json` — an array of records with
 * `id`, `name`, `type`, `status`, `trust_level`, `last_reviewed`.
 *
 * AIS is public. It therefore reads the registry, compares, and reports — it
 * never copies registry content into a published artifact. The drift report is
 * an operator surface, not a discovery surface.
 *
 * The registry is a separate private repository, so its path is supplied by the
 * caller (`--registry`, or `AIS_CAPABILITY_REGISTRY`). When it is absent, this
 * module returns a documented `unavailable` result rather than pretending the
 * comparison passed.
 */

import fs from "node:fs"
import path from "node:path"

export const REGISTRY_CONTRACT = {
  repository: "frankxai/ai-capability-registry",
  exportFile: "exports/capabilities.json",
  recordKeys: ["id", "name", "type", "status", "trust_level", "last_reviewed"],
  note: "Private. AIS compares against it and reports; it never republishes its content.",
}

const STALE_AFTER_DAYS = 180

export function resolveRegistryPath({ explicit, env = process.env } = {}) {
  const candidate = explicit ?? env.AIS_CAPABILITY_REGISTRY
  if (!candidate) return null
  const resolved = path.resolve(candidate)
  if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
    return path.join(resolved, REGISTRY_CONTRACT.exportFile)
  }
  return resolved
}

export function loadRegistryRecords(registryPath) {
  if (!registryPath || !fs.existsSync(registryPath)) return null
  try {
    const parsed = JSON.parse(fs.readFileSync(registryPath, "utf8"))
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

/**
 * Compare scanned capabilities against registry records.
 *
 * @param {object[]} capabilities AIS Capability nodes
 * @param {object[]|null} records registry records, or null when unavailable
 * @param {{now?: string}} [options]
 */
export function checkDrift(capabilities, records, options = {}) {
  if (records === null) {
    return {
      status: "unavailable",
      reason:
        "The AI Capability Registry export was not found. Pass --registry <path to ai-capability-registry> or set AIS_CAPABILITY_REGISTRY. Absence is reported, never treated as a pass.",
      contract: REGISTRY_CONTRACT,
      findings: [],
    }
  }

  const now = options.now ? new Date(options.now) : new Date()
  const byId = new Map(records.filter((record) => record && typeof record.id === "string").map((r) => [r.id, r]))
  const findings = []

  for (const capability of capabilities) {
    const ref = capability.registryRef
    if (!ref) {
      findings.push({
        code: "UNREGISTERED",
        capabilityId: capability.id,
        detail: "Scanned in the repository but not bound to a registry record. Either register it or accept it as repo-local.",
      })
      continue
    }

    const record = byId.get(ref)
    if (!record) {
      findings.push({
        code: "DANGLING_REGISTRY_REF",
        capabilityId: capability.id,
        detail: `registryRef "${ref}" is not present in the registry export.`,
      })
      continue
    }

    if (record.status !== capability.status) {
      findings.push({
        code: "STATUS_DRIFT",
        capabilityId: capability.id,
        detail: `AIS says "${capability.status}", the registry says "${record.status}". The registry owns status.`,
      })
    }

    if (typeof record.last_reviewed === "string") {
      const reviewed = new Date(record.last_reviewed)
      const days = Math.floor((now - reviewed) / 86_400_000)
      if (Number.isFinite(days) && days > STALE_AFTER_DAYS) {
        findings.push({
          code: "STALE_REVIEW",
          capabilityId: capability.id,
          detail: `Registry record last reviewed ${days} days ago (threshold ${STALE_AFTER_DAYS}).`,
        })
      }
    }
  }

  const registeredIds = new Set(capabilities.map((capability) => capability.registryRef).filter(Boolean))
  for (const record of byId.values()) {
    if (record.type === "repo" && !registeredIds.has(record.id)) {
      findings.push({
        code: "REGISTRY_ONLY",
        capabilityId: record.id,
        detail: "The registry claims this repository capability; the scan did not find it.",
      })
    }
  }

  return {
    status: findings.length === 0 ? "in-sync" : "drifted",
    reason: null,
    contract: REGISTRY_CONTRACT,
    registryRecordCount: records.length,
    findings,
  }
}
