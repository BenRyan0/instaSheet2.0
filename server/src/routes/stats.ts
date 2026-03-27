import { Router, Request, Response, NextFunction } from 'express';
import Tenant from '../models/Tenant';
import CampaignType from '../models/CampaignType';
import { getLeadCountsForTenant } from '../services/sheetsService';

const router = Router();

// GET /stats/leads
// Returns lead counts per campaign type, sourced from each tenant's Google Sheet.
// Query params:
//   tenantId — optional, filter to a single tenant
router.get('/leads', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.query;

    const tenantQuery = tenantId && typeof tenantId === 'string'
      ? { _id: tenantId }
      : {};

    const tenants = await Tenant.find(tenantQuery).lean();

    const allResults = await Promise.all(
      tenants.map(async (tenant) => {
        const credentials = tenant.credentials;

        if (!credentials?.googleServiceAccountJson || !tenant.googleSheetId) {
          return [];
        }

        const campaignTypes = await CampaignType.find({ tenant: tenant._id })
          .select('_id name sheetName')
          .lean();

        if (campaignTypes.length === 0) return [];

        return getLeadCountsForTenant(
          String(tenant._id),
          tenant.name,
          tenant.googleSheetId,
          credentials.googleServiceAccountJson as Record<string, unknown>,
          campaignTypes.map((ct) => ({
            _id: String(ct._id),
            name: ct.name,
            sheetName: ct.sheetName,
          }))
        );
      })
    );

    const data = allResults.flat();
    res.json({ success: true, data, count: data.length });
  } catch (err) {
    next(err);
  }
});

export default router;
