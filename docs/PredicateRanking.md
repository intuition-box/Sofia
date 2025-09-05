# 🎯 Predicate Intention Ranking System

## Overview

The Predicate Ranking system automatically analyzes user browsing behaviors to suggest more precise predicates and enrich the on-chain knowledge base. It transforms passive interactions (page visits) into explicit intentions (weighted predicates).

### 🎁 Benefits
- **Automatic** : Integrates with existing tracking without intervention
- **Intelligent** : Uses attention and behavior metrics
- **Progressive** : Gradual suggestions for more precise predicates
- **On-chain ready** : Compatible with your existing triple system

---

## Technical Architecture

### 📁 Main files

```
extension/background/
├── intentionRanking.ts     # 🧠 Main ranking system
├── messageHandlers.ts      # 📨 API endpoints (modified)
├── types.ts               # 🔧 Extended types (modified)
└── behavior.ts            # 📊 Existing tracking (used)
```

### 🔗 Integration with existing system

The system leverages your already collected metrics:

```typescript
interface PageData {
  url: string
  duration?: number          // ✅ Used for scoring
  attentionScore?: number    // ✅ Used for scoring
  timestamp: number          // ✅ Used for recency
  title?: string             // ✅ Used for display
}
```

---

## 🧮 Scoring Algorithm

### Calculation factors

The intention score combines **6 weighted factors**:

| Factor | Weight | Description |
|--------|--------|-------------|
| **Frequency** | 0.8 | `log(visitCount + 1) × 0.8` |
| **Duration** | 1.2 | `min(avgDuration/5min, 2) × 1.2` |
| **Attention** | 1.5 | `attentionScore × 1.5` |
| **Predicates** | 0.5 | `Σ(count × weight) × 0.5` |
| **Recency** | 0.8 | `max(0, (7-daysSince)/7) × 0.8` |
| **Consistency** | 0.5 | `min(daysSinceFirst/30, 1) × 0.5` |

### 🏆 Predicate weighting

```typescript
const PREDICATE_WEIGHTS = {
  "has visited": 1.0,        // 📍 Basic navigation
  "is interested by": 1.5,   // 👀 Demonstrated interest
  "likes": 2.0,             // 👍 Appreciation
  "trust": 2.5,             // 🤝 Trust
  "loves": 3.0              // ❤️ Strong engagement
}
```

### 📊 Calculation example

For a domain with:
- 12 visits, 2.5 min average, attention 0.75
- Last visit 2 days ago
- First visit 15 days ago

```
Score = log(13) × 0.8 + min(2.5/5,2) × 1.2 + 0.75 × 1.5 + 1.0 × 0.5 + (5/7) × 0.8 + (15/30) × 0.5
      = 2.05 + 0.6 + 1.125 + 0.5 + 0.57 + 0.25
      = 5.095 points
```

---

## 🚀 Automatic Upgrade Suggestions

### Upgrade conditions

| To | Min visits | Avg duration | Attention | Additional condition |
|----|------------|--------------|-----------|---------------------|
| **"loves"** | 15+ | 3+ min | >80% | No existing emotional predicate |
| **"likes"** | 8+ | 1.5+ min | >60% | No "likes" or emotional predicate |
| **"is interested by"** | 4+ | - | >50% | No existing interest predicate |

### 📈 Confidence levels

```typescript
interface PredicateUpgrade {
  fromPredicate: string     // "has visited"
  toPredicate: string       // "loves"
  reason: string            // "15 visits, 3.2min average, attention 85%"
  confidence: number        // 0.9 (90% confidence)
}
```

### 💡 Suggestion example

```json
{
  "domain": "github.com",
  "upgrade": {
    "fromPredicate": "has visited",
    "toPredicate": "loves",
    "reason": "Very strong engagement: 23 visits, 4.1min average, attention 87%",
    "confidence": 0.9
  }
}
```

---

## 🔌 API and Endpoints

### New message handlers

| Type | Description | Parameters | Response |
|------|-------------|------------|----------|
| `GET_INTENTION_RANKING` | Top ranked domains | `{limit?: number}` | `IntentionRankingResult[]` |
| `GET_DOMAIN_INTENTIONS` | Domain stats | `{domain: string}` | `DomainIntention \| null` |
| `RECORD_PREDICATE` | Record manual predicate | `{url: string, predicate: string}` | `{success: boolean}` |
| `GET_UPGRADE_SUGGESTIONS` | Upgrade suggestions | `{minConfidence?: number}` | `{suggestions, globalStats}` |

### 📝 Usage examples

#### Get ranking
```typescript
chrome.runtime.sendMessage({
  type: "GET_INTENTION_RANKING",
  data: { limit: 10 }
}, (response) => {
  console.log(response.data); // Top 10 domains
});
```

#### Record manual predicate
```typescript
chrome.runtime.sendMessage({
  type: "RECORD_PREDICATE", 
  data: { 
    url: "https://github.com/user/repo",
    predicate: "loves" 
  }
}, (response) => {
  if (response.success) {
    console.log("Predicate recorded!");
  }
});
```

