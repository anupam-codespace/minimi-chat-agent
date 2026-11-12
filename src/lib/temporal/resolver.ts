export interface ResolvedDateRange {
  phrase: string;
  startDate: Date;
  endDate: Date;
  isRelative: boolean;
  resolvedDateString: string; // YYYY-MM-DD
}

export class TemporalResolver {
  /**
   * Resolves natural language date references relative to a reference time and timezone.
   */
  static resolveDate(
    text: string,
    referenceDate: Date = new Date(),
    _timeZone: string = "UTC"
  ): ResolvedDateRange | null {
    const lower = text.toLowerCase();

    // 1. Check exact calendar date like "3 November", "November 3", "Nov 3", "3rd November"
    const exactDateRegex = /\b(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b|\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i;
    const exactMatch = lower.match(exactDateRegex);

    if (exactMatch) {
      const monthNames: Record<string, number> = {
        january: 0, jan: 0,
        february: 1, feb: 1,
        march: 2, mar: 2,
        april: 3, apr: 3,
        may: 4,
        june: 5, jun: 5,
        july: 6, jul: 6,
        august: 7, aug: 7,
        september: 8, sep: 8,
        october: 9, oct: 9,
        november: 10, nov: 10,
        december: 11, dec: 11,
      };

      let day = 1;
      let month = 0;

      if (exactMatch[1] && exactMatch[2]) {
        day = parseInt(exactMatch[1], 10);
        month = monthNames[exactMatch[2].toLowerCase()];
      } else if (exactMatch[3] && exactMatch[4]) {
        month = monthNames[exactMatch[3].toLowerCase()];
        day = parseInt(exactMatch[4], 10);
      }

      // Check if a year is explicitly specified (e.g. "3 November 2026")
      const yearMatch = lower.match(/\b(202\d)\b/);
      const year = yearMatch ? parseInt(yearMatch[1], 10) : referenceDate.getFullYear();

      const startDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
      const endDate = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
      const resolvedDateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      return {
        phrase: exactMatch[0],
        startDate,
        endDate,
        isRelative: false,
        resolvedDateString,
      };
    }

    // 2. Relative Day of Week: "On Monday", "Last Tuesday", "This Wednesday"
    const daysMap: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };

    const dayPattern = /\b(?:(last|this|past|previous)\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i;
    const dayMatch = lower.match(dayPattern);

    if (dayMatch) {
      const modifier = dayMatch[1]?.toLowerCase();
      const targetDayName = dayMatch[2].toLowerCase();
      const targetDay = daysMap[targetDayName];
      const currentDay = referenceDate.getUTCDay();

      let diffDays = 0;

      if (modifier === "last" || modifier === "previous" || modifier === "past") {
        // "last Tuesday" on a day past Tuesday refers to previous week's Tuesday
        const rawDiff = (currentDay + 7 - targetDay) % 7;
        diffDays = rawDiff === 0 ? 7 : (currentDay >= targetDay ? rawDiff + 7 : rawDiff);
      } else {
        // "on Monday" or "this Monday"
        diffDays = (currentDay + 7 - targetDay) % 7;
        if (diffDays === 0 && referenceDate.getUTCHours() < 12) {
          diffDays = 0;
        } else if (diffDays === 0) {
          diffDays = 7;
        }
      }

      const targetDate = new Date(referenceDate);
      targetDate.setUTCDate(referenceDate.getUTCDate() - diffDays);

      const year = targetDate.getUTCFullYear();
      const month = targetDate.getUTCMonth();
      const day = targetDate.getUTCDate();

      // For safety on days like "last Tuesday", widen the window slightly (within 36 hours) to account for timezones
      const startDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
      const endDate = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
      const resolvedDateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      return {
        phrase: dayMatch[0],
        startDate,
        endDate,
        isRelative: true,
        resolvedDateString,
      };
    }

    // 3. "Yesterday"
    if (lower.includes("yesterday")) {
      const target = new Date(referenceDate);
      target.setUTCDate(referenceDate.getUTCDate() - 1);
      const year = target.getUTCFullYear();
      const month = target.getUTCMonth();
      const day = target.getUTCDate();

      return {
        phrase: "yesterday",
        startDate: new Date(Date.UTC(year, month, day, 0, 0, 0, 0)),
        endDate: new Date(Date.UTC(year, month, day, 23, 59, 59, 999)),
        isRelative: true,
        resolvedDateString: `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      };
    }

    return null;
  }
}
