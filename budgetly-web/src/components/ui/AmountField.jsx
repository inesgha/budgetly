import FieldMessage from './FieldMessage'
import { fieldClasses, labelClasses } from './field-styles'

/**
 * Grand champ de montant en dinars, avec "DT" à droite.
 * type="text" + inputMode="decimal" : clavier numérique sur mobile, et la virgule est acceptée ("12,5").
 */
export default function AmountField({ id, label, error, hint, autoFocus = false, ...inputProps }) {
  const messageId = error || hint ? `${id}-${error ? 'error' : 'hint'}` : undefined

  return (
    <div>
      <label htmlFor={id} className={labelClasses}>
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          id={id}
          name={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0,000"
          aria-invalid={error ? true : undefined}
          aria-describedby={messageId}
          data-autofocus={autoFocus || undefined}
          className={`${fieldClasses(error, { large: true })} pr-14 tabular-nums`}
          {...inputProps}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-4 flex items-center font-display text-lg font-semibold text-muted"
        >
          DT
        </span>
      </div>
      <FieldMessage id={messageId} error={error} hint={hint} />
    </div>
  )
}
