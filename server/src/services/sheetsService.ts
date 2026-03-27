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

/**
 * For a single tenant, counts non-header rows in each of their campaign type sheet tabs.
 */
export async function getLeadCountsForTenant(
  tenantId: string,
  tenantName: string,
  googleSheetId: string,
  serviceAccountJson: Record<string, unknown>,
  campaignTypes: { _id: string; name: string; sheetName: string }[]
): Promise<SheetLeadCount[]> {
  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccountJson,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const results = await Promise.all(
    campaignTypes.map(async (ct) => {
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: googleSheetId,
          // A1 notation: grab column A of the sheet to count rows efficiently
          range: `${ct.sheetName}!A:A`,
        });

        const rows = response.data.values ?? [];
        // Subtract 1 for the header row; clamp to 0 minimum
        const leadCount = Math.max(0, rows.length - 1);

        return {
          tenantId,
          tenantName,
          campaignTypeId: String(ct._id),
          campaignTypeName: ct.name,
          sheetName: ct.sheetName,
          leadCount,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return {
          tenantId,
          tenantName,
          campaignTypeId: String(ct._id),
          campaignTypeName: ct.name,
          sheetName: ct.sheetName,
          leadCount: 0,
          error: message,
        };
      }
    })
  );

  return results;
}
