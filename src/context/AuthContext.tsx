import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface BankAccount {
  id: string;
  userId: string;
  name: string;
  startingBalance: string | number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
}

export type TransactionType = 'INCOMING' | 'OUTGOING';

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  categoryId: string;
  amount: string | number;
  reason: string;
  type: TransactionType;
  timestamp: string;
  createdAt: string;
}

interface AuthContextType {
  token: string | null;
  userId: string | null;
  isAuthenticated: boolean;
  accounts: BankAccount[];
  categories: Category[];
  transactions: Transaction[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchAccounts: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  addAccount: (name: string, startingBalance: number) => Promise<BankAccount>;
  updateAccount: (id: string, name: string, startingBalance: number) => Promise<BankAccount>;
  deleteAccount: (id: string) => Promise<void>;
  addCategory: (name: string) => Promise<Category>;
  addTransaction: (accountId: string, categoryId: string, amount: number, reason: string, type: TransactionType) => Promise<Transaction>;
  updateTransaction: (id: string, accountId: string, categoryId: string, amount: number, reason: string, type: TransactionType) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  apiFetch: (path: string, options?: RequestInit) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const API_BASE = 'http://localhost:3000';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [userId, setUserId] = useState<string | null>(localStorage.getItem('auth_user_id'));
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Core API fetch wrapper that automatically appends Auth headers
  const apiFetch = useCallback(async (path: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    
    // Inject JWT token if available
    const currentToken = localStorage.getItem('auth_token');
    if (currentToken) {
      headers.set('Authorization', `Bearer ${currentToken}`);
    }
    
    if (options.body && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Clear auth on token expiration/invalid token
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user_id');
        setToken(null);
        setUserId(null);
      }
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error! status: ${response.status}`);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }, []);

  const fetchAccounts = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiFetch('/accounts');
      setAccounts(data);
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    }
  }, [token, apiFetch]);

  const fetchCategories = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiFetch('/categories');
      // Sort categories alphabetically
      const sorted = data.sort((a: Category, b: Category) => a.name.localeCompare(b.name));
      setCategories(sorted);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }, [token, apiFetch]);

  const fetchTransactions = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiFetch('/transactions');
      // Sort transactions by timestamp desc
      const sorted = data.sort((a: Transaction, b: Transaction) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
      setTransactions(sorted);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    }
  }, [token, apiFetch]);

  const addAccount = async (name: string, startingBalance: number): Promise<BankAccount> => {
    const newAccount = await apiFetch('/accounts', {
      method: 'POST',
      body: JSON.stringify({ name, startingBalance }),
    });
    setAccounts(prev => [...prev, newAccount]);
    return newAccount;
  };

  const updateAccount = async (id: string, name: string, startingBalance: number): Promise<BankAccount> => {
    const updated = await apiFetch(`/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, startingBalance }),
    });
    setAccounts(prev => prev.map(acc => acc.id === id ? updated : acc));
    return updated;
  };

  const deleteAccount = async (id: string): Promise<void> => {
    await apiFetch(`/accounts/${id}`, {
      method: 'DELETE',
    });
    setAccounts(prev => prev.filter(acc => acc.id !== id));
    // Also clean up local transactions belonging to this account
    setTransactions(prev => prev.filter(t => t.accountId !== id));
  };

  const addCategory = async (name: string): Promise<Category> => {
    // Avoid duplicates locally
    const trimmedName = name.trim().toLowerCase();
    const existing = categories.find(c => c.name.toLowerCase() === trimmedName);
    if (existing) return existing;

    const newCategory = await apiFetch('/categories', {
      method: 'POST',
      body: JSON.stringify({ name: trimmedName }),
    });
    
    setCategories(prev => {
      const updated = [...prev, newCategory];
      return updated.sort((a, b) => a.name.localeCompare(b.name));
    });
    return newCategory;
  };

  const addTransaction = async (
    accountId: string,
    categoryId: string,
    amount: number,
    reason: string,
    type: TransactionType
  ): Promise<Transaction> => {
    const newTx = await apiFetch('/transactions', {
      method: 'POST',
      body: JSON.stringify({ accountId, categoryId, amount, reason, type }),
    });
    setTransactions(prev => [newTx, ...prev]);
    return newTx;
  };

  const updateTransaction = async (
    id: string,
    accountId: string,
    categoryId: string,
    amount: number,
    reason: string,
    type: TransactionType
  ): Promise<Transaction> => {
    const updated = await apiFetch(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ accountId, categoryId, amount, reason, type }),
    });
    setTransactions(prev => prev.map(tx => tx.id === id ? updated : tx));
    return updated;
  };

  const deleteTransaction = async (id: string): Promise<void> => {
    await apiFetch(`/transactions/${id}`, {
      method: 'DELETE',
    });
    setTransactions(prev => prev.filter(tx => tx.id !== id));
  };

  const login = async (email: string, password: string) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_user_id', data.userId);
    setToken(data.token);
    setUserId(data.userId);
  };

  const register = async (email: string, password: string) => {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_user_id', data.userId);
    setToken(data.token);
    setUserId(data.userId);
  };

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user_id');
    setToken(null);
    setUserId(null);
    setAccounts([]);
    setCategories([]);
    setTransactions([]);
  }, []);

  // Fetch initial data when authenticated
  useEffect(() => {
    const bootstrap = async () => {
      if (token) {
        setIsLoading(true);
        await Promise.all([fetchAccounts(), fetchCategories(), fetchTransactions()]);
      }
      setIsLoading(false);
    };
    bootstrap();
  }, [token, fetchAccounts, fetchCategories, fetchTransactions]);

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider
      value={{
        token,
        userId,
        isAuthenticated,
        accounts,
        categories,
        transactions,
        isLoading,
        login,
        register,
        logout,
        fetchAccounts,
        fetchCategories,
        fetchTransactions,
        addAccount,
        updateAccount,
        deleteAccount,
        addCategory,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        apiFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
