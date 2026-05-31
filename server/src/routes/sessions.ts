import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../models/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const { guestId, skillId } = req.body;

  if (!guestId || !skillId) {
    res.status(400).json({ error: 'Необходимы guestId и skillId' });
    return;
  }

  const id = uuidv4();
  const startTime = new Date().toISOString();
  const endTime = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  db.run(
    `INSERT INTO sessions (id, host_id, guest_id, skill_id, status, start_time, end_time) VALUES (?, ?, ?, ?, 'active', ?, ?)`,
    [id, req.userId, guestId, skillId, startTime, endTime],
    function (err) {
      if (err) {
        res.status(500).json({ error: 'Ошибка создания сессии' });
        return;
      }

      db.get(`SELECT nickname FROM users WHERE id = ?`, [req.userId], (err2, host: any) => {
        if (!err2 && host) {
          const io = req.app.get('io');
          io.to(`user:${guestId}`).emit('notification:session_created', {
            sessionId: id,
            fromNickname: host.nickname,
          });
        }
      });

      res.status(201).json({ id, startTime, endTime });
    }
  );
});

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  db.all(
    `SELECT * FROM sessions WHERE host_id = ? OR guest_id = ? ORDER BY created_at DESC`,
    [req.userId, req.userId],
    (err, sessions: any[]) => {
      if (err) {
        res.status(500).json({ error: 'Ошибка загрузки сессий' });
        return;
      }
      res.json(sessions || []);
    }
  );
});

router.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  db.get(
    `SELECT * FROM sessions WHERE id = ? AND (host_id = ? OR guest_id = ?)`,
    [req.params.id, req.userId, req.userId],
    (err, session: any) => {
      if (err || !session) {
        res.status(404).json({ error: 'Сессия не найдена' });
        return;
      }
      res.json(session);
    }
  );
});

router.post('/:id/end', authMiddleware, (req: AuthRequest, res: Response) => {
  db.get(`SELECT host_id, guest_id FROM sessions WHERE id = ?`, [req.params.id], (err2, session: any) => {
    if (err2 || !session) {
      res.status(404).json({ error: 'Сессия не найдена' });
      return;
    }

    db.run(
      `UPDATE sessions SET status = 'completed' WHERE id = ? AND (host_id = ? OR guest_id = ?)`,
      [req.params.id, req.userId, req.userId],
      function (err) {
        if (err) {
          res.status(500).json({ error: 'Ошибка завершения сессии' });
          return;
        }
        if (this.changes === 0) {
          res.status(404).json({ error: 'Сессия не найдена' });
          return;
        }

        const otherUserId = session.host_id === req.userId ? session.guest_id : session.host_id;
        db.get(`SELECT nickname FROM users WHERE id = ?`, [req.userId], (err3, me: any) => {
          if (!err3 && me) {
            const io = req.app.get('io');
            io.to(`user:${otherUserId}`).emit('notification:session_ended', {
              sessionId: req.params.id,
              byNickname: me.nickname,
            });
            io.to(`user:${req.userId}`).emit('notification:session_ended', {
              sessionId: req.params.id,
              byNickname: me.nickname,
            });
          }
        });

        res.json({ message: 'Сессия завершена' });
      }
    );
  });
});

export default router;
