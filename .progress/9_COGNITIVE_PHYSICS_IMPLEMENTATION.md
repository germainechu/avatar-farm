# Cognitive Physics Engine Implementation Plan

## Overview

This document tracks the implementation of the cognitive physics engine that will power LLM-driven avatars with physics-based cognitive function activation dynamics.

## Architecture Decision

**Approach:** Hybrid system where:
1. Physics engine computes activation states and forces
2. LLM prompt incorporates physics state as guidance
3. Post-generation analysis validates and updates physics state

This maintains LLM quality while ensuring cognitive consistency.

---

## Implementation Phases

### Phase 1: Core Physics Engine Module ✅ COMPLETE
**Status:** Completed

**Goal:** Create `src/lib/cognitivePhysics.ts` with:
- [x] Type definitions for physics state
- [x] Model A position mapping utilities
- [x] Baseline activation computation from Model A
- [x] Core update law: `a_i(t+1) = b_i + α(a_i - b_i) + γ_ctx F_ctx + γ_soc F_soc + λ_c C(a_i - b_i)`
- [x] Context force computation
- [x] Social force computation
- [x] Coupling matrix and coupling term
- [x] Relationship dynamics (affinity/tension updates)
- [x] State initialization and management

**Files created:**
- `src/lib/cognitivePhysics.ts` - Main physics engine (600+ lines)

**Files modified:**
- `src/types/index.ts` - Added physics-related types (ModelAPosition, ActivationVector, RelationshipState, AvatarPhysicsState, PhysicsParameters, PhysicsState, ContextTag)

**Implementation Details:**
- Implemented all core physics engine functions:
  - `createSocionicsFromStack()` - Maps MBTI function stack to Socionics positions
  - `computeBaseline()` - Computes baseline activation from Socionics positions
  - `computeContextForce()` - Computes context force from tags
  - `computeSocialForce()` - Computes social force from relationships
  - `updateActivation()` - Core update law implementation
  - `updateRelationship()` - Relationship dynamics (affinity/tension)
  - `initializePhysicsState()` - Initializes state for simulation
  - `updatePhysicsStateAfterMessage()` - Updates state after each message
- Added coupling matrix for function pairs (Te↔Fi, Ti↔Fe, Ne↔Si, Ni↔Se)
- Implemented compatibility kernel K_ij(f) for relationship dynamics
- Added context tag detection from scenario topics
- All functions are fully typed and ready for integration
- Renamed all "Model A" references to "Socionics positional definitions"

---

### Phase 2: Socionics Integration ✅ COMPLETE
**Status:** Completed

**Goal:** Extend avatar generation to include Socionics positional definitions

**Tasks:**
- [x] Add Socionics position mapping to `src/lib/mbtiData.ts`
- [x] Update `Avatar` type to include Socionics data
- [x] Create function to map MBTI types to Socionics positions
- [x] Update `generateAvatars()` to include Socionics positions

**Files modified:**
- `src/types/index.ts` - Added `socionicsPositions` to Avatar type
- `src/lib/mbtiData.ts` - Added `getSocionicsPositions()` function with complete MBTI→Socionics mapping
- `src/lib/avatars.ts` - Updated `generateAvatars()` to include Socionics positions
- `src/lib/cognitivePhysics.ts` - Updated to use stored Socionics positions when available

**Implementation Details:**
- Implemented `getSocionicsPositions()` function that maps all 16 MBTI types to complete Socionics positions
- Maps function stack roles to positions: dominant→1, auxiliary→2
- Maps positions 3-4 using opposite function relationships (same attitude, opposite function type)
- Maps positions 5-6 to tertiary and inferior functions (valued positions)
- Maps positions 7-8 using inverse function relationships (same function type, opposite attitude)
  - Position 7 (Ignoring) = Inverse of Dominant - cannot exist at same time as dominant
  - Position 8 (Demonstrative) = Inverse of Auxiliary
- All avatars now have `socionicsPositions` stored in their data structure
- Physics engine uses stored positions when available, falls back to computation if missing

---

### Phase 3: Prompt Integration ✅ COMPLETE
**Status:** Completed

