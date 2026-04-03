export interface Tenant {
  _id: string;
  name: string;
  slug: string;
  googleSheetId: string;
  credentials: {
    instantlyApiKey: string;
    openAiApiKey: string;
    googleServiceAccountJson: Record<string, unknown>;
  };
  limits: {
    maxRequestsPerMinute: number;
    maxLeadsPerRun: number;
  };
  settings: {
    schedulerIntervalMinutes: number;
    successDelayMs: number;
    leadDelayJitterMs: number;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AddressMapping = 'direct' | 'parse' | 'skip';

export interface AutoReply {
  enabled: boolean;
  subject: string;
  bodyHtml: string;
  bodyText: string;
}

export interface CampaignType {
  _id: string;
  tenant: string | Tenant;
  name: string;
  sheetName: string;
  emailTemplate: string;
  sheetHeaders: string[];
  manualColCount: number;
  addressMapping: AddressMapping;
  autoReply: AutoReply;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  _id: string;
  tenant: string | Tenant;
  campaignType: string | CampaignType;
  campaignId: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
}

export interface TenantStats {
  campaignTypeCount: number;
  campaignCount: number;
}

export interface AuthUser {
  _id: string;
  username: string;
  status: 'active' | 'pending' | 'rejected';
  createdAt: string;
}

export interface SheetLeadCount {
  tenantId: string;
  tenantName: string;
  campaignTypeId: string;
  campaignTypeName: string;
  sheetName: string;
  leadCount: number;
  error?: string;
}

export interface InstantlyCampaign {
  id: string;
  name: string;
  timestamp_created: string;
  status?: string | number;
  [key: string]: unknown;
}
