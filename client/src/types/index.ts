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

export interface AutoReplyFollowUp {
  enabled: boolean;
  intervalHours: number;
  maxFollowUps: number;
  bodyText: string;
  link: string;
}

export interface DataRequestFollowUp {
  enabled: boolean;
  requiredFields: string[];
  subject: string;
  bodyText: string;
  priorityField: string;
}

export interface Callback {
  enabled: boolean;
  url: string;
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
  autoReplyFollowUp: AutoReplyFollowUp;
  dataRequestFollowUp: DataRequestFollowUp;
  replyPlaybook: Record<string, unknown> | null;
  callback: Callback;
  followUpReply: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DataRequest {
  _id: string;
  lead_email: string;
  campaign_id: string;
  googleSheetId: string;
  sheetName: string;
  sheetRowNumber: number;
  requestedFields: string[];
  emailAccount: string;
  replyEmailId: string;
  isResolved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DataRequestsResponse {
  success: boolean;
  total: number;
  items: DataRequest[];
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

export interface AutoReplyRecord {
  _id: string;
  lead_email: string;
  campaign_id: string;
  googleSheetId: string;
  sheetName: string;
  sheetRowNumber: number;
  emailAccount: string;
  replyEmailId: string;
  replySubject: string;
  followUpCount: number;
  lastFollowUpAt: string | null;
  isResolved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SendingCapacityAccount {
  accountEmail: string;
  used: number;
  capacity: number;
}

export interface SendingCapacityResponse {
  success: boolean;
  dateStr: string;
  capacity: number;
  totalUsed: number;
  totalCapacity: number;
  accounts: SendingCapacityAccount[];
}

export interface AutoReplyRecordsResponse {
  success: boolean;
  total: number;
  items: AutoReplyRecord[];
}
