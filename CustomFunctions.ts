/**
 * Converts the input datetime object to the supplied timezone and formats it with the supplied format string.
 *
 * @param {Date} datetime The datetime to format
 * @param {string} timezone The timezone to convert to
 * @param {string} format The format string for the output
 * @return The formatted string in the supplied timezone.
 * @customfunction
 */
function TZCONVERT(datetime: Date, timezone: string, format: string): string {
    return Utilities.formatDate(datetime, timezone, format);
}