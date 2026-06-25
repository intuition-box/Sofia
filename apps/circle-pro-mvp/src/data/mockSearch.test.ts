import { describe, expect, test } from 'vitest'
import { searchMock } from './mockSearch'

describe('searchMock', () => {
  test('matches a single word', () => {
    const r = searchMock('notion')
    expect(r.tools.some((t) => /notion/i.test(t.title))).toBe(true)
  })

  test('tokenises multi-word queries (matches ANY token)', () => {
    // "notion" hits a tool; "absentword" hits nothing → union still finds Notion.
    const r = searchMock('notion absentword')
    expect(r.tools.some((t) => /notion/i.test(t.title))).toBe(true)
  })

  test('returns empty groups when nothing matches', () => {
    const r = searchMock('zzzznevermatcheszzzz')
    expect(r.tools).toHaveLength(0)
    expect(r.memory).toHaveLength(0)
    expect(r.skills).toHaveLength(0)
  })
})
