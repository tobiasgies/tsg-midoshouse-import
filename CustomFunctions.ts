/**
 * Converts the input datetime object to the supplied timezone and formats it with the supplied format string.
 *
 * @param {Date|Array<Array<Date>>} datetime The datetime to format
 * @param {string} timezone The timezone to convert to
 * @param {string} format The format string for the output
 * @return The formatted string in the supplied timezone.
 * @customfunction
 */
function TZCONVERT(datetime: Date|Array<Date>|Array<Array<Date>>, timezone: string, format: string): string|Array<Array<string>> {
    return Array.isArray(datetime)
        ? datetime.map(it1 => it1.map(it2 => Utilities.formatDate(it2, timezone, format)))
        : Utilities.formatDate(datetime, timezone, format);
}