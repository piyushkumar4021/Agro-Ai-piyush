import React from 'react';
import Badge from './Badge';
import { useNavigate } from 'react-router-dom';

const CropCard = ({ crop }) => {
  const navigate = useNavigate();

  return (
    <div className="crop-card animate-fadeUp" onClick={() => navigate('/marketplace')}>
      <div className="crop-image" style={{ background: crop.bg }}>
        {crop.emoji}
        <div className="crop-quality">
          <Badge variant="green">{crop.gradeFull}</Badge>
        </div>
      </div>
      <div className="crop-body">
        <div className="crop-name">{crop.name}</div>
        <div className="crop-farmer">
          👨‍🌾 {crop.farmer} · {crop.location} &nbsp;⭐ {crop.rating}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div className="crop-price">₹{crop.price.toLocaleString('en-IN')}/{crop.unit}</div>
          <div className="crop-qty">{crop.qty} {crop.unit} available</div>
        </div>
        <div className="crop-ai">🤖 AI: {crop.aiInsight}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-primary btn-sm"
            style={{ flex: 1 }}
            onClick={(e) => { e.stopPropagation(); navigate('/buyer'); }}
          >
            Buy Now
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={(e) => e.stopPropagation()}
          >
            Contact
          </button>
        </div>
      </div>
    </div>
  );
};

export default CropCard;
