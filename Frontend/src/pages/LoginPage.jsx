import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const QUICK_FILL = {
  farmer: { email: "farmer@agroai.com", password: "farmer123" },
  buyer: { email: "buyer@agroai.com", password: "buyer123" },
  admin: { email: "admin@agroai.com", password: "admin123" },
};
const ROLE_MAP = { farmer: "/farmer", buyer: "/buyer", admin: "/admin" };

const isValidEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const isStrongPassword = v => v.length >= 6;

function passwordStrength(p) {
  if (!p) return { score: 0, label: "", color: "#e5e7eb" };
  let score = 0;
  if (p.length >= 6) score++;
  if (p.length >= 10) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  const map = [
    { label: "Too short", color: "#ef4444" },
    { label: "Weak", color: "#f97316" },
    { label: "Fair", color: "#eab308" },
    { label: "Good", color: "#84cc16" },
    { label: "Strong", color: "#22c55e" },
    { label: "Very Strong", color: "#16a34a" },
  ];
  return { score, ...map[score] };
}

// ── 6-box OTP Input ────────────────────────────────────────────
function OTPInput({ value, onChange, disabled }) {
  const inputs = useRef([]);
  const digits = (value || "").split("").concat(Array(6).fill("")).slice(0, 6);

  const handleChange = (i, v) => {
    const char = v.replace(/\D/g, "").slice(-1);
    const next = digits.map((d, idx) => (idx === i ? char : d));
    onChange(next.join(""));
    if (char && i < 5) setTimeout(() => inputs.current[i + 1]?.focus(), 0);
  };

  const handleKey = (i, e) => {
    if (e.key === "Backspace") {
      const next = digits.map((d, idx) => (idx === i ? "" : d));
      onChange(next.join(""));
      if (i > 0) setTimeout(() => inputs.current[i - 1]?.focus(), 0);
    }
  };

  const handlePaste = e => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted.padEnd(6, "").slice(0, 6));
    e.preventDefault();
    setTimeout(() => inputs.current[Math.min(pasted.length, 5)]?.focus(), 0);
  };

  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center", margin: "1.25rem 0" }}>
      {digits.map((d, i) => (
        <input key={i} ref={el => (inputs.current[i] = el)}
          type="text" inputMode="numeric" maxLength={1}
          value={d} disabled={disabled}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          style={{
            width: 46, height: 54, textAlign: "center", fontSize: "1.5rem", fontWeight: 700,
            border: `2px solid ${d ? "#52b788" : "#e5e7eb"}`,
            borderRadius: 10, outline: "none",
            background: d ? "#f0fdf4" : "#fff",
            color: "#1a3a2a", transition: "all 0.15s",
            boxShadow: d ? "0 0 0 3px rgba(82,183,136,0.15)" : "none",
          }}
        />
      ))}
    </div>
  );
}

// ── Countdown hook ─────────────────────────────────────────────
function useCountdown() {
  const [secs, setSecs] = useState(0);
  const startCountdown = (s = 60) => {
    setSecs(s);
    const id = setInterval(() => setSecs(p => { if (p <= 1) { clearInterval(id); return 0; } return p - 1; }), 1000);
  };
  return { secs, startCountdown, canResend: secs === 0 };
}

