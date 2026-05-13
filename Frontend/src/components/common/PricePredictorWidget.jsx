import React, { useState } from 'react';
import { mlAPI } from '../../services/api';
import { ML_STATES, ML_DISTRICTS, ML_COMMODITIES, todayForModel } from '../../data/mlData';

/**
 * PricePredictorWidget
 * Props:
 *   defaultState    - pre-fill state
 *   defaultDistrict - pre-fill district
 *   defaultCommodity- pre-fill commodity
 *   onPriceResult   - callback(price) when prediction returns
 *   compact         - boolean, if true renders inline/compact style
 */
export default function PricePredictorWidget({
  defaultState = '',
  defaultDistrict = '',
  defaultCommodity = '',
  onPriceResult,
  compact = false,
}) {
  const [state,     setState]     = useState(defaultState);
  const [district,  setDistrict]  = useState(defaultDistrict);
  const [commodity, setCommodity] = useState(defaultCommodity);
  const [date,      setDate]      = useState(todayForModel());
  const [result,    setResult]    = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const predict = async () => {
    if (!state || !district || !commodity) {
      setError('Please select State, District and Commodity.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await mlAPI.predictPrice({ State: state, District: district, Commodity: commodity, Arrival_Date: date });
      // model returns { predicted_modal_price, commodity, district }
      const price = data?.predicted_modal_price ?? null;
      setResult({ price, raw: data });
      if (onPriceResult && price !== null) onPriceResult(price);
    } catch (e) {
      setError('Prediction failed. Make sure the model server is running at localhost:8000.');
      console.error('ML predict error:', e);
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = compact
    ? { background: 'linear-gradient(135deg,#1a3a2a,#2d6a4f)', borderRadius: 'var(--radius)', padding: '1.25rem', color: '#fff' }
    : { background: 'linear-gradient(135deg,#1a3a2a,#2d6a4f)', borderRadius: 'var(--radius)', padding: '1.5rem', color: '#fff' };

  const selectStyle = {
    background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 'var(--radius-sm)', color: '#fff', padding: '8px 10px',
    fontSize: '0.82rem', width: '100%', cursor: 'pointer',
  };

  const labelStyle = { fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', marginBottom: 4, display: 'block' };

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: compact ? '0.9rem' : '1rem' }}>🤖 AI Price Predictor</div>
          <div style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
            ML model trained on APMC market data
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr 1fr' : '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <label style={labelStyle}>State</label>
          <select style={selectStyle} value={state} onChange={e => setState(e.target.value)}>
            <option value="">Select State</option>
            {ML_STATES.map(s => <option key={s} value={s} style={{ color: '#111', background: '#fff' }}>{s}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>District</label>
          <select style={selectStyle} value={district} onChange={e => setDistrict(e.target.value)}>
            <option value="">Select District</option>
            {ML_DISTRICTS.map(d => <option key={d} value={d} style={{ color: '#111', background: '#fff' }}>{d}</option>)}
          </select>
        </div>
        {!compact && (
          <div>
            <label style={labelStyle}>Commodity</label>
            <select style={selectStyle} value={commodity} onChange={e => setCommodity(e.target.value)}>
              <option value="">Select Commodity</option>
              {ML_COMMODITIES.map(c => <option key={c} value={c} style={{ color: '#111', background: '#fff' }}>{c}</option>)}
            </select>
          </div>
        )}
      </div>

      {compact && (
        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>Commodity</label>
          <select style={selectStyle} value={commodity} onChange={e => setCommodity(e.target.value)}>
            <option value="">Select Commodity</option>
            {ML_COMMODITIES.map(c => <option key={c} value={c} style={{ color: '#111', background: '#fff' }}>{c}</option>)}
          </select>
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Arrival Date</label>
        <input
          type="text"
          placeholder="DD-MM-YYYY"
          value={date}
          onChange={e => setDate(e.target.value)}
          style={{ ...selectStyle, width: compact ? '100%' : '200px' }}
        />
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: '0.78rem', marginBottom: 10 }}>
          ⚠️ {error}
        </div>
      )}

      <button
        onClick={predict}
        disabled={loading}
        style={{ background: loading ? 'rgba(255,255,255,0.2)' : 'var(--green-mid)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', padding: '9px 20px', fontWeight: 700, fontSize: '0.85rem', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}
      >
        {loading ? '⏳ Predicting…' : '🔮 Predict Market Price'}
      </button>

      {result && (
        <div style={{ marginTop: 14, background: 'rgba(255,255,255,0.12)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>Predicted Modal Price</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>
              ₹{result.price != null ? Number(result.price).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '—'}
              <span style={{ fontSize: '0.8rem', fontWeight: 400, opacity: 0.6 }}>/Qtl</span>
            </div>
          </div>
          {result.raw?.min_price != null && (
            <div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>Min</div>
              <div style={{ fontWeight: 700 }}>₹{Number(result.raw.min_price).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
            </div>
          )}
          {result.raw?.max_price != null && (
            <div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>Max</div>
              <div style={{ fontWeight: 700 }}>₹{Number(result.raw.max_price).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
            </div>
          )}
          {onPriceResult && result.price != null && (
            <button
              onClick={() => onPriceResult(Math.round(result.price))}
              style={{ marginLeft: 'auto', background: '#fff', color: 'var(--green-dark)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '7px 14px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
            >
              Use This Price ↗
            </button>
          )}
        </div>
      )}
    </div>
  );
}