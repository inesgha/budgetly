import FieldMessage from './FieldMessage'
import { fieldClasses, labelClasses } from './field-styles'

// Champ avec un vrai <label>, une aide facultative et un message d'erreur relié par aria-describedby
export default function TextField({ id, label, error, hint, trailing, className = '', inputClassName = '', ...inputProps }) {
  const messageId = error || hint ? `${id}-${error ? 'error' : 'hint'}` : undefined

  return (
    <div className={className}>
      <label htmlFor={id} className={labelClasses}>
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          id={id}
          name={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={messageId}
          className={`${fieldClasses(error)} ${trailing ? 'pr-12' : ''} ${inputClassName}`}
          {...inputProps}
        />
        {trailing && <div className="absolute inset-y-0 right-1.5 flex items-center">{trailing}</div>}
      </div>
      <FieldMessage id={messageId} error={error} hint={hint} />
    </div>
  )
}
