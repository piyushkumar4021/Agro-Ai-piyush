import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import { getAllDistrictsForState } from '../data/mlData';

const STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Chandigarh','Puducherry',
];

const SECTIONS = [
  { id: 'profile',  icon: '👤', label: 'Profile' },
  { id: 'address',  icon: '📍', label: 'Address' },
  { id: 'role',     icon: '🏷️', label: 'Role Details' },
  { id: 'payment',  icon: '💳', label: 'Payment' },
];

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('profile');

  // ── Form state ──
  const [name, setName]         = useState('');
  const [phone, setPhone]       = useState('');
  const [village, setVillage]   = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState]       = useState('');
  const [pincode, setPincode]   = useState('');

  // Farmer
  const [farmSize, setFarmSize]       = useState('');
  const [farmLocation, setFarmLocation] = useState('');

  // Buyer
  const [businessName, setBusinessName] = useState('');
  const [gstNumber, setGstNumber]       = useState('');

  // Payment
  const [payMethod, setPayMethod] = useState('upi');
  const [upiId, setUpiId]         = useState('');
  const [accNo, setAccNo]         = useState('');
  const [ifsc, setIfsc]           = useState('');
  const [accName, setAccName]     = useState('');

  const [saving, setSaving]   = useState(false);
  const [message, setMessage] = useState('');
  const [msgType, setMsgType] = useState('success');

  // Populate from user
  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setPhone(user.phone || '');
    setVillage(user.address?.village || '');
    setDistrict(user.address?.district || '');
    setState(user.address?.state || '');
    setPincode(user.address?.pincode || '');
    setFarmSize(user.farmDetails?.farmSize || '');
    setFarmLocation(user.farmDetails?.farmLocation || '');
    setBusinessName(user.businessDetails?.businessName || '');
    setGstNumber(user.businessDetails?.gstNumber || '');
    setPayMethod(user.paymentDetails?.preferredMethod || 'upi');
    setUpiId(user.paymentDetails?.upiId || '');
    setAccNo(user.paymentDetails?.bankAccountNumber || '');
    setIfsc(user.paymentDetails?.bankIfscCode || '');
    setAccName(user.paymentDetails?.bankAccountHolderName || '');
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        address: {
          village: village.trim(),
          district: district.trim(),
          state,
          pincode: pincode.trim(),
        },
        paymentDetails: {
          preferredMethod: payMethod,
          upiId: upiId.trim(),
          bankAccountNumber: accNo.trim(),
          bankIfscCode: ifsc.trim().toUpperCase(),
          bankAccountHolderName: accName.trim(),
        },
      };

      if (user?.role === 'farmer') {
        payload.farmDetails = {
          farmSize: Number(farmSize) || undefined,
          farmLocation: farmLocation.trim(),
        };
      }
      if (user?.role === 'buyer') {
        payload.businessDetails = {
          businessName: businessName.trim(),
          gstNumber: gstNumber.trim(),
        };
      }

      const res = await userAPI.updateProfile(payload);
      if (res.data.success) {
        updateUser(res.data.user);
        setMessage('Settings saved successfully!');
        setMsgType('success');
      } else {
        throw new Error(res.data.message);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || err.message);
      setMsgType('error');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  const isFarmer = user?.role === 'farmer';
  const dashPath = isFarmer ? '/farmer' : '/buyer';

  // ── Styles ──
  const sectionBtn = (id) => ({
    display:'flex', alignItems:'center', gap:10, padding:'10px 16px',
    borderRadius:10, cursor:'pointer', fontWeight:600, fontSize:'0.88rem',
    border: activeSection === id ? '2px solid #52b788' : '2px solid transparent',
    background: activeSection === id ? '#f0fdf4' : '#fff',
    color: activeSection === id ? '#166534' : '#475569',
    transition:'all 0.15s',
  });

  const inputStyle = {
    width:'100%', padding:'10px 14px', borderRadius:8, fontSize:'0.9rem',
    border:'1.5px solid #e2e8f0', outline:'none', transition:'border 0.15s',
    background:'#fff', color:'#1e293b',
  };

  const labelStyle = {
    display:'block', fontSize:'0.8rem', fontWeight:600, color:'#475569', marginBottom:5,
  };

  const cardStyle = {
    background:'#fff', borderRadius:14,
    boxShadow:'0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)',
    padding:'1.5rem',
  };

  return (
    <div style={{ minHeight:'calc(100vh - 64px)', background:'#f8fafc', padding:'2rem' }}>
      <div style={{ maxWidth:820, margin:'0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom:'1.5rem' }}>
          <button onClick={() => navigate(dashPath)}
            style={{ background:'none', border:'none', cursor:'pointer', color:'#64748b', fontSize:'0.85rem', padding:0, marginBottom:8 }}>
            ← Back to Dashboard
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{
              width:52, height:52, borderRadius:14,
              background:'linear-gradient(135deg, #2d6a4f, #52b788)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'1.5rem', color:'#fff', fontWeight:800,
              boxShadow:'0 4px 14px rgba(45,106,79,0.25)',
            }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h1 style={{ fontFamily:'Playfair Display, serif', fontSize:'1.6rem', fontWeight:700, color:'#1e293b', margin:0 }}>
                ⚙️ Settings
              </h1>
              <div style={{ fontSize:'0.82rem', color:'#94a3b8', marginTop:2 }}>
                {user?.email} · <span style={{ textTransform:'capitalize' }}>{user?.role}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Alert */}
        {message && (
          <div style={{
            background: msgType === 'error' ? '#fef2f2' : '#f0fdf4',
            border:`1px solid ${msgType === 'error' ? '#fecaca' : '#86efac'}`,
            borderRadius:10, padding:'10px 14px', marginBottom:'1.25rem',
            display:'flex', alignItems:'center', gap:8,
            color: msgType === 'error' ? '#b91c1c' : '#166534', fontSize:'0.85rem',
            animation:'fadeIn 0.2s ease',
          }}>
            <span>{msgType === 'error' ? '❌' : '✅'}</span>
            <span style={{ flex:1 }}>{message}</span>
            <button onClick={() => setMessage('')} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1rem', color:'inherit' }}>×</button>
          </div>
        )}

        {/* Layout: sidebar + content */}
        <div className="settings-layout" style={{ display:'flex', gap:'1.25rem', alignItems:'flex-start' }}>
          {/* Left nav */}
          <div className="settings-nav" style={{ width:200, flexShrink:0, display:'flex', flexDirection:'column', gap:6 }}>
            {SECTIONS.filter(s => s.id !== 'role' || user?.role !== 'admin').map(s => (
              <button key={s.id} style={sectionBtn(s.id)} onClick={() => setActiveSection(s.id)}>
                <span style={{ fontSize:'1.1rem' }}>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>

          {/* Right content */}
          <div style={{ flex:1 }}>

            {/* ── PROFILE ── */}
            {activeSection === 'profile' && (
              <div style={cardStyle}>
                <div style={{ fontWeight:700, fontSize:'1.05rem', color:'#1e293b', marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:8 }}>
                  👤 Profile Information
                </div>

                <div style={{ marginBottom:'1rem' }}>
                  <label style={labelStyle}>Full Name</label>
                  <input style={inputStyle} placeholder="Your full name" value={name}
                    onChange={e => setName(e.target.value)}
                    onFocus={e => e.target.style.borderColor='#52b788'}
                    onBlur={e => e.target.style.borderColor='#e2e8f0'} />
                </div>

                <div style={{ marginBottom:'1rem' }}>
                  <label style={labelStyle}>Email</label>
                  <input style={{ ...inputStyle, background:'#f8fafc', color:'#94a3b8', cursor:'not-allowed' }}
                    value={user?.email || ''} disabled />
                  <div style={{ fontSize:'0.72rem', color:'#94a3b8', marginTop:4 }}>Email cannot be changed</div>
                </div>

                <div style={{ marginBottom:'1rem' }}>
                  <label style={labelStyle}>Phone Number</label>
                  <input style={inputStyle} placeholder="e.g. 9876543210" value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    onFocus={e => e.target.style.borderColor='#52b788'}
                    onBlur={e => e.target.style.borderColor='#e2e8f0'} />
                </div>

                <div style={{ marginBottom:'0.5rem' }}>
                  <label style={labelStyle}>Role</label>
                  <div style={{
                    padding:'8px 14px', borderRadius:8, background:'#f1f5f9',
                    fontSize:'0.88rem', fontWeight:600, color:'#475569',
                    textTransform:'capitalize', display:'inline-block',
                  }}>
                    {user?.role === 'farmer' ? '🌾 Farmer' : user?.role === 'buyer' ? '🏢 Buyer' : '👑 Admin'}
                  </div>
                  <div style={{ fontSize:'0.72rem', color:'#94a3b8', marginTop:4 }}>Role cannot be changed</div>
                </div>
              </div>
            )}

            {/* ── ADDRESS ── */}
            {activeSection === 'address' && (
              <div style={cardStyle}>
                <div style={{ fontWeight:700, fontSize:'1.05rem', color:'#1e293b', marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:8 }}>
                  📍 Address Details
                </div>

                <div className="settings-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
                  <div>
                    <label style={labelStyle}>State</label>
                    <select style={{ ...inputStyle, cursor:'pointer' }} value={state}
                      onChange={e => { setState(e.target.value); setDistrict(''); }}>
                      <option value="">Select State</option>
                      {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>District</label>
                    <select style={{ ...inputStyle, cursor:'pointer' }} value={district}
                      onChange={e => setDistrict(e.target.value)}>
                      <option value="">{state ? 'Select District' : 'Select state first'}</option>
                      {getAllDistrictsForState(state).map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom:'1rem' }}>
                  <label style={labelStyle}>Village / Town</label>
                  <input style={inputStyle} placeholder="Village or town name" value={village}
                    onChange={e => setVillage(e.target.value)}
                    onFocus={e => e.target.style.borderColor='#52b788'}
                    onBlur={e => e.target.style.borderColor='#e2e8f0'} />
                </div>

                <div>
                  <label style={labelStyle}>Pincode</label>
                  <input style={inputStyle} placeholder="e.g. 560001" maxLength={6} value={pincode}
                    onChange={e => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onFocus={e => e.target.style.borderColor='#52b788'}
                    onBlur={e => e.target.style.borderColor='#e2e8f0'} />
                </div>

                <div style={{
                  marginTop:'1.25rem', background:'#eff6ff', border:'1px solid #bfdbfe',
                  borderRadius:8, padding:'10px 12px', fontSize:'0.78rem', color:'#1e40af',
                  display:'flex', gap:8, alignItems:'flex-start',
                }}>
                  <span style={{ fontSize:'1rem', flexShrink:0 }}>📦</span>
                  <div>
                    {isFarmer
                      ? 'Your address is shown to buyers after they pay, so they can track delivery.'
                      : 'Your address is sent to farmers after you pay, so they know where to ship.'}
                  </div>
                </div>
              </div>
            )}

            {/* ── ROLE DETAILS ── */}
            {activeSection === 'role' && (
              <div style={cardStyle}>
                <div style={{ fontWeight:700, fontSize:'1.05rem', color:'#1e293b', marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:8 }}>
                  {isFarmer ? '🧑‍🌾 Farm Details' : '🏢 Business Details'}
                </div>

                {isFarmer && (
                  <>
                    <div style={{ marginBottom:'1rem' }}>
                      <label style={labelStyle}>Farm Size (acres)</label>
                      <input style={inputStyle} type="number" placeholder="e.g. 5.5" value={farmSize}
                        onChange={e => setFarmSize(e.target.value)}
                        onFocus={e => e.target.style.borderColor='#52b788'}
                        onBlur={e => e.target.style.borderColor='#e2e8f0'} />
                    </div>
                    <div>
                      <label style={labelStyle}>Farm Location</label>
                      <input style={inputStyle} placeholder="e.g. Near village main road" value={farmLocation}
                        onChange={e => setFarmLocation(e.target.value)}
                        onFocus={e => e.target.style.borderColor='#52b788'}
                        onBlur={e => e.target.style.borderColor='#e2e8f0'} />
                    </div>
                  </>
                )}

                {!isFarmer && (
                  <>
                    <div style={{ marginBottom:'1rem' }}>
                      <label style={labelStyle}>Business / Company Name</label>
                      <input style={inputStyle} placeholder="e.g. FreshMart India Pvt Ltd" value={businessName}
                        onChange={e => setBusinessName(e.target.value)}
                        onFocus={e => e.target.style.borderColor='#52b788'}
                        onBlur={e => e.target.style.borderColor='#e2e8f0'} />
                    </div>
                    <div>
                      <label style={labelStyle}>GST Number</label>
                      <input style={inputStyle} placeholder="e.g. 07AABCU9603R1ZX" value={gstNumber}
                        onChange={e => setGstNumber(e.target.value)}
                        onFocus={e => e.target.style.borderColor='#52b788'}
                        onBlur={e => e.target.style.borderColor='#e2e8f0'} />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── PAYMENT ── */}
            {activeSection === 'payment' && (
              <div style={cardStyle}>
                <div style={{ fontWeight:700, fontSize:'1.05rem', color:'#1e293b', marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:8 }}>
                  💳 Payment Details
                </div>
                <div style={{ fontSize:'0.82rem', color:'#64748b', marginBottom:'1.25rem' }}>
                  {isFarmer
                    ? 'Configure where your earnings will be sent after buyer confirms delivery.'
                    : 'Set up your payment details for receiving refunds.'}
                </div>

                {/* Method toggle */}
                <div style={{ display:'flex', gap:8, marginBottom:'1.25rem' }}>
                  {[
                    { id:'upi', label:'📱 UPI', desc:'Instant transfer' },
                    { id:'bank_transfer', label:'🏦 Bank Account', desc:'NEFT/IMPS' },
                  ].map(m => (
                    <button type="button" key={m.id} onClick={() => setPayMethod(m.id)}
                      style={{
                        flex:1, padding:'14px 12px', borderRadius:10, cursor:'pointer',
                        border:`2px solid ${payMethod === m.id ? '#52b788' : '#e5e7eb'}`,
                        background: payMethod === m.id ? '#f0fdf4' : '#fff',
                        transition:'all 0.2s',
                      }}>
                      <div style={{ fontWeight:700, fontSize:'0.88rem', color: payMethod === m.id ? '#166534' : '#64748b' }}>
                        {m.label}
                      </div>
                      <div style={{ fontSize:'0.72rem', color:'#94a3b8', marginTop:2 }}>{m.desc}</div>
                    </button>
                  ))}
                </div>

                {payMethod === 'upi' && (
                  <div style={{ marginBottom:'1rem' }}>
                    <label style={labelStyle}>UPI ID</label>
                    <input style={inputStyle} placeholder="e.g. yourname@paytm, name@ybl" value={upiId}
                      onChange={e => setUpiId(e.target.value)}
                      onFocus={e => e.target.style.borderColor='#52b788'}
                      onBlur={e => e.target.style.borderColor='#e2e8f0'} />
                    <div style={{ fontSize:'0.72rem', color:'#94a3b8', marginTop:4 }}>
                      Supported: GPay, PhonePe, Paytm, BHIM, and all UPI apps
                    </div>
                  </div>
                )}

                {payMethod === 'bank_transfer' && (
                  <>
                    <div style={{ marginBottom:'1rem' }}>
                      <label style={labelStyle}>Account Holder Name</label>
                      <input style={inputStyle} placeholder="e.g. Ramesh Kumar" value={accName}
                        onChange={e => setAccName(e.target.value)}
                        onFocus={e => e.target.style.borderColor='#52b788'}
                        onBlur={e => e.target.style.borderColor='#e2e8f0'} />
                    </div>
                    <div className="settings-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
                      <div>
                        <label style={labelStyle}>Account Number</label>
                        <input style={inputStyle} placeholder="e.g. 1234567890" value={accNo}
                          onChange={e => setAccNo(e.target.value.replace(/\D/g, ''))}
                          onFocus={e => e.target.style.borderColor='#52b788'}
                          onBlur={e => e.target.style.borderColor='#e2e8f0'} />
                      </div>
                      <div>
                        <label style={labelStyle}>IFSC Code</label>
                        <input style={inputStyle} placeholder="e.g. SBIN0001234" maxLength={11} value={ifsc}
                          onChange={e => setIfsc(e.target.value.toUpperCase())}
                          onFocus={e => e.target.style.borderColor='#52b788'}
                          onBlur={e => e.target.style.borderColor='#e2e8f0'} />
                      </div>
                    </div>
                  </>
                )}

                <div style={{
                  background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:8,
                  padding:'10px 12px', fontSize:'0.78rem', color:'#1e40af',
                  display:'flex', gap:8, alignItems:'flex-start',
                }}>
                  <span style={{ fontSize:'1rem', flexShrink:0 }}>🔒</span>
                  <div>
                    <strong>Your data is secure.</strong> Payment details are encrypted and stored securely.
                    They are only used for processing your {isFarmer ? 'earnings' : 'refunds'}.
                  </div>
                </div>
              </div>
            )}

            {/* ── Save button ── */}
            <div style={{ marginTop:'1.25rem', display:'flex', gap:10, alignItems:'center' }}>
              <button onClick={handleSave} disabled={saving}
                style={{
                  padding:'12px 32px', fontSize:'0.95rem', fontWeight:700,
                  background:'linear-gradient(135deg, #2d6a4f, #52b788)', color:'#fff',
                  border:'none', borderRadius:10, cursor: saving ? 'wait' : 'pointer',
                  boxShadow:'0 4px 14px rgba(45,106,79,0.25)',
                  transition:'all 0.15s', opacity: saving ? 0.7 : 1,
                }}
                onMouseEnter={e => { if (!saving) { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(45,106,79,0.35)'; }}}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 14px rgba(45,106,79,0.25)'; }}
              >
                {saving ? '⏳ Saving…' : '💾 Save Changes'}
              </button>
              <button onClick={() => navigate(dashPath)}
                style={{
                  padding:'12px 24px', fontSize:'0.9rem', fontWeight:600,
                  background:'#fff', color:'#64748b', border:'1.5px solid #e2e8f0',
                  borderRadius:10, cursor:'pointer', transition:'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor='#cbd5e1'}
                onMouseLeave={e => e.currentTarget.style.borderColor='#e2e8f0'}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}
