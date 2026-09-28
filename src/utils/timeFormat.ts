/**
 * Time formatting and operational calculations for Manifa Padel
 * Operating window: 16:00 (4:00 PM) to 03:00 / 04:00 AM (next morning)
 */

/**
 * Converts any time representation ("17:00", "5:00 م", "05:00 م", "01:30", "1:30 ص", "12:00 ص")
 * into operational minutes from the start of the operational 24-hour cycle.
 * In this cycle, hours 00:00 to 06:00 belong to the late-night shift of the current operational date (1440+ minutes).
 */
export function toOperationalMinutes(timeStr: string | undefined | null): number {
  if (!timeStr) return 0;
  let str = String(timeStr).trim();

  // Convert Eastern Arabic numerals (٠-٩) to standard numerals (0-9)
  str = str.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));

  const hasPM = /م|pm/i.test(str);
  const hasAM = /ص|am/i.test(str);

  const match = str.match(/(\d{1,2}):(\d{2})/);
  if (!match) return 0;

  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);

  if (hasPM) {
    if (h < 12) h += 12;
  } else if (hasAM) {
    if (h === 12) h = 0;
  }

  // Operational schedule (16:00 to 03:30 AM):
  // Hours from 00:00 up to 05:59 are post-midnight hours of the operational date (1440+ minutes)
  // Hours 06:00 to 15:59 are daytime hours before the 16:00 opening
  const operationalHours = h < 6 ? h + 24 : h;
  return operationalHours * 60 + m;
}

/**
 * Helper to match court IDs flexibly (e.g. 'court-1' vs 'court1' or by name)
 */
export function isCourtMatch(
  courtIdA?: string,
  courtIdB?: string,
  courtNameA?: string,
  courtNameB?: string
): boolean {
  if (courtIdA && courtIdB) {
    if (courtIdA === courtIdB) return true;
    if (courtIdA.replace(/[-_]/g, '').toLowerCase() === courtIdB.replace(/[-_]/g, '').toLowerCase()) {
      return true;
    }
  }

  const cleanIdA = (courtIdA || '').toLowerCase();
  const cleanIdB = (courtIdB || '').toLowerCase();
  const cleanNameA = (courtNameA || '').toLowerCase();
  const cleanNameB = (courtNameB || '').toLowerCase();

  const isA1 = cleanIdA.includes('1') || cleanNameA.includes('1') || cleanNameA.includes('١') || cleanNameA.includes('الأول') || cleanNameA.includes('الاول');
  const isA2 = cleanIdA.includes('2') || cleanNameA.includes('2') || cleanNameA.includes('٢') || cleanNameA.includes('الثاني');
  const isB1 = cleanIdB.includes('1') || cleanNameB.includes('1') || cleanNameB.includes('١') || cleanNameB.includes('الأول') || cleanNameB.includes('الاول');
  const isB2 = cleanIdB.includes('2') || cleanNameB.includes('2') || cleanNameB.includes('٢') || cleanNameB.includes('الثاني');

  if (isA1 && isB1) return true;
  if (isA2 && isB2) return true;

  if (cleanNameA && cleanNameB && cleanNameA === cleanNameB) return true;

  return false;
}

export function formatSingleTime(timeStr: string | undefined | null): string {
  if (!timeStr) return '';
  let trimmed = String(timeStr).trim();

  // Convert Eastern Arabic numerals
  trimmed = trimmed.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));

  // Check if it already has Arabic/English period like "05:00 م" or "01:00 ص" or "8:00 م"
  const periodMatch = trimmed.match(/^0?(\d{1,2}):(\d{2})\s*(م|ص|AM|PM|am|pm)?$/);
  if (periodMatch) {
    const rawH = parseInt(periodMatch[1], 10);
    const m = periodMatch[2];
    const rawPeriod = periodMatch[3];

    if (rawPeriod) {
      const p =
        rawPeriod.toLowerCase() === 'pm'
          ? 'م'
          : rawPeriod.toLowerCase() === 'am'
          ? 'ص'
          : rawPeriod;
      return `${rawH}:${m} ${p}`;
    }

    // No period given, treat as 24-hour time (e.g. "17:00", "20:30", "01:00")
    const period = rawH >= 12 && rawH < 24 ? 'م' : 'ص';
    const displayH = rawH % 12 === 0 ? 12 : rawH % 12;
    return `${displayH}:${m} ${period}`;
  }

  // Fallback
  return trimmed.replace(/\b0([1-9]):/g, '$1:');
}

export function formatArabicTime(timeStr: string | undefined | null): string {
  if (!timeStr) return '';
  const trimmed = String(timeStr).trim();

  // If it already starts with "من " and contains " إلى "
  if (trimmed.startsWith('من ') && trimmed.includes(' إلى ')) {
    const withoutMin = trimmed.slice(3);
    const [startPart, endPart] = withoutMin.split(' إلى ');
    return `من ${formatSingleTime(startPart)} إلى ${formatSingleTime(endPart)}`;
  }

  // If it's a range with " - "
  if (trimmed.includes(' - ')) {
    const parts = trimmed.split(' - ');
    if (parts.length >= 2) {
      return `من ${formatSingleTime(parts[0])} إلى ${formatSingleTime(parts[1])}`;
    }
    return parts.map((p) => formatSingleTime(p)).join(' - ');
  }

  // If it's a range with " إلى "
  if (trimmed.includes(' إلى ')) {
    const parts = trimmed.split(' إلى ');
    if (parts.length >= 2) {
      return `من ${formatSingleTime(parts[0])} إلى ${formatSingleTime(parts[1])}`;
    }
    return parts.map((p) => formatSingleTime(p)).join(' إلى ');
  }

  return formatSingleTime(trimmed);
}

