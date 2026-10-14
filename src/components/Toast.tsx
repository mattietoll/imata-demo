import { CheckCircle2, AlertCircle } from 'lucide-react'

export interface ToastMessage {
  id: number
  kind: 'success' | 'error'
  text: string
}

export function Toast({ toast }: { toast: ToastMessage | null }) {
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center px-4">
      {toast && (
        <div
          key={toast.id}
          role="status"
          className={[
            'toast-in flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium shadow-lg',
            toast.kind === 'success' ? 'bg-navy-900 text-white' : 'bg-white text-red-700 ring-1 ring-red-200',
          ].join(' ')}
        >
          {toast.kind === 'success' ? (
            <CheckCircle2 className="size-4 text-teal-300" aria-hidden />
          ) : (
            <AlertCircle className="size-4" aria-hidden />
          )}
          {toast.text}
        </div>
      )}
    </div>
  )
}
