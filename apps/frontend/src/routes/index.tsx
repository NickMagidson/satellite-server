import { createFileRoute } from '@tanstack/react-router'
import { useSatellitePositions } from '../hooks/useSatellitePositions'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const { data, isPending, isError, error } = useSatellitePositions()

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="island-shell rise-in overflow-hidden rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] bg-[var(--surface-strong)]">
              <th className="px-4 py-3 text-left font-semibold text-[var(--sea-ink)]">
                Name
              </th>
              <th className="px-4 py-3 text-left font-semibold text-[var(--sea-ink)]">
                ID
              </th>
              <th className="px-4 py-3 text-left font-semibold text-[var(--sea-ink)]">
                Latitude
              </th>
              <th className="px-4 py-3 text-left font-semibold text-[var(--sea-ink)]">
                Longitude
              </th>
              <th className="px-4 py-3 text-left font-semibold text-[var(--sea-ink)]">
                Altitude (km)
              </th>
              <th className="px-4 py-3 text-left font-semibold text-[var(--sea-ink)]">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {isPending && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-[var(--sea-ink-soft)]"
                >
                  Loading satellite positions…
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-red-600"
                >
                  {error instanceof Error
                    ? error.message
                    : 'Failed to load satellite positions.'}
                </td>
              </tr>
            )}
            {!isPending &&
              !isError &&
              data.positions.map((position) => (
                <tr
                  key={position.id}
                  className="border-b border-[var(--line)] last:border-b-0"
                >
                  <td className="px-4 py-3 text-[var(--sea-ink)]">
                    {position.name}
                  </td>
                  <td className="px-4 py-3 text-[var(--sea-ink-soft)]">
                    {position.id}
                  </td>
                  <td className="px-4 py-3 text-[var(--sea-ink-soft)]">
                    {position.status === 'ok'
                      ? position.geodetic.latitudeDeg.toFixed(4)
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-[var(--sea-ink-soft)]">
                    {position.status === 'ok'
                      ? position.geodetic.longitudeDeg.toFixed(4)
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-[var(--sea-ink-soft)]">
                    {position.status === 'ok'
                      ? position.geodetic.altitudeKm.toFixed(2)
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-[var(--sea-ink-soft)]">
                    {position.status === 'ok'
                      ? 'OK'
                      : `Failed (${position.errorCode})`}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </section>
    </main>
  )
}
