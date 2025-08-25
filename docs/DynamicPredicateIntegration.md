# 🔄 Dynamic Predicate Integration Plan

## Overview

This document outlines the complete integration plan to transform static predicates in SofIA.json into dynamic, adaptive predicates using the Intention Ranking System.

---

## 📊 Current Situation Analysis

### Problem Identified

**Static Predicates in SofIA.json**:
```json
"🔸 Combined weighting (attention + visits):
- If attentionScore > 0.7 AND visits >= 5 → predicate = "love", "trust"  
- If attentionScore > 0.7 OR visits >= 5 → "like"
- If attentionScore > 0.3 → "are interested by"
- If attentionScore <= 0.3 or info missing → predicate = "have visited""
```

**Issues**:
- ❌ **Hardcoded rules** - No learning from user behavior
- ❌ **Limited context** - Only considers current page data
- ❌ **No historical analysis** - Ignores visit patterns over time
- ❌ **Binary logic** - Rigid thresholds without confidence levels
- ❌ **Disconnected systems** - Intention Ranking System operates independently

### Current Architecture Gap

```
┌─────────────────┐    ❌ No Connection    ┌──────────────────┐
│ Intention       │                       │ SofIA Agent      │
│ Ranking System  │ ←─────────────────────→ │ (Static Rules)   │
│ (Dynamic)       │                       │                  │
└─────────────────┘                       └──────────────────┘
```

---

## 🎯 Objectives and Vision

### Primary Goal
Transform SofIA from **static rule-based** predicate selection to **adaptive, learning-based** predicate suggestions.

### Success Criteria
- ✅ **Adaptive Predicates**: Evolution based on navigation patterns
- ✅ **Historical Context**: Leverage complete user behavior history
- ✅ **Confidence Levels**: Measured certainty for each suggestion
- ✅ **Fallback Robustness**: Graceful degradation when data is insufficient
- ✅ **Seamless Integration**: Transparent compatibility with existing system

### Expected Benefits
1. **Higher Accuracy**: Better predicate selection based on actual user intent
2. **Personalization**: Adapts to individual user behavior patterns
3. **Progressive Learning**: Improves over time with more data
4. **Context Awareness**: Considers domain-specific engagement patterns
5. **Confidence-Based Decisions**: Avoids uncertain predictions

---

## 🏗️ Technical Architecture

### New Components

#### 1. SofIA Integration Bridge
**File**: `extension/background/sofiaIntegration.ts`

**Core Functions**:
```typescript
// Main enrichment function
enrichPageDataForSofia(pageData: PageData): EnrichedPageData

// Intelligent predicate selection
determineBestPredicate(intention: DomainIntention, pageData: any): PredicateResult

// Message formatting for SofIA
generateSofiaMessage(enrichedData: EnrichedPageData): string

// Dynamic context generation
generateDynamicPredicateContext(): string
```

#### 2. Enhanced Data Structure
```typescript
interface EnrichedPageData {
  // Existing data
  url: string
  title?: string
  description?: string
  duration?: number
  attentionScore?: number
  timestamp: number
  
  // NEW: Intention data
  intentionData?: {
    visitCount: number
    avgDuration: number
    intentionScore: number
    suggestedPredicate: string
    confidence: number
    reason: string
  }
}
```

#### 3. Dynamic Configuration
```typescript
const DYNAMIC_PREDICATE_CONFIG = {
  loves: {
    minVisits: 15,
    minDuration: 180000, // 3 minutes
    minAttention: 0.8,
    minIntentionScore: 7.0
  },
  trust: {
    minVisits: 12,
    minDuration: 120000, // 2 minutes
    minAttention: 0.75,
    minIntentionScore: 6.0,
    trustedDomains: ['edu', 'gov', 'bank', 'finance']
  },
  // ... more configurations
}
```

---

## 📋 Implementation Plan

### Step 1: Create Integration Bridge
**File**: `extension/background/sofiaIntegration.ts`

**Tasks**:
- [ ] Implement `enrichPageDataForSofia()` function
- [ ] Create intelligent `determineBestPredicate()` logic
- [ ] Build `generateSofiaMessage()` formatter
- [ ] Add `generateDynamicPredicateContext()` helper
- [ ] Configure dynamic predicate thresholds
- [ ] Handle edge cases and fallbacks

**Estimated Time**: 4-6 hours

### Step 2: Modify SofIA Agent Configuration
**File**: `agent/SofIA.json`

