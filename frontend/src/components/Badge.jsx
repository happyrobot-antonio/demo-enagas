import clsx from 'clsx'

const Badge = ({ children, variant = 'default', className }) => {
  const variants = {
    default: 'badge-default',
    primary: 'badge-primary',
    success: 'badge-success',
    danger: 'badge-destructive',
    warning: 'border-yellow-500/20 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    info: 'border-accent-blue/20 bg-accent-blue/10 text-accent-blue',
    // Legacy support
    destructive: 'badge-destructive',
    purple: 'border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-400',
  }

  return (
    <span className={clsx('badge', variants[variant], className)}>
      {children}
    </span>
  )
}

export default Badge
