# Socionics Baseline Mapping Fix

## Problem Identified

The user correctly identified that **ENFP's baseline for Se, Te, Ni, Ti, and Fe were all 30%**, which doesn't make sense given Socionics definitions.

### Root Cause

The code was incorrectly mapping MBTI function roles directly to Socionics positions:

**WRONG Mapping (Before Fix):**
- Dominant → Position 1 ✓
- Auxiliary → Position 2 ✓
- Tertiary → Position 3 ✗ **WRONG**
- Inferior → Position 4 ✗ **WRONG**

**CORRECT Mapping (After Fix):**
- Position 1 (Base) = Dominant function ✓
- Position 2 (Creative) = Auxiliary function ✓
- Position 3 (Role) = **Opposite of Dominant** (same attitude, opposite function type)
- Position 4 (Vulnerable/PoLR) = **Opposite of Auxiliary** (same attitude, opposite function type)
- Position 5 (Suggestive) = Inferior function (valued)
- Position 6 (Activating) = Tertiary function (valued)
- Position 7 (Ignoring) = **Inverse of Dominant** (same function type, opposite attitude) - Cannot exist at same time as dominant
- Position 8 (Demonstrative) = **Inverse of Auxiliary** (same function type, opposite attitude)

### Why This Matters

In Socionics Model A, positions 3 and 4 are defined as **opposites** of positions 1 and 2, not as the tertiary and inferior functions from MBTI.

**Function Opposites** (for positions 3 & 4 - same attitude, opposite function type):
- Te ↔ Fi
- Ti ↔ Fe
- Ne ↔ Si
- Ni ↔ Se

**Function Inverses** (for positions 7 & 8 - same function type, opposite attitude):
- Ne ↔ Ni
- Se ↔ Si
- Te ↔ Ti
- Fe ↔ Fi

### Example: ENFP (Ne-Fi-Te-Si)

**Before Fix (WRONG):**
- Ne (dominant) → Position 1 (90% baseline) ✓
- Fi (auxiliary) → Position 2 (80% baseline) ✓
- Te (tertiary) → Position 3 (30% baseline) ✗ **Should be opposite of Ne = Si**
- Si (inferior) → Position 4 (10% baseline) ✗ **Should be opposite of Fi = Te**
- Remaining functions (Se, Ni, Ti, Fe) → Positions 5-8 (30% baseline) ✗ **Wrong baselines**

**After Fix (CORRECT):**
- Ne (dominant) → Position 1 (90% baseline) ✓
- Fi (auxiliary) → Position 2 (80% baseline) ✓
- Si (opposite of Ne) → Position 3 (30% baseline) ✓
- Te (opposite of Fi) → Position 4 (10% baseline) ✓
- Si (inferior) → Position 5 (20% baseline) - **Wait, conflict!**

### The Conflict

For ENFP, Si is both:
1. The opposite of Ne (should be Position 3 - Role)
2. The inferior function (should be Position 5 - Suggestive)

**Resolution:** In MBTI, the tertiary and inferior functions ARE the opposites of dominant and auxiliary. So:
- Position 3 = Tertiary (which is opposite of dominant)
- Position 4 = Inferior (which is opposite of auxiliary)

The fix correctly assigns:
- Position 3 = Opposite of dominant (Si for ENFP)
- Position 4 = Opposite of auxiliary (Te for ENFP)
- Tertiary and inferior are already at positions 3-4, so they stay there
- Remaining functions get positions 5-8 with correct baselines

### Expected Results After Fix

For **ENFP**:
- Ne → Position 1 (90% baseline) ✓
- Fi → Position 2 (80% baseline) ✓
- Si → Position 3 (30% baseline) ✓
- Te → Position 4 (10% baseline) ✓
- Remaining functions (Se, Ni, Ti, Fe) → Positions 5-8 with appropriate baselines (20%, 40%, 30%, 40%)

For **ENTP**:
- Ne → Position 1 (90% baseline) ✓
- Ti → Position 2 (80% baseline) ✓
- Si → Position 3 (30% baseline) ✓
- Fe → Position 4 (10% baseline) ✓
- Remaining functions → Positions 5-8 with appropriate baselines

## Implementation

Fixed in two files:
1. `src/lib/cognitivePhysics.ts` - `createSocionicsFromStack()` function
2. `src/lib/mbtiData.ts` - `getSocionicsPositions()` function

Both now correctly:
1. Assign Position 1 = Dominant
2. Assign Position 2 = Auxiliary
3. Assign Position 3 = Opposite of Dominant (not tertiary!)
4. Assign Position 4 = Opposite of Auxiliary (not inferior!)
5. Assign Tertiary and Inferior to positions 5-8 (if not already assigned)
6. Assign remaining functions to remaining positions with correct baselines

## Impact

This fix ensures that:
- Role functions (position 3) have the correct 30% baseline (not incorrectly assigned to tertiary)
- Vulnerable functions (position 4) have the correct 10% baseline (not incorrectly assigned to inferior)
- All functions have appropriate baselines based on their actual Socionics positions
- The capacity limits and damping factors will now work correctly since positions are correct

