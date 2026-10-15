// Champ avec un vrai <label>, une aide facultative et un message d'erreur relié par aria-describedby
export default function TextField({ id, label, error, hint, trailing, className = '', ...inputProps }) {
  const messageId = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  const borderColor = error
    ? 'border-danger focus:border-danger focus:ring-danger/15'
    : 'border-line hover:border-muted/40 focus:border-primary focus:ring-primary/20'

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          id={id}
          name={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={messageId}
          className={`block w-full rounded-control border bg-surface px-3.5 py-2.5 text-base text-ink transition-colors placeholder:text-muted/70 focus:ring-3 focus:outline-none ${borderColor} ${trailing ? 'pr-12' : ''}`}
          {...inputProps}
        />
        {trailing && <div className="absolute inset-y-0 right-1.5 flex items-center">{trailing}</div>}
      </div>
      {error ? (
        <p id={messageId} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={messageId} className="mt-1.5 text-sm text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