// ══════════════════════════════════════════════════════════════
export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Which screen is showing: 'login' | 'fp-email' | 'fp-otp' | 'fp-reset' | 'fp-done'
  const [screen, setScreen] = useState("login");

  // ── Login state ────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const strength = passwordStrength(password);

  // ── Forgot password state ──────────────────────────────────
  const [fpEmail, setFpEmail] = useState("");
  const [fpEmailError, setFpEmailError] = useState("");
  const [fpOtp, setFpOtp] = useState("");
  const [fpOtpError, setFpOtpError] = useState("");
  const [fpNewPass, setFpNewPass] = useState("");
  const [fpConfirm, setFpConfirm] = useState("");
  const [fpPassError, setFpPassError] = useState("");
  const [fpShowNew, setFpShowNew] = useState(false);
  const [fpShowConf, setFpShowConf] = useState(false);
  const [fpLoading, setFpLoading] = useState(false);
  const [fpSuccess, setFpSuccess] = useState("");
  const [countdown, setCountdown] = useState(3);
  const timer = useCountdown();
  const newStrength = passwordStrength(fpNewPass);

  // Countdown before redirect after reset
  useEffect(() => {
    if (screen !== "fp-done") return;
    setCountdown(3);
    const id = setInterval(() => {
      setCountdown(p => {
        if (p <= 1) { clearInterval(id); navigate("/login", { replace: true }); setScreen("login"); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [screen]);

  // ── Login helpers ──────────────────────────────────────────
  const fillQuick = role => {
    setEmail(QUICK_FILL[role].email);
    setPassword(QUICK_FILL[role].password);
    setErrors({}); setTouched({}); setApiError("");
  };

  const validateField = (name, value) => {
    const e = { ...errors };
    if (name === "email") {
      if (!value.trim()) e.email = "Email is required";
      else if (!isValidEmail(value)) e.email = "Enter a valid email (e.g. name@example.com)";
      else delete e.email;
    }
    if (name === "password") {
      if (!value) e.password = "Password is required";
      else if (!isStrongPassword(value)) e.password = "Password must be at least 6 characters";
      else delete e.password;
    }
    setErrors(e);
  };

  const handleBlur = (name, value) => {
    setTouched(p => ({ ...p, [name]: true }));
    validateField(name, value);
  };

  const handleLogin = async e => {
    e.preventDefault();
    setApiError("");
    setTouched({ email: true, password: true });
    const errs = {};
    if (!email.trim()) errs.email = "Email is required";
    else if (!isValidEmail(email)) errs.email = "Enter a valid email address";
    if (!password) errs.password = "Password is required";
    else if (password.length < 6) errs.password = "Password must be at least 6 characters";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      navigate(ROLE_MAP[user.role] || "/farmer", { replace: true });
    } catch (err) {
      const attempts = loginAttempts + 1;
      setLoginAttempts(attempts);
      setApiError(attempts >= 3
        ? `Invalid credentials. ${Math.max(0, 6 - attempts)} attempt(s) remaining.`
        : err.message || "Invalid email or password.");
    } finally { setLoading(false); }
  };

  const inputBorder = field => ({
    borderColor: errors[field] && touched[field] ? "#ef4444"
      : !errors[field] && touched[field] && (field === "email" ? email : password) ? "#22c55e"
        : undefined,
  });

  // ── Forgot password step 1: Send OTP to email ─────────────
  const handleFpSendOTP = async () => {
    setFpEmailError("");
    if (!fpEmail.trim()) { setFpEmailError("Email is required"); return; }
    if (!isValidEmail(fpEmail)) { setFpEmailError("Enter a valid email address"); return; }
    setFpLoading(true);
    try {
      const res = await fetch(`${BASE}/otp/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fpEmail.trim() }),
      });
      const data = await res.json();
      if (!data.success) { setFpEmailError(data.message || "Email not found"); return; }
      timer.startCountdown(60);
      setScreen("fp-otp");
    } catch (err) {
      setFpEmailError("Server error. Make sure backend is running.");
    } finally { setFpLoading(false); }
  };

  // ── Forgot password step 2: Verify OTP ────────────────────
  const handleFpVerifyOTP = async () => {
    setFpOtpError("");
    if (fpOtp.length !== 6) { setFpOtpError("Enter the 6-digit OTP"); return; }
    setFpLoading(true);
    try {
      const res = await fetch(`${BASE}/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "email", value: fpEmail.trim(), otp: fpOtp }),
      });
      const data = await res.json();
      if (!data.success) { setFpOtpError(data.message || "Invalid OTP"); return; }
      setFpOtp("");
      setScreen("fp-reset");
    } catch (err) {
      setFpOtpError("Server error. Please try again.");
    } finally { setFpLoading(false); }
  };

  // ── Forgot password step 3: Reset password ────────────────
  const handleFpReset = async () => {
    setFpPassError("");
    if (fpNewPass.length < 6) { setFpPassError("Password must be at least 6 characters"); return; }
    if (fpNewPass !== fpConfirm) { setFpPassError("Passwords do not match"); return; }
    setFpLoading(true);
    try {
      const res = await fetch(`${BASE}/otp/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fpEmail.trim(), newPassword: fpNewPass }),
      });
      const data = await res.json();
      if (!data.success) { setFpPassError(data.message || "Reset failed"); return; }
      setFpSuccess("Password reset successfully!");
      setScreen("fp-done");
    } catch (err) {
      setFpPassError("Server error. Please try again.");
    } finally { setFpLoading(false); }
  };

  // ── Resend OTP ─────────────────────────────────────────────
  const handleResendOTP = async () => {
    setFpOtpError(""); setFpOtp("");
    setFpLoading(true);
    try {
      await fetch(`${BASE}/otp/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fpEmail.trim() }),
      });
      timer.startCountdown(60);
    } catch { } finally { setFpLoading(false); }
  };

  // ══════════════════════════════════════════════════════════
  // LEFT PANEL (same for all screens)
  // ══════════════════════════════════════════════════════════
  const LeftPanel = () => (
    <div className="auth-left">
      <div style={{ maxWidth: 440 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "2.5rem" }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg,#52b788,#f4a261)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem" }}>🌾</div>
          <span style={{ fontFamily: "Playfair Display,serif", fontSize: "2.2rem", fontWeight: 700, color: "#52b788" }}>
            Agro<span style={{ color: "#f4a261" }}>AI</span>
          </span>
        </div>
        <h2 style={{ fontFamily: "Playfair Display,serif", fontSize: "1.9rem", fontWeight: 700, lineHeight: 1.3, marginBottom: "1rem", color: "#fff" }}>
          India's Intelligent Agriculture Marketplace
        </h2>
        <p style={{ color: "rgba(255,255,255,0.65)", lineHeight: 1.8, marginBottom: "2rem", fontSize: "0.95rem" }}>
          AI-powered price predictions, direct farm-to-buyer trading, and real-time market analytics.
        </p>
        <div style={{ background: "rgba(82,183,136,0.12)", border: "1px solid rgba(82,183,136,0.25)", borderRadius: 12, padding: "1rem", marginBottom: "2rem", display: "flex", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: "linear-gradient(135deg,#52b788,#2d6a4f)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", flexShrink: 0 }}>📈</div>
          <div>
            <div style={{ color: "#fff", fontWeight: 600, fontSize: "0.88rem", marginBottom: 3 }}>Wheat prices predicted ↑12% next week</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem" }}>Login to see full AI market analysis for your region</div>
          </div>
        </div>
        {["48,000+ verified farmers across India", "8,000+ registered buyers", "94% AI prediction accuracy", "Secure escrow payments"].map(t => (
          <div key={t} style={{ color: "rgba(255,255,255,0.72)", fontSize: "0.88rem", marginBottom: 10, display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ color: "#52b788" }}>✓</span> {t}
          </div>
        ))}
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════
  // SCREEN: FORGOT PASSWORD — Step 1 (Enter Email)
  // ══════════════════════════════════════════════════════════
  if (screen === "fp-email") return (
    <div className="auth-shell">
      <LeftPanel />
      <div className="auth-right">
        <div className="auth-box animate-fadeUp" style={{ width: "100%", maxWidth: 400 }}>

          {/* Back button */}
          <button onClick={() => setScreen("login")}
            style={{ background: "none", border: "none", color: "var(--green-mid)", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem", padding: 0, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: 6 }}>
            ← Back to Sign In
          </button>

          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>🔐</div>
            <div className="auth-title" style={{ fontSize: "1.4rem" }}>Forgot Password?</div>
            <div className="auth-sub">Enter your registered email — we'll send you a 6-digit OTP to reset your password.</div>
          </div>

          {fpEmailError && (
            <div className="alert alert-red" style={{ marginBottom: "1rem" }}>
              <span className="alert-icon">⚠️</span>
              <div style={{ fontSize: "0.85rem" }}>{fpEmailError}</div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Registered Email Address *</label>
            <div style={{ position: "relative" }}>
              <input className="form-input" type="email"
                placeholder="Enter your registered email"
                value={fpEmail}
                onChange={e => { setFpEmail(e.target.value); setFpEmailError(""); }}
                onKeyDown={e => e.key === "Enter" && handleFpSendOTP()}
                autoFocus
                style={{ borderColor: fpEmailError ? "#ef4444" : undefined }}
              />
            </div>
          </div>

          <button className="btn btn-primary btn-full"
            style={{ padding: "13px", fontSize: "0.95rem" }}
            onClick={handleFpSendOTP}
            disabled={fpLoading}>
            {fpLoading ? "⏳ Sending OTP…" : "Send OTP →"}
          </button>

          <div style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.78rem", color: "var(--gray-400)" }}>
            💡 OTP will be sent to your email inbox
          </div>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════
  // SCREEN: FORGOT PASSWORD — Step 2 (Verify OTP)
  // ══════════════════════════════════════════════════════════
  if (screen === "fp-otp") return (
    <div className="auth-shell">
      <LeftPanel />
      <div className="auth-right">
        <div className="auth-box animate-fadeUp" style={{ width: "100%", maxWidth: 400 }}>

          <button onClick={() => setScreen("fp-email")}
            style={{ background: "none", border: "none", color: "var(--green-mid)", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem", padding: 0, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: 6 }}>
            ← Change Email
          </button>

          {/* Step bar */}
          <div style={{ display: "flex", alignItems: "center", marginBottom: "1.5rem" }}>
            {["Enter Email", "Verify OTP", "New Password"].map((s, i) => (
              <React.Fragment key={s}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700,
                    background: i < 1 ? "#52b788" : i === 1 ? "var(--green-deep)" : "#e5e7eb",
                    color: i <= 1 ? "#fff" : "#9ca3af"
                  }}>
                    {i < 1 ? "✓" : i + 1}
                  </div>
                  <div style={{ fontSize: "0.6rem", marginTop: 3, color: i <= 1 ? "var(--green-deep)" : "#9ca3af", fontWeight: i === 1 ? 700 : 400 }}>{s}</div>
                </div>
                {i < 2 && <div style={{ flex: 1, height: 2, background: i < 1 ? "#52b788" : "#e5e7eb", marginBottom: 14 }} />}
              </React.Fragment>
            ))}
          </div>

          <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📧</div>
            <div className="auth-title" style={{ fontSize: "1.3rem" }}>Enter OTP</div>
            <p style={{ color: "var(--gray-500)", fontSize: "0.85rem", margin: "4px 0 0" }}>
              OTP sent to <strong style={{ color: "var(--green-deep)" }}>{fpEmail}</strong>
            </p>
          </div>

          {/* Console hint */}
          <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 8, padding: "8px 12px", margin: "0.75rem 0", fontSize: "0.75rem", color: "#92400e", display: "flex", gap: 6, alignItems: "center" }}>
            <span>💡</span>
            <span>Check your <strong>email inbox</strong></span>
          </div>

          {fpOtpError && (
            <div className="alert alert-red" style={{ marginBottom: "0.75rem" }}>
              <span className="alert-icon">⚠️</span>
              <div style={{ fontSize: "0.82rem" }}>{fpOtpError}</div>
            </div>
          )}

          <OTPInput value={fpOtp} onChange={setFpOtp} disabled={fpLoading} />

          <button className="btn btn-primary btn-full"
            style={{ padding: "13px", fontSize: "0.95rem", marginBottom: "1rem" }}
            onClick={handleFpVerifyOTP}
            disabled={fpLoading || fpOtp.length !== 6}>
            {fpLoading ? "⏳ Verifying…" : "Verify OTP →"}
          </button>

          <div style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--gray-500)" }}>
            Didn't receive it?{" "}
            {timer.canResend ? (
              <span style={{ color: "var(--green-mid)", fontWeight: 700, cursor: "pointer" }} onClick={handleResendOTP}>
                Resend OTP
              </span>
            ) : (
              <span style={{ color: "var(--gray-400)" }}>Resend in {timer.secs}s</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════
  // SCREEN: FORGOT PASSWORD — Step 3 (New Password)
  // ══════════════════════════════════════════════════════════
  if (screen === "fp-reset") return (
    <div className="auth-shell">
      <LeftPanel />
      <div className="auth-right">
        <div className="auth-box animate-fadeUp" style={{ width: "100%", maxWidth: 400 }}>

          {/* Step bar */}
          <div style={{ display: "flex", alignItems: "center", marginBottom: "1.5rem" }}>
            {["Enter Email", "Verify OTP", "New Password"].map((s, i) => (
              <React.Fragment key={s}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700,
                    background: i < 2 ? "#52b788" : "var(--green-deep)",
                    color: "#fff"
                  }}>
                    {i < 2 ? "✓" : "3"}
                  </div>
                  <div style={{ fontSize: "0.6rem", marginTop: 3, color: "var(--green-deep)", fontWeight: i === 2 ? 700 : 400 }}>{s}</div>
                </div>
                {i < 2 && <div style={{ flex: 1, height: 2, background: "#52b788", marginBottom: 14 }} />}
              </React.Fragment>
            ))}
          </div>

          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🔒</div>
            <div className="auth-title" style={{ fontSize: "1.3rem" }}>Set New Password</div>
            <div className="auth-sub">Choose a strong password for your account</div>
          </div>

          {fpPassError && (
            <div className="alert alert-red" style={{ marginBottom: "1rem" }}>
              <span className="alert-icon">⚠️</span>
              <div style={{ fontSize: "0.85rem" }}>{fpPassError}</div>
            </div>
          )}

          {/* New Password */}
          <div className="form-group">
            <label className="form-label">New Password *</label>
            <div style={{ position: "relative" }}>
              <input className="form-input"
                type={fpShowNew ? "text" : "password"}
                placeholder="Min. 6 characters"
                value={fpNewPass}
                onChange={e => { setFpNewPass(e.target.value); setFpPassError(""); }}
                style={{ paddingRight: 40 }}
                autoFocus
              />
              <button type="button" onClick={() => setFpShowNew(p => !p)}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "1rem", color: "var(--gray-400)", padding: 4 }}>
                {fpShowNew ? "🙈" : "👁️"}
              </button>
            </div>
            {/* Strength bar */}
            {fpNewPass && (
              <div style={{ marginTop: 6 }}>
                <div style={{ display: "flex", gap: 3, marginBottom: 3 }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= newStrength.score ? newStrength.color : "#e5e7eb", transition: "all 0.3s" }} />
                  ))}
                </div>
                <div style={{ fontSize: "0.7rem", color: newStrength.color, fontWeight: 600 }}>{newStrength.label}</div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label">Confirm New Password *</label>
            <div style={{ position: "relative" }}>
              <input className="form-input"
                type={fpShowConf ? "text" : "password"}
                placeholder="Repeat new password"
                value={fpConfirm}
                onChange={e => { setFpConfirm(e.target.value); setFpPassError(""); }}
                onKeyDown={e => e.key === "Enter" && handleFpReset()}
                style={{
                  paddingRight: 72,
                  borderColor: fpConfirm
                    ? fpConfirm === fpNewPass ? "#22c55e" : "#ef4444"
                    : undefined
                }}
              />
              <button type="button" onClick={() => setFpShowConf(p => !p)}
                style={{ position: "absolute", right: fpConfirm ? 36 : 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "1rem", color: "var(--gray-400)", padding: 4 }}>
                {fpShowConf ? "🙈" : "👁️"}
              </button>
              {fpConfirm && (
                <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: "0.9rem" }}>
                  {fpConfirm === fpNewPass ? "✅" : "❌"}
                </span>
              )}
            </div>
            {fpConfirm && fpConfirm !== fpNewPass && (
              <div className="form-error" style={{ display: "flex", gap: 4 }}>
                <span>⚠️</span> Passwords do not match
              </div>
            )}
            {fpConfirm && fpConfirm === fpNewPass && (
              <div style={{ fontSize: "0.75rem", color: "#22c55e", marginTop: 4, display: "flex", gap: 4 }}>
                <span>✅</span> Passwords match
              </div>
            )}
          </div>

          <button className="btn btn-primary btn-full"
            style={{ padding: "13px", fontSize: "0.95rem" }}
            onClick={handleFpReset}
            disabled={fpLoading || fpNewPass.length < 6 || fpNewPass !== fpConfirm}>
            {fpLoading ? "⏳ Resetting…" : "Reset Password →"}
          </button>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════
  // SCREEN: FORGOT PASSWORD — Done (Success + Countdown)
  // ══════════════════════════════════════════════════════════
  if (screen === "fp-done") return (
    <div className="auth-shell">
      <LeftPanel />
      <div className="auth-right">
        <div className="auth-box animate-fadeUp" style={{ width: "100%", maxWidth: 400, textAlign: "center" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>✅</div>
          <div style={{ fontFamily: "Playfair Display,serif", fontSize: "1.5rem", fontWeight: 700, color: "var(--green-deep)", marginBottom: 8 }}>
            Password Reset!
          </div>
          <p style={{ color: "var(--gray-500)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
            Your password has been updated successfully. You can now sign in with your new password.
          </p>

          {/* Countdown ring */}
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg,#1a3a2a,#2d6a4f)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", flexDirection: "column" }}>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#52b788", lineHeight: 1 }}>{countdown}</div>
            <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.5)", marginTop: 2 }}>secs</div>
          </div>

          <p style={{ color: "var(--gray-400)", fontSize: "0.82rem", marginBottom: "1.5rem" }}>
            Redirecting to Sign In in <strong style={{ color: "var(--green-mid)" }}>{countdown}</strong> second{countdown !== 1 ? "s" : ""}…
          </p>

          <button className="btn btn-primary btn-full"
            style={{ padding: "12px" }}
            onClick={() => { setScreen("login"); navigate("/login", { replace: true }); }}>
            Sign In Now →
          </button>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════
  // SCREEN: LOGIN (default)
  // ══════════════════════════════════════════════════════════
  return (
    <div className="auth-shell">
      <LeftPanel />
      <div className="auth-right">
        <div className="auth-box animate-fadeUp" style={{ width: "100%", maxWidth: 400 }}>
          <div className="auth-title">Welcome Back</div>
          <div className="auth-sub">Sign in to access your dashboard</div>

          {/* Quick fill */}
          <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "var(--gray-50)", borderRadius: 10, border: "1px solid var(--gray-200)" }}>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--gray-500)", marginBottom: 10 }}>
              Demo Accounts
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { role: "farmer", icon: "🌾", label: "Farmer", bg: "#d8f3dc", color: "#1a3a2a", border: "#52b788" },
                { role: "buyer", icon: "🏢", label: "Buyer", bg: "#fff3e0", color: "#7c3a00", border: "#f4a261" },
                { role: "admin", icon: "⚙️", label: "Admin", bg: "#f3e8e0", color: "#4a2a10", border: "#a05c3b" },
              ].map(({ role, icon, label, bg, color, border }) => (
                <button key={role} type="button" onClick={() => fillQuick(role)}
                  style={{ flex: 1, padding: "9px 4px", borderRadius: 8, border: `1.5px solid ${border}55`, background: bg, cursor: "pointer", fontSize: "0.78rem", fontWeight: 700, color }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = border)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = border + "55")}>
                  {icon}<br />{label}
                </button>
              ))}
            </div>
          </div>

          {apiError && (
            <div className="alert alert-red" style={{ marginBottom: "1rem" }}>
              <span className="alert-icon">⚠️</span>
              <div style={{ fontSize: "0.85rem" }}>{apiError}</div>
            </div>
          )}

          <form onSubmit={handleLogin} noValidate>
            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <div style={{ position: "relative" }}>
                <input className="form-input" type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setApiError(""); if (touched.email) validateField("email", e.target.value); }}
                  onBlur={e => handleBlur("email", e.target.value)}
                  autoComplete="email"
                  style={{ ...inputBorder("email"), paddingRight: touched.email ? 38 : undefined }}
                />
                {touched.email && (
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: "1rem" }}>
                    {errors.email ? "❌" : "✅"}
                  </span>
                )}
              </div>
              {errors.email && touched.email && (
                <div className="form-error" style={{ display: "flex", gap: 4 }}><span>⚠️</span>{errors.email}</div>
              )}
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password *</label>
              <div style={{ position: "relative" }}>
                <input className="form-input"
                  type={showPass ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setApiError(""); if (touched.password) validateField("password", e.target.value); }}
                  onBlur={e => handleBlur("password", e.target.value)}
                  autoComplete="current-password"
                  style={{ ...inputBorder("password"), paddingRight: 72 }}
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  style={{ position: "absolute", right: touched.password ? 36 : 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "1rem", color: "var(--gray-400)", padding: 4 }}>
                  {showPass ? "🙈" : "👁️"}
                </button>
                {touched.password && (
                  <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: "1rem" }}>
                    {errors.password ? "❌" : "✅"}
                  </span>
                )}
              </div>
              {password && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ display: "flex", gap: 3, marginBottom: 3 }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength.score ? strength.color : "#e5e7eb", transition: "all 0.3s" }} />
                    ))}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: strength.color, fontWeight: 600 }}>{strength.label}</div>
                </div>
              )}
              {errors.password && touched.password && (
                <div className="form-error" style={{ display: "flex", gap: 4 }}><span>⚠️</span>{errors.password}</div>
              )}
            </div>

            {/* Forgot password link — NOW WORKS */}
            <div style={{ textAlign: "right", marginTop: -8, marginBottom: 14 }}>
              <span
                style={{ fontSize: "0.78rem", color: "var(--green-mid)", cursor: "pointer", fontWeight: 600, textDecoration: "underline" }}
                onClick={() => { setFpEmail(email); setFpEmailError(""); setScreen("fp-email"); }}>
                Forgot password?
              </span>
            </div>

            <button type="submit" className="btn btn-primary btn-full"
              style={{ padding: "13px", fontSize: "0.95rem" }}
              disabled={loading || loginAttempts >= 6}>
              {loading ? "⏳ Signing in…" : "Sign In →"}
            </button>

            {loginAttempts >= 2 && loginAttempts < 6 && (
              <div style={{ marginTop: 8, textAlign: "center", fontSize: "0.75rem", color: "#f97316" }}>
                ⚠️ {6 - loginAttempts} attempts remaining before lockout
              </div>
            )}
          </form>

          <div style={{ textAlign: "center", marginTop: "1.5rem", padding: "1rem", background: "var(--gray-50)", borderRadius: 8 }}>
            <span style={{ fontSize: "0.85rem", color: "var(--gray-500)" }}>
              New to AgroAI?{" "}
              <Link to="/register" style={{ color: "var(--green-mid)", fontWeight: 700 }}>Create a free account →</Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}