import { Router, Request, Response, NextFunction } from 'express';
import DataRequest from '../models/DataRequest';
import CampaignType from '../models/CampaignType';

const router = Router();

// GET /data-requests?isResolved=false&sheetName=xxx&campaignId=yyy&limit=100&skip=0
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { isResolved, sheetName, campaignId, limit = '100', skip = '0' } = req.query;
    const filter: Record<string, unknown> = {};

    if (isResolved !== undefined) filter.isResolved = isResolved === 'true';
    if (typeof sheetName === 'string') filter.sheetName = sheetName;
    if (typeof campaignId === 'string') filter.campaign_id = campaignId;

    const [total, items] = await Promise.all([
      DataRequest.countDocuments(filter),
      DataRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(Number(skip))
        .limit(Number(limit))
        .lean(),
    ]);

    res.json({ success: true, total, items });
  } catch (err) {
    next(err);
  }
});

// GET /data-requests/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doc = await DataRequest.findById(req.params.id).lean();
    if (!doc) {
      res.status(404).json({ success: false, message: 'DataRequest not found' });
      return;
    }
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
});

// PATCH /data-requests/:id/resolve — manually mark as resolved
router.patch('/:id/resolve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doc = await DataRequest.findByIdAndUpdate(
      req.params.id,
      { $set: { isResolved: true } },
      { new: true }
    ).lean();
    if (!doc) {
      res.status(404).json({ success: false, message: 'DataRequest not found' });
      return;
    }
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
});

export default router;
