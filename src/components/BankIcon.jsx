import { getBankColor, getBankAbbr } from '../data/banks'

export default function BankIcon({ bankName, size = 40 }) {
  const color = getBankColor(bankName)
  const abbr = getBankAbbr(bankName)

  return (
    <div
      className="flex-shrink-0 flex items-center justify-center rounded-full text-white font-semibold"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        fontSize: size * 0.4,
      }}
    >
      {abbr}
    </div>
  )
}
