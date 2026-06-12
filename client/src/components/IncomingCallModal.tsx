import { useNavigate } from 'react-router-dom';
import { getSocket } from '../services/socket';

interface Props {
  from: string;
  fromNickname: string;
  mode: 'audio' | 'video';
  sessionId: string;
  onClose: () => void;
}

export default function IncomingCallModal({ from, fromNickname, mode, sessionId, onClose }: Props) {
  const navigate = useNavigate();

  const accept = () => {
    onClose();
    navigate(`/session/${sessionId}`, { state: { acceptCall: { callerId: from, sessionId } } });
  };

  const decline = () => {
    onClose();
    const socket = getSocket();
    if (socket) {
      socket.emit('call:declined', { to: from });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="glass-card rounded-3xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
        <div className="text-6xl mb-4">
          {mode === 'video' ? '📹' : '📞'}
        </div>
        <h2 className="text-xl font-bold mb-1" style={{ color: '#1a1a2e' }}>
          {mode === 'video' ? 'Видеозвонок' : 'Аудиозвонок'}
        </h2>
        <p className="text-sm opacity-60 mb-6">
          {fromNickname} звонит вам
        </p>
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
