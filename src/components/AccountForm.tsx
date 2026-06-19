import React, { useState } from 'react';
import api from '../api/axios';

interface AccountFormProps {
  onAccountCreated: () => void;
}

export const AccountForm: React.FC<AccountFormProps> = ({ onAccountCreated }) => {
  const [name, setName] = useState('');
  const [startingBalance, setStartingBalance] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Account name is required.');
      return;
    }

    const balanceNum = Number(startingBalance);
    if (startingBalance.trim() === '' || isNaN(balanceNum)) {
      setError('Starting balance must be a valid number.');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/accounts', {
        name: trimmedName,
        startingBalance: balanceNum,
      });

      setSuccess('Account created successfully!');
      setName('');
      setStartingBalance('');
      onAccountCreated();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-notion-border rounded p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Create Account</h2>
      
      {error && (
        <div className="mb-4 text-sm text-notion-tag-red-text bg-notion-tag-red-bg p-3 rounded border border-notion-tag-red-bg/25">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 text-sm text-notion-tag-green-text bg-notion-tag-green-bg p-3 rounded border border-notion-tag-green-bg/25">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-notion-muted mb-1" htmlFor="accountName">
            Account Name
          </label>
          <input
            id="accountName"
            type="text"
            placeholder="e.g. HDFC Bank"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-notion-border rounded px-3 py-2 text-sm text-notion-text focus:outline-none focus:border-notion-muted"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-notion-muted mb-1" htmlFor="startingBalance">
            Starting Balance
          </label>
          <input
            id="startingBalance"
            type="text"
            placeholder="e.g. 10000"
            value={startingBalance}
            onChange={(e) => setStartingBalance(e.target.value)}
            className="w-full border border-notion-border rounded px-3 py-2 text-sm text-notion-text focus:outline-none focus:border-notion-muted"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-notion-text text-white rounded px-4 py-2 text-sm font-medium hover:bg-opacity-90 transition-opacity disabled:opacity-50"
        >
          {isLoading ? 'Creating...' : 'Create Account'}
        </button>
      </form>
    </div>
  );
};
