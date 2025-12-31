This project is a small Phaser 3 browser game (Tausendeins / "Skitgubbe"). The file layout is intentionally simple — scripts are loaded directly in the HTML and most game logic lives in a few top-level JS files. Use this note to orient any AI coding agent to the codebase and its conventions.
# Copilot instructions for this repo

Purpose: Give immediate, actionable guidance for AI coding agents working on this small Phaser 3 game.

**Big picture**
- Entrypoint: [index.html](index.html). This is a static site — no bundler or packaging.
- Scenes and responsibilities:
  - Game engine / rules: [src/Skitgubbe.js](src/Skitgubbe.js)
  - Rendering / UI / input / tweens: [src/PlayScene.js](src/PlayScene.js)
  - Asset registration: [src/CardLib.js](src/CardLib.js)
  - Game boot / Phaser config: [src/Main.js](src/Main.js)
  - End-of-round UI: [src/ScoreScene.js](src/ScoreScene.js)
- Why structure is this way: scripts are loaded in order in the HTML and rely on globals. Separation keeps pure game rules in `Skitgubbe.js` and UI/animation in `PlayScene.js`.

**Critical conventions & patterns**
- No module system: files rely on global symbols and script load order. Do NOT reorder `<script>` tags in [index.html](index.html).
- Card identity: IDs are two parts: suit letter + two-digit rank (examples: `c02`, `h14`, `s11`). See `CARD_SKITGUBBE_IDS` and helpers in [src/Skitgubbe.js](src/Skitgubbe.js).
- Sprite bookkeeping: `PlayScene` uses `this.spritesHash` (id → sprite) and `this.anims_hash` (id → animation). Keep these keys synced when adding assets.
- Scene keys: `'PLAY'` and `'SCORE'` (defined/used in [src/Main.js](src/Main.js)).
- Input toggles: use `setLowerHandInteractive()` and `disableLowerHandInteractive()` in `PlayScene.js` to control player input — tests and UI assume these are used consistently.
- Asset preload helper: call `preloadAssets(this)` from [src/CardLib.js](src/CardLib.js) in `PlayScene.preload()` when adding new card images.
- TEST flag: `const TEST = true` in `PlayScene.js` enables auto-click/auto-flow. Toggle to `false` for manual testing.
- Constants & layout: spacing and animation durations are controlled by constants at top of `PlayScene.js` (for example `SPEED`, `HAND_DIST_BETWEEN_CARDS`). Prefer changing those constants.

**Where to change what**
- Change rules/AI: edit [src/Skitgubbe.js](src/Skitgubbe.js) (Player, Ai, Dealer, Judge). Keep UI untouched unless you need to show new properties.
- Change visuals, animations, interactivity: edit [src/PlayScene.js](src/PlayScene.js) and [src/CardLib.js](src/CardLib.js).
- Add assets: place images under `assets/` and add `this.load.image(...)` in `PlayScene.preload()`; update `CardLib.js` to register card ids.

**Developer workflows / running locally**
- This is a static site — run a simple HTTP server from project root to serve assets. Examples:

```bash
# from project root
python -m http.server 8000
# or
npx http-server -p 8000
```
- Typical debugging cycle: edit JS file → reload browser. The repo contains a comment in `PlayScene.js` recommending `Shift-F5` to reload the page.
- Quick UI automation: set `TEST = true` in `PlayScene.js` to exercise automated flows while iterating on logic.

**Examples / quick references**
- To add a new button image: put PNG into `assets/buttons/`, add `this.load.image('my_btn', 'assets/buttons/my_btn.png')` in `PlayScene.preload()` and create it in `create()` with `.setInteractive()`.
- To change AI difficulty: call `this.gameSkitgubbe.setAiLevel(...)` during scene `init()` — `Main.js`/menu passes level into the scene via `init(data)`.

**Testing & safety checks**
- When moving or renaming card IDs, update both the asset registration in `CardLib.js` and all references in `PlayScene.js` (`spritesHash`/`anims_hash`) and `Skitgubbe.js`.
- Keep changes minimal and preserve global names: many functions rely on `this.spritesHash[...]` and `this.anims_hash[...]`.

If any section is unclear or you would like concrete examples (e.g., step-by-step adding a card or running with `TEST=false`), tell me which section to expand.
