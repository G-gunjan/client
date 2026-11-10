import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function ForYou() {
  const [d, setD] = useState(null);
  const [plan, setPlan] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch personalised recommendations
  useEffect(() => {
    let active = true;

    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await api.get('/recommendations');

        if (active) {
          setD(response);
        }
      } catch (err) {
        console.error('Recommendations API error:', err);

        if (active) {
          setError(
            err.response?.data?.message ||
            err.message ||
            'Failed to load recommendations.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchRecommendations();

    return () => {
      active = false;
    };
  }, []);

  // Generate AI study plan
  const generatePlan = async () => {
    try {
      setBusy(true);
      setError('');

      const response = await api.post('/report/plan');

      setPlan(response?.plan || 'No study plan was generated.');
    } catch (err) {
      console.error('Study plan API error:', err);

      setError(
        err.response?.data?.message ||
        err.message ||
        'Unable to generate study plan.'
      );
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <p>Loading recommendations...</p>;
  }

  if (error && !d) {
    return (
      <div className="card">
        <p className="muted">{error}</p>
        <button
          className="btn primary"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!d) {
    return <p>No recommendation data available.</p>;
  }

  const items = Array.isArray(d.items) ? d.items : [];

  return (
    <>
      <p className="eyebrow">Personalised for you</p>

      <div className="row between">
        <h1>What to practise next</h1>

        <button
          className="btn primary"
          disabled={busy}
          onClick={generatePlan}
        >
          {busy ? 'Generating...' : 'Generate AI study plan'}
        </button>
      </div>

      <p className="muted">
        Target: {d.target || 'Role not set'} ·
        {' '}
        {d.company || 'No company selected'}
      </p>

      {error && <p className="muted">{error}</p>}

      <div className="grid g2">
        {items.length > 0 ? (
          items.map((r, index) => (
            <Link
              key={r.title || index}
              to={r.link || '/'}
              className="card"
              style={{ textDecoration: 'none' }}
            >
              <b>{r.title || 'Practice recommendation'}</b>

              <div className="muted">
                {r.text || 'Continue practising to improve your skills.'}
              </div>
            </Link>
          ))
        ) : (
          <p className="muted">
            You're on track — keep practising.
          </p>
        )}
      </div>

      {plan && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h2>Your study plan</h2>
          <p className="desc">{plan}</p>
        </div>
      )}
    </>
  );
}
