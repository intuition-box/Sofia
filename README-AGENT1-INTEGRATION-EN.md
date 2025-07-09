# 🤖 Agent1 ↔ SOFIA Extension - Integration Guide

## 📋 Overview

The SOFIA Chrome Extension automatically captures browsing history and exposes a **complete API** for Agent1 to retrieve and analyze this data.

## 🎯 Features

### ✅ Chrome Extension (READY)
- ✅ **Automatic tracking** of navigation (all tabs)
- ✅ **Sensitive site filtering** (banks, payments, etc.)
- ✅ **Automatic categorization** (11 categories: dev, social, news, etc.)
- ✅ **Internal REST API** via `chrome.runtime.sendMessage`
- ✅ **Chrome Storage** with complete structure
- ✅ **User interface** (popup with controls)
- ✅ **JSON export** of data

### 🎯 API Available for Agent1

#### 1. **Get history**
```javascript
chrome.runtime.sendMessage(EXTENSION_ID, {
  action: 'GET_HISTORY_DATA',
  filters: {
    startDate: Date.now() - 24 * 60 * 60 * 1000, // 24h
    endDate: Date.now(),
    category: 'development',
    domain: 'github.com',
    searchQuery: 'API'
  }
}, (response) => {
  if (response.success) {
    console.log('📊 Data:', response.data)
  }
})
```

#### 2. **Recent visits**
```javascript
chrome.runtime.sendMessage(EXTENSION_ID, {
  action: 'GET_RECENT_VISITS',
  limit: 50
}, (response) => {
  console.log('🕐 Recent visits:', response.data)
})
```

#### 3. **Search history**
```javascript
chrome.runtime.sendMessage(EXTENSION_ID, {
  action: 'SEARCH_HISTORY',
  query: 'React',
  filters: { category: 'development' }
}, (response) => {
  console.log('🔍 Results:', response.data)
})
```

#### 4. **Usage statistics**
```javascript
chrome.runtime.sendMessage(EXTENSION_ID, {
  action: 'GET_STATISTICS'
}, (response) => {
  console.log('📈 Stats:', response.data)
  // topDomains, categoriesDistribution, dailyVisits, etc.
})
```

#### 5. **Control tracking**
```javascript
chrome.runtime.sendMessage(EXTENSION_ID, {
  action: 'TOGGLE_TRACKING',
  enabled: false // Pause tracking
}, (response) => {
  console.log('⏸️ Tracking:', response.enabled)
})
```

## 🚀 Installation and Usage

### Step 1: Install the extension
```bash
# In the extension/ folder
npm install
npm run build

# Load in Chrome:
# 1. Go to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked extension"
# 4. Select the dist/ folder
```

### Step 2: Get the extension ID
1. Open the extension popup
2. Go to the "Settings" tab
3. Copy the displayed Extension ID

### Step 3: Agent1 Configuration

#### Option A: Agent1 in browser
```javascript
// Agent1 script in a web page
const EXTENSION_ID = 'abcdefghijklmnopqrstuvwxyz123456' // Your ID

const client = new SofiaExtensionClient(EXTENSION_ID)
const analysis = await agent1Analysis()
console.log('🎯 Complete analysis:', analysis)
```

#### Option B: Agent1 in Node.js (via proxy server)
```javascript
// Node.js proxy server
const express = require('express')
const { createProxyServer } = require('./agent1-example.js')

// Start server on http://localhost:3001
createProxyServer()

// Agent1 makes HTTP requests to the proxy
const response = await fetch('http://localhost:3001/api/extension/history', {
  method: 'POST',
  body: JSON.stringify({ extensionId: EXTENSION_ID, filters: {} })
})
```

## 📊 Data Structure

### NavigationEntry
```typescript
{
  id: string                    // Unique identifier
  url: string                   // Full URL
  title: string                 // Page title
  domain: string                // Domain (e.g. github.com)
  timestamp: number             // Visit timestamp
  category?: string             // Auto-detected category
  visitDuration?: number        // Visit duration (ms)
  tabId?: number                // Chrome tab ID
}
```

### Automatic Categories
- **development**: GitHub, Stack Overflow, documentation
- **social**: Facebook, Twitter, LinkedIn, Reddit
- **news**: News sites, media
- **shopping**: E-commerce, Amazon, etc.
- **entertainment**: YouTube, Netflix, gaming
- **productivity**: Google Docs, Notion, Slack
- **education**: Online courses, tutorials
- **search**: Search engines
- **finance**: Banks, crypto, trading
- **blog**: Blog articles
- **documentation**: Technical docs
- **general**: Other sites

### Statistics
```typescript
{
  totalVisits: number           // Total visits
  dailyVisits: number           // Today's visits
  weeklyVisits: number          // This week's visits
  topDomains: Array<{           // Top domains
    domain: string
    visits: number
    percentage: number
  }>
  categoriesDistribution: Array<{  // Category distribution
    category: string
    visits: number
    percentage: number
  }>
  trackingEnabled: boolean      // Tracking status
  lastUpdated: number           // Last update
}
```

## 🔒 Security and Filtering

### Automatically Filtered Sensitive Sites
- Banking domains (`*.bank.*`, `*banking*`)
- Payment sites (`*paypal*`, `*payment*`)
- Private sites (`*private*`)
- Credit (`*.credit.*`)

### CORS Configuration
The extension accepts communications from:
- `localhost:*`
- `127.0.0.1:*`

## 🎯 Agent1 Analysis Examples

