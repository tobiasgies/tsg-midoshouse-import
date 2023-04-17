/**
 * Converts the input datetime object to the supplied timezone and formats it with the supplied format string.
 *
 * @param {Date|string|number|Array<Date|string|number>|Array<Array<Date|string|number>>} datetime The object to format
 * @param {string} timezone The timezone to convert to
 * @param {string} format The format string for the output
 * @return The formatted string in the supplied timezone.
 * @customfunction
 */
function TZCONVERT(datetime: Date|string|number|Array<Date|string|number>|Array<Array<Date|string|number>>,
                   timezone: string,
                   format: string): string|(string|string[])[] {
    return Array.isArray(datetime)
        ? datetime.map(it1 => Array.isArray(it1)
            ? it1.map(it2 => Utilities.formatDate(new Date(it2), timezone, format))
            : Utilities.formatDate(new Date(it1), timezone, format))
        : Utilities.formatDate(new Date(datetime), timezone, format);
}