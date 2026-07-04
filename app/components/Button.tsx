
import React, { forwardRef } from 'react'
import { cn } from './../lib/utils'
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-control font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
          {
            'bg-primary text-white hover:bg-primary-dark':
              variant === 'primary',
            'bg-transparent text-primary hover:bg-primary/10':
              variant === 'ghost',
            'bg-danger-bg text-danger-fg hover:bg-danger-bg/80':
              variant === 'danger',
            'border border-primary text-primary hover:bg-primary/5':
              variant === 'outline',
            'h-8 px-3 text-sm': size === 'sm',
            'h-10 px-4 py-2': size === 'md',
            'h-12 px-6 text-lg': size === 'lg',
          },
          className,
        )}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'
