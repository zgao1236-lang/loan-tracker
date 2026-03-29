import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import BankIcon from '../../components/BankIcon'
import { getLoans, deleteLoan } from '../../utils/loanStorage'
import {
  calcRemainingPeriods,
  calcRemainingPrincipal,
  calcDaysToMaturity,
} from '../../utils/loanCalc'

function fmt(n) {
  return n.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function InfoRow({ label, value, last }) {
  return (
    <div
      className={`flex justify-between items-center px-4 py-3 ${
        last ? '' : 'border-b border-gray-100'
      }`}
    >
      <span className="text-gray-500 text-sm">{label}</span>
      <span className="text-gray-900 text-sm font-medium">{value}</span>
    </div>
  )
}

export default function BillDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [showConfirm, setShowConfirm] = useState(false)

  const loan = useMemo(() => {
    return getLoans().find((l) => l.id === id)
  }, [id])

  if (!loan) {
    return (
      <div className="px-5 pt-14 text-center">
        <p className="text-gray-400">贷款不存在</p>
        <button
          onClick={() => navigate('/bills')}
          className="mt-4 text-blue-500 text-sm"
        >
          返回列表
        </button>
      </div>
    )
  }

  const isEqual = loan.type === 'equal_installment'
  const remaining = isEqual ? calcRemainingPeriods(loan) : null
  const remainingPrincipal = isEqual ? calcRemainingPrincipal(loan) : null
  const daysToMaturity = !isEqual ? calcDaysToMaturity(loan) : null
  const progress = isEqual
    ? loan.totalPeriods > 0
      ? loan.paidPeriods / loan.totalPeriods
      : 0
    : null

  const handleDelete = () => {
    deleteLoan(loan.id)
    navigate('/bills', { replace: true })
  }

  return (
    <div className="px-5 pt-3 pb-8">
      {/* Nav bar */}
      <div className="flex items-center h-11">
        <button
          onClick={() => navigate('/bills')}
          className="flex items-center gap-1 text-blue-500 min-h-11 -ml-2 pl-2 pr-3"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span className="text-sm">返回</span>
        </button>
        <h1 className="flex-1 text-center text-base font-semibold text-gray-900 pr-12">
          贷款详情
        </h1>
      </div>

      {/* Header: icon + name + type */}
      <div className="flex flex-col items-center mt-6">
        <BankIcon bankName={loan.bankName} size={64} />
        <h2 className="text-xl font-bold text-gray-900 mt-3">
          {loan.bankName}
        </h2>
        <span
          className={`mt-1.5 text-xs px-3 py-1 rounded-full ${
            isEqual
              ? 'bg-blue-50 text-blue-600'
              : 'bg-orange-50 text-orange-600'
          }`}
        >
          {isEqual ? '等额本息' : '先息后本'}
        </span>
      </div>

      {/* Progress area */}
      {isEqual ? (
        <div className="mt-6 bg-white rounded-2xl shadow-sm p-4">
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${(progress * 100).toFixed(1)}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2 text-center">
            已还 {loan.paidPeriods} 期，剩余 {remaining} 期
          </p>
          <p className="text-lg font-bold text-gray-900 text-center mt-1">
            剩余本金 ¥{fmt(remainingPrincipal)}
          </p>
        </div>
      ) : (
        <div className="mt-6 bg-white rounded-2xl shadow-sm p-4 text-center">
          <p className="text-sm text-gray-500">距到期还有</p>
          <p className="text-3xl font-bold text-orange-500 mt-1">
            {daysToMaturity > 0 ? `${daysToMaturity} 天` : '已到期'}
          </p>
          <p className="text-lg font-bold text-orange-600 mt-2">
            到期需还本金 ¥{fmt(loan.totalAmount)}
          </p>
        </div>
      )}

      {/* Info card */}
      <div className="mt-4">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <InfoRow label="贷款人" value={loan.borrower} />
          <InfoRow
            label="贷款金额"
            value={`¥${fmt(loan.totalAmount)}`}
          />
          <InfoRow label="年利率" value={`${loan.annualRate}%`} />
          {isEqual ? (
            <>
              <InfoRow
                label="每月月供"
                value={`¥${fmt(loan.monthlyPayment)}`}
              />
              <InfoRow label="起始日期" value={loan.startDate} />
              <InfoRow
                label="还款日"
                value={`每月${loan.repaymentDay}号`}
              />
              <InfoRow label="总期数" value={`${loan.totalPeriods}期`} />
              <InfoRow
                label="已还期数"
                value={`${loan.paidPeriods}期`}
              />
              <InfoRow
                label="备注"
                value={loan.remark || '—'}
                last
              />
            </>
          ) : (
            <>
              <InfoRow
                label="每月利息"
                value={`¥${fmt(loan.monthlyInterest)}`}
              />
              <InfoRow label="起始日期" value={loan.startDate} />
              <InfoRow
                label="还款日"
                value={`每月${loan.repaymentDay}号`}
              />
              <InfoRow label="到期日" value={loan.maturityDate} />
              <InfoRow
                label="备注"
                value={loan.remark || '—'}
                last
              />
            </>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-6 flex flex-col gap-3">
        <button
          onClick={() => navigate(`/bills/edit/${loan.id}`)}
          className="w-full py-3 rounded-2xl border-2 border-blue-500 text-blue-500 font-medium"
        >
          编辑
        </button>
        <button
          onClick={() => setShowConfirm(true)}
          className="w-full py-3 text-red-500 font-medium"
        >
          删除贷款
        </button>
      </div>

      {/* Delete confirmation */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="bg-white rounded-t-2xl w-full max-w-lg p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            <p className="text-center text-gray-900 font-semibold">
              确定删除该贷款？
            </p>
            <p className="text-center text-gray-500 text-sm mt-1">
              删除后无法恢复
            </p>
            <button
              onClick={handleDelete}
              className="w-full mt-4 py-3 bg-red-500 text-white rounded-xl font-medium"
            >
              确认删除
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="w-full mt-2 py-3 text-gray-600 font-medium"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
