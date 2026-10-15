import { SearchIcon } from '../icons'
import SelectField from '../ui/SelectField'
import { fieldClasses } from '../ui/field-styles'

const TYPE_FILTERS = [
  { value: 'all', label: 'Tout' },
  { value: 'Expense', label: 'Dépenses' },
  { value: 'Income', label: 'Revenus' },
]

// Recherche, pastilles Tout / Dépenses / Revenus et liste des catégories
export default function TransactionFilters({ search, onSearchChange, type, onTypeChange, categoryId, onCategoryChange, categories }) {
  const expenseCategories = categories.filter((category) => category.type === 'Expense')
  const incomeCategories = categories.filter((category) => category.type === 'Income')

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <label htmlFor="transaction-search" className="sr-only">
          Rechercher une transaction
        </label>
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted" />
        <input
          id="transaction-search"
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Rechercher un libellé ou une catégorie…"
          maxLength={100}
          className={`${fieldClasses()} pl-11`}
        />
      </div>

      <div role="group" aria-label="Type de transaction" className="flex gap-1.5">
        {TYPE_FILTERS.map(({ value, label }) => {
          const pressed = type === value
          return (
            <button
              key={value}
              type="button"
              aria-pressed={pressed}
              onClick={() => onTypeChange(value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                pressed ? 'bg-ink text-white' : 'border border-line bg-surface text-muted hover:text-ink'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      <SelectField
        id="category-filter"
        label="Catégorie"
        hideLabel
        value={categoryId}
        onChange={(event) => onCategoryChange(event.target.value)}
        className="lg:w-60"
      >
        <option value="">Toutes les catégories</option>
        {type !== 'Income' && expenseCategories.length > 0 && (
          <optgroup label="Dépenses">
            {expenseCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </optgroup>
        )}
        {type !== 'Expense' && incomeCategories.length > 0 && (
          <optgroup label="Revenus">
            {incomeCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </optgroup>
        )}
      </SelectField>
    </div>
  )
}
