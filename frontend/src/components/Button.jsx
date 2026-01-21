import { useRef } from 'react'
import clsx from 'clsx'
import gsap from 'gsap'

const Button = ({
  children,
  variant = 'default',
  size = 'default',
  className,
  onClick,
  disabled,
  ...props
}) => {
  const buttonRef = useRef(null)

  const handleClick = (e) => {
    if (disabled) return

    // Haptic feedback animation
    gsap.to(buttonRef.current, {
      scale: 0.95,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut',
    })

    onClick?.(e)
  }

  const variants = {
    default: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    ghost: 'btn-ghost',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  }

  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 px-3 text-xs',
    lg: 'h-11 px-8',
    icon: 'h-10 w-10',
  }

  return (
    <button
      ref={buttonRef}
      className={clsx(
        'btn',
        variants[variant],
        sizes[size],
        className
      )}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
