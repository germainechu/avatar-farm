# Communication Architecture Plan: LLM-Powered Avatar Conversations

## 🎯 Objective

Enable avatars to communicate with each other using LLM (DeepSeek API) while maintaining their distinct MBTI personalities. Each avatar must:
- Have detailed, well-formatted prompts that encode their personality
- Access conversation memory (recent messages from other avatars)
- Respond contextually to the current topic and interaction style
- Maintain character consistency across the conversation

---

## 📋 Architecture Overview

### Current State
- ✅ Rule-based simulation engine with templates
- ✅ API endpoint (`/api/generate-message`) created but not integrated
- ✅ DeepSeek API key configured
- ❌ No LLM integration in simulation engine
- ❌ Limited conversation context utilization

### Target State
- ✅ Hybrid system: LLM mode with rule-based fallback
- ✅ Per-avatar memory system (conversation context)
- ✅ Enhanced system prompts with personality encoding
- ✅ Asynchronous message generation with proper context
- ✅ Mode toggle for LLM vs rule-based

---

## 🧠 Core Design Principles

### 1. **Memory Architecture: Conversation Context Window**

**Problem:** LLMs need conversation history to respond contextually, but token limits require efficient context management.

**Solution:** Implement a sliding window memory system:
- Each avatar receives the **last 5 messages** in the conversation
- Messages include: speaker name, content, and round number
- Format: `"[Round X] Speaker: message content"`
- This allows avatars to reference previous statements naturally

**Rationale:**
- ✅ 5 messages = ~500-800 tokens (manageable)
- ✅ Covers recent context without bloat
- ✅ Includes all participants' perspectives
- ✅ Future-proof: Can expand window or use summarization later

**Refutation/Support:**
- ❌ **Claim:** "5 messages isn't enough for longer conversations"
  - **Counter:** For MVP, 5 messages covers 1-2 rounds of context (with 2-8 avatars). This is sufficient for contextual responses. Future: Can add summarization layer.
  
- ✅ **Claim:** "Should include all messages for full context"
  - **Support:** For short simulations (4-40 rounds), full context would be 32-320 messages = too many tokens. Sliding window is the right approach.

### 2. **Prompt Design: Personality Encoding**

**Problem:** Each avatar needs a unique prompt that encodes their MBTI personality, cognitive functions, and behavior in a way the LLM can consistently follow.

**Solution:** Structured system prompt with:
```
You are [Name], an [MBTI Type] personality.

CORE IDENTITY:
- Cognitive Function Stack: [Dominant > Auxiliary > Tertiary > Inferior]
- Communication Style: [Abstractness, Emotional Focus, Structure, Temporal Focus]

CURRENT CONTEXT:
- Scenario Topic: "[topic]"
- Interaction Style: [debate/brainstorm/cooperative]
- Round: [X] of [Y]

CONVERSATION MEMORY:
[Last 5 messages with speakers]

YOUR ROLE:
- Stay in character as [MBTI Type]
- Respond naturally to the conversation
- Keep responses concise (1-3 sentences)
- Match your communication style parameters
```

**Rationale:**
- ✅ Clear structure helps LLM parse personality
- ✅ Includes all necessary context
- ✅ Easy to iterate and refine
- ✅ Future-proof: Can add more personality details later

**Refutation/Support:**
- ✅ **Claim:** "System prompts should be longer for better personality"
  - **Support:** Current prompt is ~200-300 tokens. Can expand later, but MVP needs efficiency.
  
- ❌ **Claim:** "Should include detailed cognitive function descriptions"
  - **Counter:** That adds 500+ tokens. Current approach (code + brief description) is sufficient for MVP. LLM understands MBTI from the function stack.

### 3. **Communication Flow: Round-Robin with Context**

**Problem:** Messages must be generated in sequence (round-robin), with each avatar seeing previous messages, but API calls are async.

