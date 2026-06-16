import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SignOut() {
  const navigate = useNavigate();

  useEffect(() => {
    // Clear any stored auth data
    localStorage.clear();
    sessionStorage.clear();

    // Redirect after a short delay — change '/map' to '/login' once you add a login page
    const t = setTimeout(() => {
      navigate('/login', { replace: true });
    }, 1500);

    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <section style={{ textAlign: 'center', marginTop: '4rem' }}>
      <h1>Signing you out…</h1>
      <p>Please wait, you will be redirected shortly.</p>
    </section>
  );
}