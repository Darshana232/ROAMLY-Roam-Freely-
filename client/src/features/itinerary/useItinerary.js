import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api.js'

export function useDraft(slug, days, mode, enabled = true) {
  return useQuery({
    queryKey: ['draft', slug, days, mode],
    queryFn: async () => (await api.get('/itineraries/draft', { params: { destination: slug, days, mode } })).data,
    enabled,
    staleTime: Infinity,
  })
}

// Times and warnings always come from the server's planner, so the editor
// never shows a schedule the rules wouldn't produce.
export function usePreview(slug, days, mode, plan) {
  return useQuery({
    queryKey: ['preview', slug, days, mode, plan],
    queryFn: async () => (await api.post('/itineraries/preview', { destination: slug, days, mode, plan })).data,
    enabled: Boolean(plan && plan.length === days),
    placeholderData: keepPreviousData,
    staleTime: Infinity,
  })
}

export function useMyPlans() {
  return useQuery({ queryKey: ['plans'], queryFn: async () => (await api.get('/itineraries')).data.itineraries })
}

export function usePlan(id) {
  return useQuery({ queryKey: ['plan', id], queryFn: async () => (await api.get(`/itineraries/${id}`)).data.itinerary })
}

export function useSavePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }) =>
      id ? (await api.patch(`/itineraries/${id}`, body)).data.itinerary : (await api.post('/itineraries', body)).data.itinerary,
    onSuccess: (itinerary) => {
      qc.setQueryData(['plan', itinerary.id], itinerary)
      qc.invalidateQueries({ queryKey: ['plans'] })
    },
  })
}

export function useDeletePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`/itineraries/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plans'] }),
  })
}

// An unsaved plan survives the trip to the login page and back.
const key = (slug) => `roamly:draft:${slug}`
export function stashDraft(slug, value) {
  try {
    sessionStorage.setItem(key(slug), JSON.stringify(value))
  } catch {
    // storage unavailable (private mode): the draft just won't be restored
  }
}
export function takeDraft(slug) {
  try {
    const raw = sessionStorage.getItem(key(slug))
    sessionStorage.removeItem(key(slug))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
