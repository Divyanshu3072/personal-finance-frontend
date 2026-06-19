import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Combobox } from './Combobox';
import { IndianRupee, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface Account {
  id: string;
  name: string;
  startingBalance: string | number;
}

interface Category {
  id: string;
  name: string;
}

interface TransactionFormProps {
  accounts: Account[];
  categories: Category[];
  onRefreshCategories: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ accounts, categories, onRefreshCategories }) => {
  const [accountId, setAccountId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [type, setType] = useState<'INCOMING' | 'OUTGOING'>('OUTGOING');
  const [categoryId, setCategoryId] = useState<string>('');
  const [transactionDate, setTransactionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!accountId) {
      setError('Please select an account.');
      return;
    }
    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid numeric amount greater than 0.');
      return;
    }
    if (!reason.trim()) {
      setError('Please provide a reason or description.');
      return;
    }
    if (!categoryId) {
      setError('Please select a category.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/transactions', {
        accountId,
        categoryId,
        amount: amountNum,
        reason: reason.trim(),
        type,
        transactionDate: new Date(transactionDate).toISOString()
      });
      
      setSuccess('Transaction added successfully!');
      setAmount('');
      setReason('');
      setCategoryId('');
      setAccountId('');
      setTransactionDate(new Date().toISOString().split('T')[0]);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to add transaction.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (name: string) => {
    try {
      const res = await api.post('/categories', { name });
      onRefreshCategories();
      const newCategoryId = res.data?.id || res.data?.data?.id;
      if (newCategoryId) {
        setCategoryId(newCategoryId);
      }
      return newCategoryId;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create category.');
      return null;
    }
  };

  return (
    <div className="w-full bg-white border border-notion-border rounded-xl shadow-sm p-6 md:p-8 font-sans select-none animate-pop">
      
      {error && (
        <div className="mb-6 p-3 text-sm text-notion-tag-red-text bg-notion-tag-red-bg border border-notion-tag-red-bg/25 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-3 text-sm text-notion-tag-green-text bg-notion-tag-green-bg border border-notion-tag-green-bg/25 rounded-md">
          {success}
          <div className="mt-2">
            <Link to="/dashboard" className="underline font-medium hover:text-green-800">Back to Dashboard</Link>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Account Selector */}
        <div>
          <label htmlFor="account" className="block text-xs font-semibold text-notion-muted uppercase tracking-wider mb-2">
            Bank Account
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
                {acc.name}
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
            Category
          </label>
          <Combobox
            categories={categories}
            selectedCategoryId={categoryId}
            onChange={setCategoryId}
            onCreateCategory={handleCreateCategory}
            placeholder="Search or add category..."
          />
        </div>

        {/* Transaction Date Input */}
        <div>
          <label htmlFor="transactionDate" className="block text-xs font-semibold text-notion-muted uppercase tracking-wider mb-2">
            Date
          </label>
          <input
            id="transactionDate"
            type="date"
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-notion-border rounded-md focus:border-notion-text outline-none"
            required
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
            placeholder="e.g. Weekly Groceries, Monthly Salary"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-notion-border rounded-md focus:border-notion-text outline-none"
            required
            maxLength={100}
          />
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-notion-border">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-notion-text hover:bg-opacity-90 active:bg-opacity-100 text-white rounded-md text-sm font-medium transition-colors duration-150 flex items-center justify-center cursor-pointer disabled:opacity-50"
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
