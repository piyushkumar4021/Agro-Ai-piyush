import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCropImageByName } from '../data/cropImages';

const TICKER = [
  { crop:'Wheat',    price:'₹2,340/Qtl', chg:'+2.1%', up:true  },
  { crop:'Rice',     price:'₹3,200/Qtl', chg:'-0.8%', up:false },
  { crop:'Tomato',   price:'₹850/Qtl',   chg:'+12.4%',up:true  },
  { crop:'Mustard',  price:'₹5,200/Qtl', chg:'+1.5%', up:true  },
  { crop:'Onion',    price:'₹1,200/Qtl', chg:'-3.2%', up:false },
  { crop:'Cotton',   price:'₹6,500/Qtl', chg:'+0.6%', up:true  },
  { crop:'Soybean',  price:'₹4,100/Qtl', chg:'+2.9%', up:true  },
  { crop:'Potato',   price:'₹950/Qtl',   chg:'-1.1%', up:false },
  { crop:'Turmeric', price:'₹9,800/Qtl', chg:'+5.3%', up:true  },
  { crop:'Corn',     price:'₹1,890/Qtl', chg:'+0.4%', up:true  },
];

const STATS = [
  { val:'48,000+', label:'Verified Farmers'     },
  { val:'8,200+',  label:'Active Buyers'        },
  { val:'₹2.4Cr',  label:'Monthly GMV'          },
  { val:'94%',     label:'AI Accuracy'          },
];

const FEATURES = [
  { icon:'🤖', title:'AI Price Intelligence',   desc:'ML-powered crop price predictions with 94% accuracy. Know before you sell.' },
  { icon:'🌾', title:'Direct Farm Marketplace', desc:'Connect directly with verified buyers. No middlemen, better margins.'       },
  { icon:'🔒', title:'Secure Escrow Payments',  desc:'Bank-grade escrow ensures farmers get paid on delivery. 100% safe.'        },
  { icon:'📊', title:'Market Analytics',        desc:'Real-time demand charts, seasonal trends, and regional price maps.'         },
  { icon:'✅', title:'Quality Grading',         desc:'Aadhaar-verified farmers and AI quality grading (A/B/C) for all listings.' },
  { icon:'📱', title:'Mobile First',            desc:'Manage listings, track orders, and receive payments from any device.'       },
];

const HOW = [
  { step:'1', title:'Register & Verify',  desc:'Sign up as a farmer or buyer. Aadhaar KYC in under 2 minutes.'        },
  { step:'2', title:'List or Browse',     desc:'Farmers list crops with AI pricing. Buyers browse 500+ live listings.' },
  { step:'3', title:'Trade & Get Paid',   desc:'Secure order placement + escrow payment released on delivery.'         },
];

function Counter({ target, suffix='' }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const num = parseFloat(target.replace(/[^0-9.]/g,''));
    let i = 0;
    const timer = setInterval(() => {
      i += num / 40;
      if (i >= num) { setVal(num); clearInterval(timer); }
      else setVal(Math.floor(i));
    }, 40);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{target.includes('₹') ? '₹' : ''}{val.toLocaleString('en-IN')}{suffix}</span>;
}

