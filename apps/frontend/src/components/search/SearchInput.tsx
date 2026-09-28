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
  leadingIcon = <Search className="size-4 text-ink-muted" aria-hidden="true" />,
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
          <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-ink-muted">
            {leadingIcon}
          </span>
          <ComboboxInput
            className={cx(
              'block w-full rounded-md border border-line-strong bg-void-600 py-2 pl-9 pr-3 text-sm text-object placeholder:text-ink-muted shadow-lg backdrop-blur focus:outline-none focus-visible:ring-2 focus-visible:ring-solar/60 focus-visible:ring-offset-2 focus-visible:ring-offset-void data-disabled:cursor-not-allowed data-disabled:bg-void-800 data-disabled:text-ink-faint',
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
            'glass-panel absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-md p-1 text-sm focus:outline-none',
            panelClassName,
          )}
        >
          {showEmptyMessage ? (
            <div className="px-3 py-2 text-ink-muted">{emptyMessage}</div>
          ) : (
            options.map((option) => (
              <ComboboxOption
                key={getOptionKey(option)}
                value={option}
                className={({ focus, selected }) =>
                  cx(
                    'cursor-pointer rounded px-3 py-2 text-ink-muted data-disabled:cursor-not-allowed data-disabled:text-ink-faint',
                    focus && 'bg-void-700 text-object',
                    selected && 'font-medium text-object',
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
                      <div className="font-mono text-xs text-ink-faint tabular-nums">
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
