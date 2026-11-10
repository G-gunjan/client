/**
 * Aptitude Test Component
 * Manages test initialization, MCQ answers, countdown timer, fullscreen
 * integrity monitoring, automatic submission, and result analysis.
 */
import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { useIntegrity } from '../useIntegrity';

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function Aptitude() {
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [left, setLeft] = useState(0);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');
  const submitted = useRef(false);

  useIntegrity('aptitude', test?.attemptId, { active: !!test && !result, fullscreen: true });

  async function begin() {
    setErr('');
    try {
      const t = await api.post('/aptitude/start');
      setTest(t); setLeft(t.durationSec); setResult(null); setAnswers({}); submitted.current = false;
      document.documentElement.requestFullscreen?.().catch(() => {});
    } catch (e) { setErr(e.message); }
  }

  async function submit() {
    if (submitted.current || !test) return;
    submitted.current = true;
    const payload = Object.entries(answers).map(([questionId, selected]) => ({ questionId, selected }));
    setResult(await api.post(`/aptitude/${test.attemptId}/submit`, { answers: payload }));
    if (document.fullscreenElement) document.exitFullscreen?.();
  }

  useEffect(() => {
    if (!test || result) return;
    const t = setInterval(() => setLeft((l) => l - 1), 1000);
    return () => clearInterval(t);
  }, [test, result]);
  useEffect(() => { if (test && !result && left <= 0) submit(); }, [left]); // auto-submit at 0

  if (result) return (
    <>
      <h1>Aptitude result</h1>
      <div className="hero-score"><div className="num">{result.scorePct}%</div><p>{result.correct}/{result.total} correct · {fmt(result.durationSec)} used</p></div>
      <div className="grid g4" style={{ margin: '1rem 0' }}>
        {result.topics.map((t) => <div key={t.topic} className="card stat"><div className="eyebrow">{t.topic}</div>
          <div className={`num ${t.pct < 60 ? 'bad' : 'good'}`}>{t.pct}%</div></div>)}
      </div>
      {result.weakTopics.length > 0 && <p className="bad">Weak areas: {result.weakTopics.join(', ')}</p>}
      <div className="card"><h2>Review</h2>
        {result.review.map((q, i) => <div key={q._id} style={{ padding: '.6rem 0', borderBottom: '1px solid var(--line)' }}>
          <b>{i + 1}. {q.question}</b>
          <div className={q.selected === q.correctAnswer ? 'good' : 'bad'}>Your answer: {q.selected ?? 'skipped'}</div>
          {q.selected !== q.correctAnswer && <div className="good">Correct: {q.correctAnswer}</div>}</div>)}
      </div>
      <button className="btn" style={{ marginTop: '1rem' }} onClick={() => { setTest(null); setResult(null); }}>Back</button>
    </>
  );

  if (!test) return (
    <>
      <h1>Aptitude assessment</h1>
      <div className="card" style={{ maxWidth: 560 }}>
        <p>12 questions across Quantitative, Logical, Verbal and Technical topics · 15 minutes.</p>
        <p className="muted">The test runs in fullscreen. Tab switches, leaving fullscreen, copy/paste and right-clicks are logged as integrity events for review.</p>
      </div>
      {err && <div className="error">{err}</div>}
      <button className="btn" style={{ marginTop: '1rem' }} onClick={begin}>Begin test</button>
    </>
  );

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      <div className="row between"><h1>Aptitude test</h1><div className="mono" style={{ fontSize: '1.4rem', color: left < 60 ? 'var(--red)' : 'inherit' }}>{fmt(Math.max(0, left))}</div></div>
      {test.questions.map((q, i) => (
        <div className="card" key={q._id} style={{ marginBottom: '.8rem' }}>
          <div className="eyebrow">{q.topic} · {q.difficulty}</div>
          <b>{i + 1}. {q.question}</b>
          {q.options.map((o) => (
            <label key={o} className={`opt ${answers[q._id] === o ? 'on' : ''}`} style={{ fontWeight: 400 }}>
              <input type="radio" style={{ width: 'auto', marginRight: 8 }} name={q._id} checked={answers[q._id] === o}
                onChange={() => setAnswers({ ...answers, [q._id]: o })} />{o}
            </label>
          ))}
        </div>
      ))}
      <button className="btn primary" onClick={submit}>Submit test ({Object.keys(answers).length}/{test.questions.length} answered)</button>
    </div>
  );
}
