import { useNavigate } from 'react-router-dom';

interface Skill {
  name: string;
  color: string;
}

interface Props {
  userId: string;
  nickname: string;
  username: string;
  avatar?: string;
  bio?: string;
  similarity?: number;
  sharedSkills?: Skill[];
  matchReason?: string;
}

export default function UserCard({ userId, nickname, username, avatar, bio, similarity, sharedSkills, matchReason }: Props) {
  const navigate = useNavigate();

  const similarityPercent = similarity !== undefined ? Math.round(similarity * 100) : undefined;

  const startSession = async (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/profile/${userId}`);
  };

  return (
    <div
      className="glass-card rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
      onClick={() => navigate(`/profile/${userId}`)}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-lg"
          style={{ background: 'linear-gradient(135deg, #1a1a2e, #2d2d4a)' }}
        >
          {nickname[0].toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="truncate">
            <h3 className="font-semibold text-sm inline" style={{ color: '#1a1a2e' }}>{nickname}</h3>
            <span className="text-xs opacity-40 ml-1">@{username}</span>
          </div>

          {bio && (
            <p className="text-xs mt-1 opacity-60 line-clamp-2">{bio}</p>
          )}
        </div>

        <div className="flex-shrink-0 flex items-start gap-1">
          {similarityPercent !== undefined && (
            <div className="text-right -mt-0.5">
              <div className="text-sm font-bold leading-tight" style={{ color: similarityPercent >= 70 ? '#22c55e' : similarityPercent >= 40 ? '#f59e0b' : '#94a3b8' }}>
                {similarityPercent}%
              </div>
              <div className="text-[9px] opacity-40 uppercase tracking-wider leading-tight">Совп.</div>
            </div>
          )}
          <button
            onClick={startSession}
            className="btn-primary !py-1.5 !px-2.5 !text-[11px] !rounded-xl whitespace-nowrap"
          >
            Сессия
          </button>
        </div>
      </div>

      {sharedSkills && sharedSkills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {sharedSkills.map((skill) => (
            <span
              key={skill.name}
              className="skill-badge"
              style={{
                backgroundColor: `${skill.color}18`,
                color: skill.color,
                border: `1px solid ${skill.color}30`,
              }}
            >
              {skill.name}
            </span>
          ))}
        </div>
      )}

      {matchReason && (
        <p className="text-[11px] mt-2 opacity-50 italic">{matchReason}</p>
      )}
    </div>
  );
}
