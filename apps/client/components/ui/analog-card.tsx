import { cn } from '@/lib/utils'

interface AnalogCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  as?: 'div' | 'section' | 'article' | 'aside'
}

/**
 * Analog chassis card — the foundational surface primitive.
 * Uses `chassis-shadow` utility for the raised bevel + drop shadow look.
 */
export function AnalogCard({ children, className, as: Tag = 'div', ...props }: AnalogCardProps) {
  return (
    <Tag
      className={cn(
        'bg-card border border-border rounded-lg chassis-shadow',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}

interface AnalogInsetProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

/**
 * Inset recessed panel — darker bg-popover with inner shadow.
 * Used for displays, meters, and data read-outs inside a chassis card.
 */
export function AnalogInset({ children, className, ...props }: AnalogInsetProps) {
  return (
    <div
      className={cn(
        'bg-popover border border-border rounded shadow-inner',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
