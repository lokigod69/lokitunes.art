// Dev-only logging utilities (silenced in production)

export const devLog = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Dev]', ...args)
  }
}

export const devWarn = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[Dev]', ...args)
  }
}
