import { Link, type LinkComponentProps } from '@tanstack/react-router'
import type { ComponentPropsWithoutRef } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'ink'

type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  variant?: ButtonVariant
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'border-transparent bg-object text-void hover:bg-white',
  secondary:
    'border-solar bg-transparent text-object hover:bg-solar/10',
  ghost:
    'border-line-strong bg-transparent text-ink-muted hover:border-object hover:text-object',
  ink: 'border-transparent bg-void text-object hover:bg-void-600',
}

const buttonBaseClass =
  'inline-flex cursor-pointer items-center gap-2 rounded-sm border px-4 py-[11px] text-[13px] font-medium leading-none transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-solar/60 focus-visible:ring-offset-2 focus-visible:ring-offset-void disabled:cursor-not-allowed disabled:opacity-50'

function Button({
  className,
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(buttonBaseClass, variantClasses[variant], className)}
      {...props}
    />
  )
}

type ButtonLinkProps = LinkComponentProps<'a'> & {
  variant?: ButtonVariant
}

function ButtonLink({
  className,
  variant = 'primary',
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cx(buttonBaseClass, variantClasses[variant], className)}
      {...props}
    />
  )
}

export {
  Button,
  ButtonLink,
  type ButtonLinkProps,
  type ButtonProps,
  type ButtonVariant,
}
