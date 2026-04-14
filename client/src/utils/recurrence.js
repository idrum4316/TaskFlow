/**
 * Recurrence computation utilities (client-side copy).
 * Must stay in sync with server/utils/recurrence.js.
 */

function parseDate(str) {
  const [y, m, d] = str.split('T')[0].split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatDate(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addMonths(date, n) {
  const result = new Date(date);
  const targetMonth = result.getUTCMonth() + n;
  result.setUTCMonth(targetMonth);
  if (result.getUTCMonth() !== ((targetMonth % 12) + 12) % 12) {
    result.setUTCDate(0);
  }
  return result;
}

export function computeNextDueDate(currentDueDate, rule) {
  if (!currentDueDate || !rule) return null;

  const current = parseDate(currentDueDate);
  const interval = rule.interval || 1;
  let next;

  switch (rule.type) {
    case 'daily':
      next = new Date(current);
      next.setUTCDate(next.getUTCDate() + interval);
      break;

    case 'weekly': {
      const days = rule.daysOfWeek?.length ? [...rule.daysOfWeek].sort((a, b) => a - b) : [current.getUTCDay()];
      const currentDay = current.getUTCDay();

      let found = false;
      for (const d of days) {
        if (d > currentDay) {
          next = new Date(current);
          next.setUTCDate(next.getUTCDate() + (d - currentDay));
          found = true;
          break;
        }
      }
      if (!found) {
        const daysUntilNextWeek = 7 - currentDay + days[0];
        next = new Date(current);
        next.setUTCDate(next.getUTCDate() + daysUntilNextWeek + (interval - 1) * 7);
      }
      break;
    }

    case 'monthly': {
      const targetDay = rule.dayOfMonth || current.getUTCDate();
      next = addMonths(current, interval);
      const maxDay = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate();
      next.setUTCDate(Math.min(targetDay, maxDay));
      break;
    }

    case 'custom': {
      const unit = rule.unit || 'days';
      next = new Date(current);
      if (unit === 'days') {
        next.setUTCDate(next.getUTCDate() + interval);
      } else if (unit === 'weeks') {
        next.setUTCDate(next.getUTCDate() + interval * 7);
      } else if (unit === 'months') {
        next = addMonths(current, interval);
      }
      break;
    }

    default:
      return null;
  }

  if (rule.endDate) {
    const end = parseDate(rule.endDate);
    if (next > end) return null;
  }

  return formatDate(next);
}

export function projectOccurrences(fromDate, rule, count) {
  if (!fromDate || !rule || !count || count < 1) return [];

  const results = [];
  let current = fromDate;
  for (let i = 0; i < count; i++) {
    const next = computeNextDueDate(current, rule);
    if (!next) break;
    results.push(next);
    current = next;
  }
  return results;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function describeRecurrence(rule) {
  if (!rule) return '';
  const interval = rule.interval || 1;

  switch (rule.type) {
    case 'daily':
      return interval === 1 ? 'Daily' : `Every ${interval} days`;
    case 'weekly': {
      const days = rule.daysOfWeek?.length
        ? rule.daysOfWeek.sort((a, b) => a - b).map((d) => DAY_NAMES[d]).join(', ')
        : 'week';
      return interval === 1
        ? `Weekly on ${days}`
        : `Every ${interval} weeks on ${days}`;
    }
    case 'monthly': {
      const day = rule.dayOfMonth || '?';
      return interval === 1
        ? `Monthly on the ${day}${ordinalSuffix(day)}`
        : `Every ${interval} months on the ${day}${ordinalSuffix(day)}`;
    }
    case 'custom': {
      const unit = rule.unit || 'days';
      return interval === 1 ? `Every ${unit.slice(0, -1)}` : `Every ${interval} ${unit}`;
    }
    default:
      return 'Recurring';
  }
}

function ordinalSuffix(n) {
  if (typeof n !== 'number') return '';
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
