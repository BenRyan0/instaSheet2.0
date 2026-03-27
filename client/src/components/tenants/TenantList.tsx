import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type { Tenant } from '../../types';
import { tenantApi } from '../../api/client';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Card, CardHeader } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { LoadingScreen } from '../ui/Spinner';
import { Pagination } from '../ui/Pagination';
import { TenantForm } from './TenantForm';

export const TenantList: React.FC = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Tenant | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tenant | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => tenantApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: tenantApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('Tenant created');
      setCreateOpen(false);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message || 'Failed to create tenant');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Tenant> }) =>
      tenantApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('Tenant updated');
      setEditTarget(null);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message || 'Failed to update tenant');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tenantApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
      qc.invalidateQueries({ queryKey: ['campaign-types'] });
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Tenant deleted');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Failed to delete tenant'),
  });

  const allTenants = data?.data ?? [];
  const tenants = search.trim()
    ? allTenants.filter((t) => {
        const q = search.toLowerCase();
        return t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q);
      })
    : allTenants;

  const handleSearch = (q: string) => { setSearch(q); setPage(1); };

  const paged = tenants.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <Card>
        <CardHeader
          title="All Tenants"
          subtitle={
            search.trim()
              ? `${tenants.length} of ${allTenants.length} tenant${allTenants.length !== 1 ? 's' : ''}`
              : `${allTenants.length} tenant${allTenants.length !== 1 ? 's' : ''}`
          }
          action={
            <Button
              onClick={() => setCreateOpen(true)}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              New Tenant
            </Button>
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
              placeholder="Search by name or slug…"
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
        ) : tenants.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
              </svg>
            }
            title={search.trim() ? `No results for "${search}"` : 'No tenants yet'}
            description={search.trim() ? 'Try a different search term.' : 'Create your first tenant to get started managing campaigns.'}
            action={
              search.trim()
                ? <Button variant="secondary" onClick={() => handleSearch('')}>Clear search</Button>
                : <Button onClick={() => setCreateOpen(true)}>Create Tenant</Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Name</th>
                  {/* <th className="text-left px-6 py-3 font-medium text-gray-500">Slug</th> */}
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Sheet ID</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Limits</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paged.map((tenant) => (
                  <tr key={tenant._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{tenant.name}</td>
                    {/* <td className="px-6 py-4">
                      <code className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                        {tenant.slug}
                      </code>
                    </td> */}
                    <td className="px-6 py-4">
                      <span className="text-xs text-gray-500 font-mono truncate max-w-[160px] inline-block">
                        {tenant.googleSheetId}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-xs">
                      <div>{tenant.limits.maxRequestsPerMinute} req/min</div>
                      <div>{tenant.limits.maxLeadsPerRun} leads/run</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge active={tenant.isActive} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditTarget(tenant)}>
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:bg-red-50"
                          onClick={() => setDeleteTarget(tenant)}
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
        <Pagination page={page} pageSize={PAGE_SIZE} total={tenants.length} onPageChange={setPage} />

      </Card>

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Tenant" size="lg">
        <TenantForm
          onSubmit={(d) => createMutation.mutateAsync(d)}
          onCancel={() => setCreateOpen(false)}
          loading={createMutation.isPending}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={`Edit — ${editTarget?.name}`}
        size="lg"
      >
        {editTarget && (
          <TenantForm
            initial={editTarget}
            onSubmit={(d) => updateMutation.mutateAsync({ id: editTarget._id, data: d })}
            onCancel={() => setEditTarget(null)}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
        title="Delete Tenant"
        message={`Delete "${deleteTarget?.name}"? This will also remove all campaign types and campaigns belonging to this tenant.`}
        loading={deleteMutation.isPending}
      />
    </>
  );
};
