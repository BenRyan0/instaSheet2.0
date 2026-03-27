import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../api/client';
import { useAuth } from '../context/AuthContext';

type Mode = 'login' | 'signup' | 'request';

export const AuthPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [hasUsers, setHasUsers] = useState<boolean | null>(null);
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  // Check if any users exist to determine which flows are available
  useEffect(() => {
    authApi.status().then((res) => {
      const has = res.data.hasUsers;
      setHasUsers(has);
      setMode(has ? 'login' : 'signup');
    });
  }, []);

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    if ((mode === 'signup' || mode === 'request') && password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await authApi.login(username.trim(), password);
        login(res.data.token, res.data.username);
        toast.success(`Welcome back, ${res.data.username}!`);
        navigate('/', { replace: true });
      } else if (mode === 'signup') {
        const res = await authApi.register(username.trim(), password);
        login(res.data.token, res.data.username);
        toast.success('Account created! Welcome.');
        navigate('/', { replace: true });
      } else {
        await authApi.requestAccess(username.trim(), password);
        setRequestSent(true);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Something went wrong';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (hasUsers === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (requestSent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm text-center">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Request Sent</h2>
          <p className="text-sm text-gray-500 mb-6">
            Your access request has been submitted. An existing user will review and approve it shortly.
          </p>
          <button
            onClick={() => { setRequestSent(false); setMode('login'); setPassword(''); setConfirm(''); }}
            className="text-sm text-blue-600 hover:underline"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  const isSignupOrRequest = mode === 'signup' || mode === 'request';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">InstaSheet²</p>
            <p className="text-xs text-gray-400">Campaign Admin</p>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-gray-900 mb-1">
          {mode === 'login' && 'Sign in'}
          {mode === 'signup' && 'Create your account'}
          {mode === 'request' && 'Request access'}
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          {mode === 'login' && 'Enter your credentials to continue.'}
          {mode === 'signup' && 'You\'re the first user — set up your admin account.'}
          {mode === 'request' && 'Submit a request for an existing user to approve.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your-username"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
            />
          </div>

          {isSignupOrRequest && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading
              ? 'Please wait…'
              : mode === 'login'
              ? 'Sign in'
              : mode === 'signup'
              ? 'Create account'
              : 'Send request'}
          </button>
        </form>

        {/* Mode switcher */}
        <div className="mt-5 pt-5 border-t border-gray-100 text-center text-sm text-gray-500 space-y-2">
          {hasUsers && mode === 'login' && (
            <p>
              Don't have access?{' '}
              <button
                onClick={() => { setMode('request'); setPassword(''); setConfirm(''); }}
                className="text-blue-600 font-medium hover:underline"
              >
                Request access
              </button>
            </p>
          )}
          {hasUsers && mode === 'request' && (
            <p>
              Already have an account?{' '}
              <button
                onClick={() => { setMode('login'); setPassword(''); setConfirm(''); }}
                className="text-blue-600 font-medium hover:underline"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
