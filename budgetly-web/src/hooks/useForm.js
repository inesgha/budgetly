import { useCallback, useState } from 'react'

/**
 * Valeurs et erreurs d'un formulaire.
 * validators : { nomDuChamp: (valeur) => "message d'erreur" ou "" }
 */
export function useForm(initialValues, validators) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})

  const handleChange = useCallback(
    (event) => {
      const { name, value } = event.target
      setValues((current) => ({ ...current, [name]: value }))

      // Un champ déjà en erreur est revalidé à chaque frappe : le message disparaît dès qu'il est corrigé
      setErrors((current) =>
        current[name] ? { ...current, [name]: validators[name]?.(value) ?? '' } : current,
      )
    },
    [validators],
  )

  // Valide tous les champs ; renvoie les erreurs (objet vide si tout est bon)
  const validate = useCallback(() => {
    const nextErrors = {}
    for (const [name, validator] of Object.entries(validators)) {
      const message = validator(values[name])
      if (message) {
        nextErrors[name] = message
      }
    }
    setErrors(nextErrors)
    return nextErrors
  }, [validators, values])

  // Modifie un champ depuis le code (ex. vider la catégorie quand on passe de Dépense à Revenu)
  const setValue = useCallback((name, value) => {
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => (current[name] ? { ...current, [name]: '' } : current))
  }, [])

  return { values, errors, setErrors, setValue, handleChange, validate }
}
