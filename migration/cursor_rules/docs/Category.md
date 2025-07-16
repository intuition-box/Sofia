# SOFIA - Web Categorization System

## 🎯 **Overview**

SOFIA features an **intelligent multi-level categorization system** that automatically analyzes each web visit and assigns it to a relevant category. Here's how it works:

## 🔍 **1. Automatic Capture**

```typescript
// When you visit a website:
async captureVisit(url: string, title: string, tabId?: number) {
  // 1. Domain extraction
  const domain = this.extractDomain(url);
  
  // 2. Sensitive sites filtering (banks, adult content, etc.)
  if (this.isSensitiveDomain(domain)) return null;
  
  // 3. AUTOMATIC CATEGORIZATION
  category: await this.categorizeUrl(url)
}
```

## 🧠 **2. Categorization Logic**

### **3-Step Analysis:**

**📍 Step 1: Domain Analysis**
```typescript
// Examples of rules by category:
'social': /facebook|instagram|twitter|linkedin|tiktok|discord/
'development': /github|stackoverflow|dev|programming|tech/
'shopping': /amazon|ebay|commerce|market|buy|sell/
'news': /news|journal|bbc|cnn|lemonde|figaro/
'productivity': /google|docs|notion|trello|slack|zoom/
'entertainment': /youtube|netflix|twitch|spotify|game/
```

**📍 Step 2: Full URL Analysis**
```typescript
// Specific search in URL
if (/search|query|q=/.test(fullUrl) && isSearchEngine) return 'search';
```

**📍 Step 3: Path Analysis**
```typescript
// Refinement by URL path
if (/\/blog|\/article|\/post/.test(fullUrl)) return 'blog';
if (/\/doc|\/documentation|\/api/.test(fullUrl)) return 'documentation';
```

## 📊 **3. Available Categories**

| Category | Icon | Description | Examples |
|----------|------|-------------|----------|
| `development` | 👨‍💻 | Programming, tech | GitHub, StackOverflow |
| `social` | 📱 | Social networks | Facebook, Twitter |
| `productivity` | ⚡ | Work tools | Google Docs, Notion |
| `entertainment` | 🎬 | Entertainment | YouTube, Netflix |
| `shopping` | 🛒 | E-commerce | Amazon, eBay |
| `news` | 📰 | News | Le Monde, BBC |
| `education` | 📚 | Education | Coursera, Khan Academy |
| `search` | 🔍 | Search engines | Google Search |
| `finance` | 💰 | Finance, crypto | Coinbase, banks |
| `blog` | 📝 | Blog articles | Medium, blogs |
| `documentation` | 📖 | Documentation | API docs |
| `general` | 🌐 | **Default** | Unclassified sites |

## 📈 **4. Statistics and Display**

### **Statistics Calculation:**
```typescript
// In the service worker
const categoryCounts: Record<string, number> = {};
historyData.entries.forEach(entry => {
  const category = entry.category || 'general';
  categoryCounts[category] = (categoryCounts[category] || 0) + 1;
});

// Sort by popularity with percentages
const categoriesDistribution = Object.entries(categoryCounts)
  .map(([category, visits]) => ({
    category,
    visits,
    percentage: (visits / historyData.entries.length) * 100,
  }))
  .sort((a, b) => b.visits - a.visits);
```

### **Interface Display:**
- **Dashboard**: "📂 Category Distribution" section
- **History**: Colored badge per entry
- **Visual styles**: Each category has a specific color/style

## 🛡️ **5. Ethical Filtering**

The system **automatically excludes** sensitive sites:
- Banking sites (`/.*bank.*/`, `/.*payment.*/`)
- Adult content (`/.*porn.*/`, `/.*xxx.*/`)
- Private sites (`/.*private.*/`)

### **Sensitive Domains Patterns:**
```typescript
private sensitiveDomainsPatterns = [
  // Banking and financial sites
  /.*\.bank.*/, /.*banking.*/, /.*\.credit.*/, /.*paypal.*/, /.*payment.*/, /.*private.*/,
  
  // Adult content sites
  /.*porn.*/, /.*xxx.*/, /.*sex.*/, /.*adult.*/, /.*nude.*/, /.*erotic.*/,
  /.*pornhub.*/, /.*redtube.*/, /.*xvideos.*/, /.*onlyfans.*/, // ... etc
];
```

## 🎨 **6. Visual Representation**

### **Category Icons:**
Each category has a dedicated emoji for quick visual identification:

```typescript
const getCategoryIcon = (category: string) => {
  const icons = {
    development: '👨‍💻',
    social: '📱',
    entertainment: '🎬',
    productivity: '⚡',
    news: '📰',
    shopping: '🛒',
    education: '📚',
    search: '🔍',
    finance: '💰',
    blog: '📝',
    documentation: '📖',
    general: '🌐',
  };
  return icons[category] || '🌐';
};
```

### **Category Badge Variants:**
Different visual styles for UI components:

```typescript
const getCategoryVariant = (category: string) => {
  const variants = {
    development: 'default',    // Primary blue
    social: 'secondary',       // Gray
    entertainment: 'outline',  // Outlined
    productivity: 'default',   // Primary blue
    news: 'secondary',         // Gray
    documentation: 'default',  // Primary blue
    shopping: 'outline',       // Outlined
    finance: 'default',        // Primary blue
    blog: 'secondary',         // Gray
    education: 'outline',      // Outlined
    search: 'default',         // Primary blue
    general: 'secondary',      // Gray (default)
  };
  return variants[category] || 'secondary';
};
```

## 🔄 **7. Real-time Processing**

### **Capture Flow:**
1. **Navigation Event** → User visits a website
2. **Domain Extraction** → Extract clean domain from URL
3. **Sensitivity Check** → Filter out private/sensitive content
4. **Categorization** → Multi-level analysis (domain → URL → path)
5. **Storage** → Save with category to Chrome Storage
6. **Statistics Update** → Real-time stats calculation
7. **UI Update** → Display in extension popup

### **Performance Characteristics:**
- ⚡ **Real-time**: Classification happens instantly
- 🔄 **Non-blocking**: Doesn't interfere with browsing
- 💾 **Efficient**: Lightweight regex-based matching
- 📊 **Scalable**: Can handle thousands of entries

## 🎯 **Key Features:**

✅ **Automatic**: No manual intervention required  
✅ **Intelligent**: Multi-level analysis (domain + URL + path)  
✅ **Ethical**: Filters sensitive content  
✅ **Extensible**: Easy to add new categories  
✅ **Performant**: Real-time classification  
✅ **Private**: All processing happens locally  
✅ **Visual**: Rich UI with icons and colors  
✅ **Statistical**: Detailed analytics and insights  

## 🛠️ **Extending the System**

### **Adding a New Category:**

1. **Add regex pattern** in `categorizeUrl()`:
```typescript
// Add in src/lib/history.ts
if (/music|spotify|apple-music|soundcloud/.test(domain)) {
  return 'music';
}
```

2. **Add icon** in `getCategoryIcon()`:
```typescript
// Add in src/popup/popup.tsx
case 'music':
  return '🎵';
```

3. **Add style variant** in `getCategoryVariant()`:
```typescript
// Add in src/popup/popup.tsx
case 'music':
  return 'default';
```

The system is designed to be **accurate** while respecting your **privacy**! 🔐 