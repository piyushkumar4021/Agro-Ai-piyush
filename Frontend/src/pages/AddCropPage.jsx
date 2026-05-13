import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cropAPI, mlAPI } from '../services/api';
import { ML_STATES, ML_COMMODITIES, getDistrictsForState, todayForModel } from '../data/mlData';

const CATEGORIES = ['grains','vegetables','fruits','pulses','spices','others'];
const GRADES     = ['A','B','C'];
const SEASONS    = ['Kharif','Rabi','Zaid','Year-round'];

const FormField = ({ field, label, type='text', placeholder, opts, required, value, error, onChange }) => (
  <div className="form-group">
    <label className="form-label">{label}{required && ' *'}</label>
    {opts ? (
      <select className={`form-select ${error?'error':''}`} value={value} onChange={e => onChange(field, e.target.value)}>
        <option value="">Select {label}</option>
        {opts.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase()+o.slice(1)}</option>)}
      </select>
    ) : (
      <input className={`form-input ${error?'error':''}`} type={type} placeholder={placeholder} value={value} onChange={e => onChange(field, e.target.value)} />
    )}
    {error && <div className="form-error">{error}</div>}
  </div>
);

export default function AddCropPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState({
    name:'', category:'', quantity:'', pricePerUnit:'', qualityGrade:'B',
    harvestDate:'', availableUntil:'', description:'', season:'',
    village:'', district: user?.address?.district || '', state: user?.address?.state || '',
  });
  const [errors,   setErrors]   = useState({});
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [apiError, setApiError] = useState('');
  const [images,   setImages]   = useState([]);
  const [previews, setPreviews] = useState([]);

  // ML Predictor
  const [aiState,     setAiState]     = useState(user?.address?.state || '');
  const [aiDistrict,  setAiDistrict]  = useState(user?.address?.district || '');
  const [aiCommodity, setAiCommodity] = useState('');
  const [aiDate,      setAiDate]      = useState(todayForModel());
  const [aiPrice,     setAiPrice]     = useState(null);
  const [aiLoading,   setAiLoading]   = useState(false);
  const [aiError,     setAiError]     = useState('');

  const update = (f, v) => {
    setForm(p => {
      const next = { ...p, [f]:v };
      // Reset district when state changes
      if (f === 'state' && v !== p.state) next.district = '';
      return next;
    });
    setErrors(p => ({ ...p, [f]:'' }));
  };

  // Reset AI district when AI state changes
  const handleAiStateChange = (val) => {
    setAiState(val);
    setAiDistrict('');
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name     = 'Crop name is required';
    if (!form.category)     e.category = 'Select a category';
    if (!form.quantity)     e.quantity = 'Quantity is required';
    if (!form.pricePerUnit) e.pricePerUnit = 'Price is required';
    if (!form.state)        e.state    = 'State is required';
    return e;
  };

  const getAiPrice = async () => {
    if (!aiState || !aiDistrict || !aiCommodity) {
      setAiError('Please select State, District and Commodity first.');
      return;
    }
    setAiError('');
    setAiLoading(true);
    try {
      const data = await mlAPI.predictPrice({ State:aiState, District:aiDistrict, Commodity:aiCommodity, Arrival_Date:aiDate });
      const price = data?.predicted_modal_price;
      setAiPrice({ price, min: data?.min_price ?? null, max: data?.max_price ?? null });
    } catch {
      setAiError('Prediction failed — make sure model server is running at localhost:8000.');
    } finally { setAiLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (['village','district','state'].includes(k)) return;
        if (v) fd.append(k, v);
      });
      fd.append('location[village]', form.village);
      fd.append('location[district]', form.district);
      fd.append('location[state]', form.state);
      images.forEach(img => fd.append('images', img));
      await cropAPI.create(fd);
      setSaved(true);
      setTimeout(() => navigate('/farmer'), 1500);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to add crop. Please try again.');
    } finally { setSaving(false); }
  };

  const overlaySelectStyle = {
    background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)',
    borderRadius:'var(--radius-sm)', color:'#fff', padding:'8px 10px', fontSize:'0.82rem', width:'100%',
  };
  const overlayLabelStyle = { fontSize:'0.72rem', color:'rgba(255,255,255,0.55)', marginBottom:4, display:'block' };

  if (saved) return (
    <div className="flex-center" style={{ minHeight:'calc(100vh - 64px)', background:'var(--gray-50)' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:'4rem', marginBottom:'1rem' }}>✅</div>
        <div style={{ fontFamily:'var(--font-serif)', fontSize:'1.5rem', fontWeight:700, marginBottom:6 }}>Crop Listed Successfully!</div>
        <div style={{ color:'var(--gray-500)' }}>Redirecting to your dashboard…</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'calc(100vh - 64px)', background:'var(--gray-50)', padding:'2rem' }}>
      <div style={{ maxWidth:720, margin:'0 auto' }}>
        <div style={{ marginBottom:'1.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/farmer')}>← Back</button>
        </div>
        <div className="card card-pad animate-fadeUp">
          <div style={{ fontFamily:'var(--font-serif)', fontSize:'1.6rem', fontWeight:700, marginBottom:4 }}>🌾 Add New Crop Listing</div>
          <div style={{ color:'var(--gray-500)', fontSize:'0.875rem', marginBottom:'1.75rem' }}>Fill in details. Use the AI Predictor to get real market price from your trained model.</div>

          {apiError && (
            <div className="alert alert-red" style={{ marginBottom:'1rem' }}>
              <span className="alert-icon">❌</span><div>{apiError}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-row">
              <FormField field="name"     label="Crop Name"  required opts={ML_COMMODITIES} value={form.name}     error={errors.name}     onChange={update} />
              <FormField field="category" label="Category"   required opts={CATEGORIES}                value={form.category} error={errors.category} onChange={update} />
            </div>
            <div className="form-row">
              <FormField field="quantity"     label="Quantity (Qtl)"  required type="number" placeholder="e.g. 500" value={form.quantity}    error={errors.quantity}    onChange={update} />
              <FormField field="qualityGrade" label="Quality Grade"   opts={GRADES}                                 value={form.qualityGrade} error={errors.qualityGrade} onChange={update} />
            </div>

            {/* AI Price Predictor */}
            <div style={{ background:'linear-gradient(135deg,#1a3a2a,#2d6a4f)', borderRadius:'var(--radius)', padding:'1.25rem', marginBottom:'1.1rem', color:'#fff' }}>
              <div style={{ fontWeight:700, fontSize:'0.95rem', marginBottom:2 }}>🤖 AI Price Predictor</div>
              <div style={{ fontSize:'0.73rem', color:'rgba(255,255,255,0.5)', marginBottom:14 }}>ML model trained on APMC data · POST → localhost:8000/predict-price</div>
              <div className="resp-grid-3" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:10 }}>
                <div><label style={overlayLabelStyle}>State</label>
                  <select style={overlaySelectStyle} value={aiState} onChange={e => handleAiStateChange(e.target.value)}>
                    <option value="">Select State</option>
                    {ML_STATES.map(s => <option key={s} value={s} style={{ color:'#111', background:'#fff' }}>{s}</option>)}
                  </select>
                </div>
                <div><label style={overlayLabelStyle}>District</label>
                  <select style={overlaySelectStyle} value={aiDistrict} onChange={e => setAiDistrict(e.target.value)}>
                    <option value="">Select District</option>
                    {getDistrictsForState(aiState).map(d => <option key={d} value={d} style={{ color:'#111', background:'#fff' }}>{d}</option>)}
                  </select>
                </div>
                <div><label style={overlayLabelStyle}>Commodity</label>
                  <select style={overlaySelectStyle} value={aiCommodity} onChange={e => setAiCommodity(e.target.value)}>
                    <option value="">Select Commodity</option>
                    {ML_COMMODITIES.map(c => <option key={c} value={c} style={{ color:'#111', background:'#fff' }}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display:'flex', gap:10, alignItems:'flex-end' }}>
                <div style={{ flex:1 }}>
                  <label style={overlayLabelStyle}>Arrival Date (DD-MM-YYYY)</label>
                  <input type="text" value={aiDate} onChange={e => setAiDate(e.target.value)} placeholder="DD-MM-YYYY" style={overlaySelectStyle} />
                </div>
                <button type="button" onClick={getAiPrice} disabled={aiLoading}
                  style={{ background:aiLoading?'rgba(255,255,255,0.15)':'var(--green-mid)', color:'#fff', border:'none', borderRadius:'var(--radius-sm)', padding:'9px 18px', fontWeight:700, fontSize:'0.82rem', cursor:aiLoading?'not-allowed':'pointer', whiteSpace:'nowrap', flexShrink:0 }}>
                  {aiLoading ? '⏳ Predicting…' : '🔮 Get Price'}
                </button>
              </div>
              {aiError && <div style={{ marginTop:8, background:'rgba(239,68,68,0.2)', borderRadius:'var(--radius-sm)', padding:'7px 10px', fontSize:'0.78rem' }}>⚠️ {aiError}</div>}
              {aiPrice && (
                <div style={{ marginTop:12, background:'rgba(255,255,255,0.12)', borderRadius:'var(--radius-sm)', padding:'12px 16px', display:'flex', alignItems:'center', flexWrap:'wrap', gap:18 }}>
                  <div>
                    <div style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.5)', marginBottom:2 }}>Predicted Modal Price</div>
                    <div style={{ fontWeight:800, fontSize:'1.5rem' }}>
                      ₹{aiPrice.price != null ? Number(aiPrice.price).toLocaleString('en-IN',{maximumFractionDigits:0}) : '—'}<span style={{ fontSize:'0.8rem', fontWeight:400, opacity:0.6 }}>/Qtl</span>
                    </div>
                  </div>
                  {aiPrice.min != null && <div><div style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.5)' }}>Min</div><div style={{ fontWeight:600 }}>₹{Number(aiPrice.min).toLocaleString('en-IN',{maximumFractionDigits:0})}</div></div>}
                  {aiPrice.max != null && <div><div style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.5)' }}>Max</div><div style={{ fontWeight:600 }}>₹{Number(aiPrice.max).toLocaleString('en-IN',{maximumFractionDigits:0})}</div></div>}
                  {aiPrice.price != null && (
                    <button type="button" onClick={() => update('pricePerUnit', Math.round(aiPrice.price))}
                      style={{ marginLeft:'auto', background:'#fff', color:'var(--green-dark)', border:'none', borderRadius:'var(--radius-sm)', padding:'7px 14px', fontWeight:700, fontSize:'0.8rem', cursor:'pointer' }}>
                      Use This Price ↗
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="form-row">
              <FormField field="pricePerUnit" label="Your Price (₹/Qtl)" required type="number" placeholder="e.g. 2340" value={form.pricePerUnit} error={errors.pricePerUnit} onChange={update} />
              <FormField field="season"       label="Season"             opts={SEASONS}                              value={form.season}      error={errors.season}      onChange={update} />
            </div>
            <div className="form-row">
              <FormField field="harvestDate"    label="Harvest Date"    type="date" value={form.harvestDate}    error={errors.harvestDate}    onChange={update} />
              <FormField field="availableUntil" label="Available Until" type="date" value={form.availableUntil} error={errors.availableUntil} onChange={update} />
            </div>

            <div style={{ fontWeight:700, fontSize:'0.82rem', color:'var(--gray-700)', marginBottom:8, marginTop:4 }}>📍 Location</div>
            <div className="form-row resp-grid-3" style={{ gridTemplateColumns:'1fr 1fr 1fr' }}>
              <div className="form-group">
                <label className="form-label">State *</label>
                <select className={`form-select ${errors.state?'error':''}`} value={form.state} onChange={e => update('state', e.target.value)}>
                  <option value="">Select State</option>
                  {ML_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.state && <div className="form-error">{errors.state}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">District</label>
                <select className="form-select" value={form.district} onChange={e => update('district', e.target.value)}>
                  <option value="">Select District</option>
                  {getDistrictsForState(form.state).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <FormField field="village" label="Village" placeholder="Village / Town" value={form.village} error={errors.village} onChange={update} />
            </div>

            <div className="form-group">
              <label className="form-label">Description (Optional)</label>
              <textarea className="form-input" rows={3} placeholder="Any extra details about quality, handling, etc."
                value={form.description} onChange={e => update('description', e.target.value)} style={{ resize:'vertical' }} />
            </div>

            {/* Image Upload */}
            <div className="form-group">
              <label className="form-label">📸 Crop Images (max 4)</label>
              <div
                onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--green-mid)'; }}
                onDragLeave={e => { e.currentTarget.style.borderColor = 'var(--gray-200)'; }}
                onDrop={e => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = 'var(--gray-200)';
                  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')).slice(0, 4 - images.length);
                  setImages(p => [...p, ...files].slice(0, 4));
                  setPreviews(p => [...p, ...files.map(f => URL.createObjectURL(f))].slice(0, 4));
                }}
                style={{
                  border: '2px dashed var(--gray-200)', borderRadius: 'var(--radius-sm)', padding: '1.5rem',
                  textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s',
                  background: 'var(--gray-50)',
                }}
                onClick={() => document.getElementById('crop-image-input')?.click()}
              >
                <input
                  id="crop-image-input" type="file" accept="image/*" multiple hidden
                  onChange={e => {
                    const files = Array.from(e.target.files).slice(0, 4 - images.length);
                    setImages(p => [...p, ...files].slice(0, 4));
                    setPreviews(p => [...p, ...files.map(f => URL.createObjectURL(f))].slice(0, 4));
                  }}
                />
                <div style={{ fontSize: '2rem', marginBottom: 6 }}>📷</div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                  Drag & drop images here or click to browse
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)', marginTop: 4 }}>
                  JPG, PNG · Up to 4 images · Max 5MB each
                </div>
              </div>
              {previews.length > 0 && (
                <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                  {previews.map((src, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img src={src} alt={`Preview ${i + 1}`} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '2px solid var(--gray-200)' }} />
                      <button type="button" onClick={(e) => {
                        e.stopPropagation();
                        setImages(p => p.filter((_, j) => j !== i));
                        setPreviews(p => p.filter((_, j) => j !== i));
                      }} style={{
                        position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%',
                        background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.65rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800,
                      }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display:'flex', gap:12, marginTop:'0.5rem' }}>
              <button type="button" className="btn btn-secondary" style={{ flex:1 }} onClick={() => navigate('/farmer')}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ flex:2 }} disabled={saving}>
                {saving ? '⏳ Listing Crop…' : '🌾 List My Crop'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}