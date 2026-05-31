import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import SkillBadge from '../components/SkillBadge';

interface Skill {
  id: string;
  name: string;
  color: string;
}

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', nickname: '', bio: '' });
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.skills.getAll()
      .then(setSkills)
      .catch(console.error);
  }, []);

  const toggleSkill = (id: string) => {
    setSelectedSkills(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selectedSkills.length === 0) {
      setError('Please select at least one skill');
      return;
    }

    setLoading(true);
    try {
      await register({ ...form, skillIds: selectedSkills });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20">
      <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-white" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold" style={{ color: '#1a1a2e' }}>
            <span>⚡</span> SkillMatch
          </Link>
          <p className="text-sm opacity-50 mt-2">Создайте аккаунт и добавьте свои навыки.</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-8 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold opacity-60 mb-1.5 block">Имя пользователя</label>
              <input
                className="input-field"
                placeholder="ivanpetrov"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold opacity-60 mb-1.5 block">Псевдоним</label>
              <input
                className="input-field"
                placeholder="Иван П."
                value={form.nickname}
                onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
              <label className="text-xs font-semibold opacity-60 mb-1.5 block">Email</label>
            <input
              type="email"
              className="input-field"
              placeholder="ivan@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div>
              <label className="text-xs font-semibold opacity-60 mb-1.5 block">Пароль</label>
            <input
              type="password"
              className="input-field"
              placeholder="Придумайте пароль"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold opacity-60 mb-1.5 block">О себе (необязательно)</label>
            <textarea
              className="input-field !resize-none !h-20"
              placeholder="Расскажите о себе..."
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-semibold opacity-60 mb-2 block">
              Ваши навыки <span className="text-red-400">*</span>
            </label>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
              {skills.map((skill) => (
                <SkillBadge
                  key={skill.id}
                  name={skill.name}
                  color={skill.color}
                  selected={selectedSkills.includes(skill.id)}
                  onClick={() => toggleSkill(skill.id)}
                  size="md"
                />
              ))}
            </div>
            {selectedSkills.length > 0 && (
              <p className="text-[10px] opacity-40 mt-1.5">Выбрано: {selectedSkills.length}</p>
            )}
          </div>

          <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
            {loading ? 'Создание...' : 'Создать аккаунт'}
          </button>

          <p className="text-center text-xs opacity-50">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="font-semibold hover:underline" style={{ color: '#1a1a2e' }}>
              Войти
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
