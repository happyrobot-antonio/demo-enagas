import clsx from 'clsx'

const Card = ({ 
  children, 
  className, 
  variant = 'default',
  hover = false,
  onClick,
  ...props 
}) => {
  const variants = {
    default: 'card',
    glass: 'glass card',
    bento: 'bento-card',
  }

  return (
    <div
      className={clsx(
        variants[variant],
        hover && 'hover-lift cursor-pointer',
        hover && 'hover:border-primary/50',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  )
}

const CardHeader = ({ children, className }) => (
  <div className={clsx('flex flex-col space-y-1.5 p-6', className)}>
    {children}
  </div>
)

const CardTitle = ({ children, className }) => (
  <h3 className={clsx('text-lg font-semibold leading-none tracking-tight', className)}>
    {children}
  </h3>
)

const CardDescription = ({ children, className }) => (
  <p className={clsx('text-sm text-muted-foreground', className)}>
    {children}
  </p>
)

const CardContent = ({ children, className }) => (
  <div className={clsx('p-6 pt-0', className)}>
    {children}
  </div>
)

const CardFooter = ({ children, className }) => (
  <div className={clsx('flex items-center p-6 pt-0', className)}>
    {children}
  </div>
)

Card.Header = CardHeader
Card.Title = CardTitle
Card.Description = CardDescription
Card.Content = CardContent
Card.Footer = CardFooter

export default Card
