import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import db from '../models/database';

interface ProfileSeed {
  username: string;
  nickname: string;
  bio: string;
  searchType: string;
  skillNames: string[];
}

const profiles: ProfileSeed[] = [
  {
    username: 'aidos_serik',
    nickname: 'Айдос',
    bio: 'Фронтенд-разработчик с 5-летним опытом. Могу научить React и TypeScript. В свободное время играю на гитаре.',
    searchType: 'mentor',
    skillNames: ['React', 'TypeScript', 'JavaScript', 'Игра на гитаре'],
  },
  {
    username: 'gulnaz_zh',
    nickname: 'Гульназ',
    bio: 'Профессиональный хореограф, преподаю современные и бальные танцы. Также учу казахскому языку.',
    searchType: 'mentor',
    skillNames: ['Современные танцы', 'Бальные танцы', 'Казахский язык', 'Фитнес'],
  },
  {
    username: 'berik_kz',
    nickname: 'Берик',
    bio: 'Ищу наставника по Python и Data Science. Сам могу научить играть в шахматы и стрельбе из лука.',
    searchType: 'both',
    skillNames: ['Python', 'Шахматы', 'Стрельба из лука'],
  },
  {
    username: 'aisha_tur',
    nickname: 'Айша',
    bio: 'Преподаватель вокала и фортепиано. Хочу выучить английский для путешествий.',
    searchType: 'both',
    skillNames: ['Вокал', 'Игра на фортепиано', 'Английский язык'],
  },
  {
    username: 'nurlan_batyr',
    nickname: 'Нурлан',
    bio: 'Серийный предприниматель, разбираюсь в управлении продуктами. Хочу освоить видеомонтаж.',
    searchType: 'both',
    skillNames: ['Управление продуктами', 'Видеомонтаж', 'Кулинария'],
  },
  {
    username: 'madina_omar',
    nickname: 'Мадина',
    bio: 'Фотограф со стажем 7 лет. Обучаю композиции и обработке. Мечтаю научиться играть на гитаре.',
    searchType: 'both',
    skillNames: ['Фотография', 'Рисование', 'Игра на гитаре'],
  },
  {
    username: 'daulet_yes',
    nickname: 'Даулет',
    bio: 'DevOps-инженер в IT-компании. Могу научить Docker и CI/CD. Хочу изучить Go.',
    searchType: 'both',
    skillNames: ['DevOps', 'Python', 'Облачная архитектура', 'Go'],
  },
  {
    username: 'ainur_777',
    nickname: 'Айнур',
    bio: 'Преподаю йогу и фитнес уже 4 года. Сертифицированный инструктор. Учу казахский язык.',
    searchType: 'mentor',
    skillNames: ['Йога', 'Фитнес', 'Плавание', 'Казахский язык'],
  },
  {
    username: 'zanat_music',
    nickname: 'Жанат',
    bio: 'Гитарист, играю в рок-группе. Преподаю гитару начинающим. Хочу освоить звукорежиссуру.',
    searchType: 'mentor',
    skillNames: ['Игра на гитаре', 'Вокал', 'Игра на фортепиано'],
  },
  {
    username: 'meruert_k',
    nickname: 'Меруерт',
    bio: 'Студентка, изучаю Java и мобильную разработку. Могу помочь с казахским и английским языками.',
    searchType: 'both',
    skillNames: ['Java', 'Мобильная разработка', 'Казахский язык', 'Английский язык'],
  },
  {
    username: 'arman_zh',
    nickname: 'Арман',
    bio: 'Боксёр-любитель, тренируюсь 6 лет. Ищу, кто научит React для создания сайта своей секции.',
    searchType: 'student',
    skillNames: ['Бокс', 'Фитнес', 'React'],
  },
  {
    username: 'symbat_art',
    nickname: 'Сымбат',
    bio: 'Художница-иллюстратор. Работаю в digital и традиционных техниках. Учу турецкий язык.',
    searchType: 'mentor',
    skillNames: ['Рисование', 'Каллиграфия', 'Турецкий язык'],
  },
  {
    username: 'erbolat_s',
    nickname: 'Ерболат',
    bio: 'Системный администратор → облачный архитектор. Наставляю джуниоров. Хочу научиться играть на фортепиано.',
    searchType: 'both',
    skillNames: ['Облачная архитектура', 'Кибербезопасность', 'Системный дизайн', 'Игра на фортепиано'],
  },
  {
    username: 'dana_kz',
    nickname: 'Дана',
    bio: 'Переводчик с китайского и английского. Учу языки через музыку — играю на домбре.',
    searchType: 'mentor',
    skillNames: ['Китайский язык', 'Английский язык', 'Казахский язык', 'Игра на гитаре'],
  },
  {
    username: 'bakhyt_zh',
    nickname: 'Бахыт',
    bio: 'Шеф-повар и кулинарный блоггер. Могу научить готовить казахские национальные блюда.',
    searchType: 'mentor',
    skillNames: ['Кулинария', 'Фотография', 'Видеомонтаж'],
  },
  {
    username: 'tomiris_01',
    nickname: 'Томирис',
    bio: 'Преподаватель ораторского искусства и писательского мастерства. Хочу выучить китайский.',
    searchType: 'both',
    skillNames: ['Ораторское искусство', 'Писательское мастерство', 'Китайский язык'],
  },
  {
    username: 'olzhas_dev',
    nickname: 'Олжас',
    bio: 'Fullstack-разработчик на Rust и Go. Ищу учеников для менторства. Сам учусь верховой езде.',
    searchType: 'both',
    skillNames: ['Rust', 'Go', 'JavaScript', 'Верховая езда'],
  },
  {
    username: 'araika_s',
    nickname: 'Арайка',
    bio: 'Мастер спорта по спортивной гимнастике. Тренирую детей и взрослых. Учу английский.',
    searchType: 'both',
    skillNames: ['Спортивная гимнастика', 'Плавание', 'Теннис', 'Английский язык'],
  },
  {
    username: 'maksat_n',
    nickname: 'Максат',
    bio: 'Тестировщик с 3-летним опытом. Могу научить автоматизации тестирования. Играю в шахматы.',
    searchType: 'mentor',
    skillNames: ['Тестирование/QA', 'Python', 'Шахматы', 'Кибербезопасность'],
  },
  {
    username: 'zhansaya_t',
    nickname: 'Жансая',
    bio: 'Дизайнер интерфейсов. Обучаю UI/UX и Figma. Увлекаюсь каллиграфией и танцами.',
    searchType: 'mentor',
    skillNames: ['UI/UX Дизайн', 'Рисование', 'Каллиграфия', 'Современные танцы'],
  },
];

