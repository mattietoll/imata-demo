import { createDefaultState, isGateId, isPoolId, STATE_VERSION } from '../data'
import type { Animal, EnvironmentState, GateEvent, Movement } from '../types'

const STORAGE_KEY = 'environment-use:state'
const MAX_MOVEMENTS = 500

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isAnimal(value: unknown): value is Animal {
  if (!value || typeof value !== 'object') return false
  const a = value as Record<string, unknown>
  return (
    typeof a.id === 'string' &&
    typeof a.name === 'string' &&
    typeof a.species === 'string' &&
    isPoolId(a.poolId) &&
    isFiniteNumber(a.enteredAt)
  )
}

function isMovement(value: unknown): value is Movement {
  if (!value || typeof value !== 'object') return false
  const m = value as Record<string, unknown>
  return (
    typeof m.id === 'string' &&
    typeof m.animalId === 'string' &&
    isPoolId(m.fromPoolId) &&
    isPoolId(m.toPoolId) &&
    m.fromPoolId !== m.toPoolId &&
    isFiniteNumber(m.timestamp)
  )
}

function isGateEvent(value: unknown): value is GateEvent {
  if (!value || typeof value !== 'object') return false
  const g = value as Record<string, unknown>
  return typeof g.id === 'string' && isGateId(g.gateId) && typeof g.open === 'boolean' && isFiniteNumber(g.timestamp)
}

/** Returns a valid state, or null if the stored data is missing, malformed or from another version. */
export function parseState(raw: string | null): EnvironmentState | null {
  if (!raw) return null
  try {
    const data = JSON.parse(raw) as Record<string, unknown>
    if (!data || data.version !== STATE_VERSION) return null
    if (!Array.isArray(data.animals) || !Array.isArray(data.movements)) return null
    if (data.animals.length === 0 || !data.animals.every(isAnimal)) return null

    const animals = data.animals as Animal[]
    const ids = new Set(animals.map((a) => a.id))
    if (ids.size !== animals.length) return null

    // Drop history entries that are malformed or refer to unknown animals rather than failing outright.
    const movements = (data.movements as unknown[])
      .filter(isMovement)
      .filter((m) => ids.has(m.animalId))
      .slice(-MAX_MOVEMENTS)

    // Saves from before gates existed have no gate log: every gate was closed.
    const gateEvents = Array.isArray(data.gateEvents)
      ? (data.gateEvents as unknown[]).filter(isGateEvent).slice(-MAX_MOVEMENTS)
      : []

    // Older saves have no start time: the earliest known entry or move is the best estimate.
    const startedAt = isFiniteNumber(data.startedAt)
      ? data.startedAt
      : Math.min(...animals.map((a) => a.enteredAt), ...movements.map((m) => m.timestamp))

    return { version: STATE_VERSION, startedAt, animals, movements, gateEvents }
  } catch {
    return null
  }
}

export function loadState(): EnvironmentState {
  let raw: string | null = null
  try {
    raw = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    // Storage unavailable (private mode, blocked site data) — fall back to the demo state.
  }
  return parseState(raw) ?? createDefaultState()
}

export function saveState(state: EnvironmentState) {
  try {
    const trimmed = {
      ...state,
      movements: state.movements.slice(-MAX_MOVEMENTS),
      gateEvents: state.gateEvents.slice(-MAX_MOVEMENTS),
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch {
    // Ignore quota / availability errors; the in-memory state stays correct.
  }
}
