import { useState } from 'react';
import { api } from '../services/api';

interface Props {
  onClose: () => void;
}

function formatCardNumber(v: string) {
  const digits = v.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiry(v: string) {
  const digits = v.replace(/\D/g, '').slice(0, 4);
  if (digits.length > 2) return digits.slice(0, 2) + '/' + digits.slice(2);
  return digits;
}

export default function SubscriptionUpgradeModal({ onClose }: Props) {
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await api.subscriptions.upgrade({
        cardNumber,
        cardExpiry,
        cardCvc,
      });
      setSuccess(true);
      setTimeout(() => onClose(), 2000);
    } catch (e: any) {
      setError(e.message || 'Ошибка оформления');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold" style={{ color: '#1a1a2e' }}>⭐ Premium</h2>
            <p className="text-xs opacity-50 mt-0.5">Безлимитные сессии на 1 год</p>
          </div>
          <button onClick={onClose} className="opacity-30 hover:opacity-60">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="font-bold text-lg mb-1" style={{ color: '#1a1a2e' }}>Подписка оформлена!</h3>
            <p className="text-sm opacity-50">Спасибо за покупку. Сессии без ограничений.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-semibold opacity-60 block mb-1">Номер карты</label>
                <input
                  className="input-field font-mono"
                  placeholder="4242 4242 4242 4242"
                  value={cardNumber}
                  onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                  maxLength={19}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold opacity-60 block mb-1">Срок действия</label>
                  <input
                    className="input-field font-mono"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={e => setCardExpiry(formatExpiry(e.target.value))}
                    maxLength={5}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold opacity-60 block mb-1">CVC</label>
                  <input
                    className="input-field font-mono"
                    placeholder="123"
                    type="password"
                    value={cardCvc}
                    onChange={e => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    maxLength={3}
                  />
                </div>
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>

            <div className="bg-black/5 rounded-2xl p-4 mb-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="opacity-60">Premium (1 год)</span>
                <span className="font-bold" style={{ color: '#1a1a2e' }}>0 ₽</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="opacity-60">Налоги</span>
                <span className="font-bold" style={{ color: '#1a1a2e' }}>0 ₽</span>
              </div>
              <div className="border-t border-black/10 mt-2 pt-2 flex items-center justify-between">
                <span className="font-semibold">Итого</span>
                <span className="font-bold text-lg" style={{ color: '#1a1a2e' }}>0 ₽</span>
              </div>
            </div>

            <p className="text-[10px] opacity-30 mb-4 text-center">
              * Демо-режим. Настоящая оплата не производится.
            </p>

            <button
              onClick={submit}
              disabled={loading || cardNumber.replace(/\s/g, '').length < 16 || cardExpiry.length < 5 || cardCvc.length < 3}
              className="w-full py-3 rounded-2xl font-semibold text-sm text-white transition-all hover:shadow-lg disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Обработка...
                </span>
              ) : (
                'Оформить подписку — 0 ₽'
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
