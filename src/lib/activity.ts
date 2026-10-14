import type { EnvironmentState, GateEvent, Movement, PoolId } from '../types'
import { areaOf } from './areas'
import { replay } from './poolTime'

export interface AccessChange {
  animalId: string
  /** Pools the animal could reach right after the entry. */
  access: Set<PoolId>
}

export type ActivityEntry =
  | { kind: 'move'; id: string; timestamp: number; move: Movement; access: Set<PoolId> }
  | { kind: 'gate'; id: string; timestamp: number; event: GateEvent; changes: AccessChange[] }

function sameArea(a: Set<PoolId>, b: Set<PoolId>) {
  return a.size === b.size && [...a].every((p) => b.has(p))
}

/**
 * Activity log, newest first, with the access each animal had after every entry.
 * Entries sharing a timestamp (a gate closed with side moves) are evaluated together.
 */
export function buildActivityLog(state: EnvironmentState, now: number): ActivityEntry[] {
  const entries: ActivityEntry[] = []
  replay(
    state,
    now,
    () => {},
    (before, after, items) => {
      const areaAfter = (animalId: string) => areaOf(after.positions.get(animalId)!, after.openGates)
      for (const entry of items) {
        if (entry.kind === 'move') {
          const m = entry.item
          entries.push({ kind: 'move', id: m.id, timestamp: m.timestamp, move: m, access: areaAfter(m.animalId) })
        } else {
          // Animals whose reachable pools changed with this batch.
          const changes = state.animals
            .filter((a) => before.positions.has(a.id) && after.positions.has(a.id))
            .map((a) => ({
              animalId: a.id,
              before: areaOf(before.positions.get(a.id)!, before.openGates),
              access: areaAfter(a.id),
            }))
            .filter((c) => !sameArea(c.before, c.access))
            .map(({ animalId, access }) => ({ animalId, access }))
          const g = entry.item
          entries.push({ kind: 'gate', id: g.id, timestamp: g.timestamp, event: g, changes })
        }
      }
    },
  )
  return entries.reverse()
}
