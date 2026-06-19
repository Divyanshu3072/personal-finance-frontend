import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { AccountForm } from '../components/AccountForm';

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

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      setError(null);
      
      const [accountsRes, categoriesRes, transactionsRes] = await Promise.all([
        api.get('/accounts'),
        api.get('/categories'),
        api.get('/transactions')
      ]);
      
      // Extract array from standard response structures if necessary, fallback to data itself
      setAccounts(Array.isArray(accountsRes.data) ? accountsRes.data : accountsRes.data.data || []);
      setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : categoriesRes.data.data || []);
      setTransactions(Array.isArray(transactionsRes.data) ? transactionsRes.data : transactionsRes.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load dashboard data.');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  const formatCurrency = (val: number | string | undefined) => {
    const num = Number(val || 0);
    if (isNaN(num)) return '₹0.00';
    return '₹' + num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="min-h-screen bg-notion-bg font-sans text-notion-text p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-notion-border">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <Link
              to="/transactions/new"
              className="text-sm font-medium bg-notion-text text-white px-3 py-1.5 rounded hover:bg-opacity-90 transition-opacity"
            >
              Add Transaction
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-notion-muted hover:text-notion-tag-red-text transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center space-x-3 text-notion-muted">
            <div className="w-5 h-5 border-2 border-notion-text border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium">Syncing workspace...</span>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-notion-tag-red-bg text-notion-tag-red-text p-4 rounded text-sm font-medium border border-[#fdebeb]">
            {error}
          </div>
        )}

        {/* Dashboard Content */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column: Accounts & Account Creation */}
            <div className="space-y-6">
              {/* Accounts Widget */}
              <div className="bg-white border border-notion-border rounded p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold">Accounts</h2>
                  <span className="text-xs bg-notion-tag-gray-bg text-notion-text px-2 py-1 rounded font-medium">
                    {accounts.length} Total
                  </span>
                </div>
                
                {accounts.length > 0 ? (
                  <ul className="space-y-1">
                    {accounts.map(acc => (
                      <li key={acc.id} className="flex items-center justify-between py-2.5 border-b border-notion-border last:border-0 hover:bg-notion-hover px-2 -mx-2 rounded transition-colors cursor-default">
                        <span className="font-medium text-sm truncate pr-4">{acc.name}</span>
                        <span className="text-sm font-mono text-notion-muted">
                          {formatCurrency(acc.balance !== undefined ? acc.balance : acc.startingBalance)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-notion-muted italic bg-notion-hover p-4 rounded text-center">No accounts found.</p>
                )}
              </div>

              {/* Account Creation Form */}
              <AccountForm onAccountCreated={() => fetchDashboardData(false)} />
            </div>

            {/* Right Column: Categories & Transactions Widget */}
            <div className="space-y-6">
              {/* Categories Widget */}
              <div className="bg-white border border-notion-border rounded p-6 shadow-sm flex flex-col h-fit">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold">Categories</h2>
                  <span className="text-xs bg-notion-tag-gray-bg text-notion-text px-2 py-1 rounded font-medium">
                    {categories.length} Total
                  </span>
                </div>
                
                {categories.length > 0 ? (
                  <ul className="grid grid-cols-2 gap-y-3 gap-x-4">
                    {categories.map(cat => (
                      <li key={cat.id} className="flex items-center space-x-2 text-sm text-notion-muted hover:text-notion-text transition-colors">
                        <div className="w-1.5 h-1.5 rounded-full bg-notion-text/40"></div>
                        <span className="truncate">{cat.name}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-notion-muted italic bg-notion-hover p-4 rounded text-center mt-auto mb-auto">No categories found.</p>
                )}
              </div>

              {/* Recent Transactions Widget */}
              <div className="bg-white border border-notion-border rounded p-6 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold">Recent Transactions</h2>
                  <span className="text-xs bg-notion-tag-gray-bg text-notion-text px-2 py-1 rounded font-medium">
                    {transactions.length} Total
                  </span>
                </div>
                
                {transactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead>
                        <tr className="border-b border-notion-border text-notion-muted text-xs font-semibold">
                          <th className="pb-2 pr-4 font-normal">Date</th>
                          <th className="pb-2 pr-4 font-normal">Reason</th>
                          <th className="pb-2 pr-4 font-normal text-right">Amount</th>
                          <th className="pb-2 font-normal">Flow</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-notion-border">
                        {transactions.slice(0, 10).map((tx: any) => (
                          <tr key={tx.id} className="hover:bg-notion-hover transition-colors">
                            <td className="py-2 pr-4 text-xs text-notion-muted">
                              {new Date(tx.timestamp || tx.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-2 pr-4 font-medium text-notion-text">
                              {tx.reason}
                            </td>
                            <td className={`py-2 pr-4 text-right font-mono ${tx.type === 'INCOMING' ? 'text-green-600' : 'text-notion-text'}`}>
                              {tx.type === 'INCOMING' ? '+' : '-'}{formatCurrency(tx.amount)}
                            </td>
                            <td className="py-2 text-xs">
                              {tx.type === 'INCOMING' ? (
                                <span className="bg-notion-tag-green-bg text-notion-tag-green-text px-1.5 py-0.5 rounded">In</span>
                              ) : (
                                <span className="bg-notion-tag-red-bg text-notion-tag-red-text px-1.5 py-0.5 rounded">Out</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-notion-muted italic bg-notion-hover p-4 rounded text-center">No transactions yet.</p>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
