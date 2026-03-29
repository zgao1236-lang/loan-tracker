import { getBankColor } from '../data/banks'

/**
 * 创建等额本息贷款
 */
export function createEqualInstallmentLoan({
  bankName,
  borrower,
  totalAmount,
  annualRate,
  startDate,
  repaymentDay,
  totalPeriods,
  paidPeriods = 0,
  monthlyPayment,
  remark = '',
}) {
  return {
    id: Date.now().toString(),
    bankName,
    borrower,
    totalAmount: Number(totalAmount),
    annualRate: Number(annualRate),
    startDate,
    repaymentDay: Number(repaymentDay),
    type: 'equal_installment',
    color: getBankColor(bankName),
    remark,
    totalPeriods: Number(totalPeriods),
    paidPeriods: Number(paidPeriods),
    monthlyPayment: Number(monthlyPayment),
  }
}

/**
 * 创建先息后本贷款
 */
export function createInterestOnlyLoan({
  bankName,
  borrower,
  totalAmount,
  annualRate,
  startDate,
  repaymentDay,
  maturityDate,
  monthlyInterest,
  remark = '',
}) {
  return {
    id: Date.now().toString(),
    bankName,
    borrower,
    totalAmount: Number(totalAmount),
    annualRate: Number(annualRate),
    startDate,
    repaymentDay: Number(repaymentDay),
    type: 'interest_only',
    color: getBankColor(bankName),
    remark,
    maturityDate,
    monthlyInterest: Number(monthlyInterest),
  }
}

/**
 * 月度还款记录
 */
export function createPaymentRecord(loanId, month) {
  return {
    loanId,
    month, // YYYY-MM
    isPaid: false,
    paidDate: null,
  }
}
