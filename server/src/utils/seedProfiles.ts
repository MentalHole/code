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
  { username: 'aidos_serik', nickname: 'Айдос', bio: 'Фронтенд-разработчик, 5 лет создаю интерфейсы на React и TypeScript. Люблю чистый код и архитектуру компонентов. По вечерам играю на гитаре и сочиняю музыку. Верю, что лучший способ научиться — объяснять сложное простыми словами.', searchType: 'mentor', skillNames: ['React', 'TypeScript', 'JavaScript', 'Игра на гитаре'] },
  { username: 'gulnaz_zh', nickname: 'Гульназ', bio: 'Профессиональный хореограф с 8-летним стажем, преподаю современные и бальные танцы. Обучаю казахскому языку через музыку и движение. Считаю, что танец — это язык, который объединяет людей. Мои ученики выступают на городских конкурсах.', searchType: 'mentor', skillNames: ['Современные танцы', 'Бальные танцы', 'Казахский язык', 'Фитнес'] },
  { username: 'berik_kz', nickname: 'Берик', bio: 'Начинающий аналитик данных, ищу наставника по Python и Data Science. Увлекаюсь шахматами и стратегическими играми. Стрельба из лука помогает мне развивать концентрацию. Мечтаю создать сервис для анализа шахматных партий.', searchType: 'student', skillNames: ['Python', 'Шахматы', 'Стрельба из лука'] },
  { username: 'aisha_tur', nickname: 'Айша', bio: 'Преподаю вокал и фортепиано уже 6 лет, работала с детьми и взрослыми. Учу английский, чтобы путешествовать и петь internacional. Обожаю джаз и академический вокал. Моя методика — через эмоции к технике.', searchType: 'both', skillNames: ['Вокал', 'Игра на фортепиано', 'Английский язык'] },
  { username: 'nurlan_batyr', nickname: 'Нурлан', bio: 'Предприниматель и продакт-менеджер, запустил два стартапа в сфере EdTech. Хочу освоить видеомонтаж, чтобы снимать обучающие курсы. Люблю готовить национальные блюда и читать книги по психологии. Верю в lifelong learning.', searchType: 'both', skillNames: ['Управление продуктами', 'Видеомонтаж', 'Кулинария'] },
  // Russia
  { username: 'dmitry_volkov', nickname: 'Дмитрий', bio: 'Fullstack-разработчик с 7-летним опытом, специализируюсь на Python и React. Активно наставляю джуниоров, провожу код-ревью. Увлекаюсь DevOps и автоматизацией. В свободное время играю в настольный теннис и читаю техническую литературу.', searchType: 'mentor', skillNames: ['Python', 'React', 'JavaScript', 'DevOps'] },
  { username: 'elena_ivanova', nickname: 'Елена', bio: 'Дизайнер интерфейсов с фокусом на UI/UX в Figma. Создаю удобные и красивые продукты. Учу английский, чтобы работать с зарубежными заказчиками. Рисую акварелью и веду блог о дизайне. Вдохновляюсь скандинавским минимализмом.', searchType: 'both', skillNames: ['UI/UX Дизайн', 'Рисование', 'Английский язык'] },
  { username: 'alexey_smirnov', nickname: 'Алексей', bio: 'Системный архитектор с 12-летним стажем, проектировал высоконагруженные системы для Яндекса. Обучаю системному дизайну и облачной архитектуре. Увлекаюсь криптографией и кибербезопасностью. Считаю, что хорошая архитектура — это 80% успеха проекта.', searchType: 'mentor', skillNames: ['Системный дизайн', 'Облачная архитектура', 'Кибербезопасность'] },
  // USA
  { username: 'jake_anderson', nickname: 'Jake', bio: 'Software engineer at Google with 8 years of experience. I specialize in system design and algorithms. Passionate about mentoring junior engineers and conducting mock interviews. When not coding, I hike in the Rockies and play jazz guitar.', searchType: 'mentor', skillNames: ['Системный дизайн', 'C++', 'Go', 'Python'] },
  { username: 'sarah_connor', nickname: 'Sarah', bio: 'Data scientist working at a fintech startup. I build ML models and love explaining complex concepts visually. Learning Kazakh to connect with my heritage. I run marathons and volunteer at women-in-tech organizations.', searchType: 'both', skillNames: ['Data Science', 'Машинное обучение', 'Python', 'Казахский язык'] },
  { username: 'mike_johnson', nickname: 'Mike', bio: 'Indie game developer working with Unity and C#. I released two games on Steam. Looking for a mentor in game design and art direction. I also play drums in a local band and love retro gaming.', searchType: 'student', skillNames: ['Разработка игр', 'C++', 'JavaScript'] },
  // UK
  { username: 'oliver_brown', nickname: 'Oliver', bio: 'DevOps engineer at a London fintech. I architect CI/CD pipelines and cloud infrastructure on AWS. Teaching cloud architecture and Kubernetes. Enjoy cycling along the Thames and brewing my own beer.', searchType: 'mentor', skillNames: ['DevOps', 'Облачная архитектура', 'Python', 'Кибербезопасность'] },
  { username: 'emma_wilson', nickname: 'Emma', bio: 'UX researcher with a psychology background. I combine data with empathy to create better products. Learning mobile development to prototype my own ideas. Love hiking in the Scottish Highlands and reading Victorian literature.', searchType: 'both', skillNames: ['Управление продуктами', 'UI/UX Дизайн', 'Мобильная разработка'] },
  // France
  { username: 'luc_dupont', nickname: 'Luc', bio: 'Développeur fullstack depuis 6 ans, spécialisé React et Rust. J\'enseigne le français aux développeurs étrangers. Photographe amateur, je capture les rues de Paris. Convaincu que la diversité des compétences fait la force d\'un développeur.', searchType: 'mentor', skillNames: ['React', 'Rust', 'TypeScript', 'Фотография'] },
  { username: 'chloe_martin', nickname: 'Chloé', bio: 'Chef pâtissière formée à Paris, aujourd\'hui consultante culinaire. Enseigne la cuisine française et la photographie culinaire. Apprends le chinois pour écrire un livre de recettes franco-chinois. Je collectionne les épices du monde entier.', searchType: 'both', skillNames: ['Кулинария', 'Фотография', 'Китайский язык'] },
  // Germany
  { username: 'hans_mueller', nickname: 'Hans', bio: 'Embedded systems engineer at Bosch, working with C++ and Rust for automotive. Teaching German and embedded programming. Precision and reliability define my coding style. In my free time I restore vintage motorcycles and practice photography.', searchType: 'mentor', skillNames: ['C++', 'Rust', 'Кибербезопасность', 'Английский язык'] },
  { username: 'anna_schmidt', nickname: 'Anna', bio: 'Senior product manager at SAP, focused on enterprise cloud products. Taking a sabbatical to learn yoga instruction and watercolor painting. I believe creativity and structure go hand in hand. Planning a solo backpacking trip through Southeast Asia.', searchType: 'student', skillNames: ['Управление продуктами', 'Плавание', 'Английский язык'] },
  // Italy
  { username: 'marco_rossi', nickname: 'Marco', bio: 'Pizzaiolo di Napoli e sviluppatore frontend. Teaching authentic Italian cooking alongside React development. I believe every programmer should know how to make a perfect pizza. Love editing cooking videos and sharing recipes online.', searchType: 'both', skillNames: ['Кулинария', 'React', 'JavaScript', 'Видеомонтаж'] },
  { username: 'sophia_ricci', nickname: 'Sophia', bio: 'Fashion designer for a Milan luxury brand, teaching drawing and calligraphy. Graduate of Polimoda fashion school. Passionate about Renaissance art and modern minimalism. Learning Japanese to collaborate with Tokyo designers.', searchType: 'mentor', skillNames: ['Рисование', 'Каллиграфия', 'Игра на фортепиано'] },
  // Spain
  { username: 'carlos_garcia', nickname: 'Carlos', bio: 'Mobile developer building apps with React Native and Flutter for 5 years. Teaching Spanish through technology topics. Former boxer, now coach at a local gym. I organize hackathons in Barcelona and mentor aspiring developers.', searchType: 'mentor', skillNames: ['Мобильная разработка', 'React', 'JavaScript', 'Бокс'] },
  { username: 'lucia_fernandez', nickname: 'Lucía', bio: 'Yoga instructor and flamenco dancer. Teaching mindfulness through movement. Learning mobile development to build a wellness app. I host retreats in Ibiza and believe in holistic self-improvement. Also training for a triathlon.', searchType: 'both', skillNames: ['Йога', 'Современные танцы', 'Фитнес', 'Плавание'] },
  // Japan
  { username: 'takashi_yamada', nickname: 'タカシ', bio: 'ロボットエンジニア、10年の経験。C++とRustで産業用ロボットを開発。英語でプログラミングを教えられます。将棋と料理が趣味。ロボット工学とアートの融合に興味があります。', searchType: 'mentor', skillNames: ['C++', 'Rust', 'Разработка игр', 'Английский язык'] },
  { username: 'yuki_tanaka', nickname: 'Yuki', bio: 'Professional manga artist published in Weekly Shonen. Teaching drawing fundamentals and calligraphy. Learning Python to create digital art tools. I also teach Japanese language and culture. Inspired by nature and traditional ukiyo-e art.', searchType: 'both', skillNames: ['Рисование', 'Каллиграфия', 'Английский язык', 'Python'] },
  // China
  { username: 'wei_chen', nickname: '伟', bio: 'AI researcher with a PhD in Machine Learning from Tsinghua. Currently leading a computer vision team. Teaching Chinese and Mandarin business communication. I play Go at amateur dan level and collect tea ceremony sets.', searchType: 'mentor', skillNames: ['Машинное обучение', 'Data Science', 'Python', 'Китайский язык'] },
  { username: 'li_na', nickname: '丽娜', bio: 'Traditional Chinese painter and calligraphy master. Teaching Chinese art and language to foreigners. Learning English to study Western art history. I have exhibited in Beijing and Shanghai galleries. My students say I am patient and passionate.', searchType: 'both', skillNames: ['Рисование', 'Каллиграфия', 'Китайский язык', 'Английский язык'] },
  // India
  { username: 'arjun_sharma', nickname: 'Arjun', bio: 'Full-stack developer at a Bangalore unicorn. I teach React, Node.js and TypeScript with real-world examples. Former national-level cricket player, now coaching juniors. I believe discipline from sports applies directly to writing clean code.', searchType: 'mentor', skillNames: ['React', 'JavaScript', 'TypeScript', 'Теннис'] },
  { username: 'priya_patel', nickname: 'Priya', bio: 'Data analyst skilled in Python, SQL and visualization. Looking to transition into data engineering. Learning Hindi calligraphy to connect with my roots. I run a book club focused on science fiction and tech philosophy.', searchType: 'student', skillNames: ['Python', 'Data Science', 'Английский язык'] },
  // Brazil
  { username: 'pedro_santos', nickname: 'Pedro', bio: 'DevOps engineer managing 200+ microservices in production. Teaching cloud architecture and samba dancing on the side! I automate everything, including my morning coffee routine. Love sharing Brazilian culture through music and dance.', searchType: 'both', skillNames: ['DevOps', 'Облачная архитектура', 'Современные танцы', 'Фитнес'] },
  { username: 'ana_costa', nickname: 'Ana', bio: 'Certified fitness coach and capoeira instructor with 10 years experience. Teaching functional training and self-defense. Learning UI design to launch my own fitness app. I competed in Brazilian Jiu-Jitsu championships and mentor young athletes.', searchType: 'mentor', skillNames: ['Фитнес', 'Плавание', 'Йога', 'Бальные танцы'] },
  // Mexico
  { username: 'carlos_hernandez', nickname: 'Carlos', bio: 'Cybersecurity analyst with OSCP certification. Teaching ethical hacking and network defense. Fluent in Spanish and English, learning Japanese. I participate in CTF competitions and run a security podcast. Hiking and landscape photography are my escapes.', searchType: 'mentor', skillNames: ['Кибербезопасность', 'Python', 'Английский язык', 'Бокс'] },
  { username: 'maria_lopez', nickname: 'María', bio: 'Professional photographer specializing in portraiture and food photography. Teaching video editing and post-production. Learning ML to build automated photo enhancers. My work has been featured in National Geographic and Vogue Mexico.', searchType: 'both', skillNames: ['Фотография', 'Видеомонтаж', 'Рисование', 'Кулинария'] },
  // Egypt
  { username: 'ahmed_hassan', nickname: 'Ahmed', bio: 'Mobile developer with 6 years in Flutter and Kotlin. Teaching Arabic to non-native speakers through tech contexts. I build apps for educational nonprofits in my free time. Avid chess player and participate in local tournaments.', searchType: 'mentor', skillNames: ['Мобильная разработка', 'Java', 'Разработка игр', 'Английский язык'] },
  { username: 'nour_ali', nickname: 'Nour', bio: 'Swimming coach and certified fitness trainer, worked with Olympic hopefuls. Learning web development to build a platform for athletes. I teach Arabic and Egyptian culture through cooking. Marathon runner with a personal best of 3:45.', searchType: 'both', skillNames: ['Плавание', 'Фитнес', 'Шахматы', 'Английский язык'] },
  // Nigeria
  { username: 'chidi_okonkwo', nickname: 'Chidi', bio: 'Frontend developer at a Lagos fintech, React specialist. Teaching African drumming and dance alongside coding. I organize tech meetups and speak at conferences about accessible web design. Philosophy minor — I bring stoicism to software development.', searchType: 'mentor', skillNames: ['React', 'JavaScript', 'TypeScript', 'Игра на гитаре'] },
  { username: 'amina_ibrahim', nickname: 'Amina', bio: 'Public speaking coach and published author of two novels. Teaching creative writing and presentation skills. Learning mobile development to digitize African folktales. I mentor young women in tech through a nonprofit I founded.', searchType: 'both', skillNames: ['Ораторское искусство', 'Писательское мастерство', 'Английский язык'] },
  // Turkey
  { username: 'mehmet_demir', nickname: 'Mehmet', bio: 'Fullstack developer working with Java Spring Boot and React. Teaching Turkish cuisine and language. I run a food blog with 50k monthly readers. Passionate about combining technology with gastronomy — building a recipe recommendation engine.', searchType: 'both', skillNames: ['Java', 'React', 'Кулинария', 'Турецкий язык'] },
  { username: 'zeynep_yilmaz', nickname: 'Zeynep', bio: 'Calligraphy artist and painter exhibiting in Istanbul galleries. Teaching Turkish art history and Ottoman calligraphy. I also teach piano to beginners. Learning Japanese to study shodo calligraphy. My art blends Eastern and Western aesthetics.', searchType: 'mentor', skillNames: ['Каллиграфия', 'Рисование', 'Турецкий язык', 'Игра на фортепиано'] },
  // Korea
  { username: 'minjun_kim', nickname: '민준', bio: '게임 개발자, C++와 Unity로 3개의 모바일 게임 출시. 한국어와 게임 개발을 가르칩니다. 클래식 기타 연주와 사진 촬영이 취미. 인디 게임 커뮤니티에서 활동하며 후배 개발자들을 멘토링합니다.', searchType: 'mentor', skillNames: ['Разработка игр', 'C++', 'JavaScript', 'Английский язык'] },
  { username: 'sohee_park', nickname: 'Sohee', bio: 'Professional K-pop dancer and yoga instructor. Teaching dance fitness and Korean culture. Learning data science to analyze dance movement patterns. Trained at a major K-pop agency, now choreographing for aspiring idols.', searchType: 'both', skillNames: ['Современные танцы', 'Йога', 'Фитнес', 'Английский язык'] },
  // More diverse profiles
  { username: 'viktor_petrov', nickname: 'Виктор', bio: 'Blockchain developer, built smart contracts for DeFi protocols. Teaching Solidity, Rust and web3 fundamentals. Chess enthusiast with a FIDE rating of 1800. I contribute to open-source crypto projects and write technical articles about blockchain architecture.', searchType: 'mentor', skillNames: ['Блокчейн', 'Rust', 'Кибербезопасность', 'Шахматы'] },
  { username: 'leila_moradi', nickname: 'Leila', bio: 'Farsi and English literature teacher with a Master\'s in Linguistics. Learning web development to create language learning platforms. I write poetry in both Farsi and English. Passionate about cross-cultural communication and teaching through stories.', searchType: 'student', skillNames: ['Английский язык', 'Писательское мастерство', 'Рисование'] },
  { username: 'sven_eriksson', nickname: 'Sven', bio: 'Cloud architect at Spotify, designing scalable microservice systems. Teaching system design and alpine skiing. I maintain Kubernetes clusters that handle millions of requests per second. Weekend warrior — I compete in amateur cross-country skiing races.', searchType: 'mentor', skillNames: ['Облачная архитектура', 'Системный дизайн', 'Go', 'Фитнес'] },
  { username: 'rajesh_kumar', nickname: 'Rajesh', bio: 'Mathematics PhD and former university professor. Chess grandmaster with a peak rating of 2520. Learning Python to build chess analysis tools. I believe math and chess share the same beauty — pattern recognition and strategic thinking.', searchType: 'both', skillNames: ['Шахматы', 'Теннис', 'Python', 'Английский язык'] },
  { username: 'fatima_zahra', nickname: 'Fatima', bio: 'Arabic calligraphy artist and language teacher. Teaching traditional Islamic calligraphy and Arabic grammar. Learning UX design to create beautiful, culturally-aware interfaces. My work has been commissioned for mosques and cultural centers worldwide.', searchType: 'student', skillNames: ['Каллиграфия', 'Рисование', 'Английский язык'] },
  { username: 'thiago_oliveira', nickname: 'Thiago', bio: 'Brazilian Jiu-Jitsu black belt and head coach at a São Paulo academy. Teaching self-defense, fitness and discipline. Learning programming to build a BJJ technique database app. I competed in ADCC trials and mentor at-risk youth through martial arts.', searchType: 'mentor', skillNames: ['Фитнес', 'Плавание', 'Бокс', 'Современные танцы'] },
  { username: 'yuan_zhang', nickname: 'Yuan', bio: 'AI product manager at a Shenzhen robotics company. Managing ML and computer vision products. Teaching Chinese business culture and negotiation. I practice Tai Chi daily and believe in balanced leadership. Learning Spanish for Latin American market expansion.', searchType: 'both', skillNames: ['Машинное обучение', 'Управление продуктами', 'Data Science', 'Китайский язык'] },
  { username: 'olga_sokolova', nickname: 'Ольга', bio: 'Professional violinist and music teacher at the Moscow Conservatory. Teaching violin, piano and music theory. Learning mobile development to create a music education app. I perform with a chamber orchestra and record film soundtracks.', searchType: 'both', skillNames: ['Игра на фортепиано', 'Вокал', 'Английский язык', 'Каллиграфия'] },
  { username: 'kwame_asante', nickname: 'Kwame', bio: 'Software engineer and published poet. I write code by day and poetry by night. Teaching creative writing alongside JavaScript and Python. I believe code is poetry and poetry is code. My debut collection won a national literary prize in Ghana.', searchType: 'mentor', skillNames: ['JavaScript', 'Python', 'Писательское мастерство', 'Ораторское искусство'] },
  { username: 'isabella_ferrari', nickname: 'Isabella', bio: 'Fashion designer for a Milan luxury house and art historian. Teaching Italian language, fashion illustration and art history. I photograph vintage architecture and collect antique sewing machines. My aesthetic blends Renaissance proportions with modern minimalism.', searchType: 'both', skillNames: ['Рисование', 'Каллиграфия', 'Фотография', 'Кулинария'] },
  { username: 'dmitriy_zhukov', nickname: 'Дмитрий', bio: 'Game developer and 3D artist with 7 years in the industry. Teaching Blender, Unity and game design pipelines. I create low-poly art and write shaders. My indie game won Best Art Direction at a local game jam. Passionate about procedural generation.', searchType: 'mentor', skillNames: ['Разработка игр', 'C++', 'Рисование', 'Видеомонтаж'] },
  { username: 'lars_nielsen', nickname: 'Lars', bio: 'Embedded Linux engineer working on IoT devices for smart agriculture. Teaching embedded systems, cybersecurity and C++. I run a home lab with 30+ Raspberry Pis. Building an open-source sensor network for environmental monitoring in the Nordics.', searchType: 'mentor', skillNames: ['Кибербезопасность', 'C++', 'Python', 'Системный дизайн'] },
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
