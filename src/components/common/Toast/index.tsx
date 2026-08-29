import { useEffect, useState } from 'react'
import './styles.scss'

export interface ToastMessage {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastProps {
  toast: ToastMessage
  onDismiss: (id: string) => void
  duration?: number
}

export function Toast({ toast, onDismiss, duration = 4000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true))
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onDismiss(toast.id), 300)
    }, duration)
    return () => clearTimeout(timer)
  }, [toast.id, duration, onDismiss])

  return (
    <div
      className={`toast toast--${toast.type} ${isVisible ? 'toast--visible' : ''}`}
      role="alert"
    >
      <span className="toast__icon">
        {toast.type === 'success' && '✓'}
        {toast.type === 'error' && '✕'}
        {toast.type === 'info' && 'ℹ'}
      </span>
      <span className="toast__message">{toast.message}</span>
      <button
        className="toast__close"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}

interface ToastContainerProps {
  toasts: ToastMessage[]
  onDismiss: (id: string) => void
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

// Toast manager hook
let toastListeners: Array<(toasts: ToastMessage[]) => void> = []
let currentToasts: ToastMessage[] = []

function notifyListeners() {
  toastListeners.forEach((fn) => fn([...currentToasts]))
}

export function showToast(message: string, type: ToastMessage['type'] = 'info') {
  const id = crypto.randomUUID()
  currentToasts = [...currentToasts, { id, message, type }]
  notifyListeners()
  return id
}

export function useToasts() {
  const [toasts, setToasts] = useState<ToastMessage[]>(currentToasts)

  useEffect(() => {
    toastListeners.push(setToasts)
    return () => {
      toastListeners = toastListeners.filter((fn) => fn !== setToasts)
    }
  }, [])

  const dismiss = (id: string) => {
    currentToasts = currentToasts.filter((t) => t.id !== id)
    notifyListeners()
  }

  return { toasts, dismiss }
}
