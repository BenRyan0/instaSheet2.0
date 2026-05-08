import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { dataRequestApi, campaignTypeApi } from '../api/client';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingScreen } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import type { DataRequest } from '../types';

type StatusFilter = 'pending' | 'resolved' | 'all';

const StatusBadge: React.FC<{ resolved: boolean }> = ({ resolved }) => (
  <span
    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
      resolved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
    }`}
  >
    {resolved ? 'Resolved' : 'Pending'}
  </span>
);

const FieldBadges: React.FC<{ fields: string[] }> = ({ fields }) => (
  <div className="flex flex-wrap gap-1">
    {fields.map((f) => (
      <span key={f} className="inline-flex px-1.5 py-0.5 rounded text-xs bg-red-50 text-red-600 font-medium">
        {f}
      </span>
    ))}
  </div>
);

const DataRequestsPage: React.FC = () => {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [sheetFilter, setSheetFilter] = useState('');

  const queryParams = {
    ...(statusFilter !== 'all' ? { isResolved: statusFilter === 'resolved' } : {}),
    ...(sheetFilter ? { sheetName: sheetFilter } : {}),
    limit: 200,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['data-requests', queryParams],
    queryFn: () => dataRequestApi.getAll(queryParams),
  });

  // Fetch campaign types just to populate the sheet name filter dropdown
  const { data: campaignTypesData } = useQuery({
    queryKey: ['campaign-types'],
    queryFn: () => campaignTypeApi.getAll(),
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => dataRequestApi.resolve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['data-requests'] });
      toast.success('Marked as resolved');
    },
    onError: () => toast.error('Failed to resolve'),
  });

  const items: DataRequest[] = data?.items ?? [];
  const total = data?.total ?? 0;

  // Unique sheet names from campaign types for the filter dropdown
  const sheetNames = Array.from(
    new Set((campaignTypesData?.data ?? []).map((ct) => ct.sheetName))
  ).sort();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Data Requests"
          subtitle={`${total} total${statusFilter !== 'all' ? ` · showing ${statusFilter}` : ''}`}
        />

        {/* Filters */}
        <div className="px-6 pb-4 flex flex-wrap items-center gap-3">
          {/* Status filter */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {(['pending', 'resolved', 'all'] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                  statusFilter === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Sheet filter */}
          <select
            value={sheetFilter}
            onChange={(e) => setSheetFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Sheets</option>
            {sheetNames.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <LoadingScreen />
        ) : items.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="No data requests"
            description={
              statusFilter === 'pending'
                ? 'No pending data requests.'
                : 'No data requests match the current filter.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Lead Email</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Sheet</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Row #</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Missing Fields</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Sent From</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Sent At</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Resolved At</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((req) => (
                  <tr key={req._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                      {req.lead_email}
                    </td>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                      {req.sheetName}
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-center">
                      {req.sheetRowNumber}
                    </td>
                    <td className="px-6 py-4">
                      {req.requestedFields.length > 0 ? (
                        <FieldBadges fields={req.requestedFields} />
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs whitespace-nowrap">
                      {req.emailAccount || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge resolved={req.isResolved} />
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(req.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs whitespace-nowrap">
                      {req.isResolved ? new Date(req.updatedAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!req.isResolved && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => resolveMutation.mutate(req._id)}
                          loading={
                            resolveMutation.isPending && resolveMutation.variables === req._id
                          }
                        >
                          Mark Resolved
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default DataRequestsPage;
