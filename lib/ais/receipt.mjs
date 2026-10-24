/**
 * Receipts. A routed request that leaves no receipt cannot be evaluated later,
 * and the activation event of this layer is exactly "a request routed correctly,
 * with a citation, and we can prove it happened".
 *
 * Receipts are written under the caller's chosen directory (default
 * `.ais/receipts/`), one JSON file per resolution, sanitized on the way out.
 */

import fs from "node:fs"
import path from "node:path"

import { redactDeep } from "./sanitize.mjs"
import { validateNode } from "./schema.mjs"

export const DEFAULT_RECEIPT_DIR = ".ais/receipts"

/**
 * @param {{request: object, resolution: object, profileId: string}} entry
 * @param {{dir?: string, cwd?: string, now?: string}} [options]
 */
export function writeReceipt(entry, options = {}) {
  const dir = path.resolve(options.cwd ?? process.cwd(), options.dir ?? DEFAULT_RECEIPT_DIR)
  const now = options.now ?? new Date().toISOString()

  const resolutionCheck = validateNode(entry.resolution, "resolution")
  const requestCheck = validateNode(entry.request, "request")

  const receipt = redactDeep({
    schema: "ais.receipt.v1",
    writtenAt: now,
    profileId: entry.profileId,
    request: entry.request,
    resolution: entry.resolution,
    valid: resolutionCheck.ok && requestCheck.ok,
    validationErrors: [...requestCheck.errors, ...resolutionCheck.errors],
    // The evaluation a later reader applies to this receipt, stated up front.
    evaluation:
      "A receipt counts as an activation only when status is \"resolved\", citations is non-empty, and every citation locator still resolves.",
  })

  fs.mkdirSync(dir, { recursive: true })
  const file = path.join(dir, `${entry.resolution.id}.json`)
  fs.writeFileSync(file, `${JSON.stringify(receipt, null, 2)}\n`, "utf8")

  return { file, receipt }
}

/** Is this receipt an activation event? One rule, in one place. */
export function isActivation(receipt) {
  return Boolean(
    receipt &&
      receipt.valid === true &&
      receipt.resolution?.status === "resolved" &&
      Array.isArray(receipt.resolution?.citations) &&
      receipt.resolution.citations.length > 0,
  )
}
