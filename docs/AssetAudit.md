# Elysia temporary asset audit

The repository snapshot was audited against `assets/sprites/INTEGRATION_MANIFEST.md`
and `assets/sprites/README_IMPORTANTE.txt`. The archive itself and the contact sheets
mentioned by the notes were not present in the working tree, so this report does not
claim that the incomplete snapshot is the full prepared pack.

## Available

- **Buildings:** 49 original-ID RPG Base PNG modules (`rpgTile065` through
  `rpgTile113`) suitable for walls, trims, doors, and other building composition.
- **Nature:** a tree, hit-state tree, and stump SVG already used by the renderer.
- **Characters:** three chosen-character SVGs, six adult villager SVGs, and three
  child SVGs. These are static sprites without directional animation frames.
- **Objects and resources:** deer and water-source SVGs, each with a feedback state.
- **UI:** tree, water, and animal SVG icons.
- **Documentation:** the integration manifest and important import notes are
  preserved in `assets/sprites/`.

## Missing from this repository snapshot

- The ZIP archive, original license files, `reference/` contact sheets, terrain
  PNGs, nature RPG/Tiny Town PNGs, object Tiny Town PNGs, character spritesheet,
  and brown/beige UI panels and buttons referenced by the manifest.
- Complete house compositions, a well, campfire, fence set, flowers, bushes,
  rocks, fruit trees, terrain, and panel/button replacements therefore remain
  procedural until their mapped files are available. The existing procedural
  rendering is deliberately retained rather than substituting an unrelated tile.

## Runtime integration

The central runtime catalog exposes available files through stable semantic keys.
Legacy sprite identifiers resolve through aliases so existing save data remains
compatible. Missing and still-loading files use the existing procedural renderer;
direct `AssetManager` consumers receive a visible checkerboard fallback.
