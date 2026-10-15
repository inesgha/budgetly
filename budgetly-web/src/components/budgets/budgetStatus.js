// Apparence de chaque statut de budget calculé par l'API (ok < 80 %, warning ≥ 80 %, reached = 100 %, exceeded > 100 %)

export const BUDGET_STATUS = {
  ok: {
    label: () => 'OK',
    badge: 'bg-success/12 text-success',
    bar: 'bg-success',
  },
  warning: {
    label: (percent) => `${percent} %`,
    badge: 'bg-warning/15 text-warning-ink',
    bar: 'bg-warning',
  },
  reached: {
    label: () => 'Atteint',
    badge: 'bg-primary-light text-primary-hover',
    bar: 'bg-primary',
  },
  exceeded: {
    label: () => 'Dépassé',
    badge: 'bg-danger-light text-danger',
    bar: 'bg-danger',
  },
}

export function getBudgetStatus(status) {
  return BUDGET_STATUS[status] ?? BUDGET_STATUS.ok
}
