interface Props {
  name: string;
  color: string;
  selected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export default function SkillBadge({ name, color, selected, onClick, size = 'sm' }: Props) {
  return (
    <span
      onClick={onClick}
      className="skill-badge cursor-pointer select-none"
      style={{
        backgroundColor: selected ? color : `${color}18`,
        color: selected ? '#fff' : color,
        border: `1.5px solid ${selected ? color : `${color}40`}`,
        fontSize: size === 'sm' ? '0.75rem' : '0.8125rem',
        padding: size === 'sm' ? '4px 12px' : '6px 16px',
        opacity: selected ? 1 : 0.85,
      }}
    >
      {name}
    </span>
  );
}