**Goal:** Incorporate physics state into LLM prompts

**Tasks:**
- [x] Modify `buildSystemPrompt()` in `api/generate-message.ts`
- [x] Add current activation levels to prompt
- [x] Include relationship context (affinity/tension)
- [x] Add comprehensive cognitive function definitions to master prompt
- [x] Provide activation-based response guidance
- [x] Implement token-efficient formatting (only significant deviations)

**Files modified:**
- `api/generate-message.ts` - Enhanced prompt builder with:
  - Master prompt with comprehensive function definitions (once per conversation)
  - Individual physics state guidance (when state deviates significantly)
  - Relationship context (only significant relationships)
  - Helper functions for formatting activation and relationship guidance
- `src/lib/simulationEngine.ts` - Integrated physics state:
  - Initialize physics state at simulation start
  - Pass physics state to API calls
  - Update physics state after each message
  - Restore physics state for continuation scenarios

**Implementation Details:**
- Master prompt includes detailed definitions of all 8 cognitive functions (Te, Ti, Fe, Fi, Se, Si, Ne, Ni)
- Master prompt explains cognitive state system (activation levels 0-1, high/moderate/low thresholds)
- Individual prompts include physics state only when there are significant deviations (0.15 threshold, relative for low baselines)
- Relationship guidance only includes significant relationships (affinity >0.7 or <0.3, tension >0.4)
- **Constraint:** affinity + tension = 1.0 (100%) - values are normalized after each update
- Token-efficient: Master prompt ~500 tokens once, individual guidance ~100-150 tokens only when needed
- Physics state is initialized at simulation start and updated after each message

---

### Phase 4: Simulation Loop Integration ✅ MOSTLY COMPLETE
**Status:** Completed (persistence pending)

**Goal:** Integrate physics engine into simulation flow

**Tasks:**
- [x] Initialize physics state at simulation start
- [x] Update state after each message generation
- [x] Pass physics state between rounds
- [x] Handle user interjections in physics context
- [ ] Persist state for continuation scenarios (TODO: Phase 4 enhancement)

**Files modified:**
- `src/lib/simulationEngine.ts` - Integrated physics updates:
  - `runSimulation()`: Initializes physics state at start
  - `generateLLMMessage()`: Extracts and passes physics state to API
  - `generateLLMMessage()`: Updates physics state after message generation
  - `continueSimulation()`: Restores physics state from existing messages
  - `interjectAndContinue()`: Handles physics state with user interjections
- `src/lib/storage.ts` - TODO: Add physics state persistence (future enhancement)

