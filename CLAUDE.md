# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal tracker for **LEGO Star Wars: The Skywalker Saga** — a local web app (HTML + CSS + vanilla JS) with no build step, no server, no dependencies. Opens directly in a browser. Progress persists via `localStorage`.

## What's Being Tracked

Everything in the game:
- Story & Free Play completion % per level
- Minikits (10 per level, 45 levels across 9 episodes)
- True Jedi status per level
- Kyber Bricks collected
- Datacard locations/collected
- Characters unlocked (300+)
- Ships unlocked
- Challenges completed

## Architecture

Single-page app split into logical HTML/CSS/JS files — no framework, no bundler.

**Data layer** — all game state lives in `localStorage` under a single key as a JSON blob. Shape:
```js
{
  episodes: { [ep]: { [level]: { story, freeplay, minikits, trueJedi, challenges } } },
  characters: { [id]: { unlocked } },
  ships: { [id]: { unlocked } },
  kyberBricks: { collected, total },
  datacards: { [id]: { collected } }
}
```

**Game data** (static, never changes) — level names, character lists, minikit counts, etc. live in `data/` as plain JS objects exported via `<script>` tags. Never fetched, never dynamic.

**UI** — renders from game data + saved state. No virtual DOM. Direct DOM manipulation, re-render on state change.

## Code Rules (PULSE Token Efficiency)

- No obvious comments — only WHY, never WHAT
- Inline single-use variables: `return transform(getData())` not `const x = getData(); return transform(x)`
- Optional chaining + nullish coalescing over verbose null checks
- Arrow functions for simple transforms
- `.map/.filter/.reduce` over manual loops
- Destructure in function params
- Delete dead code — never comment it out
- If 3+ lines repeat, extract a function

## File Reading Rules

- Don't re-read files already in context this session
- Grep for a specific function rather than reading a whole file
- Read only the relevant section of large files, not the full file

## Key Constraints

- No npm, no build step — everything must work by opening `index.html` in a browser
- No external CDN calls — fully offline capable
- `localStorage` is the only persistence mechanism
- Must work in Chrome and Edge (Windows 11)
