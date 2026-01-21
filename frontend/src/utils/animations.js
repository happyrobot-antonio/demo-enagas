import gsap from 'gsap'

/**
 * Smooth opacity + y-axis entrance animation
 */
export const fadeIn = (element, options = {}) => {
  const defaults = {
    opacity: 0,
    y: 20,
    duration: 0.6,
    ease: 'power3.out',
  }

  return gsap.fromTo(
    element,
    { opacity: 0, y: options.y || defaults.y },
    { ...defaults, ...options }
  )
}

/**
 * Stagger animation for multiple children elements
 */
export const staggerReveal = (elements, options = {}) => {
  const defaults = {
    opacity: 0,
    y: 30,
    duration: 0.6,
    stagger: 0.1,
    ease: 'power3.out',
  }

  return gsap.fromTo(
    elements,
    { opacity: 0, y: options.y || defaults.y },
    { ...defaults, ...options }
  )
}

/**
 * Subtle scale effect on hover (for cards, buttons)
 */
export const scaleOnHover = (element, scale = 1.02) => {
  const timeline = gsap.timeline({ paused: true })
  
  timeline.to(element, {
    scale: scale,
    duration: 0.3,
    ease: 'power2.out',
  })

  return {
    play: () => timeline.play(),
    reverse: () => timeline.reverse(),
  }
}

/**
 * Expand/collapse animation for expandable cards
 */
export const expandCard = (element, expanded = true) => {
  if (expanded) {
    return gsap.to(element, {
      height: 'auto',
      opacity: 1,
      duration: 0.3,
      ease: 'power2.inOut',
    })
  } else {
    return gsap.to(element, {
      height: 0,
      opacity: 0,
      duration: 0.3,
      ease: 'power2.inOut',
    })
  }
}

/**
 * Animated number counter for stats
 */
export const numberCounter = (element, from, to, options = {}) => {
  const defaults = {
    duration: 1,
    ease: 'power2.out',
  }

  const obj = { value: from }
  
  return gsap.to(obj, {
    value: to,
    ...defaults,
    ...options,
    onUpdate: () => {
      if (element) {
        element.textContent = Math.round(obj.value)
      }
    },
  })
}

/**
 * Pulse animation for emergency/active state indicators
 */
export const pulseIndicator = (element, options = {}) => {
  const defaults = {
    scale: 1.2,
    opacity: 0.7,
    duration: 1,
    repeat: -1,
    yoyo: true,
    ease: 'power1.inOut',
  }

  return gsap.to(element, { ...defaults, ...options })
}

/**
 * Slide in from side animation
 */
export const slideIn = (element, direction = 'left', options = {}) => {
  const defaults = {
    duration: 0.5,
    ease: 'power3.out',
  }

  const from = direction === 'left' ? { x: -100, opacity: 0 } : { x: 100, opacity: 0 }
  const to = { x: 0, opacity: 1 }

  return gsap.fromTo(element, from, { ...to, ...defaults, ...options })
}

/**
 * Notification flash animation (for new items)
 */
export const flashNotification = (element, options = {}) => {
  const defaults = {
    backgroundColor: '#0066cc',
    duration: 0.3,
    yoyo: true,
    repeat: 1,
    ease: 'power2.inOut',
  }

  return gsap.to(element, { ...defaults, ...options })
}

/**
 * Haptic-like feedback animation for buttons
 */
export const hapticFeedback = (element, options = {}) => {
  const defaults = {
    scale: 0.95,
    duration: 0.1,
    yoyo: true,
    repeat: 1,
    ease: 'power2.inOut',
  }

  return gsap.to(element, { ...defaults, ...options })
}

/**
 * Page transition animation
 */
export const pageTransition = (element, options = {}) => {
  const defaults = {
    opacity: 0,
    y: 20,
    duration: 0.5,
    ease: 'power3.out',
  }

  return gsap.fromTo(
    element,
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, ...defaults, ...options }
  )
}

/**
 * Shimmer loading effect
 */
export const shimmerEffect = (element, options = {}) => {
  const defaults = {
    backgroundPosition: '200% center',
    duration: 1.5,
    repeat: -1,
    ease: 'none',
  }

  return gsap.to(element, { ...defaults, ...options })
}

/**
 * Badge count animation (when number increases)
 */
export const badgeCountAnimation = (element, options = {}) => {
  const timeline = gsap.timeline()
  
  timeline
    .to(element, { scale: 1.3, duration: 0.2, ease: 'back.out(3)' })
    .to(element, { scale: 1, duration: 0.2, ease: 'power2.inOut' })

  return timeline
}

/**
 * Glow effect animation
 */
export const glowEffect = (element, options = {}) => {
  const defaults = {
    boxShadow: '0 0 20px rgba(0, 102, 204, 0.5)',
    duration: 0.3,
    ease: 'power2.out',
  }

  return gsap.to(element, { ...defaults, ...options })
}

/**
 * Remove glow effect
 */
export const removeGlow = (element, options = {}) => {
  const defaults = {
    boxShadow: '0 0 0 rgba(0, 102, 204, 0)',
    duration: 0.3,
    ease: 'power2.out',
  }

  return gsap.to(element, { ...defaults, ...options })
}

/**
 * Entrance animation for modal/dialog
 */
export const modalEntrance = (element, options = {}) => {
  const timeline = gsap.timeline()
  
  timeline
    .fromTo(
      element,
      { scale: 0.9, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' }
    )

  return timeline
}

/**
 * Exit animation for modal/dialog
 */
export const modalExit = (element, options = {}) => {
  return gsap.to(element, {
    scale: 0.9,
    opacity: 0,
    duration: 0.2,
    ease: 'power2.in',
  })
}

/**
 * Nav item hover animation
 */
export const navItemHover = (element, active = false) => {
  if (active) return null

  const timeline = gsap.timeline({ paused: true })
  
  timeline.to(element, {
    x: 4,
    duration: 0.2,
    ease: 'power2.out',
  })

  return timeline
}

/**
 * Ripple effect (for button clicks)
 */
export const rippleEffect = (element, x, y, options = {}) => {
  const ripple = document.createElement('span')
  ripple.style.position = 'absolute'
  ripple.style.borderRadius = '50%'
  ripple.style.backgroundColor = 'rgba(255, 255, 255, 0.6)'
  ripple.style.width = '10px'
  ripple.style.height = '10px'
  ripple.style.left = `${x}px`
  ripple.style.top = `${y}px`
  ripple.style.transform = 'translate(-50%, -50%)'
  ripple.style.pointerEvents = 'none'
  
  element.appendChild(ripple)

  return gsap.to(ripple, {
    width: '300px',
    height: '300px',
    opacity: 0,
    duration: 0.6,
    ease: 'power2.out',
    onComplete: () => {
      ripple.remove()
    },
  })
}

export default {
  fadeIn,
  staggerReveal,
  scaleOnHover,
  expandCard,
  numberCounter,
  pulseIndicator,
  slideIn,
  flashNotification,
  hapticFeedback,
  pageTransition,
  shimmerEffect,
  badgeCountAnimation,
  glowEffect,
  removeGlow,
  modalEntrance,
  modalExit,
  navItemHover,
  rippleEffect,
}
