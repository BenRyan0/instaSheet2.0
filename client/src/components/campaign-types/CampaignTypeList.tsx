import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type { CampaignType, Tenant } from '../../types';
import { campaignTypeApi, tenantApi } from '../../api/client';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Card, CardHeader } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { LoadingScreen } from '../ui/Spinner';
import { Select } from '../ui/Select';
import { Pagination } from '../ui/Pagination';
import { CampaignTypeForm } from './CampaignTypeForm';

interface CampaignTypeListProps {
  fixedTenantId?: string;
}

export const CampaignTypeList: React.FC<CampaignTypeListProps> = ({ fixedTenantId }) => {
  const qc = useQueryClient();
  const [tenantFilter, setTenantFilter] = useState(fixedTenantId ?? '');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CampaignType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CampaignType | null>(null);

  const { data: tenantsData } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => tenantApi.getAll(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['campaign-types', tenantFilter],
    queryFn: () => campaignTypeApi.getAll(tenantFilter || undefined),
  });

  const createMutation = useMutation({
    mutationFn: campaignTypeApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaign-types'] });
      toast.success('Campaign type created');
      setCreateOpen(false);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message || 'Failed to create campaign type');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CampaignType> }) =>
      campaignTypeApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaign-types'] });
      toast.success('Campaign type updated');
      setEditTarget(null);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message || 'Failed to update campaign type');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => campaignTypeApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaign-types'] });
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign type deleted');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Failed to delete campaign type'),
  });

  const tenants: Tenant[] = tenantsData?.data ?? [];
  const allTypes = data?.data ?? [];
  const campaignTypes = search.trim()
    ? allTypes.filter((ct) => {
        const q = search.toLowerCase();
        return ct.name.toLowerCase().includes(q) || ct.sheetName.toLowerCase().includes(q);
      })
    : allTypes;

  const handleSearch = (q: string) => { setSearch(q); setPage(1); };

  const paged = campaignTypes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const getTenantName = (ct: CampaignType) => {
    if (typeof ct.tenant === 'object' && ct.tenant !== null) {
      return (ct.tenant as Tenant).name;
    }
    return tenants.find((t) => t._id === ct.tenant)?.name ?? '—';
  };

  return (
    <>
      <Card>
        <CardHeader
          title="Campaign Types"
          subtitle={
            search.trim()
              ? `${campaignTypes.length} of ${allTypes.length} type${allTypes.length !== 1 ? 's' : ''}`
              : `${allTypes.length} type${allTypes.length !== 1 ? 's' : ''}`
          }
          action={
            <div className="flex items-center gap-3">
              {!fixedTenantId && (
                <Select
                  options={[
                    { value: '', label: 'All Tenants' },
                    ...tenants.map((t) => ({ value: t._id, label: t.name })),
                  ]}
                  value={tenantFilter}
                  onChange={(e) => { setTenantFilter(e.target.value); setPage(1); }}
                  className="w-44"
                />
              )}
              <Button
                onClick={() => setCreateOpen(true)}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                }
              >
                New Type
              </Button>
            </div>
          }
        />

        <div className="px-6 py-3 border-b border-gray-100">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name or sheet name…"
              className="w-full lg:w-3/12 pl-9 pr-9 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
            {search && (
              <button onClick={() => handleSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <LoadingScreen />
        ) : campaignTypes.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            }
            title={search.trim() ? `No results for "${search}"` : 'No campaign types'}
            description={search.trim() ? 'Try a different search term.' : 'Define campaign types to organise your outreach templates.'}
            action={
              search.trim()
                ? <Button variant="secondary" onClick={() => handleSearch('')}>Clear search</Button>
                : <Button onClick={() => setCreateOpen(true)}>Create Campaign Type</Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Name</th>
                  {!fixedTenantId && (
                    <th className="text-left px-6 py-3 font-medium text-gray-500">Tenant</th>
                  )}
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Sheet Name</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Address Mapping</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Headers</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paged.map((ct) => (
                  <tr key={ct._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{ct.name}</td>
                    {!fixedTenantId && (
                      <td className="px-6 py-4 text-gray-600">{getTenantName(ct)}</td>
                    )}
                    <td className="px-6 py-4">
                      <code className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                        {ct.sheetName}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          ct.addressMapping === 'direct'
                            ? 'bg-blue-50 text-blue-700'
                            : ct.addressMapping === 'parse'
                            ? 'bg-purple-50 text-purple-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {ct.addressMapping}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {ct.sheetHeaders.length} columns
                    </td>
                    <td className="px-6 py-4">
                      <Badge active={ct.isActive} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditTarget(ct)}>
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:bg-red-50"
                          onClick={() => setDeleteTarget(ct)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pageSize={PAGE_SIZE} total={campaignTypes.length} onPageChange={setPage} />

      </Card>

      {/* Create */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Campaign Type" size="lg">
        <CampaignTypeForm
          tenants={tenants}
          fixedTenantId={fixedTenantId}
          onSubmit={(d) => createMutation.mutateAsync(d)}
          onCancel={() => setCreateOpen(false)}
          loading={createMutation.isPending}
        />
      </Modal>

      {/* Edit */}
      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={`Edit — ${editTarget?.name}`}
        size="lg"
      >
        {editTarget && (
          <CampaignTypeForm
            initial={editTarget}
            tenants={tenants}
            fixedTenantId={fixedTenantId}
            onSubmit={(d) => updateMutation.mutateAsync({ id: editTarget._id, data: d })}
            onCancel={() => setEditTarget(null)}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>

      {/* Delete */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
        title="Delete Campaign Type"
        message={`Delete "${deleteTarget?.name}"? All campaigns under this type will also be removed.`}
        loading={deleteMutation.isPending}
      />
    </>
  );
};
