import React, { useEffect, useState } from 'react';
import type { Tenant } from '../../types';
import { Input, Textarea } from '../ui/Input';
import { Button } from '../ui/Button';

interface TenantFormProps {
  initial?: Tenant;
  onSubmit: (data: Partial<Tenant>) => Promise<unknown>;
  onCancel: () => void;
  loading?: boolean;
}

const TABS = ['Basic', 'API Credentials', 'Limits & Settings'] as const;
type Tab = (typeof TABS)[number];

export const TenantForm: React.FC<TenantFormProps> = ({
  initial,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [tab, setTab] = useState<Tab>('Basic');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    name: initial?.name ?? '',
    slug: initial?.slug ?? '',
    googleSheetId: initial?.googleSheetId ?? '',
    isActive: initial?.isActive ?? true,
    // API credentials
    instantlyApiKey: initial?.credentials?.instantlyApiKey ?? '',
    openAiApiKey: initial?.credentials?.openAiApiKey ?? '',
    googleServiceAccountJson: initial?.credentials?.googleServiceAccountJson
      ? JSON.stringify(initial.credentials.googleServiceAccountJson, null, 2)
      : '',
    // Limits
    maxRequestsPerMinute: initial?.limits?.maxRequestsPerMinute ?? 60,
    maxLeadsPerRun: initial?.limits?.maxLeadsPerRun ?? 100,
    // Settings
    schedulerIntervalMinutes: initial?.settings?.schedulerIntervalMinutes ?? 1,
    successDelayMs: initial?.settings?.successDelayMs ?? 10000,
    leadDelayJitterMs: initial?.settings?.leadDelayJitterMs ?? 3000,
  });

  // Auto-generate slug from name when creating
  useEffect(() => {
    if (!initial) {
      setForm((f) => ({
        ...f,
        slug: f.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, ''),
      }));
    }
  }, [form.name, initial]);

  const set = (key: string, value: string | number | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.slug.trim()) e.slug = 'Slug is required';
    if (!/^[a-z0-9-]+$/.test(form.slug)) e.slug = 'Slug: lowercase letters, numbers, hyphens only';
    if (!form.googleSheetId.trim()) e.googleSheetId = 'Google Sheet ID is required';
    if (!form.instantlyApiKey.trim()) e.instantlyApiKey = 'Instantly API key is required';
    if (!form.openAiApiKey.trim()) e.openAiApiKey = 'OpenAI API key is required';
    if (form.googleServiceAccountJson.trim()) {
      try {
        JSON.parse(form.googleServiceAccountJson);
      } catch {
        e.googleServiceAccountJson = 'Invalid JSON';
      }
    } else {
      e.googleServiceAccountJson = 'Google Service Account JSON is required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    let googleServiceAccountJson: Record<string, unknown> = {};
    try {
      googleServiceAccountJson = JSON.parse(form.googleServiceAccountJson);
    } catch {
      /* validated above */
    }

    await onSubmit({
      name: form.name.trim(),
      slug: form.slug.trim(),
      googleSheetId: form.googleSheetId.trim(),
      isActive: form.isActive,
      credentials: {
        instantlyApiKey: form.instantlyApiKey.trim(),
        openAiApiKey: form.openAiApiKey.trim(),
        googleServiceAccountJson,
      },
      limits: {
        maxRequestsPerMinute: Number(form.maxRequestsPerMinute),
        maxLeadsPerRun: Number(form.maxLeadsPerRun),
      },
      settings: {
        schedulerIntervalMinutes: Number(form.schedulerIntervalMinutes),
        successDelayMs: Number(form.successDelayMs),
        leadDelayJitterMs: Number(form.leadDelayJitterMs),
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
              tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Basic */}
      {tab === 'Basic' && (
        <div className="space-y-4">
          <Input
            label="Company Name"
            required
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            error={errors.name}
            placeholder="Acme Corp"
          />
          <Input
            label="Slug"
            required
            value={form.slug}
            onChange={(e) => set('slug', e.target.value)}
            error={errors.slug}
            placeholder="acme-corp"
            hint="Unique identifier, auto-generated from name"
          />
          <Input
            label="Google Sheet ID"
            required
            value={form.googleSheetId}
            onChange={(e) => set('googleSheetId', e.target.value)}
            error={errors.googleSheetId}
            placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
          />
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
        </div>
      )}

      {/* API Credentials */}
      {tab === 'API Credentials' && (
        <div className="space-y-4">
          <Input
            label="Instantly API Key"
            required
            type="password"
            value={form.instantlyApiKey}
            onChange={(e) => set('instantlyApiKey', e.target.value)}
            error={errors.instantlyApiKey}
            placeholder="sk-instantly-..."
          />
          <Input
            label="OpenAI API Key"
            required
            type="password"
            value={form.openAiApiKey}
            onChange={(e) => set('openAiApiKey', e.target.value)}
            error={errors.openAiApiKey}
            placeholder="sk-..."
          />
          <Textarea
            label="Google Service Account JSON"
            required
            value={form.googleServiceAccountJson}
            onChange={(e) => set('googleServiceAccountJson', e.target.value)}
            error={errors.googleServiceAccountJson}
            placeholder='{"type": "service_account", ...}'
            rows={8}
            hint="Paste the full service account JSON here"
          />
        </div>
      )}

      {/* Limits & Settings */}
      {tab === 'Limits & Settings' && (
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Limits</p>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Max Requests / Min"
              type="number"
              min={1}
              value={form.maxRequestsPerMinute}
              onChange={(e) => set('maxRequestsPerMinute', e.target.value)}
            />
            <Input
              label="Max Leads / Run"
              type="number"
              min={1}
              value={form.maxLeadsPerRun}
              onChange={(e) => set('maxLeadsPerRun', e.target.value)}
            />
          </div>
          <hr className="border-gray-200" />
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Settings</p>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Scheduler Interval (min)"
              type="number"
              min={1}
              value={form.schedulerIntervalMinutes}
              onChange={(e) => set('schedulerIntervalMinutes', e.target.value)}
            />
            <Input
              label="Success Delay (ms)"
              type="number"
              min={0}
              value={form.successDelayMs}
              onChange={(e) => set('successDelayMs', e.target.value)}
            />
            <Input
              label="Lead Delay Jitter (ms)"
              type="number"
              min={0}
              value={form.leadDelayJitterMs}
              onChange={(e) => set('leadDelayJitterMs', e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {initial ? 'Save Changes' : 'Create Tenant'}
        </Button>
      </div>
    </form>
  );
};
