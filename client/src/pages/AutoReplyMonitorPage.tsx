import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { autoReplyRecordApi, campaignTypeApi } from '../api/client';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingScreen } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Pagination } from '../components/ui/Pagination';
import type { AutoReplyRecord } from '../types';

type StatusFilter = 'waiting' | 'replied' | 'all';
type FollowUpFilter = 'all' | 'none' | 'some';

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 1) {
    const mins = Math.floor(diffMs / 60_000);
    return mins <= 1 ? 'just now' : `${mins}m ago`;
  }
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const StatusBadge: React.FC<{ resolved: boolean }> = ({ resolved }) => (
  <span
    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
      resolved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
    }`}
  >
    {resolved ? 'Replied' : 'Waiting'}
  </span>
);

const AutoReplyMonitorPage: React.FC = () => {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('waiting');
  const [followUpFilter, setFollowUpFilter] = useState<FollowUpFilter>('all');
  const [sheetFilter, setSheetFilter] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  const resetPage = () => setPage(1);

  const queryParams = {
    ...(statusFilter !== 'all' ? { isResolved: statusFilter === 'replied' } : {}),
    ...(followUpFilter !== 'all' ? { hasFollowUps: followUpFilter === 'some' } : {}),
    ...(sheetFilter ? { sheetName: sheetFilter } : {}),
    limit: PAGE_SIZE,
    skip: (page - 1) * PAGE_SIZE,
  };

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['auto-reply-records', queryParams],
    queryFn: () => autoReplyRecordApi.getAll(queryParams),
  });

  const { data: campaignTypesData } = useQuery({
    queryKey: ['campaign-types'],
    queryFn: () => campaignTypeApi.getAll(),
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => autoReplyRecordApi.resolve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auto-reply-records'] });
      toast.success('Marked as replied');
    },
    onError: () => toast.error('Failed to update'),
  });

  const items: AutoReplyRecord[] = data?.items ?? [];
  const total = data?.total ?? 0;

  const sheetNames = Array.from(
    new Set((campaignTypesData?.data ?? []).map((ct) => ct.sheetName))
  ).sort();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Auto-Reply Monitor"
          subtitle={`${total} total${statusFilter !== 'all' ? ` · ${statusFilter}` : ''} · page ${page}`}
        />

        {/* Filters */}
        <div className="px-6 pb-4 flex flex-wrap items-center gap-3">
          {/* Status filter */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {(['waiting', 'replied', 'all'] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); resetPage(); }}
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

          {/* Follow-up filter */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {([
              { value: 'all', label: 'All follow-ups' },
              { value: 'none', label: 'No follow-up' },
              { value: 'some', label: 'Has follow-up' },
            ] as { value: FollowUpFilter; label: string }[]).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => { setFollowUpFilter(value); resetPage(); }}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  followUpFilter === value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Reload */}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            title="Reload"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <svg
              className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reload
          </button>

          {/* Sheet filter */}
          <select
            value={sheetFilter}
            onChange={(e) => { setSheetFilter(e.target.value); resetPage(); }}
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
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
            title="No auto-reply records"
            description={
              statusFilter === 'waiting'
                ? 'No leads are currently waiting for a reply.'
                : 'No records match the current filter.'
            }
          />
        ) : (
          <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Lead Email</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Sheet</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Auto-Reply Sent</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Subject</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Follow-Ups Sent</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Last Follow-Up</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((rec) => (
                  <tr key={rec._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                      {rec.lead_email}
                    </td>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                      {rec.sheetName}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs whitespace-nowrap">
                      {timeAgo(rec.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-xs max-w-xs truncate">
                      {rec.replySubject || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        rec.followUpCount > 0
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {rec.followUpCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs whitespace-nowrap">
                      {rec.lastFollowUpAt ? timeAgo(rec.lastFollowUpAt) : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge resolved={rec.isResolved} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!rec.isResolved && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => resolveMutation.mutate(rec._id)}
                          loading={
                            resolveMutation.isPending && resolveMutation.variables === rec._id
                          }
                        >
                          Mark Replied
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
          />
          </>
        )}
      </Card>
    </div>
  );
};

export default AutoReplyMonitorPage;
