
/**
 * Profile Component
 * Allows users to view and update their personal and academic details,
 * target job role, skills, graduation year, and experience level.
 * Saves the updated profile to the backend and refreshes the authenticated
 * user data after a successful update.
 */

import { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';

const ROLES = ['Software Engineer', 'Web Developer', 'Data Analyst'];

export default function Profile() {
  const { user, setUser } = useAuth();
  const [f, setF] = useState({ ...user, skills: (user.skills || []).join(', ') });
  const [msg, setMsg] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function save(e) {
    e.preventDefault();
    const { user: u } = await api.put('/auth/profile', {
      name: f.name, college: f.college, branch: f.branch, graduationYear: Number(f.graduationYear) || undefined,
      targetRole: f.targetRole, skills: f.skills, experience: f.experience
    });
    setUser(u); setMsg('Saved');
  }

  return (
    <>
      <h1>Profile</h1>
      <form className="card" style={{ maxWidth: 560 }} onSubmit={save}>
        <label>Name</label><input value={f.name || ''} onChange={set('name')} />
        <label>College</label><input value={f.college || ''} onChange={set('college')} />
        <div className="grid g2"><div><label>Branch</label><input value={f.branch || ''} onChange={set('branch')} /></div>
          <div><label>Graduation year</label><input type="number" value={f.graduationYear || ''} onChange={set('graduationYear')} /></div></div>
        <label>Target job role</label>
        <select value={f.targetRole || ''} onChange={set('targetRole')}><option value="">Select…</option>{ROLES.map((r) => <option key={r}>{r}</option>)}</select>
        <label>Skills (comma separated)</label><input value={f.skills} onChange={set('skills')} placeholder="Java, C++, SQL, React" />
        <label>Experience level</label>
        <select value={f.experience} onChange={set('experience')}>{['Fresher', '0-1 years', '1-3 years', '3+ years'].map((x) => <option key={x}>{x}</option>)}</select>
        <button className="btn primary" style={{ marginTop: '1rem' }}>Save profile</button> <span className="good">{msg}</span>
      </form>
    </>
  );
}
