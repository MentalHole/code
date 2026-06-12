import { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import UserCard from '../components/UserCard';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const timerRef = useRef<number>(0);

  const doSearch = async (q: string) => {
    setLoading(true);
    setSearched(true);
    try {
      const data = q.trim()
        ? await api.matching.search(q)
        : await api.users.getAll();
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (value: string) => {
    setQuery(value);
    clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => doSearch(value), 300);
  };

  useEffect(() => {
    doSearch('');
  }, []);

  return (
    <div className="min-h-screen pt-20 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#1a1a2e' }}>
            Поиск по навыкам
          </h1>
          <p className="opacity-50">
            Найдите людей, владеющих нужными навыками. Начните вводить название навыка.
          </p>
        </div>

        <div className="relative mb-8">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="input-field !pl-12 !py-4 !text-base !rounded-2xl"
            placeholder="Поиск по навыку... например React, Python, Дизайн"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
          />
          {query && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 hover:opacity-60"
              onClick={() => { setQuery(''); doSearch(''); }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#1a1a2e] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔎</div>
            <h3 className="font-bold text-lg mb-2">Ничего не найдено</h3>
            <p className="text-sm opacity-50">
              Попробуйте поискать другой навык или ключевое слово.
            </p>
          </div>
        )}

        {!loading && searched && results.length > 0 && (
          <div>
            <p className="text-sm opacity-40 mb-4">
              {query ? `Найдено: ${results.length}` : `Все пользователи: ${results.length}`}
            </p>
            <div className="space-y-4">
              {results.map((r) => (
                <UserCard key={r.userId} {...r} />
              ))}
            </div>
          </div>
        )}

        {!loading && !searched && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">⌨️</div>
            <h3 className="font-bold text-lg mb-2" style={{ color: '#1a1a2e' }}>
              Начните вводить текст для поиска
            </h3>
            <p className="text-sm opacity-50">
              Ищите по названию навыка или имени пользователя, чтобы найти союзника.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
