import { ArrowRightLeft, Lock, LockOpen, MousePointerClick } from 'lucide-react'
import { useState } from 'react'
import { ANIMAL_ACCENTS, DEFAULT_ACCENT, POOL_BY_ID } from '../data'
import type { ActivityEntry } from '../lib/activity'
import { areaLabel } from '../lib/areas'
import { formatTimestamp } from '../lib/time'
import type { Animal, PoolId } from '../types'
import { DolphinIcon } from './DolphinIcon'

interface RecentActivityProps {
  animals: Animal[]
  entries: ActivityEntry[]
  now: number
  onSelect: (id: string) => void
}

const MAX_ROWS = 12

function AccessLabel({ access }: { access: Set<PoolId> }) {
  return (
    <span className="font-medium text-teal-800">
      {access.size > 1 ? `Access: ${areaLabel(access)}` : `Access: ${areaLabel(access)} only`}
    </span>
  )
}

export function RecentActivity({ animals, entries, now, onSelect }: RecentActivityProps) {
  const [filterId, setFilterId] = useState<string | null>(null)
  const names = new Map(animals.map((a) => [a.id, a.name]))

  const visible = entries
    .filter((e) =>
      filterId === null
        ? true
        : e.kind === 'move'
          ? e.move.animalId === filterId
          : e.changes.some((c) => c.animalId === filterId),
    )
    .slice(0, MAX_ROWS)

  const time = (ts: number) => (
    <time dateTime={new Date(ts).toISOString()} className="shrink-0 text-slate-500 tabular-nums">
      {formatTimestamp(ts, now)}
    </time>
  )

  const chip = (id: string | null, label: string, animal?: Animal) => {
    const active = filterId === id
    return (
      <button
        key={id ?? 'all'}
        type="button"
        aria-pressed={active}
        onClick={() => setFilterId(id)}
        className={[
          'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600',
          active ? 'border-navy-900 bg-navy-900 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50',
        ].join(' ')}
      >
        {animal && (
          <DolphinIcon
            color={active ? '#ffffff' : (ANIMAL_ACCENTS[animal.id] ?? DEFAULT_ACCENT).fill}
            className="h-3 w-4"
          />
        )}
        {label}
      </button>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-navy-900">Today's activity log</h2>

      <div role="group" aria-label="Filter by dolphin" className="mt-2.5 flex flex-wrap gap-1.5">
        {chip(null, 'All')}
        {animals.map((a) => chip(a.id, a.name.split(' ')[0], a))}
      </div>

      {visible.length === 0 ? (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-sky-50 p-3 text-xs text-sky-900/80">
          <MousePointerClick className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            {filterId
              ? `No moves or access changes for ${names.get(filterId)} yet.`
              : 'Select a dolphin on the map to see its details and record a move, or click a gate to open it.'}
          </p>
        </div>
      ) : (
        <ol className="mt-2 divide-y divide-slate-100">
          {visible.map((entry) => {
            if (entry.kind === 'move') {
              const { move, access } = entry
              const accent = ANIMAL_ACCENTS[move.animalId] ?? DEFAULT_ACCENT
              return (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(move.animalId)}
                    className="flex w-full items-start justify-between gap-3 rounded-md py-2 text-left text-xs hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                  >
                    <span className="flex min-w-0 items-start gap-2">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sky-50" aria-hidden>
                        <DolphinIcon color={accent.fill} className="h-3 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-navy-900">
                          {names.get(move.animalId) ?? move.animalId} moved
                        </span>
                        <span className="block text-slate-500">
                          <AccessLabel access={access} />
                          <span> · from {POOL_BY_ID[move.fromPoolId].name}</span>
                        </span>
                      </span>
                    </span>
                    {time(entry.timestamp)}
                  </button>
                </li>
              )
            }

            const { event } = entry
            const changes = filterId ? entry.changes.filter((c) => c.animalId === filterId) : entry.changes
            // Group animals that ended up with the same access: "Fin, Splash → Main + North".
            const groups = new Map<string, { access: Set<PoolId>; ids: string[] }>()
            for (const c of changes) {
              const key = areaLabel(c.access)
              const group = groups.get(key) ?? { access: c.access, ids: [] }
              group.ids.push(c.animalId)
              groups.set(key, group)
            }
            return (
              <li key={entry.id} className="flex items-start justify-between gap-3 py-2 text-xs">
                <span className="flex min-w-0 items-start gap-2">
                  <span
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full ${event.open ? 'bg-teal-600/10 text-teal-700' : 'bg-slate-100 text-slate-600'}`}
                    aria-hidden
                  >
                    {event.open ? <LockOpen className="size-3.5" /> : <Lock className="size-3.5" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-navy-900">Gate {event.open ? 'opened' : 'closed'}</span>
                    {groups.size === 0 ? (
                      <span className="block text-slate-500">No animals' access changed</span>
                    ) : (
                      [...groups.values()].map((g) => (
                        <span key={areaLabel(g.access)} className="mt-0.5 flex items-start gap-1 text-slate-600">
                          <ArrowRightLeft className="mt-0.5 size-3 shrink-0 text-slate-400" aria-hidden />
                          <span>
                            <span className="block">{g.ids.map((id) => names.get(id) ?? id).join(', ')}</span>
                            <span className="block">
                              <AccessLabel access={g.access} />
                            </span>
                          </span>
                        </span>
                      ))
                    )}
                  </span>
                </span>
                {time(entry.timestamp)}
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
