import { Router, Request, Response, NextFunction } from 'express';
import * as campaignTypeService from '../services/campaignTypeService';

const router = Router();

// GET /campaign-types?tenantId=xxx
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.query;
    let campaignTypes;
    if (tenantId && typeof tenantId === 'string') {
      campaignTypes = await campaignTypeService.getCampaignTypesByTenant(tenantId);
    } else {
      campaignTypes = await campaignTypeService.getAllCampaignTypes();
    }
    res.json({ success: true, data: campaignTypes, count: campaignTypes.length });
  } catch (err) {
    next(err);
  }
});

// GET /campaign-types/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const campaignType = await campaignTypeService.getCampaignTypeById(req.params.id);
    if (!campaignType) {
      res.status(404).json({ success: false, message: 'Campaign type not found' });
      return;
    }
    res.json({ success: true, data: campaignType });
  } catch (err) {
    next(err);
  }
});

// POST /campaign-types
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const campaignType = await campaignTypeService.createCampaignType(req.body);
    res.status(201).json({ success: true, data: campaignType });
  } catch (err) {
    next(err);
  }
});

// PUT /campaign-types/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const campaignType = await campaignTypeService.updateCampaignType(req.params.id, req.body);
    if (!campaignType) {
      res.status(404).json({ success: false, message: 'Campaign type not found' });
      return;
    }
    res.json({ success: true, data: campaignType });
  } catch (err) {
    next(err);
  }
});

// DELETE /campaign-types/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const campaignType = await campaignTypeService.deleteCampaignType(req.params.id);
    if (!campaignType) {
      res.status(404).json({ success: false, message: 'Campaign type not found' });
      return;
    }
    res.json({ success: true, message: 'Campaign type and related campaigns deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
