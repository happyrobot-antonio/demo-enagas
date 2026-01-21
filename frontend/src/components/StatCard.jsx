import { useEffect, useRef } from 'react'
import clsx from 'clsx'
import gsap from 'gsap'

const StatCard = ({ title, value, icon: Icon, trend, subtitle, className }) => {
  const cardRef = useRef(null)
  const valueRef = useRef(null)
  const prevValue = useRef(value)

  useEffect(() => {
    // Entrance animation
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
    )
  }, [])

  useEffect(() => {
    // Animate value change
    if (prevValue.current !== value && valueRef.current) {
      gsap.fromTo(
        valueRef.current,
        { scale: 1.2, color: '#0066cc' },
        { scale: 1, color: 'inherit', duration: 0.3, ease: 'back.out(1.7)' }
      )
      prevValue.current = value
    }
  }, [value])

  return (
    <div
      ref={cardRef}
      className={clsx(
        'group relative bento-card hover:border-primary/30 cursor-default',
        className
      )}
    >
      {/* Subtle glow on hover */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-accent-blue/5 to-accent-green/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          <div className="flex items-baseline space-x-2">
            <p
              ref={valueRef}
              className="text-4xl font-bold tracking-tight"
            >
              {value}
            </p>
            {trend && (
              <span className={clsx(
                'text-sm font-medium',
                trend > 0 ? 'text-success' : 'text-destructive'
              )}>
                {trend > 0 ? '+' : ''}{trend}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground font-mono">
              {subtitle}
            </p>
          )}
        </div>

        {/* Icon - minimal monochrome */}
        {Icon && (
          <div className="flex-shrink-0">
            <Icon className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
          </div>
        )}
      </div>
    </div>
  )
}

export default StatCard
