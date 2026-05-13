import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';

export default function PaymentSettingsPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [method, setMethod] = useState(user?.paymentDetails?.preferredMethod || 'upi');
  const [upiId, setUpiId]   = useState(user?.paymentDetails?.upiId || '');
  const [accNo, setAccNo]   = useState(user?.paymentDetails?.bankAccountNumber || '');
  const [ifsc, setIfsc]     = useState(user?.paymentDetails?.bankIfscCode || '');
  const [accName, setAccName] = useState(user?.paymentDetails?.bankAccountHolderName || '');

  const [saving, setSaving]     = useState(false);
  const [message, setMessage]   = useState('');
  const [msgType, setMsgType]   = useState('success');

  useEffect(() => {
    if (user?.paymentDetails) {
      setMethod(user.paymentDetails.preferredMethod || 'upi');
      setUpiId(user.paymentDetails.upiId || '');
      setAccNo(user.paymentDetails.bankAccountNumber || '');
      setIfsc(user.paymentDetails.bankIfscCode || '');
      setAccName(user.paymentDetails.bankAccountHolderName || '');
    }
  }, [user]);

  const isConfigured = user?.paymentDetails?.upiId || user?.paymentDetails?.bankAccountNumber;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    if (method === 'upi' && !upiId.includes('@')) {
      setMessage('Please enter a valid UPI ID (e.g. name@upi)');
      setMsgType('error');
      setSaving(false);
      return;
    }
    if (method === 'bank_transfer' && (!accNo || !ifsc || !accName)) {
      setMessage('Please fill all bank account fields');
      setMsgType('error');
      setSaving(false);
      return;
    }

    try {
      const payload = {
        paymentDetails: {
          preferredMethod: method,
          upiId: upiId.trim(),
          bankAccountNumber: accNo.trim(),
          bankIfscCode: ifsc.trim().toUpperCase(),
          bankAccountHolderName: accName.trim(),
        },
      };

      const res = await userAPI.updateProfile(payload);
      if (res.data.success) {
        updateUser(res.data.user);
        setMessage('Payment details saved successfully!');
        setMsgType('success');
      } else {
        throw new Error(res.data.message);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || err.message);
      setMsgType('error');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const isFarmer = user?.role === 'farmer';

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: 'var(--gray-50)', padding: '2rem' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <button onClick={() => navigate(isFarmer ? '/farmer' : '/buyer')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-500)', fontSize: '0.85rem', padding: 0, marginBottom: 8 }}>
            ← Back to Dashboard
          </button>
          <h1 style={{
            fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', fontWeight: 700,
            color: 'var(--gray-800)', marginBottom: 4,
          }}>
            💰 Payment Settings
          </h1>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>
            {isFarmer
              ? 'Set up your payment details to receive payouts when buyers confirm delivery.'
              : 'Configure your preferred payment method for receiving refunds.'}
          </p>
        </div>

        {/* Status banner */}
        {isConfigured ? (
          <div style={{
            background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #86efac',
            borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ fontSize: '1.5rem' }}>✅</div>
            <div>
              <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.9rem' }}>
                Payment details configured
              </div>
              <div style={{ fontSize: '0.8rem', color: '#15803d' }}>
                {user?.paymentDetails?.preferredMethod === 'upi'
                  ? `UPI: ${user?.paymentDetails?.upiId}`
                  : `Bank: ••••${user?.paymentDetails?.bankAccountNumber?.slice(-4) || ''} (${user?.paymentDetails?.bankIfscCode || ''})`}
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            background: 'linear-gradient(135deg, #fff7ed, #ffedd5)', border: '1px solid #fed7aa',
            borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ fontSize: '1.5rem' }}>⚠️</div>
            <div>
              <div style={{ fontWeight: 700, color: '#92400e', fontSize: '0.9rem' }}>
                Payment details not configured
              </div>
              <div style={{ fontSize: '0.8rem', color: '#b45309' }}>
                {isFarmer
                  ? 'Add your UPI or bank account to receive payments from buyers.'
                  : 'Add your details for receiving refunds if needed.'}
              </div>
            </div>
          </div>
        )}

        {/* Alert message */}
        {message && (
          <div style={{
            background: msgType === 'error' ? '#fef2f2' : '#f0fdf4',
            border: `1px solid ${msgType === 'error' ? '#fecaca' : '#86efac'}`,
            borderRadius: 8, padding: '10px 14px', marginBottom: '1.5rem',
            display: 'flex', alignItems: 'center', gap: 8,
            color: msgType === 'error' ? '#b91c1c' : '#166534', fontSize: '0.85rem',
          }}>
            <span>{msgType === 'error' ? '❌' : '✅'}</span>
            <span>{message}</span>
            <button onClick={() => setMessage('')}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>×</button>
          </div>
        )}

        {/* Main form card */}
        <div className="card" style={{ borderRadius: 12, overflow: 'hidden' }}>
          {/* Card header */}
          <div style={{
            background: 'linear-gradient(135deg, #1a3a2a, #2d6a4f)',
            padding: '1.25rem 1.5rem', color: '#fff',
          }}>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 4 }}>
              {isFarmer ? '🧑‍🌾 Payout Configuration' : '💳 Payment Preferences'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)' }}>
              {isFarmer
                ? 'This is where your earnings will be sent after buyer confirms delivery'
                : 'Configure your preferred method for receiving refunds'}
            </div>
          </div>

          <form onSubmit={handleSave} style={{ padding: '1.5rem' }}>
            {/* Payment method toggle */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--gray-700)', marginBottom: 8 }}>
                Preferred Method
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { id: 'upi', label: '📱 UPI', desc: 'Instant transfer' },
                  { id: 'bank_transfer', label: '🏦 Bank Account', desc: 'NEFT/IMPS' },
                ].map(m => (
                  <button type="button" key={m.id} onClick={() => setMethod(m.id)}
                    style={{
                      flex: 1, padding: '14px 12px', borderRadius: 10, cursor: 'pointer',
                      border: `2px solid ${method === m.id ? '#52b788' : '#e5e7eb'}`,
                      background: method === m.id ? '#f0fdf4' : '#fff',
                      transition: 'all 0.2s',
                    }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: method === m.id ? '#166534' : 'var(--gray-600)' }}>
                      {m.label}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)', marginTop: 2 }}>{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* UPI Section */}
            {method === 'upi' && (
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">UPI ID *</label>
                <input className="form-input" placeholder="e.g. yourname@paytm, name@ybl, name@upi"
                  value={upiId} onChange={e => setUpiId(e.target.value)} />
                <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)', marginTop: 4 }}>
                  Supported: GPay, PhonePe, Paytm, BHIM, and all UPI apps
                </div>
              </div>
            )}

            {/* Bank transfer section */}
            {method === 'bank_transfer' && (
              <>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Account Holder Name *</label>
                  <input className="form-input" placeholder="e.g. Ramesh Kumar"
                    value={accName} onChange={e => setAccName(e.target.value)} />
                </div>
                <div className="form-row" style={{ marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Account Number *</label>
                    <input className="form-input" placeholder="e.g. 1234567890"
                      value={accNo} onChange={e => setAccNo(e.target.value.replace(/\D/g, ''))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">IFSC Code *</label>
                    <input className="form-input" placeholder="e.g. SBIN0001234" maxLength={11}
                      value={ifsc} onChange={e => setIfsc(e.target.value.toUpperCase())} />
                  </div>
                </div>
              </>
            )}

            {/* Security note */}
            <div style={{
              background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8,
              padding: '10px 12px', marginBottom: '1.5rem', fontSize: '0.78rem', color: '#1e40af',
              display: 'flex', gap: 8, alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>🔒</span>
              <div>
                <strong>Your data is secure.</strong> Payment details are encrypted and stored securely.
                They are only used for processing your {isFarmer ? 'earnings' : 'refunds'}.
              </div>
            </div>

            {/* Save button */}
            <button type="submit" className="btn btn-primary btn-full"
              disabled={saving}
              style={{
                padding: '14px', fontSize: '0.95rem',
                background: 'linear-gradient(135deg, #2d6a4f, #52b788)',
                border: 'none', borderRadius: 10,
                boxShadow: '0 4px 14px rgba(45,106,79,0.3)',
              }}>
              {saving ? '⏳ Saving…' : '💾 Save Payment Details'}
            </button>
          </form>
        </div>

        {/* How payouts work — for farmers */}
        {isFarmer && (
          <div className="card" style={{ borderRadius: 12, marginTop: '1.5rem', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--gray-100)' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--gray-800)' }}>
                📖 How Payouts Work
              </div>
            </div>
            <div style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { icon: '🛒', title: 'Buyer Places Order', desc: 'A buyer purchases your crop from the marketplace.' },
                  { icon: '💳', title: 'Buyer Pays via Razorpay', desc: 'Payment is securely collected and held in escrow (UPI / Card / Net Banking).' },
                  { icon: '🚛', title: 'You Dispatch Goods', desc: "Ship the crops to the buyer's address and confirm dispatch." },
                  { icon: '✅', title: 'Buyer Confirms Receipt', desc: 'Once the buyer receives and confirms, payment is released.' },
                  { icon: '💰', title: 'You Get Paid', desc: 'Payment is sent to your configured UPI or bank account.' },
                ].map(s => (
                  <div key={s.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #d8f3dc, #b7e4c7)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1rem',
                    }}>
                      {s.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--gray-800)' }}>{s.title}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', marginTop: 2 }}>{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
