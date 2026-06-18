import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const Auth: React.FC = () => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    
    setError(null);
    setLoading(true);
    
    try {
      if (isRegister) {
        await register(email, password);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-notion-bg px-4 select-none">
      <div className="w-full max-w-sm bg-white border border-notion-border rounded-xl p-8 shadow-sm">
        {/* Title Section */}
        <div className="text-center mb-8">
          <div className="text-3xl mb-2 font-semibold tracking-tight text-notion-text">
            {isRegister ? 'Create workspace' : 'Welcome back'}
          </div>
          <p className="text-sm text-notion-muted">
            {isRegister ? 'Set up your local financial database' : 'Log in to access your ledger'}
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-xs font-medium text-notion-muted uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-notion-border rounded-md focus:border-notion-text transition-colors duration-150 outline-none"
              required
              autoComplete={isRegister ? 'username' : 'current-username'}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-notion-muted uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-notion-border rounded-md focus:border-notion-text transition-colors duration-150 outline-none"
              required
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-notion-text hover:bg-opacity-90 active:bg-opacity-100 text-white rounded-md text-sm font-medium transition-colors duration-150 flex items-center justify-center cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : isRegister ? (
              'Sign Up'
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer switch link */}
        <div className="mt-6 text-center text-xs text-notion-muted">
          <span>
            {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          </span>
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
              setEmail('');
              setPassword('');
            }}
            className="text-notion-text underline hover:text-black font-medium focus:outline-none"
          >
            {isRegister ? 'Sign in' : 'Create an account'}
          </button>
        </div>
      </div>
    </div>
  );
};
