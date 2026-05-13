import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllDistrictsForState } from '../data/mlData';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Chandigarh', 'Puducherry',
];

const ROLES = [
  { id: 'farmer', label: '🌾 Farmer' },
  { id: 'buyer', label: '🏢 Buyer' },
];

const REDIRECT = { farmer: '/farmer', buyer: '/buyer' };

// ── Validation helpers ──────────────────────────────────────────
const isValidEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const isValidPhone = v => /^[6-9]\d{9}$/.test(v.replace(/\D/g, ''));
const isValidName = v => v.trim().length >= 3;

function passwordStrength(p) {
  if (!p) return { score: 0, label: '', color: '#e5e7eb', width: '0%' };
  let score = 0;
  if (p.length >= 6) score++;
  if (p.length >= 10) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  const map = [
    { label: 'Too short', color: '#ef4444', width: '10%' },
    { label: 'Weak', color: '#f97316', width: '25%' },
    { label: 'Fair', color: '#eab308', width: '45%' },
    { label: 'Good', color: '#84cc16', width: '65%' },
    { label: 'Strong', color: '#22c55e', width: '82%' },
    { label: 'Very Strong', color: '#16a34a', width: '100%' },
  ];
  return { score, ...map[score] };
}

// ── OTP Input component — 6 boxes ───────────────────────────────
const OTPInput = ({ value, onChange, disabled }) => {
  const inputs = useRef([]);
  const digits = (value || '').split('').concat(Array(6).fill('')).slice(0, 6);

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      const next = digits.map((d, idx) => idx === i ? '' : d);
      onChange(next.join(''));
      if (i > 0) setTimeout(() => inputs.current[i - 1]?.focus(), 0);
    }
  };

  const handleChange = (i, v) => {
    const char = v.replace(/\D/g, '').slice(-1);
    const next = digits.map((d, idx) => idx === i ? char : d);
    onChange(next.join(''));
    if (char && i < 5) setTimeout(() => inputs.current[i + 1]?.focus(), 0);
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted.padEnd(6, '').slice(0, 6));
    e.preventDefault();
    setTimeout(() => inputs.current[Math.min(pasted.length, 5)]?.focus(), 0);
  };

  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '1rem 0' }}>
      {digits.map((d, i) => (
        <input key={i}
          ref={el => inputs.current[i] = el}
          type="text" inputMode="numeric" maxLength={1}
          value={d} disabled={disabled}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          style={{
            width: 44, height: 52, textAlign: 'center', fontSize: '1.4rem', fontWeight: 700,
            border: `2px solid ${d ? '#52b788' : '#e5e7eb'}`,
            borderRadius: 10, outline: 'none', background: d ? '#f0fdf4' : '#fff',
            color: '#1a3a2a', transition: 'all 0.15s',
            boxShadow: d ? '0 0 0 3px rgba(82,183,136,0.15)' : 'none',
          }}
        />
      ))}
    </div>
  );
};

// ── FormField ───────────────────────────────────────────────────
const FormField = ({ field, label, type = 'text', placeholder, opts, hint, required, value, error, valid, onChange, onBlur, children }) => (
  <div className="form-group">
    <label className="form-label">{label}{required && ' *'}</label>
    <div style={{ position: 'relative' }}>
      {opts ? (
        <select className={`form-select ${error ? 'error' : ''}`} value={value}
          onChange={e => onChange(field, e.target.value)} onBlur={() => onBlur && onBlur(field, value)}>
          <option value="">Select {label}</option>
          {opts.map(o => (
            <option key={typeof o === 'object' ? o.value : o} value={typeof o === 'object' ? o.value : o}>
              {typeof o === 'object' ? o.label : o}
            </option>
          ))}
        </select>
      ) : (
        <input className={`form-input ${error ? 'error' : ''}`} type={type} placeholder={placeholder}
          value={value} autoComplete="off"
          onChange={e => onChange(field, e.target.value)}
          onBlur={() => onBlur && onBlur(field, value)}
          style={{ borderColor: error ? '#ef4444' : valid ? '#22c55e' : undefined, paddingRight: children ? undefined : (error || valid) ? 38 : undefined }}
        />
      )}
      {!children && !opts && (error || valid) && (
        <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem' }}>
          {error ? '❌' : '✅'}
        </span>
      )}
      {children}
    </div>
    {hint && !error && <div className="form-hint">{hint}</div>}
    {error && <div className="form-error" style={{ display: 'flex', gap: 4, alignItems: 'center' }}><span>⚠️</span>{error}</div>}
    {!error && valid && <div style={{ fontSize: '0.75rem', color: '#22c55e', marginTop: 4, display: 'flex', gap: 4 }}><span>✅</span>{valid}</div>}
  </div>
);

