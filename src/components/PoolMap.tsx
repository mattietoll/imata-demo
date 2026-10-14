import { Lock, LockOpen } from 'lucide-react'
import { areaLabel } from '../lib/areas'
import { ANIMAL_ACCENTS, DEFAULT_ACCENT, GATE_BY_ID, GATES, POOL_BY_ID } from '../data'
import type { Animal, GateId, PoolId } from '../types'
import { DolphinIcon } from './DolphinIcon'
import { PoolCard } from './PoolCard'

interface PoolMapProps {
  animals: Animal[]
  animalsByPool: Record<PoolId, Animal[]>
  now: number
  selectedId: string | null
  draggingId: string | null
  onSelect: (id: string) => void
  onDragStart: (id: string) => void
  onDragEnd: () => void
  onDropAnimal: (animalId: string, poolId: PoolId) => void
  openGates: Set<GateId>
  areas: Record<PoolId, Set<PoolId>>
  onGateClick: (gateId: GateId) => void
}

/** Passage between two pools; doubles as the gate control. Wide water when open, barred when closed. */
function GatePassage({
  gateId,
  open,
  orientation,
  onToggle,
  className = '',
}: {
  gateId: GateId
  open: boolean
  orientation: 'vertical' | 'horizontal'
  onToggle: (gateId: GateId) => void
  className?: string
}) {
  const vertical = orientation === 'vertical'
  const gate = GATE_BY_ID[gateId]
  const label = `Gate between ${POOL_BY_ID[gate.poolA].name} and ${POOL_BY_ID[gate.poolB].name}: ${open ? 'open' : 'closed'}. Click to ${open ? 'close' : 'open'}.`
  return (
    <button
      type="button"
      onClick={() => onToggle(gateId)}
      aria-label={label}
      title={label}
      className={[
        'group relative hidden items-center justify-center focus-visible:outline-none sm:flex',
        'h-full w-full',
        className,
      ].join(' ')}
    >
      <span
        className={[
          'flex items-center justify-center border-sky-300',
          open ? 'pool-water' : 'bg-sky-200/80',
          vertical ? `h-[calc(100%+8px)] border-x-2 ${open ? 'w-[42%]' : 'w-5'}` : `w-[calc(100%+8px)] border-y-2 ${open ? 'h-24' : 'h-5'}`,
        ].join(' ')}
      >
        {!open && <span className={vertical ? 'h-1 w-full bg-navy-700' : 'h-full w-1 bg-navy-700'} aria-hidden />}
      </span>
      <span
        className={[
          'absolute flex size-7 items-center justify-center rounded-full shadow-sm ring-1',
          'group-hover:scale-105 group-focus-visible:ring-2 group-focus-visible:ring-teal-600',
          open ? 'bg-teal-600 text-white ring-teal-700' : 'bg-white text-navy-800 ring-slate-300',
        ].join(' ')}
        aria-hidden
      >
        {open ? <LockOpen className="size-3.5" /> : <Lock className="size-3.5" />}
      </span>
    </button>
  )
}

