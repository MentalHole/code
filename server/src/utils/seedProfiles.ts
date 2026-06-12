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
  // Kazakhstan
  { username: 'aidos_serik', nickname: 'Айдос', bio: 'Фронтенд-разработчик, 5 лет опыта. React, TypeScript.', searchType: 'mentor', skillNames: ['React', 'TypeScript', 'JavaScript', 'Игра на гитаре'] },
  { username: 'gulnaz_zh', nickname: 'Гульназ', bio: 'Хореограф, учу современным танцам и казахскому языку.', searchType: 'mentor', skillNames: ['Современные танцы', 'Бальные танцы', 'Казахский язык', 'Фитнес'] },
  { username: 'berik_kz', nickname: 'Берик', bio: 'Ищу наставника по Python и Data Science. Играю в шахматы.', searchType: 'student', skillNames: ['Python', 'Шахматы', 'Стрельба из лука'] },
  { username: 'aisha_tur', nickname: 'Айша', bio: 'Преподаю вокал и фортепиано. Учу английский для путешествий.', searchType: 'both', skillNames: ['Вокал', 'Игра на фортепиано', 'Английский язык'] },
  { username: 'nurlan_batyr', nickname: 'Нурлан', bio: 'Предприниматель, управление продуктами. Хочу освоить видеомонтаж.', searchType: 'both', skillNames: ['Управление продуктами', 'Видеомонтаж', 'Кулинария'] },
  // Russia
  { username: 'dmitry_volkov', nickname: 'Дмитрий', bio: 'Fullstack-разработчик, Python + React. Наставляю джуниоров.', searchType: 'mentor', skillNames: ['Python', 'React', 'JavaScript', 'DevOps'] },
  { username: 'elena_ivanova', nickname: 'Елена', bio: 'Дизайнер интерфейсов, Figma, UI/UX. Учу английский.', searchType: 'both', skillNames: ['UI/UX Дизайн', 'Рисование', 'Английский язык'] },
  { username: 'alexey_smirnov', nickname: 'Алексей', bio: 'Системный архитектор, 10+ лет. Могу научить системному дизайну.', searchType: 'mentor', skillNames: ['Системный дизайн', 'Облачная архитектура', 'Кибербезопасность'] },
  // USA
  { username: 'jake_anderson', nickname: 'Jake', bio: 'Software engineer at Google. I teach system design and algorithms.', searchType: 'mentor', skillNames: ['Системный дизайн', 'C++', 'Go', 'Python'] },
  { username: 'sarah_connor', nickname: 'Sarah', bio: 'Data scientist. ML and Python expert. Learning Kazakh.', searchType: 'both', skillNames: ['Data Science', 'Машинное обучение', 'Python', 'Казахский язык'] },
  { username: 'mike_johnson', nickname: 'Mike', bio: 'Game developer, Unity and C#. Looking for design mentor.', searchType: 'student', skillNames: ['Разработка игр', 'C++', 'JavaScript'] },
  // UK
  { username: 'oliver_brown', nickname: 'Oliver', bio: 'DevOps engineer, Docker & CI/CD. Teaching cloud architecture.', searchType: 'mentor', skillNames: ['DevOps', 'Облачная архитектура', 'Python', 'Кибербезопасность'] },
  { username: 'emma_wilson', nickname: 'Emma', bio: 'UX researcher and product manager. Learning mobile dev.', searchType: 'both', skillNames: ['Управление продуктами', 'UI/UX Дизайн', 'Мобильная разработка'] },
  // France
  { username: 'luc_dupont', nickname: 'Luc', bio: 'Développeur fullstack, React et Rust. J\'enseigne le français.', searchType: 'mentor', skillNames: ['React', 'Rust', 'TypeScript', 'Фотография'] },
  { username: 'chloe_martin', nickname: 'Chloé', bio: 'Chef pâtissière, teaching French cuisine. Learning Chinese.', searchType: 'both', skillNames: ['Кулинария', 'Фотография', 'Китайский язык'] },
  // Germany
  { username: 'hans_mueller', nickname: 'Hans', bio: 'Embedded systems engineer, C++ expert. Teaching German too.', searchType: 'mentor', skillNames: ['C++', 'Rust', 'Кибербезопасность', 'Английский язык'] },
  { username: 'anna_schmidt', nickname: 'Anna', bio: 'Product manager at SAP. Learning yoga and painting.', searchType: 'student', skillNames: ['Управление продуктами', 'Плавание', 'Английский язык'] },
  // Italy
  { username: 'marco_rossi', nickname: 'Marco', bio: 'Pizzaiolo e sviluppatore. Teaching Italian cooking and React.', searchType: 'both', skillNames: ['Кулинария', 'React', 'JavaScript', 'Видеомонтаж'] },
  { username: 'sophia_ricci', nickname: 'Sophia', bio: 'Fashion designer, teaching drawing and calligraphy.', searchType: 'mentor', skillNames: ['Рисование', 'Каллиграфия', 'Игра на фортепиано'] },
  // Spain
  { username: 'carlos_garcia', nickname: 'Carlos', bio: 'Mobile developer, React Native & Flutter. Teaching Spanish.', searchType: 'mentor', skillNames: ['Мобильная разработка', 'React', 'JavaScript', 'Бокс'] },
  { username: 'lucia_fernandez', nickname: 'Lucía', bio: 'Yoga instructor and dancer. Learning mobile development.', searchType: 'both', skillNames: ['Йога', 'Современные танцы', 'Фитнес', 'Плавание'] },
  // Japan
  { username: 'takashi_yamada', nickname: 'タカシ', bio: 'ロボットエンジニア。C++とRustを教えられます。', searchType: 'mentor', skillNames: ['C++', 'Rust', 'Разработка игр', 'Английский язык'] },
  { username: 'yuki_tanaka', nickname: 'Yuki', bio: 'Manga artist, teaching drawing and calligraphy. Learning Python.', searchType: 'both', skillNames: ['Рисование', 'Каллиграфия', 'Английский язык', 'Python'] },
  // China
  { username: 'wei_chen', nickname: '伟', bio: 'AI researcher, ML and Data Science expert. Teaching Chinese.', searchType: 'mentor', skillNames: ['Машинное обучение', 'Data Science', 'Python', 'Китайский язык'] },
  { username: 'li_na', nickname: '丽娜', bio: 'Chinese traditional painter and calligrapher. Learning English.', searchType: 'both', skillNames: ['Рисование', 'Каллиграфия', 'Китайский язык', 'Английский язык'] },
  // India
  { username: 'arjun_sharma', nickname: 'Arjun', bio: 'Full-stack developer, teaches React, Node.js and cricket!', searchType: 'mentor', skillNames: ['React', 'JavaScript', 'TypeScript', 'Теннис'] },
  { username: 'priya_patel', nickname: 'Priya', bio: 'Data analyst, Python and SQL. Learning Hindi calligraphy.', searchType: 'student', skillNames: ['Python', 'Data Science', 'Английский язык'] },
  // Brazil
  { username: 'pedro_santos', nickname: 'Pedro', bio: 'DevOps engineer, teaching cloud and samba dancing!', searchType: 'both', skillNames: ['DevOps', 'Облачная архитектура', 'Современные танцы', 'Фитнес'] },
  { username: 'ana_costa', nickname: 'Ana', bio: 'Fitness coach and capoeira instructor. Learning UI design.', searchType: 'mentor', skillNames: ['Фитнес', 'Плавание', 'Йога', 'Бальные танцы'] },
  // Mexico
  { username: 'carlos_hernandez', nickname: 'Carlos', bio: 'Cybersecurity analyst, teaching ethical hacking and Spanish.', searchType: 'mentor', skillNames: ['Кибербезопасность', 'Python', 'Английский язык', 'Бокс'] },
  { username: 'maria_lopez', nickname: 'María', bio: 'Professional photographer and videographer. Learning ML.', searchType: 'both', skillNames: ['Фотография', 'Видеомонтаж', 'Рисование', 'Кулинария'] },
  // Egypt
  { username: 'ahmed_hassan', nickname: 'Ahmed', bio: 'Mobile developer, Flutter & Kotlin. Teaching Arabic.', searchType: 'mentor', skillNames: ['Мобильная разработка', 'Java', 'Разработка игр', 'Английский язык'] },
  { username: 'nour_ali', nickname: 'Nour', bio: 'Swimming coach and fitness trainer. Learning web development.', searchType: 'both', skillNames: ['Плавание', 'Фитнес', 'Шахматы', 'Английский язык'] },
  // Nigeria
  { username: 'chidi_okonkwo', nickname: 'Chidi', bio: 'Frontend developer, React expert. Teaching African drumming!', searchType: 'mentor', skillNames: ['React', 'JavaScript', 'TypeScript', 'Игра на гитаре'] },
  { username: 'amina_ibrahim', nickname: 'Amina', bio: 'Public speaking coach and writer. Learning mobile development.', searchType: 'both', skillNames: ['Ораторское искусство', 'Писательское мастерство', 'Английский язык'] },
  // Turkey
  { username: 'mehmet_demir', nickname: 'Mehmet', bio: 'Fullstack developer, Java & React. Teaching Turkish cooking.', searchType: 'both', skillNames: ['Java', 'React', 'Кулинария', 'Турецкий язык'] },
  { username: 'zeynep_yilmaz', nickname: 'Zeynep', bio: 'Calligraphy artist and painter. Teaching Turkish and art.', searchType: 'mentor', skillNames: ['Каллиграфия', 'Рисование', 'Турецкий язык', 'Игра на фортепиано'] },
  // Korea
  { username: 'minjun_kim', nickname: '민준', bio: '게임 개발자, C++와 Unity. Teaching Korean and gaming.', searchType: 'mentor', skillNames: ['Разработка игр', 'C++', 'JavaScript', 'Английский язык'] },
  { username: 'sohee_park', nickname: 'Sohee', bio: 'K-pop dancer and yoga teacher. Learning data science.', searchType: 'both', skillNames: ['Современные танцы', 'Йога', 'Фитнес', 'Английский язык'] },
  // More diverse profiles
  { username: 'viktor_petrov', nickname: 'Виктор', bio: 'Blockchain developer, Solidity & Rust. Teaching crypto basics.', searchType: 'mentor', skillNames: ['Блокчейн', 'Rust', 'Кибербезопасность', 'Шахматы'] },
  { username: 'leila_moradi', nickname: 'Leila', bio: 'Farsi and English teacher. Learning web development.', searchType: 'student', skillNames: ['Английский язык', 'Писательское мастерство', 'Рисование'] },
  { username: 'sven_eriksson', nickname: 'Sven', bio: 'Cloud architect at Spotify. Teaching system design and skiing!', searchType: 'mentor', skillNames: ['Облачная архитектура', 'Системный дизайн', 'Go', 'Фитнес'] },
  { username: 'rajesh_kumar', nickname: 'Rajesh', bio: 'Mathematics teacher and chess grandmaster. Learning Python.', searchType: 'both', skillNames: ['Шахматы', 'Теннис', 'Python', 'Английский язык'] },
  { username: 'fatima_zahra', nickname: 'Fatima', bio: 'Arabic calligrapher and language teacher. Learning UX design.', searchType: 'student', skillNames: ['Каллиграфия', 'Рисование', 'Английский язык'] },
  { username: 'thiago_oliveira', nickname: 'Thiago', bio: 'Jiu-jitsu coach and fitness trainer. Teaching self-defense.', searchType: 'mentor', skillNames: ['Фитнес', 'Плавание', 'Бокс', 'Современные танцы'] },
  { username: 'yuan_zhang', nickname: 'Yuan', bio: 'AI product manager, ML & Data expert. Teaching Chinese business.', searchType: 'both', skillNames: ['Машинное обучение', 'Управление продуктами', 'Data Science', 'Китайский язык'] },
  { username: 'olga_sokolova', nickname: 'Ольга', bio: 'Violinist and music teacher. Learning mobile development.', searchType: 'both', skillNames: ['Игра на фортепиано', 'Вокал', 'Английский язык', 'Каллиграфия'] },
  { username: 'kwame_asante', nickname: 'Kwame', bio: 'Software engineer and poet. Teaching creative writing and code.', searchType: 'mentor', skillNames: ['JavaScript', 'Python', 'Писательское мастерство', 'Ораторское искусство'] },
  { username: 'isabella_ferrari', nickname: 'Isabella', bio: 'Fashion designer and art historian. Teaching Italian and style.', searchType: 'both', skillNames: ['Рисование', 'Каллиграфия', 'Фотография', 'Кулинария'] },
  { username: 'dmitriy_zhukov', nickname: 'Дмитрий', bio: 'Game dev and 3D artist. Teaching Blender and Unity.', searchType: 'mentor', skillNames: ['Разработка игр', 'C++', 'Рисование', 'Видеомонтаж'] },
  { username: 'lars_nielsen', nickname: 'Lars', bio: 'Embedded Linux expert. Teaching IoT and cybersecurity.', searchType: 'mentor', skillNames: ['Кибербезопасность', 'C++', 'Python', 'Системный дизайн'] },
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

