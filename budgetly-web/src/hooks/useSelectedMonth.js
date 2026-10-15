import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

/** Mois en cours selon l'horloge de l'ordinateur : { month: 10, year: 2026 } */
export function getCurrentMonth() {
  const today = new Date()
  return { month: today.getMonth() + 1, year: today.getFullYear() }
}

/** Lit ?month=10&year=2026 dans l'URL ; absent ou invalide -> mois en cours */
export function readMonthFromParams(searchParams) {
  const month = Number(searchParams.get('month'))
  const year = Number(searchParams.get('year'))
  const valid = Number.isInteger(month) && month >= 1 && month <= 12 && Number.isInteger(year) && year >= 2000 && year <= 2100

  return valid ? { month, year } : getCurrentMonth()
}

/** "?month=10&year=2026" à recopier dans les liens, pour rester sur le même mois en changeant de page */
export function monthSearch(searchParams) {
  const month = searchParams.get('month')
  const year = searchParams.get('year')
  return month && year ? `?month=${month}&year=${year}` : ''
}

/** Mois affiché, gardé dans l'URL : partagé entre le tableau de bord et les transactions */
export function useSelectedMonth() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { month, year } = readMonthFromParams(searchParams)
  const current = getCurrentMonth()
  const isCurrentMonth = month === current.month && year === current.year

  const setMonth = useCallback(
    (nextMonth, nextYear) => {
      // replace : changer de mois ne remplit pas l'historique du bouton "Retour"
      setSearchParams(
        (params) => {
          const next = new URLSearchParams(params)
          next.set('month', String(nextMonth))
          next.set('year', String(nextYear))
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const shift = useCallback(
    (delta) => {
      // new Date(2026, 12, 1) = 1er janvier 2027 : JavaScript gère le passage d'année
      const date = new Date(year, month - 1 + delta, 1)
      setMonth(date.getMonth() + 1, date.getFullYear())
    },
    [month, year, setMonth],
  )

  const goToCurrentMonth = useCallback(() => {
    const { month: currentMonth, year: currentYear } = getCurrentMonth()
    setMonth(currentMonth, currentYear)
  }, [setMonth])

  return useMemo(
    () => ({
      month,
      year,
      isCurrentMonth,
      setMonth,
      goToPrevious: () => shift(-1),
      goToNext: () => shift(1),
      goToCurrentMonth,
      search: `?month=${month}&year=${year}`,
    }),
    [month, year, isCurrentMonth, setMonth, shift, goToCurrentMonth],
  )
}
