import {
  validateName,
  validatePhone,
  validatePassword,
  validatePasswordsMatch,
  validateSignupForm,
} from '@/lib/auth-validation';

describe('validateName', () => {
  it('rejects names shorter than 2 characters', () => {
    expect(validateName('A')).toEqual({ valid: false, message: 'Name must be at least 2 characters long' });
  });

  it('rejects a name that is only whitespace', () => {
    expect(validateName('   ')).toEqual({ valid: false, message: 'Name must be at least 2 characters long' });
  });

  it('accepts a valid name', () => {
    expect(validateName('Jo')).toEqual({ valid: true, message: '' });
  });
});

describe('validatePhone', () => {
  it('rejects phone numbers that are not exactly 10 digits', () => {
    expect(validatePhone('12345').valid).toBe(false);
    expect(validatePhone('12345678901').valid).toBe(false);
  });

  it('rejects phone numbers containing non-digit characters', () => {
    expect(validatePhone('12345abcde').valid).toBe(false);
  });

  it('accepts a 10-digit phone number, trimming whitespace', () => {
    expect(validatePhone('  9876543210  ')).toEqual({ valid: true, message: '' });
  });
});

describe('validatePassword', () => {
  it('rejects passwords shorter than 6 characters', () => {
    expect(validatePassword('12345').valid).toBe(false);
  });

  it('accepts passwords of 6 or more characters', () => {
    expect(validatePassword('123456')).toEqual({ valid: true, message: '' });
  });
});

describe('validatePasswordsMatch', () => {
  it('rejects mismatched passwords', () => {
    expect(validatePasswordsMatch('abcdef', 'abcdeg').valid).toBe(false);
  });

  it('accepts matching passwords', () => {
    expect(validatePasswordsMatch('abcdef', 'abcdef')).toEqual({ valid: true, message: '' });
  });
});

describe('validateSignupForm', () => {
  const validForm = { name: 'Jane Doe', phone: '9876543210', password: 'secret1', confirmPassword: 'secret1' };

  it('returns empty string for a fully valid form', () => {
    expect(validateSignupForm(validForm)).toBe('');
  });

  it('returns the name error first when multiple fields are invalid', () => {
    expect(validateSignupForm({ ...validForm, name: 'J', phone: '123' })).toBe(
      'Name must be at least 2 characters long'
    );
  });

  it('returns the phone error when name is valid but phone is invalid', () => {
    expect(validateSignupForm({ ...validForm, phone: '123' })).toBe('Phone number must be exactly 10 digits');
  });

  it('returns the password error when name/phone are valid but password is too short', () => {
    expect(validateSignupForm({ ...validForm, password: '123', confirmPassword: '123' })).toBe(
      'Password must be at least 6 characters long'
    );
  });

  it('returns the passwords-do-not-match error last', () => {
    expect(validateSignupForm({ ...validForm, confirmPassword: 'different' })).toBe('Passwords do not match');
  });
});
