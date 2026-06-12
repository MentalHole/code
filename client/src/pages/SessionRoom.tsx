import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { setCurrentSessionId } from '../utils/currentSession';
import SessionTimer from '../components/SessionTimer';
import ChatBox from '../components/ChatBox';
import SubscriptionUpgradeModal from '../components/SubscriptionUpgradeModal';

interface Session {
  id: string;
  host_id: string;
  guest_id: string;
  skill_id: string;
  status: string;
  start_time: string;
  end_time: string;
  host_role?: string;
  guest_role?: string;
  seconds_elapsed?: number;
}

const FREE_LIMIT = 3600;

export default function SessionRoom() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mediaMode, setMediaMode] = useState<'none' | 'audio' | 'video'>('none');
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const acceptedCallRef = useRef(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const [inCall, setInCall] = useState(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'ringing' | 'connecting' | 'connected'>('idle');
  const [myRole, setMyRole] = useState<'teacher' | 'student'>('teacher');
  const [otherRole, setOtherRole] = useState<'teacher' | 'student'>('student');
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const [subscriptionPlan, setSubscriptionPlan] = useState<'free' | 'premium'>('free');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!id) return;
    setCurrentSessionId(id);
    api.sessions.get(id)
      .then((s: Session) => {
        setSession(s);
        if (user) {
          setMyRole(user.id === s.host_id ? (s.host_role as 'teacher' | 'student' || 'teacher') : (s.guest_role as 'teacher' | 'student' || 'student'));
          setOtherRole(user.id === s.host_id ? (s.guest_role as 'teacher' | 'student' || 'student') : (s.host_role as 'teacher' | 'student' || 'teacher'));
        }
        setElapsedSecs(s.seconds_elapsed || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    api.subscriptions.status().then((sub: any) => setSubscriptionPlan(sub.plan)).catch(() => {});

    const socket = getSocket();
    if (socket && id) {
      socket.emit('join:session', id);
    }

    return () => {
      setCurrentSessionId(null);
    };
  }, [id, user]);

  const getMediaStream = async (mode: 'audio' | 'video') => {
    return navigator.mediaDevices.getUserMedia({
      audio: true,
      video: mode === 'video',
    });
  };

  const endCall = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    if (localVideoRef.current?.srcObject) {
      (localVideoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current?.srcObject) {
      (remoteVideoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      remoteVideoRef.current.srcObject = null;
    }
    setInCall(false);
    setRemoteStream(null);
    setMediaMode('none');
    setCallStatus('idle');
  }, []);

  const createPeer = useCallback((stream: MediaStream, otherUserId: string) => {
    const socket = getSocket();
    if (!socket) return null;

    const peer = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    stream.getTracks().forEach(track => peer.addTrack(track, stream));

    peer.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        remoteVideoRef.current.play().catch(() => {});
      }
      setRemoteStream(event.streams[0]);
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('signal:ice-candidate', { to: otherUserId, candidate: event.candidate });
      }
    };

    const onConnected = () => {
      setCallStatus('connected');
      setInCall(true);
    };

    const onFailed = () => {
      console.error('WebRTC connection failed');
      endCall();
    };

    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'connected') onConnected();
      else if (peer.connectionState === 'failed') onFailed();
    };

    peer.oniceconnectionstatechange = () => {
      if (peer.iceConnectionState === 'connected' || peer.iceConnectionState === 'completed') onConnected();
      else if (peer.iceConnectionState === 'failed') onFailed();
    };

    peerRef.current = peer;
    return peer;
  }, [endCall]);

  const setupPeerFromOffer = useCallback(async (from: string, offer: any) => {
    if (!user || !session) return;
    const otherUserId = session.host_id === user.id ? session.guest_id : session.host_id;
    if (from !== otherUserId) return;

    try {
      const mode = offer.sdp?.includes('video') ? 'video' : 'audio';
      setMediaMode(mode);
      setMicOn(true);
      setCamOn(mode === 'video');
      setCallStatus('ringing');

      const stream = await getMediaStream(mode);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const socket = getSocket();
      if (!socket) return;

      const peer = createPeer(stream, otherUserId);
      if (!peer) return;

      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit('signal:answer', { to: from, answer });
      setCallStatus('connecting');
    } catch (err) {
      console.error('Setup from offer error:', err);
      endCall();
    }
  }, [user, session, createPeer, endCall]);

  useEffect(() => {
    if (!session || !user) return;
    const socket = getSocket();
    if (!socket) return;

    const otherUserId = session.host_id === user.id ? session.guest_id : session.host_id;

    const onOffer = async ({ from, offer }: any) => {
      if (from !== otherUserId) return;
      await setupPeerFromOffer(from, offer);
    };

    const onAnswer = async ({ from, answer }: any) => {
      if (from !== otherUserId || !peerRef.current) return;
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const onIceCandidate = async ({ from, candidate }: any) => {
      if (from !== otherUserId || !peerRef.current) return;
      try {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('ICE candidate error:', err);
      }
    };

    socket.on('signal:offer', onOffer);
    socket.on('signal:answer', onAnswer);
    socket.on('signal:ice-candidate', onIceCandidate);

    if (!acceptedCallRef.current) {
      const state = location.state as any;
      if (state?.acceptCall?.callerId && state?.acceptCall?.sessionId === session.id) {
        acceptedCallRef.current = true;
        socket.emit('call:accepted', { to: state.acceptCall.callerId, sessionId: session.id });
        window.history.replaceState({}, document.title);
      }
    }

    return () => {
      socket.off('signal:offer', onOffer);
      socket.off('signal:answer', onAnswer);
      socket.off('signal:ice-candidate', onIceCandidate);
    };
  }, [session, user, setupPeerFromOffer, endCall]);

  const switchRole = async () => {
    if (!id) return;
    try {
      await api.sessions.switchRole(id);
    } catch {}
  };

  useEffect(() => {
    if (!session || !id) return;
    const socket = getSocket();
    if (!socket) return;
    const onRoleSwitched = ({ hostRole, guestRole }: any) => {
      if (!user) return;
      setMyRole(user.id === session.host_id ? hostRole : guestRole);
      setOtherRole(user.id === session.host_id ? guestRole : hostRole);
    };
    socket.on('session:role_switched', onRoleSwitched);
    return () => { socket.off('session:role_switched', onRoleSwitched); };
  }, [session, user, id]);

  // Track elapsed time every 10s while session is active
  useEffect(() => {
    if (!session || session.status !== 'active') return;
    timerRef.current = setInterval(() => {
      setElapsedSecs(prev => {
        const next = prev + 10;
        // Report elapsed time to server every 30s
        if (next % 30 === 0 && id) {
          api.sessions.trackTime(id, 10).catch(() => {});
        }
        return next;
      });
    }, 10000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [session, id]);

  const endSession = async () => {
    if (!id) return;
    try {
      await api.sessions.end(id);
      navigate('/sessions');
    } catch (err) {
      console.error(err);
    }
  };

  const startCall = async (mode: 'audio' | 'video') => {
    if (!session || !user) return;
    const otherUserId = session.host_id === user.id ? session.guest_id : session.host_id;
    const socket = getSocket();
    if (!socket) return;

    setMediaMode(mode);
    setMicOn(true);
    setCamOn(mode === 'video');
    setCallStatus('calling');

    socket.emit('call:request', { to: otherUserId, mode, sessionId: session.id });

    try {
      const stream = await getMediaStream(mode);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const peer = createPeer(stream, otherUserId);
      if (!peer) return;

      const onAccepted = async ({ sessionId: sid }: any) => {
        if (sid !== session.id) return;
        socket.off('call:accepted', onAccepted);
        socket.off('call:declined', onDeclined);

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit('signal:offer', { to: otherUserId, offer });
        setCallStatus('connecting');
      };

      const onDeclined = () => {
        socket.off('call:accepted', onAccepted);
        socket.off('call:declined', onDeclined);
        endCall();
      };

      socket.on('call:accepted', onAccepted);
      socket.on('call:declined', onDeclined);
    } catch (err) {
      console.error('Media error:', err);
      endCall();
    }
  };

  const toggleMic = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicOn(audioTrack.enabled);
      }
    }
  };

  const toggleCam = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCamOn(videoTrack.enabled);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 px-6 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1a1a2e] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen pt-20 px-6 text-center">
        <p className="opacity-50">Session not found</p>
      </div>
    );
  }

  const isActive = session.status === 'active';

  return (
    <div className="min-h-screen pt-16 pb-4 px-4">
      <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)]">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h1 className="font-bold text-lg" style={{ color: '#1a1a2e' }}>Учебная сессия</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ background: myRole === 'teacher' ? '#e0f2fe' : '#fef3c7', color: myRole === 'teacher' ? '#0369a1' : '#b45309' }}>
              {myRole === 'teacher' ? '👨‍🏫 Учитель' : '👨‍🎓 Ученик'}
            </span>
            {isActive && (
              <button onClick={switchRole} className="text-[10px] opacity-40 hover:opacity-80 transition-opacity">
                Поменяться
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isActive && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono" style={{ color: elapsedSecs >= FREE_LIMIT && subscriptionPlan === 'free' ? '#ef4444' : '#1a1a2e' }}>
                  {Math.floor(elapsedSecs / 60)}:{String(elapsedSecs % 60).padStart(2, '0')}
                  {subscriptionPlan === 'free' && <span className="opacity-40 ml-1">/ {Math.floor(FREE_LIMIT / 60)}:00</span>}
                </span>
                {elapsedSecs >= FREE_LIMIT && subscriptionPlan === 'free' && (
                  <button onClick={() => setShowUpgrade(true)} className="px-2 py-1 rounded-full text-[10px] font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                    ⭐ Premium
                  </button>
                )}
                {subscriptionPlan === 'premium' && (
                  <span className="text-[10px] font-semibold opacity-50">⭐ Premium</span>
                )}
              </div>
            )}
            {isActive && (
              <button onClick={endSession} className="btn-secondary !py-2 !px-4 !text-xs !border-red-200 !text-red-600 hover:!bg-red-50">
                Завершить сессию
              </button>
            )}
            {session.status === 'completed' && (
              <span className="px-3 py-1.5 rounded-full bg-gray-100 text-xs font-semibold">
                Завершена
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-full">
          <div className="lg:col-span-3 flex flex-col gap-4">
            {inCall || callStatus === 'calling' || callStatus === 'ringing' || callStatus === 'connecting' ? (
              <div className="glass-card rounded-2xl overflow-hidden flex-1 flex flex-col">
                <div className="flex-1 relative bg-black/5">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    webkit-playsinline="true"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    webkit-playsinline="true"
                    muted
                    className="absolute bottom-4 right-4 w-36 h-24 object-cover rounded-xl border-2 border-white shadow-lg"
                  />
                  {callStatus === 'calling' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-5xl mb-3 animate-pulse">📞</div>
                        <p className="text-sm opacity-50">Звоним...</p>
                      </div>
                    </div>
                  )}
                  {callStatus === 'ringing' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-5xl mb-3 animate-bounce">🔔</div>
                        <p className="text-sm opacity-50">Входящий звонок...</p>
                      </div>
                    </div>
                  )}
                  {(callStatus === 'connecting' || callStatus === 'connected') && !remoteStream && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-5xl mb-3">📡</div>
                        <p className="text-sm opacity-50">Подключение союзника...</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-center gap-4 p-4 border-t border-black/5">
                  <button
                    onClick={toggleMic}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${micOn ? 'bg-gray-100 text-[#1a1a2e]' : 'bg-red-50 text-red-500'}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {micOn ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8M3 3l18 18" />
                      )}
                    </svg>
                  </button>
                  {mediaMode === 'video' && (
                    <button
                      onClick={toggleCam}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${camOn ? 'bg-gray-100 text-[#1a1a2e]' : 'bg-red-50 text-red-500'}`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {camOn ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2zM3 3l18 18" />
                        )}
                      </svg>
                    </button>
                  )}
                  {(inCall || callStatus === 'calling' || callStatus === 'connecting') && (
                    <button
                      onClick={endCall}
                      className="w-12 h-12 rounded-full flex items-center justify-center bg-red-500 text-white hover:bg-red-600 transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {callStatus === 'connected' && inCall ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        )}
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="glass-card rounded-2xl flex-1 flex items-center justify-center">
                {isActive ? (
                  <div className="text-center">
                    <div className="text-6xl mb-6">🎥</div>
                    <h3 className="font-bold text-lg mb-3" style={{ color: '#1a1a2e' }}>Начать звонок</h3>
                    <p className="text-sm opacity-50 mb-6">Выберите, как подключиться к союзнику.</p>
                    <div className="flex items-center justify-center gap-4">
                      <button onClick={() => startCall('audio')} className="glass-card !p-6 !rounded-2xl hover:!shadow-lg transition-all">
                        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.128-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <p className="text-xs font-semibold">Аудиозвонок</p>
                      </button>
                      <button onClick={() => startCall('video')} className="glass-card !p-6 !rounded-2xl hover:!shadow-lg transition-all">
                        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-xs font-semibold">Видеозвонок</p>
                      </button>
                    </div>
                    <p className="text-xs opacity-30 mt-6">или используйте чат ниже</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-5xl mb-4">⏰</div>
                    <h3 className="font-bold text-lg mb-2">Сессия завершена</h3>
                    <p className="text-sm opacity-50">Эта сессия была завершена.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 glass-card rounded-2xl overflow-hidden flex flex-col h-full">
            <div className="px-4 py-3 border-b border-black/5 flex items-center gap-2">
              <svg className="w-4 h-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm font-semibold">Чат</span>
            </div>
            {id && <ChatBox sessionId={id} />}
          </div>
        </div>
      </div>
      {showUpgrade && <SubscriptionUpgradeModal onClose={() => { setShowUpgrade(false); api.subscriptions.status().then((s: any) => setSubscriptionPlan(s.plan)); }} />}
    </div>
  );
}
