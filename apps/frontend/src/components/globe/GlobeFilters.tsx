import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { ListFilter } from 'lucide-react'
import type { OrbitClass } from '../../lib/satelliteApi'
import {
  countActiveFilters,
  toggleFilterValue,
} from '../../lib/globeFilters'
import type { FilterOption, GlobeFiltersState } from '../../lib/globeFilters'

interface GlobeFiltersProps {
  filters: GlobeFiltersState
  orbitOptions: Array<FilterOption<OrbitClass>>
  objectTypeOptions: Array<FilterOption<string>>
  countryOptions: Array<FilterOption<string>>
  resultCount: number
  totalCount: number
  onChange: (filters: GlobeFiltersState) => void
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function FilterCheckbox<TValue extends string>({
  checked,
  option,
  onChange,
}: {
  checked: boolean
  option: FilterOption<TValue>
  onChange: () => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="size-4 rounded border-slate-300 text-slate-950 focus:ring-slate-400"
      />
      <span className="min-w-0 flex-1 truncate">{option.label}</span>
      <span className="font-mono text-xs text-slate-400 tabular-nums">
        {option.count}
      </span>
    </label>
  )
}

function FilterGroup<TValue extends string>({
  title,
  emptyMessage,
  options,
  selectedValues,
  onToggle,
}: {
  title: string
  emptyMessage: string
  options: Array<FilterOption<TValue>>
  selectedValues: TValue[]
  onToggle: (value: TValue) => void
}) {
  return (
    <section>
      <h3 className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      <div className="mt-2 max-h-44 space-y-0.5 overflow-auto">
        {options.length > 0 ? (
          options.map((option) => (
            <FilterCheckbox
              key={option.value}
              checked={selectedValues.includes(option.value)}
              option={option}
              onChange={() => onToggle(option.value)}
            />
          ))
        ) : (
          <p className="px-2 py-1.5 text-sm text-slate-500">{emptyMessage}</p>
        )}
      </div>
    </section>
  )
}

export default function GlobeFilters({
  filters,
  orbitOptions,
  objectTypeOptions,
  countryOptions,
  resultCount,
  totalCount,
  onChange,
}: GlobeFiltersProps) {
  const activeFilterCount = countActiveFilters(filters)

  return (
    <Popover className="relative self-stretch">
      <PopoverButton
        className={cx(
          'flex h-full items-center justify-center gap-2 rounded-lg border border-white/20 bg-white text-sm font-medium text-slate-800 shadow-lg transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80',
          activeFilterCount > 0
            ? 'border-cyan-300 px-3 text-slate-950'
            : 'aspect-square',
        )}
      >
        <ListFilter className="size-4" aria-hidden="true" />
        <span className="sr-only">Filters</span>
        {activeFilterCount > 0 ? (
          <span className="rounded-full bg-slate-950 px-1.5 py-0.5 text-xs text-white">
            {activeFilterCount}
          </span>
        ) : null}
      </PopoverButton>

      <PopoverPanel
        anchor="bottom start"
        className="z-30 w-80 rounded-xl border border-slate-200 bg-white p-3 text-slate-950 shadow-xl [--anchor-gap:0.75rem]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-sm font-semibold">Globe filters</h2>
            <p className="mt-1 text-xs text-slate-500">
              Showing {resultCount.toLocaleString()} of{' '}
              {totalCount.toLocaleString()} propagated objects.
            </p>
          </div>
          <button
            type="button"
            disabled={activeFilterCount === 0}
            onClick={() =>
              onChange({
                orbitClasses: [],
                objectTypes: [],
                countryCodes: [],
              })
            }
            className="rounded px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear
          </button>
        </div>

        <div className="mt-3 space-y-4">
          <FilterGroup
            title="Orbit type"
            emptyMessage="No orbit data yet."
            options={orbitOptions}
            selectedValues={filters.orbitClasses}
            onToggle={(value) =>
              onChange({
                ...filters,
                orbitClasses: toggleFilterValue(filters.orbitClasses, value),
              })
            }
          />

          <FilterGroup
            title="Satellite type"
            emptyMessage="No object type data in this catalog."
            options={objectTypeOptions}
            selectedValues={filters.objectTypes}
            onToggle={(value) =>
              onChange({
                ...filters,
                objectTypes: toggleFilterValue(filters.objectTypes, value),
              })
            }
          />

          <FilterGroup
            title="Country"
            emptyMessage="No country data in this catalog."
            options={countryOptions}
            selectedValues={filters.countryCodes}
            onToggle={(value) =>
              onChange({
                ...filters,
                countryCodes: toggleFilterValue(filters.countryCodes, value),
              })
            }
          />

          <section className="rounded-lg border border-dashed border-slate-200 p-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Company
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Company/operator needs a metadata enrichment source before it can
              be filtered.
            </p>
          </section>
        </div>
      </PopoverPanel>
    </Popover>
  )
}
