# Release & Update Guide

Clearly uses the [Tauri Updater plugin](https://tauri.app/plugin/updater/) for in-app automatic updates.
This document covers how to cut a new release so existing users get the update prompt.

## One-time setup (already done)

- Signing keypair generated at `~/.tauri/clearly.key` (private) and `~/.tauri/clearly.key.pub` (public).
- Public key embedded in `src-tauri/tauri.conf.json` under `plugins.updater.pubkey`.
- Updater endpoint points to:
  `https://github.com/anvel-ai/clearly/releases/latest/download/latest.json`

**Keep `~/.tauri/clearly.key` safe.** Losing it means you cannot ship updates that existing installs will accept.

## Release steps

### 1. Bump the version

Update the version in all three files to the same value (next bump: `0.0.4` → `0.1.0`):

- `package.json` — `"version": "0.1.0"`
- `src-tauri/Cargo.toml` — `version = "0.1.0"`
- `src-tauri/tauri.conf.json` — `"version": "0.1.0"`

### 2. Build signed artifacts

```bash
export TAURI_SIGNING_PRIVATE_KEY_PATH="$HOME/.tauri/clearly.key"
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD=""
npm run tauri build
```

This produces:

- `src-tauri/target/release/bundle/macos/Clearly.app.tar.gz` — update payload
- `src-tauri/target/release/bundle/macos/Clearly.app.tar.gz.sig` — signature
- `src-tauri/target/release/bundle/dmg/Clearly_<version>_aarch64.dmg` — fresh install

### 3. Create `latest.json`

Create a file named `latest.json` with this shape:

```json
{
  "version": "0.1.0",
  "notes": "Mermaid rendering improvements, new features, etc.",
  "pub_date": "2026-04-20T10:00:00Z",
  "platforms": {
    "darwin-aarch64": {
      "signature": "<paste contents of Clearly.app.tar.gz.sig>",
      "url": "https://github.com/anvel-ai/clearly/releases/download/v0.1.0/Clearly.app.tar.gz"
    }
  }
}
```

Get the signature with:

```bash
cat src-tauri/target/release/bundle/macos/Clearly.app.tar.gz.sig
```

### 4. Publish the GitHub Release

1. Tag: `v0.1.0`
2. Upload these files as release assets:
   - `Clearly.app.tar.gz`
   - `Clearly.app.tar.gz.sig`
   - `Clearly_0.1.0_aarch64.dmg` (for first-time installs)
   - `latest.json`
3. Mark as **Latest release** (so `/releases/latest/download/latest.json` resolves).

### 5. Verify

Launch an older installed version — within a few seconds the update banner should appear.
Clicking "Install now" downloads the `.tar.gz`, verifies the signature with the embedded public key, swaps the app, and relaunches.

## Adding platforms

The `platforms` map in `latest.json` keys by `{os}-{arch}`:

- `darwin-aarch64` — Apple Silicon macOS
- `darwin-x86_64` — Intel macOS
- `windows-x86_64` — Windows 64-bit
- `linux-x86_64` — Linux 64-bit

Each platform needs its own signed `.tar.gz` + `.sig` pair built on that target (cross-compile or build in CI).

## Troubleshooting

- **Update not detected** — confirm `latest.json` is reachable at the endpoint URL and `version` is strictly greater than the installed version.
- **Signature verification failed** — the `.sig` contents must match the exact `.tar.gz` uploaded. Rebuild if unsure.
- **"Not supported on this Mac"** — architecture mismatch; rebuild for the target arch and update the matching platform entry.

## Microsoft Store (MSIX app)

Clearly is submitted to the Microsoft Store as an **MSIX app**. The
Store signs uploaded MSIX packages with its own trusted certificate on
ingestion, so we do not need — and do not purchase — a separate
Authenticode code signing certificate. GitHub Releases distribution
continues to ship an unsigned NSIS `.exe`; SmartScreen warnings on
that path are accepted.

The Store version of the app must **not** self-update: MSIX updates are
delivered through the Microsoft Store, not through our Tauri updater.
See "Build variants" below.

### Prerequisites (one-time)

- **Partner Center account** — registered under the "Windows" program
  ($19 individual, one-time).
- **Product reserved** — Store display name: `Clearly Desktop`.
  Internal `productName`, identifier, and window title remain `Clearly`.
- **Publisher identity** — issued by Partner Center once the product
  is reserved. Takes the form `CN=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX`
  and must match the `Publisher` attribute inside the MSIX's
  `AppxManifest.xml`.
- **Privacy policy URL** — [PRIVACY.md](PRIVACY.md), served via the
  GitHub blob URL:
  `https://github.com/anvel-ai/clearly/blob/main/PRIVACY.md`

### Store listing fields

| Field | Value |
|---|---|
| Display name | Clearly Desktop |
| Primary category | Productivity |
| Secondary category | Developer tools |
| Price | Free |
| Devices | Windows 10/11 Desktop (x64) |
| Package type | MSIX |
| Privacy policy URL | (blob URL above) |

Required assets — stored under `docs/store/windows/` when produced:

- Store logo 300×300 PNG
- At least one screenshot, 1366×768 or larger, PNG
- Short description (≤200 chars)
- Long description (≤10,000 chars)

### Producing the MSIX

Tauri v2 does not emit MSIX natively. Two supported paths:

1. **MSIX Packaging Tool** (recommended for first submission) — a free
   Microsoft-provided GUI. Feed it the `Clearly_<version>_x64-setup.exe`
   produced by the existing NSIS build, walk through the conversion, and
   it outputs a `.msix` with a generated `AppxManifest.xml` ready to
   edit. Set `Publisher` to the Partner Center identity above and
   `Identity/Name` to the Store product's package identity (shown under
   "Product identity" in Partner Center).
