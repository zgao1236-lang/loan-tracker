/**
 * 等额本息：剩余期数
 */
export function calcRemainingPeriods(loan) {
  return loan.totalPeriods - loan.paidPeriods
}

/**
 * 等额本息：剩余本金（标准摊销公式逐期计算）
 *
 * 每期还款后剩余本金 = 上期剩余本金 × (1 + 月利率) - 月供
 * 从第 0 期（原始本金）迭代到 paidPeriods 期
 */
export function calcRemainingPrincipal(loan) {
  const monthlyRate = loan.annualRate / 100 / 12
  let balance = loan.totalAmount
  for (let i = 0; i < loan.paidPeriods; i++) {
    balance = balance * (1 + monthlyRate) - loan.monthlyPayment
  }
  // 避免浮点误差导致的微小负数
  return Math.max(0, Math.round(balance * 100) / 100)
}

/**
 * 先息后本：距到期日剩余天数
 */
export function calcDaysToMaturity(loan) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const maturity = new Date(loan.maturityDate)
  maturity.setHours(0, 0, 0, 0)
  return Math.ceil((maturity - today) / (1000 * 60 * 60 * 24))
}

/**
 * 本月应还金额
 */
export function calcMonthlyDue(loan) {
  const now = new Date()
  const yearMonth =
    now.getFullYear() +
    '-' +
    String(now.getMonth() + 1).padStart(2, '0')
  return calcMonthlyDueForMonth(loan, yearMonth)
}

/**
 * 指定月份应还金额
 * 先息后本在到期月份：返回本金 + 当月利息
 */
export function calcMonthlyDueForMonth(loan, yearMonth) {
  if (loan.type === 'equal_installment') {
    return loan.monthlyPayment
  }

  // 先息后本
  const maturityMonth = loan.maturityDate.slice(0, 7) // YYYY-MM
  if (yearMonth === maturityMonth) {
    return loan.totalAmount + loan.monthlyInterest
  }
  return loan.monthlyInterest
}

/**
 * 获取未来 N 天内有还款日的贷款列表
 */
export function getUpcomingRepayments(loans, daysAhead = 7) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(today)
  end.setDate(end.getDate() + daysAhead)

  return loans.filter((loan) => {
    // 在当月和下月范围内查找还款日
    for (let m = 0; m <= 1; m++) {
      const d = new Date(today.getFullYear(), today.getMonth() + m, loan.repaymentDay)
      if (d >= today && d <= end) return true
    }
    return false
  })
}

/**
 * 本月所有应还款项，按还款日从近到远排序
 */
export function getCurrentMonthRepayments(loans) {
  const now = new Date()
  const today = now.getDate()

  return loans
    .map((loan) => ({
      ...loan,
      dueAmount: calcMonthlyDue(loan),
      // 距还款日天数（负数表示已过）
      daysUntilDue: loan.repaymentDay - today,
    }))
    .sort((a, b) => {
      // 未来的排前面，已过的排后面；同方向按日期近到远
      const aFuture = a.daysUntilDue >= 0 ? 0 : 1
      const bFuture = b.daysUntilDue >= 0 ? 0 : 1
      if (aFuture !== bFuture) return aFuture - bFuture
      return a.repaymentDay - b.repaymentDay
    })
}

/**
 * 计算未来 N 个月每月末的总负债余额（用于折线图）
 *
 * 等额本息：逐月摊销递减
 * 先息后本：到期月归零，否则不变
 */
export function calcTotalDebtByMonth(loans, monthsAhead = 12) {
  const now = new Date()
  const result = []

  for (let m = 0; m < monthsAhead; m++) {
    const year = now.getFullYear() + Math.floor((now.getMonth() + m) / 12)
    const month = (now.getMonth() + m) % 12
    const label =
      year + '-' + String(month + 1).padStart(2, '0')

    let totalDebt = 0

    for (const loan of loans) {
      if (loan.type === 'equal_installment') {
        // 从当前剩余本金开始，再向前摊销 m 期
        const monthlyRate = loan.annualRate / 100 / 12
        let balance = calcRemainingPrincipalAtPeriod(loan, loan.paidPeriods + m)
        totalDebt += Math.max(0, balance)
      } else {
        // 先息后本：到期月之后归零
        const maturityMonth = loan.maturityDate.slice(0, 7)
        if (label > maturityMonth) {
          // 已过到期月，本金已还清
        } else {
          totalDebt += loan.totalAmount
        }
      }
    }

    result.push({ month: label, debt: Math.round(totalDebt * 100) / 100 })
  }

  return result
}

/**
 * 内部辅助：计算等额本息在第 n 期后的剩余本金
 */
function calcRemainingPrincipalAtPeriod(loan, n) {
  const monthlyRate = loan.annualRate / 100 / 12
  let balance = loan.totalAmount
  const periods = Math.min(n, loan.totalPeriods)
  for (let i = 0; i < periods; i++) {
    balance = balance * (1 + monthlyRate) - loan.monthlyPayment
  }
  return Math.max(0, Math.round(balance * 100) / 100)
}
