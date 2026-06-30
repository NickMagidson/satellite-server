import { X } from 'lucide-react'
import type { SatelliteMetadata, SatellitePositionOk } from '../../lib/satelliteApi'
import { ORBIT_CLASS_LABELS } from '../../lib/satelliteApi'
import { Card, CardBody, CardHeader } from '../ui/Card'

interface SatelliteDetailPanelProps {
  satellite: SatelliteMetadata
  position?: SatellitePositionOk | null
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
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  })
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return 'N/A'
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="min-w-0 text-right text-sm text-slate-700">
        {value ?? 'N/A'}
      </dd>
    </div>
  )
}

export default function SatelliteDetailPanel({
  satellite,
  position,
  onClose,
}: SatelliteDetailPanelProps) {
  return (
    <Card aria-label="Satellite details" className="overflow-hidden">
      <CardHeader className="flex items-start justify-between gap-3 p-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-cyan-600">
            Selected satellite
          </p>
          <h2 className="mt-1 truncate text-base font-semibold text-slate-950">
            {satellite.name}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            NORAD {satellite.noradCatId}
          </p>
        </div>

        <button
          type="button"
          aria-label="Close satellite details"
          onClick={onClose}
          className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </CardHeader>

      <CardBody className="space-y-4 p-3">
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Catalog
          </h3>
          <dl className="mt-2 space-y-2">
            <DetailRow
              label="Orbit"
              value={ORBIT_CLASS_LABELS[satellite.orbitClass]}
            />
            <DetailRow label="Type" value={satellite.objectType} />
            <DetailRow label="Country" value={satellite.countryCode} />
            <DetailRow label="Object ID" value={satellite.objectId} />
            <DetailRow label="Launch date" value={satellite.launchDate} />
          </dl>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Orbit details
          </h3>
          <dl className="mt-2 space-y-2">
            <DetailRow
              label="Inclination"
              value={`${formatNumber(satellite.inclinationDeg)} deg`}
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
          </dl>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Current position
          </h3>
          {position ? (
            <dl className="mt-2 space-y-2">
              <DetailRow
                label="Latitude"
                value={`${formatNumber(position.geodetic.latitudeDeg, 3)} deg`}
              />
              <DetailRow
                label="Longitude"
                value={`${formatNumber(position.geodetic.longitudeDeg, 3)} deg`}
              />
              <DetailRow
                label="Altitude"
                value={`${formatNumber(position.geodetic.altitudeKm)} km`}
              />
              <DetailRow
                label="Propagated"
                value={formatDate(position.propagatedAt)}
              />
            </dl>
          ) : (
            <p className="mt-2 text-sm text-slate-500">
              No current propagated position is visible for this satellite.
            </p>
          )}
        </section>
      </CardBody>
    </Card>
  )
}
