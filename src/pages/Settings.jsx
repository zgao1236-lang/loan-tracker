import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLoans } from '../utils/loanStorage'

const SETTINGS_KEY = 'loan-tracker-settings'
const REMINDER_OPTIONS = [3, 5, 7, 14]

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}
  } catch {
    return {}
  }
}

function saveSettings(s) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
  // keep legacy key in sync for Dashboard
  localStorage.setItem('loan-tracker-reminder-days', String(s.reminderDays ?? 7))
}

function exportCSV() {
  const loans = getLoans()
  if (!loans.length) {
    alert('暂无贷款数据可导出')
    return
  }

  const headers = [
    'ID', '银行', '贷款人', '贷款金额', '年利率%', '起始日期',
    '还款日', '类型', '备注', '总期数', '已还期数', '每月月供',
    '到期日', '每月利息',
  ]
  const rows = loans.map((l) => [
    l.id, l.bankName, l.borrower, l.totalAmount, l.annualRate,
    l.startDate, l.repaymentDay,
    l.type === 'equal_installment' ? '等额本息' : '先息后本',
    l.remark || '',
    l.totalPeriods ?? '', l.paidPeriods ?? '', l.monthlyPayment ?? '',
    l.maturityDate ?? '', l.monthlyInterest ?? '',
  ])

  const BOM = '\uFEFF'
  const csv = BOM + [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const d = new Date()
  const tag = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  a.href = url
  a.download = `贷款数据_${tag}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function clearAllData() {
  const keys = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k.startsWith('loan-tracker-')) keys.push(k)
  }
  keys.forEach((k) => localStorage.removeItem(k))
}

export default function Settings() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState(loadSettings)
  const [showReminder, setShowReminder] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showAbout, setShowAbout] = useState(false)

  const reminderDays = settings.reminderDays ?? 7

  const pickReminder = (days) => {
    const next = { ...settings, reminderDays: days }
    setSettings(next)
    saveSettings(next)
    setShowReminder(false)
  }

  const handleClear = () => {
    clearAllData()
    setShowClearConfirm(false)
    navigate('/')
  }

  return (
    <div className="min-h-full bg-gray-50 px-5 pt-12 pb-8">
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">设置</h1>

      {/* ====== Group 1: Reminder ====== */}
      <p className="text-xs text-gray-400 mt-8 mb-2 px-1 uppercase tracking-wide">
        提醒设置
      </p>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <button
          onClick={() => setShowReminder(true)}
          className="w-full flex items-center justify-between px-4 h-11 active:bg-gray-100 transition-colors"
        >
          <span className="text-sm text-gray-900">提前提醒天数</span>
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-400">{reminderDays}天</span>
            <Chevron />
          </div>
        </button>
      </div>

      {/* ====== Group 2: Data ====== */}
      <p className="text-xs text-gray-400 mt-8 mb-2 px-1 uppercase tracking-wide">
        数据管理
      </p>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <button
          onClick={exportCSV}
          className="w-full flex items-center justify-between px-4 h-11 active:bg-gray-100 transition-colors"
        >
          <span className="text-sm text-gray-900">导出 CSV</span>
          <Chevron />
        </button>
        <div className="border-t border-gray-100 ml-4" />
        <button
          onClick={() => setShowClearConfirm(true)}
          className="w-full flex items-center px-4 h-11 active:bg-gray-100 transition-colors"
        >
          <span className="text-sm text-red-500">清除所有数据</span>
        </button>
      </div>

      {/* ====== Group 3: About ====== */}
      <p className="text-xs text-gray-400 mt-8 mb-2 px-1 uppercase tracking-wide">
        关于
      </p>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 h-11">
          <span className="text-sm text-gray-900">版本</span>
          <span className="text-sm text-gray-400">v1.0.0</span>
        </div>
        <div className="border-t border-gray-100 ml-4" />
        <button
          onClick={() => setShowAbout((v) => !v)}
          className="w-full active:bg-gray-100 transition-colors"
        >
          <div className="flex items-center justify-between px-4 h-11">
            <span className="text-sm text-gray-900">说明</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`w-4 h-4 text-gray-300 transition-transform ${showAbout ? 'rotate-90' : ''}`}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
          {showAbout && (
            <div className="px-4 pb-3 text-left">
              <p className="text-sm text-gray-500 leading-relaxed">
                贷款管家是一个家庭贷款还款管理工具，帮助你追踪多笔贷款的还款进度和总负债变化。所有数据仅存储在你的设备本地。
              </p>
            </div>
          )}
        </button>
      </div>

      {/* ====== Reminder Sheet ====== */}
      {showReminder && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={() => setShowReminder(false)}
        >
          <div
            className="bg-white rounded-t-2xl w-full max-w-lg pb-[env(safe-area-inset-bottom)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 pt-4 pb-2">
              <p className="text-center text-sm text-gray-400">提前提醒天数</p>
            </div>
            {REMINDER_OPTIONS.map((d, i) => (
              <div key={d}>
                {i > 0 && <div className="border-t border-gray-100 ml-4" />}
                <button
                  onClick={() => pickReminder(d)}
                  className="w-full flex items-center justify-between px-4 h-11 active:bg-gray-100 transition-colors"
                >
                  <span className="text-sm text-gray-900">{d}天</span>
                  {reminderDays === d && (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-5 h-5"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              </div>
            ))}
            <div className="p-3">
              <button
                onClick={() => setShowReminder(false)}
                className="w-full py-3 bg-gray-100 rounded-xl text-sm font-medium text-gray-600 active:bg-gray-200 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== Clear Confirm ====== */}
      {showClearConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={() => setShowClearConfirm(false)}
        >
          <div
            className="bg-white rounded-t-2xl w-full max-w-lg p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-center text-gray-900 font-semibold">
              确定要清除所有数据吗？
            </p>
            <p className="text-center text-gray-500 text-sm mt-1">
              所有贷款数据和还款记录将被删除，此操作不可恢复。
            </p>
            <button
              onClick={handleClear}
              className="w-full mt-4 py-3 bg-red-500 text-white rounded-xl font-medium active:bg-red-600 transition-colors"
            >
              确认清除
            </button>
            <button
              onClick={() => setShowClearConfirm(false)}
              className="w-full mt-2 py-3 text-gray-600 font-medium active:bg-gray-100 rounded-xl transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Chevron() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4 text-gray-300"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}
