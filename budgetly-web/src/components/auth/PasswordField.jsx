import { useState } from 'react'
import { EyeIcon, EyeOffIcon } from '../icons'
import TextField from './TextField'

export default function PasswordField({ id, ...props }) {
  const [visible, setVisible] = useState(false)

  return (
    <TextField
      id={id}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          aria-pressed={visible}
          aria-controls={id}
          className="grid size-9 place-items-center rounded-[9px] text-muted transition-colors hover:bg-background hover:text-ink"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      }
      {...props}
    />
  )
}
