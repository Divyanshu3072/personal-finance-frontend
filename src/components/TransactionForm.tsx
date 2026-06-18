import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Combobox } from './Combobox';
import { IndianRupee, ArrowLeft, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface TransactionFormProps {
  onSuccess: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onSuccess }) => {
  const { accounts, categories, addCategory, addTransaction } = useAuth();
  
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id || '');
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [type, setType] = useState<'INCOMING' | 'OUTGOING'>('OUTGOING');
  const [categoryId, setCategoryId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!accountId) {
      setError('Please select a mock account.');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid numeric amount greater than 0.');
      return;
    }
    if (!reason.trim()) {
      setError('Please provide a reason or description.');
      return;
    }
    if (!categoryId) {
      setError('Please select or create a category.');
      return;
    }

    setLoading(true);
    try {
      await addTransaction(
        accountId,
        categoryId,
        parseFloat(amount),
        reason.trim(),
        type
      );
      // Reset form and invoke success callback to return to dashboard
      setAmount('');
      setReason('');
      setCategoryId('');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to submit transaction.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (name: string) => {
    // Passes category creation down to global auth context
    return await addCategory(name);
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white border border-notion-border rounded-xl shadow-sm p-6 md:p-8 font-sans select-none animate-pop">
      {/* Form Header */}
      <div className="flex items-center space-x-3 mb-8">
        <button
          onClick={onSuccess}
          className="p-1 hover:bg-notion-hover rounded cursor-pointer transition-colors duration-75 text-notion-muted hover:text-notion-text"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-notion-text">
            Add Transaction
          </h2>
          <p className="text-xs text-notion-muted">
            Log a new mock entry into your database ledger
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Account Selector */}
        <div>
          <label htmlFor="account" className="block text-xs font-semibold text-notion-muted uppercase tracking-wider mb-2">
            Target Account
          </label>
          <select
            id="account"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full h-[38px] px-3 py-1.5 text-sm bg-white border border-notion-border rounded-md focus:border-notion-text outline-none cursor-pointer"
            required
          >
            <option value="" disabled>Select an account</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.name} (Starting: ₹{Number(acc.startingBalance).toFixed(2)})
              </option>
            ))}
          </select>
        </div>

        {/* Transaction Type Select */}
        <div>
          <label className="block text-xs font-semibold text-notion-muted uppercase tracking-wider mb-2">
            Flow Direction
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType('OUTGOING')}
              className={`flex items-center justify-center py-2 px-3 rounded-lg border text-sm font-medium transition-all duration-100 cursor-pointer ${
                type === 'OUTGOING'
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-notion-border bg-white text-notion-muted hover:bg-notion-hover hover:text-notion-text'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 mr-2" />
              Outgoing
            </button>
            <button
              type="button"
              onClick={() => setType('INCOMING')}
              className={`flex items-center justify-center py-2 px-3 rounded-lg border text-sm font-medium transition-all duration-100 cursor-pointer ${
                type === 'INCOMING'
                  ? 'border-green-200 bg-green-50 text-green-700'
                  : 'border-notion-border bg-white text-notion-muted hover:bg-notion-hover hover:text-notion-text'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4 mr-2" />
              Incoming
            </button>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label htmlFor="amount" className="block text-xs font-semibold text-notion-muted uppercase tracking-wider mb-2">
            Amount (₹)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <IndianRupee className="h-4 w-4 text-notion-muted" />
            </div>
            <input
              id="amount"
              type="number"
              step="any"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-notion-border rounded-md focus:border-notion-text outline-none"
              required
            />
          </div>
        </div>

        {/* Category Combobox */}
        <div>
          <label className="block text-xs font-semibold text-notion-muted uppercase tracking-wider mb-2">
            Category Tag
          </label>
          <Combobox
            categories={categories}
            selectedCategoryId={categoryId}
            onChange={setCategoryId}
            onCreateCategory={handleCreateCategory}
            placeholder="Search or select category..."
          />
        </div>

        {/* Reason / Description */}
        <div>
          <label htmlFor="reason" className="block text-xs font-semibold text-notion-muted uppercase tracking-wider mb-2">
            Reason / Description
          </label>
          <input
            id="reason"
            type="text"
            placeholder="e.g. Weekly Groceries, AWS Hosting, Monthly Salary"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-notion-border rounded-md focus:border-notion-text outline-none"
            required
            maxLength={100}
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex space-x-3 pt-4 border-t border-notion-border">
          <button
            type="button"
            onClick={onSuccess}
            className="w-1/3 py-2 px-4 border border-notion-border hover:bg-notion-hover text-notion-text rounded-md text-sm font-medium transition-colors duration-150 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-2/3 py-2 px-4 bg-notion-text hover:bg-opacity-90 active:bg-opacity-100 text-white rounded-md text-sm font-medium transition-colors duration-150 flex items-center justify-center cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              'Save Transaction'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
