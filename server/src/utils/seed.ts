import { v4 as uuidv4 } from 'uuid';
import db from '../models/database';

const defaultSkills = [
  { name: 'JavaScript', color: '#f7df1e' },
  { name: 'TypeScript', color: '#3178c6' },
  { name: 'React', color: '#61dafb' },
  { name: 'Python', color: '#3776ab' },
  { name: 'Rust', color: '#dea584' },
  { name: 'Go', color: '#00add8' },
  { name: 'UI/UX Дизайн', color: '#ff6b6b' },
  { name: 'Data Science', color: '#9b59b6' },
  { name: 'DevOps', color: '#2ecc71' },
  { name: 'Машинное обучение', color: '#e74c3c' },
  { name: 'Мобильная разработка', color: '#1abc9c' },
  { name: 'Блокчейн', color: '#f39c12' },
  { name: 'Управление продуктами', color: '#8e44ad' },
  { name: 'Кибербезопасность', color: '#2c3e50' },
  { name: 'Облачная архитектура', color: '#3498db' },
  { name: 'Системный дизайн', color: '#e67e22' },
  { name: 'Тестирование/QA', color: '#1e8449' },
  { name: 'Разработка игр', color: '#d35400' },
  { name: 'C++', color: '#00599c' },
  { name: 'Java', color: '#ed8b00' },
  { name: 'Игра на гитаре', color: '#d4a574' },
  { name: 'Игра на фортепиано', color: '#8c6bb1' },
  { name: 'Вокал', color: '#ff69b4' },
  { name: 'Современные танцы', color: '#ff4500' },
  { name: 'Бальные танцы', color: '#dc143c' },
  { name: 'Фотография', color: '#2f4f4f' },
  { name: 'Видеомонтаж', color: '#4a0080' },
  { name: 'Рисование', color: '#ff8c00' },
  { name: 'Спортивная гимнастика', color: '#00ced1' },
  { name: 'Йога', color: '#98fb98' },
  { name: 'Фитнес', color: '#ff6347' },
  { name: 'Шахматы', color: '#8b4513' },
  { name: 'Кулинария', color: '#ffa500' },
  { name: 'Английский язык', color: '#1e90ff' },
  { name: 'Казахский язык', color: '#00bfff' },
  { name: 'Китайский язык', color: '#b22222' },
  { name: 'Турецкий язык', color: '#32cd32' },
  { name: 'Писательское мастерство', color: '#6a5acd' },
  { name: 'Ораторское искусство', color: '#ff1493' },
  { name: 'Каллиграфия', color: '#708090' },
  { name: 'Стрельба из лука', color: '#556b2f' },
  { name: 'Верховая езда', color: '#bc8f8f' },
  { name: 'Плавание', color: '#4682b4' },
  { name: 'Бокс', color: '#b22222' },
  { name: 'Теннис', color: '#adff2f' },
];

export function seedSkills(): void {
  const stmt = db.prepare('INSERT OR IGNORE INTO skills (id, name, color) VALUES (?, ?, ?)');
  defaultSkills.forEach(skill => {
    stmt.run(uuidv4(), skill.name, skill.color);
  });
  stmt.finalize();
  console.log('Навыки добавлены');
}
