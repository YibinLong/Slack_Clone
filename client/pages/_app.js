/**
 * Next.js App component
 * This wraps all pages and provides global state and styles
 */

import '../styles/globals.css';
import { useEffect, useState } from 'react';
import { authAPI } from '../lib/auth';

export default function App({ Component, pageProps }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in when app loads
    const currentUser = authAPI.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  // Pass user state to all pages
  const props = {
    ...pageProps,
    user,
    setUser,
    loading
  };

  return <Component {...props} />;
}
