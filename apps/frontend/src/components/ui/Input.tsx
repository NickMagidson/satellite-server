import { Input as HeadlessInput } from '@headlessui/react'
import type { ComponentPropsWithoutRef } from 'react'

type InputProps = ComponentPropsWithoutRef<typeof HeadlessInput>

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export default function Input({ className, ...props }: InputProps) {
  return (
    <HeadlessInput
      className={cx(
        'block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 data-disabled:cursor-not-allowed data-disabled:bg-slate-50 data-disabled:text-slate-400',
        className,
      )}
      {...props}
    />
  )
}
