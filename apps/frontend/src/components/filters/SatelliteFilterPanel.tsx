import {
  Popover,
  PopoverButton,
  PopoverPanel,
} from '@headlessui/react'
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
        className="relative flex size-10 items-center justify-center rounded-full border border-white/10 bg-slate-950/85 text-slate-200 shadow-lg backdrop-blur transition hover:bg-slate-800 hover:text-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
      >
        <SlidersHorizontal className="size-4" aria-hidden="true" />
        {activeCategoryCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-semibold leading-none text-slate-950">
            {activeCategoryCount}
          </span>
        )}
      </PopoverButton>

      <PopoverPanel
        anchor="bottom end"
        className="z-40 mt-2 w-72 rounded-xl border border-slate-700/80 bg-slate-950/95 p-3 shadow-xl backdrop-blur"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-slate-100">Filters</p>
          {activeCategoryCount > 0 && (
            <button
              type="button"
              onClick={onReset}
              className="rounded px-1 py-0.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              Reset
            </button>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
              Orbit class
            </p>
            <MultiSelectFilter
              label="Orbit class"
              options={options.orbitClasses.map((orbitClass) => ({
                value: orbitClass,
                label: ORBIT_CLASS_LABELS[orbitClass],
              }))}
              selected={filters.orbitClasses}
              onChange={(orbitClasses) => onChange({ ...filters, orbitClasses })}
            />
          </div>

          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
              Object type
            </p>
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
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
              Country
            </p>
            <MultiSelectFilter
              label="Country"
              options={options.countryCodes.map((countryCode) => ({
                value: countryCode,
                label: countryCode,
              }))}
              selected={filters.countryCodes}
              onChange={(countryCodes) => onChange({ ...filters, countryCodes })}
            />
          </div>
        </div>
      </PopoverPanel>
    </Popover>
  )
}
