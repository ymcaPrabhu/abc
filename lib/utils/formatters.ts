import { format } from 'date-fns'

/**
 * Format currency in Indian Rupees (Lakhs and Crores)
 */
export function formatINR(amount: number): string {
  if (amount >= 10000000) {
    // Crores
    return `₹${(amount / 10000000).toFixed(2)} Cr`
  } else if (amount >= 100000) {
    // Lakhs
    return `₹${(amount / 100000).toFixed(2)} L`
  } else if (amount >= 1000) {
    // Thousands
    return `₹${(amount / 1000).toFixed(2)} K`
  } else {
    return `₹${amount.toFixed(2)}`
  }
}

/**
 * Format full currency amount with Indian number system
 */
export function formatFullINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format date
 */
export function formatDate(date: string | Date, formatString: string = 'dd MMM yyyy'): string {
  return format(new Date(date), formatString)
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format financial year (e.g., 2025-26)
 */
export function formatFinancialYear(year: string): string {
  return year
}

/**
 * Get current financial year
 */
export function getCurrentFinancialYear(): string {
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth() + 1 // 1-12

  if (currentMonth >= 4) {
    // April onwards - current FY is current year to next year
    return `${currentYear}-${(currentYear + 1).toString().slice(-2)}`
  } else {
    // Jan-March - current FY is last year to current year
    return `${currentYear - 1}-${currentYear.toString().slice(-2)}`
  }
}

/**
 * Get month name from number
 */
export function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  return months[month - 1] || ''
}

/**
 * Format proposal number
 */
export function generateProposalNumber(ministryCode: string, year: string, sequence: number): string {
  return `${ministryCode}/${year}/${sequence.toString().padStart(4, '0')}`
}
