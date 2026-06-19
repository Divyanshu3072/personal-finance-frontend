import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { TransactionForm } from '../components/TransactionForm';

interface Account {
  id: string;
  name: string;
  startingBalance: string | number;
  balance?: string | number;
}

interface Category {
  id: string;
  name: string;
}

export const AddTransaction: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDependencies = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [accountsRes, categoriesRes] = await Promise.all([
        api.get('/accounts'),
        api.get('/categories')
      ]);
      
      setAccounts(Array.isArray(accountsRes.data) ? accountsRes.data : accountsRes.data.data || []);
      setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : categoriesRes.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  return (
    <div className="min-h-screen bg-notion-bg font-sans text-notion-text p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between pb-4 border-b border-notion-border">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">New Transaction</h1>
          <Link
            to="/dashboard"
            className="text-sm font-medium text-notion-muted hover:text-notion-text transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>

        {isLoading && (
          <div className="flex items-center space-x-3 text-notion-muted">
            <div className="w-5 h-5 border-2 border-notion-text border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium">Loading dependencies...</span>
          </div>
        )}

        {error && !isLoading && (
          <div className="bg-notion-tag-red-bg text-notion-tag-red-text p-4 rounded text-sm font-medium border border-[#fdebeb]">
            {error}
          </div>
        )}

        {!isLoading && !error && (
          <TransactionForm 
            accounts={accounts} 
            categories={categories} 
            onRefreshCategories={fetchDependencies} 
          />
        )}
      </div>
    </div>
  );
};
