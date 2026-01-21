import { forwardRef } from 'react'
import clsx from 'clsx'

const Input = forwardRef(({ className, type = 'text', ...props }, ref) => {
  return (
    <input
      type={type}
      className={clsx('input', className)}
      ref={ref}
      {...props}
    />
  )
})

Input.displayName = 'Input'

export default Input
