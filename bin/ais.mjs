#!/usr/bin/env node
/**
 * The AIS.v1 workflow in one command, with no install:
 *
 *   node bin/ais.mjs scan <repoPath>
 *   node bin/ais.mjs route <repoPath> --intent "run the tests" [--verbs test,run]
 *   node bin/ais.mjs drift <repoPath> [--registry <path>]
 *
 * `route` runs the whole vertical slice: scan → sanitized profile → derived
 * routes → resolution with citation → receipt under .ais/receipts/.
 */

import path from "node:path"
import process from "node:process"

import { checkDrift, loadRegistryRecords, resolveRegistryPath } from "../lib/ais/drift.mjs"
import { isActivation, writeReceipt } from "../lib/ais/receipt.mjs"
import { deriveRoutes, resolve as resolveRequest } from "../lib/ais/route.mjs"
import { meta, validateGraph } from "../lib/ais/schema.mjs"
import { scan } from "../lib/ais/scan.mjs"

const argv = process.argv.slice(2)
const command = argv[0]
const positional = argv.slice(1).filter((argument) => !argument.startsWith("--"))

function flag(name) {
  const index = argv.indexOf(`--${name}`)
  return index === -1 ? undefined : argv[index + 1]
}

const asJson = argv.includes("--json")
const repoPath = positional[0] ?? process.cwd()
const owner = flag("owner") ?? "unassigned"

function out(value) {
  process.stdout.write(`${asJson ? JSON.stringify(value, null, 2) : format(value)}\n`)
}

function format(value) {
  if (typeof value === "string") return value
  return JSON.stringify(value, null, 2)
}

function usage(message) {
  process.stderr.write(`${message}\n\nusage:\n  node bin/ais.mjs scan <repoPath>\n  node bin/ais.mjs route <repoPath> --intent "..." [--verbs a,b] [--requester name]\n  node bin/ais.mjs drift <repoPath> [--registry <path>]\n`)
  process.exit(2)
}

if (!command) usage("no command given")

if (command === "scan") {
  const result = scan(repoPath, { owner })
  const graph = validateGraph([result.profile, ...result.capabilities, ...result.evidence])

  if (asJson) {
    out({ ...result, valid: graph.ok, errors: graph.errors })
  } else {
    out(
      `${result.profile.name} (${result.profile.id})\n` +
        `  languages       ${result.profile.languages.join(", ") || "none detected"}\n` +
        `  capabilities    ${result.capabilities.length}\n` +
        `  evidence        ${result.evidence.length}\n` +
        `  files scanned   ${result.scannedFileCount}\n` +
        `  files withheld  ${result.deniedFileCount} (denylisted, never opened)\n` +
        `  redactions      ${result.profile.redactions.join("; ") || "none"}\n` +
        `  graph valid     ${graph.ok}`,
    )
  }
  process.exit(graph.ok ? 0 : 1)
}

if (command === "route") {
  const intent = flag("intent")
  if (!intent) usage("route requires --intent")

  const verbs = (flag("verbs") ?? "").split(",").map((verb) => verb.trim()).filter(Boolean)
  const requester = flag("requester") ?? "cli"
  const now = new Date().toISOString()

  const { profile, capabilities, evidence } = scan(repoPath, { owner })
  const routes = deriveRoutes(capabilities, { owner })

  const request = {
    kind: "AgentRequest",
    id: `req.${Date.now()}`,
    intent,
    verbs,
    repositoryId: profile.id,
    requester,
    receivedAt: now,
    meta: meta({
      owner,
      provenance: "authored",
      visibility: "internal",
      evaluation: "The intent is the caller's own words, unmodified.",
    }),
  }

  const resolution = resolveRequest(request, { routes, capabilities, policies: [], evidence, now, owner })
  const { file, receipt } = writeReceipt(
    { request, resolution, profileId: profile.id },
    { cwd: path.resolve(repoPath) },
  )

  if (asJson) {
    out({ request, resolution, receipt: file, isActivation: isActivation(receipt) })
  } else {
    out(
      `${resolution.status.toUpperCase()}  ${resolution.capabilityId ?? "-"}\n` +
        `  ${resolution.rationale}\n` +
        (resolution.citations[0]
          ? `  citation      ${resolution.citations[0].locator} — "${resolution.citations[0].quote}"\n`
          : "") +
        `  receipt       ${file}\n` +
        `  activation    ${isActivation(receipt)}`,
    )
  }
  process.exit(resolution.status === "resolved" ? 0 : 1)
}

if (command === "drift") {
  const { capabilities } = scan(repoPath, { owner })
  const registryPath = resolveRegistryPath({ explicit: flag("registry") })
  const report = checkDrift(capabilities, loadRegistryRecords(registryPath), {})

  if (asJson) {
    out({ ...report, registryPath })
  } else {
    out(
      `registry drift: ${report.status}\n` +
        (report.reason ? `  ${report.reason}\n` : "") +
        report.findings.map((finding) => `  ${finding.code.padEnd(22)} ${finding.capabilityId}\n      ${finding.detail}`).join("\n"),
    )
  }
  process.exit(report.status === "drifted" ? 1 : 0)
}

usage(`unknown command: ${command}`)
