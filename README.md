# MBTI Avatar Farm

A cognitive function-based personality simulation system where 16 MBTI personality types interact in structured conversations.

## 🎯 Overview

MBTI Avatar Farm is an educational tool that models how different MBTI personality types communicate and interact based on their cognitive function stacks. Each avatar is driven by its unique combination of the 8 cognitive functions (Fi, Fe, Ti, Te, Si, Se, Ni, Ne), creating distinct and recognizable communication patterns.

## ✨ Features

### 1. **Avatar Library**
- 16 pre-configured MBTI personality types
- Each avatar has a unique cognitive function stack (Dominant, Auxiliary, Tertiary, Inferior)
- Behavior parameters algorithmically derived from function stacks:
  - Abstractness (concrete ↔ abstract thinking)
  - Emotional Focus (logical ↔ emotional)
  - Structure (flexible ↔ organized)
  - Temporal Focus (past, present, future, mixed)
  - Risk Taking (cautious ↔ bold)
- Detailed avatar profiles showing strengths and blind spots

### 2. **Scenario Builder**
- Create custom discussion topics
- Choose interaction style:
  - **Debate**: Avatars challenge and critique viewpoints
  - **Brainstorm**: Generate and build upon creative ideas
  - **Cooperative**: Work together toward consensus
- Select 2-8 participating avatars
- Configure conversation length (4-40 rounds)

### 3. **Rule-Based Simulation Engine**
- Generates authentic-feeling messages based on:
  - Avatar's cognitive function stack
  - Behavior parameters
  - Interaction style
  - Conversation context
- Message tagging system:
  - 👍 **Support**: Agreement and validation
  - 🤔 **Critique**: Challenges and analysis
  - 💡 **Idea**: New possibilities and suggestions
  - 🔍 **Clarify**: Details and explanations

### 4. **Conversation Timeline**
- Real-time message display with avatar identification
- Visual indicators for message types
- Playback controls (play, pause, step-through, reset)
- Automatic message generation with configurable speed

### 5. **Analytics Dashboard**
- Message count per avatar
- Distribution of message types
- Logical vs Emotional balance meter
- Summary statistics

### 6. **Local Storage Persistence**
- Saves scenarios for reuse
- Stores last 10 simulation results
- No backend required - fully client-side

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **State Management**: React hooks + Zustand
- **Storage**: localStorage

### Project Structure
```
src/
├── components/          # Shared UI components
│   └── AppShell.tsx    # Main layout wrapper
├── features/
│   ├── avatars/        # Avatar display components
│   │   ├── AvatarCard.tsx
│   │   ├── AvatarGrid.tsx
│   │   └── AvatarDetailDrawer.tsx
│   ├── scenarios/      # Scenario creation
│   │   └── ScenarioBuilder.tsx
│   └── simulation/     # Simulation UI
│       ├── ConversationTimeline.tsx
│       ├── SimulationControls.tsx
│       ├── SimulationView.tsx
│       └── SimulationAnalytics.tsx
├── lib/                # Core logic
│   ├── avatars.ts      # Avatar generation
│   ├── behaviorDerivation.ts  # Behavior calculation
│   ├── mbtiData.ts     # MBTI type definitions
│   ├── simulationEngine.ts    # Message generation
│   └── storage.ts      # localStorage utilities
├── store/              # State management
│   └── appStore.ts
└── types/              # TypeScript definitions
    └── index.ts
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Running the App
1. Open your browser to `http://localhost:3000` (or the port shown in terminal)
2. Explore the **Avatar Library** to understand each personality type
3. Navigate to **Create Scenario** to set up a discussion
4. Click **Run Simulation** to watch the avatars interact
5. View analytics in real-time as the conversation unfolds

## 🧠 How It Works

### Cognitive Function Stacks
Each MBTI type has a unique stack of 4 functions in order of preference:

**Example: INTJ**
- **Dominant**: Ni (Introverted Intuition) - Synthesizes patterns into insights
- **Auxiliary**: Te (Extraverted Thinking) - Organizes systems efficiently
- **Tertiary**: Fi (Introverted Feeling) - Evaluates based on values
- **Inferior**: Se (Extraverted Sensing) - Engages with immediate reality

### Behavior Derivation
The system calculates behavior parameters by:
1. Assigning each function a profile (abstractness, emotional focus, etc.)
2. Weighting by role (dominant > auxiliary > tertiary > inferior)
3. Computing weighted averages for each dimension

### Message Generation
Messages are generated through:
1. **Tag Selection**: Probabilistic choice based on:
   - Interaction style (debate favors critique, brainstorm favors ideas)
   - Dominant function (Ti/Te → critique, Ne/Ni → ideas, Fe/Fi → support)
   - Behavior parameters
2. **Template Selection**: Function-specific message templates
3. **Content Generation**: Templates filled with scenario context

## 📊 MBTI Types Included

### Analysts (NT)
- **INTJ** - The Architect
- **INTP** - The Logician
- **ENTJ** - The Commander
- **ENTP** - The Debater

### Diplomats (NF)
- **INFJ** - The Advocate
- **INFP** - The Mediator
- **ENFJ** - The Protagonist
- **ENFP** - The Campaigner

### Sentinels (SJ)
- **ISTJ** - The Logistician
- **ISFJ** - The Defender
- **ESTJ** - The Executive
- **ESFJ** - The Consul

### Explorers (SP)
- **ISTP** - The Virtuoso
- **ISFP** - The Adventurer
- **ESTP** - The Entrepreneur
- **ESFP** - The Entertainer

## 🎓 Educational Value

This tool helps users understand:
- How cognitive functions influence communication style
- Why certain types naturally align or clash
- The difference between surface-level type descriptions and function-based modeling
- How the same topic can be approached from 16 different perspectives

## 🔮 Future Enhancements

### Phase 2: Interaction Models
- Synergy and friction patterns between function stacks
- Dynamic turn-taking (interruptions, response likelihood)
- Conversation goals (consensus, idea generation)
- Conflict and agreement metrics

### Phase 3: Socionics Integration
- Intertype relationships (dual, mirror, supervisee, etc.)
- Relationship-based interaction modifiers
- Trust and skepticism dynamics
- Visual relationship graphs

### Phase 4: Community Features
- Scenario sharing and galleries
- Export transcripts to markdown
- Custom personality model plugins
- LLM integration for enhanced messages

## 🤝 Contributing

This is an MVP built for educational purposes. Contributions, suggestions, and feedback are welcome!

## 📝 License

MIT License - feel free to use and modify for your own projects.

## ⚠️ Disclaimer

This is an educational simulation tool, not a psychological assessment or diagnostic instrument. The representations are simplified models based on cognitive function theory and should not be taken as definitive descriptions of real individuals.

---

**Built with ❤️ using React, TypeScript, and Tailwind CSS**
