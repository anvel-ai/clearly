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
  "notes": "Mermaid 렌더링 개선, 새 기능 등",
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
Clicking "지금 설치" downloads the `.tar.gz`, verifies the signature with the embedded public key, swaps the app, and relaunches.

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
