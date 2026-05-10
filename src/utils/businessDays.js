export async function getBusinessDaysForMonth(year, month) {
  const weekdays = countWeekdaysInMonth(year, month)

  try {
    const response = await fetch(`https://brasilapi.com.br/api/feriados/v1/${year}`)

    if (!response.ok) {
      throw new Error('Não foi possível carregar feriados nacionais.')
    }

    const holidays = await response.json()
    const nationalWeekdayHolidays = new Set(
      holidays
        .filter((holiday) => holiday.type === 'national')
        .map((holiday) => holiday.date)
        .filter((date) => isDateInMonth(date, year, month) && isWeekday(date)),
    )

    return {
      days: Math.max(weekdays - nationalWeekdayHolidays.size, 0),
      warning: '',
    }
  } catch {
    return {
      days: weekdays,
      warning:
        'Não foi possível carregar feriados nacionais. Dias úteis calculados sem feriados.',
    }
  }
}

export function countWeekdaysInMonth(year, month) {
  const numericYear = Number(year)
  const numericMonth = Number(month)
  const lastDay = new Date(numericYear, numericMonth, 0).getDate()
  let businessDays = 0

  for (let day = 1; day <= lastDay; day += 1) {
    const date = new Date(numericYear, numericMonth - 1, day)
    const weekday = date.getDay()

    if (weekday !== 0 && weekday !== 6) {
      businessDays += 1
    }
  }

  return businessDays
}

function isDateInMonth(value, year, month) {
  const [dateYear, dateMonth] = String(value).split('-').map(Number)

  return dateYear === Number(year) && dateMonth === Number(month)
}

function isWeekday(value) {
  const [year, month, day] = String(value).split('-').map(Number)
  const weekday = new Date(year, month - 1, day).getDay()

  return weekday !== 0 && weekday !== 6
}
