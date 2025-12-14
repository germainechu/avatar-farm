# MBTI Avatar Farm

A cognitive function-based personality simulation system where 16 MBTI personality types interact in structured conversations powered by LLM technology and a physics-based cognitive activation engine.

## 🎯 Overview

MBTI Avatar Farm is an educational and experimental tool that models how different MBTI personality types communicate and interact based on their cognitive function stacks. Each avatar is driven by its unique combination of the 8 cognitive functions (Fi, Fe, Ti, Te, Si, Se, Ni, Ne), creating distinct and recognizable communication patterns through:

- **LLM-Powered Conversations**: DeepSeek API generates natural, contextual responses
- **Cognitive Physics Engine**: Real-time activation dynamics that simulate how cognitive functions respond to context and social interactions
- **Socionics Integration**: Advanced positional definitions that model function relationships and capacities

## ✨ Key Features

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
- Custom personality prompts for enhanced character depth

### 2. **Scenario Builder**
- Create custom discussion topics
- Choose interaction style:
  - **Debate**: Avatars challenge and critique viewpoints
  - **Brainstorm**: Generate and build upon creative ideas
  - **Cooperative**: Work together toward consensus
- Select 2-8 participating avatars
- Configure conversation length (4-40 rounds)
- **Image Support**: Attach images to scenarios for visual context
- **LLM Mode Toggle**: Choose between LLM-powered or rule-based message generation

### 3. **LLM-Powered Message Generation**
- **DeepSeek API Integration**: Natural, contextual responses
- **Conversation Memory**: Sliding window context (5-10 messages) for natural references
- **Personality Consistency**: Detailed system prompts encode MBTI traits
- **Physics State Integration**: Activation levels influence response style
- **Automatic Fallback**: Gracefully falls back to rule-based generation on API errors
- **Image Analysis**: Avatars can reference and analyze shared images

### 4. **Cognitive Physics Engine** 🧠

The core innovation of Avatar Farm is its physics-based cognitive activation system that simulates how cognitive functions activate and interact in real-time.

#### Core Update Law

The engine uses a differential equation to model cognitive function activation:

```
a_i(t+1) = b_i + α(a_i - b_i) + γ_ctx F_ctx + γ_soc F_soc + λ_c C(a_i - b_i)
```

Where:
- `a_i(t+1)`: Activation level of function `i` at next time step
- `b_i`: Baseline activation (from Socionics positions)
- `α`: Persistence parameter (0.7) - how much activation persists
- `γ_ctx`: Context force strength (0.3) - influence of topic/context
- `F_ctx`: Context force vector - which functions are activated by the topic
- `γ_soc`: Social force strength (0.4) - influence of other avatars
- `F_soc`: Social force vector - how other avatars' activations affect this avatar
- `λ_c`: Coupling strength (0.2) - interaction between paired functions
- `C`: Coupling matrix - models non-orthogonal function pairs

#### Socionics Positional Definitions

Each cognitive function occupies one of 8 positions in Socionics Model A:

| Position | Name | Baseline | Capacity | Description |
|----------|------|----------|----------|-------------|
| 1 | Base | 0.9 | 1.0 | Dominant function - highest baseline, full capacity |
| 2 | Creative | 0.8 | 0.9 | Auxiliary function - strong, flexible |
| 3 | Role | 0.3 | 0.5 | Inverse of inferior - awkward, limited |
| 4 | Vulnerable (PoLR) | 0.1 | 0.2 | Inverse of tertiary - weak spot |
| 5 | Suggestive | 0.2 | 0.3 | Inferior function - desired, valued |
| 6 | Activating | 0.4 | 0.6 | Tertiary function - responsive, valued |
| 7 | Ignoring | 0.3 | 0.7 | Inverse of dominant - unvalued, resisted |
| 8 | Demonstrative | 0.4 | 0.8 | Inverse of auxiliary - unconscious strength |

**Key Insight**: Functions in positions 1, 2, 5, 6 are "valued" and respond to social forces. Functions in positions 3, 4, 7, 8 are "unvalued" and resist external influence.

#### Force Types

1. **Context Force (F_ctx)**: Topic-based activation
   - Detected from scenario keywords (analytical, emotional, sensory, strategic, etc.)
   - Maps to specific cognitive functions
   - Example: "analyze" → activates Te, Ti, Ni

