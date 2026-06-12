import { createFileRoute } from '@tanstack/react-router'
import CesiumViewer from '../components/CesiumViewer'
import { useSatellitePositions } from '../hooks/useSatellitePositions'
import { isSatellitePositionOk } from '../lib/satelliteApi'

export const Route = createFileRoute('/globe')({ component: GlobePage })

function GlobePage() {
  const { data, isPending, isError, error } = useSatellitePositions()
  const okPositions = data?.positions.filter(isSatellitePositionOk) ?? []

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      {isError && (
        <p className="mb-4 text-center text-red-600">
          {error instanceof Error
            ? error.message
            : 'Failed to load satellite positions.'}
        </p>
      )}
      <section className="island-shell overflow-hidden rounded-2xl">
        <CesiumViewer positions={okPositions} className="h-[70vh] w-full" />
        {isPending && (
          <p className="p-4 text-center text-[var(--sea-ink-soft)]">
            Loading satellite positions…
          </p>
        )}
      </section>
    </main>
  )
}
