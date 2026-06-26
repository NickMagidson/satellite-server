import type { ComponentPropsWithoutRef, ReactNode } from 'react'

type CardProps = ComponentPropsWithoutRef<'section'>

interface CardSectionProps {
  children: ReactNode
  className?: string
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function Card({ className, ...props }: CardProps) {
  return (
    <section
      className={cx(
        'rounded-xl border border-slate-200 bg-white text-slate-950 shadow-xl',
        className,
      )}
      {...props}
    />
  )
}

function CardHeader({ children, className }: CardSectionProps) {
  return (
    <div className={cx('border-b border-slate-200 p-4', className)}>
      {children}
    </div>
  )
}

function CardBody({ children, className }: CardSectionProps) {
  return <div className={cx('p-4', className)}>{children}</div>
}

function CardFooter({ children, className }: CardSectionProps) {
  return (
    <div className={cx('border-t border-slate-200 p-4', className)}>
      {children}
    </div>
  )
}

export { Card, CardBody, CardFooter, CardHeader }
