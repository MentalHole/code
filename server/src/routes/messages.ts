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

      db.get(
        `SELECT host_id, guest_id FROM sessions WHERE id = ?`,
        [req.params.sessionId],
        (err2, session: any) => {
          if (!err2 && session) {
            const otherId = session.host_id === req.userId ? session.guest_id : session.host_id;
            db.get(`SELECT nickname FROM users WHERE id = ?`, [req.userId], (err3, sender: any) => {
              if (!err3 && sender) {
                const io = req.app.get('io');
                io.to(`user:${otherId}`).emit('notification:message', {
                  sessionId: req.params.sessionId,
                  fromNickname: sender.nickname,
                  content: content.substring(0, 80),
                });
              }
            });
          }
        }
      );

      res.status(201).json({ id, content, sender_id: req.userId, type: type || 'text' });
    }
  );
});

export default router;
