import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

interface Session {
  id: string;
  host_id: string;
  guest_id: string;
  skill_id: string;
  status: string;
  start_time: string;
  end_time: string;
}

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.sessions.getAll()
      .then(setSessions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' };
      case 'completed': return { bg: 'bg-gray-50', text: 'text-gray-500', dot: 'bg-gray-400' };
      case 'pending': return { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' };
      default: return { bg: 'bg-gray-50', text: 'text-gray-500', dot: 'bg-gray-400' };
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#1a1a2e' }}>Мои сессии</h1>
        <p className="opacity-50 mb-8">Ваши учебные сессии — прошлые и текущие.</p>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card rounded-2xl p-5 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-48 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-32" />
              </div>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📚</div>
            <h3 className="font-bold text-lg mb-2">Ещё нет сессий</h3>
            <p className="text-sm opacity-50 mb-6">
              Найдите союзника для обучения и начните первую сессию!
            </p>
            <button onClick={() => navigate('/dashboard')} className="btn-primary">
              Найти союзников
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => {
              const colors = getStatusColor(session.status);
              const startDate = new Date(session.start_time).toLocaleString();
              return (
                <div
                  key={session.id}
                  className="glass-card rounded-2xl p-5 flex items-center justify-between cursor-pointer hover:shadow-lg transition-all duration-300"
                  onClick={() => navigate(`/session/${session.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                      <svg className={`w-5 h-5 ${colors.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: '#1a1a2e' }}>
                        Session · {session.id.slice(0, 8)}
                      </p>
                      <p className="text-xs opacity-40 mt-0.5">{startDate}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                      {session.status}
                    </span>
                    <svg className="w-4 h-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
