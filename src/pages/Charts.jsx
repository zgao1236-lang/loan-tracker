import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { getLoans } from '../utils/loanStorage'
import {
  calcMonthlyDue,
  calcMonthlyDueForMonth,
  calcTotalDebtByMonth,
} from '../utils/loanCalc'

function fmt(n) {
  return n.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function fmtShort(n) {
  return Math.round(n).toLocaleString('zh-CN')
}

function shortMonth(ym) {
  return Number(ym.split('-')[1]) + '月'
}

// ---- Chart 1 data: monthly repayment pressure ----
function buildBarData(loans) {
  const now = new Date()
  const data = []

  for (let m = 0; m < 12; m++) {
    const year = now.getFullYear() + Math.floor((now.getMonth() + m) / 12)
    const month = (now.getMonth() + m) % 12
    const ym = year + '-' + String(month + 1).padStart(2, '0')

    let regular = 0
    let maturity = 0
    let hasMaturity = false

    for (const loan of loans) {
      if (loan.type === 'equal_installment') {
        if (m < loan.totalPeriods - loan.paidPeriods) {
          regular += loan.monthlyPayment
        }
      } else {
        const matMonth = loan.maturityDate.slice(0, 7)
        if (ym <= matMonth) {
          regular += loan.monthlyInterest
        }
        if (ym === matMonth) {
          maturity += loan.totalAmount
          hasMaturity = true
        }
      }
    }

    data.push({
      month: shortMonth(ym),
      regular: Math.round(regular * 100) / 100,
      maturity: Math.round(maturity * 100) / 100,
      hasMaturity,
    })
  }
  return data
}

const EMPTY = (
  <div className="py-10 text-center">
    <p className="text-gray-400 text-sm">暂无贷款数据，请先添加贷款</p>
  </div>
)

export default function Charts() {
  const loans = useMemo(() => getLoans(), [])
  const empty = loans.length === 0

  // ---- Chart 1: bar data ----
  const barData = useMemo(() => (empty ? [] : buildBarData(loans)), [loans, empty])

  // ---- Chart 2: debt trend data ----
  const { debtData, monthsToClear, xInterval } = useMemo(() => {
    if (empty) return { debtData: [], monthsToClear: null, xInterval: 0 }
    const raw = calcTotalDebtByMonth(loans, 60)
    const zeroIdx = raw.findIndex((d) => d.debt === 0)
    const trimmed =
      zeroIdx >= 0
        ? raw.slice(0, Math.min(zeroIdx + 2, raw.length))
        : raw
    const interval =
      trimmed.length > 36 ? 5 : trimmed.length > 18 ? 2 : trimmed.length > 12 ? 1 : 0
    return {
      debtData: trimmed,
      monthsToClear: zeroIdx >= 0 ? zeroIdx : null,
      xInterval: interval,
    }
  }, [loans, empty])

  // ---- Chart 3: pie data ----
  const { pieData, monthlyTotal } = useMemo(() => {
    if (empty) return { pieData: [], monthlyTotal: 0 }
    const data = loans.map((loan) => ({
      name: loan.bankName,
      borrower: loan.borrower,
      value: calcMonthlyDue(loan),
      color: loan.color,
    }))
    const total = data.reduce((s, d) => s + d.value, 0)
    return { pieData: data, monthlyTotal: total }
  }, [loans, empty])

  return (
    <div className="px-5 pt-12 pb-8">
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">图表</h1>

      {/* ====== Chart 1: Repayment Pressure Bar ====== */}
      <div className="mt-6 bg-white rounded-2xl shadow-sm p-4">
        <h2 className="text-base font-bold text-gray-900">
          未来12个月还款压力
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          橙色为先息后本到期还本月份
        </p>

        {empty ? (
          EMPTY
        ) : (
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={barData}
                margin={{ top: 20, right: 0, left: -10, bottom: 0 }}
              >
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  fontSize={11}
                  tick={{ fill: '#9CA3AF' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  fontSize={11}
                  tick={{ fill: '#9CA3AF' }}
                  tickFormatter={(v) => {
                    if (v === 0) return '0'
                    return (v / 10000).toFixed(v >= 10000 ? 0 : 1) + '万'
                  }}
                  width={40}
                />
                <Tooltip
                  formatter={(v, name) => [
                    `¥${Number(v).toLocaleString('zh-CN')}`,
                    name,
                  ]}
                  contentStyle={{
                    borderRadius: 12,
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="regular"
                  name="常规还款"
                  stackId="a"
                  fill="#3B82F6"
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  dataKey="maturity"
                  name="到期还本"
                  stackId="a"
                  fill="#F97316"
                  radius={[3, 3, 0, 0]}
                  label={({ x, width, y, value }) => {
                    if (!value) return null
                    const cx = x + width / 2
                    const cy = y - 10
                    return (
                      <g>
                        <circle
                          cx={cx}
                          cy={cy}
                          r={7}
                          fill="#FFF7ED"
                          stroke="#F97316"
                          strokeWidth={1.5}
                        />
                        <text
                          x={cx}
                          y={cy + 4}
                          textAnchor="middle"
                          fontSize={10}
                          fill="#F97316"
                          fontWeight="bold"
                        >
                          !
                        </text>
                      </g>
                    )
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ====== Chart 2: Debt Trend Area ====== */}
      <div className="mt-4 bg-white rounded-2xl shadow-sm p-4">
        <div className="flex items-start justify-between">
          <h2 className="text-base font-bold text-gray-900">总负债走势</h2>
          {!empty && (
            <span className="text-xs text-gray-400 mt-0.5 text-right flex-shrink-0 ml-2">
              {monthsToClear != null
                ? monthsToClear === 0
                  ? '已全部还清'
                  : `预计 ${monthsToClear} 个月后还清`
                : '超过60个月'}
            </span>
          )}
        </div>

        {empty ? (
          EMPTY
        ) : (
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart
                data={debtData}
                margin={{ top: 5, right: 0, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="debtFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop
                      offset="100%"
                      stopColor="#3B82F6"
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  fontSize={11}
                  tick={{ fill: '#9CA3AF' }}
                  tickFormatter={shortMonth}
                  interval={xInterval}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  fontSize={11}
                  tick={{ fill: '#9CA3AF' }}
                  tickFormatter={(v) => {
                    if (v === 0) return '0'
                    return (v / 10000).toFixed(v >= 100000 ? 0 : 1) + '万'
                  }}
                  width={45}
                />
                <Tooltip
                  formatter={(v) => [`¥${fmtShort(v)}`, '总负债']}
                  labelFormatter={shortMonth}
                  contentStyle={{
                    borderRadius: 12,
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="debt"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fill="url(#debtFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ====== Chart 3: Monthly Composition Pie ====== */}
      <div className="mt-4 bg-white rounded-2xl shadow-sm p-4">
        <h2 className="text-base font-bold text-gray-900">本月还款构成</h2>

        {empty ? (
          EMPTY
        ) : (
          <>
            <div className="flex justify-center mt-4">
              <div className="relative">
                <PieChart width={200} height={200}>
                  <Pie
                    data={
                      monthlyTotal === 0
                        ? [{ value: 1 }]
                        : pieData
                    }
                    cx={100}
                    cy={100}
                    innerRadius={60}
                    outerRadius={85}
                    dataKey="value"
                    stroke="none"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {monthlyTotal === 0
                      ? <Cell fill="#E5E7EB" />
                      : pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                  </Pie>
                </PieChart>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold text-gray-900">
                    ¥{fmtShort(monthlyTotal)}
                  </span>
                  <span className="text-xs text-gray-400">本月总还款</span>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-col gap-2.5">
              {pieData.map((entry, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-3 h-3 rounded flex-shrink-0"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm text-gray-700 truncate">
                      {entry.name}
                      <span className="text-gray-400 ml-1 text-xs">
                        {entry.borrower}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="text-sm font-medium text-gray-900">
                      ¥{fmt(entry.value)}
                    </span>
                    <span className="text-xs text-gray-400 w-12 text-right">
                      {monthlyTotal > 0
                        ? ((entry.value / monthlyTotal) * 100).toFixed(1)
                        : '0.0'}
                      %
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
