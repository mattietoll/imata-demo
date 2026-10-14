export type PoolId = 'main' | 'north' | 'south' | 'medical'

export interface Pool {
  id: PoolId
  name: string
}

export type GateId = 'north-main' | 'main-south' | 'main-medical'

/** A passage between two adjacent pools. When open, animals in either pool can use both. */
export interface Gate {
  id: GateId
  poolA: PoolId
  poolB: PoolId
}

export interface GateEvent {
  id: string
  gateId: GateId
  open: boolean
  /** Epoch milliseconds when the gate was opened or closed. */
  timestamp: number
}

export interface Animal {
  id: string
  name: string
  species: string
  /** Single source of truth for where the animal is. */
  poolId: PoolId
  /** Epoch milliseconds when the animal entered its current pool. */
  enteredAt: number
}

export interface Movement {
  id: string
  animalId: string
  fromPoolId: PoolId
  toPoolId: PoolId
  /** Epoch milliseconds when the move was recorded. */
  timestamp: number
}

export interface EnvironmentState {
  version: number
  /** Epoch milliseconds when the animals were given their starting pools (demo start or last reset). */
  startedAt: number
  animals: Animal[]
  movements: Movement[]
  /** Gate open/close log; a gate's current state is its latest event (closed if none). */
  gateEvents: GateEvent[]
}
