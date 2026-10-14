import { ArrowRight, CalendarClock, Check, Clock, History, Link2, MapPin, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ANIMAL_ACCENTS, DEFAULT_ACCENT, POOL_BY_ID, POOLS } from '../data'
import { areaLabel } from '../lib/areas'
import { startOfDay, type AccessToday, type CompanionInfo } from '../lib/poolTime'
import { formatDuration, formatTimestamp } from '../lib/time'
import type { Animal, Movement, PoolId } from '../types'
import { DolphinIcon } from './DolphinIcon'

interface AnimalPanelProps {
  animal: Animal
  history: Movement[]
  /** Time with access to each pool since local midnight. */
  access: AccessToday
  /** Pools the animal can reach right now through open gates (includes its own). */
  area: Set<PoolId>
  companions: CompanionInfo[]
  onSelectAnimal: (id: string) => void
  now: number
  onMove: (animalId: string, toPoolId: PoolId) => void
  onClose: () => void
}

export function AnimalPanel({
  animal,
  history,
  access,
  area,
  companions,
  now,
  onMove,
  onClose,
  onSelectAnimal,
}: AnimalPanelProps) {
  const [destination, setDestination] = useState<PoolId | null>(null)
  const accent = ANIMAL_ACCENTS[animal.id] ?? DEFAULT_ACCENT
  const lastMove = history[0]
  const poolMates = companions.filter((c) => c.togetherNow)
  const trackedMs = access.trackedMs
  const sharedArea = area.size > 1

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const canMove = destination !== null && destination !== animal.poolId

  return (
    <div
      role="dialog"
      aria-labelledby="animal-panel-title"
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl lg:shadow-sm"
    >
      <div className="flex items-start gap-3 border-b border-slate-100 bg-gradient-to-br from-sky-50 to-white p-4">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-sky-100 ring-1 ring-sky-200">
          <DolphinIcon color={accent.fill} className="h-8 w-12" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 id="animal-panel-title" className="truncate text-lg font-semibold text-navy-900">
            {animal.name}
          </h2>
          <p className="text-xs text-slate-500">
            <span className="font-mono">{animal.id}</span> · {animal.species}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
        >
          <X className="size-5" />
        </button>
      </div>

      <dl className="grid grid-cols-2 gap-px bg-slate-100 text-sm">
        <div className="bg-white p-3">
          <dt className="flex items-center gap-1 text-[11px] font-medium tracking-wide text-slate-500 uppercase">
            <MapPin className="size-3" aria-hidden /> Current pool
          </dt>
          <dd className="mt-0.5 font-semibold text-navy-900">{POOL_BY_ID[animal.poolId].name}</dd>
        </div>
        <div className="bg-white p-3">
          <dt className="flex items-center gap-1 text-[11px] font-medium tracking-wide text-slate-500 uppercase">
            <Clock className="size-3" aria-hidden /> Time in pool
          </dt>
          <dd className="mt-0.5 font-semibold text-navy-900 tabular-nums">{formatDuration(now - animal.enteredAt)}</dd>
        </div>
        {sharedArea && (
          <div className="col-span-2 flex items-center gap-1.5 bg-teal-50 px-3 py-2 text-xs text-teal-900">
            <Link2 className="size-3.5 shrink-0" aria-hidden />
            <span>
              Gate open · access to <span className="font-semibold">{areaLabel(area)}</span>
            </span>
          </div>
        )}
        <div className="col-span-2 bg-white px-3 py-2 text-xs text-slate-500">
          {lastMove ? (
            <>
              Last moved <span className="font-medium text-slate-700">{formatTimestamp(lastMove.timestamp, now)}</span>{' '}
              from {POOL_BY_ID[lastMove.fromPoolId].name}
            </>
          ) : (
            <>
              No moves recorded · in pool since{' '}
              <span className="font-medium text-slate-700">{formatTimestamp(animal.enteredAt, now)}</span>
            </>
          )}
        </div>
      </dl>

      <div className="border-t border-slate-100 p-4">
        <div className="mb-2.5 flex items-baseline justify-between gap-2">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-navy-900">
            <Users className="size-4 text-slate-400" aria-hidden /> Pool companions
          </h3>
          <span className="text-[11px] text-slate-500">
            {poolMates.length === 0
              ? `Alone in ${POOL_BY_ID[animal.poolId].name}`
              : `${poolMates.length} with ${animal.name} now`}
          </span>
        </div>
        <ul className="space-y-1">
          {companions.map(({ animal: other, togetherNow, togetherSince, togetherTodayMs }) => {
            const otherAccent = ANIMAL_ACCENTS[other.id] ?? DEFAULT_ACCENT
            return (
              <li key={other.id}>
                <button
                  type="button"
                  onClick={() => onSelectAnimal(other.id)}
                  className={[
                    'flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-xs',
                    'hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600',
                    togetherNow ? 'bg-teal-50/70' : '',
                  ].join(' ')}
                >
                  <DolphinIcon color={otherAccent.fill} className="h-5 w-7 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-navy-900">{other.name}</span>
                    <span className={`block truncate ${togetherNow ? 'text-teal-800' : 'text-slate-500'}`}>
                      {togetherNow && togetherSince !== null
                        ? `Together now · ${formatDuration(now - togetherSince)}`
                        : `In ${POOL_BY_ID[other.poolId].name}`}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-[10px] text-slate-400 uppercase">Today</span>
                    <span className={`block tabular-nums ${togetherTodayMs > 0 || togetherNow ? 'font-medium text-slate-700' : 'text-slate-400'}`}>
                      {togetherTodayMs > 0 || togetherNow ? formatDuration(togetherTodayMs) : '—'}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="border-t border-slate-100 p-4">
        <h3 className="mb-2.5 flex items-center gap-1.5 text-sm font-semibold text-navy-900">
          <CalendarClock className="size-4 text-slate-400" aria-hidden /> Pool access today
        </h3>
        <ul className="space-y-2">
          {POOLS.map((pool) => {
            const ms = access.byPool[pool.id]
            const isCurrent = pool.id === animal.poolId
            const hasAccess = area.has(pool.id)
            const share = trackedMs > 0 ? Math.min(100, (ms / trackedMs) * 100) : 0
            return (
              <li key={pool.id} className="text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className={isCurrent ? 'font-semibold text-navy-900' : 'text-slate-700'}>
                    {pool.name}
                    {isCurrent && <span className="ml-1.5 text-[10px] font-medium text-teal-700 uppercase">Here</span>}
                    {!isCurrent && hasAccess && (
                      <span className="ml-1.5 text-[10px] font-medium text-teal-700 uppercase">Access</span>
                    )}
                  </span>
                  <span className={`tabular-nums ${ms > 0 ? 'font-medium text-slate-700' : 'text-slate-400'}`}>
                    {ms > 0 ? formatDuration(ms) : '—'}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${hasAccess ? 'bg-teal-600' : 'bg-sky-400'}`}
                    style={{ width: `${share}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
        <p className="mt-2 text-[11px] text-slate-500">
          Since {formatTimestamp(Math.max(startOfDay(now), now - trackedMs), now)} · {formatDuration(trackedMs)} tracked
          {POOLS.reduce((sum, p) => sum + access.byPool[p.id], 0) > trackedMs + 1000 &&
            ' · times overlap while gates are open'}
        </p>
      </div>

      <form
        className="border-t border-slate-100 p-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (canMove) onMove(animal.id, destination)
        }}
      >
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-navy-900">Move to</legend>
          <div className="grid grid-cols-2 gap-2">
            {POOLS.map((pool) => {
              const isCurrent = pool.id === animal.poolId
              const isChosen = pool.id === destination
              return (
                <label
                  key={pool.id}
                  className={[
                    'relative flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                    'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal-600',
                    isCurrent
                      ? 'cursor-not-allowed border-dashed border-slate-200 bg-slate-50 text-slate-400'
                      : isChosen
                        ? 'cursor-pointer border-teal-600 bg-teal-50 font-semibold text-teal-900'
                        : 'cursor-pointer border-slate-200 text-slate-700 hover:border-sky-300 hover:bg-sky-50',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name="destination"
                    value={pool.id}
                    disabled={isCurrent}
                    checked={isChosen}
                    onChange={() => setDestination(pool.id)}
                    className="sr-only"
                  />
                  <span className="truncate">{pool.name}</span>
                  {isCurrent ? (
                    <span className="text-[10px] font-medium uppercase">Here</span>
                  ) : (
                    isChosen && <Check className="size-4 shrink-0 text-teal-700" aria-hidden />
                  )}
                </label>
              )
            })}
          </div>
        </fieldset>
        <button
          type="submit"
          disabled={!canMove}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
        >
          Move Animal
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </form>

      <div className="border-t border-slate-100 p-4">
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-navy-900">
          <History className="size-4 text-slate-400" aria-hidden /> Recent moves
        </h3>
        {history.length === 0 ? (
          <p className="text-xs text-slate-500">No movements recorded yet.</p>
        ) : (
          <ol className="space-y-1.5">
            {history.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-2 text-xs">
                <span className="flex min-w-0 items-center gap-1 text-slate-700">
                  <span className="truncate">{POOL_BY_ID[m.fromPoolId].name}</span>
                  <ArrowRight className="size-3 shrink-0 text-slate-400" aria-hidden />
                  <span className="truncate font-medium">{POOL_BY_ID[m.toPoolId].name}</span>
                </span>
                <time dateTime={new Date(m.timestamp).toISOString()} className="shrink-0 text-slate-500 tabular-nums">
                  {formatTimestamp(m.timestamp, now)}
                </time>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
