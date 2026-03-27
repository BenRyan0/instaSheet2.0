import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Campaign, CampaignType, InstantlyCampaign, Tenant } from '../../types';
import { campaignTypeApi, tenantApi } from '../../api/client';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { InstantlyCampaignPicker } from './InstantlyCampaignPicker';

interface CampaignFormProps {
  initial?: Campaign;
  fixedTenantId?: string;
  fixedCampaignTypeId?: string;
  onSubmit: (data: Partial<Campaign>) => Promise<unknown>;
  onCancel: () => void;
  loading?: boolean;
}

export const CampaignForm: React.FC<CampaignFormProps> = ({
  initial,
  fixedTenantId,
  fixedCampaignTypeId,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pickerOpen, setPickerOpen] = useState(false);

  const resolveTenantId = () => {
    if (fixedTenantId) return fixedTenantId;
    if (!initial?.tenant) return '';
    return typeof initial.tenant === 'string' ? initial.tenant : (initial.tenant as Tenant)._id;
  };

  const resolveCampaignTypeId = () => {
    if (fixedCampaignTypeId) return fixedCampaignTypeId;
    if (!initial?.campaignType) return '';
    return typeof initial.campaignType === 'string'
      ? initial.campaignType
      : (initial.campaignType as CampaignType)._id;
  };

  const [selectedTenantId, setSelectedTenantId] = useState(resolveTenantId());
  const [form, setForm] = useState({
    campaignType: resolveCampaignTypeId(),
    campaignId: initial?.campaignId ?? '',
    name: initial?.name ?? '',
    isActive: initial?.isActive ?? true,
  });

  // Reset campaign type when tenant changes (unless fixed)
  useEffect(() => {
    if (!fixedCampaignTypeId) {
      setForm((f) => ({ ...f, campaignType: '' }));
    }
  }, [selectedTenantId, fixedCampaignTypeId]);

  const { data: tenantsData } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => tenantApi.getAll(),
    enabled: !fixedTenantId,
  });

  const { data: typesData } = useQuery({
    queryKey: ['campaign-types', selectedTenantId],
    queryFn: () => campaignTypeApi.getAll(selectedTenantId || undefined),
    enabled: !!selectedTenantId,
  });

  const tenants: Tenant[] = tenantsData?.data ?? [];
  const campaignTypes: CampaignType[] = typesData?.data ?? [];

  const set = (key: string, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!selectedTenantId) e.tenant = 'Tenant is required';
    if (!form.campaignType) e.campaignType = 'Campaign type is required';
    if (!form.campaignId.trim()) e.campaignId = 'Campaign ID is required';
    if (!form.name.trim()) e.name = 'Campaign name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      tenant: selectedTenantId as Campaign['tenant'],
      campaignType: form.campaignType as Campaign['campaignType'],
      campaignId: form.campaignId.trim(),
      name: form.name.trim(),
      isActive: form.isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Tenant */}
      {fixedTenantId ? (
        <input type="hidden" value={fixedTenantId} />
      ) : (
        <Select
          label="Tenant"
          required
          value={selectedTenantId}
          onChange={(e) => setSelectedTenantId(e.target.value)}
          error={errors.tenant}
          options={tenants.map((t) => ({ value: t._id, label: t.name }))}
          placeholder="Select a tenant"
        />
      )}

      {/* Campaign Type — filtered by tenant */}
      {fixedCampaignTypeId ? (
        <input type="hidden" value={fixedCampaignTypeId} />
      ) : (
        <Select
          label="Campaign Type"
          required
          value={form.campaignType}
          onChange={(e) => set('campaignType', e.target.value)}
          error={errors.campaignType}
          disabled={!selectedTenantId}
          options={campaignTypes.map((ct) => ({ value: ct._id, label: `${ct.name} (${ct.sheetName})` }))}
          placeholder={selectedTenantId ? 'Select a campaign type' : 'Select a tenant first'}
        />
      )}

      {/* Campaign ID + Name (Instantly) */}
      <div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              label="Campaign ID (Instantly)"
              required
              value={form.campaignId}
              onChange={(e) => set('campaignId', e.target.value)}
              error={errors.campaignId}
              placeholder="instantly-campaign-abc123"
              hint="Unique identifier from Instantly platform"
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!selectedTenantId}
            onClick={() => setPickerOpen(true)}
            className="mb-[22px] shrink-0"
          >
            Browse
          </Button>
        </div>
      </div>

      <Input
        label="Campaign Name"
        required
        value={form.name}
        onChange={(e) => set('name', e.target.value)}
        error={errors.name}
        placeholder="Q4 Outreach"
        hint="Human-readable name from Instantly"
      />

      {selectedTenantId && (
        <InstantlyCampaignPicker
          open={pickerOpen}
          tenantId={selectedTenantId}
          onSelect={(c: InstantlyCampaign) => {
            set('campaignId', c.id);
            set('name', c.name);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {/* Active toggle */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Status</label>
        <button
          type="button"
          onClick={() => set('isActive', !form.isActive)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            form.isActive ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
              form.isActive ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <span className="text-sm text-gray-500">{form.isActive ? 'Active' : 'Inactive'}</span>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {initial ? 'Save Changes' : 'Create Campaign'}
        </Button>
      </div>
    </form>
  );
};
