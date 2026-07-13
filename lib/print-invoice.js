import { deriveTaxBreakup } from './tax';

// Opens a print-ready HTML invoice for a given order in a new window.
export function printOrderInvoice(order) {
  const orderDate = order.createdAt?.toDate
    ? order.createdAt.toDate()
    : new Date(order.createdAt);
  const formattedDate = orderDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  const taxBreakup = deriveTaxBreakup(order.finalTotal || order.total || 0);

  const invoiceWindow = window.open('', '_blank');
  invoiceWindow.document.write(`
    <html>
      <head>
        <title>Invoice - Order #${order.id.slice(-8).toUpperCase()}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 40px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f2a4a; padding-bottom: 20px; }
          .brand { color: #0f2a4a; font-size: 24px; font-weight: bold; }
          .details { margin-top: 30px; display: flex; justify-content: space-between; font-size: 14px; }
          .details div { max-width: 45%; }
          table { width: 100%; border-collapse: collapse; margin-top: 40px; }
          th { background: #0f2a4a; color: #fff; padding: 12px; text-align: left; }
          td { padding: 12px; border-bottom: 1px solid #eee; }
          .total-section { margin-top: 30px; display: flex; flex-direction: column; align-items: flex-end; font-size: 14px; }
          .total-row { display: flex; width: 300px; justify-content: space-between; margin-bottom: 8px; }
          .grand-total { font-size: 18px; font-weight: bold; color: #0f2a4a; border-top: 2px solid #0f2a4a; padding-top: 8px; }
          .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">Srigovinda collections</div>
            <div style="font-size:12px; color:#666; margin-top:5px;">Devangula Street, Amalapuram, AP, India<br/>Phone: +91 9533866777</div>
          </div>
          <div style="text-align:right;">
            <h2 style="margin:0; color:#0f2a4a;">INVOICE</h2>
            <div style="margin-top:5px; font-size:13px;">Order ID: ${order.id.toUpperCase()}</div>
            <div style="font-size:13px;">Date: ${formattedDate}</div>
          </div>
        </div>

        <div class="details">
          <div>
            <strong style="color:#0f2a4a;">Shipping Address:</strong>
            <div style="margin-top:5px; line-height:1.4;">
              ${order.userName || 'Recipient'}<br/>
              ${order.shippingAddress}<br/>
              Phone: ${order.phone}
            </div>
          </div>
          <div style="text-align:right;">
            <strong style="color:#0f2a4a;">Transaction Details:</strong>
            <div style="margin-top:5px; line-height:1.4;">
              Method: ${order.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : order.paymentMethod.toUpperCase()}<br/>
              Payment Status: ${order.paymentStatus}
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Product Description</th>
              <th style="text-align:center;">Qty</th>
              <th style="text-align:right;">Price</th>
              <th style="text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td>${item.name}${item.variantLabel ? ` — ${item.variantLabel}` : ''}</td>
                <td style="text-align:center;">${item.quantity}</td>
                <td style="text-align:right;">₹${(item.discountedPrice || item.price || 0)}</td>
                <td style="text-align:right;">₹${(Number(item.discountedPrice || item.price || 0) * Number(item.quantity || 0)).toFixed(0)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total-section">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>₹${Number(order.subtotal || order.total || 0).toFixed(0)}</span>
          </div>
          ${order.discount > 0 ? `
            <div class="total-row" style="color:green;">
              <span>Discount (${order.discount}%):</span>
              <span>-₹${(Number(order.subtotal || order.total || 0) * (Number(order.discount || 0) / 100)).toFixed(0)}</span>
            </div>
          ` : ''}
          <div class="total-row">
            <span>Taxable Value:</span>
            <span>₹${taxBreakup.taxableValue.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>GST (${(taxBreakup.rate * 100).toFixed(0)}%, included):</span>
            <span>₹${taxBreakup.taxAmount.toFixed(2)}</span>
          </div>
          <div class="total-row grand-total">
            <span>Grand Total:</span>
            <span>₹${Number(order.finalTotal || order.total || 0).toFixed(0)}</span>
          </div>
        </div>
        <p style="text-align:right; font-size:11px; color:#999; margin-top:4px;">Inclusive of all taxes.</p>

        <div class="footer">
          Thank you for shopping with Srigovinda collections! SSL Secured Payment Receipt.
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `);
  invoiceWindow.document.close();
}
