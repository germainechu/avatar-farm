# prd.md — MBTI Avatar Farm MVP

## 1. Vision

Create a playful, visual “avatar farm” where MBTI personalities, modeled via their cognitive functions, interact with each other in structured discussions.

The app is both:
- A **learning tool** for understanding MBTI and cognitive functions.
- A **sandbox** to watch different types reason, argue, and collaborate on topics.

Long term, it evolves into a laboratory for modeling interpersonal dynamics, including socionics-based interaction patterns.

---

## 2. Goals

1. **Distinct Personality Feel:**
   - Each MBTI type should display a recognizable, consistent style that aligns with its cognitive functions.
2. **Educational Value:**
   - Users should come away with a clearer understanding of:
     - The 8 cognitive functions.
     - How function stacks influence behavior.
3. **Engaging Simulation:**
   - Users willingly run multiple scenarios and experiment with different type combinations.
4. **Foundation for Future Modeling:**
   - The simulation structure (data models, loops, persona configs) must be extensible for:
     - Predictive interaction models.
     - Socionics dynamics.

---

## 3. Target Users

- **MBTI Enthusiasts & Hobbyists**
  - Already familiar with types, curious about function-level modeling.
- **Psychology / Personality Students**
  - Want a visual/interactive way to see theories play out.
- **Coaches, Facilitators, Educators**
  - Use simple simulations to illustrate differences in thinking styles.
- **Builders & Researchers**
  - Interested in multi-agent systems and personality-driven agents.

---

## 4. Functional Requirements

### 4.1 Avatar Library

**FR-1:** The system shall provide 16 pre-defined avatars, one for each MBTI type.

**FR-2:** Each avatar configuration shall include:
- MBTI type (e.g. INFP).
- Cognitive function stack (Dom/Aux/Tert/Inferior) based on the provided table.
- A set of behavior parameters derived from cognitive functions, e.g.:
  - Abstractness vs concreteness.
  - Internal vs external focus.
  - Emotional vs logical emphasis.
  - Past vs present vs future orientation.

**FR-3:** Users shall be able to open a detail view of an avatar to see:
- Function stack with descriptions (Fi, Fe, Ti, Te, Si, Se, Ni, Ne).
- A summary of typical communication style.
- Short notes on strengths and blind spots in discussions.

---

### 4.2 Scenario Builder

**FR-4:** Users shall be able to create a scenario by specifying:
- Topic or question (text input).
- Interaction style (debate, brainstorm, cooperative planning).
- Number of rounds/messages (min 4, max 40 for MVP).
- Selection of participating avatars (2–8).

**FR-5:** The system shall validate that:
- At least two avatars are selected.
- The topic is non-empty.

**FR-6:** Users shall be able to save scenario configurations for later replay.

---

### 4.3 Simulation Engine

**FR-7:** The system shall generate a multi-turn conversation among the selected avatars.

**FR-8:** Simulation mode:
- **Baseline Mode (Required):** Rule-based, frontend-only.
  - Use templates and function-weighted rules to generate message text per avatar.
- **Enhanced Mode (Optional):** LLM-based.
  - The system calls an external AI API, passing:
    - Scenario topic.
    - Recent conversation history.
    - Avatar’s MBTI type + function stack + behavior profile (as structured prompt context).

**FR-9:** Turn-taking:
- The system shall assign a deterministic turn order (e.g. round-robin among avatars).
- Later extension: dynamic turn-taking (e.g. Fe/Te types interrupt more often) may be added.

**FR-10:** Messages shall be tagged (rule-based) as:
- Supportive/agreeing
- Critical/challenging
- Exploratory/idea-generating
- Clarifying/detail-focused

**FR-11:** Users shall be able to:
- Start/pause the simulation.
- Step through one message at a time.
- Reset and rerun the simulation with same or modified settings.

---

### 4.4 Conversation & Visualization

**FR-12:** The system shall display all messages in a timeline, with:
- Avatar identity (name, MBTI label).
- Message content.
- Turn number / timestamp.
- Tag (support, critique, etc.) as a chip.

**FR-13:** The currently speaking avatar shall be visually highlighted across UI.

**FR-14:** The system shall offer a short explanation of which cognitive functions influenced a given message (simple mapping, e.g. Ni+Te).

