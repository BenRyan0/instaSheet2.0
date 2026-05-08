import { google } from 'googleapis';

export interface SheetLeadCount {
  tenantId: string;
  tenantName: string;
  campaignTypeId: string;
  campaignTypeName: string;
  sheetName: string;
  leadCount: number;
  error?: string;
}

const RETRYABLE_CODES = new Set([429, 500, 502, 503, 504]);

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const status =
        (err as { code?: number })?.code ??
        (err as { response?: { status?: number } })?.response?.status;

      if (status !== undefined && RETRYABLE_CODES.has(status) && attempt < maxAttempts - 1) {
        const baseMs = 1000 * Math.pow(2, attempt);
        const jitter = baseMs * 0.3 * (Math.random() * 2 - 1);
        await new Promise((resolve) => setTimeout(resolve, Math.round(baseMs + jitter)));
        lastError = err;
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

/**
 * For a single tenant, counts non-header rows in each campaign type sheet tab.
 * Uses batchGet to fetch all tabs in ONE API call instead of one call per tab.
 * valueRanges in the response are positionally ordered to match the input ranges array.
 */
export async function getLeadCountsForTenant(
  tenantId: string,
  tenantName: string,
  googleSheetId: string,
  serviceAccountJson: Record<string, unknown>,
  campaignTypes: { _id: string; name: string; sheetName: string }[]
): Promise<SheetLeadCount[]> {
  if (campaignTypes.length === 0) return [];

  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccountJson,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  // Quote sheet names to handle spaces and special characters.
  // Single quotes inside the name must be escaped as ''.
  // Using the sheet name alone (no column qualifier) reads all columns,
  // so rows with an empty column A are not missed.
  const ranges = campaignTypes.map((ct) => {
    const escaped = ct.sheetName.replace(/'/g, "''");
    return `'${escaped}'`;
  });

  try {
    const response = await withRetry(() =>
      sheets.spreadsheets.values.batchGet({
        spreadsheetId: googleSheetId,
        ranges,
      })
    );

    const valueRanges = response.data.valueRanges ?? [];

    return campaignTypes.map((ct, i) => {
      const rows = valueRanges[i]?.values ?? [];
      // The API strips trailing empty cells per row, so row.length === 0 means
      // the row is entirely empty — exclude those from the lead count.
      const nonEmptyRows = rows.filter((row) => row.length > 0);
      return {
        tenantId,
        tenantName,
        campaignTypeId: String(ct._id),
        campaignTypeName: ct.name,
        sheetName: ct.sheetName,
        leadCount: Math.max(0, nonEmptyRows.length - 1), // -1 for header row
      };
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return campaignTypes.map((ct) => ({
      tenantId,
      tenantName,
      campaignTypeId: String(ct._id),
      campaignTypeName: ct.name,
      sheetName: ct.sheetName,
      leadCount: 0,
      error: message,
    }));
  }
}
