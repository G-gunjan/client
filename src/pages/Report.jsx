
/**
 * Placement Readiness Report Component
 * Fetches and displays the user's overall placement readiness score,
 * module-wise performance, strengths, weaknesses, and assessment analytics.
 * Provides radar and bar charts, AI-generated personalised feedback,
 * interview and integrity summaries, and a print option to save the
 * report as a PDF.
 */

import { useEffect, useState } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { api } from '../api';

export default function Report() {
  const [r, setR] = useState(null);
  const [fb, setFb] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { api.get('/report').then(setR); }, []);
  if (!r) return <p>Loading…</p>;
  const u = r.user;
  const ev = Object.entries(r.integrity.eventCounts);

  return (
    <>
      <div className="row between">
        <div><p className="eyebrow">Placement readiness report</p><h1>{u.name}</h1></div>
        <div className="row no-print">
          <button className="btn ghost" onClick={() => window.print()}>Download PDF</button>
          <button className="btn primary" disabled={busy} onClick={async () => { setBusy(true); setFb((await api.post('/report/feedback')).feedback); setBusy(false); }}>{busy ? 'Generating…' : 'Generate AI feedback'}</button>
        </div>
      </div>

      <div className="card" style={{ margin: '1rem 0' }}><h2>Candidate information</h2>
        <div className="grid g3 muted"><span>College: {u.college || '—'}</span><span>Branch: {u.branch || '—'}</span><span>Graduation: {u.graduationYear || '—'}</span>
          <span>Target role: {u.targetRole || '—'}</span><span>Skills: {u.skills?.join(', ') || '—'}</span><span>Target company: {u.targetCompany || '—'}</span></div></div>

      <div className="grid g2">
        <div className="card"><h2>Overall score</h2><div className="stat"><span className="num" style={{ fontSize: '3rem' }}>{r.overall}</span>/100</div>
          <b style={{ color: 'var(--orange)' }}>{r.level}</b>
          <p className="mono muted" style={{ fontSize: '.8rem' }}>Aptitude {r.scores.aptitude} · Coding {r.scores.coding}<br />Interview {r.scores.interview ?? '—'} · Integrity {r.scores.integrity}</p></div>
        <div className="card"><h2>Module scores</h2><ResponsiveContainer width="100%" height={220}><RadarChart data={r.radar}>
          <PolarGrid /><PolarAngleAxis dataKey="axis" fontSize={10} /><Radar dataKey="value" stroke="#e8671b" fill="#e8671b" fillOpacity={0.4} /></RadarChart></ResponsiveContainer></div>
      </div>

      <div className="grid g2" style={{ margin: '1rem 0' }}>
        <div className="card"><h2>Strengths</h2><ul>{r.strengths.length ? r.strengths.map((s) => <li key={s}>{s}</li>) : <li className="muted">None yet</li>}</ul></div>
        <div className="card"><h2>Weaknesses</h2><ul>{r.weaknesses.length ? r.weaknesses.map((s) => <li key={s}>{s}</li>) : <li className="muted">None</li>}</ul></div>
      </div>

      <div className="card"><h2>AI feedback</h2><p className="desc muted">{fb || 'Click "Generate AI feedback" for a personalised analysis.'}</p></div>

      <div className="grid g2" style={{ margin: '1rem 0' }}>
        <div className="card"><h2>Aptitude analysis</h2>
          {r.aptitudeByTopic.length ? <ResponsiveContainer width="100%" height={200}><BarChart data={r.aptitudeByTopic}><XAxis dataKey="topic" fontSize={10} /><YAxis domain={[0, 100]} fontSize={10} /><Bar dataKey="pct" fill="#16213a" /></BarChart></ResponsiveContainer> : <p className="muted">No attempts yet.</p>}</div>
        <div className="card"><h2>Coding analysis</h2>
          {r.codingByTopic.length ? r.codingByTopic.map((t) => <div key={t.topic} className="row between"><span>{t.topic}</span><span className="mono">{t.pct}% · {t.subs} subs</span></div>) : <p className="muted">No submissions yet.</p>}</div>
        <div className="card"><h2>Interview analysis</h2>
          {r.interview ? r.interview.questions.map((q, i) => <div key={i} className="row between"><span>{q.stage}</span><span className="mono">{q.scores?.overall ?? 0}</span></div>) : <p className="muted">No completed interview yet.</p>}</div>
        <div className="card"><h2>Integrity events</h2>
          {ev.length ? <>{ev.map(([k, n]) => <div key={k} className="row between"><span className="mono">{k}</span><span>{n}</span></div>)}
            <p className="muted" style={{ marginTop: '.5rem' }}>Logged for review only — these are observations, not findings of misconduct.</p></> : <p className="good">No integrity events recorded.</p>}</div>
      </div>
    </>
  );
}
