import { Router, Request, Response, NextFunction } from 'express';
import Tenant from '../models/Tenant';
import CampaignType from '../models/CampaignType';
import DailySendLog from '../models/DailySendLog';
import { getLeadCountsForTenant, SheetLeadCount } from '../services/sheetsService';

const router = Router();

// ---------------------------------------------------------------------------
// Server-side in-memory cache — plain Map, no deps
// Key: tenantId string OR 'all'
// TTL: 5 minutes (override via SHEETS_CACHE_TTL_MS env var)
// ---------------------------------------------------------------------------
interface CacheEntry {
  data: SheetLeadCount[];
  cachedAt: number;
}

const CACHE_TTL_MS = parseInt(process.env.SHEETS_CACHE_TTL_MS ?? String(5 * 60 * 1000), 10);
const leadsCache = new Map<string, CacheEntry>();

// GET /stats/leads
// Query params:
//   tenantId — optional, filter to a single tenant
//   force    — set to 'true' to bypass the server-side cache
router.get('/leads', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId, force } = req.query;
    const cacheKey = tenantId && typeof tenantId === 'string' ? tenantId : 'all';
    const forceRefresh = force === 'true';

    if (!forceRefresh) {
      const cached = leadsCache.get(cacheKey);
      if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
        return res.json({ success: true, data: cached.data, count: cached.data.length, cachedAt: cached.cachedAt });
      }
    }

    const tenantQuery = tenantId && typeof tenantId === 'string' ? { _id: tenantId } : {};
    const tenants = await Tenant.find(tenantQuery).lean();

    const allResults: SheetLeadCount[] = [];

    // Sequential — avoids blasting all tenant batchGet calls at the same instant
    for (const tenant of tenants) {
      const credentials = tenant.credentials;
      if (!credentials?.googleServiceAccountJson || !tenant.googleSheetId) continue;

      const campaignTypes = await CampaignType.find({ tenant: tenant._id })
        .select('_id name sheetName')
        .lean();

      if (campaignTypes.length === 0) continue;

      const results = await getLeadCountsForTenant(
        String(tenant._id),
        tenant.name,
        tenant.googleSheetId,
        credentials.googleServiceAccountJson as Record<string, unknown>,
        campaignTypes.map((ct) => ({ _id: String(ct._id), name: ct.name, sheetName: ct.sheetName }))
      );

      allResults.push(...results);
    }

    const cachedAt = Date.now();
    leadsCache.set(cacheKey, { data: allResults, cachedAt });

    res.json({ success: true, data: allResults, count: allResults.length, cachedAt });
  } catch (err) {
    next(err);
  }
});

// GET /stats/sending-capacity
router.get('/sending-capacity', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const capacity = parseInt(process.env.DAILY_SEND_CAPACITY ?? '50', 10);
    const dateStr = new Date().toISOString().slice(0, 10);

    const logs = await DailySendLog.find({ dateStr }).sort({ accountEmail: 1 }).lean();

    const accounts = logs.map((l) => ({
      accountEmail: l.accountEmail,
      used: l.count,
      capacity,
    }));

    const totalUsed = logs.reduce((sum, l) => sum + l.count, 0);
    const totalCapacity = capacity * (accounts.length || 1);

    res.json({ success: true, dateStr, capacity, totalUsed, totalCapacity, accounts });
  } catch (err) {
    next(err);
  }
});

export default router;