---

### 4.5 Analytics & History

**FR-15:** The system shall generate simple analytics for each simulation:
- Number of messages per avatar.
- Distribution of message tags (support, critique, etc.).
- Approximate dominance of logical (Ti/Te) vs emotional (Fi/Fe) contributions.

**FR-16:** The system shall store recent simulations (e.g. last 10) in local browser storage.

**FR-17:** Users shall be able to:
- View a list of past simulations.
- Reload and replay a past simulation.

---

## 5. Non-Functional Requirements

**NFR-1: Performance**
- The app shall load initial content in under 3 seconds on a mid-range mobile device on a typical broadband connection.
- Simulations (rule-based) shall generate messages without noticeable lag (sub-200ms per message).

**NFR-2: Availability**
- Entirely static frontend, available via standard hosting (e.g. Vercel, Netlify).

**NFR-3: Responsiveness**
- The UI shall be usable on mobile, tablet, and desktop.
- Critical functions (create scenario, run simulation, read transcript) must be accessible with minimal horizontal scrolling.

**NFR-4: Accessibility**
- Follow WCAG AA color contrast for main interactive elements.
- Keyboard navigable core flows.

**NFR-5: Privacy & Safety**
- No collection of personal data in MVP.
- Clear explanation that:
  - The simulation is an educational/toy system.
  - It is not psychological advice or a diagnostic tool.

---

## 6. Data Model (High-Level)

### Avatar

```ts
type CognitiveFunction = "Fi" | "Fe" | "Ti" | "Te" | "Si" | "Se" | "Ni" | "Ne";

type FunctionRole = "dominant" | "auxiliary" | "tertiary" | "inferior";

interface AvatarFunction {
  code: CognitiveFunction;
  role: FunctionRole;
}

interface AvatarBehavior {
  abstractness: number;    // 0–1 (Si/Se lower, Ni/Ne higher)
  emotionalFocus: number;  // 0–1 (Fi/Fe higher, Ti/Te lower)
  structure: number;       // 0–1 (Te/Ti higher)
  temporalFocus: "past" | "present" | "future" | "mixed";
  riskTaking: number;      // Se/Ne higher
}

interface Avatar {
  id: string;
  mbtiType: string;
  name: string;
  functions: AvatarFunction[];
  behavior: AvatarBehavior;
  description: string;
}

### Scenario
type InteractionStyle = "debate" | "brainstorm" | "cooperative";

interface Scenario {
  id: string;
  topic: string;
  style: InteractionStyle;
  avatarIds: string[];
  rounds: number;
  createdAt: string;
}

### Message
type MessageTag = "support" | "critique" | "idea" | "clarify";

interface Message {
  id: string;
  scenarioId: string;
  avatarId: string;
  round: number;
  content: string;
  tag: MessageTag;
  createdAt: string;
}

---

## 7. Roadmap

### Phase 1 — MVP (This Spec)
- 16 avatars, function-based behavior parameters.
- Rule-based simulation engine with basic templates.
- Scenario builder, transcript viewer, simple analytics, local history.
- Optional integration for AI-enhanced messages.

### Phase 2 — Interaction Models & Intelligence
  - Build interaction pattern layer:
    - Basic rules for synergy and friction between function stacks.
    - E.g. Te vs Fi conflict, Ne+Ni synergy, etc.
- Influence:
    - Willingness to agree/disagree.
    - Likelihood to respond to specific avatars.
    - Likelihood of conflict with specific avatars.
- Introduce conversation goals:
  - Try to converge on a decision.
  - Try to generate N ideas.
- Add metrics like “consensus level” and “conflict level”.


### Phase 3 — Socionics & Advanced Dynamics
- Add mode to switch from MBTI-only to MBTI + socionics interaction.
- Model:
  - Intertype relationships (e.g. dual, mirror, supervisee).
- Effects on:
  - Turn-taking.
  - Agreement patterns.
  - Trust vs skepticism between avatars.
- Add visualization of inter-avatar relationships (graph or matrix).

### Phase 4 — Community & Extensions
- Scenario sharing and galleries.
- Export transcripts, e.g. to markdown.
- Plugin-like rules system for custom personality models.

