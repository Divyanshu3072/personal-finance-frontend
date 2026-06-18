import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface AccountInput {
  name: string;
  startingBalance: string;
}

export const OnboardingFlow: React.FC = () => {
  const { addAccount, fetchAccounts } = useAuth();
  const [step, setStep] = useState<number>(1);
  const [numAccounts, setNumAccounts] = useState<number>(2);
  const [accountsInfo, setAccountsInfo] = useState<AccountInput[]>([
    { name: 'Checking Account', startingBalance: '50000' },
    { name: 'Savings Account', startingBalance: '150000' }
  ]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleNumAccountsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAccounts <= 0 || numAccounts > 10) {
      setError('Please select between 1 and 10 accounts.');
      return;
    }
    setError(null);

    // Prepare inputs array matching the count, preserving existing data if available
    const newInputs = Array.from({ length: numAccounts }, (_, idx) => {
      return accountsInfo[idx] || { name: `Account ${idx + 1}`, startingBalance: '0' };
    });
    setAccountsInfo(newInputs);
    setStep(2);
  };

  const handleAccountInfoChange = (index: number, field: keyof AccountInput, value: string) => {
    const updated = [...accountsInfo];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setAccountsInfo(updated);
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate inputs
    for (let i = 0; i < accountsInfo.length; i++) {
      if (!accountsInfo[i].name.trim()) {
        setError(`Please provide a name for Account ${i + 1}.`);
        return;
      }
      const balance = parseFloat(accountsInfo[i].startingBalance);
      if (isNaN(balance)) {
        setError(`Starting balance for ${accountsInfo[i].name || `Account ${i+1}`} must be a number.`);
        return;
      }
    }

    setLoading(true);
    try {
      // Sequentially create accounts to avoid race conditions
      for (const account of accountsInfo) {
        await addAccount(account.name.trim(), parseFloat(account.startingBalance));
      }
      // Re-trigger fetch to sync status
      await fetchAccounts();
    } catch (err: any) {
      setError(err.message || 'Failed to create accounts. Please check connection.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-notion-bg px-4 py-12 select-none">
      <div className="w-full max-w-md bg-white border border-notion-border rounded-xl p-8 shadow-sm">
        {/* Step Header */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs font-semibold text-notion-muted uppercase tracking-wider">
            Setup Wizard
          </span>
          <span className="text-xs font-medium text-notion-muted">
            Step {step} of 2
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-notion-hover rounded-full mb-8 overflow-hidden">
          <div
            className="h-full bg-notion-text transition-all duration-300 ease-out"
            style={{ width: step === 1 ? '50%' : '100%' }}
          ></div>
        </div>

        {error && (
          <div className="mb-6 p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleNumAccountsSubmit} className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-notion-text mb-2">
                Initialize Accounts
              </h2>
              <p className="text-sm text-notion-muted leading-relaxed">
                How many mock bank or ledger accounts would you like to set up for this testing space?
              </p>
            </div>

            <div>
              <label htmlFor="num-accounts" className="block text-xs font-medium text-notion-muted uppercase tracking-wider mb-2">
                Number of Accounts
              </label>
              <input
                id="num-accounts"
                type="number"
                min="1"
                max="10"
                value={numAccounts}
                onChange={(e) => setNumAccounts(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 text-sm bg-white border border-notion-border rounded-md focus:border-notion-text outline-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 bg-notion-text hover:bg-opacity-90 active:bg-opacity-100 text-white rounded-md text-sm font-medium transition-colors duration-150 flex items-center justify-center cursor-pointer"
            >
              Configure Details
            </button>
          </form>
        ) : (
          <form onSubmit={handleOnboardingSubmit} className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-notion-text mb-2">
                Configure Accounts
              </h2>
              <p className="text-sm text-notion-muted leading-relaxed">
                Name your mock accounts and set their starting numeric balances (₹).
              </p>
            </div>

            <div className="max-h-60 overflow-y-auto pr-1 space-y-4">
              {accountsInfo.map((acc, index) => (
                <div key={index} className="p-4 bg-notion-bg border border-notion-border rounded-lg space-y-3">
                  <div className="text-xs font-semibold text-notion-muted">
                    Account #{index + 1}
                  </div>
                  <div>
                    <label className="block text-xs text-notion-muted mb-1">
                      Account Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Wallet, Savings, Checking"
                      value={acc.name}
                      onChange={(e) => handleAccountInfoChange(index, 'name', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm bg-white border border-notion-border rounded-md focus:border-notion-text outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-notion-muted mb-1">
                      Starting Balance (₹)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={acc.startingBalance}
                      onChange={(e) => handleAccountInfoChange(index, 'startingBalance', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm bg-white border border-notion-border rounded-md focus:border-notion-text outline-none"
                      required
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={loading}
                className="w-1/3 py-2 px-4 border border-notion-border hover:bg-notion-hover text-notion-text rounded-md text-sm font-medium transition-colors duration-150 cursor-pointer disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 py-2 px-4 bg-notion-text hover:bg-opacity-90 active:bg-opacity-100 text-white rounded-md text-sm font-medium transition-colors duration-150 flex items-center justify-center cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  'Complete Setup'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
