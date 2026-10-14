import { GATES, POOL_IDS } from '../data'
import type { Animal, EnvironmentState, GateEvent, GateId, Movement, PoolId } from '../types'
import { areaOf, openGatesFrom } from './areas'

export interface CompanionInfo {
  animal: Animal
  /** Sharing access (same pool, or pools joined by open gates) right now. */
  togetherNow: boolean
  /** When the current stretch of shared access began. */
  togetherSince: number | null
  /** Milliseconds of shared access since local midnight. */
  togetherTodayMs: number
}

export interface AccessToday {
  /** Milliseconds with access to each pool since local midnight. Overlaps while gates are open. */
  byPool: Record<PoolId, number>
  /** Milliseconds tracked since local midnight. */
  trackedMs: number
}

export function startOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export interface Snapshot {
  positions: Map<string, PoolId>
  openGates: Set<GateId>
}

export type LogItem = { kind: 'move'; item: Movement } | { kind: 'gate'; item: GateEvent }

function cloneSnapshot(snap: Snapshot): Snapshot {
  return { positions: new Map(snap.positions), openGates: new Set(snap.openGates) }
}

/**
 * Replays the movement and gate logs from the start of tracking, calling `visit` for each span of time
 * during which no animal moved and no gate changed (spans are not clipped to today), and `onGroup` with
 * the state before and after each batch of log entries that share a timestamp.
 */
export function replay(
  state: EnvironmentState,
  now: number,
  visit: (snap: Snapshot, start: number, end: number) => void,
  onGroup?: (before: Snapshot, after: Snapshot, items: LogItem[]) => void,
) {
  type Event = { timestamp: number; apply: (snap: Snapshot) => void; source: LogItem }
  const moves = [...state.movements].sort((a, b) => a.timestamp - b.timestamp)
  const gateEvents = [...state.gateEvents].sort((a, b) => a.timestamp - b.timestamp)

  // Starting positions: where each animal was before its first recorded move.
  const positions = new Map<string, PoolId>()
  for (const animal of state.animals) {
    positions.set(animal.id, moves.find((m) => m.animalId === animal.id)?.fromPoolId ?? animal.poolId)
  }
  // Starting gates: the opposite of each gate's first event (all closed after a reset).
  const openGates = new Set<GateId>()
  for (const gate of GATES) {
    const first = gateEvents.find((e) => e.gateId === gate.id)
    if (first && !first.open) openGates.add(gate.id)
  }

  const events: Event[] = [
    ...moves.map((m) => ({
      timestamp: m.timestamp,
      apply: (s: Snapshot) => void s.positions.set(m.animalId, m.toPoolId),
      source: { kind: 'move' as const, item: m },
    })),
    ...gateEvents.map((g) => ({
      timestamp: g.timestamp,
      apply: (s: Snapshot) => void (g.open ? s.openGates.add(g.gateId) : s.openGates.delete(g.gateId)),
      source: { kind: 'gate' as const, item: g },
    })),
  ].sort((a, b) => a.timestamp - b.timestamp)

  const snap: Snapshot = { positions, openGates }
  let t = Math.min(state.startedAt, events[0]?.timestamp ?? state.startedAt)
  for (let i = 0; i < events.length; ) {
    const ts = events[i].timestamp
    if (ts > t) visit(snap, t, ts)
    const before = onGroup ? cloneSnapshot(snap) : snap
    const group: Event[] = []
    while (i < events.length && events[i].timestamp === ts) group.push(events[i++])
    for (const event of group) event.apply(snap)
    onGroup?.(before, snap, group.map((e) => e.source))
    t = Math.max(t, ts)
  }
  if (now > t) visit(snap, t, now)
}

function overlapToday(start: number, end: number, now: number): number {
  return Math.max(0, Math.min(end, now) - Math.max(start, startOfDay(now)))
}

/** Time the animal had access to each pool today. */
export function accessToday(state: EnvironmentState, animalId: string, now: number): AccessToday {
  const byPool = Object.fromEntries(POOL_IDS.map((id) => [id, 0])) as Record<PoolId, number>
  let trackedMs = 0
  replay(state, now, (snap, start, end) => {
    const ms = overlapToday(start, end, now)
    const pool = snap.positions.get(animalId)
    if (ms === 0 || !pool) return
    trackedMs += ms
    for (const p of areaOf(pool, snap.openGates)) byPool[p] += ms
  })
  return { byPool, trackedMs }
}

/** Every other animal, with current companions first, then by shared time today. */
export function companionsFor(state: EnvironmentState, animalId: string, now: number): CompanionInfo[] {
  const others = state.animals.filter((a) => a.id !== animalId)
  const todayMs = new Map<string, number>(others.map((a) => [a.id, 0]))
  const since = new Map<string, number | null>(others.map((a) => [a.id, null]))

  replay(state, now, (snap, start, end) => {
    const pool = snap.positions.get(animalId)
    if (!pool) return
    const area = areaOf(pool, snap.openGates)
    const ms = overlapToday(start, end, now)
    for (const other of others) {
      const otherPool = snap.positions.get(other.id)
      const shared = otherPool !== undefined && area.has(otherPool)
      if (shared) {
        todayMs.set(other.id, todayMs.get(other.id)! + ms)
        if (since.get(other.id) === null) since.set(other.id, start)
      } else {
        since.set(other.id, null)
      }
    }
  })

  // "Now" comes from the current state, so a move made this instant already counts.
  const self = state.animals.find((a) => a.id === animalId)
  const currentArea = self ? areaOf(self.poolId, openGatesFrom(state.gateEvents)) : new Set<PoolId>()

  return others
    .map((other) => {
      const togetherNow = currentArea.has(other.poolId)
      return {
        animal: other,
        togetherNow,
        togetherSince: togetherNow ? (since.get(other.id) ?? now) : null,
        togetherTodayMs: todayMs.get(other.id) ?? 0,
      }
    })
    .sort((a, b) => Number(b.togetherNow) - Number(a.togetherNow) || b.togetherTodayMs - a.togetherTodayMs)
}
