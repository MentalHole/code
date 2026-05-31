import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import SkillBadge from '../components/SkillBadge';

interface Skill {
  id: string;
  name: string;
  color: string;
  proficiency?: number;
}

interface ProfileUser {
  id: string;
  nickname: string;
  username: string;
  avatar: string;
  bio: string;
  skills: Skill[];
}

export default function Profile() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ nickname: '', bio: '' });
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const isOwnProfile = !userId || userId === currentUser?.id;

  useEffect(() => {
    const targetId = userId || currentUser?.id;
    if (!targetId) return;

    Promise.all([
      api.users.getProfile(targetId),
      isOwnProfile ? api.skills.getAll() : Promise.resolve([]),
    ])
      .then(([profileData, skillsData]) => {
        setProfile(profileData);
        setForm({ nickname: profileData.nickname, bio: profileData.bio || '' });
        setSelectedSkills(profileData.skills?.map((s: any) => s.id) || []);
        setAllSkills(skillsData as Skill[]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId, currentUser]);

  const saveProfile = async () => {
    try {
      await api.users.updateProfile(form);
      if (isOwnProfile) {
        await api.skills.updateUserSkills(selectedSkills);
      }
      setEditing(false);
      const targetId = userId || currentUser?.id;
      const data = await api.users.getProfile(targetId!);
      setProfile(data);
    } catch (err) {
      console.error(err);
    }
  };

  const startSession = async () => {
    if (!profile || !currentUser) return;
    if (!profile.skills || profile.skills.length === 0) {
      alert('This user has no skills listed');
      return;
    }
    const skillId = profile.skills[0].id;
    try {
      const session = await api.sessions.create({ guestId: profile.id, skillId });
      navigate(`/session/${session.id}`);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 px-6 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1a1a2e] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen pt-20 px-6 text-center">
        <p className="opacity-50">Пользователь не найден</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="glass-card rounded-3xl p-8">
          <div className="flex items-start gap-6 mb-8">
            <div
              className="w-20 h-20 rounded-full flex-shrink-0 flex items-center justify-center text-white text-2xl font-bold"
              style={{ background: 'linear-gradient(135deg, #1a1a2e, #2d2d4a)' }}
            >
              {profile.nickname[0].toUpperCase()}
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-bold" style={{ color: '#1a1a2e' }}>{profile.nickname}</h1>
              <p className="text-sm opacity-40">@{profile.username}</p>
              {profile.bio && <p className="text-sm mt-2 opacity-60">{profile.bio}</p>}
            </div>

            {!isOwnProfile && currentUser && (
              <button onClick={startSession} className="btn-primary !py-3 !px-6 !rounded-xl whitespace-nowrap">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Начать сессию
              </button>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-sm">Навыки</h2>
              {isOwnProfile && !editing && (
                <button onClick={() => setEditing(true)} className="text-xs font-semibold opacity-50 hover:opacity-100 transition-opacity">
                  Редактировать
                </button>
              )}
            </div>

            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold opacity-60 block mb-1">Псевдоним</label>
                  <input
                    className="input-field"
                    value={form.nickname}
                    onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold opacity-60 block mb-1">О себе</label>
                  <textarea
                    className="input-field !h-24 !resize-none"
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold opacity-60 block mb-2">Навыки</label>
                  <div className="flex flex-wrap gap-2">
                    {allSkills.map((skill) => (
                      <SkillBadge
                        key={skill.id}
                        name={skill.name}
                        color={skill.color}
                        selected={selectedSkills.includes(skill.id)}
                        onClick={() => setSelectedSkills(prev =>
                          prev.includes(skill.id) ? prev.filter(s => s !== skill.id) : [...prev, skill.id]
                        )}
                        size="md"
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={saveProfile} className="btn-primary !py-2 !px-5 !text-xs">Сохранить</button>
                  <button onClick={() => setEditing(false)} className="btn-secondary !py-2 !px-5 !text-xs">Отмена</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.skills && profile.skills.length > 0 ? (
                  profile.skills.map((skill) => (
                    <SkillBadge key={skill.id} name={skill.name} color={skill.color} size="md" />
                  ))
                ) : (
                  <p className="text-sm opacity-40">Навыки не указаны</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
