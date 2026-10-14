import { RotateCcw } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimalPanel } from './components/AnimalPanel'
import { ConfirmDialog } from './components/ConfirmDialog'
import { DolphinIcon } from './components/DolphinIcon'
import { GateDialog } from './components/GateDialog'
import { PoolMap } from './components/PoolMap'
import { RecentActivity } from './components/RecentActivity'
import { Toast, type ToastMessage } from './components/Toast'
import { GATES, POOL_BY_ID, POOLS } from './data'
import { useEnvironment, type GateResult } from './hooks/useEnvironment'
import { useNow } from './hooks/useNow'
import type { GateId, PoolId } from './types'

export default function App() {
  const { animals, animalsByPool, moveAnimal, resetDemo, historyFor, accessTodayFor, companionsOf, openGates, areas, openGate, closeGate, activityLog } =
    useEnvironment()
  const now = useNow()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [gateDialog, setGateDialog] = useState<GateId | null>(null)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)

  const selected = animals.find((a) => a.id === selectedId) ?? null
  const occupiedPools = POOLS.filter((p) => animalsByPool[p.id].length > 0).length

  const showToast = useCallback((kind: ToastMessage['kind'], text: string) => {
    window.clearTimeout(toastTimer.current)
    setToast({ id: Date.now(), kind, text })
    toastTimer.current = window.setTimeout(() => setToast(null), 2800)
  }, [])

  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  const handleMove = useCallback(
    (animalId: string, toPoolId: PoolId) => {
      const result = moveAnimal(animalId, toPoolId)
      if (result.ok) showToast('success', `${result.animal.name} moved to ${POOL_BY_ID[toPoolId].name}`)
      else showToast('error', result.reason)
    },
    [moveAnimal, showToast],
  )

  const handleDrop = useCallback(
    (animalId: string, toPoolId: PoolId) => {
      setDraggingId(null)
      const animal = animals.find((a) => a.id === animalId)
      if (!animal || animal.poolId === toPoolId) return // dropped back where it started
      handleMove(animalId, toPoolId)
    },
    [animals, handleMove],
  )

  const handleGateResult = useCallback(
    (result: GateResult) => {
      setGateDialog(null)
      if (result.ok) showToast('success', result.message)
      else showToast('error', result.reason)
    },
    [showToast],
  )

  const closePanel = useCallback(() => setSelectedId(null), [])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-navy-900 text-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <div className="flex size-10 items-center justify-center rounded-xl bg-teal-500/15 ring-1 ring-teal-300/30">
            <DolphinIcon color="#5eead4" className="h-6 w-9" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg leading-tight font-semibold tracking-tight">Environment Use</h1>
            <p className="truncate text-xs text-sky-200/80">Dolphin pool occupancy · Marine Mammal Care</p>
          </div>
          <div className="hidden items-center gap-5 text-right text-xs md:flex">
            <div>
              <div className="text-sky-200/70">Animals</div>
              <div className="text-sm font-semibold tabular-nums">{animals.length}</div>
            </div>
            <div>
              <div className="text-sky-200/70">Pools in use</div>
              <div className="text-sm font-semibold tabular-nums">
                {occupiedPools} / {POOLS.length}
              </div>
            </div>
            <div>
              <div className="text-sky-200/70">Gates open</div>
              <div className="text-sm font-semibold tabular-nums">
                {openGates.size} / {GATES.length}
              </div>
            </div>
            <div>
              <div className="text-sky-200/70">Local time</div>
              <div className="text-sm font-semibold tabular-nums">
                {new Date(now).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-sky-100 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
          >
            <RotateCcw className="size-3.5" aria-hidden />
            Reset Demo
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section aria-labelledby="map-title" className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="map-title" className="text-base font-semibold text-navy-900">
              Pool map
            </h2>
            <p className="text-xs text-slate-500">Click a dolphin to view details and move it</p>
          </div>
          <div className="deck rounded-2xl p-3 sm:p-5">
            <PoolMap
              animals={animals}
              animalsByPool={animalsByPool}
              now={now}
              selectedId={selectedId}
              draggingId={draggingId}
              onSelect={setSelectedId}
              onDragStart={setDraggingId}
              onDragEnd={() => setDraggingId(null)}
              onDropAnimal={handleDrop}
              openGates={openGates}
              areas={areas}
              onGateClick={setGateDialog}
            />
          </div>
        </section>

        <aside className="flex flex-col gap-6">
          {selected && (
            <>
              {/* On tablet the panel floats as a bottom sheet; on desktop it sits in the sidebar. */}
              <div className="fixed inset-0 z-30 bg-navy-900/30 lg:hidden" onClick={closePanel} aria-hidden />
              <div className="fixed inset-x-3 bottom-3 z-40 mx-auto max-h-[85vh] max-w-md overflow-y-auto rounded-2xl lg:static lg:inset-auto lg:max-h-none lg:max-w-none lg:overflow-visible">
                {/* Keyed by pool so the destination choice clears after every move */}
                <AnimalPanel
                  key={`${selected.id}-${selected.poolId}`}
                  animal={selected}
                  history={historyFor(selected.id)}
                  access={accessTodayFor(selected.id, now)}
                  area={areas[selected.poolId]}
                  companions={companionsOf(selected.id, now)}
                  onSelectAnimal={setSelectedId}
                  now={now}
                  onMove={handleMove}
                  onClose={closePanel}
                />
              </div>
            </>
          )}
          <RecentActivity animals={animals} entries={activityLog(now)} now={now} onSelect={setSelectedId} />
        </aside>
      </main>

      <Toast toast={toast} />
      <GateDialog
        gateId={gateDialog}
        openGates={openGates}
        animals={animals}
        areas={areas}
        onOpen={(id) => handleGateResult(openGate(id))}
        onClose={(id, sides) => handleGateResult(closeGate(id, sides))}
        onCancel={() => setGateDialog(null)}
      />
      <ConfirmDialog
        open={confirmReset}
        title="Reset demo?"
        message="This restores every dolphin to its starting pool, closes all gates, clears the movement history and restarts all timers."
        confirmLabel="Reset Demo"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetDemo()
          setSelectedId(null)
          setConfirmReset(false)
          showToast('success', 'Demo reset to starting positions')
        }}
      />
    </div>
  )
}
