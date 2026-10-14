import type { Animal, EnvironmentState, Gate, GateId, Pool, PoolId } from './types'

export const STATE_VERSION = 1

export const POOLS: Pool[] = [
  { id: 'north', name: 'North' },
  { id: 'main', name: 'Main' },
  { id: 'medical', name: 'Medical' },
  { id: 'south', name: 'South' },
]

export const GATES: Gate[] = [
  { id: 'north-main', poolA: 'north', poolB: 'main' },
  { id: 'main-south', poolA: 'main', poolB: 'south' },
  { id: 'main-medical', poolA: 'main', poolB: 'medical' },
]

export const GATE_BY_ID: Record<GateId, Gate> = Object.fromEntries(GATES.map((g) => [g.id, g])) as Record<GateId, Gate>

export function isGateId(value: unknown): value is GateId {
  return typeof value === 'string' && GATES.some((g) => g.id === value)
}

export const POOL_IDS = POOLS.map((p) => p.id)

export const POOL_BY_ID: Record<PoolId, Pool> = Object.fromEntries(
  POOLS.map((p) => [p.id, p]),
) as Record<PoolId, Pool>

export function isPoolId(value: unknown): value is PoolId {
  return typeof value === 'string' && (POOL_IDS as string[]).includes(value)
}

/** Starting roster for the demo. */
const DEFAULT_ROSTER: Omit<Animal, 'enteredAt'>[] = [
  { id: 'TT-0142', name: 'Fin Diesel', species: 'Bottlenose dolphin', poolId: 'main' },
  { id: 'TT-0157', name: 'Splash Gordon', species: 'Bottlenose dolphin', poolId: 'main' },
  { id: 'TT-0163', name: 'Swim Shady', species: 'Bottlenose dolphin', poolId: 'north' },
  { id: 'TT-0171', name: 'Karen', species: 'Bottlenose dolphin', poolId: 'medical' },
]

/** Per-animal accent so each dolphin is easy to pick out on the map and in the legend. */
export const ANIMAL_ACCENTS: Record<string, { ring: string; dot: string; fill: string }> = {
  'TT-0142': { ring: 'ring-teal-500', dot: 'bg-teal-500', fill: '#0f766e' },
  'TT-0157': { ring: 'ring-sky-500', dot: 'bg-sky-500', fill: '#0369a1' },
  'TT-0163': { ring: 'ring-indigo-400', dot: 'bg-indigo-400', fill: '#3730a3' },
  'TT-0171': { ring: 'ring-amber-400', dot: 'bg-amber-400', fill: '#1e3a5f' },
}

export const DEFAULT_ACCENT = { ring: 'ring-slate-400', dot: 'bg-slate-400', fill: '#334155' }

export function createDefaultState(now: number = Date.now()): EnvironmentState {
  return {
    version: STATE_VERSION,
    startedAt: now,
    animals: DEFAULT_ROSTER.map((a) => ({ ...a, enteredAt: now })),
    movements: [],
    gateEvents: [],
  }
}
