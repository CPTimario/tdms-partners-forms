#!/usr/bin/env node
// Load .env.local when present so local dev env vars (e.g., DEEPLINK_KEY) are available.
try {
  // prefer dotenv if available (devDependency)
  // eslint-disable-next-line global-require, import/no-extraneous-dependencies
  require("dotenv").config({ path: require("path").resolve(process.cwd(), ".env.local") });
} catch (err) {
  // ignore if dotenv isn't installed — the check will still read process.env
}

// Exit non-zero if DEEPLINK_KEY is not set. Intended to be used as a pre-start/dev check.
const key = process.env.DEEPLINK_KEY;
if (!key) {
  // eslint-disable-next-line no-console
  console.error('\nERROR: DEEPLINK_KEY is not set.\n\nThis project requires DEEPLINK_KEY to be configured as a secret environment variable so server-side deeplink tokens can be encrypted/decrypted.\n\nSet DEEPLINK_KEY in your environment or CI secrets and retry.\n');
  process.exit(1);
}
// else ok
process.exit(0);
