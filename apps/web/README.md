# H3 · AI Computers website

A Korean/English product and consultation site for H3Lab's **H3 AI computer** business. React + TypeScript + Three.js / React Three Fiber. The navy/blue identity, Paperozi typography and gold signature badges connect a detailed hardware showcase with the vision of an AI computer for creation, assistance and connected devices. Hardware geometry is procedural; Paperozi loads on demand from the owner-supplied jsDelivr URLs.

```sh
cd apps/web
npm ci
npm run dev             # http://127.0.0.1:5173
npm run build           # dist/ — deploy this folder to a static host
npm run preview -- --port 4173
```

Use Node 22.12+ (tested with Node 24). `/?view=static` uses the lightweight illustrated hardware view. Reduced-motion preferences disable automatic animation. The scene pauses when the hero is outside the viewport or the tab is hidden. WebGL creation failure falls back to the illustration. Paperozi font files load from jsDelivr as needed. No analytics, model downloads or generation API calls run on page load.

## Verify changes

```sh
npx playwright install chromium
npm test
# With a local dev/preview server running:
node scripts/capture.mjs http://127.0.0.1:4173 ../../output/h3-web-review
```

The latest ten Playwright checks cover product comparison, hardware controls, mobile navigation, consultation focus, download, mailto construction, fallback, language switching and persistence, localized film playback, robotics interactions and automated WCAG checks. Automated accessibility checks are not a certification; inspect screenshots, actual touch behavior and assistive technology before release. Software-rendered browser screenshots are not physical GPU performance measurements.

## Content and launch boundaries

- `src/products.ts`: product proposals, official GPU links, FAQ. CPU/RAM/storage and software integrations require SKU validation.
- `src/App.tsx`: page copy, customer journey, local consultation composer.
- `src/HardwareScene.tsx`: procedural concept case, GPU, cooling and explosion animation. This is not a manufactured product photograph or CAD specification.
- Consultation builds an email draft for `hi@h3lab.kr`, or downloads/copies the brief. It does not submit to a CRM and never displays a false confirmation.
- `public/brand`: H3 artwork, rendered product stills and social sharing card. `src/fonts.css`: the Paperozi CDN declarations. Font rights remain separate from H3 branding.
- `src/i18n.ts` and `src/en.json`: language selection and reviewed English copy.
- `public/media`: Korean/English films, posters and captions.
- Mac Preview exists; the NVIDIA packaged runtime and hardware catalog remain proposals. No prices, inventory, benchmark claims, partnership or warranty promises are fabricated.

Business criteria: [launch brief](../../docs/public/LAUNCH-BRIEF.md). Hardware/software validation plan: [NVIDIA packages](../../docs/public/NVIDIA-PACKAGES.md).

Publishing is a separate operation. Before changing h3lab.kr, review the built preview, confirm contact details and actual offering, retain the current site for rollback, then configure the hosting target. This work does not alter the live domain.

## Brand film source

`?film=1` opens the deterministic 3D film composition used by `scripts/render-film.mjs`. Render with a prepared FFmpeg executable:

```sh
FFMPEG=ffmpeg node scripts/render-film.mjs http://127.0.0.1:4173 ../../output/new-h3-film
python3 scripts/compose-score.py ../../output/new-h3-film/score.wav
```

The renderer refuses to overwrite an existing picture. The included Korean and English 30-second MP4s contain AI-generated narration, original music and separate caption tracks and have passed complete decoding checks; the original score contains no sampled music. After intentional re-rendering, verify the final media and update the public asset fingerprint. Mac package artwork and badges are concepts; they are not Apple product photos or a partnership mark.

For production-build checks, start `npm run preview -- --port 4174`, then run `H3_WEB_TEST_URL=http://127.0.0.1:4174 npm test`.

`node scripts/render-products.mjs http://127.0.0.1:4173 public/brand` refreshes the four transparent product stills from the same procedural geometry. Review changes before replacing the public assets.

## AI computer and robotics story

The homepage now leads with **H3 AI 컴퓨터** and connects its vision to two branches: software creation and device controllers. The interactive Robotics Lab is a browser-only simulation, not a connected robot or a generated-content service. Visitors start a request, approve the simulated execution, pause/resume, and reset the sequence. Actual device integration remains a future validation target; local controllers retain motion and safety responsibilities.

The procedural Three.js arm moves a product toward a camera. Offscreen/hidden views pause the sequence; reduced-motion and unavailable-WebGL modes retain the workflow without continuous 3D movement. Existing hardware showcases and the 30-second brand film remain available.

## Blue identity and languages

The site uses Paperozi (100–900, the owner-supplied jsDelivr URLs), blue/cool neutrals and gold H3 badges. `?lang=ko` and `?lang=en` are directly shareable; the header switch also remembers the selection. A reload switches the reviewed dictionary and matching 30-second narrated film, poster and captions. Consultation drafts are not preserved across that reload. No translation API runs in the visitor's browser.

The NVIDIA model includes cooling tubes, board components, cables and a more detailed enclosure. The Mac models use bright silver materials and reference-informed proportions. See [design and media notes](../../docs/public/BLUE-BILINGUAL-20260909.md).

Render a language explicitly, or replace a targeted frame interval:

```sh
FFMPEG=ffmpeg node scripts/render-film.mjs http://127.0.0.1:4173 ../../output/new-film-en en
FFMPEG=ffmpeg node scripts/render-film.mjs http://127.0.0.1:4173 ../../output/new-film-detail ko 432 528
```

The renderer produces the picture only. Mix the separately recorded, reviewed narration with the score before replacing public assets and updating their fingerprints.

---

<p align="center"><sub>“AI 컴퓨터” (AI Computer) was jointly branded and initiated by 정락현, 문아라 and 이강훈 on 2026-09-08.<br>© 2026 정락현 · 문아라 · 이강훈 — AI 컴퓨터 brand concept and branding.</sub></p>
