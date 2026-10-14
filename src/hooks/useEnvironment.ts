import { useCallback, useEffect, useMemo, useState } from 'react'
import { createDefaultState, GATE_BY_ID, isPoolId, POOL_BY_ID, POOLS } from '../data'
import { areasByPool, openGatesFrom, sidesWhenClosed } from '../lib/areas'
import { buildActivityLog } from '../lib/activity'
import { accessToday, companionsFor } from '../lib/poolTime'
import { loadState, saveState } from '../lib/storage'
import type { Animal, EnvironmentState, GateId, Movement, PoolId } from '../types'

export type MoveResult =
  | { ok: true; animal: Animal; movement: Movement }
  | { ok: false; reason: string }

export type GateResult = { ok: true; message: string } | { ok: false; reason: string }

function newId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/**
 * Pure move logic: returns the next state, or an error if the move is invalid.
 * Animal.poolId is the only place a location is stored, so counts and positions are always derived from it.
 */
export function applyMove(
  state: EnvironmentState,
  animalId: string,
  toPoolId: PoolId,
  now: number,
): { state: EnvironmentState; result: MoveResult } {
  const animal = state.animals.find((a) => a.id === animalId)
  if (!animal) return { state, result: { ok: false, reason: 'Animal not found.' } }
  if (!isPoolId(toPoolId)) return { state, result: { ok: false, reason: 'Unknown destination pool.' } }
  if (animal.poolId === toPoolId) {
    return { state, result: { ok: false, reason: `${animal.name} is already in that pool.` } }
  }

  const movement: Movement = { id: newId(), animalId, fromPoolId: animal.poolId, toPoolId, timestamp: now }
  const moved: Animal = { ...animal, poolId: toPoolId, enteredAt: now }

  return {
    state: {
      ...state,
      animals: state.animals.map((a) => (a.id === animalId ? moved : a)),
      movements: [...state.movements, movement],
    },
    result: { ok: true, animal: moved, movement },
  }
}

/**
 * Closing a gate splits a shared area in two. `sides` says which pool each affected animal ended up in
 * (one of the two pools the gate joins); animals whose side changed get a recorded move to that pool.
 */
export function applyCloseGate(
  state: EnvironmentState,
  gateId: GateId,
  sides: Record<string, PoolId>,
  now: number,
): { state: EnvironmentState; moved: number } {
  const gate = GATE_BY_ID[gateId]
  const [sideA, sideB] = sidesWhenClosed(gateId, openGatesFrom(state.gateEvents))
  let next = state
  let moved = 0
  for (const animal of state.animals) {
    const target = sides[animal.id]
    if (target !== gate.poolA && target !== gate.poolB) continue
    const targetSide = target === gate.poolA ? sideA : sideB
    if (targetSide.has(animal.poolId)) continue // already recorded on that side
    next = applyMove(next, animal.id, target, now).state
    moved++
  }
  return {
    state: { ...next, gateEvents: [...next.gateEvents, { id: newId(), gateId, open: false, timestamp: now }] },
    moved,
  }
}

export function useEnvironment() {
  const [state, setState] = useState<EnvironmentState>(loadState)

  // Persist every change (also writes the default state back if stored data was missing or invalid).
  useEffect(() => {
    saveState(state)
  }, [state])

  const openGates = useMemo(() => openGatesFrom(state.gateEvents), [state.gateEvents])
  const areas = useMemo(() => areasByPool(openGates), [openGates])

  const moveAnimal = useCallback(
    (animalId: string, toPoolId: PoolId): MoveResult => {
      const { state: next, result } = applyMove(state, animalId, toPoolId, Date.now())
      if (result.ok) setState(next)
      return result
    },
    [state],
  )

  const openGate = useCallback(
    (gateId: GateId): GateResult => {
      if (openGates.has(gateId)) return { ok: false, reason: 'That gate is already open.' }
      const gate = GATE_BY_ID[gateId]
      setState((s) => ({ ...s, gateEvents: [...s.gateEvents, { id: newId(), gateId, open: true, timestamp: Date.now() }] }))
      return { ok: true, message: `Gate opened: ${POOL_BY_ID[gate.poolA].name} ↔ ${POOL_BY_ID[gate.poolB].name}` }
    },
    [openGates],
  )

  const closeGate = useCallback(
    (gateId: GateId, sides: Record<string, PoolId>): GateResult => {
      if (!openGates.has(gateId)) return { ok: false, reason: 'That gate is already closed.' }
      const gate = GATE_BY_ID[gateId]
      const { state: next, moved } = applyCloseGate(state, gateId, sides, Date.now())
      setState(next)
      const suffix = moved > 0 ? ` · ${moved} ${moved === 1 ? 'move' : 'moves'} recorded` : ''
      return { ok: true, message: `Gate closed: ${POOL_BY_ID[gate.poolA].name} ↔ ${POOL_BY_ID[gate.poolB].name}${suffix}` }
    },
    [state, openGates],
  )

  const resetDemo = useCallback(() => setState(createDefaultState()), [])

  const animalsByPool = useMemo(() => {
    const groups = Object.fromEntries(POOLS.map((p) => [p.id, [] as Animal[]])) as Record<PoolId, Animal[]>
    for (const animal of state.animals) groups[animal.poolId].push(animal)
    return groups
  }, [state.animals])

  const historyFor = useCallback(
    (animalId: string, limit = 5) =>
      state.movements
        .filter((m) => m.animalId === animalId)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit),
    [state.movements],
  )

  const accessTodayFor = useCallback((animalId: string, now: number) => accessToday(state, animalId, now), [state])
  const activityLog = useCallback((now: number) => buildActivityLog(state, now), [state])
  const companionsOf = useCallback((animalId: string, now: number) => companionsFor(state, animalId, now), [state])

  return {
    animals: state.animals,
    movements: state.movements,
    gateEvents: state.gateEvents,
    openGates,
    areas,
    animalsByPool,
    moveAnimal,
    openGate,
    closeGate,
    resetDemo,
    historyFor,
    accessTodayFor,
    companionsOf,
    activityLog,
  }
}
