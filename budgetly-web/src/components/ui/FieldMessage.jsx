// Message sous un champ : l'erreur (rouge) remplace l'aide (gris)
export default function FieldMessage({ id, error, hint }) {
  if (error) {
    return (
      <p id={id} className="mt-1.5 text-sm text-danger">
        {error}
      </p>
    )
  }
  if (hint) {
    return (
      <p id={id} className="mt-1.5 text-sm text-muted">
        {hint}
      </p>
    )
  }
  return null
}
