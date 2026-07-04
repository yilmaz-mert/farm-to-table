import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'cherry' | 'accent' | 'outline' | 'success'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default:  'bg-raised text-muted border border-border',
  cherry:   'bg-cherry-100 text-cherry-800 dark:bg-cherry-950 dark:text-cherry-300',
  accent:   'bg-verdigris-100 text-verdigris-700 dark:bg-verdigris-900 dark:text-verdigris-300',
  outline:  'border border-border text-text',
  success:  'bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-300',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
