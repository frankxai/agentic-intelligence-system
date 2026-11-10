/**
 * AgentRequest → Route → Capability → Resolution, with a Citation.
 *
 * The resolver is deterministic and refuses by default. It answers "resolved"
 * only when a route matched, policy allowed it, and it can attach a citation
 * that points at real evidence. Anything else is "refused" or "ambiguous" with a
 * rationale — an unrouted request is a fact about the workspace, not a failure
 * to paper over.
 */

import { meta } from "./schema.mjs"

const normalize = (value) => String(value ?? "").toLowerCase().trim()

function scoreRoute(route, request) {
  // A request with no repositoryId is unscoped and may match any route. A request
  // that names a repository may only match routes for that repository.
  if (request.repositoryId && route.match.repositoryId && route.match.repositoryId !== request.repositoryId) return -1

  const intent = normalize(request.intent)
  const intentHit = route.match.intents.some((candidate) => {
    const needle = normalize(candidate)
    return intent === needle || intent.includes(needle)
  })
  if (!intentHit) return -1

  const requestVerbs = new Set(request.verbs.map(normalize))
  const routeVerbs = route.match.verbs.map(normalize)
  const verbHits = routeVerbs.filter((verb) => requestVerbs.has(verb)).length

  // Route verbs are a filter when the route declares them and the request
  // declares verbs: no overlap means this is not the route.
  if (routeVerbs.length > 0 && requestVerbs.size > 0 && verbHits === 0) return -1

  return route.priority * 100 + verbHits
}

function citationFor(capability, evidenceById, owner) {
  for (const evidenceId of capability.evidenceIds ?? []) {
    const evidence = evidenceById.get(evidenceId)
    if (!evidence) continue
    return {
      kind: "Citation",
      id: `cite.${capability.id}`,
      evidenceId: evidence.id,
      locator: evidence.sourceRef,
      quote: evidence.statement,
      meta: meta({
        owner,
        provenance: "derived",
        visibility: "public",
        evaluation: "The locator resolves and contains the quoted statement.",
      }),
    }
  }
  return null
}

/**
 * @param {object} request AgentRequest node
 * @param {{routes: object[], capabilities: object[], policies: object[], evidence: object[], now?: string, owner?: string}} graph
 * @returns {object} Resolution node
 */
export function resolve(request, graph) {
  const now = graph.now ?? new Date().toISOString()
  const owner = graph.owner ?? "unassigned"
  const capabilityById = new Map(graph.capabilities.map((capability) => [capability.id, capability]))
  const evidenceById = new Map((graph.evidence ?? []).map((node) => [node.id, node]))
  const policyById = new Map((graph.policies ?? []).map((policy) => [policy.id, policy]))

  const resolution = (status, { routeId = null, capabilityId = null, citations = [], policyDecisions = [], rationale }) => ({
    kind: "Resolution",
    id: `res.${request.id}`,
    requestId: request.id,
    status,
    routeId,
    capabilityId,
    citations,
    policyDecisions,
    rationale,
    resolvedAt: now,
    meta: meta({
      owner,
      provenance: "derived",
      visibility: "internal",
      evaluation: "Replaying the same request against the same graph yields the same resolution.",
    }),
  })

  const scored = graph.routes
    .map((route) => ({ route, score: scoreRoute(route, request) }))
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => b.score - a.score)

  if (scored.length === 0) {
    return resolution("refused", {
      rationale: `No route matches intent "${request.intent}". AIS refuses rather than guessing a capability.`,
    })
  }

  if (scored.length > 1 && scored[0].score === scored[1].score) {
    return resolution("ambiguous", {
      rationale: `Routes ${scored[0].route.id} and ${scored[1].route.id} tie at score ${scored[0].score}. Raise a priority or narrow a match before this request can route.`,
    })
  }

  const { route } = scored[0]
  const capability = capabilityById.get(route.capabilityId)

  if (!capability) {
    return resolution("refused", {
      routeId: route.id,
      rationale: `Route ${route.id} points at capability "${route.capabilityId}", which is not in this graph.`,
    })
  }

  const policyDecisions = []
  for (const policyId of route.policyIds ?? []) {
    const policy = policyById.get(policyId)
    if (!policy) {
      return resolution("refused", {
        routeId: route.id,
        capabilityId: capability.id,
        rationale: `Route ${route.id} references policy "${policyId}", which is not in this graph. An unresolvable policy is a denial.`,
      })
    }
    policyDecisions.push({ policyId: policy.id, effect: policy.effect, statement: policy.statement })
  }

  const denial = policyDecisions.find((decision) => decision.effect === "deny")
  if (denial) {
    return resolution("refused", {
      routeId: route.id,
      capabilityId: capability.id,
      policyDecisions,
      rationale: `Policy ${denial.policyId} denies this request: ${denial.statement}`,
    })
  }

  const approval = policyDecisions.find((decision) => decision.effect === "require-approval")
  if (approval) {
    return resolution("ambiguous", {
      routeId: route.id,
      capabilityId: capability.id,
      policyDecisions,
      rationale: `Policy ${approval.policyId} requires human approval before this capability runs: ${approval.statement}`,
    })
  }

  const citation = citationFor(capability, evidenceById, owner)
  if (!citation) {
    return resolution("ambiguous", {
      routeId: route.id,
      capabilityId: capability.id,
      policyDecisions,
      rationale: `Capability ${capability.id} carries no resolvable evidence, so no citation can be attached. AIS will not present an uncited answer as resolved.`,
    })
  }

  return resolution("resolved", {
    routeId: route.id,
    capabilityId: capability.id,
    citations: [citation],
    policyDecisions,
    rationale: `Routed by ${route.id} to ${capability.id}: ${capability.description}`,
  })
}

/**
 * Derive one route per capability. A starting point a workspace can hand-edit —
 * the routes are data, not code.
 */
export function deriveRoutes(capabilities, { owner = "unassigned", policyIds = [] } = {}) {
  return capabilities.map((capability, index) => ({
    kind: "Route",
    id: `route.${capability.id}`,
    match: {
      intents: [capability.name, ...capability.verbs],
      verbs: capability.verbs,
      repositoryId: capability.repositoryId,
    },
    capabilityId: capability.id,
    priority: capabilities.length - index,
    policyIds,
    meta: meta({
      owner,
      provenance: "derived",
      visibility: "public",
      evaluation: "A request naming this intent resolves to this capability and nothing else.",
    }),
  }))
}
