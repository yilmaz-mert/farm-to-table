'use client'

import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'cta' | 'accent' | 'outline' | 'ghost' | 'secondary'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  asChild?: boolean
  loading?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-inverted hover:bg-primary-hover shadow-sm active:scale-[0.98]',
  cta:
    'bg-cta text-inverted hover:bg-cta-hover shadow-sm active:scale-[0.98]',
  accent:
    'bg-accent text-inverted hover:bg-accent-hover shadow-sm active:scale-[0.98]',
  outline:
    'border border-border-brand text-primary hover:bg-cherry-wash active:scale-[0.98]',
  ghost:
    'text-text hover:bg-raised active:bg-sunken',
  secondary:
    'bg-raised text-text border border-border hover:bg-sunken active:scale-[0.98]',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm:   'h-8 px-3 text-sm gap-1.5 rounded-md',
  md:   'h-10 px-4 text-sm gap-2 rounded-lg',
  lg:   'h-12 px-6 text-base gap-2.5 rounded-lg',
  icon: 'h-10 w-10 rounded-lg',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      asChild = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(
          'inline-flex items-center justify-center font-sans font-semibold',
          'transition-all duration-150 select-none',
          'disabled:pointer-events-none disabled:opacity-50',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </Comp>
    )
  }
)

Button.displayName = 'Button'
