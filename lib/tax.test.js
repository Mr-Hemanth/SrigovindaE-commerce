import { deriveTaxBreakup, GST_RATE } from './tax';

describe('deriveTaxBreakup', () => {
  it('splits an inclusive total into taxable value + tax that sum back to the total', () => {
    const { taxableValue, taxAmount } = deriveTaxBreakup(1030);
    expect(taxableValue + taxAmount).toBeCloseTo(1030, 6);
  });

  it('uses the default GST rate when none is given', () => {
    const { taxAmount, rate } = deriveTaxBreakup(1030);
    expect(rate).toBe(GST_RATE);
    expect(taxAmount).toBeCloseTo(30, 1);
  });

  it('respects a custom rate', () => {
    const { taxableValue, taxAmount } = deriveTaxBreakup(1180, 0.18);
    expect(taxableValue).toBeCloseTo(1000, 1);
    expect(taxAmount).toBeCloseTo(180, 1);
  });

  it('returns zeros for a non-numeric or zero total', () => {
    expect(deriveTaxBreakup(0)).toEqual({ taxableValue: 0, taxAmount: 0, rate: GST_RATE });
    expect(deriveTaxBreakup(undefined)).toEqual({ taxableValue: 0, taxAmount: 0, rate: GST_RATE });
  });
});
