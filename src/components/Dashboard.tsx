import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import type { BankAccount, Transaction, TransactionType } from '../context/AuthContext';
import { formatCurrency } from './Sidebar';
import { getCategoryColor } from './Combobox';
import { Search, Filter, Trash2, ArrowUpDown, Edit } from 'lucide-react';

interface EditingCell {
  txId: string;
  field: 'accountId' | 'categoryId' | 'amount' | 'reason' | 'type';
}

interface EditingAccount {
  accId: string;
  field: 'name' | 'startingBalance';
}

export const Dashboard: React.FC = () => {
  const {
    accounts,
    categories,
    transactions,
    updateAccount,
    deleteAccount,
    updateTransaction,
    deleteTransaction
  } = useAuth();

  // Search & Filtering States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterAccount, setFilterAccount] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');

  // Sorting States
  const [sortField, setSortField] = useState<string>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Inline Editing States
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  
  // Account Editing States
  const [editingAccount, setEditingAccount] = useState<EditingAccount | null>(null);
  const [editAccValue, setEditAccValue] = useState<string>('');

  // Compute individual account balances
  const accountBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    accounts.forEach(acc => {
      balances[acc.id] = Number(acc.startingBalance);
    });

    transactions.forEach(tx => {
      if (balances[tx.accountId] !== undefined) {
        if (tx.type === 'INCOMING') {
          balances[tx.accountId] += Number(tx.amount);
        } else {
          balances[tx.accountId] -= Number(tx.amount);
        }
      }
    });

    return balances;
  }, [accounts, transactions]);

  // Compute grand combined balance
  const combinedBalance = useMemo(() => {
    return Object.values(accountBalances).reduce((sum, bal) => sum + bal, 0);
  }, [accountBalances]);

  // Filter and Sort Transactions
  const processedTransactions = useMemo(() => {
    let result = [...transactions];

    // Search query check
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(tx => tx.reason.toLowerCase().includes(q));
    }

    // Account check
    if (filterAccount) {
      result = result.filter(tx => tx.accountId === filterAccount);
    }

    // Category check
    if (filterCategory) {
      result = result.filter(tx => tx.categoryId === filterCategory);
    }

    // Type check
    if (filterType) {
      result = result.filter(tx => tx.type === filterType);
    }

    // Sort
    result.sort((a, b) => {
      let aVal: any = a[sortField as keyof Transaction] || '';
      let bVal: any = b[sortField as keyof Transaction] || '';

      if (sortField === 'amount') {
        aVal = Number(a.amount);
        bVal = Number(b.amount);
      } else if (sortField === 'timestamp') {
        aVal = new Date(a.timestamp).getTime();
        bVal = new Date(b.timestamp).getTime();
      } else if (sortField === 'accountId') {
        const aAcc = accounts.find(acc => acc.id === a.accountId)?.name || '';
        const bAcc = accounts.find(acc => acc.id === b.accountId)?.name || '';
        aVal = aAcc.toLowerCase();
        bVal = bAcc.toLowerCase();
      } else if (sortField === 'categoryId') {
        const aCat = categories.find(cat => cat.id === a.categoryId)?.name || '';
        const bCat = categories.find(cat => cat.id === b.categoryId)?.name || '';
        aVal = aCat.toLowerCase();
        bVal = bCat.toLowerCase();
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [transactions, searchQuery, filterAccount, filterCategory, filterType, sortField, sortDirection, accounts, categories]);

  // Handle Sort Change
  const requestSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Inline Cell Editing Activation
  const startEditing = (txId: string, field: EditingCell['field'], currentValue: string | number) => {
    setEditingCell({ txId, field });
    setEditValue(String(currentValue));
  };

  const handleCellSave = async (tx: Transaction) => {
    if (!editingCell) return;
    const { txId, field } = editingCell;
    const val = editValue.trim();

    let accountId = tx.accountId;
    let categoryId = tx.categoryId;
    let amount = Number(tx.amount);
    let reason = tx.reason;
    let type = tx.type;

    if (field === 'reason') {
      if (!val) {
        setEditingCell(null);
        return;
      }
      reason = val;
    } else if (field === 'amount') {
      const num = parseFloat(val);
      if (isNaN(num) || num <= 0) {
        setEditingCell(null);
        return;
      }
      amount = num;
    } else if (field === 'type') {
      type = val as TransactionType;
    } else if (field === 'accountId') {
      accountId = val;
    } else if (field === 'categoryId') {
      categoryId = val;
    }

    try {
      await updateTransaction(txId, accountId, categoryId, amount, reason, type);
    } catch (err) {
      console.error('Failed to update transaction:', err);
    } finally {
      setEditingCell(null);
    }
  };

  // Keyboard navigation inside cell editors
  const handleCellKeyDown = (e: React.KeyboardEvent, tx: Transaction) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCellSave(tx);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  // Inline Account Editing Activation
  const startEditingAccount = (accId: string, field: EditingAccount['field'], value: string | number) => {
    setEditingAccount({ accId, field });
    setEditAccValue(String(value));
  };

  const handleAccountSave = async (acc: BankAccount) => {
    if (!editingAccount) return;
    const { accId, field } = editingAccount;
    const val = editAccValue.trim();

    let name = acc.name;
    let startingBalance = Number(acc.startingBalance);

    if (field === 'name') {
      if (!val) {
        setEditingAccount(null);
        return;
      }
      name = val;
    } else if (field === 'startingBalance') {
      const num = parseFloat(val);
      if (isNaN(num)) {
        setEditingAccount(null);
        return;
      }
      startingBalance = num;
    }

    try {
      await updateAccount(accId, name, startingBalance);
    } catch (err) {
      console.error('Failed to update account:', err);
    } finally {
      setEditingAccount(null);
    }
  };

  const handleAccountKeyDown = (e: React.KeyboardEvent, acc: BankAccount) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAccountSave(acc);
    } else if (e.key === 'Escape') {
      setEditingAccount(null);
    }
  };

  return (
    <div className="space-y-8 font-sans pb-16">
      {/* Top Banner - Calculated Combined Total */}
      <div className="bg-white border border-notion-border rounded-xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center shadow-sm select-none">
        <div className="mb-4 md:mb-0">
          <span className="text-xs font-semibold text-notion-muted uppercase tracking-wider">
            Combined Account Balance
          </span>
          <div className="text-4xl md:text-5xl font-bold tracking-tight text-notion-text font-mono mt-1">
            {formatCurrency(combinedBalance)}
          </div>
        </div>
        <div className="text-xs text-notion-muted leading-relaxed max-w-xs md:text-right">
          Interactive finance workspace. Click on cells in the transaction sheet or the account cards below to edit records in real time.
        </div>
      </div>

      {/* Accounts Breakdown Row */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-notion-muted uppercase tracking-wider px-1">
          Accounts Summary
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map(acc => {
            const currentBal = accountBalances[acc.id] || 0;
            const isEditingName = editingAccount?.accId === acc.id && editingAccount?.field === 'name';
            const isEditingBal = editingAccount?.accId === acc.id && editingAccount?.field === 'startingBalance';

            return (
              <div
                key={acc.id}
                className="bg-white border border-notion-border rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between group relative"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    {/* Account Name Header */}
                    {isEditingName ? (
                      <input
                        type="text"
                        value={editAccValue}
                        onChange={(e) => setEditAccValue(e.target.value)}
                        onBlur={() => handleAccountSave(acc)}
                        onKeyDown={(e) => handleAccountKeyDown(e, acc)}
                        className="text-sm font-semibold bg-white border border-notion-border rounded px-1.5 py-0.5 outline-none w-3/4"
                        autoFocus
                      />
                    ) : (
                      <div
                        onClick={() => startEditingAccount(acc.id, 'name', acc.name)}
                        className="text-sm font-semibold text-notion-text truncate hover:bg-notion-hover px-1 rounded cursor-pointer flex items-center"
                        title="Click to rename"
                      >
                        {acc.name}
                        <Edit className="w-3 h-3 text-notion-muted ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-100" />
                      </div>
                    )}

                    {/* Delete Account */}
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete account "${acc.name}"? All associated transactions will be removed.`)) {
                          deleteAccount(acc.id);
                        }
                      }}
                      className="text-notion-muted hover:text-red-600 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer"
                      title="Delete account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Starting Balance */}
                  <div className="text-xs text-notion-muted flex items-center space-x-1">
                    <span>Starting:</span>
                    {isEditingBal ? (
                      <input
                        type="number"
                        step="any"
                        value={editAccValue}
                        onChange={(e) => setEditAccValue(e.target.value)}
                        onBlur={() => handleAccountSave(acc)}
                        onKeyDown={(e) => handleAccountKeyDown(e, acc)}
                        className="text-xs bg-white border border-notion-border rounded px-1 outline-none w-20"
                        autoFocus
                      />
                    ) : (
                      <span
                        onClick={() => startEditingAccount(acc.id, 'startingBalance', acc.startingBalance)}
                        className="font-mono hover:bg-notion-hover px-1 rounded cursor-pointer"
                        title="Click to edit starting balance"
                      >
                        {formatCurrency(acc.startingBalance)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="border-t border-notion-border pt-3 mt-2 flex justify-between items-baseline">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-notion-muted">
                    Current Balance
                  </span>
                  <span className="text-lg font-bold font-mono text-notion-text">
                    {formatCurrency(currentBal)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Spreadsheet Operations Dashboard */}
      <div className="bg-white border border-notion-border rounded-xl shadow-sm overflow-hidden select-none">
        {/* Toolbar Filter & Sort Panel */}
        <div className="p-4 border-b border-notion-border flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4 justify-between items-stretch md:items-center bg-notion-bg">
          <div className="flex flex-1 flex-wrap gap-2 items-center">
            {/* Reason search */}
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-notion-muted" />
              <input
                type="text"
                placeholder="Search description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-notion-border rounded-md pl-9 pr-3 py-1.5 text-sm placeholder-notion-muted outline-none focus:border-notion-text"
              />
            </div>

            {/* Filter icon / label */}
            <div className="flex items-center space-x-1.5 text-xs text-notion-muted font-semibold uppercase tracking-wider px-2">
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
            </div>

            {/* Filter by Account */}
            <select
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
              className="bg-white border border-notion-border rounded-md px-2 py-1.5 text-xs font-medium text-notion-text outline-none cursor-pointer hover:bg-notion-hover"
            >
              <option value="">All Accounts</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>

            {/* Filter by Category */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-white border border-notion-border rounded-md px-2 py-1.5 text-xs font-medium text-notion-text outline-none cursor-pointer hover:bg-notion-hover"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            {/* Filter by Flow Type */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-white border border-notion-border rounded-md px-2 py-1.5 text-xs font-medium text-notion-text outline-none cursor-pointer hover:bg-notion-hover"
            >
              <option value="">All Flows</option>
              <option value="INCOMING">Incoming</option>
              <option value="OUTGOING">Outgoing</option>
            </select>

            {/* Clear filters */}
            {(searchQuery || filterAccount || filterCategory || filterType) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterAccount('');
                  setFilterCategory('');
                  setFilterType('');
                }}
                className="text-xs text-notion-muted hover:text-notion-text underline flex items-center cursor-pointer font-medium"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="flex items-center text-xs text-notion-muted font-medium justify-between md:justify-end">
            <span>Showing {processedTransactions.length} of {transactions.length} rows</span>
          </div>
        </div>

        {/* Spreadsheet Data Grid */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-notion-bg/60 border-b border-notion-border text-notion-muted text-xs font-semibold select-none">
                <th
                  onClick={() => requestSort('timestamp')}
                  className="p-3 w-32 cursor-pointer hover:bg-notion-hover transition-colors duration-75 select-none"
                >
                  <div className="flex items-center space-x-1">
                    <span>Date</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => requestSort('accountId')}
                  className="p-3 w-40 cursor-pointer hover:bg-notion-hover transition-colors duration-75 select-none"
                >
                  <div className="flex items-center space-x-1">
                    <span>Account</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => requestSort('categoryId')}
                  className="p-3 w-40 cursor-pointer hover:bg-notion-hover transition-colors duration-75 select-none"
                >
                  <div className="flex items-center space-x-1">
                    <span>Category</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => requestSort('reason')}
                  className="p-3 cursor-pointer hover:bg-notion-hover transition-colors duration-75 select-none"
                >
                  <div className="flex items-center space-x-1">
                    <span>Description / Reason</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => requestSort('type')}
                  className="p-3 w-28 cursor-pointer hover:bg-notion-hover transition-colors duration-75 select-none"
                >
                  <div className="flex items-center space-x-1">
                    <span>Flow</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => requestSort('amount')}
                  className="p-3 w-36 text-right cursor-pointer hover:bg-notion-hover transition-colors duration-75 select-none"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Amount</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3 w-16 text-center select-none">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-notion-border">
              {processedTransactions.map(tx => {
                const txDate = new Date(tx.timestamp).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                });

                const isEditingReason = editingCell?.txId === tx.id && editingCell?.field === 'reason';
                const isEditingAmount = editingCell?.txId === tx.id && editingCell?.field === 'amount';
                const isEditingType = editingCell?.txId === tx.id && editingCell?.field === 'type';
                const isEditingAccount = editingCell?.txId === tx.id && editingCell?.field === 'accountId';
                const isEditingCategory = editingCell?.txId === tx.id && editingCell?.field === 'categoryId';

                const targetAccount = accounts.find(acc => acc.id === tx.accountId);
                const targetCategory = categories.find(cat => cat.id === tx.categoryId);
                const tagCol = targetCategory ? getCategoryColor(targetCategory.name) : { bg: 'bg-stone-100', text: 'text-stone-700' };

                return (
                  <tr key={tx.id} className="hover:bg-notion-hover/40 transition-colors duration-75 group select-none">
                    
                    {/* Timestamp Cell */}
                    <td className="p-3 text-notion-muted text-xs font-medium">
                      {txDate}
                    </td>

                    {/* Account Cell */}
                    <td className="p-3">
                      {isEditingAccount ? (
                        <select
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleCellSave(tx)}
                          onKeyDown={(e) => handleCellKeyDown(e, tx)}
                          className="w-full text-xs bg-white border border-notion-border rounded p-1 outline-none"
                          autoFocus
                        >
                          {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                          ))}
                        </select>
                      ) : (
                        <div
                          onClick={() => startEditing(tx.id, 'accountId', tx.accountId)}
                          className="hover:bg-notion-hover px-1.5 py-0.5 rounded cursor-pointer text-xs font-semibold text-notion-text truncate max-w-[130px]"
                          title="Click to change account"
                        >
                          {targetAccount?.name || 'Unknown Account'}
                        </div>
                      )}
                    </td>

                    {/* Category Cell */}
                    <td className="p-3">
                      {isEditingCategory ? (
                        <select
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleCellSave(tx)}
                          onKeyDown={(e) => handleCellKeyDown(e, tx)}
                          className="w-full text-xs bg-white border border-notion-border rounded p-1 outline-none"
                          autoFocus
                        >
                          <option value="" disabled>Select category</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      ) : (
                        <div
                          onClick={() => startEditing(tx.id, 'categoryId', tx.categoryId)}
                          className="hover:bg-notion-hover px-1 rounded cursor-pointer inline-block"
                          title="Click to edit category tag"
                        >
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider ${tagCol.bg} ${tagCol.text}`}>
                            {targetCategory?.name || 'uncategorized'}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Reason / Description Cell */}
                    <td className="p-3">
                      {isEditingReason ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleCellSave(tx)}
                          onKeyDown={(e) => handleCellKeyDown(e, tx)}
                          className="w-full text-sm bg-white border border-notion-border rounded px-1.5 py-0.5 outline-none font-medium"
                          autoFocus
                        />
                      ) : (
                        <div
                          onClick={() => startEditing(tx.id, 'reason', tx.reason)}
                          className="hover:bg-notion-hover px-1.5 py-0.5 rounded cursor-pointer text-notion-text font-medium truncate max-w-[300px]"
                          title="Click to edit description"
                        >
                          {tx.reason}
                        </div>
                      )}
                    </td>

                    {/* Flow Type Cell */}
                    <td className="p-3">
                      {isEditingType ? (
                        <select
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleCellSave(tx)}
                          onKeyDown={(e) => handleCellKeyDown(e, tx)}
                          className="w-full text-xs bg-white border border-notion-border rounded p-1 outline-none"
                          autoFocus
                        >
                          <option value="OUTGOING">Outgoing</option>
                          <option value="INCOMING">Incoming</option>
                        </select>
                      ) : (
                        <div
                          onClick={() => startEditing(tx.id, 'type', tx.type)}
                          className="hover:bg-notion-hover px-1.5 py-0.5 rounded cursor-pointer inline-block text-xs font-semibold"
                          title="Click to toggle type"
                        >
                          {tx.type === 'INCOMING' ? (
                            <span className="text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Incoming</span>
                          ) : (
                            <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded-full">Outgoing</span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Amount Cell */}
                    <td className="p-3 text-right">
                      {isEditingAmount ? (
                        <input
                          type="number"
                          step="any"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleCellSave(tx)}
                          onKeyDown={(e) => handleCellKeyDown(e, tx)}
                          className="w-24 text-sm bg-white border border-notion-border rounded px-1.5 py-0.5 outline-none font-mono text-right"
                          autoFocus
                        />
                      ) : (
                        <div
                          onClick={() => startEditing(tx.id, 'amount', tx.amount)}
                          className={`hover:bg-notion-hover px-1.5 py-0.5 rounded cursor-pointer text-sm font-bold font-mono truncate ${
                            tx.type === 'INCOMING' ? 'text-green-600' : 'text-notion-text'
                          }`}
                          title="Click to edit amount"
                        >
                          {tx.type === 'INCOMING' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </div>
                      )}
                    </td>

                    {/* Deletion Cell */}
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          if (confirm('Delete this transaction permanently?')) {
                            deleteTransaction(tx.id);
                          }
                        }}
                        className="text-notion-muted hover:text-red-600 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer inline-flex"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>

                  </tr>
                );
              })}

              {processedTransactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-notion-muted italic">
                    No transactions match the filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
