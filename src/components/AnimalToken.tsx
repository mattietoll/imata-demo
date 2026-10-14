import { Clock } from 'lucide-react'
import { ANIMAL_ACCENTS, DEFAULT_ACCENT } from '../data'
import { formatDuration } from '../lib/time'
import type { Animal } from '../types'
import { DolphinIcon } from './DolphinIcon'

interface AnimalTokenProps {
  animal: Animal
  now: number
  selected: boolean
  onSelect: (id: string) => void
  onDragStart: (id: string) => void
  onDragEnd: () => void
}

export function AnimalToken({ animal, now, selected, onSelect, onDragStart, onDragEnd }: AnimalTokenProps) {
  const accent = ANIMAL_ACCENTS[animal.id] ?? DEFAULT_ACCENT
  const elapsed = formatDuration(now - animal.enteredAt)

  return (
    <button
      type="button"
      draggable
      onClick={() => onSelect(animal.id)}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', animal.id)
        e.dataTransfer.effectAllowed = 'move'
        onDragStart(animal.id)
      }}
      onDragEnd={onDragEnd}
      aria-pressed={selected}
      aria-label={`${animal.name}, ${elapsed} in current pool. Select to view details or move.`}
      className={[
        'group relative flex w-[108px] cursor-grab flex-col items-center rounded-xl px-2 pt-2 pb-1.5 text-center',
        'bg-white/85 shadow-sm ring-1 ring-sky-900/10 transition-[box-shadow,background-color] active:cursor-grabbing',
        'hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600',
        selected ? `bg-white shadow-md ring-2 ${accent.ring}` : '',
      ].join(' ')}
    >
      <span className={`absolute top-1.5 left-1.5 size-2 rounded-full ${accent.dot}`} aria-hidden />
      <DolphinIcon color={accent.fill} className="h-9 w-14 drop-shadow-sm" />
      <span className="mt-1 w-full truncate text-xs font-semibold text-navy-900">{animal.name}</span>
      <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-slate-500 tabular-nums">
        <Clock className="size-3" aria-hidden />
        {elapsed}
      </span>
    </button>
  )
}
