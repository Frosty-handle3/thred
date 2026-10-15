// Dates are stored as approximate text: "2019", "2019-06" or "2019-06-14",
// because people rarely remember the exact day they met someone.

const APPROX_DATE = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/;

export function isApproxDate(text: string): boolean {
  const m = APPROX_DATE.exec(text.trim());
  if (!m) return false;
  const month = m[2] ? Number(m[2]) : 1;
  const day = m[3] ? Number(m[3]) : 1;
  return month >= 1 && month <= 12 && day >= 1 && day <= 31;
}

/** Months since year 0, using the middle of the year when only a year is known. */
export function toMonthIndex(text: string | null): number | null {
  if (!text) return null;
  const m = APPROX_DATE.exec(text.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = m[2] ? Number(m[2]) - 1 : 6;
  return year * 12 + month;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatApproxDate(text: string | null): string {
  if (!text) return '';
  const m = APPROX_DATE.exec(text.trim());
  if (!m) return text;
  if (!m[2]) return m[1];
  const month = MONTHS[Number(m[2]) - 1];
  return m[3] ? `${Number(m[3])} ${month} ${m[1]}` : `${month} ${m[1]}`;
}
