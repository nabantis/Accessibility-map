import React, { useEffect, useRef } from 'react'
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from './contexts/AuthContext'

import './App.css'
import Navbar from './components/Navbar'
import Map from './pages/Map'
import Report from './pages/Reports'
import UserProfile from './pages/UserProfile'
import Moderation from './pages/Moderation'
import Notification from './pages/Notification'
import LogIn from './pages/LogIn'
import SignUp from './pages/SignUp'
import ModMap from './pages/modMap'

// High contrast mode: get from localStorage or user context
function useHighContrast() {
  const auth = useAuth();
  const user = auth?.user ?? null;
  // Try to get from localStorage (persisted), fallback to false
  const [highContrast, setHighContrast] = React.useState(() => {
    const stored = localStorage.getItem('highContrast');
    return stored === 'true';
  });
  // Listen for changes (e.g. from UserProfile)
  useEffect(() => {
    const handler = () => {
      const stored = localStorage.getItem('highContrast');
      setHighContrast(stored === 'true');
    };
    window.addEventListener('highContrastChanged', handler);
    return () => window.removeEventListener('highContrastChanged', handler);
  }, []);
  return highContrast;
}

function AuthLoadingScreen() {
  return (
    <div style={{
      height: '100%',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.95rem',
      color: '#94a3b8'
    }}>
      Checking session...
    </div>
  )
}

function ProtectedRoute({ children }) {
  const auth = useAuth() || {};
  const user = auth.user ?? null;
  const loading = auth.loading ?? false;
  if (loading) return <AuthLoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function ModeratorRoute({ children }) {
  const auth = useAuth() || {};
  const user = auth.user ?? null;
  const loading = auth.loading ?? false;
  const roleLoading = auth.roleLoading ?? false;
  const isModerator = auth.isModerator ?? false;
  if (loading || roleLoading) return <AuthLoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (!isModerator) return <Navigate to="/map" replace />
  return children
}

function App() {
  const scrollRef = useRef(null);
  const location = useLocation();

  const highContrast = useHighContrast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }

    const pageTitles = {
      '/login':        'Log In',
      '/signUp':       'Sign Up',
      '/map':          'Campus Map',
      '/userProfile':  'User Profile',
      '/report':       'New Report',
      '/moderation':   'Moderation',
      '/moderatorMap': 'Moderator Map',
      '/notification': 'Notifications',
    };
    document.title = (pageTitles[location.pathname] || 'Campus Map') + ' | AccessMap';
  }, [location.pathname]);

  const hideNavbar = location.pathname === '/login' || location.pathname === '/signUp';

  return (
    <div id="root" className={highContrast ? 'high-contrast' : ''} style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {!hideNavbar && <Navbar />}
      <main
        id="main-content"
        ref={scrollRef}
        tabIndex={-1}
        style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', width: '100%', display: 'flex', flexDirection: 'column', position: 'relative', outline: 'none' }}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/map" replace />} />

          {/* Normalise login URL — support both casings */}
          <Route path='/login' element={
            <div style={{ height: '100%', width: '100%' }}>
              <LogIn />
            </div>
          } />
          <Route path='/logIn' element={<Navigate to="/login" replace />} />

          <Route path='/signUp' element={
            <div style={{ height: '100%', width: '100%' }}>
              <SignUp />
            </div>
          } />

          <Route path="/map" element={
            <ProtectedRoute>
              <div style={{ height: '100%', width: '100%' }}>
                <Map />
              </div>
            </ProtectedRoute>
          } />

          <Route path="/userProfile" element={
            <ProtectedRoute>
              <div style={{ height: '100%', width: '100%' }}>
                <UserProfile />
              </div>
            </ProtectedRoute>
          } />

          <Route path="/report" element={
            <ProtectedRoute>
              <div style={{ height: '100%', width: '100%' }}>
                <Report />
              </div>
            </ProtectedRoute>
          } />

          {/* Moderator only — redirects non-moderators to /map */}
          <Route path="/moderation" element={
            <ModeratorRoute>
              <div style={{ height: '100%', width: '100%' }}>
                <Moderation />
              </div>
            </ModeratorRoute>
          } />

          <Route path="/moderatorMap" element={
            <ModeratorRoute>
              <div style={{ height: '100%', width: '100%' }}>
                <ModMap/>
              </div>
            </ModeratorRoute>
          } />

          <Route path="/notification" element={
            <ProtectedRoute>
              <div style={{ height: '100%', width: '100%' }}>
                <Notification />
              </div>
            </ProtectedRoute>
          } />

          {/* Catch-all — unknown routes go to map */}
          <Route path="*" element={<Navigate to="/map" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App