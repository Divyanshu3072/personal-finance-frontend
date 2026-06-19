import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { IndianRupee } from 'lucide-react';

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [numAccounts, setNumAccounts] = useState<string>('');
  
  const [accountsData, setAccountsData] = useState<{ name: string; startingBalance: string }[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    const count = parseInt(numAccounts, 10);
    if (isNaN(count) || count < 1) {
      setError('Please enter a valid number of accounts (at least 1).');
      return;
    }
    setError(null);
    setAccountsData(Array.from({ length: count }, () => ({ name: '', startingBalance: '' })));
    setStep(2);
  };

  const handleAccountChange = (index: number, field: 'name' | 'startingBalance', value: string) => {
    const newData = [...accountsData];
    newData[index][field] = value;
    setAccountsData(newData);
  };

  const completeOnboarding = async () => {
    try {
      await api.put('/auth/me', { onboardingCompleted: true });
    } catch (err) {
      console.error('Failed to update onboarding status on backend. Using fallback.');
    }
    localStorage.setItem('onboardingCompleted', 'true');
    navigate('/dashboard');
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    await completeOnboarding();
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate
    for (let i = 0; i < accountsData.length; i++) {
      const acc = accountsData[i];
      if (!acc.name.trim()) {
        setError(`Account ${i + 1} name cannot be empty.`);
        return;
      }
      const bal = Number(acc.startingBalance);
      if (isNaN(bal) || acc.startingBalance === '') {
        setError(`Account ${i + 1} balance must be a valid number.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Create all accounts in parallel
      await Promise.all(
        accountsData.map(acc =>
          api.post('/accounts', {
            name: acc.name.trim(),
            startingBalance: Number(acc.startingBalance)
          })
        )
      );
      
      // Complete onboarding
      await completeOnboarding();

    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create accounts. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-notion-bg flex flex-col items-center justify-center p-4 font-sans text-notion-text">
      <div className="max-w-md w-full bg-white border border-notion-border rounded-xl p-8 shadow-sm">
        
        {step === 1 && (
          <div className="animate-pop">
            <h1 className="text-2xl font-bold mb-2">Welcome to your Tracker</h1>
            <p className="text-notion-muted text-sm mb-8">
              Let's set up your workspace by adding your bank accounts.
            </p>

            {error && (
              <div className="mb-4 text-sm text-notion-tag-red-text bg-notion-tag-red-bg p-3 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleStep1Submit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  How many bank accounts do you want to add?
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={numAccounts}
                  onChange={(e) => setNumAccounts(e.target.value)}
                  placeholder="e.g. 2"
                  className="w-full px-3 py-2 text-sm border border-notion-border rounded focus:border-notion-text outline-none"
                  required
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-notion-text text-white rounded px-4 py-2 text-sm font-medium hover:bg-opacity-90"
                >
                  Continue
                </button>
                <button
                  type="button"
                  onClick={handleSkip}
                  className="flex-1 border border-notion-border text-notion-muted rounded px-4 py-2 text-sm font-medium hover:bg-notion-hover"
                >
                  Skip for now
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 2 && (
          <div className="animate-pop">
            <h1 className="text-2xl font-bold mb-2">Account Details</h1>
            <p className="text-notion-muted text-sm mb-6">
              Enter the starting balances for your accounts. You can edit this later.
            </p>

            {error && (
              <div className="mb-4 text-sm text-notion-tag-red-text bg-notion-tag-red-bg p-3 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleStep2Submit} className="space-y-6">
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                {accountsData.map((acc, idx) => (
                  <div key={idx} className="p-4 border border-notion-border rounded-lg bg-notion-hover">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-notion-muted mb-3">
                      Account {idx + 1}
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <input
                          type="text"
                          placeholder="Account Name (e.g. HDFC Bank)"
                          value={acc.name}
                          onChange={(e) => handleAccountChange(idx, 'name', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-notion-border rounded focus:border-notion-text outline-none bg-white"
                          required
                        />
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <IndianRupee className="h-4 w-4 text-notion-muted" />
                        </div>
                        <input
                          type="number"
                          step="any"
                          placeholder="Current Balance"
                          value={acc.startingBalance}
                          onChange={(e) => handleAccountChange(idx, 'startingBalance', e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-sm border border-notion-border rounded focus:border-notion-text outline-none bg-white"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium border border-notion-border text-notion-muted rounded hover:bg-notion-hover disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 text-sm font-medium bg-notion-text text-white rounded hover:bg-opacity-90 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Finish Setup'}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
