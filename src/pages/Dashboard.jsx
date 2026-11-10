/**
 * Dashboard Component
 * Displays placement readiness scores, assessment statistics, progress
 * charts, weak areas, and quick links to aptitude, coding, and mock interviews.
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { api } from '../api';
import { useAuth } from '../auth';

export default function Dashboard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [r, setR] = useState(null);
  useEffect(() => { api.get('/dashboard').then(setR); }, []);
  if (!r) return <p>Loading…</p>;

  const weak = [...r.aptitudeByTopic.filter((t) => t.pct < 60), ...r.codingByTopic.filter((t) => t.pct < 50)];
  const data = r.progress.map((p) => ({ date: new Date(p.date).toLocaleDateString(), score: p.score }));

  return (
    <>
      <div className="row between">
        <div><p className="eyebrow">Hello, {user.name}</p><h1>Placement readiness</h1></div>
        <Link className="btn ghost" to="/profile">Complete your profile</Link>
      </div>
      <div className="hero-score" style={{ margin: '1rem 0' }}>
        <div className="row"><div className="num">{r.overall}</div>
          <div><div className="eyebrow" style={{ color: '#cbd5e1' }}>Overall score</div><h2 style={{ color: 'var(--orange)' }}>{r.level}</h2></div></div>
        <div className="bar" style={{ marginTop: '.8rem' }}><i style={{ width: `${r.overall}%` }} /></div>
      </div>
      <div className="grid g4">
        <Stat label="Aptitude" v={r.scores.aptitude} sub={`${r.counts.aptitudeAttempts} attempts`} />
        <Stat label="Coding" v={r.scores.coding} sub={`${r.counts.codingSubmissions} submissions`} />
        <Stat label="Interview" v={r.scores.interview} sub={`${r.counts.interviews} interviews`} />
        <Stat label="Integrity" v={r.scores.integrity} sub={`${r.counts.integrityEvents} events`} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', margin: '1rem 0' }}>
        <div className="card"><h2>Progress over time</h2>
          {data.length ? <ResponsiveContainer width="100%" height={220}><LineChart data={data}>
            <CartesianGrid stroke="#e4e0d6" /><XAxis dataKey="date" fontSize={10} /><YAxis domain={[0, 100]} fontSize={10} /><Tooltip />
            <Line dataKey="score" stroke="#e8671b" /></LineChart></ResponsiveContainer> : <p className="muted">Complete an assessment to see your trend.</p>}
        </div>
        <div>
          <div className="card"><h2>Weak areas</h2>
            {weak.length ? weak.map((w) => <div key={w.topic} className="row between"><span>{w.topic}</span><span className="bad">{w.pct}%</span></div>) : <p className="muted">None detected yet.</p>}
          </div>
          <div className="card" style={{ marginTop: '1rem' }}><h2>Quick actions</h2>
            <div className="grid">
              <button className="btn ghost" onClick={() => nav('/aptitude')}>Take aptitude test</button>
              <button className="btn ghost" onClick={() => nav('/coding')}>Solve a problem</button>
              <button className="btn primary" onClick={() => nav('/interview')}>Start mock interview</button>
            </div></div>
        </div>
      </div>
    </>
  );
}

const Stat = ({ label, v, sub }) => (
  <div className="card stat"><div className="eyebrow">{label}</div>
    <div className="num">{v ?? '—'}{v != null && <small>/100</small>}</div><small>{sub}</small></div>
);
