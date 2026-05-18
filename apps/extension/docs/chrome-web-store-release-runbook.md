# Sofia v1.0.0 — Chrome Web Store Release Runbook

Three tracks running in parallel. Tick each box as you go.

## Track A — Build & upload (15 min, do FIRST)

The title "Sofia BETA" + old summary are pulled from the installed
package manifest. Until you upload v1.0.0, those fields stay wrong.

- [ ] **Build the ZIP**
  ```bash
  cd /home/max/Project/sofia-core/core/apps/extension
  bash build-release.sh 1.0.0
  ```
  Output: `releases/sofia-extension-1.0.0.zip`

- [ ] **Sanity-check the manifest inside the ZIP**
  ```bash
  unzip -p releases/sofia-extension-1.0.0.zip manifest.json | grep -E '"name"|"version"|"description"'
  ```
  Expect: `"name": "Sofia"`, `"version": "1.0.0"`, new description.

- [ ] **Upload to Chrome Web Store**
  Developer Dashboard → Sofia listing → left sidebar **Package** →
  **Importer un nouveau package** → choose
  `releases/sofia-extension-1.0.0.zip`.

- [ ] **Verify the listing auto-updated**
  After upload, the page header should now show `Sofia` (not `Sofia BETA`)
  and the "Résumé issu du package" should match the new manifest
  description.

- [ ] **Fix category**
  On the listing form: Catégorie → switch from
  `Confidentialité/sécurité` to **Productivité**.

- [ ] **Verify long description is intact**
  Scroll the description block and confirm all 8 sections are present:
  Tech watch / Group momentum / Collective intelligence / Social leverage
  / One gesture / Private by design / Owned by the community / Built in public.

