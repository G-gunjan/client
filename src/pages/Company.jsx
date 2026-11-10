/**
 * Company Preparation Component
 * Displays company-wise selection processes, focus areas, insider tips,
 * recommended coding problems, and FAQs. Allows users to set a target
 * company and start a company-specific mock interview.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';

export default function Company() {
  const { user, setUser } = useAuth();
  const nav = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [sel, setSel] = useState(null);
  useEffect(() => { api.get('/companies').then((d) => { setCompanies(d.companies); setSel(user.targetCompany || d.companies[0].name); }); }, []);
  const c = companies.find((x) => x.name === sel);
  if (!c) return <p>Loading…</p>;

  const setTarget = async () => { const { user: u } = await api.put('/auth/profile', { targetCompany: c.name }); setUser(u); };

  return (
    <>
      <p className="eyebrow">Company-wise preparation</p>
      <h1>Which company are you preparing for?</h1>
      <div className="tabs">{companies.map((x) => <div key={x.name} className={`tab ${x.name === sel ? 'on' : ''}`} onClick={() => setSel(x.name)}>{x.name}</div>)}</div>
      <div className="card">
        <div className="row between"><div><h1 style={{ fontSize: '1.6rem' }}>{c.name}</h1><span className="muted">{c.type}</span></div>
          <div className="row"><button className="btn ghost" onClick={setTarget}>{user.targetCompany === c.name ? 'Your target ✓' : 'Set as my target'}</button>
            <button className="btn primary" onClick={() => nav(`/interview?company=${encodeURIComponent(c.name)}`)}>Mock interview</button></div></div>
        <div className="grid g2" style={{ marginTop: '1rem' }}>
          <div><h3>Selection process</h3>{c.process.map((p, i) => <p key={p}><span className="eyebrow">{String(i + 1).padStart(2, '0')}</span> {p}</p>)}
            <h3>Focus areas</h3><p>Aptitude: {c.focus.aptitude.join(', ')}<br />Coding: {c.focus.coding.join(', ')}</p></div>
          <div><h3>Insider tips</h3><ul>{c.tips.map((t) => <li key={t}>{t}</li>)}</ul>
            <h3>Recommended coding problems</h3>{c.problems.map((p) => <div key={p} className="list-row" onClick={() => nav('/coding')}>{p}</div>)}</div>
        </div>
      </div>
      <h2 style={{ marginTop: '1.5rem' }}>Frequently asked at {c.name}</h2>
      {c.faq.map((f) => <details key={f} className="card" style={{ marginBottom: '.5rem' }}><summary>{f}</summary></details>)}
    </>
  );
}
