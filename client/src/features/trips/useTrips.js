import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api.js'

export function useTrips(filters) {
  return useQuery({
    queryKey: ['trips', filters],
    queryFn: async () => (await api.get('/trips', { params: filters })).data.trips,
  })
}

export function useTrip(id) {
  return useQuery({ queryKey: ['trip', id], queryFn: async () => (await api.get(`/trips/${id}`)).data.trip })
}

export function useMyTrips() {
  return useQuery({ queryKey: ['my-trips'], queryFn: async () => (await api.get('/trips/mine')).data })
}

export function useDestinations() {
  return useQuery({
    queryKey: ['destinations'],
    queryFn: async () => (await api.get('/destinations')).data.destinations,
    staleTime: 60 * 60_000,
  })
}

// Every trip action changes seats or request status, so refresh everything
// that shows them once it settles.
export function useTripAction(tripId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ method = 'post', path = '', body }) => (await api[method](`/trips/${tripId}${path}`, body)).data,
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['trip', tripId] })
      qc.invalidateQueries({ queryKey: ['trips'] })
      qc.invalidateQueries({ queryKey: ['my-trips'] })
      qc.invalidateQueries({ queryKey: ['alerts'] })
    },
  })
}

export function useCreateTrip() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body) => (await api.post('/trips', body)).data.trip,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trips'] })
      qc.invalidateQueries({ queryKey: ['my-trips'] })
    },
  })
}

// Polled so a host notices new requests and a traveller notices decisions
// without reloading. Refetches when the tab regains focus as well.
export function useAlerts(enabled) {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: async () => (await api.get('/trips/alerts')).data,
    enabled,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  })
}

export function useMarkAlertsSeen() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post('/trips/alerts/seen'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  })
}
