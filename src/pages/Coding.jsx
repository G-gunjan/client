/**
 * Coding Assessment Component
 * Displays DSA problems, provides a Monaco code editor for C++ and Java,
 * runs sample tests, submits solutions, and displays execution results.
 */
import { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { api } from '../api';
import { useIntegrity } from '../useIntegrity';

export default function Coding() {
  const [list, setList] = useState([]);
  const [problem, setProblem] = useState(null);
  const [lang, setLang] = useState('cpp');
  const [code, setCode] = useState('');
  const [out, setOut] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const load = () => api.get('/coding/problems').then((d) => setList(d.problems));
  useEffect(() => { load(); }, []);
  useIntegrity('coding', problem?._id, { active: !!problem });

  async function open(id) {
    const { problem: p } = await api.get(`/coding/problems/${id}`);
    setProblem(p); setLang('cpp'); setCode(p.starterCode.cpp); setOut(null); setErr('');
  }
  const switchLang = (l) => { setLang(l); setCode(problem.starterCode[l]); };

  async function exec(kind) {
    setBusy(true); setErr(''); setOut(null);
    try { setOut(await api.post(`/coding/problems/${problem._id}/${kind}`, { language: lang, code })); if (kind === 'submit') load(); }
    catch (e) { setErr(e.message); } finally { setBusy(false); }
  }

  if (!problem) return (
    <>
      <h1>DSA / Coding</h1>
      <p className="muted">Write solutions in C++ or Java. Code is compiled and run against hidden test cases on an external, sandboxed runner.</p>
      <div className="card">
        {list.map((p) => (
          <div key={p._id} className="list-row" onClick={() => open(p._id)}>
            <div><b>{p.title}</b><div className="muted mono" style={{ fontSize: '.75rem' }}>{p.topic}</div></div>
            <div className="mono muted">{p.difficulty} &nbsp; {p.bestPct}%</div>
          </div>
        ))}
      </div>
    </>
  );

  return (
    <>
      <button className="btn ghost" onClick={() => setProblem(null)}>← Problems</button>
      <div className="grid g2" style={{ marginTop: '1rem', alignItems: 'start' }}>
        <div className="card">
          <h1 style={{ fontSize: '1.5rem' }}>{problem.title}</h1>
          <div className="eyebrow">{problem.topic} · {problem.difficulty}</div>
          <p className="desc">{problem.description}</p>
        </div>
        <div>
          <div className="row" style={{ marginBottom: '.5rem' }}>
            <select style={{ width: 130 }} value={lang} onChange={(e) => switchLang(e.target.value)}><option value="cpp">C++</option><option value="java">Java</option></select>
            <button className="btn ghost" disabled={busy} onClick={() => exec('run')}>Run samples</button>
            <button className="btn primary" disabled={busy} onClick={() => exec('submit')}>Submit</button>
          </div>
          <div className="editor-wrap">
            <Editor height="380px" language={lang === 'cpp' ? 'cpp' : 'java'} value={code} onChange={(v) => setCode(v || '')} theme="vs-dark" options={{ minimap: { enabled: false }, fontSize: 13 }} />
          </div>
          {busy && <p className="muted">Running…</p>}
          {err && <div className="error">{err}</div>}
          {out && (
            <div className="card" style={{ marginTop: '.8rem' }}>
              <b className={out.status === 'Passed' ? 'good' : 'bad'}>{out.status}</b> — {out.passed}/{out.total} test cases passed
              {out.results.map((r, i) => (
                <div key={i} style={{ marginTop: '.4rem' }}>
                  <span className={r.ok ? 'good' : 'bad'}>{r.hidden ? 'Hidden' : 'Sample'} #{i + 1}: {r.status}</span>
                  {r.timeMs != null && <span className="muted"> · {r.timeMs}ms</span>}
                  {!r.ok && r.stderr && <pre className="out">{r.stderr}</pre>}
                  {!r.ok && !r.hidden && r.stdout != null && <pre className="out">got: {r.stdout}{'\n'}expected: {r.expected}</pre>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
