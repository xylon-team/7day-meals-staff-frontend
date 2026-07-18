import React, { forwardRef } from 'react'
import { cn } from '../lib/utils'
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
  error?: string
}
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, error, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          suppressHydrationWarning={true}
          className={cn(
            'flex h-10 w-full rounded-control border border-line bg-card px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50',
            icon && 'pl-10',
            error && 'border-danger-fg focus:ring-danger-fg',
            className,
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-danger-fg">{error}</p>}
      </div>
    )
  },
)
Input.displayName = 'Input'
