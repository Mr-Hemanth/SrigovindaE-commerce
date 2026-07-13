// Product prices are tax-inclusive (MRP-style), matching how they're already sold — this does
// NOT change what a customer pays. It only reverse-derives the GST portion already baked into
// the price so checkout/invoices can show a proper "Taxable Value + GST = Total" breakup instead
// of one opaque number, which is what a GST-compliant invoice is expected to show.
//
// NOTE: 3% is the commonly-applied GST rate for imitation/artificial jewellery (HSN 7117) in
// India, but the correct rate depends on this business's actual GST registration and HSN
// classification — confirm with an accountant before treating this as filed tax advice.
export const GST_RATE = 0.03;

export function deriveTaxBreakup(inclusiveTotal, rate = GST_RATE) {
  const total = Number(inclusiveTotal) || 0;
  const taxableValue = total / (1 + rate);
  const taxAmount = total - taxableValue;
  return { taxableValue, taxAmount, rate };
}
