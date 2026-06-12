import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="glass fixed top-0 left-0 right-0 z-50 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold" style={{ color: '#1a1a2e' }}>
          <span className="text-2xl">⚡</span>
          SkillMatch
        </Link>

        {user && (
          <>
            <div className="hidden md:flex items-center gap-6">
              <Link to="/dashboard" className="text-sm font-medium hover:opacity-70 transition-opacity">Главная</Link>
              <Link to="/search" className="text-sm font-medium hover:opacity-70 transition-opacity">Поиск</Link>
              <Link to="/sessions" className="text-sm font-medium hover:opacity-70 transition-opacity">Сессии</Link>
              <Link to="/friends" className="text-sm font-medium hover:opacity-70 transition-opacity">Друзья</Link>
            </div>

            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-black/5 transition-colors"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ background: 'linear-gradient(135deg, #1a1a2e, #2d2d4a)' }}
                >
                  {user.nickname[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium hidden sm:block">{user.nickname}</span>
                <svg className={`w-4 h-4 transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 glass-card rounded-2xl overflow-hidden z-20 animate-fade-in">
                    <div className="px-4 py-3 border-b border-black/5">
                      <p className="text-sm font-semibold">{user.nickname}</p>
                      <p className="text-xs opacity-50">@{user.username}</p>
                    </div>
                    <Link to="/dashboard" className="block px-4 py-2.5 text-sm hover:bg-black/5 transition-colors" onClick={() => setMenuOpen(false)}>
                      Главная
                    </Link>
                    <Link to="/search" className="block px-4 py-2.5 text-sm hover:bg-black/5 transition-colors" onClick={() => setMenuOpen(false)}>
                      Поиск
                    </Link>
                    <Link to="/profile" className="block px-4 py-2.5 text-sm hover:bg-black/5 transition-colors" onClick={() => setMenuOpen(false)}>
                      Профиль
                    </Link>
                    <Link to="/sessions" className="block px-4 py-2.5 text-sm hover:bg-black/5 transition-colors" onClick={() => setMenuOpen(false)}>
                      Мои сессии
                    </Link>
                    <Link to="/friends" className="block px-4 py-2.5 text-sm hover:bg-black/5 transition-colors" onClick={() => setMenuOpen(false)}>
                      Друзья
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      Выйти
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {!user && (
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-secondary text-sm !py-2 !px-4">Войти</Link>
            <Link to="/register" className="btn-primary text-sm !py-2 !px-4">Регистрация</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
