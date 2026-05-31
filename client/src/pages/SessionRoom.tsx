import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import SessionTimer from '../components/SessionTimer';
import ChatBox from '../components/ChatBox';

interface Session {
  id: string;
  host_id: string;
  guest_id: string;
  skill_id: string;
  status: string;
  start_time: string;
  end_time: string;
}

export default function SessionRoom() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mediaMode, setMediaMode] = useState<'none' | 'audio' | 'video'>('none');
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const [inCall, setInCall] = useState(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'ringing' | 'connected'>('idle');

  useEffect(() => {
    if (!id) return;
    api.sessions.get(id)
      .then(setSession)
      .catch(console.error)
      .finally(() => setLoading(false));

    const socket = getSocket();
    if (socket && id) {
      socket.emit('join:session', id);
    }
  }, [id]);

  const getMediaStream = async (mode: 'audio' | 'video') => {
    return navigator.mediaDevices.getUserMedia({
      audio: true,
      video: mode === 'video',
    });
  };

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
      }
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('signal:ice-candidate', { to: otherUserId, candidate: event.candidate });
      }
    };

    peerRef.current = peer;
    return peer;
  }, []);

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
      setInCall(true);
      setCallStatus('connected');
    } catch (err) {
      console.error('Setup from offer error:', err);
    }
  }, [user, session, createPeer]);

  useEffect(() => {
    if (!session || !user) return;
    const socket = getSocket();
    if (!socket) return;

    const otherUserId = session.host_id === user.id ? session.guest_id : session.host_id;

    const onOffer = async ({ from, offer }: any) => {
      if (from !== otherUserId) return;
      if (!peerRef.current) {
        await setupPeerFromOffer(from, offer);
      } else {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerRef.current.createAnswer();
        await peerRef.current.setLocalDescription(answer);
        socket.emit('signal:answer', { to: from, answer });
      }
    };

    const onAnswer = async ({ from, answer }: any) => {
      if (from !== otherUserId || !peerRef.current) return;
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      setCallStatus('connected');
    };

    const onIceCandidate = async ({ from, candidate }: any) => {
      if (from !== otherUserId || !peerRef.current) return;
      await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    };

    socket.on('signal:offer', onOffer);
    socket.on('signal:answer', onAnswer);
    socket.on('signal:ice-candidate', onIceCandidate);

    return () => {
      socket.off('signal:offer', onOffer);
      socket.off('signal:answer', onAnswer);
      socket.off('signal:ice-candidate', onIceCandidate);
    };
  }, [session, user, setupPeerFromOffer]);

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
        setInCall(true);
        setCallStatus('connected');
      };

      const onDeclined = () => {
        socket.off('call:accepted', onAccepted);
        socket.off('call:declined', onDeclined);
        setCallStatus('idle');
        setMediaMode('none');
        endCall();
      };

      socket.on('call:accepted', onAccepted);
      socket.on('call:declined', onDeclined);
      setInCall(true);
    } catch (err) {
      console.error('Media error:', err);
      setMediaMode('none');
      setCallStatus('idle');
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
    setMediaMode('none');
    setCallStatus('idle');
  }, []);

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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-bold text-lg" style={{ color: '#1a1a2e' }}>Учебная сессия</h1>
            <p className="text-xs opacity-40">ID: {session.id.slice(0, 8)}</p>
          </div>
          <div className="flex items-center gap-3">
            {isActive && session.end_time && (
              <SessionTimer endTime={session.end_time} onEnd={() => {}} />
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
            {inCall || callStatus === 'calling' || callStatus === 'ringing' ? (
              <div className="glass-card rounded-2xl overflow-hidden flex-1 flex flex-col">
                <div className="flex-1 relative bg-black/5">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
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
                  {callStatus === 'connected' && !remoteVideoRef.current?.srcObject && (
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m-7 7a7 7 0 01-7-7m7 7v4m7-4v4" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        )}
                      </svg>
                    </button>
                  )}
                  {inCall && (
                    <button
                      onClick={endCall}
                      className="w-12 h-12 rounded-full flex items-center justify-center bg-red-500 text-white hover:bg-red-600 transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                      </svg>
                    </button>
                  )}
                  {callStatus === 'calling' && (
                    <button
                      onClick={endCall}
                      className="w-12 h-12 rounded-full flex items-center justify-center bg-red-500 text-white hover:bg-red-600 transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
    </div>
  );
}
