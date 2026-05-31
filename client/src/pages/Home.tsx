import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  const features = [
    { icon: '🎯', title: 'Умный подбор', desc: 'Наш алгоритм на основе ИИ находит идеальных союзников для обучения по вашим уникальным навыкам.' },
    { icon: '⚡', title: 'Мгновенные сессии', desc: 'Создайте профиль и начните часовой учебный сессию менее чем за 2 минуты.' },
    { icon: '🎥', title: 'Видео и чат', desc: 'Общайтесь через HD-видео, кристально чистый аудиозвонок или чат в реальном времени.' },
    { icon: '🌈', title: 'Яркое сообщество', desc: 'У каждого навыка свой цвет. Ваш профиль уникален, как и ваша экспертиза.' },
  ];

  return (
    <div className="min-h-screen">
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-white" />
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-gray-100 rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-gray-50 rounded-full blur-3xl opacity-60" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-100 text-xs font-semibold mb-8">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Онлайн — 2 341 учащийся
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 tracking-tight" style={{ color: '#1a1a2e' }}>
            Найди своего
            <span className="block mt-2" style={{
              background: 'linear-gradient(135deg, #1a1a2e 0%, #4a4a6a 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              идеального союзника
            </span>
          </h1>

          <p className="text-lg md:text-xl opacity-60 max-w-2xl mx-auto mb-10 leading-relaxed">
            SkillMatch соединяет вас с людьми, которые разделяют ваши навыки и увлечения.
            Начните часовую сессию, чтобы учиться вместе, делиться знаниями и расти.
          </p>

          <div className="flex items-center justify-center gap-4">
            {!user && (
              <>
                <Link to="/register" className="btn-primary !px-8 !py-4 !text-base !rounded-2xl">
                  Начать бесплатно
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link to="/login" className="btn-secondary !px-8 !py-4 !text-base !rounded-2xl">
                  Войти
                </Link>
              </>
            )}
            {user && (
              <Link to="/dashboard" className="btn-primary !px-8 !py-4 !text-base !rounded-2xl">
                Перейти к подбору
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4" style={{ color: '#1a1a2e' }}>
          Как это работает
        </h2>
        <p className="text-center opacity-50 mb-16 max-w-xl mx-auto">
          Четыре простых шага, чтобы начать учиться вместе
        </p>

        <div className="grid md:grid-cols-4 gap-8">
          {[
            { num: '01', title: 'Создайте профиль', desc: 'Зарегистрируйтесь и добавьте свои навыки за секунды.' },
            { num: '02', title: 'Получите подбор', desc: 'Алгоритм найдёт идеальных союзников для обучения.' },
            { num: '03', title: 'Начните сессию', desc: 'Запустите часовую видео-, аудио- или чат-сессию.' },
            { num: '04', title: 'Учитесь вместе', desc: 'Делитесь знаниями, решайте задачи, развивайтесь.' },
          ].map((step) => (
            <div key={step.num} className="text-center">
              <div className="text-4xl font-black mb-4 opacity-10" style={{ color: '#1a1a2e' }}>{step.num}</div>
              <h3 className="font-bold text-lg mb-2">{step.title}</h3>
              <p className="text-sm opacity-50">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div key={f.title} className="glass-card rounded-2xl p-6 text-center hover:-translate-y-1 transition-all duration-300">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="font-bold text-sm mb-2">{f.title}</h3>
              <p className="text-xs opacity-50 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="py-12 px-6 border-t border-black/5">
        <div className="max-w-6xl mx-auto text-center text-xs opacity-40">
          <span className="font-bold" style={{ color: '#1a1a2e' }}>⚡ SkillMatch</span> — Найди союзника для обучения уже сегодня.
        </div>
      </footer>
    </div>
  );
}
