# Environment Use

A demonstration for the 2026 IMATA conference on how to use AI agents to make simple tools.

This is a small prototype for marine mammal trainers: see which dolphins are in each pool and record moves between pools.
Runs entirely in the browser (React + TypeScript + Vite + Tailwind). State is saved in `localStorage`.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
```

- `src/App.tsx` – page layout, header, Reset Demo, toast and panel wiring
- `src/components/PoolMap.tsx` / `PoolCard.tsx` – the pool map, passages, legend, drag-and-drop targets
- `src/components/AnimalPanel.tsx` – selected-animal details, Move Animal form, recent moves
- `src/hooks/useEnvironment.ts` – movement and gate logic (`applyMove`, `applyCloseGate`), reset, derived pool occupancy
- `src/lib/areas.ts` – which pools are joined by open gates
- `src/lib/poolTime.ts` – replays the movement/gate log for daily access time and pool companions
- `src/components/GateDialog.tsx` – open/close gate flow
- `src/lib/storage.ts` – localStorage load/validate/save
- `src/data.ts` – pools and the demo roster
