import { useState, useMemo, useCallback } from 'react'
import { PieChart, Pie, Cell } from 'recharts'
import BankIcon from '../components/BankIcon'
import {
  getLoans,
  getPayments,
  togglePayment,
  getPaymentStatus,
} from '../utils/loanStorage'
import {
  calcMonthlyDue,
  calcMonthlyDueForMonth,
  calcRemainingPrincipal,
  getUpcomingRepayments,
  getCurrentMonthRepayments,
} from '../utils/loanCalc'

const BORROWER_STYLES = {
  '我': {
    dot: 'bg-blue-500',
    tagBg: 'bg-blue-50',
    tagText: 'text-blue-600',
  },
  '小贾': {
    dot: 'bg-pink-500',
    tagBg: 'bg-pink-50',
    tagText: 'text-pink-600',
  },
  '妈妈': {
    dot: 'bg-emerald-500',
    tagBg: 'bg-emerald-50',
    tagText: 'text-emerald-600',
  },
}

function fmt(n) {
  return n.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function fmtShort(n) {
  return Math.round(n).toLocaleString('zh-CN')
}

function getCurrentMonth() {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
}

export default function Dashboard() {
  const [loans, setLoans] = useState(() => getLoans())
  const [payments, setPayments] = useState(() => getPayments())
  const [selectedBorrower, setSelectedBorrower] = useState(null)

  const currentMonth = useMemo(getCurrentMonth, [])

  // ---- Donut data: paid vs unpaid, borrower subtotals ----
  const { paidTotal, unpaidTotal, borrowerTotals } = useMemo(() => {
    let paid = 0
    let unpaid = 0
    const bt = { '我': 0, '小贾': 0, '妈妈': 0 }

    for (const loan of loans) {
      const due = calcMonthlyDue(loan)
      if (getPaymentStatus(loan.id, currentMonth)) {
        paid += due
      } else {
        unpaid += due
      }
      if (bt[loan.borrower] !== undefined) {
        bt[loan.borrower] += due
      }
    }
    return { paidTotal: paid, unpaidTotal: unpaid, borrowerTotals: bt }
  }, [loans, payments, currentMonth])

  // ---- Weighted average rate ----
  const weightedRate = useMemo(() => {
    let totalWeight = 0
    let weightedSum = 0
    for (const loan of loans) {
      const principal =
        loan.type === 'equal_installment'
          ? calcRemainingPrincipal(loan)
          : loan.totalAmount
      totalWeight += principal
      weightedSum += principal * loan.annualRate
    }
    return totalWeight > 0 ? weightedSum / totalWeight : 0
  }, [loans])

  // ---- Upcoming repayments ----
  const upcoming = useMemo(() => {
    const daysAhead =
      Number(localStorage.getItem('loan-tracker-reminder-days')) || 7
    const items = getUpcomingRepayments(loans, daysAhead)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return items
      .map((loan) => {
        let nextDate = new Date(
          today.getFullYear(),
          today.getMonth(),
          loan.repaymentDay,
        )
        if (nextDate < today) {
          nextDate = new Date(
            today.getFullYear(),
            today.getMonth() + 1,
            loan.repaymentDay,
          )
        }
        const daysUntil = Math.round(
          (nextDate - today) / (1000 * 60 * 60 * 24),
        )
        const dueMonth =
          nextDate.getFullYear() +
          '-' +
          String(nextDate.getMonth() + 1).padStart(2, '0')
        return {
          ...loan,
          daysUntil,
          dueMonth,
          dueAmount: calcMonthlyDueForMonth(loan, dueMonth),
        }
      })
      .filter((item) => !getPaymentStatus(item.id, item.dueMonth))
      .sort((a, b) => a.daysUntil - b.daysUntil)
  }, [loans, payments, currentMonth])

  // ---- Monthly repayment list (filtered by borrower) ----
  const monthlyItems = useMemo(() => {
    const filtered = selectedBorrower
      ? loans.filter((l) => l.borrower === selectedBorrower)
      : loans
    return getCurrentMonthRepayments(filtered)
  }, [loans, selectedBorrower])

  // ---- Toggle handler ----
  const handleToggle = useCallback(
    (loanId) => {
      togglePayment(loanId, currentMonth)
      setPayments(getPayments())
    },
    [currentMonth],
  )

  // ---- Pie chart data ----
  const hasLoans = loans.length > 0
  const pieData =
    paidTotal === 0 && unpaidTotal === 0
      ? [{ value: 1 }]
      : [
          { value: paidTotal },
          { value: unpaidTotal },
        ]
  const pieColors =
    paidTotal === 0 && unpaidTotal === 0
      ? ['#E5E7EB']
      : ['#3B82F6', '#E5E7EB']

  return (
    <div className="px-5 pt-12 pb-8">
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">总览</h1>

      {/* ====== Area 1: Donut Chart ====== */}
      <div className="mt-6 flex flex-col items-center">
        <div className="relative">
          <PieChart width={200} height={200}>
            <Pie
              data={pieData}
              cx={100}
              cy={100}
              innerRadius={65}
              outerRadius={90}
              dataKey="value"
              stroke="none"
              startAngle={90}
              endAngle={-270}
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={pieColors[i]} />
              ))}
            </Pie>
          </PieChart>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-bold text-gray-900">
              ¥{fmtShort(unpaidTotal)}
            </span>
            <span className="text-xs text-gray-400 mt-0.5">本月待还</span>
          </div>
        </div>
        {loans.length > 0 && (
          <p className="text-xs text-gray-400 mt-2">
            加权平均利率 <span className="text-gray-600 font-medium">{weightedRate.toFixed(2)}%</span>
          </p>
        )}

        {/* Borrower cards */}
        <div className="flex gap-3 mt-4 w-full">
          {Object.entries(BORROWER_STYLES).map(([name, cfg]) => (
            <button
              key={name}
              onClick={() =>
                setSelectedBorrower((prev) =>
                  prev === name ? null : name,
                )
              }
              className={`flex-1 flex items-center gap-2 rounded-2xl p-3 transition-all ${
                selectedBorrower === name
                  ? 'bg-gray-100 ring-2 ring-gray-300'
                  : 'bg-gray-50'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`}
              />
              <div className="flex flex-col items-start min-w-0">
                <span className="text-xs text-gray-500">{name}</span>
                <span className="text-sm font-semibold text-gray-900 truncate">
                  ¥{fmtShort(borrowerTotals[name])}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ====== Area 2: Urgent Reminders ====== */}
      {upcoming.length > 0 && (
        <div className="mt-6 bg-gradient-to-r from-orange-400 to-orange-500 rounded-2xl p-4">
          {upcoming.map((item, i) => (
            <div key={item.id}>
              {i > 0 && <div className="border-t border-white/30 my-3" />}
              <div className="flex items-center justify-between text-white">
                <span className="font-medium">
                  {item.bankName} ·{' '}
                  {item.daysUntil === 0
                    ? '今天到期'
                    : `${item.daysUntil}天后到期`}
                </span>
                <span className="font-semibold">
                  ¥{fmt(item.dueAmount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ====== Area 3: Monthly Repayment List ====== */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">本月还款</h2>
          <span className="text-sm text-gray-400">
            共{monthlyItems.length}笔
          </span>
        </div>

        {monthlyItems.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <p className="text-gray-400 text-sm">
              {hasLoans ? '该贷款人本月暂无还款' : '暂无贷款数据'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {monthlyItems.map((item) => {
              const isPaid = getPaymentStatus(item.id, currentMonth)
              const bs =
                BORROWER_STYLES[item.borrower] || BORROWER_STYLES['我']

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3"
                >
                  {/* Brand color bar */}
                  <div
                    className="w-1 self-stretch rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />

                  <BankIcon bankName={item.bankName} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-gray-900 truncate">
                        {item.bankName}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${bs.tagBg} ${bs.tagText}`}
                      >
                        {item.borrower}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">
                      {item.repaymentDay}号还款
                    </div>
                  </div>

                  {/* Right: type tag + amount */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                        item.type === 'equal_installment'
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-orange-50 text-orange-600'
                      }`}
                    >
                      {item.type === 'equal_installment'
                        ? '等额本息'
                        : '先息后本'}
                    </span>
                    <span className="text-lg font-semibold text-gray-900">
                      ¥{fmt(item.dueAmount)}
                    </span>
                  </div>

                  {/* Check button */}
                  <button
                    onClick={() => handleToggle(item.id)}
                    className="flex-shrink-0 w-11 h-11 flex items-center justify-center -mr-2"
                  >
                    {isPaid ? (
                      <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth={3}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-4 h-4"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full border-2 border-gray-300" />
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
