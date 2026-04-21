/**
 * Preview all atom metadata (descriptions, images) without creating anything.
 * Uses handwritten descriptions from atom-descriptions.mjs.
 *
 * Usage: node scripts/preview-atoms.mjs
 */

import { readFileSync, existsSync } from 'fs'
import { TOPIC_DESCRIPTIONS, CATEGORY_DESCRIPTIONS, PLATFORM_DESCRIPTIONS } from './atom-descriptions.mjs'

const FAVICONS_DIR = 'public/favicons'

// ── Topics ──

const TOPICS = [
  { id: 'tech-dev', label: 'Tech & Dev' },
  { id: 'design-creative', label: 'Design & Visual Arts' },
  { id: 'music-audio', label: 'Music & Audio' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'web3-crypto', label: 'Web3 & Crypto' },
  { id: 'science', label: 'Science & Knowledge' },
  { id: 'sport-health', label: 'Sport & Health' },
  { id: 'video-cinema', label: 'Video & Cinema' },
  { id: 'entrepreneurship', label: 'Entrepreneurship & Business' },
  { id: 'performing-arts', label: 'Performing Arts' },
  { id: 'nature-environment', label: 'Nature & Environment' },
  { id: 'food-lifestyle', label: 'Food, Fashion & Lifestyle' },
  { id: 'literature', label: 'Literature & Writing' },
  { id: 'personal-dev', label: 'Personal Development' },
]

// ── Parse taxonomy ──

function parseCategories() {
  const content = readFileSync('src/config/taxonomy.ts', 'utf8')
  const categories = []

  const topicRegex = /id:\s*"([^"]+)",\s*\n\s*label:\s*"([^"]+)",\s*\n\s*icon:/g
  let topicMatch
  const topicPositions = []

  while ((topicMatch = topicRegex.exec(content)) !== null) {
    topicPositions.push({ id: topicMatch[1], label: topicMatch[2], pos: topicMatch.index })
  }

  for (let i = 0; i < topicPositions.length; i++) {
    const topic = topicPositions[i]
    const start = topic.pos
    const end = i + 1 < topicPositions.length ? topicPositions[i + 1].pos : content.length
    const topicBlock = content.substring(start, end)

    const catRegex = /{\s*\n\s*id:\s*"([^"]+)",\s*\n\s*label:\s*"([^"]+)",/g
    let catMatch

    while ((catMatch = catRegex.exec(topicBlock)) !== null) {
      const catId = catMatch[1]
      const catLabel = catMatch[2]
      if (catId === topic.id) continue

      const afterCat = topicBlock.substring(catMatch.index, catMatch.index + 1200)
      // Only match categories (have niches: property), not niches themselves
      // A niche is inside a niches array, so `]` (closing the array) appears before the next `niches:`
      const nichesPos = afterCat.indexOf('niches:')
      const closingBracket = afterCat.indexOf(']')
      if (nichesPos === -1 || (closingBracket !== -1 && closingBracket < nichesPos)) continue

      categories.push({ id: catId, label: catLabel, topicId: topic.id, topicLabel: topic.label })
    }
  }
  return categories
}

// ── Parse platforms ──

function parsePlatforms() {
  const content = readFileSync('src/config/platformCatalog.ts', 'utf8')
  const platforms = []
  const idRegex = /id:\s*"([^"]+)"/g
  let match

  while ((match = idRegex.exec(content)) !== null) {
    const id = match[1]
    const pos = match.index
    const block = content.substring(pos, pos + 1000)

    const nameMatch = block.match(/name:\s*"([^"]+)"/)
    const websiteMatch = block.match(/website:\s*"([^"]+)"/)

    const name = nameMatch?.[1]
    if (!name) continue

    const website = websiteMatch?.[1] || ''
    const hasFavicon = existsSync(`${FAVICONS_DIR}/${id}.png`)

    platforms.push({ id, name, website, hasFavicon })
  }
  return platforms
}

// ── Output ──

let missingDescs = []

console.log('='.repeat(80))
console.log('  TOPICS (14)')
console.log('='.repeat(80))
for (const t of TOPICS) {
  const desc = TOPIC_DESCRIPTIONS[t.id]
  console.log(`\n  name:  ${t.label}`)
  console.log(`  desc:  ${desc || '⚠ MISSING'}`)
  if (!desc) missingDescs.push(`topic:${t.id}`)
}

console.log('\n')
console.log('='.repeat(80))
console.log('  CATEGORIES')
console.log('='.repeat(80))

const categories = parseCategories()
let currentTopic = ''
for (const cat of categories) {
  if (cat.topicLabel !== currentTopic) {
    currentTopic = cat.topicLabel
    console.log(`\n  ── ${currentTopic} ──`)
  }
  const desc = CATEGORY_DESCRIPTIONS[cat.id]
  console.log(`\n  name:  ${cat.label}`)
  console.log(`  desc:  ${desc || '⚠ MISSING'}`)
  if (!desc) missingDescs.push(`category:${cat.id}`)
}

console.log(`\n  Total categories: ${categories.length}`)

console.log('\n')
console.log('='.repeat(80))
console.log('  PLATFORMS')
console.log('='.repeat(80))

const platforms = parsePlatforms()
for (const p of platforms) {
  const desc = PLATFORM_DESCRIPTIONS[p.id]
  console.log(`\n  name:    ${p.name}`)
  console.log(`  desc:    ${desc || '⚠ MISSING'}`)
  console.log(`  image:   ${p.hasFavicon ? `public/favicons/${p.id}.png → IPFS` : '⚠ NO FAVICON'}`)
  console.log(`  url:     ${p.website}`)
  if (!desc) missingDescs.push(`platform:${p.id}`)
}

console.log(`\n  Total platforms: ${platforms.length}`)
console.log(`  With favicon: ${platforms.filter(p => p.hasFavicon).length}`)
console.log(`  Missing favicon: ${platforms.filter(p => !p.hasFavicon).map(p => p.id).join(', ') || '(none)'}`)

// ── Summary ──

console.log('\n')
console.log('='.repeat(80))
console.log('  SUMMARY')
console.log('='.repeat(80))
console.log(`  Topics:     ${TOPICS.length} (${TOPICS.length - missingDescs.filter(d => d.startsWith('topic:')).length} with desc)`)
console.log(`  Categories: ${categories.length} (${categories.length - missingDescs.filter(d => d.startsWith('category:')).length} with desc)`)
console.log(`  Platforms:  ${platforms.length} (${platforms.length - missingDescs.filter(d => d.startsWith('platform:')).length} with desc)`)
console.log(`  Total:      ${TOPICS.length + categories.length + platforms.length} atoms`)

if (missingDescs.length > 0) {
  console.log(`\n  ⚠ ${missingDescs.length} MISSING descriptions:`)
  for (const d of missingDescs) {
    console.log(`    - ${d}`)
  }
}
