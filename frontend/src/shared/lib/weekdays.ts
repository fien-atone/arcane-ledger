/**
 * Returns 2-letter weekday abbreviations starting from Monday,
 * localized to the given locale (e.g. 'en-GB' → ['Mo','Tu',...], 'ru-RU' → ['Пн','Вт',...]).
 */
export function getWeekdays(locale: string): string[] {
  // 2024-01-01 is a Monday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2024, 0, 1 + i);
    const name = d.toLocaleDateString(locale, { weekday: 'short' });
    // Take first 2 characters for compact display
    return name.slice(0, 2);
  });
}
