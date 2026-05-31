import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import UserCard from '../components/UserCard';
import { connectSocket } from '../services/socket';

interface MatchResult {
  userId: string;
  username: string;
  nickname: string;
  avatar: string;
  bio: string;
  similarity: number;
  sharedSkills: { name: string; color: string }[];
  matchReason: string;
}

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshUser();
    api.matching.getRecommendations()
      .then(setMatches)
      .catch(console.error)
      .finally(() => setLoading(false));

    if (user) {
      connectSocket(user.id, user.nickname);
    }
  }, []);

  return (
    <div className="min-h-screen pt-20 pb-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#1a1a2e' }}>
            С возвращением, {user?.nickname}
          </h1>
          <p className="opacity-50">
            Вот ваши персональные рекомендации на основе ваших навыков.
          </p>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium">Найдено: {matches.length}</span>
          </div>
          <div className="flex-1" />
          <button
            onClick={() => {
              setLoading(true);
              api.matching.getRecommendations()
                .then(setMatches)
                .catch(console.error)
                .finally(() => setLoading(false));
            }}
            className="btn-secondary !py-2 !px-4 !text-xs"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Обновить
          </button>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="glass-card rounded-2xl p-5 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-200" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="font-bold text-lg mb-2">Пока нет совпадений</h3>
            <p className="text-sm opacity-50 mb-6">
              Добавьте больше навыков в профиль, чтобы получать лучшие рекомендации.
            </p>
            <button
              onClick={() => window.location.href = '/profile'}
              className="btn-primary"
            >
              Редактировать профиль
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {matches.map((match) => (
              <UserCard key={match.userId} {...match} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
