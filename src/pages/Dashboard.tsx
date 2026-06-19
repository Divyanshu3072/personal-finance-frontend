import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

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

  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterAccount, setFilterAccount] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance !== undefined ? acc.balance : acc.startingBalance), 0);
  const totalIncoming = transactions.filter(t => t.type === 'INCOMING').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalOutgoing = transactions.filter(t => t.type === 'OUTGOING').reduce((sum, t) => sum + Number(t.amount), 0);
  const netCashflow = totalIncoming - totalOutgoing;

  const filteredTransactions = transactions.filter(tx => {
    const matchType = filterType === 'ALL' || tx.type === filterType;
    const matchAccount = filterAccount === 'ALL' || tx.accountId === filterAccount;
    const matchCategory = filterCategory === 'ALL' || tx.categoryId === filterCategory;
    const matchSearch = !searchQuery.trim() || tx.reason.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchAccount && matchCategory && matchSearch;
  });

  const getAccountName = (id: string) => accounts.find(a => a.id === id)?.name || id;
  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || id;

  return (
    <div className="min-h-screen bg-notion-bg font-sans text-notion-text p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-notion-border">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex items-center space-x-3 md:space-x-4">
            <Link
              to="/profile"
              className="text-sm font-medium text-notion-text hover:text-notion-muted transition-colors"
            >
              Profile
            </Link>
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
          <div className="space-y-8">
            
            {/* Summary Section */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-notion-border rounded-xl shadow-sm p-5">
                <p className="text-xs font-semibold text-notion-muted uppercase tracking-wider mb-1">Total Balance</p>
                <p className="text-xl md:text-2xl font-bold text-notion-text">{formatCurrency(totalBalance)}</p>
              </div>
              <div className="bg-white border border-notion-border rounded-xl shadow-sm p-5">
                <p className="text-xs font-semibold text-notion-muted uppercase tracking-wider mb-1">Total Incoming</p>
                <p className="text-xl md:text-2xl font-bold text-notion-tag-green-text">{formatCurrency(totalIncoming)}</p>
              </div>
              <div className="bg-white border border-notion-border rounded-xl shadow-sm p-5">
                <p className="text-xs font-semibold text-notion-muted uppercase tracking-wider mb-1">Total Outgoing</p>
                <p className="text-xl md:text-2xl font-bold text-notion-tag-red-text">{formatCurrency(totalOutgoing)}</p>
              </div>
              <div className="bg-white border border-notion-border rounded-xl shadow-sm p-5">
                <p className="text-xs font-semibold text-notion-muted uppercase tracking-wider mb-1">Net Cashflow</p>
                <p className={`text-xl md:text-2xl font-bold ${netCashflow >= 0 ? 'text-notion-tag-green-text' : 'text-notion-tag-red-text'}`}>
                  {netCashflow >= 0 ? '+' : ''}{formatCurrency(netCashflow)}
                </p>
              </div>
            </section>

            {/* Accounts Grid */}
            <section className="bg-white border border-notion-border rounded-xl shadow-sm p-6 md:p-8">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold">Bank Accounts</h2>
                <span className="text-xs bg-notion-tag-gray-bg text-notion-text px-2 py-1 rounded font-medium">
                  {accounts.length} Total
                </span>
              </div>
              
              {accounts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {accounts.map(acc => (
                    <div key={acc.id} className="border border-notion-border rounded-lg p-4 hover:border-notion-muted transition-colors bg-notion-bg/50">
                      <h3 className="font-medium text-sm truncate text-notion-text mb-1">{acc.name}</h3>
                      <p className="text-lg font-mono text-notion-text tracking-tight">
                        {formatCurrency(acc.balance !== undefined ? acc.balance : acc.startingBalance)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-notion-muted italic bg-notion-hover p-4 rounded text-center">
                  No accounts found. Go to Profile to add one.
                </p>
              )}
            </section>

            {/* Transactions Spreadsheet */}
            <section className="bg-white border border-notion-border rounded-xl shadow-sm p-6 md:p-8 flex flex-col">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
                <div>
                  <h2 className="text-lg font-semibold">Transactions Overview</h2>
                  <p className="text-sm text-notion-muted mt-1">Filter and review your complete transaction history.</p>
                </div>
                
                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    placeholder="Search reason..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-3 py-1.5 text-sm bg-white border border-notion-border rounded-md focus:border-notion-text outline-none w-full sm:w-auto min-w-[150px]"
                  />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-1.5 text-sm bg-white border border-notion-border rounded-md focus:border-notion-text outline-none"
                  >
                    <option value="ALL">All Types</option>
                    <option value="INCOMING">Incoming</option>
                    <option value="OUTGOING">Outgoing</option>
                  </select>
                  <select
                    value={filterAccount}
                    onChange={(e) => setFilterAccount(e.target.value)}
                    className="px-3 py-1.5 text-sm bg-white border border-notion-border rounded-md focus:border-notion-text outline-none max-w-[180px] truncate"
                  >
                    <option value="ALL">All Accounts</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-3 py-1.5 text-sm bg-white border border-notion-border rounded-md focus:border-notion-text outline-none max-w-[180px] truncate"
                  >
                    <option value="ALL">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Table */}
              {filteredTransactions.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-notion-border">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-notion-hover border-b border-notion-border">
                      <tr className="text-notion-muted text-xs font-semibold tracking-wide uppercase">
                        <th className="py-3 px-4 font-normal">Date</th>
                        <th className="py-3 px-4 font-normal">Reason</th>
                        <th className="py-3 px-4 font-normal">Category</th>
                        <th className="py-3 px-4 font-normal">Account</th>
                        <th className="py-3 px-4 font-normal">Flow</th>
                        <th className="py-3 px-4 font-normal text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-notion-border">
                      {filteredTransactions.map((tx: any) => (
                        <tr key={tx.id} className="hover:bg-notion-hover/50 transition-colors">
                          <td className="py-3 px-4 text-notion-muted">
                            {new Date(tx.timestamp || tx.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 font-medium text-notion-text truncate max-w-[200px]">
                            {tx.reason}
                          </td>
                          <td className="py-3 px-4 text-notion-text truncate max-w-[150px]">
                            {getCategoryName(tx.categoryId)}
                          </td>
                          <td className="py-3 px-4 text-notion-muted truncate max-w-[150px]">
                            {getAccountName(tx.accountId)}
                          </td>
                          <td className="py-3 px-4 text-xs">
                            {tx.type === 'INCOMING' ? (
                              <span className="bg-notion-tag-green-bg text-notion-tag-green-text px-1.5 py-0.5 rounded">In</span>
                            ) : (
                              <span className="bg-notion-tag-red-bg text-notion-tag-red-text px-1.5 py-0.5 rounded">Out</span>
                            )}
                          </td>
                          <td className={`py-3 px-4 text-right font-mono font-medium ${tx.type === 'INCOMING' ? 'text-green-600' : 'text-notion-text'}`}>
                            {tx.type === 'INCOMING' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center bg-notion-hover border border-notion-border rounded-lg flex flex-col items-center">
                  <p className="text-sm text-notion-text font-medium mb-1">
                    {transactions.length === 0 ? "No transactions yet." : "No transactions match your filters."}
                  </p>
                  <p className="text-sm text-notion-muted mb-4">
                    {transactions.length === 0 ? "Add your first transaction to get started." : "Try clearing your filters or search query."}
                  </p>
                  {transactions.length === 0 && (
                    <Link
                      to="/transactions/new"
                      className="text-sm font-medium bg-notion-text text-white px-4 py-2 rounded hover:bg-opacity-90 transition-opacity"
                    >
                      Add Transaction
                    </Link>
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
};
