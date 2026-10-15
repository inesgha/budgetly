import { readableTextColor } from '../../utils/colors'
import { CheckIcon } from '../icons'
import TextField from '../ui/TextField'
import { PALETTE } from './palette'

/**
 * Pastilles cliquables (vrais boutons radio, donc accessibles au clavier avec les flèches)
 * + champ hexadécimal pour une couleur libre. Les deux restent synchronisés.
 */
export default function ColorPicker({ value, onChange, error }) {
  const selected = value.toUpperCase()

  return (
    <div className="space-y-3">
      <fieldset>
        <legend className="text-sm font-medium text-ink">Couleur</legend>
        <div className="mt-2 flex flex-wrap gap-2.5">
          {PALETTE.map((color) => (
            <label key={color.value} className="relative">
              <input
                type="radio"
                name="color-swatch"
                value={color.value}
                checked={selected === color.value}
                onChange={() => onChange(color.value)}
                className="peer sr-only"
              />
              <span
                className="grid size-9 cursor-pointer place-items-center rounded-full ring-offset-2 transition-shadow peer-checked:ring-2 peer-checked:ring-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-primary"
                style={{ backgroundColor: color.value, color: readableTextColor(color.value) }}
              >
                {selected === color.value && <CheckIcon className="size-4" strokeWidth={2.5} />}
                <span className="sr-only">{color.name}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <TextField
        id="color"
        label="Ou un code couleur (hexadécimal)"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        error={error}
        placeholder="#5B3FE0"
        maxLength={7}
        autoComplete="off"
        spellCheck={false}
        inputClassName="max-w-48"
      />
    </div>
  )
}
