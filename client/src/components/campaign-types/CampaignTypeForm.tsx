import React, { useState } from 'react';
import type { AutoReply, CampaignType, Tenant } from '../../types';
import { Input, Textarea } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';

interface CampaignTypeFormProps {
  initial?: CampaignType;
  tenants: Tenant[];
  onSubmit: (data: Partial<CampaignType>) => Promise<unknown>;
  onCancel: () => void;
  loading?: boolean;
  fixedTenantId?: string;
}

const DEFAULT_HEADERS = [
  'Date',
  'Hot Lead',
  'For Scheduling',
  'Sales Person',
  'Sales Person Email',
  'Lead First Name',
  'Lead Last Name',
  'Lead Email',
  'Phone From Reply',
  'Phone From Instantly',
  'Phone 2',
  'Phone 3',
  'Reply Text',
  'Email Signature',
  'Address',
  'City',
  'State',
  'Zip',
  'LinkedIn',
  'Details',
  'Campaign Name',
  '@dropdown',
];

export const CampaignTypeForm: React.FC<CampaignTypeFormProps> = ({
  initial,
  tenants,
  onSubmit,
  onCancel,
  loading = false,
  fixedTenantId,
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [headerInput, setHeaderInput] = useState('');

  const resolveTenantId = () => {
    if (fixedTenantId) return fixedTenantId;
    if (!initial?.tenant) return '';
    return typeof initial.tenant === 'string' ? initial.tenant : (initial.tenant as Tenant)._id;
  };

  const [form, setForm] = useState({
    tenant: resolveTenantId(),
    name: initial?.name ?? '',
    sheetName: initial?.sheetName ?? '',
    emailTemplate: initial?.emailTemplate ?? '',
    sheetHeaders: initial?.sheetHeaders ?? [...DEFAULT_HEADERS],
    manualColCount: initial?.manualColCount ?? 6,
    addressMapping: initial?.addressMapping ?? 'direct',
    autoReply: initial?.autoReply ?? {
      enabled: false,
      subject: '',
      bodyHtml: '',
      bodyText: '',
    } as AutoReply,
    isActive: initial?.isActive ?? true,
  });

  const set = (key: string, value: string | number | boolean | string[] | AutoReply) =>
    setForm((f) => ({ ...f, [key]: value }));

  const setAutoReply = (key: keyof AutoReply, value: string | boolean) =>
    setForm((f) => ({ ...f, autoReply: { ...f.autoReply, [key]: value } }));

  const addHeader = () => {
    const h = headerInput.trim();
    if (!h) return;
    if (form.sheetHeaders.includes(h)) {
      setErrors((e) => ({ ...e, headerInput: 'Header already exists' }));
      return;
    }
    set('sheetHeaders', [...form.sheetHeaders, h]);
    setHeaderInput('');
    setErrors((e) => ({ ...e, headerInput: '' }));
  };

  const removeHeader = (idx: number) => {
    set('sheetHeaders', form.sheetHeaders.filter((_, i) => i !== idx));
  };

  const resetHeaders = () => {
    set('sheetHeaders', [...DEFAULT_HEADERS]);
    setHeaderInput('');
    setErrors((e) => ({ ...e, headerInput: '' }));
  };

  // Handles pasting tab-separated or newline-separated headers copied from Google Sheets
  const handleHeaderPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    // Google Sheets copies cells as tab-separated; rows as newline-separated
    const pasted = text
      .split(/[\t\n\r]+/)
      .map((h) => h.trim())
      .filter(Boolean);

    if (pasted.length <= 1) return; // single value — let default paste handle it
    e.preventDefault();

    const existing = new Set(form.sheetHeaders);
    const toAdd = pasted.filter((h) => !existing.has(h));
    const dupes = pasted.length - toAdd.length;

    set('sheetHeaders', [...form.sheetHeaders, ...toAdd]);
    setHeaderInput('');
    if (dupes > 0) {
      setErrors((e) => ({ ...e, headerInput: `${dupes} duplicate${dupes > 1 ? 's' : ''} skipped` }));
    } else {
      setErrors((e) => ({ ...e, headerInput: '' }));
    }
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.tenant) e.tenant = 'Tenant is required';
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.sheetName.trim()) e.sheetName = 'Sheet name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      tenant: form.tenant as CampaignType['tenant'],
      name: form.name.trim(),
      sheetName: form.sheetName.trim(),
      emailTemplate: form.emailTemplate,
      sheetHeaders: form.sheetHeaders,
      manualColCount: Number(form.manualColCount),
      addressMapping: form.addressMapping as CampaignType['addressMapping'],
      autoReply: form.autoReply,
      isActive: form.isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Tenant selector — disabled when fixed */}
      <Select
        label="Tenant"
        required
        value={form.tenant}
        onChange={(e) => set('tenant', e.target.value)}
        error={errors.tenant}
        disabled={!!fixedTenantId}
        options={tenants.map((t) => ({ value: t._id, label: t.name }))}
        placeholder="Select a tenant"
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Name"
          required
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          error={errors.name}
          placeholder="Cold Outreach"
        />
        <Input
          label="Sheet Name"
          required
          value={form.sheetName}
          onChange={(e) => set('sheetName', e.target.value)}
          error={errors.sheetName}
          placeholder="ColdOutreach"
          hint="Unique per tenant"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Address Mapping"
          value={form.addressMapping}
          onChange={(e) => set('addressMapping', e.target.value)}
          options={[
            { value: 'direct', label: 'Direct' },
            { value: 'parse', label: 'Parse' },
            { value: 'skip', label: 'Skip' },
          ]}
        />
        <Input
          label="Manual Column Count"
          type="number"
          min={0}
          value={form.manualColCount}
          onChange={(e) => set('manualColCount', e.target.value)}
        />
      </div>

      <Textarea
        label="Email Template"
        value={form.emailTemplate}
        onChange={(e) => set('emailTemplate', e.target.value)}
        placeholder="Hi {{firstName}}, ..."
        rows={5}
      />

      {/* Sheet Headers */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Sheet Headers
            <span className="ml-2 text-xs font-normal text-gray-400">{form.sheetHeaders.length} columns</span>
          </label>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={resetHeaders}
              className="text-xs text-gray-400 hover:text-blue-500">
              Reset to defaults
            </Button>
            <Button type="button" variant="ghost" size="sm"
              onClick={() => { set('sheetHeaders', []); setHeaderInput(''); setErrors((e) => ({ ...e, headerInput: '' })); }}
              className="text-xs text-gray-400 hover:text-red-500">
              Clear all
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            value={headerInput}
            onChange={(e) => setHeaderInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHeader())}
            onPaste={handleHeaderPaste}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type a header, or paste a copied row from Google Sheets"
          />
          <Button type="button" variant="secondary" size="sm" onClick={addHeader}>
            Add
          </Button>
        </div>
        {errors.headerInput && (
          <p className="text-xs text-amber-600">{errors.headerInput}</p>
        )}
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
          {form.sheetHeaders.map((h, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full"
            >
              {h}
              <button
                type="button"
                onClick={() => removeHeader(i)}
                className="hover:text-red-500 transition-colors"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Auto Reply */}
      <div className="space-y-3 rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setAutoReply('enabled', !form.autoReply.enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              form.autoReply.enabled ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                form.autoReply.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-sm font-medium text-gray-700">Auto Reply</span>
          <span className="text-xs text-gray-400">
            Send an automated reply via Instantly after a lead is confirmed
          </span>
        </div>

        {form.autoReply.enabled && (
          <div className="space-y-3 pt-1">
            <Textarea
              label="Body (Plain Text)"
              value={form.autoReply.bodyText}
              onChange={(e) => setAutoReply('bodyText', e.target.value)}
              placeholder="Hi {{firstName}}, ..."
              rows={3}
            />
          </div>
        )}
      </div>

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
          {initial ? 'Save Changes' : 'Create Campaign Type'}
        </Button>
      </div>
    </form>
  );
};