export function PoolMap({
  animals,
  animalsByPool,
  now,
  selectedId,
  draggingId,
  onSelect,
  onDragStart,
  onDragEnd,
  onDropAnimal,
  openGates,
  areas,
  onGateClick,
}: PoolMapProps) {
  const draggingAnimal = animals.find((a) => a.id === draggingId) ?? null
  const shared = { now, selectedId, draggingAnimal, onSelect, onDragStart, onDragEnd, onDropAnimal }
  const areaProps = (poolId: PoolId) => ({
    area: areas[poolId],
    areaAnimalCount: animals.filter((a) => areas[poolId].has(a.poolId)).length,
  })
  const gateProps = (gateId: GateId) => ({ gateId, open: openGates.has(gateId), onToggle: onGateClick })

  return (
    <div className="flex flex-col gap-4 sm:grid sm:grid-cols-[minmax(0,1.65fr)_48px_minmax(0,1fr)] sm:grid-rows-[auto_44px_auto_44px_auto] sm:gap-0">
      <PoolCard
        pool={POOL_BY_ID.north}
        animals={animalsByPool.north}
        {...areaProps('north')}
        className="sm:col-start-1 sm:row-start-1 sm:w-[82%] sm:justify-self-center"
        {...shared}
      />
      <GatePassage orientation="vertical" className="sm:col-start-1 sm:row-start-2" {...gateProps('north-main')} />

      {/* Legend sits on the "deck" beside the North Pool */}
      <aside
        aria-label="Animal legend"
        className="order-last rounded-2xl border border-slate-200 bg-white/80 p-3 sm:order-none sm:col-start-3 sm:row-start-1 sm:ml-2 sm:self-start"
      >
        <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 sm:grid-cols-1">
          {animals.map((animal) => {
            const accent = ANIMAL_ACCENTS[animal.id] ?? DEFAULT_ACCENT
            return (
              <li key={animal.id}>
                <button
                  type="button"
                  onClick={() => onSelect(animal.id)}
                  className={[
                    'flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-left hover:bg-sky-50',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600',
                    selectedId === animal.id ? 'bg-sky-50' : '',
                  ].join(' ')}
                >
                  <span className={`size-2 shrink-0 rounded-full ${accent.dot}`} aria-hidden />
                  <DolphinIcon color={accent.fill} className="h-4 w-6 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-navy-900">{animal.name}</span>
                    <span
                      className={`block truncate text-[11px] ${areas[animal.poolId].size > 1 ? 'text-teal-700' : 'text-slate-500'}`}
                    >
                      {areaLabel(areas[animal.poolId])}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </aside>

      <PoolCard
        pool={POOL_BY_ID.main}
        animals={animalsByPool.main}
        {...areaProps('main')}
        size="lg"
        className="sm:col-start-1 sm:row-start-3"
        {...shared}
      />
      <GatePassage orientation="horizontal" className="sm:col-start-2 sm:row-start-3" {...gateProps('main-medical')} />
      <PoolCard
        pool={POOL_BY_ID.medical}
        animals={animalsByPool.medical}
        {...areaProps('medical')}
        className="sm:col-start-3 sm:row-start-3 sm:self-center"
        {...shared}
      />

      <GatePassage orientation="vertical" className="sm:col-start-1 sm:row-start-4" {...gateProps('main-south')} />
      <PoolCard
        pool={POOL_BY_ID.south}
        animals={animalsByPool.south}
        {...areaProps('south')}
        className="sm:col-start-1 sm:row-start-5 sm:w-[82%] sm:justify-self-center"
        {...shared}
      />

      <div className="order-last flex flex-col gap-2 sm:order-none sm:col-start-3 sm:row-start-5 sm:ml-2 sm:justify-end">
        <section aria-label="Gates" className="rounded-2xl border border-slate-200 bg-white/80 p-3">
          <h3 className="mb-1.5 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Gates</h3>
          <ul className="space-y-1">
            {GATES.map((gate) => {
              const open = openGates.has(gate.id)
              return (
                <li key={gate.id}>
                  <button
                    type="button"
                    onClick={() => onGateClick(gate.id)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-1.5 py-1 text-left text-xs hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                  >
                    <span className="truncate text-slate-700">
                      {POOL_BY_ID[gate.poolA].name} ↔ {POOL_BY_ID[gate.poolB].name}
                    </span>
                    <span
                      className={[
                        'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                        open ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600',
                      ].join(' ')}
                    >
                      {open ? <LockOpen className="size-3" aria-hidden /> : <Lock className="size-3" aria-hidden />}
                      {open ? 'Open' : 'Closed'}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
        <p className="hidden text-[11px] text-slate-500 sm:block">
          Click a gate to open or close it. Drag a dolphin onto another pool, or click it to move.
        </p>
      </div>
    </div>
  )
}
