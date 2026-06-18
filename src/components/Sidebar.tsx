import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, PlusCircle, LogOut, Wallet, X } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const formatCurrency = (val: number | string) => {
  const num = Number(val);
  if (isNaN(num)) return '₹0.00';
  return '₹' + num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setView,
  isOpen,
  setIsOpen
}) => {
  const { accounts, transactions, logout, userId } = useAuth();

  // Compute current balance for a single account
  const getAccountBalance = (accountId: string, startingBalance: string | number) => {
    const start = Number(startingBalance);
    const incoming = transactions
      .filter(t => t.accountId === accountId && t.type === 'INCOMING')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const outgoing = transactions
      .filter(t => t.accountId === accountId && t.type === 'OUTGOING')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    return start + incoming - outgoing;
  };

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/10 md:hidden transition-opacity duration-150"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 border-r border-notion-border bg-notion-bg text-notion-text transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between select-none font-sans`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Header */}
          <div className="p-4 flex items-center justify-between border-b border-notion-border">
            <div className="flex items-center space-x-2.5">
              <div className="w-6 h-6 rounded bg-notion-text text-white flex items-center justify-center font-bold text-sm">
                F
              </div>
              <span className="font-semibold text-sm tracking-tight truncate">
                Finance Workspace
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="md:hidden p-1 hover:bg-notion-hover rounded cursor-pointer"
            >
              <X className="w-4 h-4 text-notion-muted" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="p-3 space-y-1">
            <button
              onClick={() => {
                setView('dashboard');
                setIsOpen(false);
              }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-75 cursor-pointer ${
                currentView === 'dashboard'
                  ? 'bg-notion-hover text-notion-text'
                  : 'text-notion-muted hover:bg-notion-hover hover:text-notion-text'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => {
                setView('transaction-form');
                setIsOpen(false);
              }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-75 cursor-pointer ${
                currentView === 'transaction-form'
                  ? 'bg-notion-hover text-notion-text'
                  : 'text-notion-muted hover:bg-notion-hover hover:text-notion-text'
              }`}
            >
              <PlusCircle className="w-4 h-4 flex-shrink-0" />
              <span>New Transaction</span>
            </button>
          </div>

          {/* Accounts List Section */}
          <div className="flex-1 overflow-y-auto px-3 py-4 border-t border-notion-border">
            <div className="px-3 mb-2 text-xs font-semibold text-notion-muted uppercase tracking-wider">
              My Accounts
            </div>
            <div className="space-y-0.5">
              {accounts.map(acc => {
                const currentBalance = getAccountBalance(acc.id, acc.startingBalance);
                return (
                  <div
                    key={acc.id}
                    className="flex items-center justify-between px-3 py-2 rounded-md text-sm hover:bg-notion-hover transition-colors duration-75"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <Wallet className="w-3.5 h-3.5 text-notion-muted flex-shrink-0" />
                      <span className="truncate text-notion-text font-medium">
                        {acc.name}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-semibold text-notion-text ml-2 flex-shrink-0">
                      {formatCurrency(currentBalance)}
                    </span>
                  </div>
                );
              })}
              {accounts.length === 0 && (
                <div className="px-3 py-4 text-xs text-notion-muted italic">
                  No accounts loaded.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Profile & Logout */}
        <div className="p-4 border-t border-notion-border flex items-center justify-between">
          <div className="min-w-0 flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center font-semibold text-sm uppercase">
              {userId ? userId.substring(0, 2) : 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-xs text-notion-muted font-medium truncate">Logged in as</div>
              <div className="text-xs text-notion-text font-semibold truncate">Local User</div>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="p-1.5 hover:bg-notion-hover rounded text-notion-muted hover:text-red-600 transition-colors duration-150 cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  );
};
