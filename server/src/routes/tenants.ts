import { Router, Request, Response, NextFunction } from 'express';
import * as tenantService from '../services/tenantService';

const router = Router();

// GET /tenants
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const tenants = await tenantService.getAllTenants();
    res.json({ success: true, data: tenants, count: tenants.length });
  } catch (err) {
    next(err);
  }
});

// GET /tenants/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenant = await tenantService.getTenantById(req.params.id);
    if (!tenant) {
      res.status(404).json({ success: false, message: 'Tenant not found' });
      return;
    }
    res.json({ success: true, data: tenant });
  } catch (err) {
    next(err);
  }
});

// GET /tenants/:id/stats
router.get('/:id/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await tenantService.getTenantStats(req.params.id);
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
});

// GET /tenants/:id/instantly-campaigns
// Proxies the Instantly.ai v2 API using the tenant's stored API key,
// fetches all campaigns via cursor pagination and returns them newest-first.
router.get('/:id/instantly-campaigns', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenant = await tenantService.getTenantById(req.params.id);
    if (!tenant) {
      res.status(404).json({ success: false, message: 'Tenant not found' });
      return;
    }

    const apiKey = (tenant.credentials?.instantlyApiKey ?? '').trim();
    if (!apiKey) {
      res.status(400).json({
        success: false,
        message: `No Instantly API key found for tenant "${tenant.name}". Go to Tenants → Edit → API Credentials tab and save the key.`,
      });
      return;
    }

    const BASE_URL = 'https://api.instantly.ai/api/v2/campaigns';
    const campaigns: unknown[] = [];
    let startingAfter: string | null = null;

    while (true) {
      const url = new URL(BASE_URL);
      url.searchParams.set('limit', '100');
      if (startingAfter) url.searchParams.set('starting_after', startingAfter);

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!response.ok) {
        const errText = await response.text();
        res.status(response.status).json({ success: false, message: `Instantly API error: ${errText}` });
        return;
      }

      const data = await response.json() as { items: unknown[]; next_starting_after?: string };
      campaigns.push(...data.items);

      if (!data.next_starting_after) break;
      startingAfter = data.next_starting_after;
    }

    // Sort newest first
    (campaigns as { timestamp_created: string }[]).sort(
      (a, b) => new Date(b.timestamp_created).getTime() - new Date(a.timestamp_created).getTime()
    );

    res.json({ success: true, data: campaigns, count: campaigns.length });
  } catch (err) {
    next(err);
  }
});

// POST /tenants
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenant = await tenantService.createTenant(req.body);
    res.status(201).json({ success: true, data: tenant });
  } catch (err) {
    next(err);
  }
});

// PUT /tenants/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenant = await tenantService.updateTenant(req.params.id, req.body);
    if (!tenant) {
      res.status(404).json({ success: false, message: 'Tenant not found' });
      return;
    }
    res.json({ success: true, data: tenant });
  } catch (err) {
    next(err);
  }
});

// DELETE /tenants/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenant = await tenantService.deleteTenant(req.params.id);
    if (!tenant) {
      res.status(404).json({ success: false, message: 'Tenant not found' });
      return;
    }
    res.json({ success: true, message: 'Tenant and related data deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
