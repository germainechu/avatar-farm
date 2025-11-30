# mvp-plan.md — cursor prompt: scaffold & core architecture

You are an expert frontend engineer working inside Cursor.  
You are building a **web-only React + TypeScript + Tailwind** MVP called **“MBTI Avatar Farm”**.

## Context

High-level product idea:

- A sandbox with **16 MBTI-based avatars** (ISTJ → ENTJ).
- Each avatar is driven by its **cognitive function stack** (Dom/Aux/Tert/Inferior) using the 8 functions: Fi, Fe, Ti, Te, Si, Se, Ni, Ne.
- User creates a **scenario** (topic + interaction style + participants + rounds).
- A **simulation engine** runs a multi-round conversation where avatars respond in character based on:
  - Scenario topic
  - Conversation history
  - Avatar’s function profile.

You must:
- Keep this **frontend-only** (no backend, no DB).
- Assume **optional** integration with an external LLM API later (design for it, but don’t hard-depend on it for the baseline rule-based simulation).

I will paste (or already have in this repo) three spec files:
- `mvp-plan.md` (scope + features),
- `design-style-plan.md` (visual + UX),
- `prd.md` (functional + non-functional requirements).

Treat those files as **source of truth** for behavior and features.

---

## Tech Stack Requirements

- Tooling: **Vite + React + TypeScript**
- Styling: **Tailwind CSS**
- State management: simple and explicit, prefer:
  - Local component state + React Context, OR
  - Zustand store if needed.
- Data: use **static TS/JSON config** for MBTI types, cognitive functions, and behavior weights.
- Persistence: **`localStorage` only** for saving recent simulations.

---

## Step 1 – Project Setup

1. Create a Vite + React + TypeScript project, wired with Tailwind.
2. Set up a clean folder structure:
   - `src/components/` — UI components
   - `src/features/avatars/`
   - `src/features/scenarios/`
   - `src/features/simulation/`
   - `src/types/`
   - `src/lib/` — helpers
   - `src/store/` — state (if using Zustand/Context)
3. Add a simple **AppShell** layout:
   - Top nav with app name (“MBTI Avatar Farm”).
   - Main content area that can host:
     - Avatar grid
     - Scenario builder
     - Conversation view
     - Analytics panel

Generate the minimal code to get this running with no TS errors.

---

## Step 2 – Core Types & Data Models

Based on the PRD, create strongly typed interfaces:

- `CognitiveFunction`, `FunctionRole`, `AvatarFunction`, `AvatarBehavior`, `Avatar`
- `InteractionStyle`, `Scenario`
- `Message`, `MessageTag`

Populate:

- `mbtiTypes.ts` with all 16 types and their cognitive stacks.
- `avatarBehavior.ts` with reasonable default weights derived from function stacks (e.g. Ni/Ne → high abstractness, Fi/Fe → high emotionalFocus).

Ensure the types match what the PRD defines (you can adapt field names but keep the semantics).

---

## Step 3 – Avatar Farm UI

Build the **Avatar Library / Farm**:

- `AvatarCard` component:
  - Shows name, MBTI type, dominant + auxiliary functions as badges.
- `AvatarDetailDrawer`:
  - Shows:
    - Function stack with role (Dom/Aux/Tert/Inferior).
    - Short description of communication style.
- `AvatarGrid`:
  - 16 avatars displayed in a grid.
  - Clicking on a card opens details.

Make sure layout/props are clean and reusable.

---

## Step 4 – Scenario Builder UI

Create a **ScenarioBuilder** feature:

- Controls:
  - Textarea for topic/question.
  - Select for interaction style: `"debate" | "brainstorm" | "cooperative"`.
  - Multi-select of avatars (min 2, max 8).
  - Slider / number input for rounds (min 4, max ~40).
- Validate:
  - At least 2 avatars selected.
  - Topic is non-empty.
- A primary CTA button: `Run Simulation`.

The ScenarioBuilder should output a `Scenario` object that can be passed into the simulation engine.

---

## Step 5 – Rule-based Simulation Engine

Implement a **baseline rule-based simulation** (no external LLM required):

1. Create a `generateMessage` function:
   - Input:
     - `avatar: Avatar`
     - `scenario: Scenario`
     - `history: Message[]`
   - Output:
     - A new `Message` with:
       - Reasonable content text
       - A `MessageTag` (support | critique | idea | clarify) chosen via simple heuristics from:
         - Avatar behavior (e.g., Ti/Te → more critique/clarify; Ne/Ni → more idea).
         - Interaction style.

2. Use templated message patterns influenced by behavior fields:
