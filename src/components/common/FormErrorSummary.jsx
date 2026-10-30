import { useId } from 'react'

// Summary of a form's errors, shown above the form after a failed submit.
// The form moves focus here (pass a ref) so screen readers read it once.
// Each item with a fieldId links to that field and focuses it.
function FormErrorSummary({ ref, title = "There's a problem", items }) {
  const titleId = useId()
  if (!items.length) return null

  function focusField(event, fieldId) {
    event.preventDefault()
    document.getElementById(fieldId)?.focus()
  }

  return (
    <div ref={ref} className="error-summary" tabIndex={-1} aria-labelledby={titleId}>
      <h2 id={titleId} className="error-summary-title">
        {title}
      </h2>
      <ul>
        {items.map(({ fieldId, message }) => (
          <li key={fieldId ?? message}>
            {fieldId ? (
              <a href={`#${fieldId}`} onClick={(event) => focusField(event, fieldId)}>
                {message}
              </a>
            ) : (
              message
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default FormErrorSummary
