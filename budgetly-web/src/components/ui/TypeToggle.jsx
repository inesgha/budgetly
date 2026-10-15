const TYPES = [
  { value: 'Expense', label: 'Dépense' },
  { value: 'Income', label: 'Revenu' },
]

/**
 * Choix Dépense / Revenu en deux segments. Ce sont de vrais boutons radio (masqués visuellement) :
 * flèches du clavier, lecteurs d'écran et focus visible fonctionnent sans code en plus.
 */
export default function TypeToggle({ name = 'type', legend = 'Type', value, onChange, disabled = false }) {
  return (
    <fieldset disabled={disabled}>
      <legend className="sr-only">{legend}</legend>
      <div className="grid grid-cols-2 gap-1 rounded-control bg-background p-1">
        {TYPES.map((type) => (
          <label key={type.value} className="relative">
            <input
              type="radio"
              name={name}
              value={type.value}
              checked={value === type.value}
              onChange={() => onChange(type.value)}
              className="peer sr-only"
            />
            <span className="block cursor-pointer rounded-[9px] px-3 py-2 text-center text-sm font-semibold text-muted transition-colors peer-checked:bg-surface peer-checked:text-ink peer-checked:shadow-sm peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary peer-disabled:cursor-not-allowed hover:text-ink">
              {type.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
