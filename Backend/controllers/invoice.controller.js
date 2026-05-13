const Order = require('../models/Order.model');

// GET /api/invoices/:orderId — generates HTML invoice for download
exports.getInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('buyer', 'name email phone address')
      .populate('farmer', 'name email phone address')
      .populate('crop', 'name category pricePerUnit unit');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Only allow buyer, farmer, or admin to access
    const userId = req.user._id.toString();
    const isBuyer = order.buyer?._id?.toString() === userId;
    const isFarmer = order.farmer?._id?.toString() === userId;
    if (!isBuyer && !isFarmer && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const ref = (order._id || '').toString().slice(-8).toUpperCase();
    const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
    const statusLabel = {
      pending: 'Pending', payment_done: 'Escrowed', dispatched: 'Dispatched',
      delivered: 'Delivered', cancelled: 'Cancelled',
    }[order.status] || order.status;

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>AgroAI Invoice #${ref}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',Arial,sans-serif; background:#f4f7f5; padding:40px; }
  .invoice { max-width:680px; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 2px 16px rgba(0,0,0,0.08); }
  .header { background:linear-gradient(135deg,#1a3a2a,#2d6a4f); padding:28px 36px; color:#fff; }
  .brand { font-size:1.5rem; font-weight:800; }
  .brand span { color:#f4a261; }
  .sub { font-size:0.78rem; color:rgba(255,255,255,0.6); margin-top:4px; }
  .body { padding:30px 36px; }
  .meta { display:flex; justify-content:space-between; margin-bottom:24px; }
  .meta-item { }
  .meta-label { font-size:0.72rem; color:#999; text-transform:uppercase; letter-spacing:0.05em; }
  .meta-value { font-weight:700; font-size:0.95rem; margin-top:2px; }
  .parties { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:24px; }
  .party { background:#f9fafb; border-radius:8px; padding:16px; }
  .party-title { font-size:0.72rem; font-weight:700; color:#52b788; text-transform:uppercase; margin-bottom:8px; }
  .party-name { font-weight:700; font-size:1rem; }
  .party-detail { font-size:0.82rem; color:#666; margin-top:2px; }
  table { width:100%; border-collapse:collapse; margin-bottom:20px; }
  th { background:#f0fdf4; text-align:left; padding:10px 14px; font-size:0.75rem; color:#166534; text-transform:uppercase; border-bottom:2px solid #86efac; }
  td { padding:12px 14px; border-bottom:1px solid #e5e7eb; font-size:0.88rem; }
  .total-row td { font-weight:800; font-size:1.05rem; background:#f0fdf4; color:#166534; border-top:2px solid #86efac; }
  .status { display:inline-block; padding:4px 12px; border-radius:99px; font-size:0.75rem; font-weight:700; }
  .footer { background:#f9fafb; padding:18px 36px; text-align:center; font-size:0.72rem; color:#999; border-top:1px solid #e5e7eb; }
  @media print { body { padding:0; background:#fff; } .invoice { box-shadow:none; } }
</style>
</head><body>
<div class="invoice">
  <div class="header">
    <div class="brand">🌾 Agro<span>AI</span></div>
    <div class="sub">India's Intelligent Agriculture Marketplace · Tax Invoice / Receipt</div>
  </div>
  <div class="body">
    <div class="meta">
      <div class="meta-item"><div class="meta-label">Invoice No.</div><div class="meta-value">AGRO-${ref}</div></div>
      <div class="meta-item"><div class="meta-label">Date</div><div class="meta-value">${date}</div></div>
      <div class="meta-item"><div class="meta-label">Status</div><div class="meta-value"><span class="status" style="background:${order.status === 'delivered' ? '#d8f3dc;color:#166534' : '#fff3e0;color:#92400e'}">${statusLabel}</span></div></div>
    </div>
    <div class="parties">
      <div class="party">
        <div class="party-title">Seller (Farmer)</div>
        <div class="party-name">${order.farmer?.name || '—'}</div>
        <div class="party-detail">📧 ${order.farmer?.email || '—'}</div>
        <div class="party-detail">📞 ${order.farmer?.phone || '—'}</div>
        <div class="party-detail">📍 ${[order.farmer?.address?.district, order.farmer?.address?.state].filter(Boolean).join(', ') || '—'}</div>
      </div>
      <div class="party">
        <div class="party-title">Buyer</div>
        <div class="party-name">${order.buyer?.name || '—'}</div>
        <div class="party-detail">📧 ${order.buyer?.email || '—'}</div>
        <div class="party-detail">📞 ${order.buyer?.phone || '—'}</div>
        <div class="party-detail">📍 ${order.deliveryAddress || [order.buyer?.address?.district, order.buyer?.address?.state].filter(Boolean).join(', ') || '—'}</div>
      </div>
    </div>
    <table>
      <thead><tr><th>Item</th><th>Category</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
      <tbody>
        <tr>
          <td style="font-weight:700">${order.crop?.name || '—'}</td>
          <td>${order.crop?.category || '—'}</td>
          <td>${order.quantity || 0} ${order.crop?.unit || 'Qtl'}</td>
          <td>₹${(order.crop?.pricePerUnit || 0).toLocaleString('en-IN')}</td>
          <td style="font-weight:700">₹${(order.totalAmount || 0).toLocaleString('en-IN')}</td>
        </tr>
        <tr class="total-row">
          <td colspan="4" style="text-align:right">Total Amount</td>
          <td>₹${(order.totalAmount || 0).toLocaleString('en-IN')}</td>
        </tr>
      </tbody>
    </table>
    <div style="background:#dbeafe;border-radius:8px;padding:12px 16px;font-size:0.82rem;color:#1e40af;margin-bottom:10px;">
      🔒 <strong>Escrow Payment:</strong> This transaction was secured via AgroAI Escrow. Payment was ${order.status === 'delivered' ? 'released to the farmer after buyer confirmed delivery.' : 'held by AgroAI until buyer confirms delivery.'}
    </div>
  </div>
  <div class="footer">© ${new Date().getFullYear()} AgroAI · NITI Aayog Capstone SCA2502-011 · Generated on ${new Date().toLocaleDateString('en-IN')}</div>
</div>
</body></html>`;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename="AgroAI_Invoice_${ref}.html"`);
    res.send(html);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
