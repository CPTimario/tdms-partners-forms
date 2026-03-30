# Privacy

This document explains how the app handles user data and what is sent to the server.

User-facing summary
--------------------
- Most operations (form editing, preview, PDF generation) are performed entirely in the user's browser and do not send data to the server.
- When you create a shareable link or QR code, the app sends a minimal set of fields to the server to generate an encrypted token. The fields are:
  - `missionaryName` (or team name)
  - `nation`
  - `travelDate`
  - `sendingChurch`

- The server returns an encrypted `token` that is embedded in the shareable URL (e.g. `?recipient=<token>`). The token payload is encrypted and authenticated and is only used for restoring those form fields when the recipient opens the link.

Developer notes
---------------
- The server-side encryption uses the `DEEPLINK_KEY` environment variable. The `dev` and `start` scripts run a pre-start check and will exit if `DEEPLINK_KEY` is not set (see `scripts/check-deeplink-key.js`).
- Tokens are opaque to clients and only decrypted by the app's `GET /api/deeplink` endpoint (`app/api/deeplink/route.ts`). The crypto helpers are implemented in `lib/deeplink-crypto.ts`.
- The repo includes a user-facing disclaimer modal that is shown on first visit and persisted in `localStorage` under `disclaimer_dismissed`. See `components/GlobalPrivacy/PrivacyWidget.tsx` and `components/ui/DisclaimerModal.tsx` for implementation details.

Recommendations
---------------
- Do not send additional personal data to `/api/deeplink`. Keep payloads minimal to reduce privacy exposure.
- If you need token expiry, add `iat`/`exp` claims to the token payload and validate on decrypt.
- Treat `DEEPLINK_KEY` as sensitive; rotate and store it in secrets management (CI repo secrets, cloud secret manager).
