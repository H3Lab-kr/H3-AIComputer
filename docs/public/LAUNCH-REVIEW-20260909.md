# H3 brand launch implementation review

Date: 2026-09-09. Status: **local review build completed; live domain not changed**.

## Implemented

- H3 business positioning: purpose-built AI computers, with hardware, models and workflows presented together.
- NVIDIA Core / Studio / Pro proposals and official GPU specifications; Mac mini / Studio AI environment packages, plus existing Apple Silicon Mac Pro integration.
- Procedural WebGL hardware, exploded enclosure, rotatable family showcase, premium gold H3 badges and size-specific product forms. Geometry and badges are concepts, not product photographs or confirmed manufacturing specifications.
- Local consultation composer: selected product, work purpose, team size and notes → text download/copy or mail-client draft. No false CRM submission confirmation.
- 30-second Full HD brand film, original 3D/typography and synthesized music, poster, Korean screen-text captions, visible playback/download. User initiated playback, no automatic audio.
- Native H3 Mac Preview 0.3 branding and creation-focused UI, consolidated setup guide, bilingual README and curated source distribution.

## Verification

Production Vite build and TypeScript check completed. Playwright Chromium checks passed **6/6**:

1. Desktop hardware controls, comparison, consultation file and focus restoration.
2. Mobile navigation, reduced motion and explicit static view.
3. Main page and consultation automated WCAG 2 A/AA + 2.1 AA rules.
4. Each Mac family maps to the matching consultation, with three Mac package cards and accessibility checks.
5. 320px phone layout and unavailable-WebGL fallback remain usable.
6. Actual browser video playback, 1920×1080 metadata and exact 30-second duration.

The screenshot harness recorded no page/request failures and no external requests. Fonts and hardware assets are local. Captures cover desktop, mobile, exploded hardware, each family, consultation and Mac package cards. Local resource measurements are not field Core Web Vitals or device FPS measurements. A minified 3D chunk remains above Vite's 500KB warning threshold; it is lazy loaded, with a lightweight fallback, rather than suppressing the warning.

Formatting check passed. Toolkit offline tests **4/4**, local HTTP client tests and native media runner checks passed. Downloaded MLX models also completed a separately scoped execution screen: [model screen](MODEL-SCREEN-20260909.md).

Film technical checks: H.264, 1920×1080, 24fps, 720 frames, 30.000s, AAC stereo 48kHz; approximately 5.92MB. Entire file decoded without errors. Measured integrated audio -17.9 LUFS, true peak -3.3dBFS. Seven time samples at 2/7/12/16/20/24/28 seconds were visually inspected. Full perceptual viewing/listening and owner approval are not claimed by decode or audio metrics.

## Iteration findings

- Initial muted text failed contrast checks; foreground colors were darkened while retaining the palette.
- Closing the dialog initially lost the invoking control; explicit restoration now passes.
- Multiple 3D scenes made loose test selectors ambiguous; tests now scope actual controls precisely.
- WebGL creation can fail before a useful renderer view; a capability probe and fallback keep the customer path working.
- Large mobile full-page screenshots exceeded the capture path in one run. The harness now records mobile viewport/section captures; this is a capture limitation, not a fabricated successful screenshot.
- Static product cards initially looked like flat plates. Their final images are rendered from the same 3D geometry used by the interactive showcase and film.
- Mini/Studio initially looked too small. The final showroom uses family-specific scale and vertical positioning, with a separate motion pause.

## Publication boundary

The static output is `apps/web/dist`; the native local bundle is `dist/H3.app`. Deployment, DNS, purchase intake, hardware sourcing, final BOM, support terms and NVIDIA runtime qualification are not executed by this build. The Mac app remains ad-hoc signed and requires prepared runtimes/models. Final source licensing and signed public distribution remain owner release decisions.

Source exports use an explicit allowlist and a separate size/hash record for the public brand MP4. Customer productions, weights, engines, private logs, credentials and old Git history remain excluded. The scan is heuristic and not a universal privacy certification.

## AI 컴퓨터 / Robotics Lab refinement

- Strengthened homepage title, navigation, hero and metadata around H3 AI 컴퓨터.
- Added a procedural robot arm, product, camera and gold-badged H3 workstation with an interactive approval/pause/reset workflow.
- Separated software outputs from the device-controller branch; explicitly labeled the entire demonstration as a simulation with no connected devices.
- Retained Mac Preview as the current implementation and device integrations as the roadmap. No live robot control, automatic camera capture or AI-generated output is claimed for this demonstration.
- Production build and seven browser checks cover the existing showcase, video, fallback/mobile behavior and the new simulation workflow. Visual review corrected an elbow trajectory that initially crossed below the tabletop.
- This is a local website revision; the live domain has not been deployed.
