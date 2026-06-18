import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const response = await api.post('/auth/register', { email, password });
      
      if (response.data && response.data.token) {
        const { token, userId } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('userId', userId);
        navigate('/dashboard');
      } else {
        // Backend returned 200 but without a token (soft error)
        throw new Error(response.data?.message || 'Registration failed.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-notion-bg flex flex-col items-center justify-center p-4 font-sans">
      <div className="max-w-sm w-full bg-white border border-notion-border rounded p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-notion-text mb-6">Sign up</h1>
        
        {error && (
          <div className="mb-4 text-sm text-notion-tag-red-text bg-notion-tag-red-bg p-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-notion-muted mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-notion-border rounded px-3 py-2 text-sm text-notion-text focus:outline-none focus:border-notion-muted"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-notion-muted mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-notion-border rounded px-3 py-2 text-sm text-notion-text focus:outline-none focus:border-notion-muted"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-notion-text text-white rounded px-4 py-2 text-sm font-medium hover:bg-opacity-90 transition-opacity disabled:opacity-50"
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-notion-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-notion-text hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
};
