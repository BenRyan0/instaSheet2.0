import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type { Campaign, CampaignType, Tenant } from '../../types';
import { campaignApi, campaignTypeApi, tenantApi } from '../../api/client';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Card, CardHeader } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { LoadingScreen } from '../ui/Spinner';
import { Select } from '../ui/Select';
import { Pagination } from '../ui/Pagination';
import { CampaignForm } from './CampaignForm';

interface CampaignListProps {
  fixedTenantId?: string;
  fixedCampaignTypeId?: string;
}

export const CampaignList: React.FC<CampaignListProps> = ({
  fixedTenantId,
  fixedCampaignTypeId,
}) => {
  const qc = useQueryClient();
  const [tenantFilter, setTenantFilter] = useState(fixedTenantId ?? '');
  const [typeFilter, setTypeFilter] = useState(fixedCampaignTypeId ?? '');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Campaign | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null);

  const { data: tenantsData } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => tenantApi.getAll(),
    enabled: !fixedTenantId,
  });

  const { data: typesData } = useQuery({
    queryKey: ['campaign-types', tenantFilter],
    queryFn: () => campaignTypeApi.getAll(tenantFilter || undefined),
    enabled: !fixedCampaignTypeId,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['campaigns', tenantFilter, typeFilter],
    queryFn: () =>
      campaignApi.getAll({
        tenantId: tenantFilter || undefined,
        campaignTypeId: typeFilter || undefined,
      }),
  });

  // Fetch all campaigns (no type filter) to build the full used-IDs exclusion list for the picker
  const { data: allCampaignsData } = useQuery({
    queryKey: ['campaigns', tenantFilter, 'all'],
    queryFn: () => campaignApi.getAll({ tenantId: tenantFilter || undefined }),
  });
  const usedCampaignIds = (allCampaignsData?.data ?? []).map((c) => c.campaignId);

  const createMutation = useMutation({
    mutationFn: campaignApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign created');
      setCreateOpen(false);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message || 'Failed to create campaign');
    },
  });

  const handleBulkCreate = async (items: Partial<Campaign>[]) => {
    let created = 0;
    let failed = 0;
    for (const item of items) {
      try {
        await campaignApi.create(item);
        created++;
      } catch {
        failed++;
      }
    }
    qc.invalidateQueries({ queryKey: ['campaigns'] });
    if (created > 0) toast.success(`${created} campaign${created !== 1 ? 's' : ''} created`);
    if (failed > 0) toast.error(`${failed} campaign${failed !== 1 ? 's' : ''} failed to create`);
    setCreateOpen(false);
  };

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Campaign> }) =>
      campaignApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign updated');
      setEditTarget(null);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message || 'Failed to update campaign');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => campaignApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign deleted');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Failed to delete campaign'),
  });

  const tenants: Tenant[] = tenantsData?.data ?? [];
  const campaignTypes: CampaignType[] = typesData?.data ?? [];
  const allCampaigns = data?.data ?? [];

  const campaigns = search.trim()
    ? allCampaigns.filter((c) => {
        const q = search.toLowerCase();
        const tenantName = typeof c.tenant === 'object' ? (c.tenant as Tenant).name : '';
        const typeName =
          typeof c.campaignType === 'object' ? (c.campaignType as CampaignType).name : '';
        return (
          c.name.toLowerCase().includes(q) ||
          c.campaignId.toLowerCase().includes(q) ||
          tenantName.toLowerCase().includes(q) ||
          typeName.toLowerCase().includes(q)
        );
      })
    : allCampaigns;

  const resolveName = <T extends { name: string }>(val: string | T | null | undefined): string =>
    val != null && typeof val === 'object' ? val.name : '—';

  const paged = campaigns.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleTenantFilterChange = (id: string) => {
    setTenantFilter(id);
    if (!fixedCampaignTypeId) { setTypeFilter(''); }
    setPage(1);
  };

  const handleSearch = (q: string) => {
    setSearch(q);
    setPage(1);
  };

  return (
    <>
      <Card>
        <CardHeader
          title="Campaigns"
          subtitle={
            search.trim()
              ? `${campaigns.length} of ${allCampaigns.length} campaign${allCampaigns.length !== 1 ? 's' : ''}`
              : `${allCampaigns.length} campaign${allCampaigns.length !== 1 ? 's' : ''}`
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
                  onChange={(e) => handleTenantFilterChange(e.target.value)}
                  className="w-40"
                />
              )}
              {!fixedCampaignTypeId && (
                <Select
                  options={[
                    { value: '', label: 'All Types' },
                    ...campaignTypes.map((ct) => ({ value: ct._id, label: ct.name })),
                  ]}
                  value={typeFilter}
                  onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                  className="w-40"
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
                New Campaign
              </Button>
            </div>
          }
        />

        {/* Search bar */}
        <div className="px-6 py-3 border-b border-gray-100">
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
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name, campaign ID, tenant or type…"
              className="w-full lg:w-3/12 pl-9 pr-9 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"

            />
            {search && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <LoadingScreen />
        ) : campaigns.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            }
            title={search.trim() ? `No results for "${search}"` : 'No campaigns'}
            description={
              search.trim()
                ? 'Try a different search term or clear the filter.'
                : 'Add your first Instantly campaign to start tracking.'
            }
            action={
              search.trim() ? (
                <Button variant="secondary" onClick={() => handleSearch('')}>Clear search</Button>
              ) : (
                <Button onClick={() => setCreateOpen(true)}>Create Campaign</Button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Name</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Campaign ID</th>
                  {!fixedTenantId && (
                    <th className="text-left px-6 py-3 font-medium text-gray-500">Tenant</th>
                  )}
                  {!fixedCampaignTypeId && (
                    <th className="text-left px-6 py-3 font-medium text-gray-500">Type</th>
                  )}
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Created</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paged.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{c.name}</td>
                    <td className="px-6 py-4">
                      <code className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono">
                        {c.campaignId}
                      </code>
                    </td>
                    {!fixedTenantId && (
                      <td className="px-6 py-4 text-gray-600">{resolveName(c.tenant as string | Tenant)}</td>
                    )}
                    {!fixedCampaignTypeId && (
                      <td className="px-6 py-4 text-gray-600">{resolveName(c.campaignType as string | CampaignType)}</td>
                    )}
                    <td className="px-6 py-4">
                      <Badge active={c.isActive} />
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditTarget(c)}>
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:bg-red-50"
                          onClick={() => setDeleteTarget(c)}
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
        <Pagination page={page} pageSize={PAGE_SIZE} total={campaigns.length} onPageChange={setPage} />
      </Card>

      {/* Create */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Campaign" size="md">
        <CampaignForm
          fixedTenantId={fixedTenantId || (tenantFilter || undefined)}
          fixedCampaignTypeId={fixedCampaignTypeId || (typeFilter || undefined)}
          excludeCampaignIds={usedCampaignIds}
          onSubmit={(d) => createMutation.mutateAsync(d)}
          onBulkSubmit={handleBulkCreate}
          onCancel={() => setCreateOpen(false)}
          loading={createMutation.isPending}
        />
      </Modal>

      {/* Edit */}
      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={`Edit Campaign — ${editTarget?.campaignId}`}
        size="md"
      >
        {editTarget && (
          <CampaignForm
            initial={editTarget}
            fixedTenantId={fixedTenantId}
            fixedCampaignTypeId={fixedCampaignTypeId}
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
        title="Delete Campaign"
        message={`Delete campaign "${deleteTarget?.campaignId}"? This cannot be undone.`}
        loading={deleteMutation.isPending}
      />
    </>
  );
};
