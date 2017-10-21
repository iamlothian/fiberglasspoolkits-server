/**
 * Helper method for automatic table column name conventions
 * @param input transform a string from camel case to underscore
 */
export function toUnderscoreCase(input: string) {
    input = input ? input.trim().replace(/([A-Z])/g, g => '_' + g[0].toLowerCase()) : null
    input = input[0] === '_' ? input.slice(1) : input
    return input;
}