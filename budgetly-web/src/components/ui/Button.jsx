import { SpinnerIcon } from '../icons'

const VARIANTS = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  secondary: 'border border-line bg-surface text-ink hover:bg-primary-light hover:text-primary-hover hover:border-primary-light',
  danger: 'bg-danger text-white hover:bg-[#931C13]',
  ghost: 'text-muted hover:bg-background hover:text-ink',
  'danger-ghost': 'text-danger hover:bg-danger-light',
}

const SIZES = {
  sm: 'gap-1.5 px-3 py-2 text-sm',
  md: 'gap-2 px-4 py-2.5 text-sm',
  lg: 'gap-2 px-5 py-3 text-base',
}

/**
 * Bouton : variant "primary" | "secondary" | "danger" | "ghost" | "danger-ghost".
 * loading : désactive le bouton et affiche loadingLabel (ex. "Enregistrement…").
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  loading = false,
  loadingLabel,
  icon: Icon,
  trailingIcon: TrailingIcon,
  className = '',
  disabled,
  children,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-control font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading ? <SpinnerIcon className="size-4" /> : Icon && <Icon className="size-[1.125rem]" />}
      {loading && loadingLabel ? loadingLabel : children}
      {!loading && TrailingIcon && <TrailingIcon className="size-[1.125rem]" />}
    </button>
  )
}
