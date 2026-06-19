import { createFileRoute } from '@tanstack/react-router'
import CesiumViewer from '../components/CesiumViewer'
import { useSatellitePositions } from '../hooks/useSatellitePositions'
import { isSatellitePositionOk } from '../lib/satelliteApi'

export const Route = createFileRoute('/globe')({ component: GlobePage })

function GlobePage() {
  const { data, isPending, isError, error } = useSatellitePositions()
  const okPositions = data?.positions.filter(isSatellitePositionOk) ?? []

  return (
    <main className="globe-main relative w-full overflow-hidden bg-slate-950">
      {isError && (
        <p className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-md border border-red-200 bg-white px-3 py-2 text-sm text-red-600 shadow-sm">
          {error instanceof Error
            ? error.message
            : 'Failed to load satellite positions.'}
        </p>
      )}
      <CesiumViewer positions={okPositions} className="h-full w-full" />
      {isPending && (
        <p className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-md bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
          Loading satellite positions...
        </p>
      )}
    </main>
  )
}