### 1. Work Pattern Detection
```javascript
function analyzeWorkPatterns(entries) {
  const devSites = entries.filter(e => e.category === 'development')
  const workHours = devSites.filter(e => {
    const hour = new Date(e.timestamp).getHours()
    return hour >= 9 && hour <= 17
  })
  
  return {
    workIntensity: workHours.length / devSites.length,
    topDevDomains: getTopDomains(devSites),
    recommendedBreaks: workHours.length > 50
  }
}
```

### 2. Concentration Analysis
```javascript
function analyzeConcentration(entries) {
  const sessions = groupByTimeGaps(entries, 10 * 60 * 1000) // 10min gaps
  
  return {
    averageSessionLength: calculateAverageSessionLength(sessions),
    focusScore: calculateFocusScore(sessions),
    distractionDomains: findDistractionDomains(sessions)
  }
}
```

### 3. Smart Recommendations
```javascript
function generateSmartRecommendations(patterns) {
  const recommendations = []
  
  if (patterns.workIntensity > 0.8) {
    recommendations.push({
      type: 'BREAK_REMINDER',
      message: 'You are working intensively. Take a break!',
      action: 'Schedule 15min break'
    })
  }
  
  if (patterns.topDevDomains.includes('stackoverflow.com')) {
    recommendations.push({
      type: 'LEARNING_PATH',
      message: 'Many searches detected. Here are resources:',
      resources: ['Official documentation', 'Structured tutorials']
    })
  }
  
  return recommendations
}
```

## 🔧 Debugging

### Check communication
```javascript
// Simple connection test
chrome.runtime.sendMessage(EXTENSION_ID, {
  action: 'GET_STATISTICS'
}, (response) => {
  if (chrome.runtime.lastError) {
    console.error('❌ Error:', chrome.runtime.lastError.message)
  } else if (response.success) {
    console.log('✅ Extension connected:', response.data)
  } else {
    console.error('❌ Extension error:', response.error)
  }
})
```

### Extension logs
- Open extension DevTools: `chrome://extensions/` → Details → Inspected views → Service Worker
- Popup console: Right-click on popup → Inspect

## 📈 Metrics for Agent1

### Available KPIs
- **Productivity**: Work vs entertainment sites ratio
- **Focus**: Average session duration on a domain
- **Temporal patterns**: Peak activity hours
- **Diversity**: Number of unique domains visited
- **Efficiency**: Search vs results ratio (docs, tutorials)

### Possible Alerts
- Sessions too long without breaks
- Too many distractions detected
- Repetitive searches (unresolved problem)
- Navigation outside normal hours

## 🎯 Next Steps

1. **Launch the extension** and test it
2. **Get the Extension ID** from the popup
3. **Test communication** with the `agent1-example.js` example
4. **Implement analyses** specific to Agent1
5. **Create proxy server** if needed for Node.js

---

🚀 **The extension is ready for Agent1!** All APIs are functional and documented.

## 🔍 **How to see tracking logs:**

### 1. **Reload the updated extension**
```bash
# The extension has been recompiled with new logs
# Go to chrome://extensions/
# Click the "refresh" icon of the SOFIA extension
```

### 2. **Open Service Worker console**
```
1. Go to chrome://extensions/
2. Find "SOFIA Extension"
3. Click "Details"
4. In "Inspected views" section → click "Service Worker"
5. This opens the service worker DevTools
```

### 3. **Navigate to see logs**
As soon as you navigate to sites, you'll see:

```
🚀 SOFIA Extension Service Worker started - DEBUG mode activated
📦 SOFIA Extension installed/updated
✅ History tracking enabled - Extension ready to capture

🌐 Page loaded completely:
   📍 URL: https://github.com/user/repo
   📝 Title: GitHub Repository
   🆔 Tab ID: 123
   ⏱️ Delay since last capture: 5000ms

🎯 === CAPTURE #1 ===
📊 Analysis in progress...
✅ Navigation captured successfully:
   🌐 Domain: github.com
   📂 Category: development
   🆔 ID: nav_1699123456789_abc123def
   ⏰ Timestamp: 14:30:15

📊 === REAL-TIME STATS ===
📈 Total today: 1 visits
📈 Total overall: 1 visits
📂 Categories today:
   👨‍💻 development: 1
🏆 Top domains today:
   1. github.com: 1 visits
=== END STATS ===
```

### 4. **API calls logs**
When Agent1 communicates with the extension:

```
🔌 === EXTERNAL MESSAGE RECEIVED ===
📡 Action: GET_HISTORY_DATA
🌐 Origin: http://localhost:3001
📦 Data: {action: 'GET_HISTORY_DATA', filters: {...}}
📊 Retrieving history data...
✅ 15 entries retrieved
🔍 Filters applied: {category: 'development'}
=== END EXTERNAL MESSAGE ===
```

### 5. **Popup interactions logs**
When using the popup interface:

```
💬 === INTERNAL MESSAGE ===
📨 Type: TOGGLE_TRACKING
📦 Data: {type: 'TOGGLE_TRACKING'}
🔄 Toggle tracking: ON → OFF
=== END INTERNAL MESSAGE ===
```

## 📱 **What you'll see:**

- **🎯 Real-time capture** of each navigation with detailed info
- **📊 Live statistics** after each capture (categories, top domains)
- **🔌 API communications** when Agent1 requests data
- **💬 Popup interactions** (toggle, export, reset)
- **🚫 Filtered sites** (sensitive domains blocked)
- **⚡ Performance info** (capture delays, response times)

The logs are **very detailed** and will give you complete visibility into what the extension is tracking and how Agent1 can interact with the data! 🚀 