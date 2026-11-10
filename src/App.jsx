import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Aptitude from './pages/Aptitude';
import Coding from './pages/Coding';
import Company from './pages/Company';
import Interview from './pages/Interview';
import ForYou from './pages/ForYou';
import Report from './pages/Report';
import Profile from './pages/Profile';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p style={{ padding: 40 }}>Loading…</p>;
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/aptitude" element={<Protected><Aptitude /></Protected>} />
      <Route path="/coding" element={<Protected><Coding /></Protected>} />
      <Route path="/company" element={<Protected><Company /></Protected>} />
      <Route path="/interview" element={<Protected><Interview /></Protected>} />
      <Route path="/for-you" element={<Protected><ForYou /></Protected>} />
      <Route path="/report" element={<Protected><Report /></Protected>} />
      <Route path="/profile" element={<Protected><Profile /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
