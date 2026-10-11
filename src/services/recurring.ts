import { RecurringRule, Transaction } from '../types';

export interface RecurringProcessResult {
  newTransactions: Transaction[];
  updatedRules: RecurringRule[];
}

export const processDueRecurringTransactions = (
  rules: RecurringRule[],
  existingTransactions: Transaction[],
  targetDate: Date = new Date()
): RecurringProcessResult => {
  const currentYear = targetDate.getFullYear();
  const currentMonth = targetDate.getMonth() + 1;
  const currentDay = targetDate.getDate();
  const monthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  const newTransactions: Transaction[] = [];
  const updatedRules: RecurringRule[] = [];

  for (const rule of rules) {
    if (!rule.active) {
      updatedRules.push(rule);
      continue;
    }

    // Check if rule's day of month is due or has passed in this month
    const isDue = currentDay >= rule.dayOfMonth;

    // Check if already created for this month
    const alreadyCreatedThisMonth = existingTransactions.some(
      t => t.recurringId === rule.id && t.date.slice(0, 7) === monthKey
    );

    if (isDue && !alreadyCreatedThisMonth) {
      // Determine creation day (pad day to 2 digits, clamp to max days in month)
      const maxDaysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      const scheduledDay = Math.min(rule.dayOfMonth, maxDaysInMonth);
      const scheduledDateStr = `${monthKey}-${String(scheduledDay).padStart(2, '0')}`;

      const tx: Transaction = {
        id: crypto.randomUUID(),
        type: rule.type,
        amount: rule.amount,
        title: rule.title,
        category: rule.category,
        date: scheduledDateStr,
        walletId: rule.walletId,
        note: rule.note ? `[รายการประจำ] ${rule.note}` : '[รายการประจำ]',
        recurringId: rule.id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      newTransactions.push(tx);
      updatedRules.push({
        ...rule,
        lastProcessedMonth: monthKey,
      });
    } else {
      updatedRules.push(rule);
    }
  }

  return {
    newTransactions,
    updatedRules,
  };
};
