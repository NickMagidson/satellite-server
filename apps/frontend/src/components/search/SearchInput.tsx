import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/react'
import { Search } from 'lucide-react'
import type { ReactNode } from 'react'

interface SearchInputProps<TOption> {
  options: TOption[]
  value: TOption | null
  onChange: (option: TOption | null) => void
  query: string
  onQueryChange: (query: string) => void
  getOptionLabel: (option: TOption) => string
  getOptionKey: (option: TOption) => string
  getOptionDescription?: (option: TOption) => ReactNode
  renderOption?: (option: TOption) => ReactNode
  placeholder?: string
  emptyMessage?: string
  leadingIcon?: ReactNode
  className?: string
  inputClassName?: string
  panelClassName?: string
  optionClassName?: string
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export default function SearchInput<TOption>({
  options,
  value,
  onChange,
  query,
  onQueryChange,
  getOptionLabel,
  getOptionKey,
  getOptionDescription,
  renderOption,
  placeholder = 'Search...',
  emptyMessage = 'No results found.',
  leadingIcon = <Search className="size-4" aria-hidden="true" />,
  className,
  inputClassName,
  panelClassName,
  optionClassName,
}: SearchInputProps<TOption>) {
  const showEmptyMessage = query.trim() !== '' && options.length === 0

  return (
    <Combobox
      value={value}
      onChange={onChange}
      by={(first, second) => {
        if (!first || !second) {
          return first === second
        }

        return getOptionKey(first) === getOptionKey(second)
      }}
    >
      <div className={cx('relative', className)}>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {leadingIcon}
          </span>
          <ComboboxInput
            className={cx(
              'block w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-950 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 data-disabled:cursor-not-allowed data-disabled:bg-slate-50 data-disabled:text-slate-400',
              inputClassName,
            )}
            displayValue={(option: TOption | null) =>
              option ? getOptionLabel(option) : query
            }
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={placeholder}
          />
        </div>

        <ComboboxOptions
          className={cx(
            'absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-md border border-slate-200 bg-white p-1 text-sm shadow-lg focus:outline-none',
            panelClassName,
          )}
        >
          {showEmptyMessage ? (
            <div className="px-3 py-2 text-slate-500">{emptyMessage}</div>
          ) : (
            options.map((option) => (
              <ComboboxOption
                key={getOptionKey(option)}
                value={option}
                className={({ focus, selected }) =>
                  cx(
                    'cursor-pointer rounded px-3 py-2 text-slate-700 data-disabled:cursor-not-allowed data-disabled:text-slate-400',
                    focus && 'bg-slate-100 text-slate-950',
                    selected && 'font-medium text-slate-950',
                    optionClassName,
                  )
                }
              >
                {renderOption ? (
                  renderOption(option)
                ) : (
                  <div>
                    <div>{getOptionLabel(option)}</div>
                    {getOptionDescription ? (
                      <div className="font-mono text-xs text-slate-500 tabular-nums">
                        {getOptionDescription(option)}
                      </div>
                    ) : null}
                  </div>
                )}
              </ComboboxOption>
            ))
          )}
        </ComboboxOptions>
      </div>
    </Combobox>
  )
}
