import { api } from '../services/api';
import { getSocket } from '../services/socket';

interface Props {
  requestId: string;
  fromNickname: string;
  skillName?: string;
  from: string;
  onClose: () => void;
}

export default function SessionRequestModal({ requestId, fromNickname, skillName, from, onClose }: Props) {
  const accept = async () => {
    try {
      const session = await api.sessionRequests.accept(requestId);
      onClose();
      window.location.href = `/session/${session.id}`;
    } catch (err) {
      console.error(err);
    }
  };

  const decline = async () => {
    try {
      await api.sessionRequests.decline(requestId);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="glass-card rounded-3xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl animate-bounce-in">
        <div className="text-6xl mb-4">🤝</div>
        <h2 className="text-xl font-bold mb-1" style={{ color: '#1a1a2e' }}>
          Запрос на сессию
        </h2>
        <p className="text-sm opacity-60 mb-2">
          {fromNickname} хочет начать учебную сессию
        </p>
        {skillName && (
          <p className="text-xs opacity-40 mb-6">
            Навык: {skillName}
          </p>
        )}
        <div className="flex items-center gap-3">
          <button
            onClick={accept}
            className="flex-1 py-3 rounded-2xl font-semibold text-sm text-white transition-all hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
          >
            Принять
          </button>
          <button
            onClick={decline}
            className="flex-1 py-3 rounded-2xl font-semibold text-sm text-white transition-all hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
          >
            Отклонить
          </button>
        </div>
      </div>
    </div>
  );
}
