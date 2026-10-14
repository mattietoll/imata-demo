import { GATE_BY_ID, GATES, POOLS } from '../data'
import type { GateEvent, GateId, PoolId } from '../types'

/** Current open gates: each gate's latest event decides; gates with no events are closed. */
export function openGatesFrom(events: GateEvent[]): Set<GateId> {
  const latest = new Map<GateId, GateEvent>()
  for (const e of events) {
    const prev = latest.get(e.gateId)
    if (!prev || e.timestamp >= prev.timestamp) latest.set(e.gateId, e)
  }
  return new Set([...latest.values()].filter((e) => e.open).map((e) => e.gateId))
}

/** All pools reachable from `poolId` through open gates (always includes the pool itself). */
export function areaOf(poolId: PoolId, openGates: Set<GateId>): Set<PoolId> {
  const area = new Set<PoolId>([poolId])
  const queue: PoolId[] = [poolId]
  while (queue.length > 0) {
    const current = queue.shift()!
    for (const gate of GATES) {
      if (!openGates.has(gate.id)) continue
      const next = gate.poolA === current ? gate.poolB : gate.poolB === current ? gate.poolA : null
      if (next && !area.has(next)) {
        area.add(next)
        queue.push(next)
      }
    }
  }
  return area
}

/** Map of every pool to its shared-access area. */
export function areasByPool(openGates: Set<GateId>): Record<PoolId, Set<PoolId>> {
  return Object.fromEntries(POOLS.map((p) => [p.id, areaOf(p.id, openGates)])) as Record<PoolId, Set<PoolId>>
}

/** The two areas a gate separates once it is closed (given the other gates' current state). */
export function sidesWhenClosed(gateId: GateId, openGates: Set<GateId>): [Set<PoolId>, Set<PoolId>] {
  const gate = GATE_BY_ID[gateId]
  const others = new Set([...openGates].filter((id) => id !== gateId))
  return [areaOf(gate.poolA, others), areaOf(gate.poolB, others)]
}

/** Pool names in map order, joined for display: "Main + North". */
export function areaLabel(area: Set<PoolId>): string {
  return POOLS.filter((p) => area.has(p.id))
    .sort((a, b) => (a.id === 'main' ? -1 : b.id === 'main' ? 1 : 0))
    .map((p) => p.name)
    .join(' + ')
}
