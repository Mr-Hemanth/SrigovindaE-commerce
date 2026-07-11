import { validateAddressForm } from '@/lib/shipping-validation';

describe('validateAddressForm', () => {
  const validForm = { area: '12-3 Main St', city: 'Amalapuram', state: 'Andhra Pradesh', pincode: '533201', phone: '9876543210' };

  it('returns empty string for a fully valid form', () => {
    expect(validateAddressForm(validForm)).toBe('');
  });

  it('requires area', () => {
    expect(validateAddressForm({ ...validForm, area: '  ' })).toBe('Area / Street is required.');
  });

  it('requires city', () => {
    expect(validateAddressForm({ ...validForm, city: '' })).toBe('City or Town is required.');
  });

  it('requires state', () => {
    expect(validateAddressForm({ ...validForm, state: '' })).toBe('State is required.');
  });

  it('requires a 6-digit pincode', () => {
    expect(validateAddressForm({ ...validForm, pincode: '12345' })).toBe('Pincode must be exactly 6 digits.');
    expect(validateAddressForm({ ...validForm, pincode: 'abcdef' })).toBe('Pincode must be exactly 6 digits.');
  });

  it('requires a 10-digit phone number', () => {
    expect(validateAddressForm({ ...validForm, phone: '12345' })).toBe('Phone number must be exactly 10 digits.');
  });

  it('checks fields in order, returning the first error', () => {
    expect(validateAddressForm({ area: '', city: '', state: '', pincode: '', phone: '' })).toBe('Area / Street is required.');
  });
});
