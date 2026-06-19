import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { IndianRupee, Edit2, Trash2, Plus, AlertTriangle, X } from 'lucide-react';

interface Account {
  id: string;
  name: string;
  startingBalance: string | number;
  balance?: string | number;
}

export const Profile: React.FC = () => {
  const userId = localStorage.getItem('userId') || 'Unknown User';
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Add Account State
  const [isAdding, setIsAdding] = useState(false);
  const [addName, setAddName] = useState('');
  const [addBalance, setAddBalance] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Account State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editBalance, setEditBalance] = useState('');

  // Delete Account State
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const fetchAccounts = async (showLoader = true) => {
    try {
      if (showLoader) setIsLoading(true);
      setError(null);
      const res = await api.get('/accounts');
      setAccounts(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch accounts.');
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const formatCurrency = (val: number | string | undefined) => {
    const num = Number(val || 0);
    if (isNaN(num)) return '₹0.00';
    return '₹' + num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || isNaN(Number(addBalance))) return;
    
    setIsSubmitting(true);
    setError(null);
    try {
      await api.post('/accounts', {
        name: addName.trim(),
        startingBalance: Number(addBalance)
      });
      setAddName('');
      setAddBalance('');
      setIsAdding(false);
      showSuccess('Account added successfully.');
      await fetchAccounts(false);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to add account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditStart = (acc: Account) => {
    setEditingId(acc.id);
    setEditName(acc.name);
    setEditBalance(String(acc.startingBalance));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || isNaN(Number(editBalance)) || !editingId) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await api.put(`/accounts/${editingId}`, {
        name: editName.trim(),
        startingBalance: Number(editBalance)
      });
      setEditingId(null);
      showSuccess('Account updated successfully.');
      await fetchAccounts(false);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTrigger = (acc: Account) => {
    setDeletingAccount(acc);
    setDeleteConfirmText('');
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAccount || deleteConfirmText !== 'DELETE') return;

    setIsSubmitting(true);
    setError(null);
    try {
      await api.delete(`/accounts/${deletingAccount.id}`);
      setDeletingAccount(null);
      showSuccess('Account deleted successfully.');
      await fetchAccounts(false);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to delete account.');
      setDeletingAccount(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-notion-bg font-sans text-notion-text p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-notion-border">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Profile Settings</h1>
          <Link
            to="/dashboard"
            className="text-sm font-medium text-notion-muted hover:text-notion-text transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Global Messages */}
        {error && !isLoading && (
          <div className="bg-notion-tag-red-bg text-notion-tag-red-text p-4 rounded text-sm font-medium border border-[#fdebeb]">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="bg-notion-tag-green-bg text-notion-tag-green-text p-4 rounded text-sm font-medium border border-notion-tag-green-bg/25">
            {successMsg}
          </div>
        )}

        {/* Basic Profile Info */}
        <section className="bg-white border border-notion-border rounded-xl shadow-sm p-6 md:p-8">
          <h2 className="text-lg font-semibold mb-4">Account Information</h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-notion-muted uppercase tracking-wider mb-1">User ID</p>
              <p className="font-mono text-sm text-notion-text">{userId}</p>
            </div>
            <div className="p-3 bg-notion-hover rounded text-sm text-notion-muted italic border border-notion-border/50">
              Note: Basic profile editing (name, email password) will be added in a future update.
            </div>
          </div>
        </section>

        {/* Bank Accounts Management */}
        <section className="bg-white border border-notion-border rounded-xl shadow-sm p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">Bank Accounts</h2>
              <p className="text-sm text-notion-muted mt-1">Manage your tracked accounts and balances.</p>
            </div>
            {!isAdding && (
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center text-sm font-medium bg-notion-text text-white px-3 py-1.5 rounded hover:bg-opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Add Account
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="w-6 h-6 border-2 border-notion-text border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Add Account Form */}
              {isAdding && (
                <div className="border border-notion-border rounded-lg p-4 bg-notion-hover animate-pop">
                  <h3 className="text-sm font-semibold mb-3">Add New Account</h3>
                  <form onSubmit={handleAddSubmit} className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      placeholder="Account Name"
                      value={addName}
                      onChange={(e) => setAddName(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm bg-white border border-notion-border rounded-md focus:border-notion-text outline-none"
                      required
                    />
                    <div className="relative w-full sm:w-40">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <IndianRupee className="h-4 w-4 text-notion-muted" />
                      </div>
                      <input
                        type="number"
                        placeholder="Starting Bal."
                        value={addBalance}
                        onChange={(e) => setAddBalance(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-notion-border rounded-md focus:border-notion-text outline-none"
                        required
                        step="any"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-notion-text text-white rounded-md text-sm font-medium hover:bg-opacity-90 disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAdding(false)}
                        className="px-3 py-2 border border-notion-border text-notion-muted rounded-md hover:bg-notion-border/50 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Accounts List */}
              {accounts.length > 0 ? (
                <div className="border border-notion-border rounded-lg overflow-hidden">
                  {accounts.map((acc, idx) => (
                    <div key={acc.id} className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 ${idx !== accounts.length - 1 ? 'border-b border-notion-border' : ''}`}>
                      
                      {editingId === acc.id ? (
                        <form onSubmit={handleEditSubmit} className="flex flex-col sm:flex-row gap-3 w-full animate-pop">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 px-3 py-2 text-sm bg-white border border-notion-border rounded-md focus:border-notion-text outline-none"
                            required
                          />
                          <input
                            type="number"
                            value={editBalance}
                            onChange={(e) => setEditBalance(e.target.value)}
                            className="w-full sm:w-32 px-3 py-2 text-sm bg-white border border-notion-border rounded-md focus:border-notion-text outline-none"
                            required
                            step="any"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="px-3 py-2 bg-notion-text text-white rounded-md text-sm font-medium hover:bg-opacity-90 disabled:opacity-50"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="p-2 border border-notion-border text-notion-muted rounded-md hover:bg-notion-border/50"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div>
                            <h3 className="font-medium text-sm text-notion-text">{acc.name}</h3>
                            <p className="text-xs text-notion-muted mt-0.5 font-mono">
                              Starting Balance: {formatCurrency(acc.startingBalance)}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleEditStart(acc)}
                              className="p-1.5 text-notion-muted hover:text-notion-text hover:bg-notion-hover rounded transition-colors"
                              title="Edit Account"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTrigger(acc)}
                              className="p-1.5 text-notion-muted hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete Account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      )}

                    </div>
                  ))}
                </div>
              ) : (
                !isAdding && (
                  <div className="p-8 text-center bg-notion-hover border border-notion-border rounded-lg">
                    <p className="text-sm text-notion-muted">You haven't added any accounts yet.</p>
                  </div>
                )
              )}
            </div>
          )}
        </section>

      </div>

      {/* Strict Delete Confirmation Modal */}
      {deletingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-notion-text/20 backdrop-blur-sm animate-pop">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-notion-border">
            <div className="flex items-center text-red-600 mb-4">
              <AlertTriangle className="w-6 h-6 mr-2" />
              <h2 className="text-lg font-bold">Danger Zone</h2>
            </div>
            
            <p className="text-sm text-notion-text font-medium mb-2">
              You are about to delete <span className="font-bold">"{deletingAccount.name}"</span>.
            </p>
            <p className="text-sm text-notion-muted mb-6 leading-relaxed">
              This will permanently delete this bank account <strong className="text-red-600">and all transactions linked to it</strong>. This action cannot be undone.
            </p>

            <div className="mb-6">
              <label className="block text-xs font-semibold text-notion-muted uppercase mb-2">
                Type <span className="text-red-600 font-bold select-none">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 text-sm bg-white border border-notion-border rounded-md focus:border-red-400 focus:ring-1 focus:ring-red-400 outline-none transition-all"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeletingAccount(null)}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium border border-notion-border rounded-md hover:bg-notion-hover text-notion-text transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteConfirmText !== 'DELETE' || isSubmitting}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300 transition-colors flex items-center"
              >
                {isSubmitting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
