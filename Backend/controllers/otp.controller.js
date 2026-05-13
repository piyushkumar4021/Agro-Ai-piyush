/**
 * AgroAI OTP Controller
 * SMS  → Fast2SMS
 * Email → Gmail via Nodemailer
 */

const axios      = require('axios');
const nodemailer = require('nodemailer');
const bcrypt     = require('bcryptjs');

const otpStore      = new Map(); // { otp, expiresAt, attempts }
const OTP_EXPIRY_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS  = 5;

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ── Gmail transporter ─────────────────────────────────────────
function createTransporter() {
  return nodemailer.createTransport({
    host:   'smtp.gmail.com',
    port:    587,
    secure:  false,
    auth: {
      user: process.env.SMTP_USER.trim(),
      pass: process.env.SMTP_PASS.trim(),
    },
    tls: { rejectUnauthorized: false },
  });
}

// ── Shared: send OTP email ────────────────────────────────────
async function sendOtpEmail(to, otp, subject = 'Your AgroAI OTP') {
  console.log('\n╔══════════════════════════════════╗');
  console.log(`║  📧 EMAIL OTP → ${to}`);
  console.log(`║  OTP: ${otp}  (valid 10 mins)`);
  console.log('╚══════════════════════════════════╝\n');

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;

  const transporter = createTransporter();
  await transporter.verify();
  await transporter.sendMail({
    from:    `"AgroAI 🌾" <${process.env.SMTP_USER.trim()}>`,
    to:      to.trim(),
    subject,
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#1a3a2a,#2d6a4f);padding:32px 40px;text-align:center;">
      <div style="font-size:2.5rem;margin-bottom:8px;">🌾</div>
      <div style="font-size:1.5rem;font-weight:800;color:#52b788;">Agro<span style="color:#f4a261;">AI</span></div>
      <div style="color:rgba(255,255,255,0.6);font-size:0.85rem;margin-top:4px;">AI-Driven Agriculture Marketplace</div>
    </div>
    <div style="padding:36px 40px;">
      <h2 style="margin:0 0 8px;color:#111827;font-size:1.25rem;">${subject}</h2>
      <p style="color:#6b7280;font-size:0.9rem;line-height:1.6;margin:0 0 28px;">
        Use the code below. Valid for <strong>10 minutes</strong>.
      </p>
      <div style="background:#f0fdf4;border:2px dashed #52b788;border-radius:12px;padding:28px;text-align:center;margin-bottom:28px;">
        <div style="font-size:0.75rem;color:#6b7280;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px;">Your verification code</div>
        <div style="font-size:2.8rem;font-weight:900;color:#1a3a2a;letter-spacing:0.35em;font-family:'Courier New',monospace;">${otp}</div>
      </div>
      <div style="background:#fef3c7;border-radius:8px;padding:14px 16px;font-size:0.82rem;color:#92400e;">
        ⚠️ <strong>Never share this OTP</strong> with anyone.
      </div>
    </div>
    <div style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
      <div style="color:#9ca3af;font-size:0.75rem;">© 2025 AgroAI · NITI Aayog Capstone SCA2502-011</div>
    </div>
  </div>
</body>
</html>`,
  });
}

// ─────────────────────────────────────────────────────────────
// TEST ROUTE — GET /api/otp/test-email?to=you@gmail.com
// ─────────────────────────────────────────────────────────────
exports.testEmail = async (req, res) => {
  const to = req.query.to;
  if (!to) return res.json({ success: false, message: 'Add ?to=youremail@gmail.com' });
  try {
    const transporter = createTransporter();
    await transporter.verify();
    await transporter.sendMail({
      from: `"AgroAI" <${process.env.SMTP_USER.trim()}>`,
      to,
      subject: 'AgroAI Test Email ✅',
      text: 'Email is working correctly!',
    });
    res.json({ success: true, message: `Test email sent to ${to}` });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// SEND EMAIL OTP (Registration)
// ─────────────────────────────────────────────────────────────
exports.sendEmailOTP = async (req, res) => {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ success: false, message: 'Valid email is required' });
  }
  const otp = generateOTP();
  const key = `email:${email.toLowerCase().trim()}`;
  otpStore.set(key, { otp, expiresAt: Date.now() + OTP_EXPIRY_MS, attempts: 0 });
  try {
    await sendOtpEmail(email, otp, 'Verify your AgroAI email');
    res.json({ success: true, message: `OTP sent to ${email.replace(/(.{2})(.*)(@.*)/, '$1***$3')}` });
  } catch (err) {
    console.error('❌ Email error:', err.message);
    res.json({ success: true, message: 'OTP in backend console (email config issue)', _error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// SEND PHONE OTP (Registration) via Fast2SMS
// ─────────────────────────────────────────────────────────────
exports.sendPhoneOTP = async (req, res) => {
  const { phone } = req.body;
  const cleaned   = (phone || '').replace(/\D/g, '').slice(-10);
  if (!cleaned || cleaned.length !== 10) {
    return res.status(400).json({ success: false, message: 'Valid 10-digit mobile number required' });
  }
  const otp = generateOTP();
  const key = `phone:${cleaned}`;
  otpStore.set(key, { otp, expiresAt: Date.now() + OTP_EXPIRY_MS, attempts: 0 });

  console.log('\n╔══════════════════════════════════╗');
  console.log(`║  📱 SMS OTP → ${phone}`);
  console.log(`║  OTP: ${otp}  (valid 10 mins)`);
  console.log('╚══════════════════════════════════╝\n');

  if (process.env.FAST2SMS_API_KEY && process.env.FAST2SMS_API_KEY.trim()) {
    try {
      const r = await axios.post(
        'https://www.fast2sms.com/dev/bulkV2',
        { variables_values: otp, route: 'otp', numbers: cleaned },
        { headers: { authorization: process.env.FAST2SMS_API_KEY.trim(), 'Content-Type': 'application/json' } }
      );
      if (r.data?.return === true) {
        return res.json({ success: true, message: `OTP sent to +91-XXXXX${cleaned.slice(-5)}` });
      }
      throw new Error(r.data?.message || 'Fast2SMS failed');
    } catch (e) {
      console.error('❌ SMS error:', e.message);
      return res.json({ success: true, message: 'SMS failed — OTP in backend console', _error: e.message });
    }
  }
  res.json({ success: true, message: 'FAST2SMS not configured — OTP in backend console' });
};

// ─────────────────────────────────────────────────────────────
// FORGOT PASSWORD — sends OTP to registered email
// POST /api/otp/forgot-password  { email }
// ─────────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ success: false, message: 'Valid email is required' });
  }

  // Check user exists
  const User = require('../models/User.model');
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    return res.status(404).json({ success: false, message: 'No account found with this email address' });
  }

  const otp = generateOTP();
  const key = `email:${email.toLowerCase().trim()}`;
  otpStore.set(key, { otp, expiresAt: Date.now() + OTP_EXPIRY_MS, attempts: 0 });

  try {
    await sendOtpEmail(email, otp, 'Reset your AgroAI password');
    res.json({ success: true, message: `Password reset OTP sent to ${email.replace(/(.{2})(.*)(@.*)/, '$1***$3')}` });
  } catch (err) {
    console.error('❌ Email error:', err.message);
    res.json({ success: true, message: 'OTP in backend console (email config issue)', _error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// RESET PASSWORD — called after OTP is verified
// POST /api/otp/reset-password  { email, newPassword }
// ─────────────────────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Email and password (min 6 chars) required' });
  }
  try {
    const User = require('../models/User.model');
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Set new password — pre-save hook in User model will hash it
    user.password = newPassword;
    await user.save();

    console.log(`✅ Password reset for ${email}`);
    res.json({ success: true, message: 'Password reset successfully! Please sign in with your new password.' });
  } catch (err) {
    console.error('❌ Reset error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// VERIFY OTP (shared — phone + email)
// ─────────────────────────────────────────────────────────────
exports.verifyOTP = async (req, res) => {
  const { type, value, otp } = req.body;
  if (!type || !value || !otp) {
    return res.status(400).json({ success: false, message: 'type, value and otp are required' });
  }
  const cleaned = type === 'phone' ? value.replace(/\D/g, '').slice(-10) : value.toLowerCase().trim();
  const key     = `${type}:${cleaned}`;
  const record  = otpStore.get(key);

  if (!record)                       return res.status(400).json({ success: false, message: 'No OTP found. Request a new one.' });
  if (Date.now() > record.expiresAt) { otpStore.delete(key); return res.status(400).json({ success: false, message: 'OTP expired. Request a new one.' }); }
  if (record.attempts >= MAX_ATTEMPTS) { otpStore.delete(key); return res.status(429).json({ success: false, message: 'Too many attempts. Request a new OTP.' }); }

  if (record.otp !== String(otp).trim()) {
    record.attempts += 1;
    const left = MAX_ATTEMPTS - record.attempts;
    return res.status(400).json({ success: false, message: left > 0 ? `Wrong OTP. ${left} attempt${left > 1 ? 's' : ''} left.` : 'Too many attempts. Request a new OTP.' });
  }

  otpStore.delete(key);
  console.log(`✅ OTP verified — ${type}: ${value}`);
  res.json({ success: true, message: `${type === 'email' ? 'Email' : 'Phone'} verified!` });
};