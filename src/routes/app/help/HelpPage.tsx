/**
 * HelpPage — composer for /app/help (Phase 5, HELP-01, HELP-02, D-08).
 *
 * Lists all help articles grouped by topic. Includes a live-debounced search
 * input (150ms via @mantine/hooks useDebouncedValue per D-08) that filters
 * articles by title + keywords + summary (body is NOT searched per D-08).
 *
 * Search behavior:
 *   - Empty query: render all articles via HelpList (topic-grouped).
 *   - Non-empty query with matches: render filtered articles via HelpList.
 *   - Non-empty query with zero matches: render HelpNoResultsState.
 *
 * No CRUD — Help content is static (D-09 static module, no localStorage key).
 *
 * Router note (D-07): HelpArticlePage is mounted as a flat sibling route
 * (/app/help/:slug) NOT a nested child, because this component has no
 * <Outlet /> — nesting would show both the list and detail simultaneously.
 * The flat sibling shape is explicitly accepted per UI-SPEC line 840.
 */

import { useState, useMemo, useEffect, useRef } from 'react'
import { Stack, Title } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { listHelpArticles } from '../../../help/helpArticles'
import type { HelpArticle } from '../../../help/types'
import { HelpSearchInput } from '../../../help/components/HelpSearchInput'
import { HelpList } from '../../../help/components/HelpList'
import { HelpNoResultsState } from '../../../help/components/HelpNoResultsState'

/**
 * D-08: articles whose title + keywords + summary contain `query`
 * (case-insensitive); body is NOT searched. An empty query matches everything.
 */
function searchArticles(
  articles: readonly HelpArticle[],
  query: string,
): readonly HelpArticle[] {
  const needle = query.toLowerCase().trim()
  if (needle === '') return articles
  return articles.filter((a) => {
    const haystack = `${a.title} ${a.keywords.join(' ')} ${a.summary}`.toLowerCase()
    return haystack.includes(needle)
  })
}

/** help_searched — one Help Center search and how many articles it matched. */
function trackHelpSearched(query: string, resultsCount: number): void {
  if (typeof pendo !== 'undefined') {
    pendo.track('help_searched', {
      query,
      resultsCount,
      hasResults: resultsCount > 0,
    })
  }
}

export function HelpPage(): React.JSX.Element {
  const [query, setQuery] = useState('')
  // D-08: 150ms debounce — second element (cancel fn) is intentionally unused.
  const [debouncedQuery] = useDebouncedValue(query, 150)
  // Analytics-only debounce: help_searched waits until typing pauses for
  // 700ms, so slow typing ('ta' → 'tas' → 'task') records one search instead
  // of three. The 150ms debounce above still drives the live filter.
  const [settledQuery] = useDebouncedValue(query, 700)
  // Last query sent as help_searched — de-dupes the settled-query effect and
  // the result-click flush below. Component-scoped on purpose: `query` is
  // component state, so both reset together when the page remounts.
  const lastTrackedQueryRef = useRef('')

  // Read once at mount — static module is reload-stable via faker.seed(42) (D-09).
  const allArticles = useMemo(() => listHelpArticles(), [])

  const filtered = useMemo(
    () => searchArticles(allArticles, debouncedQuery),
    [allArticles, debouncedQuery],
  )

  // Track meaningful help searches (non-empty, once typing settles).
  useEffect(() => {
    const settled = settledQuery.trim()
    if (settled === '') {
      lastTrackedQueryRef.current = ''
      return
    }
    if (settled === lastTrackedQueryRef.current) return
    lastTrackedQueryRef.current = settled
    trackHelpSearched(settled, searchArticles(allArticles, settled).length)
  }, [allArticles, settledQuery])

  // help_search_result_selected — links a search to the article it led to
  // (search click-through). Clicks while browsing the unfiltered list don't count.
  const handleArticleSelect = (article: HelpArticle, position: number) => {
    const searched = debouncedQuery.trim()
    if (searched === '') return
    // Clicked before the analytics debounce settled: record the search first
    // so every selection has a matching help_searched.
    if (searched !== lastTrackedQueryRef.current) {
      lastTrackedQueryRef.current = searched
      trackHelpSearched(searched, filtered.length)
    }
    if (typeof pendo !== 'undefined') {
      pendo.track('help_search_result_selected', {
        query: searched,
        slug: article.slug,
        topic: article.topic,
        resultPosition: position,
        resultsCount: filtered.length,
      })
    }
  }

  return (
    <Stack gap="lg">
      <Title order={3}>Help</Title>
      <HelpSearchInput value={query} onChange={setQuery} />
      {filtered.length === 0 && debouncedQuery.trim() !== ''
        ? <HelpNoResultsState query={debouncedQuery} onClear={() => setQuery('')} />
        : <HelpList articles={filtered} onArticleSelect={handleArticleSelect} />
      }
    </Stack>
  )
}
