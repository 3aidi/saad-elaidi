/**
 * Backend-only validation helpers.
 * Used for request params/body validation without changing API response shape.
 */

/**
 * Parse and validate a positive integer (e.g. ID from path/query).
 * @param {*} value - Raw value (usually string from req.params)
 * @returns {{ valid: true, value: number } | { valid: false }} - Use value when valid
 */
function parsePositiveInteger(value) {
  if (value === undefined || value === null || value === '') {
    return { valid: false };
  }
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) {
    return { valid: false };
  }
  return { valid: true, value: n };
}

module.exports = { parsePositiveInteger };
