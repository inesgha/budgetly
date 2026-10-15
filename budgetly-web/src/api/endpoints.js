// Une fonction par route de l'API : les composants ne manipulent jamais d'URL directement
import client from './client'

// Retire les filtres vides pour ne pas envoyer "?categoryId=&search="
function cleanParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined),
  )
}

export async function getStatsSummary({ month, year }, signal) {
  const { data } = await client.get('/api/stats/summary', { params: { month, year }, signal })
  return data
}

// L'API renvoie toujours les N derniers mois jusqu'au mois en cours (pas de paramètre month/year)
export async function getMonthlyStats(months, signal) {
  const { data } = await client.get('/api/stats/monthly', { params: { months }, signal })
  return data
}

export async function getBudgets({ month, year }, signal) {
  const { data } = await client.get('/api/budgets', { params: { month, year }, signal })
  return data
}

/** payload : { categoryId, limit, month, year } ; 409 si un budget existe déjà pour cette catégorie ce mois-ci */
export async function createBudget(payload) {
  const { data } = await client.post('/api/budgets', payload)
  return data
}

/** Seule la limite est modifiable */
export async function updateBudget(id, limit) {
  const { data } = await client.put(`/api/budgets/${id}`, { limit })
  return data
}

/** Supprime aussi les alertes du budget (côté API) */
export async function deleteBudget(id) {
  await client.delete(`/api/budgets/${id}`)
}

/** Toutes les alertes, les plus récentes d'abord : { id, level, message, isRead, createdAt, budgetId } */
export async function getAlerts(signal) {
  const { data } = await client.get('/api/alerts', { signal })
  return data
}

export async function markAlertRead(id) {
  await client.patch(`/api/alerts/${id}/read`)
}

/** Marque TOUTES les alertes de l'utilisateur comme lues (tous mois confondus) */
export async function markAllAlertsRead() {
  await client.patch('/api/alerts/read-all')
}

export async function getCategories(signal) {
  const { data } = await client.get('/api/categories', { signal })
  return data
}

/** payload : { name, color: "#RRGGBB", icon, type: "Expense" | "Income" } */
export async function createCategory(payload) {
  const { data } = await client.post('/api/categories', payload)
  return data
}

export async function updateCategory(id, payload) {
  const { data } = await client.put(`/api/categories/${id}`, payload)
  return data
}

/** 409 si des transactions ou des budgets l'utilisent (message clair renvoyé par l'API) */
export async function deleteCategory(id) {
  await client.delete(`/api/categories/${id}`)
}

/** filters : { month, year, type, categoryId, search, page, pageSize } -> { items, page, pageSize, totalCount, totalPages } */
export async function getTransactions(filters, signal) {
  const { data } = await client.get('/api/transactions', { params: cleanParams(filters), signal })
  return data
}

/** payload : { amount, date: "YYYY-MM-DD", note, categoryId } */
export async function createTransaction(payload) {
  const { data } = await client.post('/api/transactions', payload)
  return data
}

export async function updateTransaction(id, payload) {
  const { data } = await client.put(`/api/transactions/${id}`, payload)
  return data
}

export async function deleteTransaction(id) {
  await client.delete(`/api/transactions/${id}`)
}
