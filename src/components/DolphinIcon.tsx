import { useId } from 'react'

interface DolphinIconProps {
  /** Main body color. */
  color?: string
  className?: string
  title?: string
}

/** Side-view bottlenose dolphin silhouette, facing right. */
export function DolphinIcon({ color = '#1e3a5f', className, title }: DolphinIconProps) {
  const gradientId = useId()
  return (
    <svg
      viewBox="0 0 64 40"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={color} stopOpacity="0.78" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${gradientId})`}
        d="M61 27.5C59.5 25.8 57 24.8 54.5 24.4C53.8 20.5 50.5 17.2 46 15.6C43 14.5 40 14 37.2 14C35.8 10.8 33.4 8.2 30.2 6.8C30.9 9.2 31 11.6 30.4 14.2C23.4 15.4 17.4 18.6 12.8 22.4C10.8 20.6 7.6 19.2 3.6 19.4C6 21.4 8 23.4 9.6 25.4C8.4 28.2 7.6 31 7.8 34.2C10.4 31.6 12.6 28.8 14.8 26.2C20.2 28 26.4 28.9 32.2 28.8C33.2 31.4 32.8 33.8 31.4 35.8C34.8 34.8 37.4 32 38.2 28.6C44 28 49.5 28.4 54.6 28.2C57 28.1 59.6 28 61 27.5Z"
      />
      {/* Pale belly */}
      <path
        fill="#ffffff"
        fillOpacity="0.3"
        d="M54.6 28.2C49.5 28.4 44 28 38.2 28.6L32.2 28.8C26.4 28.9 20.2 28 14.8 26.2C21 26.4 27 26.4 33 26C40 25.6 47.5 25.6 54.6 26.2C57 26.4 59 26.8 60.4 27.4C58.8 27.9 56.6 28.1 54.6 28.2Z"
      />
      {/* Mouth line */}
      <path d="M60.6 27.4C58.6 27 56.6 26.6 54.2 26.7" fill="none" stroke="#0b1f3a" strokeOpacity="0.45" strokeWidth="0.6" strokeLinecap="round" />
      <circle cx="51.4" cy="22.6" r="1.05" fill="#ffffff" />
      <circle cx="51.6" cy="22.6" r="0.5" fill="#0b1f3a" />
    </svg>
  )
}
