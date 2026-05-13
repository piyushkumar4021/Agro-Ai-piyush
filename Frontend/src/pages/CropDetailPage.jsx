import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cropAPI, reviewAPI } from '../services/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getCropImageByName } from '../data/cropImages';

// Fix default marker icon (webpack workaround)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Indian state approximate coordinates
const STATE_COORDS = {
  'Maharashtra': [19.7515, 75.7139], 'Karnataka': [15.3173, 75.7139], 'Tamil Nadu': [11.1271, 78.6569],
  'Uttar Pradesh': [26.8467, 80.9462], 'Madhya Pradesh': [22.9734, 78.6569], 'Rajasthan': [27.0238, 74.2179],
  'Gujarat': [22.2587, 71.1924], 'Punjab': [31.1471, 75.3412], 'Haryana': [29.0588, 76.0856],
  'West Bengal': [22.9868, 87.855], 'Bihar': [25.0961, 85.3131], 'Andhra Pradesh': [15.9129, 79.74],
  'Telangana': [18.1124, 79.0193], 'Kerala': [10.8505, 76.2711], 'Odisha': [20.9517, 85.0985],
  'Assam': [26.2006, 92.9376], 'Jharkhand': [23.6102, 85.2799], 'Chhattisgarh': [21.2787, 81.8661],
  'Uttarakhand': [30.0668, 79.0193], 'Himachal Pradesh': [31.1048, 77.1734], 'Goa': [15.2993, 74.124],
};

const CROP_ICONS = { grains: '🌾', vegetables: '🥦', fruits: '🍎', pulses: '🫘', spices: '🌶️', others: '🌿' };
const GRADE_COLORS = { A: '#16a34a', B: '#f59e0b', C: '#ef4444' };

