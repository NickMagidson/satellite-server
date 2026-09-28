import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { SlidersHorizontal } from 'lucide-react'
import { ORBIT_CLASS_LABELS } from '../../lib/satelliteApi'
import type { OrbitClass } from '../../lib/satelliteApi'
import type { SatelliteFilters } from '../../lib/satelliteFilters'
import MultiSelectFilter from './MultiSelectFilter'

interface SatelliteFilterOptions {
  orbitClasses: OrbitClass[]
  objectTypes: string[]
  countryCodes: string[]
}

interface SatelliteFilterPanelProps {
  filters: SatelliteFilters
  options: SatelliteFilterOptions
  onChange: (filters: SatelliteFilters) => void
  onReset: () => void
}

export default function SatelliteFilterPanel({
  filters,
  options,
  onChange,
  onReset,
}: SatelliteFilterPanelProps) {
  const activeCategoryCount = [
    filters.orbitClasses,
    filters.objectTypes,
    filters.countryCodes,
  ].filter((values) => values.length > 0).length

  return (
    <Popover className="relative shrink-0">
      <PopoverButton
        aria-label={
          activeCategoryCount > 0
            ? `Filters, ${activeCategoryCount} active`
            : 'Filters'
        }
        className="relative flex size-10 items-center justify-center rounded-sm border border-line-strong bg-void-600 text-object shadow-lg backdrop-blur transition hover:bg-void-700 hover:text-object focus:outline-none focus-visible:ring-2 focus-visible:ring-solar/60"
      >
        <SlidersHorizontal className="size-4" aria-hidden="true" />
        {activeCategoryCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-sm bg-solar text-[10px] font-semibold leading-none text-void">
            {activeCategoryCount}
          </span>
        )}
      </PopoverButton>

      <PopoverPanel
        anchor="bottom end"
        className="glass-panel z-40 mt-2 w-72 rounded-sm p-3"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-object">Filters</p>
          {activeCategoryCount > 0 && (
            <button
              type="button"
              onClick={onReset}
              className="rounded-sm px-1 py-0.5 text-xs font-medium text-solar hover:text-object focus:outline-none focus-visible:ring-2 focus-visible:ring-solar/60"
            >
              Reset
            </button>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-data mb-1 text-ink-muted">Orbit class</p>
            <MultiSelectFilter
              label="Orbit class"
              options={options.orbitClasses.map((orbitClass) => ({
                value: orbitClass,
                label: ORBIT_CLASS_LABELS[orbitClass],
              }))}
              selected={filters.orbitClasses}
              onChange={(orbitClasses) =>
                onChange({ ...filters, orbitClasses })
              }
            />
          </div>

          <div>
            <p className="text-data mb-1 text-ink-muted">Object type</p>
            <MultiSelectFilter
              label="Object type"
              options={options.objectTypes.map((objectType) => ({
                value: objectType,
                label: objectType,
              }))}
              selected={filters.objectTypes}
              onChange={(objectTypes) => onChange({ ...filters, objectTypes })}
            />
          </div>

          <div>
            <p className="text-data mb-1 text-ink-muted">Country</p>
            <MultiSelectFilter
              label="Country"
              options={options.countryCodes.map((countryCode) => ({
                value: countryCode,
                label: countryCode,
              }))}
              selected={filters.countryCodes}
              onChange={(countryCodes) =>
                onChange({ ...filters, countryCodes })
              }
            />
          </div>
        </div>
      </PopoverPanel>
    </Popover>
  )
}
