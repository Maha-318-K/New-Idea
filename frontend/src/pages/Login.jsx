import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo.png';
import bgImg from '../assets/bg.png';
import './Login.css';

const Login = () => {
  const [employeeId, setEmployeeId] = useState('EMP');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empId: employeeId, password })
      });
      const data = await res.json();
      
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.data));
        navigate('/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  const handleEmployeeIdChange = (e) => {
    let val = e.target.value.toUpperCase();
    if (val.startsWith('EMP')) {
      val = val.substring(3);
    } else {
      val = val.replace(/^EMP|^EM|^E/, '');
    }
    const numericVal = val.replace(/\D/g, '');
    setEmployeeId('EMP' + numericVal);
  };

  return (
    <div 
      className="login-container" 
      style={{ 
        backgroundImage: `url(${bgImg}), radial-gradient(circle at 20% 60%, #2f1406 0%, #111216 50%, #0a0b0e 100%)`, 
        backgroundSize: 'cover', 
        backgroundPosition: 'center 40%', 
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#111216'
      }}
    >
      <div className="login-content">
        {/* Left Side: Branding and Features */}
        <div className="login-left">
          <div className="brand-header">
             <div className="brand-text-container">
               <div className="brand-text-block">
                 <h1 className="brand-name-text">Madi</h1>
                 <span className="brand-sub-text">S A R V O P A Y A</span>
               </div>
               <p className="brand-tagline">
                 Track. Resolve. Document. Deliver.<br/>
                 Solutions that keep projects in rhythm.
               </p>
             </div>
          </div>

          <div className="features-grid">
            <svg width="0" height="0" style={{ position: 'absolute' }}>
              <defs>
                <linearGradient id="cardGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f8ab37" />
                  <stop offset="100%" stopColor="#d25e1a" />
                </linearGradient>
              </defs>
            </svg>
            <div className="feature-card">
              <svg width="48" height="48" viewBox="0 0 24 24">
                 <path fill="url(#cardGradient)" d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h6.11a6.95 6.95 0 0 1-1.11-3H7v-2h4.08c1.07-1.8 3.01-3 5.23-3 1.05 0 2.05.29 2.9.8V5c0-1.1-.9-2-2-2zm-7-1c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 10H7v-2h7v2z"/>
                 <path fill="url(#cardGradient)" d="M17 14c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm1 7h-2v-2h2v2zm0-3h-2v-4h2v4z"/>
              </svg>
              <h3>Issues Tracking</h3>
              <p>Capture, track & resolve production issues efficiently.</p>
            </div>
            <div className="feature-card">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="url(#cardGradient)">
                <path d="M12 11.5c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-7 0c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm14 0c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-7 1c-2.33 0-7 1.17-7 3.5V17h14v-1.5c0-2.33-4.67-3.5-7-3.5zm-8 0c-.29.13-.62.33-.97.59C2.38 13.65 2 14.38 2 15V17h3v-1.5c0-1.12.38-2.22 1-3.08zm16 0c.62.86 1 1.96 1 3.08V17h3v-2.5c0-.62-.38-1.35-1.03-1.91-.35-.26-.68-.46-.97-.59z"/>
                <path d="M7 18.5l-3 3.5h16l-3-3.5H7z"/>
              </svg>
              <h3>Minutes of Meeting</h3>
              <p>Record, organize & track meeting outcomes.</p>
            </div>
            <div className="feature-card">
              <svg width="48" height="48" viewBox="0 0 24 24">
                <path fill="url(#cardGradient)" d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.73,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94z"/>
                <circle cx="12" cy="12" r="5" fill="#111216"/>
                <path fill="url(#cardGradient)" d="M11 9h2v4h-2zm0 5h2v2h-2z"/>
              </svg>
              <h3>Production Issues</h3>
              <p>Manage, prioritize & ensure timely resolution.</p>
            </div>
            <div className="feature-card">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="url(#cardGradient)">
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
              </svg>
              <h3>Document Management</h3>
              <p>Create, store & manage production documents seamlessly.</p>
            </div>
          </div>

          <div className="timeline-container">
             <div className="timeline-line"></div>
             <div className="timeline-nodes">
               {['Initiate', 'Track', 'Resolve', 'Document', 'Deliver'].map((step, idx) => (
                 <div className={`timeline-node ${idx === 0 || idx === 4 ? 'large-node' : ''}`} key={idx}>
                   <div className="node-circle">
                      {idx === 0 && (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f8ab37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                      )}
                      {idx === 4 && (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f8ab37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
                      )}
                   </div>
                   <span>{step}</span>
                 </div>
               ))}
             </div>
          </div>
        </div>

        {/* Right Side: Login Panel */}
        <div className="login-right">
          <div className="login-glass-card">
            <div className="card-top-icon">
                <img src={logoImg} alt="Logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
            </div>
            <h2>Welcome Back</h2>
            <p className="login-subtext">Sign in to continue to Sarvopaya</p>

            {error && <div style={{ color: '#ef4444', marginBottom: '12px', fontSize: '0.9rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '4px' }}>{error}</div>}

            <form className="login-form" onSubmit={handleLogin}>
              <div className="input-group">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </span>
                <input type="text" className={`emp-id-input ${employeeId ? 'has-val' : ''}`} placeholder="Employee ID" value={employeeId} onChange={handleEmployeeIdChange} />
              </div>

              <div className="input-group">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                </span>
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" className="eye-btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </button>
              </div>

              <div className="form-actions">
                <label className="checkbox-label">
                  <input type="checkbox" defaultChecked />
                  <span className="checkmark"></span>
                  Remember me
                </label>
              </div>

              <button type="submit" className="login-btn">
                <span>Login</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </button>
            </form>


            <p className="secure-tag">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              Secure. Reliable. Always.
            </p>
          </div>
        </div>
      </div>
      
      {/* <div className="footer-quote">
         <h3>|| योगः कर्मसु कौशलम् ||</h3>
         <p>Excellence in action. Harmony in delivery.</p>
      </div> */}
    </div>
  );
};

export default Login;
