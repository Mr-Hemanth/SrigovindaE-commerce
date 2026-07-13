// Generates a real PDF (not a browser print-to-PDF dialog) and triggers an immediate download —
// works identically across browsers/OSes, unlike relying on window.print()'s "Save as PDF" option.
export async function downloadOrderInvoice(order) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 40;
  const navy = [15, 42, 74];
  const gray = [102, 102, 102];

  const orderDate = order.createdAt?.toDate
    ? order.createdAt.toDate()
    : new Date(order.createdAt);
  const formattedDate = orderDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  const orderIdLabel = order.id.toUpperCase();

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...navy);
  doc.text('Srigovinda collections', marginX, 50);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  doc.text('Devangula Street, Amalapuram, AP, India', marginX, 66);
  doc.text('Phone: +91 9533866777', marginX, 78);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...navy);
  doc.text('INVOICE', pageWidth - marginX, 50, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Order ID: ${orderIdLabel}`, pageWidth - marginX, 66, { align: 'right' });
  doc.text(`Date: ${formattedDate}`, pageWidth - marginX, 78, { align: 'right' });

  doc.setDrawColor(...navy);
  doc.setLineWidth(1.2);
  doc.line(marginX, 92, pageWidth - marginX, 92);

  // Shipping / transaction details
  let y = 118;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...navy);
  doc.text('Shipping Address', marginX, y);
  doc.text('Transaction Details', pageWidth / 2 + 10, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  const shippingLines = doc.splitTextToSize(
    `${order.userName || 'Recipient'}\n${order.shippingAddress}\nPhone: ${order.phone}`,
    pageWidth / 2 - marginX - 20
  );
  doc.text(shippingLines, marginX, y + 16);

  const paymentMethodLabel = order.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : String(order.paymentMethod).toUpperCase();
  doc.text([`Method: ${paymentMethodLabel}`, `Payment Status: ${order.paymentStatus}`], pageWidth / 2 + 10, y + 16);

  y += 16 + shippingLines.length * 12 + 24;

  // Items table
  const colProduct = marginX;
  const colQty = pageWidth - marginX - 160;
  const colPrice = pageWidth - marginX - 100;
  const colTotal = pageWidth - marginX;

  doc.setFillColor(...navy);
  doc.rect(marginX, y, pageWidth - marginX * 2, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Product Description', colProduct + 8, y + 15);
  doc.text('Qty', colQty, y + 15, { align: 'center' });
  doc.text('Price', colPrice, y + 15, { align: 'right' });
  doc.text('Total', colTotal, y + 15, { align: 'right' });
  y += 22;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  (order.items || []).forEach((item, idx) => {
    const rowHeight = 24;
    if (idx % 2 === 1) {
      doc.setFillColor(247, 247, 247);
      doc.rect(marginX, y, pageWidth - marginX * 2, rowHeight, 'F');
    }
    const price = Number(item.discountedPrice || item.price || 0);
    const lineLabel = item.name + (item.variantLabel ? ` — ${item.variantLabel}` : '');
    doc.text(lineLabel, colProduct + 8, y + 16, { maxWidth: colQty - colProduct - 16 });
    doc.text(String(item.quantity), colQty, y + 16, { align: 'center' });
    doc.text(`Rs.${price}`, colPrice, y + 16, { align: 'right' });
    doc.text(`Rs.${(price * Number(item.quantity || 0)).toFixed(0)}`, colTotal, y + 16, { align: 'right' });
    y += rowHeight;
  });

  y += 20;

  // Totals
  const subtotal = Number(order.subtotal || order.total || 0);
  doc.setFontSize(10);
  doc.text('Subtotal:', pageWidth - marginX - 140, y, { align: 'left' });
  doc.text(`Rs.${subtotal.toFixed(0)}`, colTotal, y, { align: 'right' });
  y += 16;

  if (order.discount > 0) {
    doc.setTextColor(0, 128, 0);
    doc.text(`Discount (${order.discount}%):`, pageWidth - marginX - 140, y, { align: 'left' });
    doc.text(`-Rs.${(subtotal * (Number(order.discount || 0) / 100)).toFixed(0)}`, colTotal, y, { align: 'right' });
    doc.setTextColor(40, 40, 40);
    y += 16;
  }

  doc.setDrawColor(...navy);
  doc.setLineWidth(1);
  doc.line(pageWidth - marginX - 140, y, colTotal, y);
  y += 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...navy);
  doc.text('Grand Total:', pageWidth - marginX - 140, y, { align: 'left' });
  doc.text(`Rs.${Number(order.finalTotal || order.total || 0).toFixed(0)}`, colTotal, y, { align: 'right' });

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  doc.text('Thank you for shopping with Srigovinda collections!', pageWidth / 2, 780, { align: 'center' });

  doc.save(`Invoice-${order.id.slice(-8).toUpperCase()}.pdf`);
}
