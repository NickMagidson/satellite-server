import {
  Checkbox,
  Field,
  Label,
  Popover,
  PopoverButton,
  PopoverPanel,
} from '@headlessui/react'
import { Check, ChevronDown } from 'lucide-react'

interface FilterOption<TValue extends string> {
  value: TValue
  label: string
}

interface MultiSelectFilterProps<TValue extends string> {
  label: string
  options: Array<FilterOption<TValue>>
  selected: TValue[]
  onChange: (selected: TValue[]) => void
}

export default function MultiSelectFilter<TValue extends string>({
  label,
  options,
  selected,
  onChange,
}: MultiSelectFilterProps<TValue>) {
  function toggleValue(value: TValue, checked: boolean) {
    onChange(
      checked
        ? [...selected, value]
        : selected.filter((candidate) => candidate !== value),
    )
  }

  return (
    <Popover className="relative">
      <PopoverButton
        className="group flex w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        aria-label={`${label}: ${selected.length === 0 ? 'Any' : `${selected.length} selected`}`}
      >
        <span>{selected.length === 0 ? 'Any' : `${selected.length} selected`}</span>
        <ChevronDown
          className="size-4 text-slate-400 transition group-data-open:rotate-180"
          aria-hidden="true"
        />
      </PopoverButton>

      <PopoverPanel
        anchor="bottom start"
        className="z-40 mt-1 w-(--button-width) rounded-md border border-slate-200 bg-white p-2 shadow-lg"
      >
        <div className="max-h-52 space-y-1 overflow-y-auto">
          {options.map((option) => (
            <Field
              key={option.value}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-slate-100"
            >
              <Checkbox
                checked={selected.includes(option.value)}
                onChange={(checked) => toggleValue(option.value, checked)}
                className="group flex size-4 shrink-0 items-center justify-center rounded border border-slate-300 bg-white data-checked:border-cyan-600 data-checked:bg-cyan-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
              >
                <Check
                  className="hidden size-3 text-white group-data-checked:block"
                  aria-hidden="true"
                />
              </Checkbox>
              <Label className="min-w-0 flex-1 cursor-pointer text-sm text-slate-700">
                {option.label}
              </Label>
            </Field>
          ))}
        </div>

        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="mt-2 w-full border-t border-slate-200 pt-2 text-left text-xs font-medium text-cyan-700 hover:text-cyan-900 focus:outline-none focus-visible:underline"
          >
            Clear filter
          </button>
        )}
      </PopoverPanel>
    </Popover>
  )
}