#### Get suggestions
```typescript
chrome.runtime.sendMessage({
  type: "GET_UPGRADE_SUGGESTIONS",
  data: { minConfidence: 0.8 }
}, (response) => {
  const { suggestions, globalStats } = response.data;
  suggestions.forEach(s => {
    console.log(`${s.domain}: ${s.upgrade.toPredicate} (${s.upgrade.confidence})`);
  });
});
```

---

## 🔄 System Integration

### Auto-tracking in handlePageDataInline

```typescript
// In messageHandlers.ts line 104
async function handlePageDataInline(data: any, pageLoadTime: number): Promise<void> {
  // ... existing processing ...
  
  // 🎯 NEW: Automatic recording for ranking
  recordPageForIntention(parsedData);
}
```

### 🧹 Automatic cleanup

The system automatically cleans old data:
- **Criteria** : More than 30 days without visit AND less than 3 visits
- **Frequency** : On demand via `cleanOldIntentionData()`

### 💾 In-memory storage

Data is stored in a `Map<string, DomainIntention>`:
- **Key** : Domain (ex: "github.com")  
- **Value** : Complete `DomainIntention` object

---

## 📊 Data Structures

### DomainIntention
```typescript
interface DomainIntention {
  domain: string
  visitCount: number
  totalDuration: number
  avgDuration: number
  maxAttentionScore: number
  lastVisit: Date
  firstVisit: Date
  predicates: Record<string, number>    // "likes": 2, "has visited": 15
  intentionScore: number                // Calculated score
  suggestedUpgrade?: PredicateUpgrade   // Current suggestion
}
```

### IntentionRankingResult
```typescript
interface IntentionRankingResult {
  domain: string
  score: number                // Intention score
  visitCount: number          // Total visits
  avgDuration: number         // Average duration in seconds
  maxAttention: number        // Max attention score (0-100%)
  daysSinceLastVisit: number  // Days since last visit
  suggestedPredicate?: string // Suggested predicate
  upgradeReason?: string      // Suggestion reason
}
```

---

## 🎨 Practical Examples

### Conceptual user interface

```
🏆 TOP INTENTIONS
┌─────────────────────────────────────────────────┐
│ 1. github.com                    Score: 8.45    │
│    23 visits • 4.1min • Attention: 87%         │
│    💡 Suggestion: "loves" (confidence: 90%)     │
│    ▶ [Apply predicate]                          │
├─────────────────────────────────────────────────┤
│ 2. stackoverflow.com             Score: 6.12    │
│    45 visits • 2.3min • Attention: 62%         │
│    💡 Suggestion: "likes" (confidence: 85%)     │
│    ▶ [Apply predicate]                          │
└─────────────────────────────────────────────────┘
```

### 🔄 Complete workflow

1. **Automatic visit** → `recordPageForIntention(pageData)`
2. **Score calculation** → Update `intentionScore`
3. **Upgrade analysis** → Generate `suggestedUpgrade`
4. **UI interface** → Display suggestions via `GET_UPGRADE_SUGGESTIONS`
5. **User action** → `RECORD_PREDICATE` + on-chain triple creation
6. **Update** → New calculation with weighted predicate

### 📈 Global metrics

```typescript
// Via getIntentionGlobalStats()
{
  totalDomains: 127,
  totalVisits: 1453, 
  avgScore: 3.24,
  topCategory: "interest"  // Dominant category
}
```

---

## 🛠️ Configuration and Maintenance

### Threshold adjustment

To modify suggestion criteria, edit in `intentionRanking.ts`:

```typescript
// Conditions for "loves" - line ~150
if (intention.visitCount >= 15 && avgDurationMinutes > 3 && intention.maxAttentionScore > 0.8) {
  // Modify these values according to your needs
}
```

### 🔧 Debugging

Available automatic logs:
- `🎯 [intentionRanking] Domain example.com: visits=5, score=2.34`
- `✨ [intentionRanking] Explicit predicate "likes" recorded for example.com`
- `🧹 [intentionRanking] Cleaned 12 old domain intentions`

### Performance

- **Complexity** : O(1) for addition, O(n log n) for ranking
- **Memory** : ~1KB per tracked domain
- **Impact** : Negligible on browsing performance

---

## 🚀 Future Improvements

### Possible enhancements

1. **Machine Learning** : Learning user preferences
2. **Semantic clustering** : Grouping by themes
3. **Temporal patterns** : Analysis of visit times/days
4. **Social signals** : Integration with bookmarks and shares
5. **Cross-device sync** : Multi-device synchronization

### Advanced metrics

```typescript
// Future metrics to integrate
interface AdvancedMetrics {
  mouseMovements: number    // Mouse activity
  copyPasteEvents: number   // Clipboard interactions  
  returnVisitPattern: 'regular' | 'sporadic' | 'intensive'
  timeOfDayPreference: 'morning' | 'afternoon' | 'evening'
  sessionDepth: number      // Pages viewed per session
}
```

---

## 📚 References

- **PREDICATES_MAPPING** : `extension/const/atomsMapping.ts`
- **PageData Types** : `extension/background/types.ts`
- **Message Bus** : `extension/lib/MessageBus.ts`
- **Triple Creation** : `extension/hooks/useCreateTripleOnChain.ts`

---

*📝 Document created on 2025-08-25 - Version 1.0*  
*🔧 Intention Ranking System - SofIA Extension*