import React from 'react'
import { cn } from '../lib/utils'
interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}
export function Badge({
  className,
  variant = 'default',
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        {
          'bg-line text-ink': variant === 'default',
          'bg-success-bg text-success-fg': variant === 'success',
          'bg-warning-bg text-warning-fg': variant === 'warning',
          'bg-danger-bg text-danger-fg': variant === 'danger',
          'bg-info-bg text-info-fg': variant === 'info',
        },
        className,
      )}
      {...props}
    />
  )
}