**Implementation Details:**
- Physics state is initialized using `initializePhysicsState()` at simulation start
- State is updated after each message using `updatePhysicsStateAfterMessage()`
- For continuation scenarios, physics state is restored by replaying existing messages
- User interjections are excluded from physics state updates (they don't affect avatar activations)
- Physics state is passed through the MessageContext interface to API calls
- **Console logging added** for monitoring avatar states:
  - Initial state logged when physics state is initialized
  - State updates logged after each message (showing significant changes only)
  - Full state summary logged after each round completion
  - Final state summary logged at simulation completion
  - State restoration logged when continuing simulations
  - Logs include: activation levels (with visual bars), baseline comparisons, top functions, relationship states (affinity/tension), context tags

---

### Phase 5: Context Force Mapping
**Status:** Pending

**Goal:** Map scenario topics to context forces

**Tasks:**
- [ ] Create context tag detection from scenario topics
- [ ] Implement context-to-function mapping
- [ ] Compute F_ctx(t) based on current context
- [ ] Update context as conversation evolves

**Files to create/modify:**
- `src/lib/cognitivePhysics.ts` - Add context mapping
- Potentially new file for context detection

---

### Phase 6: Testing & Validation
**Status:** Pending

**Goal:** Ensure physics engine works correctly

**Tasks:**
- [ ] Test activation state updates
- [ ] Verify relationship dynamics
- [ ] Validate force computations
- [ ] Check state persistence
- [ ] Test edge cases (empty conversations, single avatar, etc.)

---

## Technical Details

### Global Parameters (MVP)
```typescript
const PHYSICS_PARAMS = {
  alpha: 0.7,        // Persistence around baseline
  gamma_ctx: 0.3,    // Context force strength
  gamma_soc: 0.4,    // Social force strength
  lambda_c: 0.2,     // Coupling strength
  eta_ten: 0.1,      // Tension build rate
  rho_ten: 0.05,     // Tension decay rate
  eta_aff: 0.1,      // Affinity build rate
  rho_aff: 0.05,     // Affinity decay rate
  k_aff: 0.5,        // Affinity influence on social force
  k_ten: 0.3,        // Tension influence on social force
};
```

### Model A Position Table
```typescript
const MODEL_A_BASELINES = {
  1: { baseline: 0.9, capacity: 1.0 },  // Base
  2: { baseline: 0.8, capacity: 0.9 },  // Creative
  3: { baseline: 0.3, capacity: 0.5 },  // Role
  4: { baseline: 0.1, capacity: 0.2 },  // Vulnerable
  5: { baseline: 0.2, capacity: 0.3 },  // Suggestive
  6: { baseline: 0.4, capacity: 0.6 },  // Activating
  7: { baseline: 0.3, capacity: 0.7 },  // Ignoring
  8: { baseline: 0.4, capacity: 0.8 },  // Demonstrative
};
```

### Coupling Matrix
Pairs: Te↔Fi, Ti↔Fe, Ne↔Si, Ni↔Se

---

## Progress Log

### 2024-12-XX - Phase 1 Completed ✅
- Created implementation plan document
- Implemented core physics engine module (`src/lib/cognitivePhysics.ts`)
- Added all physics-related types to `src/types/index.ts`
- Implemented all core functions:
  - Socionics position mapping
  - Baseline computation
  - Context force computation
  - Social force computation
  - Coupling matrix and term
  - Relationship dynamics
  - State initialization and updates
- Renamed "Model A" to "Socionics positional definitions" throughout codebase

### 2024-12-XX - Phase 2 Completed ✅
- Implemented `getSocionicsPositions()` in `src/lib/mbtiData.ts`
- Added complete MBTI→Socionics mapping for all 16 types
- Updated `Avatar` type to include optional `socionicsPositions` field
- Updated `generateAvatars()` to compute and store Socionics positions
- Updated physics engine to use stored positions when available
- All avatars now have Socionics positions pre-computed
- Ready for Phase 3: Prompt Integration

### 2024-12-XX - Phase 3 Completed ✅
- Implemented comprehensive cognitive function definitions in master prompt
- Added physics state guidance to individual prompts (only when state deviates)
- Created helper functions for formatting activation and relationship guidance
- Integrated physics state into simulation engine (initialization, updates, passing to API)
- Master prompt includes detailed function definitions (~500 tokens, once per conversation)
- Individual prompts include physics state only when significant deviations occur (~100-150 tokens)
- Token-efficient implementation: only includes guidance when meaningful
- Physics state is initialized at simulation start and updated after each message
- Ready for Phase 5: Context Force Mapping

### 2024-12-XX - Phase 4 Completed ✅ (Persistence Pending)
- Integrated physics state initialization in `runSimulation()`
- Physics state updates after each message generation
- Physics state passed through MessageContext to API calls
- Continuation scenarios restore physics state by replaying messages
- User interjections handled correctly (excluded from physics updates)
- TODO: Add physics state persistence to storage for true continuation

### 2024-12-XX - Console Logging Added ✅
- Added comprehensive console logging for monitoring avatar physics states
- `logPhysicsState()` - Logs complete state for all avatars with activation levels, relationships
- `logPhysicsUpdate()` - Logs significant state changes after each message
- Logging integrated into:
  - Physics state initialization (initial state)
  - Message updates (significant changes only)
  - Round completions (full state summary)
  - Simulation completion (final state summary)
  - State restoration (when continuing simulations)
- Logs include visual bars for activation levels, baseline comparisons, top functions, relationship states
- Logging can be disabled during state restoration to avoid spam

