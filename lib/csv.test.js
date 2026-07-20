import { csvEscape, rowsToCsv } from './csv';

describe('csvEscape', () => {
  it('wraps values containing commas or quotes', () => {
    expect(csvEscape('Doe, John')).toBe('"Doe, John"');
    expect(csvEscape('5\' 9" tall')).toBe('"5\' 9"" tall"');
  });

  it('leaves plain values unquoted', () => {
    expect(csvEscape('Alice')).toBe('Alice');
  });

  it('treats null/undefined as empty string', () => {
    expect(csvEscape(null)).toBe('');
    expect(csvEscape(undefined)).toBe('');
  });
});

describe('rowsToCsv', () => {
  it('builds a header row plus one row per record', () => {
    const csv = rowsToCsv(['Name', 'Age'], [['Alice', 30], ['Bob, Jr.', 25]]);
    expect(csv.split('\n')).toEqual(['Name,Age', 'Alice,30', '"Bob, Jr.",25']);
  });
});