**Changes Required**:
```json
{
  "system": "You are an intelligence specialized in semantic structuring...
  
  🎯 DYNAMIC PREDICATE SYSTEM:
  Use the provided intention analysis to determine the most appropriate predicate:
  
  📊 DECISION RULES (use in priority order):
  1. If intentionData.suggestedPredicate is provided with confidence > 0.8:
     → USE the suggested predicate directly
  
  2. If intentionData.suggestedPredicate is provided with confidence > 0.6:
     → STRONGLY CONSIDER the suggested predicate
  
  3. If no intentionData or confidence < 0.6:
     → Use fallback logic based on attentionScore
  
  ⚡ The intention analysis provides calculated recommendations based on:
  - Historical visit patterns
  - Attention scores over time  
  - Domain-specific engagement metrics
  - Progressive learning from user behavior"
}
```

**Tasks**:
- [ ] Replace hardcoded predicate logic
- [ ] Add dynamic system instructions
- [ ] Update message examples with intentionData
- [ ] Preserve existing JSON structure
- [ ] Test agent understanding of new format

**Estimated Time**: 2-3 hours

### Step 3: Enhance Message Handlers
**File**: `extension/background/messageHandlers.ts`

**Modifications**:
```typescript
// In handlePageDataInline() function
import { enrichPageDataForSofia, generateSofiaMessage } from "./sofiaIntegration"

async function handlePageDataInline(data: any, pageLoadTime: number): Promise<void> {
  // ... existing processing ...
  
  // NEW: Enrich with intention data
  const enrichedData = enrichPageDataForSofia(parsedData)
  
  // NEW: Generate enriched message
  const message = generateSofiaMessage(enrichedData)
  
  // Send enriched message to SofIA
  sendToAgent(message)
  
  // ... rest of existing logic ...
}
```

**Tasks**:
- [ ] Import integration functions
- [ ] Modify message generation flow
- [ ] Ensure backward compatibility
- [ ] Handle cases without intention data
- [ ] Test message formatting

**Estimated Time**: 1-2 hours

### Step 4: Dynamic Predicate Decision Logic

#### Priority-Based Selection:

**Priority 1: High Confidence (>0.8)**
```typescript
if (intentionData.confidence > 0.8) {
  return intentionData.suggestedPredicate // Use directly
}
```

**Priority 2: Medium Confidence (0.6-0.8)**
```typescript
if (intentionData.confidence > 0.6) {
  // Consider suggestion with validation
  return validateAndUsePredicate(intentionData.suggestedPredicate)
}
```

**Priority 3: Low Confidence (<0.6)**
```typescript
// Fallback to original logic with intention context
return fallbackPredicateLogic(pageData, intentionData)
```

### Step 5: Threshold Configuration

| Predicate | Min Visits | Min Duration | Min Attention | Min Score | Special Conditions |
|-----------|------------|--------------|---------------|-----------|-------------------|
| **"love"** | 15+ | 3+ min | >80% | >7.0 | Strong emotional engagement |
| **"trust"** | 12+ | 2+ min | >75% | >6.0 | Trusted domains (.edu, .gov) |
| **"like"** | 8+ | 1.5+ min | >60% | >4.0 | Consistent positive engagement |
| **"are interested by"** | 4+ | 30+ sec | >50% | >2.0 | Demonstrated attention |
| **"have visited"** | Any | Any | Any | Any | Default fallback |

### Step 6: Testing and Validation

**Test Scenarios**:
1. **High Engagement Site**: github.com with 20+ visits, 5+ min average
2. **Medium Engagement Site**: stackoverflow.com with 8-12 visits, 2+ min average  
3. **Low Engagement Site**: Random blog with 2-3 visits, 30 sec average
4. **Trusted Domain**: university.edu with moderate engagement
5. **New Site**: First visit with high attention score

**Validation Checks**:
- [ ] Confidence levels correctly calculated
- [ ] Predicate suggestions align with engagement patterns
- [ ] Fallback logic works without intention data
- [ ] SofIA correctly interprets enriched messages
- [ ] Performance impact is minimal

---

## 🔄 Modified Data Flow

### Current Flow (Static)
```
Page Visit → Basic PageData → Static Rules → Fixed Predicate → SofIA
```

### New Flow (Dynamic)
```
Page Visit → PageData → Intention Analysis → Enriched Data → Dynamic Predicate → SofIA
     ↓              ↓                ↓              ↓
Historical     Visit Count      Confidence     Context-Aware
Context        Avg Duration     Calculation    Decision
               Attention        
               Intention Score  
```

