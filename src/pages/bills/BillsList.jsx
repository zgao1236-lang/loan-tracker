import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import BankIcon from '../../components/BankIcon'
import { getLoans } from '../../utils/loanStorage'

const BORROWER_ORDER = ['我', '小贾', '妈妈']
const BORROWER_LABELS = { '我': '我的贷款', '小贾': '小贾的贷款', '妈妈': '妈妈的贷款' }

function fmt(n) {
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatMaturity(dateStr) {
  const [y, m] = dateStr.split('-')
  return `${y}年${Number(m)}月到期`
}

export default function BillsList() {
  const navigate = useNavigate()
  const loans = useMemo(() => getLoans(), [])

  const groups = useMemo(() => {
    const map = {}
    for (const loan of loans) {
      if (!map[loan.borrower]) map[loan.borrower] = []
      map[loan.borrower].push(loan)
    }
    return BORROWER_ORDER.filter((b) => map[b]?.length).map((b) => ({
      borrower: b,
      label: BORROWER_LABELS[b] || `${b}的贷款`,
      items: map[b],
    }))
  }, [loans])

  return (
    <div className="px-5 pt-12 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          我的贷款
        </h1>
        <button
          onClick={() => navigate('/bills/new')}
          className="w-11 h-11 rounded-full bg-blue-500 flex items-center justify-center"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth={2.5}
            strokeLinecap="round"
            className="w-5 h-5"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      {loans.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-gray-400 text-sm">暂无贷款，点击右上角添加</p>
        </div>
      ) : (
        groups.map((group) => (
          <div key={group.borrower} className="mt-6">
            <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 px-1">
              {group.label}
            </h2>
            <div className="flex flex-col gap-3">
              {group.items.map((loan) => (
                <button
                  key={loan.id}
                  onClick={() => navigate(`/bills/${loan.id}`)}
                  className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3 text-left w-full"
                >
                  <BankIcon bankName={loan.bankName} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-gray-900 truncate">
                        {loan.bankName}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                          loan.type === 'equal_installment'
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-orange-50 text-orange-600'
                        }`}
                      >
                        {loan.type === 'equal_installment'
                          ? '等额本息'
                          : '先息后本'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">
                      {loan.type === 'equal_installment'
                        ? `月供 ¥${fmt(loan.monthlyPayment)} · 剩余${loan.totalPeriods - loan.paidPeriods}期`
                        : `月息 ¥${fmt(loan.monthlyInterest)} · ${formatMaturity(loan.maturityDate)}`}
                    </div>
                  </div>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5 text-gray-300 flex-shrink-0"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
