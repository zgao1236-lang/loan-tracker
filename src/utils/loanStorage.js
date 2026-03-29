const LOANS_KEY = 'loan-tracker-loans'
const PAYMENTS_KEY = 'loan-tracker-payments'

function readJSON(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || []
  } catch {
    return []
  }
}

function writeJSON(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
}

// ---- 贷款 CRUD ----

export function getLoans() {
  return readJSON(LOANS_KEY)
}

export function saveLoan(loan) {
  const loans = getLoans()
  const idx = loans.findIndex((l) => l.id === loan.id)
  if (idx >= 0) {
    loans[idx] = loan
  } else {
    loans.push(loan)
  }
  writeJSON(LOANS_KEY, loans)
}

export function deleteLoan(id) {
  const loans = getLoans().filter((l) => l.id !== id)
  writeJSON(LOANS_KEY, loans)
  // 同时清除关联的还款记录
  const payments = getPayments().filter((p) => p.loanId !== id)
  writeJSON(PAYMENTS_KEY, payments)
}

// ---- 还款记录 ----

export function getPayments() {
  return readJSON(PAYMENTS_KEY)
}

export function togglePayment(loanId, month) {
  const payments = getPayments()
  const idx = payments.findIndex(
    (p) => p.loanId === loanId && p.month === month,
  )
  if (idx >= 0) {
    // 已存在，切换状态
    payments[idx].isPaid = !payments[idx].isPaid
    payments[idx].paidDate = payments[idx].isPaid
      ? new Date().toISOString().slice(0, 10)
      : null
  } else {
    // 不存在，创建并标记为已还
    payments.push({
      loanId,
      month,
      isPaid: true,
      paidDate: new Date().toISOString().slice(0, 10),
    })
  }
  writeJSON(PAYMENTS_KEY, payments)
  return payments[idx >= 0 ? idx : payments.length - 1]
}

export function getPaymentStatus(loanId, month) {
  const payments = getPayments()
  const record = payments.find(
    (p) => p.loanId === loanId && p.month === month,
  )
  return record?.isPaid ?? false
}
