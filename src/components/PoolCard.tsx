import { Link2, Stethoscope, Waves } from 'lucide-react'
import { areaLabel } from '../lib/areas'
import { useState } from 'react'
import type { Animal, Pool, PoolId } from '../types'
import { AnimalToken } from './AnimalToken'

interface PoolCardProps {
  pool: Pool
  animals: Animal[]
  /** Pools this pool currently shares access with through open gates (includes itself). */
  area: Set<PoolId>
  areaAnimalCount: number
  now: number
  selectedId: string | null
  draggingAnimal: Animal | null
  size?: 'lg' | 'md'
  className?: string
  onSelect: (id: string) => void
  onDragStart: (id: string) => void
  onDragEnd: () => void
  onDropAnimal: (animalId: string, poolId: PoolId) => void
}

export function PoolCard({
  pool,
  animals,
  area,
  areaAnimalCount,
  now,
  selectedId,
  draggingAnimal,
  size = 'md',
  className = '',
  onSelect,
  onDragStart,
  onDragEnd,
  onDropAnimal,
}: PoolCardProps) {
  const [isOver, setIsOver] = useState(false)
  const empty = animals.length === 0
  const sharedArea = area.size > 1
  const canDrop = draggingAnimal !== null && draggingAnimal.poolId !== pool.id
  const countLabel = `${animals.length} ${animals.length === 1 ? 'animal' : 'animals'}`

  return (
    <section
      aria-label={`${pool.name}, ${countLabel}`}
      onDragOver={(e) => {
        if (!canDrop) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        setIsOver(true)
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setIsOver(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        setIsOver(false)
        const id = e.dataTransfer.getData('text/plain') || draggingAnimal?.id
        if (id) onDropAnimal(id, pool.id)
      }}
      className={[
        'pool-water relative flex flex-col rounded-[28px] border-2 p-4 transition-colors',
        size === 'lg' ? 'min-h-[230px]' : 'min-h-[164px]',
        empty ? 'pool-water--empty border-dashed border-sky-300' : 'border-sky-300/80',
        sharedArea ? 'border-solid border-teal-400/70' : '',
        canDrop ? 'border-teal-400' : '',
        isOver ? 'border-teal-500 ring-4 ring-teal-400/30' : '',
        className,
      ].join(' ')}
    >
      <header className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
        <div className="min-w-0">
          <h2 className="flex items-center gap-1.5 text-base font-semibold whitespace-nowrap text-navy-900 sm:text-lg">
            {pool.id === 'medical' && <Stethoscope className="size-4 text-teal-700" aria-hidden />}
            {pool.name}
          </h2>
        </div>
        <span
          className={[
            'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums',
            empty ? 'bg-white/60 text-slate-500' : 'bg-navy-900 text-white',
          ].join(' ')}
        >
          {countLabel}
        </span>
      </header>

      {sharedArea && (
        <p className="mt-2 inline-flex items-center gap-1.5 self-start rounded-full bg-teal-600/10 px-2.5 py-1 text-[11px] font-medium text-teal-900">
          <Link2 className="size-3.5" aria-hidden />
          Shared access: {areaLabel(area)} · {areaAnimalCount} {areaAnimalCount === 1 ? 'animal' : 'animals'}
        </p>
      )}

      {empty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 py-4 text-sky-900/45">
          <Waves className="size-6" aria-hidden />
          <span className="text-sm font-medium">
            {canDrop ? 'Drop to move here' : sharedArea ? 'None recorded here' : 'Empty'}
          </span>
        </div>
      ) : (
        <ul className="mt-3 flex flex-1 flex-wrap content-center items-center justify-center gap-2.5">
          {animals.map((animal) => (
            <li key={animal.id}>
              <AnimalToken
                animal={animal}
                now={now}
                selected={selectedId === animal.id}
                onSelect={onSelect}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
