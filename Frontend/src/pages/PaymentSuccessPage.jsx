import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { paymentAPI, orderAPI } from '../services/api';

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const orderId = params.get('order_id');

  const [status, setStatus]   = useState('loading');
  const [order, setOrder]     = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      if (!orderId) {
        setStatus('error');
        setMessage('Missing order ID.');
        return;
      }

      try {
        const res = await paymentAPI.getStatus(orderId);
        const data = res.data;

        if (data.status === 'payment_done' || data.paymentStatus === 'escrowed') {
          const orderRes = await orderAPI.getById(orderId);
          setOrder(orderRes.data.order);
          setStatus('success');
        } else {
          setStatus('error');
          setMessage('Payment status could not be verified. Please check your orders.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Could not verify payment. Please check your order dashboard.');
      }
    };

    verify();
  }, [orderId]);

  const shell = {
    minHeight: '100vh',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #d1fae5 100%)',
    padding: '2rem',
  };

  const card = {
    background: '#fff', borderRadius: 16,
    boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
    maxWidth: 520, width: '100%', padding: '2.5rem', textAlign: 'center',
  };

  if (status === 'loading') {
    return (
      <div style={shell}>
        <div style={card}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem', animation: 'pulse 1.5s infinite' }}>💳</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', fontWeight: 700, color: '#1a3a2a', marginBottom: 8 }}>
            Verifying Payment…
          </div>
          <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>
            Please wait while we confirm your payment.
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ width: 40, height: 40, border: '3px solid #e5e7eb', borderTopColor: '#52b788', borderRadius: '50%', margin: '0 auto', animation: 'spin 0.8s linear infinite' }} />
          </div>
          <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
            @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
          `}</style>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={shell}>
        <div style={card}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>⚠️</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', fontWeight: 700, color: '#b91c1c', marginBottom: 8 }}>
            Payment Verification Issue
          </div>
          <div style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{message}</div>
          <button onClick={() => navigate('/buyer')}
            style={{ background: 'linear-gradient(135deg, #2d6a4f, #52b788)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 32px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}>
            📦 Go to My Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={shell}>
      <div style={card} className="animate-fadeUp">
        <div style={{
          width: 80, height: 80, borderRadius: '50%', margin: '0 auto 1.25rem',
          background: 'linear-gradient(135deg, #52b788, #2d6a4f)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2.5rem', boxShadow: '0 8px 30px rgba(82,183,136,0.3)',
        }}>✅</div>

        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', fontWeight: 700, color: '#1a3a2a', marginBottom: 6 }}>
          Payment Successful!
        </div>
        <div style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Your money is safely held in escrow
        </div>

        {order && (
          <div style={{
            background: 'linear-gradient(135deg, #1a3a2a, #2d6a4f)', borderRadius: 12,
            padding: '1.25rem', marginBottom: '1.5rem', color: '#fff',
          }}>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>
              Amount Paid (Held in Escrow)
            </div>
            <div style={{ fontWeight: 800, fontSize: '2.25rem' }}>
              ₹{order.totalAmount?.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
              {order.crop?.name || 'Crop'} · {order.quantity} Qtl
            </div>
            {order.paymentRef && (
              <div style={{ marginTop: 10, fontSize: '0.72rem', background: 'rgba(255,255,255,0.1)', borderRadius: 6, padding: '5px 10px', display: 'inline-block' }}>
                Ref: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{order.paymentRef}</span>
              </div>
            )}
          </div>
        )}

        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #86efac',
          borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem', textAlign: 'left',
        }}>
          <div style={{ fontWeight: 700, color: '#166534', marginBottom: 10, fontSize: '0.9rem' }}>
            ✅ What happens next
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.85rem' }}>
            {[
              ['🧑‍🌾', 'Farmer has been notified with your delivery address'],
              ['🚛', 'Farmer will dispatch the crops and mark them as sent'],
              ['📦', 'Once you receive the crops, confirm receipt in your dashboard'],
              ['💰', 'Payment is released to the farmer after your confirmation'],
            ].map(([icon, text]) => (
              <div key={text} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{icon}</span>
                <span style={{ color: '#374151' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: '1.5rem', fontSize: '0.75rem', color: '#9ca3af' }}>
          🔒 Secured by <strong style={{ color: '#072654' }}>Razorpay</strong>
        </div>

        <button onClick={() => navigate('/buyer')}
          style={{
            background: 'linear-gradient(135deg, #2d6a4f, #52b788)', color: '#fff',
            border: 'none', borderRadius: 10, padding: '14px 0', fontWeight: 700,
            fontSize: '1rem', cursor: 'pointer', width: '100%',
            boxShadow: '0 4px 14px rgba(45,106,79,0.3)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(45,106,79,0.4)'; }}
          onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(45,106,79,0.3)'; }}
        >
          📦 Track in My Orders →
        </button>
      </div>
    </div>
  );
}
