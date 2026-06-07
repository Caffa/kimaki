import { describe, test, expect } from 'vitest'
import { buildPaginatedOptions, parsePaginationValue } from './paginated-select.js'

// ── buildPaginatedOptions ────────────────────────────────────────────────

describe('buildPaginatedOptions', () => {
  test('returns all options without pagination when ≤25 items', () => {
    const options = Array.from({ length: 5 }, (_, i) => ({
      label: `Option ${i}`,
      value: `val-${i}`,
    }))
    const result = buildPaginatedOptions({ allOptions: options, page: 0 })
    expect(result.options).toHaveLength(5)
    expect(result.totalPages).toBe(1)
  })

  test('paginates when >25 items', () => {
    const options = Array.from({ length: 50 }, (_, i) => ({
      label: `Option ${i}`,
      value: `val-${i}`,
    }))
    const result = buildPaginatedOptions({ allOptions: options, page: 0 })
    // Page 0: 23 items + "Next page →" nav = 24 items
    expect(result.options.length).toBeLessThanOrEqual(25)
    expect(result.totalPages).toBeGreaterThan(1)
  })

  test('last page has prev nav but no next nav', () => {
    const options = Array.from({ length: 50 }, (_, i) => ({
      label: `Option ${i}`,
      value: `val-${i}`,
    }))
    const result = buildPaginatedOptions({ allOptions: options, page: 2 })
    const hasPrev = result.options.some(o => o.value.startsWith('__page_nav:') && o.label.includes('Previous'))
    const hasNext = result.options.some(o => o.value.startsWith('__page_nav:') && o.label.includes('Next'))
    expect(hasPrev).toBe(true)
    expect(hasNext).toBe(false)
  })
})

// ── parsePaginationValue ─────────────────────────────────────────────────

describe('parsePaginationValue', () => {
  test('parses pagination sentinel values', () => {
    expect(parsePaginationValue('__page_nav:0')).toBe(0)
    expect(parsePaginationValue('__page_nav:3')).toBe(3)
    expect(parsePaginationValue('__page_nav:10')).toBe(10)
  })

  test('returns undefined for non-pagination values', () => {
    expect(parsePaginationValue('some-provider-id')).toBeUndefined()
    expect(parsePaginationValue('claude-3-opus')).toBeUndefined()
    expect(parsePaginationValue('')).toBeUndefined()
  })
})