- [ ] **Single-purpose statement** (left sidebar **Confidentialité**)
  Paste from
  [chrome-web-store-listing.md](chrome-web-store-listing.md#single-purpose-statement-google-review):
  > Sofia lets users mark web pages with their intention (learning,
  > work, inspiration, trust…) and publishes those marks as verifiable
  > records on the Intuition blockchain, feeding a collective knowledge
  > graph the user consents to share.

- [ ] **Permission justifications** (same Confidentialité page)
  Paste each justification from
  [chrome-web-store-listing.md](chrome-web-store-listing.md#permission-justifications).
  Critical ones: `host_permissions <all_urls>`, `identity`, `tabs`.

## Track B — Screenshots (45 min, can start immediately)

UI is identical between v0.6.1 and v1.0.0, so screenshots can be
captured with whichever build is installed right now.

- [ ] **Disable any other Sofia install**
  `chrome://extensions` — only one Sofia enabled (avoid the
  double-TX bug). Memory: this bit us before.

- [ ] **Set viewport to 1280×800**
  DevTools (F12) → device toolbar (Ctrl+Shift+M) → Responsive
  → enter `1280 × 800` → close DevTools.

- [ ] **Capture #1 — MarkPage with intention**
  - Open a real long-form article (e.g. a Stratechery / Paul Graham essay).
  - Open Sofia side panel → MarkPage.
  - Hover/select the "learning" intention so the bubble is highlighted.
  - Screenshot the whole window.
  - Save as `01-mark-page.png`.

- [ ] **Capture #2 — Cart with mixed items**
  - Mark 3 pages with different intentions, add 1 Trust, ensure 1 has an
    interest-context badge.
  - Open CartDrawer.
  - Save as `02-cart-drawer.png`.

- [ ] **Capture #3 — Batch reward modal**
  - Submit the cart. Wait for `BatchRewardModal`.
  - At the peak of the Gold animation, hit screenshot.
  - Save as `03-batch-reward.png`.

- [ ] **Capture #4 — Circle Feed with vote**
  - Navigate to Circles → Feed tab.
  - Cast a like vote on a peer's triple so the vote pill is visible.
  - Save as `04-circle-feed.png`.

- [ ] **Capture #5 — Profile with Échoes**
  - Open MyProfilePage.
  - Scroll so Échoes levels + interest topics are both in view.
  - Save as `05-profile-echoes.png`.

- [ ] **(Optional) Add captions**
  Use Figma or Canva to overlay one line per screenshot:
  - #1 *One click. One intention.*
  - #2 *Batch your moves. One transaction, many signals.*
  - #3 *Earn Gold for every page you certify.*
  - #4 *See what your circle is reading right now.*
  - #5 *Your web, mapped. Owned by you.*

- [ ] **Upload to Chrome Web Store**
  Form → "Captures d'écran" → drag the 5 PNGs in order.

## Track C — Promo video (2-3h, run in parallel with B)

- [ ] **Pick a recorder**
  - Mac: QuickTime (File → New Screen Recording)
  - Windows: ShareX (https://getsharex.com)
  - Cross-platform: OBS Studio (https://obsproject.com)

  Output: 1920×1080, 60fps, MP4 H.264.

- [ ] **Prep a clean Chrome window**
  - New profile or guest mode (no bookmarks bar clutter).
  - Sofia v1.0.0 loaded, wallet already connected so no auth flow on camera.
  - One real article opened in tab 1, another in tab 2, a third in tab 3.

- [ ] **Record the 6 shots** (see
  [chrome-web-store-listing.md](chrome-web-store-listing.md#3-promo-video-youtube-3045s)
  for the storyboard table)

  Record each shot in isolation — easier to re-take a 4s segment than
  a full 45s pass.

  | Shot | Duration | What |
  |---|---|---|
  | 1 | 0:00–0:03 | Landing hero |
  | 2 | 0:03–0:10 | Mark an article |
  | 3 | 0:10–0:18 | Cart with 3 items |
  | 4 | 0:18–0:25 | Batch reward Gold animation |
  | 5 | 0:25–0:35 | Circle Feed vote |
  | 6 | 0:35–0:45 | Profile + outro card |

- [ ] **Edit**
  - DaVinci Resolve (free) or CapCut (free) — both do hard cuts + text overlays
  - No need for transitions; jump cuts read as "fast" not "rushed"
  - Mute the audio track (Chrome autoplays muted anyway)

- [ ] **Outro card (still frame, 5s on shot 6)**
  Text:
  ```
  Install Sofia
  Free · Open source · Private by design
  sofia.intuition.box
  ```

- [ ] **Export**
  - 1920×1080, MP4 H.264, ~10-20 MB target

- [ ] **Upload to YouTube**
  1. https://studio.youtube.com → **Créer** → **Mettre en ligne**
  2. Title: `Sofia — Mark the web, build collective intelligence`
  3. Description (paste):
     ```
     Sofia turns the pages you read into signals you control.
     One click, one intention — and the web becomes a map.

     Free, open source, private by design.

     Install: https://chromewebstore.google.com/detail/sofia/[ID]
     Landing: https://sofia.intuition.box
     Docs: https://doc.sofia.intuition.box
     GitHub: https://github.com/intuition-box/Sofia
     ```
  4. Visibility: **Non répertoriée** (Unlisted)
  5. Audience: "Non, ce n'est pas conçu pour les enfants"
  6. Language: English

- [ ] **Paste YouTube URL into Chrome Web Store form**
  Field: "Vidéo promotionnelle internationale" → paste
  `https://www.youtube.com/watch?v=XXXXXXXXXXX`

## Track D — Submit for review (10 min, do LAST)

- [ ] **Promo tiles** (optional but recommended)
  - Small promo tile 440×280 — Sofia icon + "From surfing the web to owning it." on peach background
  - Marquee 1400×560 — same tagline + 4 angle badges
  - Both designed in Figma/Canva, exported PNG

- [ ] **Final form review**
  Walk every section in the left sidebar:
  - Package → v1.0.0 uploaded
  - Fiche Play Store → title, summary, description, category, language, screenshots, video, icon
  - Confidentialité → single-purpose, permissions, data usage
  - Distribution → countries, pricing (free)

- [ ] **Enregistrer le brouillon** (save draft)

- [ ] **Envoyer pour examen** (submit for review)

  Google review takes 1-3 business days for an update. Expect questions
  on the `<all_urls>` host permission — the justification doc already
  answers it.

## Quick command reference

```bash
# Build
cd /home/max/Project/sofia-core/core/apps/extension
bash build-release.sh 1.0.0

# Inspect ZIP manifest
unzip -p releases/sofia-extension-1.0.0.zip manifest.json

# Load unpacked for screenshots/recording
# chrome://extensions → Load unpacked → build/chrome-mv3-prod
```
