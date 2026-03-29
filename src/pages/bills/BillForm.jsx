import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import banks from '../../data/banks'
import { getBankColor } from '../../data/banks'
import { getLoans, saveLoan } from '../../utils/loanStorage'

const BORROWERS = ['我', '小贾', '妈妈']
const TYPES = [
  { value: 'equal_installment', label: '等额本息' },
  { value: 'interest_only', label: '先息后本' },
]

const bankGroups = (() => {
  const map = {}
  for (const b of banks) {
    if (!map[b.group]) map[b.group] = []
    map[b.group].push(b)
  }
  return Object.entries(map)
})()

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function BillForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const existing = useMemo(() => {
    if (!id) return null
    return getLoans().find((l) => l.id === id) || null
  }, [id])

  const [form, setForm] = useState(() => {
    if (existing) {
      return {
        bankName: existing.bankName,
        borrower: existing.borrower,
        totalAmount: String(existing.totalAmount),
        annualRate: String(existing.annualRate),
        type: existing.type,
        startDate: existing.startDate,
        repaymentDay: String(existing.repaymentDay),
        totalPeriods: existing.totalPeriods != null ? String(existing.totalPeriods) : '',
        paidPeriods: existing.paidPeriods != null ? String(existing.paidPeriods) : '0',
        monthlyPayment: existing.monthlyPayment != null ? String(existing.monthlyPayment) : '',
        maturityDate: existing.maturityDate || '',
        monthlyInterest: existing.monthlyInterest != null ? String(existing.monthlyInterest) : '',
        remark: existing.remark || '',
      }
    }
    return {
      bankName: '',
      borrower: '我',
      totalAmount: '',
      annualRate: '',
      type: 'equal_installment',
      startDate: today(),
      repaymentDay: '',
      totalPeriods: '',
      paidPeriods: '0',
      monthlyPayment: '',
      maturityDate: '',
      monthlyInterest: '',
      remark: '',
    }
  })

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  // Auto-calculate equal installment monthly payment
  const autoCalcMonthly = () => {
    const P = Number(form.totalAmount)
    const r = Number(form.annualRate) / 100 / 12
    const n = Number(form.totalPeriods)
    if (!P || !r || !n) return
    const payment = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
    set('monthlyPayment', payment.toFixed(2))
  }

  // Auto-calculate interest only monthly interest
  const autoCalcInterest = () => {
    const P = Number(form.totalAmount)
    const rate = Number(form.annualRate)
    if (!P || !rate) return
    const interest = (P * rate) / 100 / 12
    set('monthlyInterest', interest.toFixed(2))
  }

  const canSave = () => {
    if (!form.bankName || !form.totalAmount || !form.annualRate || !form.startDate || !form.repaymentDay) {
      return false
    }
    if (form.type === 'equal_installment') {
      return form.totalPeriods && form.monthlyPayment
    }
    return form.maturityDate && form.monthlyInterest
  }

  const handleSave = () => {
    if (!canSave()) return
    const loan = {
      id: isEdit ? existing.id : Date.now().toString(),
      bankName: form.bankName,
      borrower: form.borrower,
      totalAmount: Number(form.totalAmount),
      annualRate: Number(form.annualRate),
      startDate: form.startDate,
      repaymentDay: Number(form.repaymentDay),
      type: form.type,
      color: getBankColor(form.bankName),
      remark: form.remark,
      ...(form.type === 'equal_installment'
        ? {
            totalPeriods: Number(form.totalPeriods),
            paidPeriods: Number(form.paidPeriods) || 0,
            monthlyPayment: Number(form.monthlyPayment),
          }
        : {
            maturityDate: form.maturityDate,
            monthlyInterest: Number(form.monthlyInterest),
          }),
    }
    saveLoan(loan)
    navigate('/bills', { replace: true })
  }

  return (
    <div className="px-5 pt-3 pb-8">
      {/* Nav bar */}
      <div className="flex items-center h-11">
        <button
          onClick={() => navigate(-1)}
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
          {isEdit ? '编辑贷款' : '新增贷款'}
        </h1>
      </div>

      {/* Group 1: 基本信息 */}
      <SectionTitle>基本信息</SectionTitle>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Bank */}
        <FormRow label="银行">
          <select
            value={form.bankName}
            onChange={(e) => set('bankName', e.target.value)}
            className="text-right text-sm text-gray-900 bg-transparent outline-none appearance-none flex-1 min-w-0"
          >
            <option value="">请选择</option>
            {bankGroups.map(([group, items]) => (
              <optgroup key={group} label={group}>
                {items.map((b) => (
                  <option key={b.name} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </FormRow>

        {/* Borrower */}
        <FormRow label="贷款人">
          <div className="flex gap-1.5">
            {BORROWERS.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => set('borrower', b)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  form.borrower === b
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </FormRow>

        {/* Amount */}
        <FormRow label="贷款金额">
          <div className="flex items-center gap-1 flex-1 justify-end">
            <span className="text-sm text-gray-400">¥</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={form.totalAmount}
              onChange={(e) => set('totalAmount', e.target.value)}
              className="text-right text-sm text-gray-900 bg-transparent outline-none w-28"
            />
          </div>
        </FormRow>

        {/* Rate */}
        <FormRow label="年利率" last>
          <div className="flex items-center gap-1 flex-1 justify-end">
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0.00"
              value={form.annualRate}
              onChange={(e) => set('annualRate', e.target.value)}
              className="text-right text-sm text-gray-900 bg-transparent outline-none w-20"
            />
            <span className="text-sm text-gray-400">%</span>
          </div>
        </FormRow>
      </div>

      {/* Group 2: 还款信息 */}
      <SectionTitle>还款信息</SectionTitle>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Type toggle */}
        <FormRow label="还款类型">
          <div className="flex gap-1.5">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => set('type', t.value)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  form.type === t.value
                    ? t.value === 'equal_installment'
                      ? 'bg-blue-500 text-white'
                      : 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </FormRow>

        {/* Start date */}
        <FormRow label="起始日期">
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => set('startDate', e.target.value)}
            className="text-right text-sm text-gray-900 bg-transparent outline-none"
          />
        </FormRow>

        {/* Repayment day */}
        <FormRow label="还款日" last>
          <div className="flex items-center gap-1 flex-1 justify-end">
            <span className="text-sm text-gray-400">每月</span>
            <select
              value={form.repaymentDay}
              onChange={(e) => set('repaymentDay', e.target.value)}
              className="text-sm text-gray-900 bg-transparent outline-none appearance-none text-right"
            >
              <option value="">选择</option>
              {Array.from({ length: 31 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-400">号</span>
          </div>
        </FormRow>
      </div>

      {/* Group 3: Type-specific fields */}
      {form.type === 'equal_installment' ? (
        <>
          <SectionTitle>等额本息</SectionTitle>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <FormRow label="总期数">
              <div className="flex items-center gap-1 flex-1 justify-end">
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  value={form.totalPeriods}
                  onChange={(e) => set('totalPeriods', e.target.value)}
                  className="text-right text-sm text-gray-900 bg-transparent outline-none w-16"
                />
                <span className="text-sm text-gray-400">期</span>
              </div>
            </FormRow>
            <FormRow label="已还期数">
              <div className="flex items-center gap-1 flex-1 justify-end">
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  value={form.paidPeriods}
                  onChange={(e) => set('paidPeriods', e.target.value)}
                  className="text-right text-sm text-gray-900 bg-transparent outline-none w-16"
                />
                <span className="text-sm text-gray-400">期</span>
              </div>
            </FormRow>
            <FormRow label="每月月供" last>
              <div className="flex items-center gap-1 flex-1 justify-end">
                <span className="text-sm text-gray-400">¥</span>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={form.monthlyPayment}
                  onChange={(e) => set('monthlyPayment', e.target.value)}
                  className="text-right text-sm text-gray-900 bg-transparent outline-none w-24"
                />
                <button
                  type="button"
                  onClick={autoCalcMonthly}
                  className="ml-1 text-xs text-blue-500 whitespace-nowrap"
                >
                  自动计算
                </button>
              </div>
            </FormRow>
          </div>
        </>
      ) : (
        <>
          <SectionTitle>先息后本</SectionTitle>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <FormRow label="到期日期">
              <input
                type="date"
                value={form.maturityDate}
                onChange={(e) => set('maturityDate', e.target.value)}
                className="text-right text-sm text-gray-900 bg-transparent outline-none"
              />
            </FormRow>
            <FormRow label="每月利息" last>
              <div className="flex items-center gap-1 flex-1 justify-end">
                <span className="text-sm text-gray-400">¥</span>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={form.monthlyInterest}
                  onChange={(e) => set('monthlyInterest', e.target.value)}
                  className="text-right text-sm text-gray-900 bg-transparent outline-none w-24"
                />
                <button
                  type="button"
                  onClick={autoCalcInterest}
                  className="ml-1 text-xs text-blue-500 whitespace-nowrap"
                >
                  自动计算
                </button>
              </div>
            </FormRow>
          </div>
        </>
      )}

      {/* Group 4: 其他 */}
      <SectionTitle>其他</SectionTitle>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <FormRow label="备注" last>
          <input
            type="text"
            placeholder="选填"
            value={form.remark}
            onChange={(e) => set('remark', e.target.value)}
            className="text-right text-sm text-gray-900 bg-transparent outline-none flex-1 min-w-0"
          />
        </FormRow>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={!canSave()}
        className={`w-full mt-8 py-3.5 rounded-2xl font-medium text-white transition-colors ${
          canSave()
            ? 'bg-blue-500 active:bg-blue-600'
            : 'bg-gray-200 text-gray-400'
        }`}
      >
        保存
      </button>
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <h3 className="text-xs font-medium text-gray-400 mt-6 mb-2 px-1">
      {children}
    </h3>
  )
}

function FormRow({ label, last, children }) {
  return (
    <div
      className={`flex items-center justify-between px-4 py-3 ${
        last ? '' : 'border-b border-gray-100'
      }`}
    >
      <span className="text-sm text-gray-900 flex-shrink-0 mr-4">
        {label}
      </span>
      {children}
    </div>
  )
}
