# H3 hardware visualization review — 2026-09-09

Scope: the website's interactive NVIDIA tower, exploded view, showroom model and NVIDIA product still. This is a procedural product concept, not a verified mechanical CAD assembly, thermal simulation or a final bill of materials. Existing encoded brand films are separate artifacts.

## Findings and changes

| Finding in the previous scene | Change |
|---|---|
| Body dimensions in scene units were 2.7 wide × 3.6 high × 2.5 deep, making a broad, shallow box | New shell is about 1.96 wide × 3.6 high × 3.5 deep, with independent geometry dimensions rather than stretching the entire scene |
| GPU length ran across chassis width; two cards were shown for all packages | One generic card runs front-to-back, with rear bracket, ports, PCIe contact edge, backplate, fins and downward-facing fans |
| Fan rings, rotor blades and hubs used inconsistent axes | All rotors share a Y axle and XZ plane; the entire assembly rotates for front/rear mounting. Curved seven-blade geometry replaces rectangular paddles |
| CPU tower fins and liquid-cooling tubes were combined | A compact CPU cold plate/pump connects to the top two-fan radiator; DIMMs and VRM are separate components |
| Bottom power supply and loose decorative cables lacked a defined bay | PSU shroud and separate lower bay, bundled power route, motherboard M.2 spreaders and rear I/O details |
| Thick trim, oversized badge and simple translucent side sheet | Slim frame, finer front ribs, smaller gold badge, panel fasteners, restrained material roughness and local studio reflections |

The top panel, side panel, front fascia and GPU retain independent exploded transforms. Animation pause, reduced-motion behavior, drag controls and narrow-screen spreading remain in place. The visual opening sequence is illustrative, not a servicing procedure: it does not simulate cable disconnection, connector insertion forces or collision-safe removal paths.

## Physical references

- [Fractal North XL product sheet](https://www.fractal-design.com/app/uploads/2024/02/North-XL_Product-Sheet_EN.pdf): 503 × 240 × 509 mm (L×W×H), used to compare tower proportions; H3 is not presented as this case.
- [ASUS ProArt B760-Creator D4](https://www.asus.com/eg-en/motherboards-components/motherboards/proart/proart-b760-creator-d4/techspec/): ATX board 30.5 × 24.4 cm, used for the board's approximate aspect ratio and functional zones.
- [NVIDIA RTX 5090 guide](https://www.nvidia.com/content/geforce-gtx/geforce-rtx-5090-user-guide-r2.pdf): the required card clearance is 304 × 137 × 61 mm. Clearance is not identical to the cooler's physical dimensions; the website card remains a generic representation, not a Founders Edition replica.

These references support visual proportions and component organization. They do not establish H3 case dimensions, GPU-specific fit, cable bend clearance, certified airflow or manufacturability. Before presenting a production configuration, model its exact case, motherboard, cooler, card and PSU drawings together.

## Validation

- TypeScript/Vite production build passed.
- Existing 10 Playwright checks passed, including hardware controls, pause, mobile/static fallback, accessibility and language switching.
- Rendered an assembled transparent NVIDIA still and inspected the interactive exploded view.
- Rotors use shared blade geometry per fan with disposal; environment reflections render once at 128 resolution. No remote HDR asset download is required. This is a rendering implementation choice, not a measured FPS improvement.

Next precision pass: actual SKU CAD/STEP or manufacturer drawings, connector and mounting-hole dimensions, validated clearances, then explicit LOD/performance measurements on lower-end GPUs. Mac case modeling is outside this tower revision.
