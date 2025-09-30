/**
 * Home page - Landing/Login redirect
 * Redirects authenticated users to their workspace, shows landing for others
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { authAPI } from '../lib/auth';
import Link from 'next/link';

export default function Home({ user, loading }) {
  const router = useRouter();

  useEffect(() => {
    // Redirect authenticated users to their workspace
    if (!loading && user) {
      router.push('/workspace');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Welcome to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                Slack Clone
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              A real-time chat platform for teams. Create workspaces, join channels, 
              and communicate with your team instantly.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="btn-primary text-lg px-8 py-3">
                Get Started
              </Link>
              <Link href="/login" className="btn-secondary text-lg px-8 py-3">
                Sign In
              </Link>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="text-3xl mb-4">💬</div>
              <h3 className="text-xl font-semibold mb-2">Real-time Messaging</h3>
              <p className="text-gray-600">
                Send and receive messages instantly with WebSocket technology
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="text-3xl mb-4">🏢</div>
              <h3 className="text-xl font-semibold mb-2">Workspaces & Channels</h3>
              <p className="text-gray-600">
                Organize your team with workspaces and topic-based channels
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="text-3xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold mb-2">Secure Authentication</h3>
              <p className="text-gray-600">
                Your data is protected with JWT authentication and encrypted passwords
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
