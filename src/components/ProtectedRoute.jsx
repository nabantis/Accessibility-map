import { useAuth } from './hooks/useAuth'
import LogIn from '../pages/LogIn';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return user ? children : <LogIn />;
}