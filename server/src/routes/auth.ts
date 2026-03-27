import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { requireAuth, AuthRequest } from '../middleware/requireAuth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
const JWT_EXPIRES = '7d';

const signToken = (userId: string, username: string) =>
  jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

// GET /auth/status — public, tells client whether any users exist
router.get('/status', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await User.countDocuments();
    res.json({ success: true, data: { hasUsers: count > 0 } });
  } catch (err) {
    next(err);
  }
});

// POST /auth/register — only allowed when no users exist (creates first active account)
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await User.countDocuments();
    if (count > 0) {
      res.status(403).json({
        success: false,
        message: 'Registration is closed. Request access from an existing user.',
      });
      return;
    }

    const { username, password } = req.body;
    if (!username?.trim() || !password) {
      res.status(400).json({ success: false, message: 'Username and password are required' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
      return;
    }

    const user = await User.create({ username: username.trim(), password, status: 'active' });
    const token = signToken(String(user._id), user.username);
    res.status(201).json({
      success: true,
      data: { token, username: user.username, status: user.status },
    });
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      res.status(409).json({ success: false, message: 'Username already taken' });
      return;
    }
    next(err);
  }
});

// POST /auth/request — submit an access request when users already exist
router.post('/request', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await User.countDocuments({ status: 'active' });
    if (count === 0) {
      res.status(403).json({
        success: false,
        message: 'No accounts exist yet. Use the sign-up form.',
      });
      return;
    }

    const { username, password } = req.body;
    if (!username?.trim() || !password) {
      res.status(400).json({ success: false, message: 'Username and password are required' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
      return;
    }

    const existing = await User.findOne({ username: username.trim().toLowerCase() });
    if (existing) {
      res.status(409).json({ success: false, message: 'Username already taken' });
      return;
    }

    await User.create({ username: username.trim(), password, status: 'pending' });
    res.status(201).json({
      success: true,
      data: { message: 'Access request submitted. An admin will review it shortly.' },
    });
  } catch (err) {
    next(err);
  }
});

// POST /auth/login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ success: false, message: 'Username and password are required' });
      return;
    }

    const user = await User.findOne({ username: username.trim().toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ success: false, message: 'Invalid username or password' });
      return;
    }

    if (user.status === 'pending') {
      res.status(403).json({
        success: false,
        message: 'Your account is pending approval. Please wait for an admin to approve your request.',
      });
      return;
    }
    if (user.status === 'rejected') {
      res.status(403).json({ success: false, message: 'Your access request was rejected.' });
      return;
    }

    const token = signToken(String(user._id), user.username);
    res.json({ success: true, data: { token, username: user.username, status: user.status } });
  } catch (err) {
    next(err);
  }
});

// GET /auth/me — validate token and return current user
router.get('/me', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.userId).select('-password').lean();
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// GET /auth/pending — list pending access requests (protected)
router.get('/pending', requireAuth, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const users = await User.find({ status: 'pending' }).select('-password').sort({ createdAt: 1 }).lean();
    res.json({ success: true, data: users, count: users.length });
  } catch (err) {
    next(err);
  }
});

// POST /auth/approve/:id — approve a pending request (protected)
router.post('/approve/:id', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'active' },
      { new: true }
    ).select('-password');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// POST /auth/reject/:id — reject a pending request (protected)
router.post('/reject/:id', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    ).select('-password');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// DELETE /auth/users/:id — remove a user entirely (protected)
router.delete('/users/:id', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.userId === req.params.id) {
      res.status(400).json({ success: false, message: 'You cannot delete your own account' });
      return;
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User removed' });
  } catch (err) {
    next(err);
  }
});

// GET /auth/users — list all users (protected)
router.get('/users', requireAuth, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: 1 }).lean();
    res.json({ success: true, data: users, count: users.length });
  } catch (err) {
    next(err);
  }
});

export default router;
