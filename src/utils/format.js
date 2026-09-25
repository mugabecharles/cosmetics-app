export const fmt = (n) =>
  new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0 }).format(n ?? 0)

export const fmtNum = (n) =>
  new Intl.NumberFormat('en-UG').format(n ?? 0)

export const fmtDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const fmtDateTime = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export const paymentMethodLabel = (m) => {
  const map = { cash: 'Cash', mtn_momo: 'MTN MoMo', airtel_money: 'Airtel Money', bank: 'Bank', card: 'Card', credit: 'Credit', other: 'Other' }
  return map[m] || m
}

export const statusBadge = (s) => {
  const map = {
    active: 'badge-green', inactive: 'badge-gray',
    paid: 'badge-green', partial: 'badge-yellow', unpaid: 'badge-red',
    completed: 'badge-green', pending: 'badge-yellow', cancelled: 'badge-red',
    received: 'badge-green', approved: 'badge-green', rejected: 'badge-red',
    processed: 'badge-blue',
  }
  return map[s] || 'badge-gray'
}
