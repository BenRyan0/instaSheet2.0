import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Overview of your multi-tenant campaigns' },
  '/tenants': { title: 'Tenants', subtitle: 'Manage company accounts and API credentials' },
  '/campaign-types': { title: 'Campaign Types', subtitle: 'Define campaign templates per tenant' },
  '/campaigns': { title: 'Campaigns', subtitle: 'Track and manage Instantly campaigns' },
};

export const Layout: React.FC = () => {
  const location = useLocation();
  const page = pageTitles[location.pathname] || { title: 'Mateker', subtitle: '' };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <h1 className="text-xl font-bold text-gray-900">{page.title}</h1>
          {page.subtitle && <p className="text-sm text-gray-500 mt-0.5">{page.subtitle}</p>}
        </header>
        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
