import { Button as HeadlessButton } from '@headlessui/react'
import type { ComponentPropsWithoutRef } from 'react'

type ButtonProps = ComponentPropsWithoutRef<typeof HeadlessButton>

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export default function Button({ className, ...props }: ButtonProps) {
  return (
    <HeadlessButton
      className={cx(
        'inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2',
        className,
      )}
      {...props}
    />
  )
}
