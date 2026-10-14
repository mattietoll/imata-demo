import { DoorClosed, DoorOpen } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { ANIMAL_ACCENTS, DEFAULT_ACCENT, GATE_BY_ID, POOL_BY_ID } from '../data'
import { areaLabel, sidesWhenClosed } from '../lib/areas'
import type { Animal, GateId, PoolId } from '../types'
import { DolphinIcon } from './DolphinIcon'

interface GateDialogProps {
  gateId: GateId | null
  openGates: Set<GateId>
  animals: Animal[]
  areas: Record<PoolId, Set<PoolId>>
  onOpen: (gateId: GateId) => void
  onClose: (gateId: GateId, sides: Record<string, PoolId>) => void
  onCancel: () => void
}

/** Confirms opening a gate, or asks which side each animal is on before closing it. */
export function GateDialog({ gateId, openGates, animals, areas, onOpen, onClose, onCancel }: GateDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (gateId && !dialog.open) dialog.showModal()
    if (!gateId && dialog.open) dialog.close()
  }, [gateId])

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault()
        onCancel()
      }}
      onClick={(e) => e.target === ref.current && onCancel()}
      className="m-auto w-[min(92vw,440px)] rounded-2xl p-0 shadow-2xl backdrop:bg-navy-900/40"
    >
      {gateId &&
        (openGates.has(gateId) ? (
          <CloseGateForm
            key={gateId}
            gateId={gateId}
            openGates={openGates}
            animals={animals}
            areas={areas}
            onConfirm={onClose}
            onCancel={onCancel}
          />
        ) : (
          <OpenGateForm gateId={gateId} animals={animals} areas={areas} onConfirm={onOpen} onCancel={onCancel} />
        ))}
    </dialog>
  )
}

function OpenGateForm({
  gateId,
  animals,
  areas,
  onConfirm,
  onCancel,
}: {
  gateId: GateId
  animals: Animal[]
  areas: Record<PoolId, Set<PoolId>>
  onConfirm: (gateId: GateId) => void
  onCancel: () => void
}) {
  const gate = GATE_BY_ID[gateId]
  const joined = new Set([...areas[gate.poolA], ...areas[gate.poolB]])
  const affected = animals.filter((a) => joined.has(a.poolId))

  return (
    <div className="p-5">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-navy-900">
        <DoorOpen className="size-5 text-teal-700" aria-hidden />
        Open gate?
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        {POOL_BY_ID[gate.poolA].name} and {POOL_BY_ID[gate.poolB].name} will be joined.{' '}
        {affected.length === 0
          ? 'No animals are in these pools right now.'
          : `${affected.map((a) => a.name).join(', ')} will have access to ${areaLabel(joined)}.`}
      </p>
      <DialogButtons confirmLabel="Open gate" onConfirm={() => onConfirm(gateId)} onCancel={onCancel} />
    </div>
  )
}

function CloseGateForm({
  gateId,
  openGates,
  animals,
  areas,
  onConfirm,
  onCancel,
}: {
  gateId: GateId
  openGates: Set<GateId>
  animals: Animal[]
  areas: Record<PoolId, Set<PoolId>>
  onConfirm: (gateId: GateId, sides: Record<string, PoolId>) => void
  onCancel: () => void
}) {
  const gate = GATE_BY_ID[gateId]
  const [sideA, sideB] = sidesWhenClosed(gateId, openGates)
  const affected = animals.filter((a) => areas[gate.poolA].has(a.poolId))
  // Default each animal to the side its recorded pool is on.
  const [sides, setSides] = useState<Record<string, PoolId>>(() =>
    Object.fromEntries(affected.map((a) => [a.id, sideA.has(a.poolId) ? gate.poolA : gate.poolB])),
  )

  const options: { poolId: PoolId; label: string }[] = [
    { poolId: gate.poolA, label: areaLabel(sideA) },
    { poolId: gate.poolB, label: areaLabel(sideB) },
  ]

  return (
    <form
      className="p-5"
      onSubmit={(e) => {
        e.preventDefault()
        onConfirm(gateId, sides)
      }}
    >
      <h2 className="flex items-center gap-2 text-lg font-semibold text-navy-900">
        <DoorClosed className="size-5 text-teal-700" aria-hidden />
        Close gate
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        {POOL_BY_ID[gate.poolA].name} ↔ {POOL_BY_ID[gate.poolB].name}.{' '}
        {affected.length > 0 ? 'Confirm which side each animal is on.' : 'No animals are affected.'}
      </p>

      {affected.length > 0 && (
        <ul className="mt-4 space-y-2">
          {affected.map((animal) => {
            const accent = ANIMAL_ACCENTS[animal.id] ?? DEFAULT_ACCENT
            return (
              <li key={animal.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-2 pl-3">
                <DolphinIcon color={accent.fill} className="h-5 w-7 shrink-0" />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-navy-900">{animal.name}</span>
                <div role="radiogroup" aria-label={`${animal.name} side`} className="flex shrink-0 rounded-lg bg-slate-100 p-0.5">
                  {options.map((opt) => {
                    const checked = sides[animal.id] === opt.poolId
                    return (
                      <label
                        key={opt.poolId}
                        className={[
                          'cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap',
                          'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal-600',
                          checked ? 'bg-white text-teal-900 shadow-sm' : 'text-slate-600 hover:text-slate-900',
                        ].join(' ')}
                      >
                        <input
                          type="radio"
                          name={`side-${animal.id}`}
                          className="sr-only"
                          checked={checked}
                          onChange={() => setSides((s) => ({ ...s, [animal.id]: opt.poolId }))}
                        />
                        {opt.label}
                      </label>
                    )
                  })}
                </div>
              </li>
            )
          })}
        </ul>
      )}
      <DialogButtons confirmLabel="Close gate" submit onCancel={onCancel} />
    </form>
  )
}

function DialogButtons({
  confirmLabel,
  submit,
  onConfirm,
  onCancel,
}: {
  confirmLabel: string
  submit?: boolean
  onConfirm?: () => void
  onCancel: () => void
}) {
  return (
    <div className="mt-5 flex justify-end gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
      >
        Cancel
      </button>
      <button
        type={submit ? 'submit' : 'button'}
        autoFocus
        onClick={onConfirm}
        className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
      >
        {confirmLabel}
      </button>
    </div>
  )
}
