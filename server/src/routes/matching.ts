import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { findMatchesForUser, searchUsersBySkills } from '../utils/matching';

const router = Router();

router.get('/recommendations', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const filterType = req.query.type as string | undefined;
    const matches = await findMatchesForUser(req.userId!, 20, filterType);
    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка подбора' });
  }
});

router.get('/search', authMiddleware, async (req: AuthRequest, res: Response) => {
  const query = req.query.q as string;
  if (!query) {
    res.status(400).json({ error: 'Поисковый запрос обязателен' });
    return;
  }

  try {
    const filterType = req.query.type as string | undefined;
    const results = await searchUsersBySkills(query, req.userId!, filterType);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка поиска' });
  }
});

export default router;
