import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api.js'

// The server is the source of truth for the session (httpOnly cookie), so the
// client only ever asks "who am I?" and caches the answer.
export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => (await api.get('/auth/me')).data.user,
    staleTime: 5 * 60_000,
  })
}

export function useAuthMutation(path) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body) => (await api.post(`/auth/${path}`, body)).data.user,
    onSuccess: (user) => {
      // Anything cached for the previous user (or anonymous) is now wrong.
      qc.removeQueries({ predicate: (q) => q.queryKey[0] !== 'me' })
      qc.setQueryData(['me'], user)
    },
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSuccess: () => {
      qc.clear()
      qc.setQueryData(['me'], null)
    },
  })
}
