import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { SheetLeadCount, Tenant } from '../../types';
import { statsApi, tenantApi } from '../../api/client';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

const BAR_COLORS = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b',
  '#ef4444', '#06b6d4', '#ec4899', '#84cc16',
];

interface TooltipPayload {
  payload: SheetLeadCount;
}

const CustomTooltip: React.FC<{ active?: boolean; payload?: TooltipPayload[] }> = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-gray-900 mb-1">{d.campaignTypeName}</p>
      <p className="text-gray-500 text-xs mb-2">Sheet: <code className="bg-gray-100 px-1 rounded">{d.sheetName}</code></p>
      <p className="text-blue-600 font-bold">{d.leadCount.toLocaleString()} leads</p>
      {d.error && <p className="text-red-500 text-xs mt-1">{d.error}</p>}
    </div>
  );
};

export const LeadsStats: React.FC = () => {
  const [tenantFilter, setTenantFilter] = useState('');

  const { data: tenantsData } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => tenantApi.getAll(),
  });

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['stats-leads', tenantFilter],
    queryFn: () => statsApi.getLeads(tenantFilter || undefined),
    staleTime: 2 * 60 * 1000,
  });

  const tenants: Tenant[] = tenantsData?.data ?? [];
  const rows: SheetLeadCount[] = data?.data ?? [];

  const totalLeads = rows.reduce((sum, r) => sum + r.leadCount, 0);
  const errorsCount = rows.filter((r) => r.error).length;

  // Group by tenant for the table view
  const byTenant = tenants.reduce<Record<string, SheetLeadCount[]>>((acc, t) => {
    const items = rows.filter((r) => r.tenantId === t._id);
    if (items.length) acc[t.name] = items;
    return acc;
  }, {});

  const errMsg =
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (error as Error)?.message ||
    'Failed to load sheet statistics';

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Leads per Campaign Type</h3>
          <p className="text-xs text-gray-400 mt-0.5">Counts rows from each tenant's Google Sheet tab</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            options={[
              { value: '', label: 'All Tenants' },
              ...tenants.map((t) => ({ value: t._id, label: t.name })),
            ]}
            value={tenantFilter}
            onChange={(e) => setTenantFilter(e.target.value)}
            className="w-44"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="w-6 h-6 text-blue-500" />
            <span className="ml-3 text-sm text-gray-400">Reading Google Sheets…</span>
          </div>
        ) : isError ? (
          <div className="text-center py-12">
            <p className="text-sm text-red-500 mb-3">{errMsg}</p>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>Retry</Button>
          </div>
        ) : rows.length === 0 ? (
          <p className="text-center py-12 text-sm text-gray-400">
            No campaign types found{tenantFilter ? ' for this tenant' : ''}.
          </p>
        ) : (
          <div className="space-y-8">
            {/* Summary pills */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-blue-50 text-blue-700 rounded-lg px-4 py-2 text-sm font-medium">
                <span className="text-lg font-bold">{totalLeads.toLocaleString()}</span>
                <span className="text-blue-500">total leads</span>
              </div>
              <div className="flex items-center gap-2 bg-purple-50 text-purple-700 rounded-lg px-4 py-2 text-sm font-medium">
                <span className="text-lg font-bold">{rows.length}</span>
                <span className="text-purple-500">campaign types</span>
              </div>
              {errorsCount > 0 && (
                <div className="flex items-center gap-2 bg-red-50 text-red-700 rounded-lg px-4 py-2 text-sm font-medium">
                  <span className="text-lg font-bold">{errorsCount}</span>
                  <span className="text-red-500">sheet errors</span>
                </div>
              )}
            </div>

            {/* Bar chart */}
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={rows} margin={{ top: 4, right: 8, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="campaignTypeName"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  allowDecimals={false}
                  width={40}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
                <Bar dataKey="leadCount" radius={[4, 4, 0, 0]}>
                  {rows.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Per-tenant breakdown table */}
            {Object.entries(byTenant).map(([tenantName, items]) => (
              <div key={tenantName}>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">{tenantName}</p>
                <div className="rounded-lg border border-gray-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-4 py-2 font-medium text-gray-500">Campaign Type</th>
                        <th className="text-left px-4 py-2 font-medium text-gray-500">Sheet Tab</th>
                        <th className="text-right px-4 py-2 font-medium text-gray-500">Leads</th>
                        <th className="text-right px-4 py-2 font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {items.map((item) => (
                        <tr key={item.campaignTypeId} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-800">{item.campaignTypeName}</td>
                          <td className="px-4 py-3">
                            <code className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              {item.sheetName}
                            </code>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-gray-900">
                            {item.leadCount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {item.error ? (
                              <span className="inline-flex items-center gap-1 text-xs text-red-500"
                                title={item.error}>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                </svg>
                                Error
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                OK
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 border-t border-gray-200">
                        <td colSpan={2} className="px-4 py-2 text-xs font-semibold text-gray-500">Total</td>
                        <td className="px-4 py-2 text-right text-sm font-bold text-gray-900">
                          {items.reduce((s, i) => s + i.leadCount, 0).toLocaleString()}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