export default function LandingPage() {
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const dashLink   = user ? ({ farmer:'/farmer', buyer:'/buyer', admin:'/admin' }[user.role] || '/farmer') : null;
  const doubled = [...TICKER, ...TICKER];

  return (
    <div style={{ fontFamily:'var(--font)' }}>

      {/* Topbar */}
      <div className="landing-topbar" style={{ background:'var(--green-deep)', padding:'10px 2rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontFamily:'var(--font-serif)', fontSize:'1.4rem', fontWeight:700, color:'var(--green-mid)' }}>
          Agro<span style={{ color:'var(--amber)' }}>AI</span>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          {user ? (
            <button onClick={() => navigate(dashLink)} className="btn btn-primary btn-sm">
              Go to Dashboard →
            </button>
          ) : (
            <>
              <button onClick={() => navigate('/login')}    className="btn btn-outline btn-sm" style={{ color:'#fff', borderColor:'rgba(255,255,255,0.3)' }}>Sign In</button>
              <button onClick={() => navigate('/register')} className="btn btn-primary btn-sm">Get Started →</button>
            </>
          )}
        </div>
      </div>

      {/* Marquee */}
      <div className="marquee-wrap">
        <div className="marquee-track">
          {doubled.map((t,i) => (
            <div key={i} className="marquee-item">
              <img
                src={getCropImageByName(t.crop)}
                alt={t.crop}
                style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(255,255,255,0.25)', flexShrink: 0 }}
                onError={e => { e.target.style.display = 'none'; }}
              />
              <span>{t.crop}</span>
              <span className="marquee-price">{t.price}</span>
              <span style={{ color: t.up ? '#52b788' : '#f87171', fontSize:'0.75rem' }}>{t.chg}</span>
              <span style={{ color:'rgba(255,255,255,0.2)' }}>|</span>
            </div>
          ))}
        </div>
      </div>

      {/* Hero */}
      <div className="landing-hero">
        <div style={{ maxWidth:800 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(82,183,136,0.15)', border:'1px solid rgba(82,183,136,0.3)', borderRadius:99, padding:'6px 16px', marginBottom:'1.5rem' }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:'#52b788', animation:'pulse 2s infinite', display:'inline-block' }} />
            <span style={{ color:'var(--green-light)', fontSize:'0.8rem', fontWeight:600 }}>NITI Aayog Capstone Project · SCA2502-011</span>
          </div>

          <h1 className="hero-title">
            India's Intelligent<br />
            <span style={{ color:'var(--green-light)' }}>Agriculture</span> Marketplace
          </h1>
          <p className="hero-sub">
            AI-powered price predictions, direct farm-to-buyer trading, and real-time market analytics — empowering 150 million Indian farmers.
          </p>

          <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap', marginBottom:'3.5rem' }}>
            {user ? (
              <button onClick={() => navigate(dashLink)} className="btn btn-primary" style={{ padding:'14px 36px', fontSize:'1rem' }}>
                Go to Your Dashboard →
              </button>
            ) : (
              <>
                <button onClick={() => navigate('/register')} className="btn btn-primary" style={{ padding:'14px 32px', fontSize:'1rem' }}>
                  Start for Free →
                </button>
                <button onClick={() => navigate('/login')} className="btn" style={{ padding:'14px 32px', fontSize:'1rem', background:'rgba(255,255,255,0.1)', color:'#fff', border:'1.5px solid rgba(255,255,255,0.25)' }}>
                  Sign In
                </button>
              </>
            )}
          </div>

          {/* Counters */}
          <div className="landing-counters" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1.5rem', maxWidth:600, margin:'0 auto' }}>
            {STATS.map(s => (
              <div key={s.label} style={{ textAlign:'center' }}>
                <div className="hero-counter">{s.val}</div>
                <div className="hero-counter-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="landing-section" style={{ background:'var(--gray-50)', padding:'5rem 2rem' }}>
        <div style={{ maxWidth:900, margin:'0 auto', textAlign:'center' }}>
          <div style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--green-mid)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>Simple Process</div>
          <h2 className="landing-section-title" style={{ fontFamily:'var(--font-serif)', fontSize:'2.2rem', marginBottom:'3rem' }}>How AgroAI Works</h2>
          <div className="grid-3">
            {HOW.map(h => (
              <div key={h.step} className="card card-pad" style={{ textAlign:'center' }}>
                <div style={{ width:52, height:52, borderRadius:'50%', background:'var(--green-mid)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'1.2rem', margin:'0 auto 1rem' }}>
                  {h.step}
                </div>
                <div style={{ fontWeight:700, fontSize:'1.05rem', marginBottom:8 }}>{h.title}</div>
                <div style={{ color:'var(--gray-500)', fontSize:'0.875rem' }}>{h.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="landing-section" style={{ padding:'5rem 2rem', background:'#fff' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', textAlign:'center' }}>
          <div style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--green-mid)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>Why AgroAI</div>
          <h2 className="landing-section-title" style={{ fontFamily:'var(--font-serif)', fontSize:'2.2rem', marginBottom:'3rem' }}>Everything You Need to Trade Smarter</h2>
          <div className="grid-3" style={{ textAlign:'left' }}>
            {FEATURES.map(f => (
              <div key={f.title} className="card card-pad" style={{ transition:'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform='translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
                <div style={{ fontSize:'2rem', marginBottom:'0.75rem' }}>{f.icon}</div>
                <div style={{ fontWeight:700, fontSize:'1rem', marginBottom:6 }}>{f.title}</div>
                <div style={{ color:'var(--gray-500)', fontSize:'0.875rem', lineHeight:1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="landing-cta" style={{ background:'linear-gradient(135deg, var(--green-deep), var(--green-dark))', padding:'5rem 2rem', textAlign:'center', color:'#fff' }}>
        <h2 className="landing-cta-title" style={{ fontFamily:'var(--font-serif)', fontSize:'2.5rem', marginBottom:'1rem' }}>Ready to Transform Your Farm Income?</h2>
        <p style={{ color:'rgba(255,255,255,0.7)', marginBottom:'2rem', fontSize:'1.05rem' }}>Join 48,000+ farmers already using AgroAI to get better prices.</p>
        {user ? (
          <button onClick={() => navigate(dashLink)} className="btn btn-primary" style={{ padding:'15px 40px', fontSize:'1.05rem' }}>
            Go to Your Dashboard →
          </button>
        ) : (
          <button onClick={() => navigate('/register')} className="btn btn-primary" style={{ padding:'15px 40px', fontSize:'1.05rem' }}>
            Create Free Account →
          </button>
        )}
      </div>

      {/* Footer */}
      <div style={{ background:'var(--green-deep)', padding:'2rem', textAlign:'center' }}>
        <div style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.8rem' }}>
          © 2026 AgroAI · NITI Aayog Capstone SCA2502-011 · Built with ❤️ for Indian Farmers
        </div>
      </div>
    </div>
  );
}