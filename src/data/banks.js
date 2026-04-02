const banks = [
  // 国有大行
  { name: '工商银行', color: '#C0272D', abbr: '工', group: '国有大行' },
  { name: '建设银行', color: '#0066B3', abbr: '建', group: '国有大行' },
  { name: '农业银行', color: '#007B3E', abbr: '农', group: '国有大行' },
  { name: '中国银行', color: '#CC0000', abbr: '中', group: '国有大行' },
  { name: '交通银行', color: '#1E3A8A', abbr: '交', group: '国有大行' },
  { name: '邮储银行', color: '#007A33', abbr: '邮', group: '国有大行' },
  // 股份制银行
  { name: '招商银行', color: '#E60012', abbr: '招', group: '股份制银行' },
  { name: '光大银行', color: '#FF6600', abbr: '光', group: '股份制银行' },
  { name: '浦发银行', color: '#004B9B', abbr: '浦', group: '股份制银行' },
  { name: '民生银行', color: '#003087', abbr: '民', group: '股份制银行' },
  { name: '中信银行', color: '#C8102E', abbr: '信', group: '股份制银行' },
  { name: '兴业银行', color: '#0A5CAB', abbr: '兴', group: '股份制银行' },
  { name: '平安银行', color: '#F07900', abbr: '平', group: '股份制银行' },
  { name: '华夏银行', color: '#E2231A', abbr: '华', group: '股份制银行' },
  // 城商行
  { name: '南京银行', color: '#FF8C00', abbr: '南', group: '城商行' },
  // 互联网金融平台
  { name: '微众银行', color: '#07C160', abbr: '微', group: '互联网金融' },
  { name: '京东金融', color: '#E2231A', abbr: '京', group: '互联网金融' },
  { name: '抖音放心借', color: '#000000', abbr: '抖', group: '互联网金融' },
]

export function getBankByName(name) {
  return banks.find((b) => b.name === name) || null
}

export function getBankColor(name) {
  return getBankByName(name)?.color || '#6B7280'
}

export function getBankAbbr(name) {
  return getBankByName(name)?.abbr || name.charAt(0)
}

export default banks
