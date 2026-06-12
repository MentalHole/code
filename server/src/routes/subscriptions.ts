import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../models/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const FREE_LIMIT_SECONDS = 3600;

router.get('/status', authMiddleware, (req: AuthRequest, res: Response) => {
  db.get(`SELECT plan, active, end_date FROM subscriptions WHERE user_id = ?`, [req.userId], (err, sub: any) => {
    if (!sub) {
      res.json({ plan: 'free', active: true, freeLimitSeconds: FREE_LIMIT_SECONDS });
      return;
    }
    res.json({ plan: sub.plan, active: !!sub.active, freeLimitSeconds: FREE_LIMIT_SECONDS });
  });
});

router.post('/upgrade', authMiddleware, (req: AuthRequest, res: Response) => {
  // Fake payment — everything looks real but no charge
  const cardNumber = req.body.cardNumber;
  const cardExpiry = req.body.cardExpiry;
  const cardCvc = req.body.cardCvc;

  if (!cardNumber || !cardExpiry || !cardCvc) {
    res.status(400).json({ error: 'Заполните все данные карты' });
    return;
  }

  // Fake validation
  if (cardNumber.replace(/\s/g, '').length !== 16) {
    res.status(400).json({ error: 'Неверный номер карты' });
    return;
  }
  if (!cardExpiry.match(/^\d{2}\/\d{2}$/)) {
    res.status(400).json({ error: 'Неверный формат срока действия' });
    return;
  }
  if (cardCvc.length < 3) {
    res.status(400).json({ error: 'Неверный CVC-код' });
    return;
  }

  // Simulate processing delay
  setTimeout(() => {
    const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    db.run(
      `INSERT INTO subscriptions (id, user_id, plan, start_date, end_date, active)
       VALUES (?, ?, 'premium', datetime('now'), ?, 1)
       ON CONFLICT(user_id) DO UPDATE SET plan = 'premium', end_date = ?, active = 1, start_date = datetime('now')`,
      [uuidv4(), req.userId, endDate, endDate],
      function (err) {
        if (err) {
          res.status(500).json({ error: 'Ошибка оформления подписки' });
          return;
        }
        res.json({ plan: 'premium', active: true, message: 'Подписка Premium активна!' });
      }
    );
  }, 1500);
});

router.post('/cancel', authMiddleware, (req: AuthRequest, res: Response) => {
  db.run(`UPDATE subscriptions SET active = 0 WHERE user_id = ?`, [req.userId], function () {
    res.json({ plan: 'free', active: false });
  });
});

export { FREE_LIMIT_SECONDS };
export default router;
