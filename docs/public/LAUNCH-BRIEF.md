# H3 launch brief and acceptance harness

Updated 2026-09-09. Owner: H3Lab. Product brand: H3. Category: AI computers, software and deployment packages.

## User outcome

A visitor should recognize a company that designs and configures AI computers, understand which machine fits their work, explore the hardware visually, and prepare a concrete consultation request. The native application and repository should communicate the same brand and actual product maturity.

## Current site audit

The public home at https://h3lab.kr/ was retrieved successfully over HTTPS on 2026-09-09. The development snapshot and extracted text are stored privately under `output/h3-brand-renewal/`.

Observed positioning: locally generated video, Mac Studio M4 Max packages, character/actor packs, advance-order consultation. Contact: hi@h3lab.kr. Public source organization: https://github.com/H3Lab-kr.

Key renewal issues:

- Hardware choice is secondary to video-specific packs; no meaningful NVIDIA product ladder.
- Repeated absolutes about no cost, offline security and unlimited creation imply guarantees that local execution alone cannot establish.
- Public speed and losslessness claims lack a visible reproducible comparison contract. They will not transfer to the new site.
- The existing page describes a MiniMax regional authorization. The renewal does not revoke or independently verify this; specific authorization claims need the applicable approval document and scope before republication.
- A long sequence of similar marketing sections obscures who the products fit and the next decision to make.

## Brand and information architecture

H3 is the customer-facing brand. H3Lab is the company/development team. MiniMax H3 is an independent model publisher's product; do not imply affiliation. Brand voice: precise, confident, human, with tangible engineering detail. Avoid fabricated customers, production volumes, benchmarks, partnerships and launch availability.

Home → interactive hardware anatomy → NVIDIA lineup and comparison → software/workflows → delivery process → technical FAQ → consultation. Mac remains a distinct software/integration track, not the visual identity of every machine.

## Proposed hardware ladder

These are design/quotation proposals, not stocked or validated shipping products. Validate motherboard, CPU, PSU, cooling, PCIe topology, OS, model licenses and target workloads before a final bill of materials.

| Product | GPU basis | Proposed host RAM / storage | Intended scope |
|---|---|---|---|
| H3 Core | RTX 5060 Ti 16GB | 64GB / 2TB NVMe | Individual local AI and lighter creative work |
| H3 Studio | RTX 5090 32GB | 128GB / 4TB NVMe | Generative image and mixed creative/development workloads |
| H3 Pro | RTX PRO 6000 Blackwell Workstation 96GB ECC | 256GB ECC-capable platform / 8TB NVMe | Larger models, professional workloads and dedicated team infrastructure |

Multi-GPU options require a separate design. Per-GPU VRAM is not automatically one shared memory pool. No MiniMax H3 performance on NVIDIA hardware has been measured in this workspace. Mac unified memory is not directly interchangeable with discrete GPU VRAM.

Primary specifications: [5060 family](https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5060-family/), [5090](https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/), [RTX PRO 6000](https://www.nvidia.com/en-us/products/workstations/professional-desktop-gpus/rtx-pro-6000/). Check date: 2026-09-09. Do not copy peak TOPS into real-generation speed claims.

## Visual and implementation contract

- Procedural Three.js hardware illustration: aluminum enclosure, GPU boards, heatsinks, memory and cooling. Explain exploded assembly and show a labeled conceptual rendering.
- No scroll hijacking. Motion can be paused; reduced-motion gets a static state. WebGL failure gets a useful visual fallback.
- Product selection and consultation remain usable without 3D.
- Keyboard-accessible navigation, native dialog focus management, semantic headings, visible focus and readable contrast.
- Phone layouts at 375px and desktop layouts at 1440px; no horizontal overflow. Avoid expensive full-screen post-processing or third-party 3D assets.
- Consultation creates a local brief and opens an email draft to the existing contact address. Never show a false server-side submission success.
- No remote publication, DNS change or external message is performed by local implementation.

## Acceptance harness

1. Build/type check and locked dependencies.
2. Automated browser journeys: navigation, product comparison, configuration selection, contact brief, dialog Escape/focus and mobile menu.
3. Accessibility checks on key states, reduced-motion and explicit static fallback.
4. Desktop/mobile screenshots, visual inspection and revision.
5. Console/page error checks, local asset responses, bundle analysis and basic loading metrics. Distinguish lab checks from field Core Web Vitals.
6. Content review against structured product data and primary source links; no invented certifications or unsupported launch promises.
7. Update README, source allowlist, reproducible run instructions and release report.

The work is complete when the local app/site builds, customer-critical journeys pass, material limitations are visible in the correct context, and the output is concrete enough for the owner to review for publication.

## Signature collection and film revision

The user's next review requested a more dynamic showroom, NVIDIA plus Mac mini/Studio/Pro families, premium gold H3 badges and a 30-second brand film. Implemented a separate interactive collection with four procedural device forms, gold material badges, family-specific consultation, and three Mac package cards. The showpiece is a design concept, not an Apple product modification or a manufactured H3 enclosure claim.

Apple source checks: [Mac mini](https://www.apple.com/kr/mac-mini/specs/), [Mac Studio](https://www.apple.com/kr/mac-studio/specs/), and [Mac Pro route](https://www.apple.com/kr/mac-pro/) (redirects to the general Mac page at check time). Accordingly Mac Pro is framed as **existing Apple Silicon equipment integration**, not guaranteed new stock. Exact chip/memory options are selected against the actual machine and current regional availability.

The film is 30 seconds, 1920×1080, 24fps, with original code-rendered hardware, typography and an original synthesized score. It carries the legacy site's local AI creation idea, while excluding unsupported absolute cost/security/speed claims. Playback is user initiated, with visible controls, downloadable MP4 and Korean text captions. No customer production was reused.
