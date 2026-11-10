import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

const LINKS = [
  ['/dashboard', 'Dashboard'], ['/aptitude', 'Aptitude'], ['/coding', 'Coding'], ['/company', 'Company prep'],
  ['/interview', 'Mock interview'], ['/for-you', 'For you'], ['/report', 'Readiness report'], ['/profile', 'Profile']
];

export default function Layout({ children }) {
  const { logout } = useAuth();
  const nav = useNavigate();
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="logo">Place<span>Ready</span></div>
        {LINKS.map(([to, label]) => <NavLink key={to} to={to}>{label}</NavLink>)}
        <div className="spacer" />
        <button onClick={() => { logout(); nav('/login'); }}>Sign out</button>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