2. **Social Force (F_soc)**: Inter-avatar influence
   - Only affects valued functions (positions 1, 2, 5, 6)
   - Weighted by relationship state (affinity - tension)
   - Higher affinity → positive influence
   - Higher tension → negative influence

3. **Coupling Force**: Function pair interactions
   - Models non-orthogonal pairs: Te↔Fi, Ti↔Fe, Ne↔Si, Ni↔Se
   - When one activates, its pair is influenced
   - Represents the interconnected nature of cognitive functions

#### Relationship Dynamics

The engine tracks relationship states between avatars:

- **Affinity**: Positive connection (0.0 - 1.0)
- **Tension**: Negative connection (0.0 - 1.0)
- **Constraint**: `affinity + tension = 1.0` (normalized)

Relationships update based on:
- **Structural Score (S_ij)**: Compatibility kernel between function positions
- **Interaction Intensity**: Average activation of functions during interaction
- **Position Compatibility**: Some positions support each other, others resist

#### Position-Specific Damping

Different positions respond differently to external forces:

- **Base/Creative** (1, 2): Full force effectiveness (1.0)
- **Suggestive/Activating** (5, 6): High effectiveness (0.8)
- **Role** (3): Half effectiveness (0.5) - awkward, limited
- **Vulnerable/Ignoring** (4, 7): Low effectiveness (0.3) - resisted
- **Demonstrative** (8): Medium effectiveness (0.6) - unconscious

#### Integration with LLM

The physics state is integrated into LLM prompts:

- **Master Prompt**: Comprehensive function definitions (once per conversation)
- **Activation Guidance**: Only included when significant deviations occur (>0.15 or 2x baseline)
- **Relationship Context**: Shows significant relationships (affinity >0.7, <0.3, or tension >0.4)
- **Token Efficient**: ~500 tokens once, ~100-150 tokens per message when needed

This creates a feedback loop: physics state influences LLM responses, which update physics state, creating dynamic, context-aware conversations.

### 5. **Conversation Timeline**
- Real-time message display with avatar identification
- Visual indicators for message types (support, critique, idea, clarify)
- Playback controls (play, pause, step-through, reset)
- Automatic message generation with configurable speed
- Image display in messages
- User interjection support with images

### 6. **Analytics Dashboard**
- Message count per avatar
- Distribution of message types
- Logical vs Emotional balance meter
- Summary statistics
- Physics state visualization (activation levels, relationships)

### 7. **Cloud Storage & Persistence**
- **Supabase Integration**: Cloud storage for conversation logs
- **Automatic Fallback**: Uses localStorage if Supabase not configured
- **Hybrid Approach**: Saves to both Supabase and localStorage
- **Chat History**: Browse and replay saved conversations

### 8. **Image Upload & Moderation**
- Upload images to scenarios and user interjections
- **Content Moderation**: Sightengine API integration (optional)
- Automatic filtering of inappropriate content
- Avatars can analyze and respond to shared images
- Base64 storage with cloud storage migration path

## 🏗️ Architecture

### Tech Stack

#### Frontend
- **React 18** + **TypeScript**: Modern UI framework
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first styling
- **Zustand**: Lightweight state management

#### Backend
- **Vercel Serverless Functions**: Edge functions for API endpoints
- **DeepSeek API**: LLM for message generation (`deepseek-chat` model)
- **Sightengine API**: Image content moderation (optional)
- **Supabase**: PostgreSQL database for conversation storage
- **Postgres.js**: Direct database connections for API functions

#### Infrastructure Decisions

**Why Vercel?**
- Zero-config deployment for React + serverless functions
- Edge functions provide low latency globally
- Built-in environment variable management
- Automatic HTTPS and CDN
- Cost-effective for serverless workloads

**Why DeepSeek?**
- Cost-effective: ~$0.00066 per message
- High quality responses
- Good API reliability
- Supports vision models (future enhancement)
- Competitive pricing vs OpenAI/Anthropic

**Why Supabase?**
- PostgreSQL with real-time capabilities
- Row Level Security (RLS) for data protection
- Automatic API generation
- Generous free tier
- Easy migration path for authentication
- Direct Postgres connection for server-side functions

