import FieldMessage from './FieldMessage'
import { fieldClasses, labelClasses } from './field-styles'

// Liste déroulante native (<select>) : accessible au clavier et sur mobile sans effort
export default function SelectField({ id, label, error, hint, hideLabel = false, className = '', children, ...selectProps }) {
  const messageId = error || hint ? `${id}-${error ? 'error' : 'hint'}` : undefined

  return (
    <div className={className}>
      <label htmlFor={id} className={hideLabel ? 'sr-only' : labelClasses}>
        {label}
      </label>
      <select
        id={id}
        name={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={messageId}
        className={`${fieldClasses(error)} ${hideLabel ? '' : 'mt-1.5'} appearance-none bg-[url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='%235F5C68'%20stroke-width='1.75'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='m7%2010%205%205%205-5'/%3E%3C/svg%3E")] bg-[length:1.25rem] bg-[position:right_0.75rem_center] bg-no-repeat pr-10`}
        {...selectProps}
      >
        {children}
      </select>
      <FieldMessage id={messageId} error={error} hint={hint} />
    </div>
  )
}
