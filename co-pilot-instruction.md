# Backup Plans PWA

A free, open-source, **keyboard-first planner** where plans form a graph: you can have Plan A, B, C that branch from one plan and merge back into a common point. It runs as an installable web app (PWA) on Mac, iPhone, and anywhere else.

## Status
Early development. Built step by step (see [Roadmap](#roadmap)).

---

## Instructions for Copilot / AI assistants

Read this whole file before writing code.

- Work on **one step at a time**, only the step I name (e.g. "do Step 2"). Do not start later steps.
- Each step must end with an app that **runs without errors** (`npm run dev`) and passes `npm run build`.
- Keep code small, typed (strict TypeScript), and readable. No unnecessary abstractions.
- Do **not** add dependencies beyond the ones listed in [Tech stack](#tech-stack) without asking.
- Do not use any backend, paid service, or account. Everything is local-first.
- Put new code in the folders described in [Project structure](#project-structure).
- When a step is finished, summarize what changed and which files were touched, and suggest a commit message.

---

## Tech stack

- Vite + React + TypeScript (already scaffolded)
- `@xyflow/react` (React Flow) for the graph view
- `zustand` for state, with its `persist` middleware (localStorage)
- `fuse.js` for fuzzy search
- `vite-plugin-pwa` (added in Step 9)
- Plain CSS (no UI framework). Support light and dark mode via `prefers-color-scheme`.

## Core concepts

A **plan** is a node in a directed graph.

```ts
// src/types.ts
export interface Plan {
  id: string;        // short and sequential: "1", "2", "3"; displayed as "#3"
  title: string;
  notes: string;     // optional free text, default ""
  parents: string[]; // ids of previous plans. Empty = a root plan
}
```

- Only `parents` is stored. **Children ("next" plans) are derived**: all plans whose `parents` include this id.
- **Branching**: one plan has several children (Plan A, B, C).
- **Merging**: one plan has several parents (paths come back together).
- A plan can never be its own ancestor (no cycles). Reject a parent choice that would create one.
- IDs are never reused after deletion. Keep a `nextId` counter in the store.

## Project structure

```
src/
  types.ts            # Plan type
  store.ts            # Zustand store + persistence + selectors
  graph.ts            # pure helpers: getChildren, getParents, wouldCreateCycle
  components/
    PlanList.tsx
    NewPlanDialog.tsx
    SearchPalette.tsx
    FocusGraph.tsx
  hooks/
    useHotkeys.ts
  App.tsx
  main.tsx
```

## Keyboard shortcuts (target)

| Key | Action |
| --- | --- |
| `n` | New plan |
| `Cmd/Ctrl + K` or `/` | Open search palette |
| `Tab` / `Cmd/Ctrl + P` (in new-plan form) | Pick a parent via search |
| `Enter` | Confirm / re-center graph on the selected node |
| `Esc` | Close dialog or palette |
| `←` | Go to previous (parent) plan |
| `→` | Go to next (child) plan |
| `↑` / `↓` | Switch between siblings, or pick among several parents/children |
| `+` / `-` / `0` | Zoom in / zoom out / fit view |

Shortcuts must **not** fire while the user is typing in an input or textarea (except `Esc` and the ones listed for that dialog).

---

## Roadmap

Do these in order. Each step has acceptance criteria.

### Step 1: Data model and storage (minimal UI)
- Create `types.ts`, `graph.ts`, and `store.ts`.
- Store state: `plans: Record<string, Plan>`, `nextId: number`, `focusedId: string | null`.
- Actions: `addPlan(title, parents, notes?)`, `updatePlan(id, patch)`, `deletePlan(id)` (remove the id from other plans' `parents`), `setFocus(id)`.
- Persist to localStorage with Zustand `persist`.
- `graph.ts` pure functions: `getChildren(plans, id)`, `getParents(plans, id)`, `wouldCreateCycle(plans, childId, parentId)`.
- Replace the Vite starter in `App.tsx` with a plain list of plans (`#id title`) to prove persistence works.

**Done when:** plans survive a page refresh, ids increment and are never reused, and `wouldCreateCycle` is correct for direct and indirect cycles.

### Step 2: Add a plan from the keyboard
- Pressing `n` opens `NewPlanDialog` (a modal) with a focused title input.
- `Enter` saves and closes, `Esc` cancels. Empty titles are rejected.
- Create `useHotkeys.ts` for global shortcuts that ignore typing in inputs.
- The new plan becomes the focused plan.

**Done when:** you can add several plans using only the keyboard.

### Step 3: Search palette
- `SearchPalette` opens with `Cmd/Ctrl+K` or `/`.
- Fuzzy search by **id and title** using Fuse.js. Matching `#3` or `3` finds plan 3.
- `↑`/`↓` move the highlight, `Enter` selects, `Esc` closes.
- Make it a reusable component: `onSelect(plan)` and an optional `exclude: string[]` prop.
- Selecting a result in the main view sets it as the focused plan.

**Done when:** you can find any plan by id or part of a title and jump to it without the mouse.

### Step 4: Choose parents while adding a plan
- In `NewPlanDialog`, `Tab` or `Cmd/Ctrl+P` opens `SearchPalette` to pick a parent.
- Chosen parents show as removable chips (`#2 Title`). Multiple parents are allowed.
- Reuse `SearchPalette` with `exclude` set to already-chosen parents.
- Saving calls `addPlan(title, parents)`.
- If there are no plans yet, the plan is created as a root with no parent.

**Done when:** you can create a plan with 0, 1, or several parents purely by keyboard.

### Step 5: Focus graph view
- `FocusGraph` uses React Flow and shows **only** the focused plan, its direct parents (left), and direct children (right).
- Each node shows `#id` and the title, with no notes. The focused node is visually highlighted.
- Lay out manually by column (parents x=0, focus x=300, children x=600; stack vertically). Do not add a layout library.
- Edges point from parent to child with arrowheads.
- Disable dragging and manual connecting for now.
- Clicking a node re-centers the view on it.

**Done when:** the graph shows the right neighbors for any focused plan, including branches and merges.

### Step 6: Keyboard navigation
- `←` focuses a parent, `→` focuses a child.
- If there are several parents/children, `↑`/`↓` change the highlighted candidate, and `Enter` confirms the move.
- Keep the highlighted candidate visibly marked in the graph.
- With one candidate, the arrow key moves directly.

**Done when:** you can walk the entire graph forward and back with the keyboard, including through splits and merges.

### Step 7: Zoom and pan
- Mouse wheel, pinch, and drag-to-pan work (React Flow defaults).
- `+` / `-` zoom in and out, `0` fits the view. Use React Flow's `useReactFlow` hooks.
- Re-fit the view smoothly when the focused plan changes.

**Done when:** all zoom controls work by keyboard and by touch/mouse.

### Step 8: Export / Import JSON
- Export the store (`plans`, `nextId`) as a downloadable `.json` file.
- Import validates the shape, then replaces or merges after a confirmation.
- Reachable by keyboard (for example via a command in the search palette or `Cmd/Ctrl+E` / `Cmd/Ctrl+I`).

### Step 9: PWA
- Add `vite-plugin-pwa` with a manifest (name, icons, theme color) and offline caching.
- Verify "Add to Home Screen" on iPhone Safari and install on desktop Chrome.

### Step 10: Free deploy
- Deploy to GitHub Pages via a GitHub Actions workflow.
- Set `base` in `vite.config.ts` to match the repo name.

---

## Later ideas
- Edit and delete plans from the keyboard
- Status per plan (todo / doing / done) and a "chosen path" highlight
- Notes editor for the focused plan
- Optional sync between devices (a JSON file in iCloud or Git)

## Development

```bash
npm install
npm run dev     # start dev server
npm run build   # type-check and build
```

Requires Node 20.19+ or 22.12+.

## License

MIT