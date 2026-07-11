const variants = {
  primary:
    'bg-command text-white shadow-[var(--shadow-glow)] hover:-translate-y-0.5 hover:bg-command-hover',
  secondary:
    'border border-border bg-surface text-ink hover:border-command-hover/40 hover:text-white',
}

function Button({
  children,
  variant = 'primary',
  type = 'button',
  className = '',
  ...rest
}) {
  return (
    <button
      type={type}
      className={`inline-flex h-12 items-center justify-center rounded-surface px-8 text-sm font-black uppercase tracking-[0.16em] transition duration-[var(--duration-base)] focus:outline-none focus-visible:ring-2 focus-visible:ring-command-hover focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant] ?? variants.primary} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

export default Button