**Solution:** Sequential async generation:
```
For each round:
  For each avatar (in order):
    1. Build conversation context (last 5 messages with speaker names)
    2. Call API or rule-based engine
    3. Wait for response
    4. Add message to history
    5. Continue to next avatar
```

**Rationale:**
- ✅ Maintains conversation order
- ✅ Each avatar sees full context up to their turn
- ✅ Can handle async API calls properly
- ✅ Simple to implement and debug

**Refutation/Support:**
- ❌ **Claim:** "Should generate all messages in parallel for speed"
  - **Counter:** Parallel generation breaks context - avatar B wouldn't see avatar A's message. Sequential is required for conversation flow.
  
- ✅ **Claim:** "Sequential will be slow with API calls"
  - **Support:** Yes, ~2-4 seconds per message. For MVP (8 avatars × 10 rounds = 80 messages = ~3-5 minutes), this is acceptable. Future: Can optimize with streaming or caching.

### 4. **Memory Format: Speaker Identification**

**Problem:** Avatars need to know WHO said WHAT to respond appropriately.

**Solution:** Format conversation history as:
```
Recent conversation:
[Round 1] The Architect: "Looking at climate change, I see deeper patterns..."
[Round 1] The Debater: "What if we approached this from multiple angles?"
[Round 2] The Architect: "The long-term implications point toward..."
...
```

**Rationale:**
- ✅ Clear speaker identification
- ✅ Round numbers provide temporal context
- ✅ Natural language format LLM understands
- ✅ Easy to parse and display

**Refutation/Support:**
- ✅ **Claim:** "Should include avatar MBTI types in memory"
  - **Support:** Good idea for future enhancement - helps avatars understand personality dynamics.
  
- ❌ **Claim:** "Should include message tags in memory"
  - **Counter:** Tags are metadata for UI. LLM doesn't need them - it infers intent from content.

### 5. **Integration Pattern: Hybrid with Fallback**

**Problem:** Need to support both LLM and rule-based modes, with graceful degradation.

**Solution:** Mode-aware message generation:
```typescript
async function generateMessage(context, useLLM = false) {
  if (useLLM) {
    try {
      return await generateLLMMessage(context);
    } catch (error) {
      console.warn('LLM failed, falling back to rule-based');
      return generateRuleBasedMessage(context);
    }
  }
  return generateRuleBasedMessage(context);
}
```

**Rationale:**
- ✅ Always works (fallback ensures reliability)
- ✅ User can choose mode
- ✅ Handles API failures gracefully
- ✅ Easy to test both paths

**Refutation/Support:**
- ✅ **Claim:** "Fallback should be automatic on any error"
  - **Support:** Exactly - this ensures users never see failures.
  
- ❌ **Claim:** "Should retry LLM calls before falling back"
  - **Counter:** For MVP, immediate fallback is simpler. Can add retry logic later.

---

## 🔧 Implementation Plan

### Phase 1: Core Infrastructure (MVP)

1. **Enhance `generateMessage` to support async LLM calls**
   - Add `useLLM` parameter
   - Create `generateLLMMessage` function
   - Implement API call with proper error handling
   - Keep existing rule-based as fallback

2. **Build conversation context formatter**
   - Create `buildConversationContext` function
   - Format last 5 messages with speaker names
   - Include round numbers

3. **Enhance system prompt builder**
   - Improve `buildSystemPrompt` in API route
   - Add conversation context integration
   - Include speaker identification in memory

4. **Update `runSimulation` to handle async**
   - Make it async function
   - Await each `generateMessage` call
   - Maintain round-robin order

5. **Add mode toggle to Scenario**
   - Add optional `useLLM` field to Scenario type
   - Update ScenarioBuilder UI with toggle
   - Pass mode to simulation engine

### Phase 2: Future Enhancements (Post-MVP)

1. **Long-term memory** (beyond 5 messages)
   - Summarize older messages
   - Add conversation summary to context

