
/**
 * AI Mock Interview Component
 * Conducts role-specific and company-specific mock interviews with
 * voice-based or typed answers, spoken questions, and real-time facial
 * emotion analysis through an external emotion service. Monitors interview
 * integrity, submits answers for AI-based evaluation, and displays scores,
 * feedback, and model answers after completion.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useIntegrity } from '../useIntegrity';

const STAGES = ['Introduction', 'Technical', 'Project', 'Behavioral', 'Closing'];
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const EMOTION_URL = import.meta.env.VITE_EMOTION_URL || 'http://localhost:8001';

export default function Interview() {
  const [params] = useSearchParams();
  const [roles, setRoles] = useState(['Software Engineer']);
  const [role, setRole] = useState('Software Engineer');
  const [company, setCompany] = useState(params.get('company') || '');
  const [companies, setCompanies] = useState([]);
  const [session, setSession] = useState(null);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [listening, setListening] = useState(false);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [cameraOk, setCameraOk] = useState(null);
  const [liveEmotion, setLiveEmotion] = useState(null);
  const [faceNote, setFaceNote] = useState('Starting camera…');
  const [alert, setAlert] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const recRef = useRef(null);
  const emotions = useRef({});
  const streamRef = useRef(null);
  const alertTimer = useRef(null);

  const showAlert = useCallback((event, message) => {
    setAlert({ event, message });
    clearTimeout(alertTimer.current);
    alertTimer.current = setTimeout(() => setAlert(null), 5000);
  }, []);

  const log = useIntegrity('interview', session?.interviewId, {
    active: !!session && !result,
    fullscreen: !!session && !result,
    onAlert: showAlert
  });

  useEffect(() => {
    api.get('/interview/roles').then((d) => setRoles(d.roles));
    api.get('/companies').then((d) => setCompanies(d.companies.map((c) => c.name)));
  }, []);

  useEffect(() => {
    if (!session || result) return;
    let stop = false;
    let timer;
    let lastNoFace = 0;
    let lastMulti = 0;
    let misses = 0;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: false
        });
        if (stop) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        stream.getVideoTracks()[0].addEventListener('ended', () => log('CAMERA_DISCONNECTED'));
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraOk(true);
        setFaceNote('Camera on · analysing emotion…');
      } catch (e) {
        console.error(e);
        setCameraOk(false);
        setFaceNote('Camera unavailable');
        return;
      }

      const tick = async () => {
        if (stop || !videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        if (video.readyState < 2) {
          timer = setTimeout(tick, 500);
          return;
        }
        try {
          const canvas = canvasRef.current;
          canvas.width = video.videoWidth || 320;
          canvas.height = video.videoHeight || 240;
          canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
          const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.7));
          if (!blob) {
            timer = setTimeout(tick, 1500);
            return;
          }
          const form = new FormData();
          form.append('file', blob, 'frame.jpg');
          const res = await fetch(`${EMOTION_URL}/analyze`, { method: 'POST', body: form });
          if (!res.ok) throw new Error('HTTP ' + res.status);
          const data = await res.json();
          const count = data.face_count ?? data.faces?.length ?? 0;

          if (count === 0) {
            misses += 1;
            setLiveEmotion(null);
            setFaceNote('No face detected');
            if (misses >= 2 && Date.now() - lastNoFace > 10000) {
              log('NO_FACE');
              lastNoFace = Date.now();
            }
          } else {
            misses = 0;
            if (count > 1) {
              setFaceNote('Multiple faces (' + count + ')');
              if (Date.now() - lastMulti > 10000) {
                log('MULTIPLE_FACES', { count });
                lastMulti = Date.now();
              }
            }
            const top = data.faces?.[0];
            const label = data.dominant || top?.emotion || 'neutral';
            const conf = Math.round((top?.confidence ?? 0) * 100);
            setLiveEmotion({ label, conf, faceCount: count });
            setFaceNote('Emotion: ' + label + ' (' + conf + '%)');
            emotions.current[label] = (emotions.current[label] || 0) + 1;
          }
        } catch (e) {
          console.warn('[emotion]', e?.message || e);
          setFaceNote('Emotion service offline — is :8001 running?');
        }
        timer = setTimeout(tick, 1500);
      };
      tick();
    })();

    return () => {
      stop = true;
      clearTimeout(timer);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [session, result, log]);

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      speechSynthesis.speak(new SpeechSynthesisUtterance(text));
    }
  };

  useEffect(() => {
    if (session && !result) speak(session.questions[idx].text);
    return () => speechSynthesis?.cancel();
  }, [session, idx, result]);

  function toggleVoice() {
    if (!SR) return setErr('Speech recognition not supported — type your answer.');
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = 'en-IN';
    rec.onresult = (e) =>
      setAnswer((a) =>
        (a + ' ' + Array.from(e.results).slice(e.resultIndex).map((r) => r[0].transcript).join(' ')).trim()
      );
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
    speechSynthesis.cancel();
  }

  async function start() {
    setErr('');
    setBusy(true);
    try {
      try {
        await document.documentElement.requestFullscreen?.();
      } catch {}
      const s = await api.post('/interview/start', { role, company: company || null });
      setSession(s);
      setIdx(0);
      setAnswer('');
      emotions.current = {};
      setLiveEmotion(null);
      setFaceNote('Starting camera…');
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function next() {
    recRef.current?.stop();
    setBusy(true);
    setErr('');
    try {
      await api.post(`/interview/${session.interviewId}/answer`, { index: idx, answer });
      if (idx + 1 < session.questions.length) {
        setIdx(idx + 1);
        setAnswer('');
      } else {
        if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
        const d = await api.post(`/interview/${session.interviewId}/finish`, {
          emotionSummary: emotions.current
        });
        setResult(d.interview);
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <>
        <h1>Interview complete</h1>
        <div className="grid g4">
          {[
            ['Overall', result.scores.overall],
            ['Technical', result.scores.technical],
            ['Communication', result.scores.communication],
            ['Confidence', result.scores.confidence]
          ].map(([l, v]) => (
            <div className="card stat" key={l}>
              <div className="eyebrow">{l}</div>
              <div className="num">
                {v}
                <small>/100</small>
              </div>
            </div>
          ))}
        </div>
        <p className="muted">
          Scored with {result.engine === 'llm' ? 'LLM' : result.engine === 'sbert' ? 'Sentence-BERT' : 'lexical'}.
          Confidence from emotion-service.
        </p>
        {result.questions.map((q, i) => (
          <div className="card" key={i} style={{ marginBottom: '.7rem' }}>
            <div className="eyebrow">
              {q.stage} · overall {q.scores?.overall ?? 0}/100
              {q.isCorrect != null && (
                <span style={{ marginLeft: 8, color: q.isCorrect ? 'var(--green)' : 'var(--red)' }}>
                  {q.isCorrect ? '✓ Correct' : '✗ Needs improvement'}
                </span>
              )}
            </div>
            <b>{q.text}</b>
            <p className="muted">
              <i>Your answer:</i> {q.answer || '—'}
            </p>
            <p className="mono" style={{ fontSize: '.75rem' }}>
              correctness {q.scores?.correctness} · relevance {q.scores?.relevance} · completeness{' '}
              {q.scores?.completeness} · clarity {q.scores?.clarity}
            </p>
            <p>{q.feedback}</p>
            <details>
              <summary className="muted">Model answer</summary>
              <p>{q.reference}</p>
            </details>
          </div>
        ))}
        <button className="btn" onClick={() => { setSession(null); setResult(null); }}>
          Back
        </button>
      </>
    );
  }

  if (!session) {
    return (
      <>
        <h1>AI mock interview</h1>
        <div className="row" style={{ margin: '1rem 0' }}>
          {STAGES.map((s, i) => (
            <div key={s} className="card" style={{ flex: 1, padding: '.6rem' }}>
              <div className="eyebrow">{String(i + 1).padStart(2, '0')}</div>
              {s}
            </div>
          ))}
        </div>
        <div className="card" style={{ maxWidth: 560 }}>
          <div className="grid g2">
            <div>
              <label>Job role / domain</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                {roles.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Target company</label>
              <select value={company} onChange={(e) => setCompany(e.target.value)}>
                <option value="">General (no company)</option>
                {companies.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <p>7 questions. Emotion via emotion-service (:8001). NLP scores on submit.</p>
        </div>
        {err && <div className="error">{err}</div>}
        <button className="btn primary" style={{ marginTop: '1rem' }} disabled={busy} onClick={start}>
          Start interview
        </button>
      </>
    );
  }

  const q = session.questions[idx];
  const last = idx === session.questions.length - 1;

  return (
    <div style={{ position: 'relative' }}>
      {alert && (
        <div
          role="alert"
          style={{
            position: 'fixed',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            background: '#7f1d1d',
            color: '#fff',
            padding: '0.75rem 1.25rem',
            borderRadius: 8,
            maxWidth: '90vw',
            fontSize: '0.9rem',
            fontWeight: 500
          }}
        >
          ⚠ {alert.message}
        </div>
      )}

      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div>
          <div className="stages">
            {session.questions.map((_, i) => (
              <i key={i} className={i <= idx ? 'on' : ''} />
            ))}
          </div>
          <div className="eyebrow">
            Stage · {q.stage} · Q{idx + 1}/{session.questions.length}
          </div>
          <h1 style={{ fontSize: '1.6rem' }}>{q.text}</h1>
          <button className="btn ghost" onClick={() => speak(q.text)}>
            Repeat question
          </button>
          <textarea
            style={{ marginTop: '1rem' }}
            placeholder="Speak or type your answer…"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onCopy={(e) => e.preventDefault()}
            onPaste={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
          />
          {err && <div className="error">{err}</div>}
          <div className="row" style={{ marginTop: '.8rem' }}>
            <button className="btn ghost" onClick={toggleVoice}>
              {listening ? '■ Stop recording' : '🎙 Answer by voice'}
            </button>
            <button className="btn primary" disabled={busy} onClick={next}>
              {busy ? 'Scoring…' : last ? 'Finish interview' : 'Submit & next'}
            </button>
          </div>
        </div>
        <div className="cam" style={{ alignSelf: 'start' }}>
          <video ref={videoRef} muted playsInline autoPlay style={{ display: cameraOk ? 'block' : 'none', width: '100%' }} />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div className="note">{faceNote}</div>
          {liveEmotion && (
            <div style={{ padding: '0.5rem 0.75rem', color: '#fff', fontSize: '0.85rem' }}>
              <b style={{ textTransform: 'capitalize' }}>{liveEmotion.label}</b>
              {' · '}
              {liveEmotion.conf}% · faces: {liveEmotion.faceCount}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}