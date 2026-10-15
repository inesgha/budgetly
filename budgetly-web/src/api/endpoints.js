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

export async function getCategories(signal) {
  const { data } = await client.get('/api/categories', { signal })
  return data
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
