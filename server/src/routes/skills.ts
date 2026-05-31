import { Router, Response } from 'express';
import db from '../models/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', (_req: AuthRequest, res: Response) => {
  db.all(`SELECT * FROM skills ORDER BY name`, [], (err, skills: any[]) => {
    if (err) {
      res.status(500).json({ error: 'Ошибка загрузки навыков' });
      return;
    }
    res.json(skills || []);
  });
});

router.post('/user', authMiddleware, (req: AuthRequest, res: Response) => {
  const { skillIds, proficiency } = req.body;

  if (!skillIds || !Array.isArray(skillIds)) {
    res.status(400).json({ error: 'skillIds должен быть массивом' });
    return;
  }

  const stmt = db.prepare('INSERT OR REPLACE INTO user_skills (user_id, skill_id, proficiency) VALUES (?, ?, ?)');
  for (const skillId of skillIds) {
    stmt.run(req.userId, skillId, proficiency || 3);
  }
  stmt.finalize();

  res.json({ message: 'Навыки обновлены' });
});

router.get('/user/:userId?', authMiddleware, (req: AuthRequest, res: Response) => {
  const userId = req.params.userId || req.userId;

  db.all(
    `SELECT s.id, s.name, s.color, us.proficiency FROM user_skills us
     JOIN skills s ON us.skill_id = s.id WHERE us.user_id = ?`,
    [userId],
    (err, skills: any[]) => {
      if (err) {
        res.status(500).json({ error: 'Ошибка загрузки навыков пользователя' });
        return;
      }
      res.json(skills || []);
    }
  );
});

export default router;
