import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../models/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/:sessionId', authMiddleware, (req: AuthRequest, res: Response) => {
  db.all(
    `SELECT m.*, u.nickname, u.avatar FROM messages m
     JOIN users u ON m.sender_id = u.id
     WHERE m.session_id = ?
     ORDER BY m.created_at ASC`,
    [req.params.sessionId],
    (err, messages: any[]) => {
      if (err) {
        res.status(500).json({ error: 'Ошибка загрузки сообщений' });
        return;
      }
      res.json(messages || []);
    }
  );
});

router.post('/:sessionId', authMiddleware, (req: AuthRequest, res: Response) => {
  const { content, type } = req.body;

  if (!content) {
    res.status(400).json({ error: 'Текст сообщения обязателен' });
    return;
  }

  const id = uuidv4();

  db.run(
    `INSERT INTO messages (id, session_id, sender_id, content, type) VALUES (?, ?, ?, ?, ?)`,
    [id, req.params.sessionId, req.userId, content, type || 'text'],
    function (err) {
      if (err) {
        res.status(500).json({ error: 'Ошибка отправки сообщения' });
        return;
      }
      res.status(201).json({ id, content, sender_id: req.userId, type: type || 'text' });
    }
  );
});

export default router;