// ── Countdown timer ──────────────────────────────────────────────
const useCountdown = () => {
  const [secs, setSecs] = useState(0);
  const startCountdown = (s = 60) => {
    setSecs(s);
    const id = setInterval(() => setSecs(p => { if (p <= 1) { clearInterval(id); return 0; } return p - 1; }), 1000);
  };
  return { secs, startCountdown, canResend: secs === 0 };
};

// ── Main RegisterPage ───────────────────────────────────────────
const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [role, setRole] = useState('farmer');
  const [step, setStep] = useState('form'); // 'form' | 'otp-email' | 'done'
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm: '',
    phone: '', state: '', district: '', village: '',
    farmSize: '', businessName: '', gstNumber: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  // OTP state
  const [emailOtp, setEmailOtp] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');

  const emailTimer = useCountdown();
  const strength = passwordStrength(form.password);

  const update = (field, val) => {
    setForm(p => {
      const next = { ...p, [field]: val };
      // Reset district when state changes
      if (field === 'state' && val !== p.state) next.district = '';
      return next;
    });
    setErrors(p => ({ ...p, [field]: '' }));
  };

  const validateField = (field, value) => {
    const e = { ...errors };
    switch (field) {
      case 'name': (!isValidName(value)) ? e.name = 'Full name must be at least 3 characters' : delete e.name; break;
      case 'email': (!value.trim()) ? e.email = 'Email is required'
        : (!isValidEmail(value)) ? e.email = 'Enter a valid email (e.g. name@example.com)' : delete e.email; break;
      case 'phone': (!value.trim()) ? e.phone = 'Mobile number is required'
        : (!isValidPhone(value)) ? e.phone = 'Enter a valid 10-digit Indian mobile number' : delete e.phone; break;
      case 'password': (value.length < 6) ? e.password = 'Password must be at least 6 characters' : delete e.password; break;
      case 'confirm': (value !== form.password) ? e.confirm = 'Passwords do not match' : delete e.confirm; break;
      case 'state': (!value) ? e.state = 'Please select your state' : delete e.state; break;
      default: break;
    }
    setErrors(e);
  };

  const handleBlur = (field, value) => {
    setTouched(p => ({ ...p, [field]: true }));
    validateField(field, value);
  };

  // Full form validation before OTP step
  const validateAll = () => {
    const e = {};
    if (!isValidName(form.name)) e.name = 'Full name must be at least 3 characters';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!isValidEmail(form.email)) e.email = 'Enter a valid email address';
    if (!form.phone.trim()) e.phone = 'Mobile number is required';
    else if (!isValidPhone(form.phone)) e.phone = 'Enter a valid 10-digit Indian mobile number';
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    if (!form.state) e.state = 'Please select your state';
    setErrors(e);
    setTouched({ name: true, email: true, phone: true, password: true, confirm: true, state: true });
    return Object.keys(e).length === 0;
  };

  // ── Step 1: Validate form → send email OTP ──────────────────
  const handleFormNext = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validateAll()) return;
    await sendEmailOTP();
  };

  // ── Send Email OTP ──────────────────────────────────────────
  const sendEmailOTP = async () => {
    setOtpLoading(true); setOtpError(''); setOtpSuccess('');
    try {
      const res = await fetch(`${BASE}/otp/send-email`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setStep('otp-email');
      emailTimer.startCountdown(60);
      setOtpSuccess('OTP sent! Check the backend console for the code.');
    } catch (err) {
      setOtpError(err.message || 'Failed to send email OTP');
    } finally { setOtpLoading(false); }
  };

  // ── Verify Email OTP → Register ────────────────────────────
  const verifyEmailOTP = async () => {
    if (emailOtp.length !== 6) { setOtpError('Enter the 6-digit OTP'); return; }
    setOtpLoading(true); setOtpError(''); setOtpSuccess('');
    try {
      const res = await fetch(`${BASE}/otp/verify`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'email', value: form.email, otp: emailOtp }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setEmailVerified(true);
      setOtpSuccess('✅ Email verified! Creating your account…');
      setEmailOtp('');
      setTimeout(() => submitRegistration(), 600);
    } catch (err) {
      setOtpError(err.message || 'Invalid OTP');
    } finally { setOtpLoading(false); }
  };

  // ── Final registration ──────────────────────────────────────
  const submitRegistration = async () => {
    setLoading(true); setApiError('');
    const payload = {
      name: form.name, email: form.email, password: form.password,
      role, phone: form.phone,
      address: { village: form.village, district: form.district, state: form.state },
    };
    if (role === 'farmer') payload.farmDetails = { farmSize: Number(form.farmSize) };
    if (role === 'buyer') payload.businessDetails = { businessName: form.businessName, gstNumber: form.gstNumber };
    try {
      const user = await register(payload);
      navigate(REDIRECT[user.role] || '/');
    } catch (err) {
      setApiError(err.message || 'Registration failed. Please try again.');
      setStep('form');
    } finally { setLoading(false); }
  };

  // ── Progress indicator ──────────────────────────────────────
  const STEPS = ['Details', 'Verify Email', 'Done'];
  const stepIdx = step === 'form' ? 0 : step === 'otp-email' ? 1 : 2;

  const stepProgress = (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700,
              background: i < stepIdx ? '#52b788' : i === stepIdx ? 'var(--green-deep)' : '#e5e7eb',
              color: i <= stepIdx ? '#fff' : '#9ca3af'
            }}>
              {i < stepIdx ? '✓' : i + 1}
            </div>
            <div style={{ fontSize: '0.6rem', marginTop: 3, color: i <= stepIdx ? 'var(--green-deep)' : '#9ca3af', fontWeight: i === stepIdx ? 700 : 400, textAlign: 'center' }}>{s}</div>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{ flex: 1, height: 2, background: i < stepIdx ? '#52b788' : '#e5e7eb', marginBottom: 14 }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );


  // ──────────────────────────────────────────────────────────
  return (
    <div className="auth-shell">

      {/* Left Panel */}
      <div className="auth-left">
        <div style={{ maxWidth: 440 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '2.5rem' }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#52b788,#f4a261)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>🌾</div>
            <span style={{ fontFamily: 'Playfair Display,serif', fontSize: '2.2rem', fontWeight: 700, color: '#52b788' }}>
              Agro<span style={{ color: '#f4a261' }}>AI</span>
            </span>
          </div>
          <h2 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.9rem', fontWeight: 700, lineHeight: 1.3, marginBottom: '1rem', color: '#fff' }}>
            Join India's Largest Agriculture Marketplace
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, marginBottom: '2rem', fontSize: '0.95rem' }}>
            Verified accounts get AI-powered price predictions, direct marketplace access, and secure escrow payments.
          </p>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: '0.75rem' }}>
              What you get
            </div>
            {[
              ['🤖', 'AI price predictions', 'Know the best time and price to sell or buy'],
              ['🌾', 'Direct marketplace', 'No middlemen — farmers and buyers connect directly'],
              ['🔒', 'Secure escrow payments', 'Money held safely until delivery is confirmed'],
              ['📊', 'Market analytics', 'Real-time price trends and regional demand data'],
            ].map(([icon, title, desc]) => (
              <div key={title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: '0.9rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(82,183,136,0.15)', border: '1px solid rgba(82,183,136,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>{icon}</div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.88rem' }}>{title}</div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', marginTop: 2 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.25rem', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[['48K+', 'Farmers'], ['8K+', 'Buyers'], ['94%', 'AI Accuracy']].map(([v, l]) => (
              <div key={l}>
                <div style={{ color: '#52b788', fontWeight: 800, fontSize: '1.2rem' }}>{v}</div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="auth-right" style={{ alignItems: 'flex-start', paddingTop: '2rem' }}>
        <div className="auth-box animate-fadeUp" style={{ width: '100%', maxWidth: 430 }}>

          {/* ── OTP screen (inline to prevent remount/focus loss) ── */}
          {step === 'otp-email' && (
            <div style={{ textAlign: 'center' }}>
              {stepProgress}
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📧</div>
              <div style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.3rem', fontWeight: 700, color: 'var(--gray-800)', marginBottom: 6 }}>
                Verify your Email Address
              </div>
              <p style={{ color: 'var(--gray-500)', fontSize: '0.85rem', marginBottom: 4 }}>
                A 6-digit OTP has been sent to
              </p>
              <div style={{ fontWeight: 700, color: 'var(--green-deep)', fontSize: '0.95rem', marginBottom: '0.25rem' }}>{form.email}</div>

              {otpSuccess && (
                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '8px 12px', marginBottom: '0.75rem', fontSize: '0.82rem', color: '#166534' }}>
                  {otpSuccess}
                </div>
              )}
              {otpError && (
                <div className="alert alert-red" style={{ marginBottom: '0.75rem', textAlign: 'left' }}>
                  <span className="alert-icon">⚠️</span>
                  <div style={{ fontSize: '0.82rem' }}>{otpError}</div>
                </div>
              )}

              <OTPInput value={emailOtp} onChange={setEmailOtp} disabled={otpLoading} />

              <button className="btn btn-primary btn-full" onClick={verifyEmailOTP}
                disabled={otpLoading || emailOtp.length !== 6}
                style={{ padding: '13px', fontSize: '0.95rem', marginBottom: '1rem' }}>
                {otpLoading ? '⏳ Verifying…' : 'Verify Email →'}
              </button>

              <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                Didn't receive it?{' '}
                {emailTimer.canResend ? (
                  <span style={{ color: 'var(--green-mid)', fontWeight: 700, cursor: 'pointer' }} onClick={sendEmailOTP}>
                    Resend OTP
                  </span>
                ) : (
                  <span style={{ color: 'var(--gray-400)' }}>Resend in {emailTimer.secs}s</span>
                )}
              </div>

              <button style={{ marginTop: '1rem', background: 'none', border: 'none', color: 'var(--gray-400)', fontSize: '0.78rem', cursor: 'pointer' }}
                onClick={() => { setStep('form'); setOtpError(''); setOtpSuccess(''); }}>
                ← Edit email
              </button>
            </div>
          )}

          {/* ── Registration form ── */}
          {step === 'form' && (
            <>
              <div className="auth-title">Create Account</div>
              <div className="auth-sub">Fill in your details — Email verification required</div>

              {/* Step progress */}
              {stepProgress}

              {/* Role tabs */}
              <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem', background: 'var(--gray-100)', padding: 4, borderRadius: 10 }}>
                {ROLES.map(r => (
                  <button key={r.id} type="button" onClick={() => setRole(r.id)}
                    style={{
                      flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem', transition: 'all 0.2s',
                      background: role === r.id ? '#fff' : 'transparent',
                      color: role === r.id ? 'var(--green-deep)' : 'var(--gray-500)',
                      boxShadow: role === r.id ? '0 1px 6px rgba(0,0,0,0.1)' : 'none'
                    }}>
                    {r.label}
                  </button>
                ))}
              </div>

              {apiError && (
                <div className="alert alert-red" style={{ marginBottom: '1rem' }}>
                  <span className="alert-icon">❌</span>
                  <div style={{ fontSize: '0.85rem' }}>{apiError}</div>
                </div>
              )}

              <form onSubmit={handleFormNext} noValidate>

                {/* Name */}
                <FormField field="name" label="Full Name" required placeholder="e.g. Ramesh Kumar (min. 3 chars)"
                  value={form.name} error={errors.name && touched.name ? errors.name : ''}
                  valid={!errors.name && touched.name && form.name ? 'Looks good!' : ''}
                  onChange={update} onBlur={handleBlur} />

                {/* Email */}
                <FormField field="email" label="Email Address" required type="email" placeholder="e.g. ramesh@example.com"
                  value={form.email} error={errors.email && touched.email ? errors.email : ''}
                  valid={!errors.email && touched.email && form.email ? 'Valid email' : ''}
                  onChange={update} onBlur={handleBlur} />

                {/* Phone */}
                <FormField field="phone" label="Mobile Number (10 digits)" required placeholder="e.g. 9876543210"
                  value={form.phone} error={errors.phone && touched.phone ? errors.phone : ''}
                  valid={!errors.phone && touched.phone && form.phone ? 'Valid number' : ''}
                  onChange={update} onBlur={handleBlur} />

                <div className="form-row">
                  <FormField field="state" label="State" required opts={STATES}
                    value={form.state} error={errors.state && touched.state ? errors.state : ''}
                    onChange={update} onBlur={handleBlur} />
                  <FormField field="district" label="District" required={false}
                    opts={getAllDistrictsForState(form.state).length > 0 ? getAllDistrictsForState(form.state) : undefined}
                    placeholder={form.state ? 'Select District' : 'Select state first'}
                    value={form.district} error={''} onChange={update} />
                </div>

                <FormField field="village" label="Village / Town" placeholder="Village or town name"
                  value={form.village} error={''} onChange={update} />

                {role === 'farmer' && (
                  <FormField field="farmSize" label="Farm Size (acres)" type="number" placeholder="e.g. 5.5"
                    value={form.farmSize} error={''} onChange={update} />
                )}

                {role === 'buyer' && (
                  <>
                    <FormField field="businessName" label="Business / Company Name" placeholder="e.g. FreshMart India Pvt Ltd"
                      value={form.businessName} error={''} onChange={update} />
                    <FormField field="gstNumber" label="GST Number (optional)" placeholder="e.g. 07AABCU9603R1ZX"
                      value={form.gstNumber} error={''} onChange={update} />
                  </>
                )}

                {/* Password */}
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input className={`form-input ${errors.password && touched.password ? 'error' : ''}`}
                      type={showPass ? 'text' : 'password'}
                      placeholder="Min. 6 characters"
                      value={form.password} autoComplete="new-password"
                      onChange={e => { update('password', e.target.value); if (touched.password) validateField('password', e.target.value); }}
                      onBlur={() => handleBlur('password', form.password)}
                      style={{ borderColor: errors.password && touched.password ? '#ef4444' : undefined, paddingRight: 40 }}
                    />
                    <button type="button" onClick={() => setShowPass(p => !p)}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--gray-400)', padding: 4 }}>
                      {showPass ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {form.password && (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ display: 'flex', gap: 3, marginBottom: 3 }}>
                        {[1, 2, 3, 4, 5].map(i => (
                          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength.score ? strength.color : '#e5e7eb', transition: 'all 0.3s' }} />
                        ))}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: strength.color, fontWeight: 600 }}>{strength.label}</div>
                    </div>
                  )}
                  {errors.password && touched.password && (
                    <div className="form-error" style={{ display: 'flex', gap: 4 }}><span>⚠️</span>{errors.password}</div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="form-group">
                  <label className="form-label">Confirm Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input className={`form-input ${errors.confirm && touched.confirm ? 'error' : ''}`}
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Repeat password"
                      value={form.confirm} autoComplete="new-password"
                      onChange={e => { update('confirm', e.target.value); if (touched.confirm) validateField('confirm', e.target.value); }}
                      onBlur={() => handleBlur('confirm', form.confirm)}
                      style={{ borderColor: errors.confirm && touched.confirm ? '#ef4444' : !errors.confirm && touched.confirm && form.confirm ? '#22c55e' : undefined, paddingRight: 72 }}
                    />
                    <button type="button" onClick={() => setShowConfirm(p => !p)}
                      style={{ position: 'absolute', right: touched.confirm && form.confirm ? 36 : 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--gray-400)', padding: 4 }}>
                      {showConfirm ? '🙈' : '👁️'}
                    </button>
                    {touched.confirm && form.confirm && (
                      <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem' }}>
                        {errors.confirm ? '❌' : '✅'}
                      </span>
                    )}
                  </div>
                  {errors.confirm && touched.confirm && (
                    <div className="form-error" style={{ display: 'flex', gap: 4 }}><span>⚠️</span>{errors.confirm}</div>
                  )}
                  {!errors.confirm && touched.confirm && form.confirm && (
                    <div style={{ fontSize: '0.75rem', color: '#22c55e', marginTop: 4, display: 'flex', gap: 4 }}><span>✅</span>Passwords match</div>
                  )}
                </div>

                {/* Terms */}
                <div style={{ display: 'flex', gap: 8, marginBottom: '1.25rem', alignItems: 'flex-start' }}>
                  <input type="checkbox" required style={{ width: 'auto', marginTop: 3 }} />
                  <span style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>
                    I agree to the{' '}
                    <span style={{ color: 'var(--green-mid)', fontWeight: 600, cursor: 'pointer' }}>Terms of Service</span>
                    {' '}and{' '}
                    <span style={{ color: 'var(--green-mid)', fontWeight: 600, cursor: 'pointer' }}>Privacy Policy</span>
                  </span>
                </div>

                <button type="submit" className="btn btn-primary btn-full"
                  style={{ padding: '13px', fontSize: '0.95rem' }}
                  disabled={loading || otpLoading}>
                  {otpLoading ? '⏳ Sending OTP…' : 'Continue — Verify Email →'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: 'var(--green-mid)', fontWeight: 700 }}>Sign in →</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;