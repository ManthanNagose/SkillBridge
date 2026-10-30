import { useId } from 'react'

// Labelled text input. The hint and error are linked with aria-describedby,
// and an error also sets aria-invalid. multiline renders a <textarea>;
// options ([{ value, label }]) render a <select>.
// Other props go to the <input>, <textarea> or <select>.
function Input({ label, hint, error, id, multiline = false, options, className = '', ...props }) {
  const Control = options ? 'select' : multiline ? 'textarea' : 'input'
  const generatedId = useId()
  const inputId = id ?? generatedId
  const hintId = hint ? `${inputId}-hint` : null
  const errorId = error ? `${inputId}-error` : null
  const describedBy = [props['aria-describedby'], hintId, errorId].filter(Boolean).join(' ')

  return (
    <div className={['field', className].filter(Boolean).join(' ')}>
      <label className="label" htmlFor={inputId}>
        {label}
      </label>
      <Control
        {...props}
        id={inputId}
        className="input"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
      >
        {options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Control>
      {hint && (
        <p id={hintId} className="field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="field-error">
          {error}
        </p>
      )}
    </div>
  )
}

export default Input