2. **`makeappx.exe` + `signtool.exe`** (for CI automation later) — from
   the Windows SDK. Script the same conversion and run as a separate
   matrix job triggered from `v*` tags.

Either way, do not self-sign the MSIX for Store upload; upload the
unsigned `.msix` and let the Store sign it.

### Build variants

For the Store submission, build Clearly with the updater disabled so it
does not race with the Store's update delivery. The cleanest approach:

- Gate the updater check in the frontend on a build-time flag (e.g.
  `import.meta.env.VITE_STORE_BUILD`) and produce the Store build with
  that flag set.
- Optional stricter approach: remove the `updater` plugin from
  `src-tauri/tauri.conf.json` in the Store build by using a separate
  `tauri.store.conf.json` loaded with `--config`.

### Submission flow

1. Cut a GitHub release as usual (tag `vX.Y.Z`). The `windows-latest`
   matrix job produces `Clearly_<version>_x64-setup.exe`.
2. Locally, run the Store build (updater disabled) and convert to MSIX
   via MSIX Packaging Tool. Output: `ClearlyDesktop_<version>_x64.msix`.
3. In Partner Center → Clearly Desktop → **Packages** → upload the
   `.msix`. Target devices: Windows 10 version 1809 or later, x64.
4. Fill / update Store listing fields if anything changed.
5. Submit for certification. First-time review typically takes 1–3
   business days; subsequent version updates are usually faster.

### Known gotchas

- The `Publisher` in `AppxManifest.xml` must **exactly** match the
  Partner Center publisher identity (case-sensitive). Any mismatch
  fails certification with a signature-mismatch error.
- The Store display name (`Clearly Desktop`) is **different** from the
  internal product name (`Clearly`). Do not change
  [src-tauri/tauri.conf.json](src-tauri/tauri.conf.json) `productName`
  to match — users expect the shortcut and window title to stay
  "Clearly".
- An MSIX that still calls the Tauri updater endpoint can pass
  certification but fails policy review on the grounds of "app
  installs updates from outside the Store." Always build the Store
  variant with updater disabled.
- Age rating must be completed via the in-dashboard IARC questionnaire
  before the first submission can be certified.
