import { useEffect, useRef } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import gsap from 'gsap'

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme()
  const buttonRef = useRef(null)
  const iconRef = useRef(null)

  useEffect(() => {
    // Animate icon change
    if (iconRef.current) {
      gsap.fromTo(
        iconRef.current,
        { scale: 0, rotation: -180 },
        { scale: 1, rotation: 0, duration: 0.3, ease: 'back.out(1.7)' }
      )
    }
  }, [theme])

  const handleClick = () => {
    // Animate button click
    gsap.to(buttonRef.current, {
      scale: 0.9,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut',
    })
    toggleTheme()
  }

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      className="relative inline-flex items-center justify-center h-9 w-9 rounded-md border border-border bg-background hover:bg-secondary transition-colors focus-ring"
      aria-label="Toggle theme"
    >
      <div ref={iconRef} className="relative">
        {theme === 'dark' ? (
          <Moon className="h-4 w-4 text-foreground" />
        ) : (
          <Sun className="h-4 w-4 text-foreground" />
        )}
      </div>
    </button>
  )
}

export default ThemeToggle
