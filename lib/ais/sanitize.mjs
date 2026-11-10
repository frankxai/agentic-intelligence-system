/**
 * The sanitizer that stands between a private working tree and a public
 * discovery artifact.
 *
 * Two rules, in this order:
 *   1. Denylisted files are never opened. Not read, not hashed, not summarized.
 *      Their existence may be reported; their content may not.
 *   2. Anything that does get through is redacted for secret-shaped strings and
 *      operator-identifying paths before it can reach a profile.
 *
 * Failing open here would publish a key, so every unknown case fails closed.
 */

/** Files whose content must never enter a profile, matched on basename. */
const DENY_FILE_PATTERNS = [
  /^\.env(\..*)?$/i,
  /^\.envrc$/i,
  /^\.npmrc$/i,
  /^\.netrc$/i,
  /^\.pypirc$/i,
  /^\.git-credentials$/i,
  /^id_(rsa|dsa|ecdsa|ed25519)(\.pub)?$/i,
  /^known_hosts$/i,
  /^credentials(\.json|\.yaml|\.yml)?$/i,
  /^secrets?(\..*)?$/i,
  /^service-account.*\.json$/i,
  /^.*\.(pem|key|pfx|p12|keystore|jks|ppk)$/i,
  /^.*\.local\.(json|ya?ml|toml)$/i,
  /^wallet\..*$/i,
  /^cwallet\.sso$/i,
  /^tnsnames\.ora$/i,
]

/** Directories that are never descended into. */
const DENY_DIR_NAMES = new Set([
  ".git",
  ".ssh",
  ".gnupg",
  ".aws",
  ".azure",
  ".vercel",
  ".env",
  "node_modules",
  "dist",
  "build",
  ".next",
  "coverage",
  ".turbo",
  "__pycache__",
  ".venv",
  "venv",
  "secrets",
  "private",
])

/** Secret-shaped strings, redacted wherever they appear in surviving text. */
const SECRET_PATTERNS = [
  [/\b(sk|pk|rk)-[A-Za-z0-9_-]{16,}\b/g, "[redacted:api-key]"],
  [/\bgh[pousr]_[A-Za-z0-9]{20,}\b/g, "[redacted:github-token]"],
  [/\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g, "[redacted:slack-token]"],
  [/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, "[redacted:jwt]"],
  [/\bAKIA[0-9A-Z]{16}\b/g, "[redacted:aws-key-id]"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, "[redacted:private-key]"],
  [/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, "[redacted:email]"],
  [/\b[A-Za-z_][A-Za-z0-9_]*(?:TOKEN|SECRET|PASSWORD|APIKEY|API_KEY|PRIVATE_KEY)\s*[:=]\s*\S+/g, "[redacted:assignment]"],
]

/** Operator-identifying absolute paths. */
const PATH_PATTERNS = [
  [/[A-Za-z]:[\\/]Users[\\/][^\\/\s"']+/g, "[redacted:home]"],
  [/\/(?:home|Users)\/[^/\s"']+/g, "[redacted:home]"],
  [/\\\\[^\\\s"']+\\[^\\\s"']+/g, "[redacted:unc-path]"],
]

/** True when this file's content must never be read into a profile. */
export function isDeniedFile(basename) {
  return DENY_FILE_PATTERNS.some((pattern) => pattern.test(basename))
}

/**
 * True when this directory must not be descended into. Every dot-directory is
 * denied by default: they hold credentials far more often than documentation,
 * and a discovery layer that guesses wrong once has published a secret.
 */
export function isDeniedDirectory(basename) {
  return basename.startsWith(".") || DENY_DIR_NAMES.has(basename)
}

/**
 * Redact secret-shaped and operator-identifying strings from text that has
 * already passed the file denylist.
 *
 * @returns {{text: string, redactions: string[]}}
 */
export function redact(text) {
  if (typeof text !== "string") return { text: "", redactions: [] }

  const redactions = []
  let output = text

  for (const [pattern, replacement] of [...SECRET_PATTERNS, ...PATH_PATTERNS]) {
    output = output.replace(pattern, () => {
      if (!redactions.includes(replacement)) redactions.push(replacement)
      return replacement
    })
  }

  return { text: output, redactions }
}

/**
 * Recursively redact every string in a structure. Used on anything about to be
 * written to a public artifact — one pass at the boundary, not scattered through
 * the scanner.
 */
export function redactDeep(value, redactions = []) {
  if (typeof value === "string") {
    const result = redact(value)
    for (const entry of result.redactions) if (!redactions.includes(entry)) redactions.push(entry)
    return result.text
  }
  if (Array.isArray(value)) return value.map((entry) => redactDeep(entry, redactions))
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, redactDeep(entry, redactions)]))
  }
  return value
}

export const DENYLIST = {
  files: DENY_FILE_PATTERNS.map(String),
  directories: [...DENY_DIR_NAMES],
  redactionClasses: [...SECRET_PATTERNS, ...PATH_PATTERNS].map(([, replacement]) => replacement),
}
