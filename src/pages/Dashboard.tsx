import React from 'react';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-notion-bg flex flex-col items-center justify-center p-4 font-sans text-notion-text">
      <div className="max-w-2xl w-full bg-white border border-notion-border rounded p-8 shadow-sm text-center">
        <h1 className="text-3xl font-bold mb-4">Welcome to your Dashboard</h1>
        <p className="text-notion-muted mb-8">You have successfully authenticated.</p>
        <button
          onClick={handleLogout}
          className="bg-white text-notion-tag-red-text border border-notion-border rounded px-4 py-2 text-sm font-medium hover:bg-notion-hover transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
};
