import { createContext, useCallback, useContext, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CheckCircle2 } from 'lucide-react'

const ToastContext = createContext(() => {})

// Only for results that happen off-screen (e.g. after navigating away).
// Everything else confirms in place.
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)

  const show = useCallback((message) => {
    const id = Date.now()
    setToast({ id, message })
    setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 3500)
  }, [])

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto flex items-center gap-2 rounded-surface bg-ghat-900 px-4 py-3 text-sm font-medium text-white shadow-raise"
            >
              <CheckCircle2 className="size-4 text-milestone" aria-hidden />
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
