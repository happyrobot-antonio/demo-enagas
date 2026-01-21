import clsx from 'clsx'

const Skeleton = ({ className, variant = 'default', ...props }) => {
  const variants = {
    default: 'skeleton',
    text: 'skeleton h-4',
    title: 'skeleton h-8',
    circle: 'skeleton rounded-full',
    button: 'skeleton h-10',
    card: 'skeleton h-32',
  }

  return (
    <div
      className={clsx(variants[variant], className)}
      {...props}
    />
  )
}

/**
 * Skeleton for StatCard
 */
export const StatCardSkeleton = () => (
  <div className="bento-card space-y-3">
    <Skeleton variant="text" className="w-1/3" />
    <Skeleton variant="title" className="w-1/2" />
    <Skeleton variant="text" className="w-1/4" />
  </div>
)

/**
 * Skeleton for Ticket Card
 */
export const TicketCardSkeleton = () => (
  <div className="card p-6 space-y-4">
    <div className="flex items-start justify-between gap-2">
      <div className="space-y-2 flex-1">
        <Skeleton variant="text" className="w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </div>
    </div>
    <div className="space-y-2">
      <Skeleton variant="text" className="w-3/4" />
      <Skeleton variant="text" className="w-full" />
      <Skeleton variant="text" className="w-2/3" />
    </div>
    <div className="flex justify-between pt-2 border-t">
      <Skeleton variant="text" className="w-32" />
      <Skeleton variant="text" className="w-24" />
    </div>
  </div>
)

/**
 * Skeleton for Emergency Card
 */
export const EmergencyCardSkeleton = () => (
  <div className="card p-6 space-y-4 border-l-4">
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-2 flex-1">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-5 w-24 rounded-full" />
    </div>
    <div className="flex items-start gap-3">
      <Skeleton variant="circle" className="w-5 h-5" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" className="w-3/4" />
        <Skeleton variant="text" className="w-1/2" />
      </div>
    </div>
    <div className="bg-secondary/50 rounded-lg p-4">
      <Skeleton variant="text" className="w-full mb-2" />
      <Skeleton variant="text" className="w-5/6" />
    </div>
  </div>
)

/**
 * Skeleton for Call Item
 */
export const CallItemSkeleton = () => (
  <div className="pl-12 relative">
    <div className="absolute left-2.5 top-6 w-3 h-3 rounded-full bg-muted" />
    <div className="card p-6 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <Skeleton variant="circle" className="w-10 h-10" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="w-48" />
            <Skeleton variant="text" className="w-32" />
          </div>
        </div>
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton variant="text" className="w-full" />
          <Skeleton variant="text" className="w-3/4" />
        </div>
        <div className="space-y-2">
          <Skeleton variant="text" className="w-full" />
          <Skeleton variant="text" className="w-2/3" />
        </div>
      </div>
    </div>
  </div>
)

/**
 * Skeleton for Dashboard Stats Grid
 */
export const DashboardStatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {[1, 2, 3, 4].map((i) => (
      <StatCardSkeleton key={i} />
    ))}
  </div>
)

/**
 * Skeleton for List
 */
export const ListSkeleton = ({ count = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <TicketCardSkeleton key={i} />
    ))}
  </div>
)

export default Skeleton
