import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { getSocket } from '../services/socket';

export default function SocketNotificationListener() {
  const { user } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    if (!socket) return;

    const onSessionCreated = ({ sessionId, fromNickname }: any) => {
      notify({
        title: 'Новая сессия',
        message: `${fromNickname} начал(а) сессию с вами!`,
        type: 'success',
        action: { label: 'Перейти к сессии', onClick: () => navigate(`/session/${sessionId}`) },
      });
    };

    const onSessionEnded = ({ sessionId, byNickname }: any) => {
      notify({
        title: 'Сессия завершена',
        message: `${byNickname} завершил(а) сессию.`,
        type: 'info',
        action: { label: 'Посмотреть', onClick: () => navigate(`/sessions`) },
      });
    };

    const onIncomingCall = ({ from, fromNickname, mode, sessionId }: any) => {
      notify({
        title: `Входящий ${mode === 'video' ? 'видеозвонок' : 'аудиозвонок'}`,
        message: `${fromNickname} звонит вам!`,
        type: 'warning',
        action: {
          label: 'Принять',
          onClick: () => {
            socket.emit('call:accepted', { to: from, sessionId });
            navigate(`/session/${sessionId}`);
          },
        },
      });
    };

    const onCallDeclined = ({ fromNickname }: any) => {
      notify({
        title: 'Звонок отклонён',
        message: `${fromNickname} не может ответить.`,
        type: 'error',
      });
    };

    const onMessage = ({ sessionId, fromNickname, content }: any) => {
      notify({
        title: `Сообщение от ${fromNickname}`,
        message: content,
        type: 'info',
        action: { label: 'Ответить', onClick: () => navigate(`/session/${sessionId}`) },
      });
    };

    socket.on('notification:session_created', onSessionCreated);
    socket.on('notification:session_ended', onSessionEnded);
    socket.on('call:incoming', onIncomingCall);
    socket.on('call:declined', onCallDeclined);
    socket.on('notification:message', onMessage);

    return () => {
      socket.off('notification:session_created', onSessionCreated);
      socket.off('notification:session_ended', onSessionEnded);
      socket.off('call:incoming', onIncomingCall);
      socket.off('call:declined', onCallDeclined);
      socket.off('notification:message', onMessage);
    };
  }, [user, notify, navigate]);

  return null;
}
