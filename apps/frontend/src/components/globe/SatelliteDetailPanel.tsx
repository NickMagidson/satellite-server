import { LocateFixed, X } from 'lucide-react'
import type { ReactNode } from 'react'
import type { SatelliteMetadata } from '../../lib/satelliteApi'
import { ORBIT_CLASS_LABELS } from '../../lib/satelliteApi'
import type {
  SatelliteOmmRecord,
  SelectedPositionDetail,
} from '../../lib/satelliteMotion/types'
import { Card, CardBody, CardHeader } from '../ui/Card'

interface SatelliteDetailPanelProps {
  satellite: SatelliteMetadata
  omm?: SatelliteOmmRecord | null
  position?: SelectedPositionDetail | null
  isTracking: boolean
  onToggleTracking: () => void
  onClose: () => void
}

interface DetailRowProps {
  label: string
  value: string | number | null | undefined
}

function formatNumber(value: number | null | undefined, digits = 2) {
  if (value === null || value === undefined) {
    return 'N/A'
  }

  return value.toLocaleString(undefined, {
    useGrouping: false,
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  })
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return 'N/A'
  }

  return `${new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'medium',
    timeZone: 'UTC',
  }).format(new Date(value))} UTC`
}

function formatDegrees(value: number | null | undefined, digits = 2) {
  return `${formatNumber(value, digits)} deg`
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <dt className="text-sm text-object">{label}</dt>
      <dd className="min-w-0 text-right text-sm font-medium tabular-nums text-object">
        {value ?? 'N/A'}
      </dd>
    </div>
  )
}

function ReadoutList({ children }: { children: ReactNode }) {
  return <dl className="mt-2 divide-y divide-line">{children}</dl>
}

export default function SatelliteDetailPanel({
  satellite,
  omm,
  position,
  isTracking,
  onToggleTracking,
  onClose,
}: SatelliteDetailPanelProps) {
  const inclinationDeg = omm?.INCLINATION ?? satellite.inclinationDeg
  const meanMotion = omm?.MEAN_MOTION ?? satellite.meanMotion
  const eccentricity = omm?.ECCENTRICITY ?? satellite.eccentricity
  const epoch = omm?.EPOCH ?? satellite.epoch

  return (
    <Card aria-label="Satellite details" className="overflow-hidden">
      <CardHeader className="flex items-start justify-between gap-3 p-3">
        <div className="min-w-0">
          {/* <p className="text-data text-solar">Selected satellite</p> */}
          <h2 className="mt-1 truncate text-xl font-semibold text-object">
            {satellite.name}
          </h2>
          {/* <p className="mt-1 font-mono text-xs text-object tabular-nums">
            NORAD {satellite.noradCatId}
          </p> */}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label={
              isTracking ? 'Stop tracking satellite' : 'Track satellite'
            }
            aria-pressed={isTracking}
            title={isTracking ? 'Stop tracking' : 'Track satellite'}
            disabled={!position}
            onClick={onToggleTracking}
            className={`rounded-full p-1 transition hover:bg-void-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-solar/60 disabled:cursor-not-allowed disabled:opacity-40 ${
              isTracking ? 'text-solar' : 'text-ink-muted hover:text-object'
            }`}
          >
            <LocateFixed className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Close satellite details"
            onClick={onClose}
            className="rounded-full p-1 text-ink-muted transition hover:bg-void-700 hover:text-object focus:outline-none focus-visible:ring-2 focus-visible:ring-solar/60"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      </CardHeader>

      <CardBody className="max-h-[min(70vh,calc(100dvh-6rem))] space-y-4 overflow-y-auto p-3">
        <section>
          <h3 className="text-lg font-medium text-object">Catalog</h3>
          <ReadoutList>
            <DetailRow label="NORAD ID" value={satellite.noradCatId} />
            <DetailRow
              label="Orbit"
              value={ORBIT_CLASS_LABELS[satellite.orbitClass]}
            />
            <DetailRow label="Type" value={satellite.objectType} />
            <DetailRow label="Country" value={satellite.countryCode} />
            <DetailRow label="Object ID" value={satellite.objectId} />
            <DetailRow label="Launch date" value={satellite.launchDate} />
          </ReadoutList>
        </section>

        <section>
          <h3 className="text-lg font-medium text-object">Current position</h3>
          {position ? (
            <ReadoutList>
              <DetailRow
                label="Latitude"
                value={formatDegrees(position.geodetic.latitudeDeg, 3)}
              />
              <DetailRow
                label="Longitude"
                value={formatDegrees(position.geodetic.longitudeDeg, 3)}
              />
              <DetailRow
                label="Altitude"
                value={`${formatNumber(position.geodetic.altitudeKm)} km`}
              />
              <DetailRow
                label="Propagated"
                value={formatDate(position.propagatedAt)}
              />
            </ReadoutList>
          ) : (
            <p className="mt-2 text-sm text-ink-muted">
              No current propagated position is visible for this satellite.
            </p>
          )}
        </section>

        <section>
          <h3 className="text-lg font-medium text-object">Orbital elements</h3>
          <ReadoutList>
            <DetailRow label="Epoch" value={formatDate(epoch)} />
            <DetailRow
              label="Inclination"
              value={formatDegrees(inclinationDeg)}
            />
            <DetailRow
              label="Mean motion"
              value={`${formatNumber(meanMotion, 8)} rev/day`}
            />
            <DetailRow
              label="Period"
              value={
                satellite.periodMin === null
                  ? null
                  : `${formatNumber(satellite.periodMin)} min`
              }
            />
            <DetailRow
              label="Eccentricity"
              value={formatNumber(eccentricity, 6)}
            />
            <DetailRow
              label="RAAN"
              value={omm ? formatDegrees(omm.RA_OF_ASC_NODE) : null}
            />
            <DetailRow
              label="Argument of perigee"
              value={omm ? formatDegrees(omm.ARG_OF_PERICENTER) : null}
            />
            <DetailRow
              label="Mean anomaly"
              value={omm ? formatDegrees(omm.MEAN_ANOMALY) : null}
            />
            <DetailRow
              label="First derivative"
              value={omm ? formatNumber(omm.MEAN_MOTION_DOT, 6) : null}
            />
            <DetailRow
              label="Second derivative"
              value={omm ? formatNumber(omm.MEAN_MOTION_DDOT, 6) : null}
            />
            <DetailRow
              label="BSTAR"
              value={omm ? formatNumber(omm.BSTAR, 6) : null}
            />
            <DetailRow
              label="Apoapsis"
              value={
                satellite.apoapsisKm === null
                  ? null
                  : `${formatNumber(satellite.apoapsisKm)} km`
              }
            />
            <DetailRow
              label="Periapsis"
              value={
                satellite.periapsisKm === null
                  ? null
                  : `${formatNumber(satellite.periapsisKm)} km`
              }
            />
          </ReadoutList>
        </section>
      </CardBody>
    </Card>
  )
}