export function seedTestSessions(): void {
  db.all(`SELECT id FROM users ORDER BY RANDOM()`, (err, allUsers: any[]) => {
    if (!allUsers || allUsers.length < 2) return;
    const shuffled = allUsers.sort(() => Math.random() - 0.5);
    db.all(`SELECT count(*) as cnt FROM sessions WHERE status = 'active'`, (err2, row: any[]) => {
      if (row?.[0]?.cnt && row[0].cnt >= shuffled.length) return;
      db.all(`SELECT id FROM skills`, (err3, skills: any[]) => {
        if (!skills || skills.length === 0) return;
        const skillId = skills[0].id;
        const startTime = new Date().toISOString();
        const endTime = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
        let inserted = 0;
        for (let i = 0; i < shuffled.length; i++) {
          const hostId = shuffled[i].id;
          const guestIdx = (i + 1) % shuffled.length;
          const guestId = shuffled[guestIdx].id;
          const sessionId = `test_session_${hostId}`;
          db.run(
            `INSERT OR IGNORE INTO sessions (id, host_id, guest_id, skill_id, status, start_time, end_time) VALUES (?, ?, ?, ?, 'active', ?, ?)`,
            [sessionId, hostId, guestId, skillId, startTime, endTime],
            function (err4) {
              if (!err4 && this.changes > 0) inserted++;
              if (i === shuffled.length - 1) {
                console.log(`Добавлено ${inserted} тестовых сессий`);
                // Create a few test messages for each session
                db.all(`SELECT id FROM sessions WHERE status = 'active'`, (err5, sessions: any[]) => {
                  if (!sessions) return;
                  for (const s of sessions) {
                    db.get(`SELECT host_id, guest_id FROM sessions WHERE id = ?`, [s.id], (err6, session: any) => {
                      if (!session) return;
                      db.run(
                        `INSERT OR IGNORE INTO messages (id, session_id, sender_id, content, type, created_at) VALUES (?, ?, ?, ?, 'text', ?)`,
                        [`msg_welcome_${s.id}`, s.id, session.host_id, 'Добро пожаловать в тестовую сессию! 🎉', startTime]
                      );
                      db.run(
                        `INSERT OR IGNORE INTO messages (id, session_id, sender_id, content, type, created_at) VALUES (?, ?, ?, ?, 'text', ?)`,
                        [`msg_hello_${s.id}`, s.id, session.guest_id, 'Привет! Чем хочешь заняться сегодня?', startTime]
                      );
                    });
                  }
                });
              }
            }
          );
        }
      });
    });
  });
}