/**
 * Format range from start and end time strings: "من 5:00 م إلى 6:30 م"
 */
export function formatTimeRange(start: string | undefined | null, end: string | undefined | null): string {
  if (!start && !end) return '';
  const s = formatSingleTime(start);
  const e = formatSingleTime(end);
  if (!e) return s;
  if (!s) return e;
  return `من ${s} إلى ${e}`;
}

/**
 * Parse any time representation ("16:00", "4:00 م", "03:00 ص", "23:30")
 * into normalized 24-hour hour and minute values, and total minutes from 00:00.
 */
export function parseTimeToMinutes(timeStr: string | undefined | null): { hours: number; minutes: number; totalMinutes: number } {
  if (!timeStr) return { hours: 16, minutes: 0, totalMinutes: 960 };
  let str = String(timeStr).trim();
  str = str.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));

  const hasPM = /م|pm/i.test(str);
  const hasAM = /ص|am/i.test(str);

  const match = str.match(/(\d{1,2}):(\d{2})/);
  if (!match) return { hours: 16, minutes: 0, totalMinutes: 960 };

  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);

  if (hasPM) {
    if (h < 12) h += 12;
  } else if (hasAM) {
    if (h === 12) h = 0;
  }

  return { hours: h, minutes: m, totalMinutes: h * 60 + m };
}

/**
 * Calculates operational bounds in continuous operational minutes.
 * If closing time crosses midnight (e.g. open at 4:00 PM (960) and close at 3:00 AM (180)),
 * closing minutes will be 180 + 1440 = 1620.
 */
export function getOperationalTimeBounds(
  openingTimeStr?: string,
  closingTimeStr?: string
): { openMins: number; closeMins: number; totalOperatingHours: number; openLabel: string; closeLabel: string } {
  const openParsed = parseTimeToMinutes(openingTimeStr || '4:00 م');
  let openMins = openParsed.totalMinutes;

  const closeParsed = parseTimeToMinutes(closingTimeStr || '3:00 ص');
  let closeMins = closeParsed.totalMinutes;

  // If closing time is less than or equal to opening time, it crosses midnight
  if (closeMins <= openMins) {
    closeMins += 1440;
  }

  const totalOperatingHours = Math.round(((closeMins - openMins) / 60) * 10) / 10;
  const openFormatted = minutesToFormattedTime(openMins);
  const closeFormatted = minutesToFormattedTime(closeMins);

  return {
    openMins,
    closeMins,
    totalOperatingHours,
    openLabel: openFormatted.full,
    closeLabel: closeFormatted.full,
  };
}

/**
 * Convert total operational minutes (which can exceed 1440 for post-midnight times)
 * to 12-hour Arabic display and 24-hour string.
 */
export function minutesToFormattedTime(totalMins: number): { time: string; period: string; full: string; time24: string } {
  const normMins = ((totalMins % 1440) + 1440) % 1440;
  const h24 = Math.floor(normMins / 60);
  const m = normMins % 60;
  const mStr = String(m).padStart(2, '0');
  const time24 = `${String(h24).padStart(2, '0')}:${mStr}`;
  const period = h24 >= 12 && h24 < 24 ? 'م' : 'ص';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const time = `${h12}:${mStr}`;
  const full = `${time} ${period}`;
  return { time, period, full, time24 };
}

/**
 * Generate schedule slot items dynamically for ScheduleView table based on opening & closing time.
 */
export function generateScheduleTimeSlots(
  openingTimeStr: string = '4:00 م',
  closingTimeStr: string = '3:00 ص',
  stepMinutes: number = 30
): { time: string; label: string; operationalMins: number }[] {
  const { openMins, closeMins } = getOperationalTimeBounds(openingTimeStr, closingTimeStr);
  const slots: { time: string; label: string; operationalMins: number }[] = [];

  for (let m = openMins; m < closeMins; m += stepMinutes) {
    const formatted = minutesToFormattedTime(m);
    slots.push({
      time: formatted.time24,
      label: formatted.full,
      operationalMins: m,
    });
  }

  return slots;
}

/**
 * Quick popular presets for sports club working hours
 */
export const POPULAR_OPERATING_HOURS_PRESETS = [
  { id: 'standard', name: 'المعتاد والشتوي (الأكثر طلباً)', open: '4:00 م', close: '3:00 ص', hours: '11 ساعة', desc: 'من 4:00 عصراً حتى 3:00 فجراً' },
  { id: 'summer', name: 'الصيفي المسائي المتأخر', open: '5:00 م', close: '4:00 ص', hours: '11 ساعة', desc: 'من 5:00 عصراً حتى 4:00 فجراً' },
  { id: 'ramadan', name: 'فترة شهر رمضان المبارك', open: '8:00 م', close: '5:00 ص', hours: '9 ساعات', desc: 'من بعد التراويح 8:00 م حتى 5:00 فجراً (السحور)' },
  { id: 'extended', name: 'دوام كامل شامل الصباح والمساء', open: '8:00 ص', close: '2:00 ص', hours: '18 ساعة', desc: 'من 8:00 صباحاً حتى 2:00 بعد منتصف الليل' },
  { id: 'weekend', name: 'عطلة نهاية الأسبوع (الويكند)', open: '2:00 م', close: '4:00 ص', hours: '14 ساعة', desc: 'من 2:00 ظهراً حتى 4:00 فجراً' },
];

