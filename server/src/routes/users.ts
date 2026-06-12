import { Router, Response } from 'express';
import db from '../models/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/profile/:userId', authMiddleware, (req: AuthRequest, res: Response) => {
  db.get(`SELECT id, username, nickname, avatar, bio, search_type FROM users WHERE id = ?`, [req.params.userId], (err, user: any) => {
    if (err || !user) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    db.all(
      `SELECT s.id, s.name, s.color, us.proficiency FROM user_skills us
       JOIN skills s ON us.skill_id = s.id WHERE us.user_id = ?`,
      [req.params.userId],
      (err, skills: any[]) => {
        res.json({ ...user, searchType: user.search_type || 'both', skills: skills || [] });
      }
    );
  });
});

router.get('/all', authMiddleware, (req: AuthRequest, res: Response) => {
  db.all(`SELECT id, username, nickname, avatar, bio, search_type FROM users WHERE id != ? ORDER BY nickname`, [req.userId], (err, users: any[]) => {
    if (err) {
      res.status(500).json({ error: 'Ошибка загрузки пользователей' });
      return;
    }
    const userIds = users.map((u: any) => u.id);
    if (userIds.length === 0) return res.json([]);

    const placeholders = userIds.map(() => '?').join(',');
    db.all(
      `SELECT us.user_id, s.id as skill_id, s.name, s.color FROM user_skills us JOIN skills s ON us.skill_id = s.id WHERE us.user_id IN (${placeholders})`,
      userIds, (err2, skillRows: any[]) => {
        if (err2) return res.json(users.map((u: any) => ({ ...u, searchType: u.search_type || 'both', sharedSkills: [] })));

        const skillMap: { [uid: string]: { name: string; color: string }[] } = {};
        for (const r of skillRows) {
          if (!skillMap[r.user_id]) skillMap[r.user_id] = [];
          skillMap[r.user_id].push({ name: r.name, color: r.color });
        }

        res.json(users.map((u: any) => ({
          userId: u.id, username: u.username, nickname: u.nickname,
          avatar: u.avatar || '', bio: u.bio || '', searchType: u.search_type || 'both',
          similarity: 0, sharedSkills: skillMap[u.id] || [],
          matchReason: '',
        })));
      }
    );
  });
});

router.put('/profile', authMiddleware, (req: AuthRequest, res: Response) => {
  const { nickname, bio, avatar, searchType } = req.body;
  const validTypes = ['student', 'mentor', 'both'];
  const type = validTypes.includes(searchType) ? searchType : null;

  db.run(
    `UPDATE users SET nickname = COALESCE(?, nickname), bio = COALESCE(?, bio), avatar = COALESCE(?, avatar)${type ? ', search_type = ?' : ''} WHERE id = ?`,
    type ? [nickname, bio, avatar, type, req.userId] : [nickname, bio, avatar, req.userId],
    function (err) {
      if (err) {
        res.status(500).json({ error: 'Ошибка обновления профиля' });
        return;
      }
      res.json({ message: 'Профиль обновлён' });
    }
  );
});

export default router;
