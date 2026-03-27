import { Router, Request, Response, NextFunction } from 'express';
import * as campaignService from '../services/campaignService';

const router = Router();

// GET /campaigns?tenantId=xxx&campaignTypeId=yyy
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId, campaignTypeId } = req.query;
    const campaigns = await campaignService.getCampaigns({
      tenantId: typeof tenantId === 'string' ? tenantId : undefined,
      campaignTypeId: typeof campaignTypeId === 'string' ? campaignTypeId : undefined,
    });
    res.json({ success: true, data: campaigns, count: campaigns.length });
  } catch (err) {
    next(err);
  }
});

// GET /campaigns/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const campaign = await campaignService.getCampaignById(req.params.id);
    if (!campaign) {
      res.status(404).json({ success: false, message: 'Campaign not found' });
      return;
    }
    res.json({ success: true, data: campaign });
  } catch (err) {
    next(err);
  }
});

// POST /campaigns
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const campaign = await campaignService.createCampaign(req.body);
    res.status(201).json({ success: true, data: campaign });
  } catch (err) {
    next(err);
  }
});

// PUT /campaigns/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const campaign = await campaignService.updateCampaign(req.params.id, req.body);
    if (!campaign) {
      res.status(404).json({ success: false, message: 'Campaign not found' });
      return;
    }
    res.json({ success: true, data: campaign });
  } catch (err) {
    next(err);
  }
});

// DELETE /campaigns/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const campaign = await campaignService.deleteCampaign(req.params.id);
    if (!campaign) {
      res.status(404).json({ success: false, message: 'Campaign not found' });
      return;
    }
    res.json({ success: true, message: 'Campaign deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
