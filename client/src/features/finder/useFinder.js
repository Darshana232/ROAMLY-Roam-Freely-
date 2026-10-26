import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api.js'

export const DEFAULTS = {
  days: 2,
  budget: 4000,
  mode: 'bus',
  travelStyle: 'solo',
  groupSize: 4,
  interests: [],
  vibe: 'any',
  avoidDarkArrival: false,
}

export function parsePrefs(params) {
  const num = (k, lo, hi) => {
    const v = Number(params.get(k))
    return Number.isFinite(v) && v >= lo && v <= hi ? Math.round(v) : DEFAULTS[k]
  }
  const oneOf = (k, list) => (list.includes(params.get(k)) ? params.get(k) : DEFAULTS[k])
  return {
    days: num('days', 1, 4),
    budget: num('budget', 500, 100000),
    mode: oneOf('mode', ['bus', 'car']),
    travelStyle: oneOf('travelStyle', ['solo', 'couple', 'friends', 'open-group']),
    groupSize: num('groupSize', 2, 12),
    interests: (params.get('interests') ?? '').split(',').filter(Boolean),
    vibe: oneOf('vibe', ['hidden', 'popular', 'any']),
    avoidDarkArrival: params.get('avoidDarkArrival') === 'true',
  }
}

export function toSearch(prefs) {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(prefs)) {
    if (k === 'groupSize' && !['friends', 'open-group'].includes(prefs.travelStyle)) continue
    if (Array.isArray(v)) {
      if (v.length) p.set(k, v.join(','))
    } else if (v !== DEFAULTS[k]) {
      p.set(k, String(v))
    }
  }
  return p.toString()
}

// Preferences live in the URL: shareable, bookmarkable, back-button friendly.
export function useFinderPrefs() {
  const [params, setParams] = useSearchParams()
  const prefs = useMemo(() => parsePrefs(params), [params])
  const update = (patch) => setParams(toSearch({ ...prefs, ...patch }), { replace: true, preventScrollReset: true })
  return [prefs, update]
}

export function useFinderResults(prefs) {
  return useQuery({
    queryKey: ['finder', prefs],
    queryFn: async () => {
      const { data } = await api.get('/destinations/search', {
        params: {
          ...prefs,
          interests: prefs.interests.join(',') || undefined,
          groupSize: ['friends', 'open-group'].includes(prefs.travelStyle) ? prefs.groupSize : undefined,
        },
      })
      return data
    },
    // Keep showing the previous ranking while the next one loads, so the list
    // re-orders in place instead of flashing to a skeleton.
    placeholderData: keepPreviousData,
  })
}
