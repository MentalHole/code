import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../models/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const { toUserId, skillId, skillName } = req.body;
  if (!toUserId || !skillId) {
    res.status(400).json({ error: 'Необходимы toUserId и skillId' });
    return;
  }

  const id = uuidv4();
  db.run(
    `INSERT INTO session_requests (id, from_user_id, to_user_id, skill_id, status) VALUES (?, ?, ?, ?, 'pending')`,
    [id, req.userId, toUserId, skillId],
    function (err) {
      if (err) {
        res.status(500).json({ error: 'Ошибка создания запроса' });
        return;
      }
      db.get(`SELECT nickname FROM users WHERE id = ?`, [req.userId], (err2, fromUser: any) => {
        if (!err2 && fromUser) {
          const io = req.app.get('io');
          io.to(`user:${toUserId}`).emit('session:request', {
            requestId: id,
            from: req.userId,
            fromNickname: fromUser.nickname,
            skillName: skillName || '',
          });
        }
      });
      res.status(201).json({ id });
    }
  );
});

router.post('/:id/accept', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  db.get(`SELECT * FROM session_requests WHERE id = ? AND status = 'pending'`, [id], (err, row: any) => {
    if (err || !row) {
      res.status(404).json({ error: 'Запрос не найден' });
      return;
    }
    if (row.to_user_id !== req.userId) {
      res.status(403).json({ error: 'Это не ваш запрос' });
      return;
    }

    const sessionId = uuidv4();
    const startTime = new Date().toISOString();
    const endTime = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    db.run(
      `INSERT INTO sessions (id, host_id, guest_id, skill_id, status, start_time, end_time) VALUES (?, ?, ?, ?, 'active', ?, ?)`,
      [sessionId, row.from_user_id, row.to_user_id, row.skill_id, startTime, endTime],
      function (err2) {
        if (err2) {
          res.status(500).json({ error: 'Ошибка создания сессии' });
          return;
        }

        db.run(`UPDATE session_requests SET status = 'accepted' WHERE id = ?`, [id]);

        const io = req.app.get('io');
        io.to(`user:${row.from_user_id}`).emit('session:request:accepted', {
          requestId: id,
          sessionId,
        });
        io.to(`user:${row.to_user_id}`).emit('session:request:accepted', {
          requestId: id,
          sessionId,
        });

        res.status(201).json({ id: sessionId, startTime, endTime });
      }
    );
  });
});

router.post('/:id/decline', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  db.get(`SELECT * FROM session_requests WHERE id = ? AND status = 'pending'`, [id], (err, row: any) => {
    if (err || !row) {
      res.status(404).json({ error: 'Запрос не найден' });
      return;
    }
    if (row.to_user_id !== req.userId) {
      res.status(403).json({ error: 'Это не ваш запрос' });
      return;
    }
    db.run(`UPDATE session_requests SET status = 'declined' WHERE id = ?`, [id]);
    const io = req.app.get('io');
    io.to(`user:${row.from_user_id}`).emit('session:request:declined', {
      requestId: id,
    });
    res.json({ ok: true });
  });
});

router.get('/pending', authMiddleware, (req: AuthRequest, res: Response) => {
  db.all(
    `SELECT sr.id, sr.from_user_id, sr.to_user_id, sr.skill_id, sr.status, u.nickname AS from_nickname,
            s.name AS skill_name
     FROM session_requests sr
     JOIN users u ON u.id = sr.from_user_id
     JOIN skills s ON s.id = sr.skill_id
     WHERE sr.to_user_id = ? AND sr.status = 'pending'
     ORDER BY sr.created_at DESC`,
    [req.userId],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: 'Ошибка получения запросов' });
        return;
      }
      res.json(rows);
    }
  );
});

export default router;
