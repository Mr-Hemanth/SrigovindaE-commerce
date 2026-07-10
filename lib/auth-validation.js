/**
 * Pure validation helpers extracted from app/signup/page.js so they can be
 * unit tested in isolation from the form component.
 */

/**
 * Full name must be at least 2 characters long (after trimming whitespace).
 */
export function validateName(name) {
  if (name.trim().length < 2) {
    return { valid: false, message: 'Name must be at least 2 characters long' };
  }
  return { valid: true, message: '' };
}

/**
 * Phone number must be exactly 10 digits (after trimming whitespace).
 */
export function validatePhone(phone) {
  if (!/^\d{10}$/.test(phone.trim())) {
    return { valid: false, message: 'Phone number must be exactly 10 digits' };
  }
  return { valid: true, message: '' };
}

/**
 * Password must be at least 6 characters long.
 */
export function validatePassword(password) {
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters long' };
  }
  return { valid: true, message: '' };
}

/**
 * Confirm password must match the original password.
 */
export function validatePasswordsMatch(password, confirmPassword) {
  if (password !== confirmPassword) {
    return { valid: false, message: 'Passwords do not match' };
  }
  return { valid: true, message: '' };
}

/**
 * Run the full signup form validation in the same order as the original
 * inline logic. Returns the first error message encountered, or '' if the
 * form is valid.
 */
export function validateSignupForm({ name, phone, password, confirmPassword }) {
  const checks = [
    validateName(name),
    validatePhone(phone),
    validatePassword(password),
    validatePasswordsMatch(password, confirmPassword),
  ];

  const firstError = checks.find((result) => !result.valid);
  return firstError ? firstError.message : '';
}
