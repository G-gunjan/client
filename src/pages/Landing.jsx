
/**
 * Landing Page Component
 * Introduces the PlaceReady placement preparation platform, highlights
 * its key features and assessment workflow, displays the placement
 * readiness score formula, and provides navigation to the login page
 * and dashboard.
 */

import { Link } from 'react-router-dom';

const STEPS = ['Register', 'Profile', 'Aptitude', 'DSA / Coding', 'AI Interview', 'Multimodal', 'Analytics', 'Feedback', 'Readiness'];

export default function Landing() {
  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '1.5rem' }}>
      <div className="row between"><div className="logo" style={{ color: 'var(--ink)' }}>Place<span>Ready</span></div>
        <Link className="btn ghost" to="/dashboard">Open dashboard</Link></div>
      <div className="grid g2" style={{ alignItems: 'center', margin: '4rem 0' }}>
        <div>
          <p className="eyebrow">Final-year project · AI-driven</p>
          <h1 style={{ fontSize: '3.4rem', lineHeight: 1.05 }}>One platform. One readiness score.</h1>
          <p className="muted">Practise aptitude, solve DSA problems in C++ and Java, face a staged AI mock interview with speech and facial-expression analysis — and walk away with a consolidated Placement Readiness Report.</p>
          <Link to="/login" className="btn primary" style={{ display: 'inline-block', textDecoration: 'none' }}>Start preparing</Link>
        </div>
        <div className="card mono" style={{ fontSize: '.8rem' }}>
          readiness =<br />&nbsp; 0.30 × aptitude<br />+ 0.35 × coding<br />+ 0.30 × interview<br />+ 0.05 × integrity
        </div>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(9, 1fr)', gap: 0, border: '1px solid var(--line)' }}>
        {STEPS.map((s, i) => <div key={s} style={{ padding: '.6rem', borderRight: '1px solid var(--line)', fontSize: '.75rem' }}>
          <div className="eyebrow">{String(i + 1).padStart(2, '0')}</div>{s}</div>)}
      </div>
    </div>
  );
}
