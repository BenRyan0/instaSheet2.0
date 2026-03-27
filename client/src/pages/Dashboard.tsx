import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { tenantApi, campaignTypeApi, campaignApi } from '../api/client';
import { LoadingScreen } from '../components/ui/Spinner';
import { LeadsStats } from '../components/stats/LeadsStats';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  to: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color, to }) => (
  <Link
    to={to}
    className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex items-center gap-4 hover:shadow-md transition-shadow group"
  >
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
    <div>
      <p className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
        {value}
      </p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  </Link>
);

const RecentRow: React.FC<{ name: string; slug?: string; active: boolean; date: string }> = ({
  name,
  slug,
  active,
  date,
}) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
    <div>
      <p className="text-sm font-medium text-gray-900">{name}</p>
      {slug && <p className="text-xs text-gray-400 font-mono">{slug}</p>}
    </div>
    <div className="flex items-center gap-4">
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
          active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-500' : 'bg-gray-400'}`} />
        {active ? 'Active' : 'Inactive'}
      </span>
      <span className="text-xs text-gray-400">{new Date(date).toLocaleDateString()}</span>
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const { data: tenantsData, isLoading: tLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => tenantApi.getAll(),
  });
  const { data: typesData, isLoading: ctLoading } = useQuery({
    queryKey: ['campaign-types'],
    queryFn: () => campaignTypeApi.getAll(),
  });
  const { data: campaignsData, isLoading: cLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => campaignApi.getAll(),
  });

  const isLoading = tLoading || ctLoading || cLoading;

  if (isLoading) return <LoadingScreen />;

  const tenants = tenantsData?.data ?? [];
  const types = typesData?.data ?? [];
  const campaigns = campaignsData?.data ?? [];

  const activeTenants = tenants.filter((t) => t.isActive).length;
  const activeTypes = types.filter((t) => t.isActive).length;
  const activeCampaigns = campaigns.filter((c) => c.isActive).length;

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          label="Total Tenants"
          value={tenants.length}
          to="/tenants"
          color="bg-blue-50"
          icon={
            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
        <StatCard
          label="Campaign Types"
          value={types.length}
          to="/campaign-types"
          color="bg-purple-50"
          icon={
            <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          }
        />
        <StatCard
          label="Campaigns"
          value={campaigns.length}
          to="/campaigns"
          color="bg-green-50"
          icon={
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          }
        />
      </div>

      {/* Active breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { label: 'Active Tenants', value: activeTenants, total: tenants.length, color: 'bg-blue-600' },
          { label: 'Active Types', value: activeTypes, total: types.length, color: 'bg-purple-600' },
          { label: 'Active Campaigns', value: activeCampaigns, total: campaigns.length, color: 'bg-green-600' },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-600">{item.label}</p>
              <p className="text-sm font-bold text-gray-900">
                {item.value} / {item.total}
              </p>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className={`${item.color} h-2 rounded-full transition-all`}
                style={{ width: item.total > 0 ? `${(item.value / item.total) * 100}%` : '0%' }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Leads statistics */}
      <LeadsStats />

      {/* Recent sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tenants */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Recent Tenants</h3>
            <Link to="/tenants" className="text-xs text-blue-600 hover:underline">
              View all →
            </Link>
          </div>
          <div className="px-6 py-2">
            {tenants.length === 0 ? (
              <p className="py-6 text-sm text-center text-gray-400">No tenants yet</p>
            ) : (
              tenants.slice(0, 5).map((t) => (
                <RecentRow key={t._id} name={t.name} slug={t.slug} active={t.isActive} date={t.createdAt} />
              ))
            )}
          </div>
        </div>

        {/* Recent Campaigns */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Recent Campaigns</h3>
            <Link to="/campaigns" className="text-xs text-blue-600 hover:underline">
              View all →
            </Link>
          </div>
          <div className="px-6 py-2">
            {campaigns.length === 0 ? (
              <p className="py-6 text-sm text-center text-gray-400">No campaigns yet</p>
            ) : (
              campaigns.slice(0, 5).map((c) => (
                <RecentRow
                  key={c._id}
                  name={c.name}
                  slug={c.campaignId}
                  active={c.isActive}
                  date={c.createdAt}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
