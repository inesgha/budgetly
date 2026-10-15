import { useId } from 'react'
import { PencilIcon, TrashIcon } from '../icons'

const iconButtonBase = 'grid size-9 place-items-center rounded-[9px] text-muted transition-colors'
const editButtonClasses = `${iconButtonBase} hover:bg-background hover:text-ink`
const deleteButtonClasses = `${iconButtonBase} hover:bg-danger-light hover:text-danger`

// Liste des catégories d'un type (Dépenses ou Revenus) avec les boutons Modifier / Supprimer
export default function CategoryList({ title, categories, emptyText, onEdit, onDelete }) {
  const titleId = useId()

  return (
    <section aria-labelledby={titleId}>
      <h3 id={titleId} className="text-sm font-semibold text-ink">
        {title} <span className="font-normal text-muted">({categories.length})</span>
      </h3>
      {categories.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{emptyText}</p>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {categories.map((category) => (
            <li key={category.id} className="flex items-center gap-3 py-2">
              <span aria-hidden="true" className="size-3 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
              <span className="min-w-0 flex-1 truncate text-sm text-ink">{category.name}</span>
              <button
                type="button"
                onClick={() => onEdit(category)}
                aria-label={`Modifier la catégorie ${category.name}`}
                className={editButtonClasses}
              >
                <PencilIcon className="size-[1.125rem]" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(category)}
                aria-label={`Supprimer la catégorie ${category.name}`}
                className={deleteButtonClasses}
              >
                <TrashIcon className="size-[1.125rem]" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
