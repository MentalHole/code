import { useState, useEffect, useRef } from 'react';
import { getSocket } from '../services/socket';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Message {
  id: string;
  session_id: string;
  sender_id: string;
  nickname?: string;
  content: string;
  created_at: string;
}

interface Props {
  sessionId: string;
}

export default function ChatBox({ sessionId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    api.messages.get(sessionId)
      .then(setMessages)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sessionId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handler = (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    };

    socket.on('chat:message', handler);
    return () => { socket.off('chat:message', handler); };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    const socket = getSocket();
    if (socket) {
      socket.emit('chat:message', { sessionId, content: input.trim() });
    }
    api.messages.send(sessionId, input.trim()).catch(console.error);
    setInput('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm opacity-50">
        Загрузка сообщений...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-12 text-sm opacity-40">
            Пока нет сообщений. Напишите первым!
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                msg.sender_id === user?.id
                  ? 'bg-[#1a1a2e] text-white rounded-br-md'
                  : 'bg-gray-100 text-[#1a1a2e] rounded-bl-md'
              }`}
            >
              {msg.sender_id !== user?.id && (
                <p className="text-[10px] font-semibold mb-1 opacity-60">
                  {msg.nickname || 'Неизвестно'}
                </p>
              )}
              <p className="leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-black/5">
        <div className="flex gap-2">
          <input
            className="input-field !rounded-full !py-2.5"
            placeholder="Введите сообщение..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <button onClick={send} className="btn-primary !rounded-full !p-2.5 !min-w-[44px] !h-[44px]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