2. **Personality-aware memory**
   - Include MBTI types of other speakers
   - Help avatars understand dynamics

3. **Streaming responses** (for better UX)
   - Stream LLM responses as they generate
   - Show partial messages in UI

4. **Response caching** (cost optimization)
   - Cache similar responses
   - Reduce redundant API calls

---

## 📊 Memory Efficiency Analysis

### Token Usage Per Message Generation

**System Prompt:** ~250 tokens
- Avatar identity: 50
- Cognitive functions: 50
- Behavior parameters: 50
- Scenario context: 50
- Instructions: 50

**Conversation Context (5 messages):** ~500 tokens
- 5 messages × 100 tokens avg = 500 tokens

**User Prompt:** ~50 tokens

**Total Input:** ~800 tokens per message

**Output:** ~100 tokens (1-3 sentences)

**Total:** ~900 tokens per message

**Cost (DeepSeek):**
- Input: $0.55 per 1M tokens = $0.00044 per message
- Output: $2.19 per 1M tokens = $0.00022 per message
- **Total: ~$0.00066 per message**

**Example Simulation:**
- 4 avatars × 10 rounds = 40 messages
- Cost: 40 × $0.00066 = **$0.026 per simulation**

✅ **Highly cost-effective for MVP!**

---

## 🎯 MVP Success Criteria

1. ✅ Avatars can communicate using LLM
2. ✅ Each avatar maintains personality consistency
3. ✅ Conversations reference previous messages naturally
4. ✅ System falls back to rule-based on API failure
5. ✅ Users can toggle between LLM and rule-based modes
6. ✅ Response times acceptable (<5 seconds per message)

---

## 🔄 Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│         SimulationView Component                │
│  - Manages simulation state                     │
│  - Controls message playback                    │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│         runSimulation() [ASYNC]                 │
│  For each round:                                │
│    For each avatar (sequential):                │
│      1. Build context (history + scenario)      │
│      2. Call generateMessage()                  │
│      3. Add message to history                  │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│      generateMessage() [ASYNC]                  │
│  if (useLLM):                                   │
│    → generateLLMMessage()                       │
│  else:                                          │
│    → generateRuleBasedMessage()                 │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│     generateLLMMessage()                        │
│  1. buildConversationContext(history)           │
│  2. buildSystemPrompt(avatar, scenario, context)│
│  3. POST /api/generate-message                  │
│  4. Parse response                              │
│  5. Return Message                              │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│    /api/generate-message (Edge Function)        │
│  1. Build enhanced system prompt                │
│  2. Call DeepSeek API                           │
│  3. Parse response                              │
│  4. Determine message tag                       │
│  5. Return { content, tag }                     │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Implementation Checklist

### Core Features
- [ ] Make `generateMessage` async
- [ ] Create `generateLLMMessage` function
- [ ] Build `buildConversationContext` helper
- [ ] Enhance system prompt with conversation memory
- [ ] Update `runSimulation` to be async
- [ ] Add error handling and fallback
- [ ] Add `useLLM` flag to Scenario type
- [ ] Add toggle in ScenarioBuilder UI
- [ ] Update SimulationView to handle async generation

### Testing
- [ ] Test LLM message generation
- [ ] Test fallback to rule-based
- [ ] Test conversation context formatting
- [ ] Test with different scenario styles
- [ ] Test with different avatar combinations

### Documentation
- [ ] Update README with LLM mode instructions
- [ ] Document memory system
- [ ] Document prompt structure

---

## 💡 Key Decisions & Rationale

1. **Sequential Generation:** Required for context, acceptable latency for MVP
2. **5-Message Window:** Balance between context and token efficiency
3. **Automatic Fallback:** Ensures reliability, no user-visible failures
4. **Speaker Identification:** Critical for natural conversation flow
5. **Hybrid Architecture:** Flexibility for users, cost control, reliability

---

**Status:** ✅ Plan Complete - Ready for Implementation
**Next Step:** Implement Phase 1 features
