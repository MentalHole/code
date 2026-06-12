import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useNotification } from '../context/NotificationContext';

interface Friend {
  userId: string;
  nickname: string;
  username: string;
  avatar: string;
  bio: string;
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const { notify } = useNotification();

  const load = async () => {
    try {
      const data = await api.friends.list();
      setFriends(data);
    } catch {
      notify({ title: 'Ошибка', message: 'Не удалось загрузить список друзей', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const remove = async (friendUserId: string) => {
    try {
      await api.friends.remove(friendUserId);
      setFriends(f => f.filter(ff => ff.userId !== friendUserId));
      notify({ title: 'Удалён', message: 'Пользователь удалён из друзей', type: 'info' });
    } catch {
      notify({ title: 'Ошибка', message: 'Не удалось удалить из друзей', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1a1a2e] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ padding: '6rem 1rem 2rem' }}>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6" style={{ color: '#1a1a2e' }}>Мои друзья</h1>

        {friends.length === 0 ? (
          <div className="glass-card rounded-3xl p-8 text-center">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-lg font-semibold mb-1" style={{ color: '#1a1a2e' }}>У вас пока нет друзей</p>
            <p className="text-sm opacity-60 mb-4">
              Добавляйте пользователей в друзья из их профилей
            </p>
            <Link to="/search" className="btn-primary inline-block text-sm">
              Найти людей
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {friends.map(f => (
              <div key={f.userId} className="glass-card rounded-3xl px-6 py-4 flex items-center justify-between">
                <Link to={`/profile/${f.userId}`} className="flex items-center gap-4 flex-1 min-w-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ background: 'linear-gradient(135deg, #1a1a2e, #2d2d4a)' }}
                  >
                    {f.nickname[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: '#1a1a2e' }}>{f.nickname}</p>
                    <p className="text-xs opacity-40 truncate">@{f.username}</p>
                  </div>
                </Link>
                <button
                  onClick={() => remove(f.userId)}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors shrink-0 ml-3"
                >
                  Удалить
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
