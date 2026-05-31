import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-white" />

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold" style={{ color: '#1a1a2e' }}>
            <span>⚡</span> SkillMatch
          </Link>
          <p className="text-sm opacity-50 mt-2">С возвращением! Войдите, чтобы продолжить.</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-8 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold opacity-60 mb-1.5 block">Имя пользователя или email</label>
            <input
              className="input-field"
              placeholder="Введите имя пользователя или email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold opacity-60 mb-1.5 block">Пароль</label>
            <input
              type="password"
              className="input-field"
              placeholder="Введите пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>

          <p className="text-center text-xs opacity-50">
            Нет аккаунта?{' '}
            <Link to="/register" className="font-semibold hover:underline" style={{ color: '#1a1a2e' }}>
              Зарегистрироваться
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
