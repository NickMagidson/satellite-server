import type { ComponentPropsWithoutRef, ReactNode } from 'react'

type CardProps = ComponentPropsWithoutRef<'section'> & {
  tone?: 'dark' | 'glass'
}

interface CardSectionProps {
  children: ReactNode
  className?: string
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function Card({ className, tone = 'glass', ...props }: CardProps) {
  return (
    <section
      className={cx(
        'rounded-md text-object',
        tone === 'dark'
          ? 'border border-void bg-void shadow-xl'
          : 'glass-panel',
        className,
      )}
      {...props}
    />
  )
}

function CardHeader({ children, className }: CardSectionProps) {
  return (
    <div className={cx('border-b border-line p-4', className)}>{children}</div>
  )
}

function CardBody({ children, className }: CardSectionProps) {
  return <div className={cx('p-4', className)}>{children}</div>
}

function CardFooter({ children, className }: CardSectionProps) {
  return (
    <div className={cx('border-t border-line p-4', className)}>{children}</div>
  )
}

export { Card, CardBody, CardFooter, CardHeader }