**Why Hybrid Storage?**
- Supabase for cloud persistence and cross-device access
- localStorage for immediate functionality without setup
- Automatic fallback ensures app always works
- Best of both worlds: cloud when available, local when not

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
│       ├── SimulationAnalytics.tsx
│       ├── UserInterjection.tsx
│       └── FinalPositions.tsx
├── lib/                # Core logic
│   ├── avatars.ts      # Avatar generation
│   ├── behaviorDerivation.ts  # Behavior calculation
│   ├── cognitivePhysics.ts   # Physics engine ⚡
│   ├── mbtiData.ts     # MBTI type definitions
│   ├── simulationEngine.ts   # Message generation
│   ├── storage.ts      # Storage utilities
│   └── supabase.ts     # Supabase client
├── store/              # State management
│   └── appStore.ts
└── types/              # TypeScript definitions
    └── index.ts

api/                    # Vercel serverless functions
├── generate-message.ts        # LLM message generation
├── analyze-cognitive-functions.ts  # Function analysis
├── moderate-image.ts          # Image moderation
├── analyze-perspectives.ts    # Perspective analysis
└── generate-position.ts       # Position generation

personality-prompts/    # Custom personality prompts
├── ENFP.md
├── ENFJ.md
├── ENTP.md
└── ... (one per MBTI type)
```

### Communication Flow

```
User creates scenario (with optional LLM mode)
  ↓
SimulationView calls runSimulation() [ASYNC]
  ↓
Initialize physics state for all avatars
  ↓
For each round, for each avatar (sequential):
  ↓
generateMessage() checks useLLM flag
  ↓
If LLM: generateLLMMessage()
  ├─ Build conversation context (sliding window)
  ├─ Extract physics state (activation, relationships)
  ├─ Build system prompt with personality + physics
  ├─ Call /api/generate-message (DeepSeek)
  └─ Update physics state after message
  ↓
If rule-based: Use template system
  ↓
Messages accumulated in history
  ↓
Next avatar sees updated history + physics state
```

### API Endpoints

#### `/api/generate-message`
- **Purpose**: Generate LLM-powered avatar messages
- **Method**: POST
- **Input**: Avatar data, scenario, conversation history, physics state
- **Output**: Message content and tag
- **Model**: DeepSeek Chat (`deepseek-chat`)
- **Timeout**: 25 seconds
- **Memory**: 1024 MB

#### `/api/moderate-image`
- **Purpose**: Content moderation for uploaded images
- **Method**: POST
- **Input**: Base64 image data
- **Output**: Moderation result (safe/unsafe, categories)
- **Service**: Sightengine (optional, falls back to safe if not configured)
- **Memory**: 512 MB

#### `/api/analyze-cognitive-functions`
- **Purpose**: Analyze which cognitive functions are active in a message
- **Method**: POST
- **Input**: Message, avatar, scenario
- **Output**: List of active cognitive functions
- **Memory**: 1024 MB

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm
- (Optional) Supabase account for cloud storage
- (Optional) DeepSeek API key for LLM mode
- (Optional) Sightengine credentials for image moderation

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd avatar-farm

# Install dependencies
npm install

# Copy environment variables template
cp .env.example .env
```

### Environment Variables

Create a `.env` file in the project root:

```env
# DeepSeek API (required for LLM mode)
DEEPSEEK_API_KEY=your_deepseek_api_key

# Supabase (optional - for cloud storage)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres

# Image Moderation (optional - for content filtering)
SIGHTENGINE_USER=your_sightengine_user
SIGHTENGINE_SECRET=your_sightengine_secret
```

**Note**: The app works without Supabase or Sightengine - it will fall back to localStorage and allow all images respectively.

