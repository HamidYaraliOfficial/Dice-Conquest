# Dice Conquest — Conquer the World, One Roll at a Time

## Project Introduction
An original offline, turn-based dice strategy game for the browser (Chrome, Edge, Firefox, Safari). No backend required.

## Game Overview
A hexagonal map of 36–56 territories forms a graph. Each territory has an owner and soldiers (max 8). 2–8 players (humans and/or AI) fight until one remains.

## Game Rules
1. Select your territory with at least 2 soldiers. 2. Select an adjacent enemy territory. 3. End your turn to receive reinforcements. 4. The last player alive wins.

## Dice Battle Mechanics
Each side rolls exactly one D6 per soldier in its territory. The attacker wins only if its total is strictly greater (ties go to the defender). Afterwards the source territory keeps exactly 1 soldier. On victory all other attacking soldiers move into the conquered territory; on defeat they are lost. Dice results are decided in the engine before the animation plays.

## Territory Conquest
Only adjacent enemy territories can be attacked. Ownership changes with an animated colour transition. Reinforcements at End Turn equal the size of your largest connected group of territories, distributed randomly over territories below 8 soldiers.

## Player and AI System
Modes: Single Player, AI Battle (0 humans), Local Multiplayer (hot-seat), Quick Match. AI levels: Easy, Normal (best win probability), Hard (win probability plus map position, leader targeting, eliminations, exposure).

## Features
Hex map graph, seeded maps, zoom and pan, animated dice battles, attack line effect, Battle History, Victory screen with stats, autosave and Continue, versioned and validated save, sound, game speed, Reduce Motion support, English / فارسی (RTL) / 简体中文.

## Screenshots
Run the game locally and take your own screenshots; none are bundled to avoid depicting unimplemented features.

## Technology Stack
Vite, vanilla JavaScript modules, SVG, CSS dice animation, Vitest. No external services.

## Project Structure
`src/engine.js` (dice, battle, reinforcement, win rules) · `src/ai.js` · `src/main.js` (UI, map, save) · `src/i18n/*.json` · `tests/engine.test.js` · `.github/workflows/deploy.yml`

## Installation
```
npm install
```
## Running Locally
```
npm run dev
```
## Build
```
npm run build
```
## Testing
```
npm run test
```
## GitHub Pages Deployment
Push to `main`, then in Settings → Pages choose Source: GitHub Actions. The workflow builds with the correct base path (`/<repo-name>/`).

## Language Support
English, Persian (RTL), Simplified Chinese. Translations live in `src/i18n/*.json`; the choice is stored in LocalStorage.

## Roadmap
React + TypeScript migration, music, more maps, online multiplayer, UI component tests.

## Contributing
Fork, create a branch, add tests for engine changes, open a pull request.

## License
MIT
