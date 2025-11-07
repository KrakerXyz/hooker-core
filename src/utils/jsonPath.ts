import { JSONPath } from 'jsonpath-plus';

/**
 * Evaluates a JSONPath expression against a source string and returns the result as a string.
 * 
 * @param src - The source string to parse as JSON and evaluate against
 * @param path - The JSONPath expression to evaluate
 * @returns The result of the JSONPath evaluation as a string, or undefined if parsing fails
 * 
 * Behavior:
 * - If `src` cannot be parsed as JSON, returns `undefined`
 * - If the path evaluates to `null`, `undefined`, or empty string, returns empty string `''`
 * - If the path matches a single string value, returns that value as-is
 * - If the path matches any other single value or multiple values, returns the JSON stringified result
 * - If the path matches nothing (empty array result), returns empty string `''`
 * 
 * @example
 * ```ts
 * evalJsonPathAsString('{"name":"John"}', '$.name') // Returns: "John"
 * evalJsonPathAsString('{"age":25}', '$.age') // Returns: "25"
 * evalJsonPathAsString('{"user":{"name":"Jane"}}', '$.user') // Returns: '{"name":"Jane"}'
 * evalJsonPathAsString('invalid json', '$.name') // Returns: undefined
 * evalJsonPathAsString('{"name":""}', '$.name') // Returns: ''
 * ```
 */
export function evalJsonPathAsString(src: string, path: string): string | undefined {
    // Attempt to parse the source as JSON
    let json: unknown;
    try {
        json = JSON.parse(src);
    } catch {
        return undefined;
    }

    // Evaluate the JSONPath expression
    let results: unknown;
    try {
        results = JSONPath({ path, json: json as object });
    } catch {
        return undefined;
    }

    // Handle the results based on type and content
    if (!Array.isArray(results)) {
        // Unexpected result format from JSONPath
        return undefined;
    }

    if (results.length === 0) {
        // No matches found
        return '';
    }

    if (results.length === 1) {
        const value = results[0];
        
        // Handle null, undefined, or empty string
        if (value === null || value === undefined || value === '') {
            return '';
        }

        // If it's a string, return as-is
        if (typeof value === 'string') {
            return value;
        }

        // For any other type, stringify it
        return JSON.stringify(value);
    }

    // Multiple matches - stringify the array
    return JSON.stringify(results);
}
