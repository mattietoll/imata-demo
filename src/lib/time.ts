const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** "<1 min", "12 min", "1 hr 25 min", "3 hr", "2 days 4 hr" */
export function formatDuration(ms: number): string {
  const safe = Math.max(0, ms)
  if (safe < MINUTE) return '<1 min'

  const days = Math.floor(safe / DAY)
  const hours = Math.floor((safe % DAY) / HOUR)
  const minutes = Math.floor((safe % HOUR) / MINUTE)

  if (days > 0) {
    return hours > 0 ? `${days} ${days === 1 ? 'day' : 'days'} ${hours} hr` : `${days} ${days === 1 ? 'day' : 'days'}`
  }
  if (hours > 0) return minutes > 0 ? `${hours} hr ${minutes} min` : `${hours} hr`
  return `${minutes} min`
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/** Local clock time, with the date added when it isn't today. */
export function formatTimestamp(ts: number, now: number = Date.now()): string {
  const date = new Date(ts)
  const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  if (isSameDay(date, new Date(now))) return time
  const day = date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  return `${day}, ${time}`
}