export async function seedProfiles(): Promise<void> {
  const hashedPassword = bcrypt.hashSync('password123', 10);

  const getSkillId = (name: string): Promise<string | null> => {
    return new Promise((resolve) => {
      db.get('SELECT id FROM skills WHERE name = ?', [name], (err, row: any) => {
        resolve(row?.id || null);
      });
    });
  };

  const insertProfile = (p: ProfileSeed): Promise<void> => {
    return new Promise((resolve) => {
      const id = uuidv4();
      db.run(
        `INSERT OR IGNORE INTO users (id, username, email, password, nickname, bio, search_type)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, p.username, `${p.username}@skillmatch.kz`, hashedPassword, p.nickname, p.bio, p.searchType],
        async () => {
          for (const skillName of p.skillNames) {
            const skillId = await getSkillId(skillName);
            if (skillId) {
              const proficiency = Math.floor(Math.random() * 3) + 3;
              await new Promise<void>((r) => {
                db.run('INSERT OR IGNORE INTO user_skills (user_id, skill_id, proficiency) VALUES (?, ?, ?)',
                  [id, skillId, proficiency], () => r());
              });
            }
          }
          resolve();
        }
      );
    });
  };

  for (const p of profiles) {
    await insertProfile(p);
  }
  console.log(`Добавлено ${profiles.length} профилей`);
}
