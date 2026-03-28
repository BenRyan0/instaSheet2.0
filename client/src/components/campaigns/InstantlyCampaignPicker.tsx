import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { InstantlyCampaign } from '../../types';
import { tenantApi } from '../../api/client';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { LoadingScreen } from '../ui/Spinner';

interface InstantlyCampaignPickerProps {
  open: boolean;
  tenantId: string;
  excludeIds?: string[];
  onSelect: (campaigns: InstantlyCampaign[]) => void;
  onClose: () => void;
}

export const InstantlyCampaignPicker: React.FC<InstantlyCampaignPickerProps> = ({
  open,
  tenantId,
  excludeIds = [],
  onSelect,
  onClose,
}) => {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['instantly-campaigns', tenantId],
    queryFn: () => tenantApi.getInstantlyCampaigns(tenantId),
    enabled: open && !!tenantId,
    staleTime: 60_000,
  });

  const excludeSet = new Set(excludeIds);
  const all: InstantlyCampaign[] = (data?.data ?? []).filter((c) => !excludeSet.has(c.id));

  const campaigns = search.trim()
    ? all.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.id.toLowerCase().includes(search.toLowerCase()))
    : all;

  const allVisibleSelected = campaigns.length > 0 && campaigns.every((c) => selectedIds.has(c.id));

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        campaigns.forEach((c) => next.delete(c.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        campaigns.forEach((c) => next.add(c.id));
        return next;
      });
    }
  };

  const handleConfirm = () => {
    const chosen = all.filter((c) => selectedIds.has(c.id));
    onSelect(chosen);
    setSelectedIds(new Set());
    onClose();
  };

  const handleClose = () => {
    setSelectedIds(new Set());
    onClose();
  };

  const errMsg =
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (error as Error)?.message ||
    'Failed to load campaigns from Instantly';

  return (
    <Modal open={open} onClose={handleClose} title="Browse Instantly Campaigns" size="xl">
      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or ID…"
            className="w-full pl-9 pr-9 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {!isLoading && !isError && (
          <p className="mt-1 text-xs text-gray-400">
            {search.trim()
              ? `${campaigns.length} of ${all.length} available campaign${all.length !== 1 ? 's' : ''}`
              : `${all.length} unassigned campaign${all.length !== 1 ? 's' : ''}${excludeSet.size > 0 ? ` (${excludeSet.size} already assigned hidden)` : ''} — sorted newest first`}
          </p>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingScreen />
      ) : isError ? (
        <div className="text-center py-10">
          <p className="text-sm text-red-500 mb-3">{errMsg}</p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">
          {search.trim() ? `No campaigns match "${search}"` : 'No campaigns found in this Instantly account'}
        </div>
      ) : (
        <div className="overflow-y-auto max-h-[420px] -mx-6 px-6">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-3 py-2 w-8">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="text-left px-3 py-2 font-medium text-gray-500">Name</th>
                <th className="text-left px-3 py-2 font-medium text-gray-500">ID</th>
                <th className="text-left px-3 py-2 font-medium text-gray-500">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {campaigns.map((c) => {
                const checked = selectedIds.has(c.id);
                return (
                  <tr
                    key={c.id}
                    onClick={() => toggleOne(c.id)}
                    className={`cursor-pointer transition-colors ${checked ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleOne(c.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-3 py-3 font-medium text-gray-800 max-w-[220px] truncate">
                      {c.name}
                    </td>
                    <td className="px-3 py-3">
                      <code className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                        {c.id}
                      </code>
                    </td>
                    <td className="px-3 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(c.timestamp_created).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      {!isLoading && !isError && campaigns.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {selectedIds.size > 0
              ? `${selectedIds.size} campaign${selectedIds.size !== 1 ? 's' : ''} selected`
              : 'No campaigns selected'}
          </span>
          <Button onClick={handleConfirm} disabled={selectedIds.size === 0}>
            Confirm{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
          </Button>
        </div>
      )}
    </Modal>
  );
};