export default function CropDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [crop, setCrop] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await cropAPI.getById(id);
        setCrop(res.data.crop);
        // Load reviews for this crop's farmer
        if (res.data.crop?.farmer?._id) {
          try {
            const revRes = await reviewAPI.getUserReviews(res.data.crop.farmer._id);
            setReviews(revRes.data.reviews || []);
            setAvgRating(parseFloat(revRes.data.avgRating) || 0);
          } catch { /* no reviews */ }
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  if (loading) return (
    <div className="flex-center" style={{ minHeight: 'calc(100vh - 64px)', background: 'var(--gray-50)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'pulse 2s infinite' }}>🌾</div>
        <div style={{ color: 'var(--gray-400)' }}>Loading crop details…</div>
      </div>
    </div>
  );

  if (!crop) return (
    <div className="flex-center" style={{ minHeight: 'calc(100vh - 64px)', background: 'var(--gray-50)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Crop not found</div>
        <button className="btn btn-primary" onClick={() => navigate('/marketplace')}>← Back to Marketplace</button>
      </div>
    </div>
  );

  const icon = CROP_ICONS[crop.category] || '🌿';
  const hasImages = crop.images && crop.images.length > 0;
  const cropFallbackImage = getCropImageByName(crop.name, crop.category);

  return (
    <div style={{ background: 'var(--gray-50)', minHeight: 'calc(100vh - 64px)' }}>
      {/* Breadcrumb */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--gray-100)', padding: '10px 2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 8, fontSize: '0.82rem', color: 'var(--gray-400)' }}>
          <span style={{ cursor: 'pointer', color: 'var(--green-dark)' }} onClick={() => navigate('/marketplace')}>Marketplace</span>
          <span>›</span>
          <span style={{ cursor: 'pointer', color: 'var(--green-dark)' }} onClick={() => navigate('/marketplace')}>{crop.category?.charAt(0).toUpperCase() + crop.category?.slice(1)}</span>
          <span>›</span>
          <span style={{ color: 'var(--gray-600)', fontWeight: 600 }}>{crop.name}</span>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem' }}>
        <div className="cd-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          
          {/* Image / Icon Section */}
          <div>
            <div style={{
              background: 'transparent',
              borderRadius: 'var(--radius)', overflow: 'hidden', aspectRatio: '4/3',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid var(--gray-100)',
            }}>
              <img
                src={hasImages ? crop.images[imgIdx] : cropFallbackImage}
                alt={crop.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { e.target.src = cropFallbackImage; }}
              />
            </div>
            {hasImages && crop.images.length > 1 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                {crop.images.map((img, i) => (
                  <div key={i} onClick={() => setImgIdx(i)} style={{
                    width: 60, height: 60, borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                    border: i === imgIdx ? '2px solid var(--green-dark)' : '2px solid var(--gray-200)',
                  }}>
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span className={`badge badge-${crop.status === 'available' ? 'green' : 'gray'}`}>
                {crop.status === 'available' ? '✅ Available' : crop.status}
              </span>
              <span style={{
                background: GRADE_COLORS[crop.qualityGrade] || '#999', color: '#fff',
                padding: '2px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700,
              }}>Grade {crop.qualityGrade}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>👁️ {crop.views} views</span>
            </div>

            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', margin: '0 0 4px', color: 'var(--green-deep)' }}>
              {icon} {crop.name}
            </h1>
            <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: '1.25rem' }}>
              {crop.category?.charAt(0).toUpperCase() + crop.category?.slice(1)} · Listed {crop.createdAt ? new Date(crop.createdAt).toLocaleDateString('en-IN') : ''}
            </div>

            {/* Price */}
            <div style={{
              background: 'linear-gradient(135deg, #d8f3dc, #b7e4c7)', borderRadius: 'var(--radius)',
              padding: '1.25rem', marginBottom: '1.25rem',
            }}>
              <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600, marginBottom: 4 }}>Price per Quintal</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#166534' }}>
                ₹{crop.pricePerUnit?.toLocaleString('en-IN')}
                <span style={{ fontSize: '0.9rem', fontWeight: 400 }}>/Qtl</span>
              </div>
              {crop.aiSuggestedPrice && (
                <div style={{ fontSize: '0.78rem', color: '#15803d', marginTop: 4 }}>
                  🤖 AI Suggested: ₹{crop.aiSuggestedPrice.toLocaleString('en-IN')}/Qtl
                </div>
              )}
            </div>

            {/* Info Grid */}
            <div className="cd-info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: '1.25rem' }}>
              {[
                { label: 'Quantity', value: `${crop.quantity} ${crop.unit || 'Qtl'}`, icon: '📦' },
                { label: 'Harvest Date', value: crop.harvestDate ? new Date(crop.harvestDate).toLocaleDateString('en-IN') : '—', icon: '📅' },
                { label: 'Available Until', value: crop.availableUntil ? new Date(crop.availableUntil).toLocaleDateString('en-IN') : '—', icon: '⏰' },
                { label: 'Location', value: [crop.location?.district, crop.location?.state].filter(Boolean).join(', ') || '—', icon: '📍' },
              ].map(item => (
                <div key={item.label} style={{ background: '#fff', border: '1px solid var(--gray-100)', borderRadius: 'var(--radius-sm)', padding: '10px 14px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginBottom: 2 }}>{item.icon} {item.label}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Description */}
            {crop.description && (
              <div style={{ background: '#fff', border: '1px solid var(--gray-100)', borderRadius: 'var(--radius-sm)', padding: '14px', marginBottom: '1.25rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 6 }}>📝 Description</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)', lineHeight: 1.7 }}>{crop.description}</div>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" style={{ flex: 1, padding: '12px 20px' }}
                onClick={() => navigate('/marketplace')}>
                🛒 Buy on Marketplace
              </button>
              <button className="btn btn-secondary" style={{ padding: '12px 20px' }}
                onClick={() => navigate(-1)}>
                ← Back
              </button>
            </div>
          </div>
        </div>

        {/* Farmer Profile */}
        <div className="cd-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div className="card card-pad">
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem' }}>👨‍🌾 Farmer Profile</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: '1rem' }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #2d6a4f, #52b788)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1.2rem',
              }}>
                {crop.farmer?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{crop.farmer?.name || 'Farmer'}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>
                  📍 {crop.farmer?.address?.district || crop.location?.district || '—'}, {crop.farmer?.address?.state || crop.location?.state || '—'}
                </div>
              </div>
            </div>
            {avgRating > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[1,2,3,4,5].map(s => (
                    <span key={s} style={{ fontSize: '1.1rem', opacity: s <= Math.round(avgRating) ? 1 : 0.2 }}>⭐</span>
                  ))}
                </div>
                <span style={{ fontWeight: 700, color: '#92400e' }}>{avgRating.toFixed(1)}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>({reviews.length} reviews)</span>
              </div>
            )}
            {crop.farmer?.phone && (
              <div style={{ fontSize: '0.82rem', color: 'var(--gray-600)' }}>📞 {crop.farmer.phone}</div>
            )}
          </div>

          {/* Reviews */}
          <div className="card card-pad">
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem' }}>⭐ Farmer Reviews ({reviews.length})</div>
            {reviews.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '2rem 0' }}>
                No reviews yet
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 300, overflowY: 'auto' }}>
                {reviews.slice(0, 5).map((r, i) => (
                  <div key={r._id || i} style={{ borderBottom: '1px solid var(--gray-100)', paddingBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{r.reviewer?.name || 'Buyer'}</div>
                      <div style={{ display: 'flex', gap: 1 }}>
                        {[1,2,3,4,5].map(s => (
                          <span key={s} style={{ fontSize: '0.75rem', opacity: s <= r.rating ? 1 : 0.2 }}>⭐</span>
                        ))}
                      </div>
                    </div>
                    {r.comment && <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>{r.comment}</div>}
                    <div style={{ fontSize: '0.68rem', color: 'var(--gray-400)', marginTop: 4 }}>
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Location Map */}
        {crop.location?.state && (
          <div className="card card-pad" style={{ marginTop: '2rem' }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem' }}>🗺️ Crop Location</div>
            <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', height: 300 }}>
              <MapContainer
                center={STATE_COORDS[crop.location.state] || [20.5937, 78.9629]}
                zoom={7} style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={STATE_COORDS[crop.location.state] || [20.5937, 78.9629]}>
                  <Popup>
                    <strong>{crop.name}</strong><br />
                    📍 {[crop.location.village, crop.location.district, crop.location.state].filter(Boolean).join(', ')}<br />
                    💰 ₹{crop.pricePerUnit?.toLocaleString('en-IN')}/Qtl
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: 8 }}>
              📍 {[crop.location.village, crop.location.district, crop.location.state].filter(Boolean).join(', ')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