### Running the App

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run with Vercel dev (for testing serverless functions locally)
npm run dev:vercel
```

### Database Setup (Optional)

If using Supabase for cloud storage:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL migration in `supabase_migration.sql`:
   ```sql
   CREATE TABLE simulations (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID,
     scenario JSONB NOT NULL,
     messages JSONB NOT NULL,
     completed_at TIMESTAMPTZ NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   
   CREATE INDEX idx_simulations_completed_at ON simulations(completed_at DESC);
   
   ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;
   
   CREATE POLICY "Allow all operations" ON simulations
     FOR ALL USING (true) WITH CHECK (true);
   ```
3. Add Supabase credentials to `.env`

### Using the App

1. **Explore Avatars**: Navigate to the Avatar Library to see all 16 MBTI types
2. **Create Scenario**: 
   - Choose a topic
   - Select interaction style (debate/brainstorm/cooperative)
   - Pick 2-8 avatars
   - (Optional) Enable LLM mode for natural conversations
   - (Optional) Attach an image for visual context
3. **Run Simulation**: Click "Run Simulation" and watch avatars interact
4. **Interject**: Add your own messages or images during conversations
5. **View Analytics**: See message distribution, activation levels, and relationships
6. **Save & Replay**: Save conversations to cloud/local storage and replay later

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

#### LLM Mode
1. **Context Building**: Last 5-10 messages with speaker names
2. **Physics State Extraction**: Current activation levels and relationships
3. **Prompt Construction**: 
   - Master prompt (function definitions) - once per conversation
   - Avatar-specific prompt (personality, behavior, cognitive state)
   - Conversation context
   - Relationship guidance (when significant)
4. **API Call**: DeepSeek generates response
5. **Physics Update**: State updates based on message content and context

#### Rule-Based Mode
1. **Tag Selection**: Probabilistic choice based on interaction style and dominant function
2. **Template Selection**: Function-specific message templates
3. **Content Generation**: Templates filled with scenario context

### Physics State Updates

After each message:
1. **Context Detection**: Analyze topic for context tags (analytical, emotional, etc.)
2. **Force Computation**: Calculate context and social forces
3. **Activation Update**: Apply update law with position-specific damping
4. **Relationship Update**: Update affinity/tension based on structural score
5. **Clamping**: Ensure activations respect capacity limits

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

## 💰 Cost Analysis

### Per Message (LLM Mode)
- **Input tokens**: ~800 (system prompt + context + physics state)
- **Output tokens**: ~100 (response)
- **Cost**: ~$0.00066 per message (DeepSeek pricing)

### Per Simulation (Example)
- 4 avatars × 10 rounds = 40 messages
- **Total cost**: ~$0.026 per simulation

### Monthly Estimate (100 simulations/day)
- 100 × 30 = 3,000 simulations/month
- 3,000 × $0.026 = **~$78/month**

✅ **Highly cost-effective for educational/research use!**

## 🎓 Educational Value

This tool helps users understand:
- How cognitive functions influence communication style
- Why certain types naturally align or clash
- The difference between surface-level type descriptions and function-based modeling
- How the same topic can be approached from 16 different perspectives
- Real-time cognitive activation dynamics
- Relationship formation based on function compatibility

## 🔮 Future Enhancements

### Phase 1: Enhanced Physics
- [ ] Dynamic parameter tuning based on conversation quality
- [ ] Multi-round context accumulation
- [ ] Function-specific response time modeling

### Phase 2: Advanced Interactions
- [ ] Interruptions and turn-taking dynamics
- [ ] Conversation goals (consensus, idea generation)
- [ ] Conflict and agreement metrics
- [ ] Visual relationship graphs

### Phase 3: Socionics Relationships
- [ ] Intertype relationships (dual, mirror, supervisee, etc.)
- [ ] Relationship-based interaction modifiers
- [ ] Trust and skepticism dynamics

### Phase 4: Community Features
- [ ] Scenario sharing and galleries
- [ ] Export transcripts to markdown
- [ ] Custom personality model plugins
- [ ] User accounts and authentication
- [ ] Public conversation gallery

### Phase 5: Advanced LLM Features
- [ ] Vision model integration for image analysis
- [ ] Streaming responses for better UX
- [ ] Response caching for cost optimization
- [ ] Multi-modal input (text + images + audio)

## 🤝 Contributing

This is an educational and experimental project. Contributions, suggestions, and feedback are welcome!

### Development Guidelines
- Follow TypeScript best practices
- Maintain type safety
- Add tests for new features
- Update documentation for significant changes
- Follow the existing code style

## 📝 License

MIT License - feel free to use and modify for your own projects.

## ⚠️ Disclaimer

This is an educational simulation tool, not a psychological assessment or diagnostic instrument. The representations are simplified models based on cognitive function theory and should not be taken as definitive descriptions of real individuals. The physics engine is an experimental approach to modeling cognitive dynamics and should be understood as a computational approximation, not a scientific model.

## 🙏 Acknowledgments

- MBTI and cognitive function theory
- Socionics Model A positional definitions
- DeepSeek for LLM API
- Supabase for database infrastructure
- Vercel for deployment platform

---

**Built with ❤️ using React, TypeScript, Tailwind CSS, DeepSeek API, and a custom Cognitive Physics Engine**
