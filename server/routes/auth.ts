import express, { Request, Response, Router } from 'express';

const router: Router = express.Router();

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || '';


interface SessionData {
  isAdmin?: boolean;
  userId?: string;
  destroy?: (callback: (err?: Error) => void) => void;
}

// POST /api/auth/login
router.post('/login', async (req: Request<{}, {}, { username: string; password: string }>, res: Response)=> {
  try {
    const { username, password } = req.body;
    console.log('username : ', username);
    console.log('pass: ', password);
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });

    }

    if (username === ADMIN_USER && password === ADMIN_PASS) {
      const session = (req as any).session as SessionData;
      if (session) {
        session.isAdmin = true;
        session.userId = username;
      }
      res.json({ success: true, message: 'Login successful' });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ error: 'Failed to process login' });
    return;
  }
});

// POST /api/auth/logout
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    const session = (req as any).session as SessionData | undefined;
    if (session?.destroy) {
      session.destroy((err) => {
        if (err) {
          console.error('Error destroying session:', err);
          res.status(500).json({ error: 'Failed to logout' });
          return;
        }
        res.clearCookie('connect.sid');
        res.json({ success: true, message: 'Logout successful' });
      });
    } else {
      res.clearCookie('connect.sid');
      res.json({ success: true, message: 'Logout successful' });
    }
  } catch (err) {
    console.error('Error during logout:', err);
    res.status(500).json({ error: 'Failed to logout' });
    return;
  }
});

// GET /api/auth/check
router.get('/check', async (req: Request, res: Response): Promise<void> => {
  try {
    const session = (req as any).session as SessionData | undefined;
    if (session?.isAdmin) {
      res.json({ isAdmin: true, authenticated: true });
    } else {
      res.json({ isAdmin: false, authenticated: false });
    }
  } catch (err) {
    console.error('Error checking auth status:', err);
    res.status(500).json({ error: 'Failed to check auth status' });
    return;
  }
});

export default router;

