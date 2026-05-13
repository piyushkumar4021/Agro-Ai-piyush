const nodemailer = require('nodemailer');

// Create transporter — uses same SMTP_USER / SMTP_PASS as otp.controller
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: (process.env.SMTP_USER || '').trim(),
    pass: (process.env.SMTP_PASS || '').trim(),
  },
  tls: { rejectUnauthorized: false },
});

const BRAND = 'AgroAI';
const FROM = `"${BRAND} 🌾" <${(process.env.SMTP_USER || 'noreply@agroai.com').trim()}>`;


// ── HTML email wrapper ────────────────────────────────────────
const wrap = (title, body) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f4f7f5;">
  <div style="max-width:560px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#1a3a2a,#2d6a4f);padding:20px 28px;color:#fff;">
      <div style="font-size:1.3rem;font-weight:800;">🌾 ${BRAND}</div>
      <div style="font-size:0.8rem;color:rgba(255,255,255,0.6);margin-top:2px;">India's Intelligent Agriculture Marketplace</div>
    </div>
    <div style="padding:24px 28px;">
      <h2 style="margin:0 0 12px;color:#1a3a2a;font-size:1.15rem;">${title}</h2>
      ${body}
      <hr style="border:none;border-top:1px solid #e8e8e8;margin:20px 0;">
      <div style="font-size:0.72rem;color:#999;text-align:center;">
        © ${new Date().getFullYear()} ${BRAND} · Secure Escrow Payments · Powered by AI
      </div>
    </div>
  </div>
</body>
</html>`;

// ── Send email (silent fail — don't block main flow) ──────────
const sendEmail = async (to, subject, html) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`📧 Email skipped (no credentials): ${subject} → ${to}`);
    return;
  }
  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
    console.log(`📧 Email sent: ${subject} → ${to}`);
  } catch (err) {
    console.error(`📧 Email failed: ${err.message}`);
  }
};

// ── Order lifecycle emails ────────────────────────────────────

exports.sendOrderPlacedToFarmer = (farmerEmail, order) => {
  const body = `
    <p>A buyer has placed a new order for your crop!</p>
    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:14px;margin:12px 0;">
      <div><strong>Crop:</strong> ${order.crop?.name || 'Crop'}</div>
      <div><strong>Quantity:</strong> ${order.quantity} Qtl</div>
      <div><strong>Amount:</strong> ₹${(order.totalAmount || 0).toLocaleString('en-IN')}</div>
      <div><strong>Buyer:</strong> ${order.buyer?.name || 'Buyer'}</div>
    </div>
    <p style="color:#666;font-size:0.85rem;">Payment will be held securely by AgroAI until the buyer confirms delivery.</p>
  `;
  return sendEmail(farmerEmail, `🛒 New Order Received — ${order.crop?.name || 'Crop'}`, wrap('New Order Received! 🛒', body));
};

exports.sendDispatchedToBuyer = (buyerEmail, order) => {
  const body = `
    <p>Great news! The farmer has dispatched your order.</p>
    <div style="background:#dbeafe;border:1px solid #93c5fd;border-radius:8px;padding:14px;margin:12px 0;">
      <div><strong>Crop:</strong> ${order.crop?.name || 'Crop'} · ${order.quantity} Qtl</div>
      <div><strong>Amount in Escrow:</strong> ₹${(order.totalAmount || 0).toLocaleString('en-IN')}</div>
    </div>
    <p style="color:#666;font-size:0.85rem;">Once you receive the goods, please confirm receipt in your dashboard. AgroAI will then release the payment to the farmer.</p>
  `;
  return sendEmail(buyerEmail, `🚛 Your Order Has Been Dispatched — ${order.crop?.name || 'Crop'}`, wrap('Order Dispatched! 🚛', body));
};

exports.sendPaymentReleasedToFarmer = (farmerEmail, order) => {
  const body = `
    <p>The buyer confirmed receipt — your payment has been released!</p>
    <div style="background:#d8f3dc;border:1px solid #86efac;border-radius:8px;padding:14px;margin:12px 0;">
      <div style="font-size:1.3rem;font-weight:800;color:#166534;">💰 ₹${(order.totalAmount || 0).toLocaleString('en-IN')}</div>
      <div style="font-size:0.82rem;color:#15803d;margin-top:4px;">Released from AgroAI Escrow</div>
    </div>
    <div><strong>Crop:</strong> ${order.crop?.name || 'Crop'} · ${order.quantity} Qtl</div>
    <div><strong>Buyer:</strong> ${order.buyer?.name || 'Buyer'}</div>
    <p style="color:#666;font-size:0.85rem;">Check your payment settings to see payout details.</p>
  `;
  return sendEmail(farmerEmail, `💰 Payment Released — ₹${(order.totalAmount || 0).toLocaleString('en-IN')}`, wrap('Payment Released! 💰', body));
};

exports.sendDeliveryConfirmedToBuyer = (buyerEmail, order) => {
  const body = `
    <p>Thank you for confirming receipt of your order!</p>
    <div style="background:#d8f3dc;border:1px solid #86efac;border-radius:8px;padding:14px;margin:12px 0;">
      <div><strong>Crop:</strong> ${order.crop?.name || 'Crop'} · ${order.quantity} Qtl</div>
      <div><strong>Amount Released:</strong> ₹${(order.totalAmount || 0).toLocaleString('en-IN')}</div>
    </div>
    <p style="color:#666;font-size:0.85rem;">AgroAI has released the payment to the farmer. Thank you for using AgroAI! 🌾</p>
  `;
  return sendEmail(buyerEmail, `✅ Delivery Confirmed — ${order.crop?.name || 'Crop'}`, wrap('Delivery Confirmed! ✅', body));
};
