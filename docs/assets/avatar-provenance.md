# Avatar asset provenance and optimization

## Source and permission

- Source: `assets/models/avatar_programador.glb`
- SHA-256: `901c7772d866866dfff05eedd340f7a66662cdc1de855aecc6fc5becc0e56806`
- Original size: 21,299,164 bytes
- Original structure: 1 scene, 1 mesh, 1 material, 632,738 triangles, one 2048×2048 base-color texture
- Ownership context: this source asset already belongs to the portfolio repository. The user explicitly requested that the avatar concept be retained and continued in the Kinetic Systems Lab redesign.

No model, mesh, texture, or material from another repository, marketplace, or third party was copied into the generated outputs. The source GLB remains unchanged and is the only asset input.

## Reproducible pipeline

Run from the repository root:

```powershell
npm run assets:avatar
npm run check:models
```

`scripts/optimize-avatar.mjs` invokes the repository-pinned glTF Transform CLI 4.4.1. Intermediate files are created in the operating-system temporary directory and removed after the run. The two public outputs are copied into place only after both pass structural and delivery budgets.

Full tier commands:

```text
gltf-transform weld <source> 01.glb
gltf-transform simplify 01.glb 02.glb --ratio 0.38 --error 0.001
gltf-transform prune 02.glb 03.glb
gltf-transform dedup 03.glb 04.glb
gltf-transform resize 04.glb 05.glb --width 1024 --height 1024
gltf-transform webp 05.glb 06.glb --quality 82 --effort 80
gltf-transform meshopt 06.glb 07.glb --level high
```

Light tier commands start independently from the source GLB:

```text
gltf-transform weld <source> 01.glb
gltf-transform simplify 01.glb 02.glb --ratio 0.11 --error 0.0021
gltf-transform prune 02.glb 03.glb
gltf-transform dedup 03.glb 04.glb
gltf-transform resize 04.glb 05.glb --width 512 --height 512
gltf-transform webp 05.glb 06.glb --quality 82 --effort 80
gltf-transform meshopt 06.glb 07.glb --level high
```

The specified `0.001` Light error threshold was measured from the source but could not satisfy the 75,000-triangle budget: a fresh direct run stopped at 139,442 triangles. An error threshold of `0.0021` reached 69,565 triangles before pruning and compression. The user explicitly approved this design exception on 2026-07-14 after reviewing the measured tradeoff and visual result.

## Verified outputs

| Tier | Path | SHA-256 | Bytes | Triangles | Max texture | Structure |
|---|---|---|---:|---:|---:|---|
| Full | `public/models/avatar-full.glb` | `06bf2532383e111b840a49723ba49ff485733048f3034b1764035db04f41411a` | 2,070,924 | 240,431 | 1024×1024 | 1 scene, 1 mesh, 1 material |
| Light | `public/models/avatar-light.glb` | `7347596816ca0df8ba857eb1e21ed866939128d162d206b8f98a3e06ad8140bc` | 782,400 | 69,565 | 512×512 | 1 scene, 1 mesh, 1 material |

On 2026-07-14 both outputs were loaded in a local Three.js preview with Meshopt decoding. After changing the Light tier to start directly from the source, it was rendered again and visually inspected. The review confirmed the front silhouette, material orientation, facial readability, hands, chair, desk, laptop, monitor, and headset remain recognizable in both tiers. The Light tier removes fine surface detail but preserves the avatar's identity and major forms.
