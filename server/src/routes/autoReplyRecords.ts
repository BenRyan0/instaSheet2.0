import { Router, Request, Response, NextFunction } from 'express';
import AutoReplyRecord from '../models/AutoReplyRecord';

const router = Router();

// GET /auto-reply-records?isResolved=false&sheetName=X&campaignId=X&hasFollowUps=true&limit=200&skip=0
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { isResolved, sheetName, campaignId, hasFollowUps, limit = '200', skip = '0' } = req.query;

    const query: Record<string, unknown> = {};
    if (isResolved !== undefined) query.isResolved = isResolved === 'true';
    if (sheetName && typeof sheetName === 'string') query.sheetName = sheetName;
    if (campaignId && typeof campaignId === 'string') query.campaign_id = campaignId;
    if (hasFollowUps === 'true') query.followUpCount = { $gt: 0 };
    if (hasFollowUps === 'false') query.followUpCount = 0;

    const [items, total] = await Promise.all([
      AutoReplyRecord.find(query)
        .sort({ createdAt: -1 })
        .skip(Number(skip))
        .limit(Number(limit))
        .lean(),
      AutoReplyRecord.countDocuments(query),
    ]);

    res.json({ success: true, total, items });
  } catch (err) {
    next(err);
  }
});

// GET /auto-reply-records/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await AutoReplyRecord.findById(req.params.id).lean();
    if (!record) {
      res.status(404).json({ success: false, message: 'Auto-reply record not found' });
      return;
    }
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
});

// PATCH /auto-reply-records/:id/resolve
router.patch('/:id/resolve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await AutoReplyRecord.findByIdAndUpdate(
      req.params.id,
      { $set: { isResolved: true } },
      { new: true }
    ).lean();
    if (!record) {
      res.status(404).json({ success: false, message: 'Auto-reply record not found' });
      return;
    }
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
});

export default router;
