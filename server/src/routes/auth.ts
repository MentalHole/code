import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../models/database';
import { generateToken, authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/register', (req: AuthRequest, res: Response) => {
  const { username, email, password, nickname, bio, skillIds, searchType } = req.body;

  if (!username || !email || !password || !nickname) {
    res.status(400).json({ error: 'Заполните обязательные поля' });
    return;
  }

  const validTypes = ['student', 'mentor', 'both'];
  const type = validTypes.includes(searchType) ? searchType : 'both';

  const id = uuidv4();
  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(
    `INSERT INTO users (id, username, email, password, nickname, bio, search_type) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, username, email, hashedPassword, nickname, bio || '', type],
    function (err) {
      if (err) {
        const msg = (err as any).message || '';
        if (msg.includes('UNIQUE')) {
          res.status(409).json({ error: 'Имя пользователя или email уже существуют' });
        } else {
          res.status(500).json({ error: 'Ошибка регистрации' });
        }
        return;
      }

      if (skillIds && Array.isArray(skillIds) && skillIds.length > 0) {
        const stmt = db.prepare('INSERT OR IGNORE INTO user_skills (user_id, skill_id, proficiency) VALUES (?, ?, 3)');
        for (const skillId of skillIds) {
          stmt.run(id, skillId);
        }
        stmt.finalize();
      }

      const token = generateToken(id);
      res.status(201).json({ token, user: { id, username, email, nickname, bio: bio || '', searchType: type } });
    }
  );
});

router.post('/login', (req: AuthRequest, res: Response) => {
  const { username, email, password } = req.body;
  const credential = username || email;

  if (!credential || !password) {
    res.status(400).json({ error: 'Имя пользователя (или email) и пароль обязательны' });
    return;
  }

  db.get(`SELECT * FROM users WHERE username = ? OR email = ?`, [credential, credential], (err, user: any) => {
    if (err || !user) {
      res.status(401).json({ error: 'Неверные учётные данные' });
      return;
    }

    if (!bcrypt.compareSync(password, user.password)) {
      res.status(401).json({ error: 'Неверные учётные данные' });
      return;
    }

    const token = generateToken(user.id);
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
        bio: user.bio,
        searchType: user.search_type || 'both',
      },
    });
  });
});

router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  db.get(`SELECT * FROM users WHERE id = ?`, [req.userId], (err, user: any) => {
    if (err || !user) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    db.all(`SELECT s.id, s.name, s.color, us.proficiency FROM user_skills us JOIN skills s ON us.skill_id = s.id WHERE us.user_id = ?`, [req.userId], (err, skills: any[]) => {
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
        bio: user.bio,
        searchType: user.search_type || 'both',
        skills: skills || [],
      });
    });
  });
});

export default router;
