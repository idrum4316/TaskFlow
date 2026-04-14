/**
 * Recurrence computation utilities.
 * Pure functions — no side effects, no external dependencies.
 */

const VALID_TYPES = ['daily', 'weekly', 'monthly', 'custom'];
const VALID_UNITS = ['days', 'weeks', 'months'];

/**
 * Validate a recurrence rule object.
 * Returns an array of error strings (empty if valid).
 */
function validateRecurrence(rule) {
  if (rule == null) return [];
  if (typeof rule !== 'object' || Array.isArray(rule)) return ['recurrence must be an object'];

  const errors = [];

  if (!VALID_TYPES.includes(rule.type)) {
    errors.push(`recurrence.type must be one of: ${VALID_TYPES.join(', ')}`);
  }

  if (rule.interval != null) {
    if (!Number.isInteger(rule.interval) || rule.interval < 1) {
      errors.push('recurrence.interval must be a positive integer');
    }
  }

  if (rule.type === 'weekly' && rule.daysOfWeek != null) {
    if (!Array.isArray(rule.daysOfWeek) || !rule.daysOfWeek.every(d => Number.isInteger(d) && d >= 0 && d <= 6)) {
      errors.push('recurrence.daysOfWeek must be an array of integers 0-6');
    }
  }

  if (rule.type === 'monthly' && rule.dayOfMonth != null) {
    if (!Number.isInteger(rule.dayOfMonth) || rule.dayOfMonth < 1 || rule.dayOfMonth > 31) {
      errors.push('recurrence.dayOfMonth must be an integer 1-31');
    }
  }

  if (rule.type === 'custom') {
    if (!VALID_UNITS.includes(rule.unit)) {
      errors.push(`recurrence.unit must be one of: ${VALID_UNITS.join(', ')} for custom type`);
    }
  }

  if (rule.endDate != null) {
    if (typeof rule.endDate !== 'string' || isNaN(Date.parse(rule.endDate))) {
      errors.push('recurrence.endDate must be a valid ISO date string');
    }
  }

  return errors;
}

/**
 * Parse an ISO date string (YYYY-MM-DD or full ISO) into a UTC-midnight Date.
 */
function parseDate(str) {
  const [y, m, d] = str.split('T')[0].split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * Format a Date to YYYY-MM-DD string.
 */
function formatDate(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Add N months to a date, clamping the day to the last day of the target month.
 */
function addMonths(date, n) {
  const result = new Date(date);
  const targetMonth = result.getUTCMonth() + n;
  result.setUTCMonth(targetMonth);
  // If the day overflowed (e.g. Jan 31 + 1 month = Mar 3), clamp to last day
  if (result.getUTCMonth() !== ((targetMonth % 12) + 12) % 12) {
    result.setUTCDate(0); // sets to last day of previous month
  }
  return result;
}

/**
 * Compute the next due date given a current due date and a recurrence rule.
 * Returns an ISO date string (YYYY-MM-DD) or null if past endDate.
 */
function computeNextDueDate(currentDueDate, rule) {
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

      // Find the next matching day after current
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
        // Wrap to next interval week, pick the first matching day
        const daysUntilNextWeek = 7 - currentDay + days[0];
        next = new Date(current);
        next.setUTCDate(next.getUTCDate() + daysUntilNextWeek + (interval - 1) * 7);
      }
      break;
    }

    case 'monthly': {
      const targetDay = rule.dayOfMonth || current.getUTCDate();
      next = addMonths(current, interval);
      // Clamp to target day or end of month
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

  // Check endDate
  if (rule.endDate) {
    const end = parseDate(rule.endDate);
    if (next > end) return null;
  }

  return formatDate(next);
}

/**
 * Project the next N occurrences from a given date using a recurrence rule.
 * Returns an array of ISO date strings (YYYY-MM-DD).
 */
function projectOccurrences(fromDate, rule, count) {
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

module.exports = { validateRecurrence, computeNextDueDate, projectOccurrences, parseDate, formatDate };