### Detailed New Flow

1. **Page Visited** → `recordPageForIntention()` (existing)
2. **Intention Update** → Calculate scores and suggestions (existing)  
3. **Data Enrichment** → `enrichPageDataForSofia()` (NEW)
4. **Message Generation** → `generateSofiaMessage()` (NEW)
5. **SofIA Processing** → Use `intentionData.suggestedPredicate` (NEW)
6. **Triple Creation** → Intelligent predicate selected (NEW)

---

## 🧪 Testing Strategy

### Unit Tests
- [ ] Test predicate selection logic with various scenarios
- [ ] Validate confidence calculation accuracy
- [ ] Test fallback behavior with missing data
- [ ] Verify message formatting correctness

### Integration Tests
- [ ] End-to-end flow from page visit to predicate selection
- [ ] SofIA agent response to enriched messages
- [ ] Backward compatibility with existing system
- [ ] Performance impact measurement

### User Acceptance Tests
- [ ] Predicate accuracy compared to manual assessment
- [ ] System responsiveness with dynamic predicates
- [ ] Edge case handling (new domains, insufficient data)
- [ ] Long-term learning effectiveness

---

## 📈 Success Metrics

### Quantitative Metrics
- **Predicate Accuracy**: >85% alignment with expected user intent
- **Confidence Precision**: High confidence (>0.8) predictions are >90% accurate
- **Response Time**: <50ms additional processing time
- **Coverage**: >80% of visits get meaningful intention suggestions

### Qualitative Metrics  
- **User Satisfaction**: Improved predicate relevance from user perspective
- **System Reliability**: Graceful handling of edge cases
- **Maintenance Ease**: Clear separation of concerns and modular design

---

## 🚀 Migration Strategy

### Phase 1: Development and Testing
- [ ] Implement integration bridge
- [ ] Create comprehensive test suite
- [ ] Validate with synthetic data
- [ ] Performance benchmarking

### Phase 2: Gradual Rollout
- [ ] Deploy with feature flag
- [ ] A/B test dynamic vs static predicates
- [ ] Monitor system performance
- [ ] Collect user feedback

### Phase 3: Full Migration
- [ ] Enable dynamic predicates by default
- [ ] Deprecate static predicate logic
- [ ] Update documentation
- [ ] Monitor long-term performance

### Rollback Plan
- [ ] Feature flag to revert to static predicates
- [ ] Preserved original SofIA.json logic
- [ ] Monitoring alerts for system issues
- [ ] Quick rollback procedure documented

---

## 🔧 Configuration Management

### Environment Variables
```typescript
// Feature flags
ENABLE_DYNAMIC_PREDICATES=true
CONFIDENCE_THRESHOLD=0.7
FALLBACK_TO_STATIC=true

// Thresholds (configurable)
MIN_VISITS_FOR_LOVE=15
MIN_DURATION_FOR_TRUST=120000
MIN_ATTENTION_FOR_INTEREST=0.5
```

### Runtime Configuration
```typescript
interface DynamicPredicateSettings {
  enabled: boolean
  confidenceThreshold: number
  enableFallback: boolean
  customThresholds: PredicateThresholds
  debugLogging: boolean
}
```

---

## 📚 Documentation Updates Required

### Technical Documentation
- [ ] Update API documentation with new data structures
- [ ] Document integration functions and their purposes
- [ ] Add troubleshooting guide for dynamic predicates
- [ ] Performance tuning recommendations

### User Documentation
- [ ] Explain how dynamic predicates improve accuracy
- [ ] Document new confidence-based suggestions
- [ ] Migration guide for existing users
- [ ] FAQ for dynamic predicate behavior

---

## 🎯 Next Steps

### Immediate Actions
1. **Review and approve** this integration plan
2. **Set up development environment** for testing
3. **Create feature branch** for dynamic predicates
4. **Begin implementation** of integration bridge

### Short-term Goals (1-2 weeks)
1. **Complete integration bridge** development
2. **Update SofIA.json** with dynamic logic
3. **Implement comprehensive testing** suite
4. **Performance validation** and optimization

### Long-term Goals (1-2 months)
1. **Production deployment** with feature flags
2. **User feedback collection** and analysis
3. **System optimization** based on real usage
4. **Documentation completion** and training

---

*📝 Document created on 2025-08-25*  
*🔧 Dynamic Predicate Integration Plan - SofIA Extension*