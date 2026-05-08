import React, { useState, useRef } from 'react';
import type { AutoReply, AutoReplyFollowUp, DataRequestFollowUp, Callback, CampaignType, Tenant } from '../../types';
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
  const [followUpDragOver, setFollowUpDragOver] = useState(false);
  const followUpBodyRef = useRef<HTMLTextAreaElement>(null);

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
    autoReplyFollowUp: initial?.autoReplyFollowUp ?? {
      enabled: false,
      intervalHours: 24,
      maxFollowUps: 1,
      bodyText: '',
      link: '',
    } as AutoReplyFollowUp,
    dataRequestFollowUp: initial?.dataRequestFollowUp ?? {
      enabled: false,
      requiredFields: [],
      subject: '',
      bodyText: '',
      priorityField: '',
    } as DataRequestFollowUp,
    replyPlaybook: initial?.replyPlaybook ? JSON.stringify(initial.replyPlaybook, null, 2) : '',
    callback: initial?.callback ?? { enabled: false, url: '' } as Callback,
    followUpReply: initial?.followUpReply ?? false,
    isActive: initial?.isActive ?? true,
  });

  const set = (key: string, value: string | number | boolean | string[] | AutoReply | AutoReplyFollowUp | DataRequestFollowUp | Callback) =>
    setForm((f) => ({ ...f, [key]: value }));

  const setAutoReply = (key: keyof AutoReply, value: string | boolean) =>
    setForm((f) => ({ ...f, autoReply: { ...f.autoReply, [key]: value } }));

  const setAutoReplyFollowUp = (key: keyof AutoReplyFollowUp, value: string | boolean | number) =>
    setForm((f) => ({ ...f, autoReplyFollowUp: { ...f.autoReplyFollowUp, [key]: value } }));

  const setDataRequestFollowUp = (key: keyof DataRequestFollowUp, value: string | boolean | string[]) =>
    setForm((f) => ({ ...f, dataRequestFollowUp: { ...f.dataRequestFollowUp, [key]: value } }));

  const setCallback = (key: keyof Callback, value: string | boolean) =>
    setForm((f) => ({ ...f, callback: { ...f.callback, [key]: value } }));

  const insertFollowUpPlaceholder = (header: string) => {
    const token = `{{${header}}}`;
    const el = followUpBodyRef.current;
    const current = form.autoReplyFollowUp.bodyText;
    if (!el) { setAutoReplyFollowUp('bodyText', current + token); return; }
    const start = el.selectionStart ?? current.length;
    const end = el.selectionEnd ?? current.length;
    setAutoReplyFollowUp('bodyText', current.slice(0, start) + token + current.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + token.length;
    });
  };

  const handleFollowUpDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    const token = e.dataTransfer.getData('text/plain');
    if (!token.startsWith('{{')) return;
    e.preventDefault();
    setFollowUpDragOver(false);
    const el = e.currentTarget;
    const pos = el.selectionStart ?? form.autoReplyFollowUp.bodyText.length;
    const current = form.autoReplyFollowUp.bodyText;
    setAutoReplyFollowUp('bodyText', current.slice(0, pos) + token + current.slice(pos));
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = pos + token.length;
    });
  };

  const toggleRequiredField = (header: string) => {
    const current = form.dataRequestFollowUp.requiredFields;
    const next = current.includes(header)
      ? current.filter((h) => h !== header)
      : [...current, header];
    setDataRequestFollowUp('requiredFields', next);
  };

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
    if (form.replyPlaybook.trim()) {
      try { JSON.parse(form.replyPlaybook); } catch { e.replyPlaybook = 'Invalid JSON'; }
    }
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
      autoReplyFollowUp: form.autoReplyFollowUp,
      dataRequestFollowUp: form.dataRequestFollowUp,
      replyPlaybook: form.replyPlaybook.trim() ? JSON.parse(form.replyPlaybook) : null,
      callback: form.callback,
      followUpReply: form.followUpReply,
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
              label="Email Body"
              value={form.autoReply.bodyText}
              onChange={(e) => setAutoReply('bodyText', e.target.value)}
              placeholder="Hi {{firstName}}, ..."
              rows={4}
              hint="Placeholders: {{firstName}}, {{Company Name}}, {{sendingAccountName}}"
            />
          </div>
        )}
      </div>

      {/* Auto Reply Follow-Up */}
      <div className="space-y-3 rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setAutoReplyFollowUp('enabled', !form.autoReplyFollowUp.enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              form.autoReplyFollowUp.enabled ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                form.autoReplyFollowUp.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-sm font-medium text-gray-700">Auto Reply Follow-Up</span>
          <span className="text-xs text-gray-400">
            Send a follow-up to leads who never replied to the auto-reply
          </span>
        </div>

        {form.autoReplyFollowUp.enabled && (
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Interval (hours)"
                type="number"
                min={1}
                value={form.autoReplyFollowUp.intervalHours}
                onChange={(e) => setAutoReplyFollowUp('intervalHours', Number(e.target.value))}
                hint="Hours to wait before sending"
              />
              <Input
                label="Max Follow-Ups"
                type="number"
                min={1}
                value={form.autoReplyFollowUp.maxFollowUps}
                onChange={(e) => setAutoReplyFollowUp('maxFollowUps', Number(e.target.value))}
                hint="Per lead"
              />
            </div>
            {/* Email Body with drag-to-insert */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Email Body</label>
                <span className="text-xs text-gray-400">drag or click a column to insert</span>
              </div>
              <div className="flex flex-wrap gap-1.5 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-2 max-h-24 overflow-y-auto">
                {form.sheetHeaders.map((h) => (
                  <span
                    key={h}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', `{{${h}}}`)}
                    onClick={() => insertFollowUpPlaceholder(h)}
                    title={`Insert {{${h}}}`}
                    className="cursor-grab active:cursor-grabbing select-none inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                  >
                    {h}
                  </span>
                ))}
              </div>
              <textarea
                ref={followUpBodyRef}
                rows={6}
                value={form.autoReplyFollowUp.bodyText}
                onChange={(e) => setAutoReplyFollowUp('bodyText', e.target.value)}
                onDragOver={(e) => { e.preventDefault(); setFollowUpDragOver(true); }}
                onDragLeave={() => setFollowUpDragOver(false)}
                onDrop={handleFollowUpDrop}
                placeholder={`Hi {{Lead First Name}},\n\nJust following up...\n\n{{sendingAccountName}}`}
                className={`block w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-y ${
                  followUpDragOver ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-300' : 'border-gray-300 bg-white'
                }`}
              />
              <p className="text-xs text-gray-500">Placeholders: {'{{firstName}}'}, {'{{Company Name}}'}, {'{{sendingAccountName}}'}, {'{{link}}'}</p>
            </div>
            <Input
              label="Link URL"
              value={form.autoReplyFollowUp.link}
              onChange={(e) => setAutoReplyFollowUp('link', e.target.value)}
              placeholder="https://example.com"
              hint="Injected into {{link}} placeholder"
            />
            <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
              Subject is not configurable — the follow-up reuses the original email thread subject.
            </p>
          </div>
        )}
      </div>

      {/* Data Request Follow-Up */}
      <div className="space-y-3 rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDataRequestFollowUp('enabled', !form.dataRequestFollowUp.enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              form.dataRequestFollowUp.enabled ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                form.dataRequestFollowUp.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-sm font-medium text-gray-700">Data Request Follow-Up</span>
          <span className="text-xs text-gray-400">
            Send a follow-up when required fields are blank after encoding a lead
          </span>
        </div>

        {form.dataRequestFollowUp.enabled && (
          <div className="space-y-3 pt-1">
            {/* Required Fields multi-select */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Required Fields
                <span className="ml-2 text-xs font-normal text-gray-400">
                  select from sheet headers — blank values trigger a follow-up
                </span>
              </label>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto rounded-lg border border-gray-200 p-3">
                {form.sheetHeaders.map((h) => {
                  const selected = form.dataRequestFollowUp.requiredFields.includes(h);
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => toggleRequiredField(h)}
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        selected
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
              {form.dataRequestFollowUp.requiredFields.length > 0 && (
                <p className="text-xs text-gray-400">
                  Selected: {form.dataRequestFollowUp.requiredFields.join(', ')}
                </p>
              )}
            </div>

            <Textarea
              label="Follow-Up Body"
              value={form.dataRequestFollowUp.bodyText}
              onChange={(e) => setDataRequestFollowUp('bodyText', e.target.value)}
              placeholder={'Hi {{Company Name}},\n\nThank you for your interest!\n\n{{sendingAccountName}}'}
              rows={5}
              hint="Supported placeholders: {{sendingAccountName}}"
            />

            {/* Priority Field */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Priority Field
                <span className="ml-2 text-xs font-normal text-gray-400">
                  if provided, resolves the data request as soon as this field is filled
                </span>
              </label>
              <select
                value={form.dataRequestFollowUp.priorityField}
                onChange={(e) => setDataRequestFollowUp('priorityField', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— none —</option>
                {form.dataRequestFollowUp.requiredFields.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Reply Playbook */}
      <div className="space-y-3 rounded-lg border border-gray-200 p-4">
        <div>
          <p className="text-sm font-medium text-gray-700">Reply Playbook</p>
          <p className="text-xs text-gray-400 mt-0.5">
            JSON object defining reply categories / sub-variants. Leave blank to disable classification.
          </p>
        </div>
        <textarea
          rows={6}
          value={form.replyPlaybook}
          onChange={(e) => set('replyPlaybook', e.target.value)}
          placeholder={'{\n  "Interested": ["Ready to book", "Needs more info"],\n  "Not interested": ["Price", "Timing"]\n}'}
          className={`block w-full rounded-lg border px-3 py-2 text-sm font-mono text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y ${
            errors.replyPlaybook ? 'border-red-400' : 'border-gray-300'
          }`}
        />
        {errors.replyPlaybook && (
          <p className="text-xs text-red-500">{errors.replyPlaybook}</p>
        )}
      </div>

      {/* Callback */}
      <div className="space-y-3 rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCallback('enabled', !form.callback.enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              form.callback.enabled ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                form.callback.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-sm font-medium text-gray-700">Outbound Callback</span>
          <span className="text-xs text-gray-400">
            POST processed reply data to an external URL
          </span>
        </div>

        {form.callback.enabled && (
          <Input
            label="Callback URL"
            value={form.callback.url}
            onChange={(e) => setCallback('url', e.target.value)}
            placeholder="https://hooks.example.com/reply"
            hint="Receives a POST with the processed follow-up reply payload"
          />
        )}
      </div>

      {/* Follow-Up Reply */}
      <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-4">
        <button
          type="button"
          onClick={() => set('followUpReply', !form.followUpReply)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            form.followUpReply ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
              form.followUpReply ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <span className="text-sm font-medium text-gray-700">Follow-Up Reply</span>
        <span className="text-xs text-gray-400">
          Enable follow-up reply handling for this campaign type
        </span>
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
