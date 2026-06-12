import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../models/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/request', authMiddleware, (req: AuthRequest, res: Response) => {
  const { toUserId } = req.body;
  if (!toUserId || toUserId === req.userId) {
    res.status(400).json({ error: 'Некорректный ID пользователя' });
    return;
  }

  db.get(
    `SELECT id FROM friends WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)`,
    [req.userId, toUserId, toUserId, req.userId],
    (err, existing: any) => {
      if (existing) {
        res.status(409).json({ error: 'Запрос уже существует' });
        return;
      }

      const id = uuidv4();
      db.run(
        `INSERT INTO friends (id, requester_id, addressee_id, status) VALUES (?, ?, ?, 'pending')`,
        [id, req.userId, toUserId],
        function (err2) {
          if (err2) {
            res.status(500).json({ error: 'Ошибка создания запроса' });
            return;
          }
          db.get(`SELECT nickname FROM users WHERE id = ?`, [req.userId], (err3, fromUser: any) => {
            if (!err3 && fromUser) {
              const io = req.app.get('io');
              io.to(`user:${toUserId}`).emit('friend:request', {
                requestId: id,
                from: req.userId,
                fromNickname: fromUser.nickname,
              });
            }
          });
          res.status(201).json({ id });
        }
      );
    }
  );
});

router.post('/:id/accept', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  db.get(
    `SELECT * FROM friends WHERE id = ? AND addressee_id = ? AND status = 'pending'`,
    [id, req.userId],
    (err, row: any) => {
      if (err || !row) {
        res.status(404).json({ error: 'Запрос не найден' });
        return;
      }
      db.run(`UPDATE friends SET status = 'accepted' WHERE id = ?`, [id], function () {
        const io = req.app.get('io');
        io.to(`user:${row.requester_id}`).emit('friend:accepted', {
          requestId: id,
          from: req.userId,
        });
        res.json({ ok: true });
      });
    }
  );
});

router.post('/:id/decline', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  db.run(`DELETE FROM friends WHERE id = ? AND addressee_id = ?`, [id, req.userId], function () {
    res.json({ ok: true });
  });
});

router.post('/remove', authMiddleware, (req: AuthRequest, res: Response) => {
  const { friendUserId } = req.body;
  db.run(
    `DELETE FROM friends WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)`,
    [req.userId, friendUserId, friendUserId, req.userId],
    function () {
      res.json({ ok: true });
    }
  );
});

router.get('/list', authMiddleware, (req: AuthRequest, res: Response) => {
  db.all(
    `SELECT f.id, f.status, f.requester_id, f.addressee_id,
            u.id AS friend_id, u.nickname, u.username, u.avatar, u.bio
     FROM friends f
     JOIN users u ON (CASE WHEN f.requester_id = ? THEN u.id = f.addressee_id ELSE u.id = f.requester_id END)
     WHERE (f.requester_id = ? OR f.addressee_id = ?) AND f.status = 'accepted'
     ORDER BY u.nickname`,
    [req.userId, req.userId, req.userId],
    (err, rows: any[]) => {
      if (err) {
        res.status(500).json({ error: 'Ошибка получения списка' });
        return;
      }
      res.json(rows.map((r: any) => ({
        id: r.id, userId: r.friend_id, nickname: r.nickname,
        username: r.username, avatar: r.avatar || '', bio: r.bio || '',
      })));
    }
  );
});

router.get('/pending', authMiddleware, (req: AuthRequest, res: Response) => {
  db.all(
    `SELECT f.id, f.requester_id, u.nickname, u.username
     FROM friends f JOIN users u ON u.id = f.requester_id
     WHERE f.addressee_id = ? AND f.status = 'pending'
     ORDER BY f.created_at DESC`,
    [req.userId],
    (err, rows: any[]) => {
      if (err) {
        res.status(500).json({ error: 'Ошибка получения запросов' });
        return;
      }
      res.json(rows);
    }
  );
});

router.get('/status/:otherUserId', authMiddleware, (req: AuthRequest, res: Response) => {
  const { otherUserId } = req.params;
  db.get(
    `SELECT id, requester_id, addressee_id, status FROM friends
     WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)`,
    [req.userId, otherUserId, otherUserId, req.userId],
    (err, row: any) => {
      if (!row) return res.json({ status: 'none' });
      res.json({ id: row.id, status: row.status, requesterId: row.requester_id });
    }
  );
});

export default router;
