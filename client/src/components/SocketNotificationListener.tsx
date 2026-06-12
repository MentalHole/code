import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { getSocket } from '../services/socket';
import { getCurrentSessionId } from '../utils/currentSession';
import IncomingCallModal from './IncomingCallModal';
import SessionRequestModal from './SessionRequestModal';
import FriendRequestModal from './FriendRequestModal';

export default function SocketNotificationListener() {
  const { user } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const [incomingCall, setIncomingCall] = useState<{ from: string; fromNickname: string; mode: 'audio' | 'video'; sessionId: string } | null>(null);
  const [sessionRequest, setSessionRequest] = useState<{ requestId: string; from: string; fromNickname: string; skillName?: string } | null>(null);
  const [friendRequest, setFriendRequest] = useState<{ requestId: string; from: string; fromNickname: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    if (!socket) return;

    const onSessionCreated = ({ sessionId, fromNickname }: any) => {
      if (getCurrentSessionId() === sessionId) return;
      notify({
        title: 'Новая сессия',
        message: `${fromNickname} начал(а) сессию с вами!`,
        type: 'success',
        action: { label: 'Перейти к сессии', onClick: () => navigate(`/session/${sessionId}`) },
      });
    };

    const onSessionEnded = ({ sessionId, byNickname }: any) => {
      if (getCurrentSessionId() === sessionId) return;
      notify({
        title: 'Сессия завершена',
        message: `${byNickname} завершил(а) сессию.`,
        type: 'info',
        action: { label: 'Посмотреть', onClick: () => navigate(`/sessions`) },
      });
    };

    const onIncomingCall = ({ from, fromNickname, mode, sessionId }: any) => {
      setIncomingCall({ from, fromNickname, mode, sessionId });
    };

    const onCallDeclined = ({ fromNickname }: any) => {
      setIncomingCall(null);
      notify({
        title: 'Звонок отклонён',
        message: `${fromNickname} не может ответить.`,
        type: 'error',
      });
    };

    const onMessage = ({ sessionId, fromNickname, content }: any) => {
      if (getCurrentSessionId() === sessionId) return;
      notify({
        title: `Сообщение от ${fromNickname}`,
        message: content,
        type: 'info',
        action: { label: 'Ответить', onClick: () => navigate(`/session/${sessionId}`) },
      });
    };

    const onSessionRequest = ({ requestId, from, fromNickname, skillName }: any) => {
      setSessionRequest({ requestId, from, fromNickname, skillName });
    };

    const onSessionRequestAccepted = ({ sessionId }: any) => {
      setSessionRequest(null);
      navigate(`/session/${sessionId}`);
    };

    const onSessionRequestDeclined = () => {
      setSessionRequest(null);
      notify({
        title: 'Запрос отклонён',
        message: 'Пользователь отклонил запрос на сессию.',
        type: 'error',
      });
    };

    const onFriendRequest = ({ requestId, from, fromNickname }: any) => {
      setFriendRequest({ requestId, from, fromNickname });
    };

    const onFriendAccepted = ({ fromNickname }: any) => {
      notify({
        title: 'Запрос принят',
        message: `${fromNickname} принял(а) ваш запрос в друзья!`,
        type: 'success',
      });
    };

    socket.on('notification:session_created', onSessionCreated);
    socket.on('notification:session_ended', onSessionEnded);
    socket.on('call:incoming', onIncomingCall);
    socket.on('call:declined', onCallDeclined);
    socket.on('notification:message', onMessage);
    socket.on('session:request', onSessionRequest);
    socket.on('session:request:accepted', onSessionRequestAccepted);
    socket.on('session:request:declined', onSessionRequestDeclined);
    socket.on('friend:request', onFriendRequest);
    socket.on('friend:accepted', onFriendAccepted);

    return () => {
      socket.off('notification:session_created', onSessionCreated);
      socket.off('notification:session_ended', onSessionEnded);
      socket.off('call:incoming', onIncomingCall);
      socket.off('call:declined', onCallDeclined);
      socket.off('notification:message', onMessage);
      socket.off('session:request', onSessionRequest);
      socket.off('session:request:accepted', onSessionRequestAccepted);
      socket.off('session:request:declined', onSessionRequestDeclined);
      socket.off('friend:request', onFriendRequest);
      socket.off('friend:accepted', onFriendAccepted);
    };
  }, [user, notify, navigate]);

  return (
    <>
      {incomingCall && (
        <IncomingCallModal
          key={incomingCall.sessionId}
          from={incomingCall.from}
          fromNickname={incomingCall.fromNickname}
          mode={incomingCall.mode}
          sessionId={incomingCall.sessionId}
          onClose={() => setIncomingCall(null)}
        />
      )}
      {sessionRequest && (
        <SessionRequestModal
          key={sessionRequest.requestId}
          requestId={sessionRequest.requestId}
          fromNickname={sessionRequest.fromNickname}
          skillName={sessionRequest.skillName}
          from={sessionRequest.from}
          onClose={() => setSessionRequest(null)}
        />
      )}
      {friendRequest && (
        <FriendRequestModal
          key={friendRequest.requestId}
          requestId={friendRequest.requestId}
          fromNickname={friendRequest.fromNickname}
          from={friendRequest.from}
          onClose={() => setFriendRequest(null)}
        />
      )}
    </>
  );
}
