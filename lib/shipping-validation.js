/**
 * Pure shipping-address form validation, extracted from app/checkout/page.js so it can be unit
 * tested in isolation from the form component (same pattern as auth-validation.js).
 */
export function validateAddressForm({ area, city, state, pincode, phone }) {
  if (!area?.trim()) return 'Area / Street is required.';
  if (!city?.trim()) return 'City or Town is required.';
  if (!state?.trim()) return 'State is required.';
  if (!/^\d{6}$/.test(pincode?.trim() || '')) return 'Pincode must be exactly 6 digits.';
  if (!/^\d{10}$/.test(phone?.trim() || '')) return 'Phone number must be exactly 10 digits.';
  return '';
}
