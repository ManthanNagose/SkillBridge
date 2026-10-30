const VARIANT_CLASS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
}

// Defaults to type="button" so a button never submits a form by accident.
// While loading it is disabled, shows a spinner and sets aria-busy; pass the
// in-progress label (for example "Saving…") as children.
function Button({
  variant = 'primary',
  type = 'button',
  loading = false,
  disabled = false,
  className = '',
  children,
  ...props
}) {
  const classes = ['btn', VARIANT_CLASS[variant] ?? VARIANT_CLASS.primary, className]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      {...props}
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading && <span className="btn-spinner" aria-hidden="true" />}
      {children}
    </button>
  )
}

export default Button
