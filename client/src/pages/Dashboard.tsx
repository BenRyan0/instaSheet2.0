import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { tenantApi, campaignTypeApi, campaignApi, statsApi } from '../api/client';
import { LoadingScreen } from '../components/ui/Spinner';
import { LeadsStats } from '../components/stats/LeadsStats';
import type { Tenant, CampaignType } from '../types';

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

const SheetLinksSection: React.FC<{ tenants: Tenant[]; types: CampaignType[] }> = ({ tenants, types }) => {
  const [openId, setOpenId] = useState<string | null>(null);

  if (tenants.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-7 3a1 1 0 110 2 1 1 0 010-2zm-4 0a1 1 0 110 2 1 1 0 010-2zm8 0a1 1 0 110 2 1 1 0 010-2zM8 10h8v8H8v-8z" />
        </svg>
        <h3 className="text-sm font-semibold text-gray-900">Sheets Quick Access</h3>
      </div>
      <div className="grid grid-cols-3 items-start justify-start">
        {tenants.map((tenant) => {
          const tenantTypes = types.filter(
            (ct) => (typeof ct.tenant === 'string' ? ct.tenant : (ct.tenant as Tenant)._id) === tenant._id
          );
          const isOpen = openId === tenant._id;

          return (
            <div key={tenant._id} className="flex items-center justify-between gap-4 py-1 px-5">
              <span className="text-sm font-medium text-gray-700 truncate min-w-0 flex-1">{tenant.name}</span>
              <div className="relative w-44">
                <button
                  onClick={() => setOpenId(isOpen ? null : tenant._id)}
                  disabled={tenantTypes.length === 0 || !tenant.googleSheetId}
                  className="w-full flex items-center gap-2 text-sm border border-gray-300 rounded-lg px-3 py-1.5 hover:border-green-400 hover:bg-green-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 text-green-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18M3 15h18M9 3v18" />
                  </svg>
                  <span className="flex-1 text-left">{tenantTypes.length === 0 ? 'No sheets' : `${tenantTypes.length} sheet${tenantTypes.length > 1 ? 's' : ''}`}</span>
                  <svg className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isOpen && tenantTypes.length > 0 && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpenId(null)} />
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-full overflow-hidden ">
                      {tenantTypes.map((ct) => (
                        <a
                          key={ct._id}
                          href={`https://docs.google.com/spreadsheets/d/${tenant.googleSheetId}/edit`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setOpenId(null)}
                          className="flex items-center justify-start py-2 px-2 gap-5 hover:bg-gray-50 border-b border-gray-100 last:border-0 group"
                        >
                          {/* <span className="text-sm text-gray-800 group-hover:text-green-700 font-medium truncate">{ct.name}</span> */}
                          <span className="text-xs text-gray-400 font-mono shrink-0 px-1.5 py-0.5 rounded">{ct.sheetName}</span>
                        </a>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

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
  const { data: capacityData } = useQuery({
    queryKey: ['sending-capacity'],
    queryFn: () => statsApi.getSendingCapacity(),
    staleTime: 60_000,
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 ">
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

      {/* Sheets Quick Access */}
      <SheetLinksSection tenants={tenants} types={types} />

      {/* Sending Capacity */}
      {capacityData && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4 ">
          <div className="flex items-center justify-between ">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Sending Capacity Today</h3>
              <p className="text-xs text-gray-400 mt-0.5">{capacityData.dateStr} · {capacityData.capacity} emails / account limit</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {capacityData.totalUsed}
                <span className="text-sm font-normal text-gray-400"> / {capacityData.totalCapacity}</span>
              </p>
              <p className="text-xs text-gray-400">total sent today</p>
            </div>
          </div>

          {/* Total bar */}
          <div className="w-full bg-gray-100 rounded-full h-2.5 ">
            <div
              className={`h-2.5 rounded-full transition-all ${
                capacityData.totalCapacity > 0 && capacityData.totalUsed / capacityData.totalCapacity >= 0.9
                  ? 'bg-red-500'
                  : capacityData.totalCapacity > 0 && capacityData.totalUsed / capacityData.totalCapacity >= 0.7
                  ? 'bg-amber-500'
                  : 'bg-blue-600'
              }`}
              style={{
                width: capacityData.totalCapacity > 0
                  ? `${Math.min((capacityData.totalUsed / capacityData.totalCapacity) * 100, 100)}%`
                  : '0%',
              }}
            />
          </div>

          {/* Per-account breakdown */}
          {capacityData.accounts.length > 0 && (
            <div className="space-y-1.5 pt-1 max-h-64 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 2xl:grid-cols-5 ">
              {capacityData.accounts.map((a) => {
                const atLimit = a.used >= a.capacity;
                return (
                  <div key={a.accountEmail} className="flex items-center justify-between gap-3 px-2 ">
                    <p className="text-sm text-gray-600 truncate" title={a.accountEmail}>
                      {a.accountEmail}
                    </p>
                    <p className={`text-sm font-semibold shrink-0 ${atLimit ? 'text-red-600' : 'text-gray-500'}`}>
                      {a.used} / {a.capacity}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {capacityData.accounts.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-2">No emails sent today yet</p>
          )}
        </div>
      )}

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
