# Privacy Policy

**Effective date:** 2026-04-20
**Applies to:** Clearly Desktop (the "App")

Clearly Desktop is a local-first markdown editor. We designed it so your
writing stays on your own computer. This policy explains the limited
circumstances in which the App contacts the internet and what that means
for your privacy.

## 1. Data we collect

**None.** We do not operate servers, we do not require an account, and we
do not run analytics or telemetry inside the App.

Your documents, workspace settings, and editor preferences are stored
only on your local device.

## 2. Network requests the App makes

The App makes a small number of outbound requests during normal use.
These are standard HTTP requests; no personal identifiers are attached.

### 2.1 Update check

Builds installed from our **GitHub Releases** page check for updates by
fetching:

```
https://github.com/anvel-ai/clearly/releases/latest/download/latest.json
```

This request is handled by GitHub. GitHub may log the request (including
your IP address and User-Agent) as described in the
[GitHub Privacy Statement](https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement).
We do not receive or store this log.

If a newer signed release is available, the App downloads the update
package and its signature from the same GitHub release URL.

Builds installed from the **Microsoft Store** do not make this request.
Updates for Store installs are delivered by the Microsoft Store itself,
governed by Microsoft's privacy practices, not ours.

### 2.2 Rendering assets

For math rendering, the App loads the KaTeX stylesheet from the public
jsDelivr CDN:

```
https://cdn.jsdelivr.net/npm/katex@0.16/dist/katex.min.css
```

jsDelivr may log the request as described in their
[privacy policy](https://www.jsdelivr.com/terms/privacy-policy-jsdelivr-net).
We do not receive or store this log.

No other external services are contacted by the App.

## 3. Data you open in the App

Files you create, open, or save remain on your device. We never transmit
document contents anywhere.

If you explicitly export or copy content out of the App (for example,
pasting into another application), that action is governed by the
destination application, not by us.

## 4. Children's privacy

The App is a general-purpose writing tool and is not directed at
children. Because we collect no personal data, the App does not knowingly
process data from children under 13.

## 5. Changes to this policy

If we change this policy, we will update the **Effective date** above and
publish the revised version at the same URL where you are reading this
document. Material changes will also be noted in the App's release notes.

## 6. Contact

Questions about this policy can be sent to:

**taehuikim9307@gmail.com**

Or opened as an issue at:
https://github.com/anvel-ai/clearly/issues
