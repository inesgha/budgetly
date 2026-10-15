// Message quand il n'y a rien à afficher, avec une action facultative ("Ajouter une transaction")
export default function EmptyState({ icon: Icon, title, description, action, compact = false }) {
  return (
    <div className={`flex flex-col items-center text-center ${compact ? 'py-6' : 'py-12'}`}>
      {Icon && (
        <span className="mb-3 grid size-12 place-items-center rounded-full bg-primary-light text-primary">
          <Icon className="size-6" />
        </span>
      )}
      <p className="font-display text-base font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-xs text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
