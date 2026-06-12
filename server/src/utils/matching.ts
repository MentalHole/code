import db from '../models/database';

interface UserSkill {
  skill_id: string;
  proficiency: number;
}

interface SkillVector {
  [skillId: string]: number;
}

const THEMES: { name: string; keywords: string[] }[] = [
  { name: 'music', keywords: ['guitar', 'piano', 'violin', 'drums', 'jazz', 'singing', 'вокал', 'музыка', 'гитара', 'фортепиано', 'скрипка', 'флейта', 'песни', 'choir', 'orchestra', 'classical'] },
  { name: 'sports', keywords: ['running', 'marathon', 'cycling', 'swimming', 'yoga', 'fitness', 'boxing', 'hiking', 'tennis', 'skiing', 'jogging', 'training', 'спорт', 'бег', 'йога', 'фитнес', 'бокс', 'плавание', 'теннис'] },
  { name: 'art', keywords: ['drawing', 'painting', 'calligraphy', 'photography', 'sketch', 'illustration', 'акварель', 'рисование', 'каллиграфия', 'фотография', 'art', 'gallery', 'exhibition'] },
  { name: 'food', keywords: ['cooking', 'cuisine', 'baking', 'chef', 'recipes', 'gastronomy', 'кулинария', 'рецепты', 'еда', 'готовка', 'pizzaiolo', 'pâtissière', 'spices'] },
  { name: 'travel', keywords: ['travel', 'backpacking', 'culture', 'expedition', 'путешествия', 'traveling', 'wanderlust', 'adventure', 'exploring'] },
  { name: 'nature', keywords: ['hiking', 'mountains', 'outdoors', 'nature', 'природа', 'trail', 'forest', 'camping', 'растения', 'garden'] },
  { name: 'reading', keywords: ['books', 'literature', 'reading', 'poetry', 'writing', 'novel', 'book', 'novels', 'library', 'книги', 'литература', 'поэзия', 'писатель'] },
  { name: 'gaming', keywords: ['chess', 'gaming', 'game dev', 'games', 'retro', 'indie', 'steam', 'tournaments', 'шахматы', 'игры', 'геймдев'] },
  { name: 'mindfulness', keywords: ['meditation', 'mindfulness', 'tai chi', 'capoeira', 'yoga', 'zen', 'mindful', 'релакс', 'медитация'] },
  { name: 'teaching', keywords: ['teaching', 'mentoring', 'coach', 'training', 'education', 'teaching', 'mentor', 'преподаю', 'обучаю', 'наставляю', 'coach'] },
];

function textSimilarity(textA: string, textB: string): number {
  const wordsA = new Set(textA.toLowerCase().split(/[\s,]+/));
  const wordsB = new Set(textB.toLowerCase().split(/[\s,]+/));
  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w) && w.length > 2) intersection++;
  }
  const union = Math.max(wordsA.size, wordsB.size);
  return union > 0 ? intersection / union : 0;
}

function hiddenConnectionScore(textA: string, textB: string): number {
  const lowerA = textA.toLowerCase();
  const lowerB = textB.toLowerCase();
  let matchedThemes = 0;
  let reason = '';
  for (const theme of THEMES) {
    const aHas = theme.keywords.some(k => lowerA.includes(k));
    const bHas = theme.keywords.some(k => lowerB.includes(k));
    if (aHas && bHas) {
      matchedThemes++;
      if (!reason) reason = theme.name;
    }
  }
  return matchedThemes > 0 ? Math.min(0.3, matchedThemes * 0.08) : 0;
}

function getHiddenConnectionReason(textA: string, textB: string): string {
  const lowerA = textA.toLowerCase();
  const lowerB = textB.toLowerCase();
  const matched: string[] = [];
  for (const theme of THEMES) {
    const aHas = theme.keywords.some(k => lowerA.includes(k));
    const bHas = theme.keywords.some(k => lowerB.includes(k));
    if (aHas && bHas) matched.push(theme.name);
  }
  if (matched.length === 0) return '';
  const labels: Record<string, string> = {
    music: 'общая любовь к музыке',
    sports: 'интерес к спорту',
    art: 'творческие интересы',
    food: 'любовь к кулинарии',
    travel: 'страсть к путешествиям',
    nature: 'любовь к природе',
    reading: 'интерес к литературе',
    gaming: 'любовь к играм',
    mindfulness: 'интерес к осознанности',
    teaching: 'менторский подход',
  };
  if (matched.length === 1) return `Объединяет ${labels[matched[0]] || matched[0]}`;
  return `Общие увлечения: ${matched.slice(0, 2).map(m => labels[m] || m).join(', ')}`;
}

function cosineSimilarity(a: SkillVector, b: SkillVector): number {
  let dotProduct = 0, normA = 0, normB = 0;
  const allSkills = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const skill of allSkills) {
    const valA = a[skill] || 0, valB = b[skill] || 0;
    dotProduct += valA * valB;
    normA += valA * valA;
    normB += valB * valB;
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function buildSkillVector(skills: UserSkill[]): SkillVector {
  const vector: SkillVector = {};
  for (const s of skills) vector[s.skill_id] = s.proficiency;
  return vector;
}

function searchTypeBonus(userType: string, otherType: string): number {
  if (userType === 'both' || otherType === 'both') return 0.1;
  if (userType !== otherType) return 0.15;
  return 0;
}

interface MatchResult {
  userId: string;
  username: string;
  nickname: string;
  avatar: string;
  bio: string;
  searchType: string;
  similarity: number;
  sharedSkills: { name: string; color: string }[];
  matchReason: string;
}

function buildTypeClause(userSearchType: string, filterType?: string): { clause: string; params: string[] } {
  if (filterType === 'student' || filterType === 'mentor') {
    return { clause: `AND (search_type = ? OR search_type = 'both')`, params: [filterType] };
  } else if (userSearchType !== 'both') {
    const opposite = userSearchType === 'student' ? 'mentor' : 'student';
    return { clause: `AND (search_type = ? OR search_type = 'both')`, params: [opposite] };
  }
  return { clause: '', params: [] };
}

function buildMatchResult(user: any, similarity: number, sharedSkills: { name: string; color: string }[], hiddenReason: string = ''): MatchResult {
  return {
    userId: user.id, username: user.username, nickname: user.nickname,
    avatar: user.avatar || '', bio: user.bio || '', searchType: user.search_type || 'both',
    similarity, sharedSkills: sharedSkills.slice(0, 5),
    matchReason: buildMatchReason(similarity, hiddenReason, sharedSkills),
  };
}

function computeCombinedSimilarity(
  userVector: SkillVector, otherVector: SkillVector,
  userBio: string, otherBio: string,
  userSearchType: string, otherSearchType: string,
  userSkillCount: number,
  friendBoost: number = 0
): number {
  const skillSim = cosineSimilarity(userVector, otherVector);
  const bioSim = textSimilarity(userBio, otherBio);
  const hiddenBio = hiddenConnectionScore(userBio, otherBio);
  const typeBonus = searchTypeBonus(userSearchType, otherSearchType);
  const skillBalance = userSkillCount > 0 ? 1 - (Math.abs(userSkillCount - Object.keys(otherVector).length) / (userSkillCount + 3)) : 0;
  return skillSim * 0.55 + bioSim * 0.15 + hiddenBio * 0.15 + typeBonus * 0.1 + skillBalance * 0.05 + friendBoost;
}

function buildMatchReason(similarity: number, hiddenReason: string, sharedSkills: { name: string; color: string }[]): string {
  if (similarity >= 0.7) return 'Отличное совпадение навыков!';
  if (similarity >= 0.5) return 'Хорошее пересечение навыков.';
  if (hiddenReason) return hiddenReason;
  if (sharedSkills.length > 0) return 'Есть общие интересы.';
  if (similarity > 0) return 'Небольшое совпадение, но может быть интересно.';
  return 'Разные навыки — отличный шанс научиться новому!';
}

export function findMatchesForUser(userId: string, limit: number = 20, filterType?: string): Promise<MatchResult[]> {
  return new Promise((resolve, reject) => {
    db.get(`SELECT search_type, bio FROM users WHERE id = ?`, [userId], (err, currentUser: any) => {
      if (err) return reject(err);
      const userSearchType = currentUser?.search_type || 'both';
      const userBio = currentUser?.bio || '';
      const typeInfo = buildTypeClause(userSearchType, filterType);

      db.all(`SELECT user_id, skill_id, proficiency FROM user_skills WHERE user_id = ?`, [userId], (err, userSkillRows: any[]) => {
        if (err) return reject(err);
        if (!userSkillRows || userSkillRows.length === 0) {
          return getFallbackMatches(userId, limit, userSearchType, filterType).then(resolve).catch(reject);
        }

        const userVector = buildSkillVector(userSkillRows);
        const userSkillIds = userSkillRows.map(r => r.skill_id);
        const userSkillCount = userSkillIds.length;

        db.all(
          `SELECT us.user_id, us.skill_id, us.proficiency
           FROM user_skills us WHERE us.skill_id IN (${userSkillIds.map(() => '?').join(',')})
           AND us.user_id != ?`,
          [...userSkillIds, userId], (err, allRows: any[]) => {
            if (err) return reject(err);

            const userScores: { [uid: string]: UserSkill[] } = {};
            for (const row of allRows) {
              if (!userScores[row.user_id]) userScores[row.user_id] = [];
              userScores[row.user_id].push({ skill_id: row.skill_id, proficiency: row.proficiency });
            }

            const uids = Object.keys(userScores);
            if (uids.length === 0) {
              return getFallbackMatches(userId, limit, userSearchType, filterType).then(resolve).catch(reject);
            }

            const uidPlaceholders = uids.map(() => '?').join(',');
            db.all(
              `SELECT id, username, nickname, avatar, bio, search_type FROM users WHERE id IN (${uidPlaceholders}) ${typeInfo.clause}`,
              [...uids, ...typeInfo.params], (err, users: any[]) => {
                if (err) return reject(err);

                const validUserIds = new Set(users.map((u: any) => u.id));
                const userMap: any = {};
                for (const u of users) userMap[u.id] = u;

                db.all(
                  `SELECT requester_id, addressee_id FROM friends WHERE (requester_id = ? OR addressee_id = ?) AND status = 'accepted'`,
                  [userId, userId], (err2, friendRows: any[]) => {
                    if (err2) return reject(err2);
                    const friendIds = new Set<string>();
                    for (const r of (friendRows || [])) {
                      if (r.requester_id !== userId) friendIds.add(r.requester_id);
                      if (r.addressee_id !== userId) friendIds.add(r.addressee_id);
                    }

                    db.all(
                      `SELECT requester_id, addressee_id FROM friends WHERE status = 'accepted'`,
                      (err3, allFriendRows: any[]) => {
                        if (err3) return reject(err3);

                        const friendFriends: { [uid: string]: Set<string> } = {};
                        for (const r of (allFriendRows || [])) {
                          if (!friendFriends[r.requester_id]) friendFriends[r.requester_id] = new Set();
                          if (!friendFriends[r.addressee_id]) friendFriends[r.addressee_id] = new Set();
                          friendFriends[r.requester_id].add(r.addressee_id);
                          friendFriends[r.addressee_id].add(r.requester_id);
                        }

                        const scored = uids.filter(uid => validUserIds.has(uid)).map(uid => {
                          const otherUser = userMap[uid];
                          const otherVector = buildSkillVector(userScores[uid]);
                          const otherBio = otherUser?.bio || '';

                          let friendBoost = 0;
                          if (friendIds.has(uid)) {
                            friendBoost = 0.3;
                          } else if (friendFriends[uid]) {
                            let commonFriends = 0;
                            for (const fId of (friendFriends[uid] || [])) {
                              if (friendIds.has(fId)) commonFriends++;
                            }
                            if (commonFriends > 0) friendBoost = 0.15;
                          }

                          const similarity = computeCombinedSimilarity(
                            userVector, otherVector, userBio, otherBio,
                            userSearchType, otherUser?.search_type || 'both', userSkillCount, friendBoost
                          );
                          const hiddenReason = similarity < 0.5 ? getHiddenConnectionReason(userBio, otherBio) : '';
                          return { userId: uid, similarity, hiddenReason };
                        });

                        scored.sort((a, b) => b.similarity - a.similarity);
                        const matching = scored.filter(s => s.similarity > 0);
                        const nonMatching = scored.filter(s => s.similarity === 0);
                        const matchingUsers = matching.slice(0, limit);

                        const skillIds = [...new Set(allRows.map((r: any) => r.skill_id))];
                        const skillPlaceholders = skillIds.map(() => '?').join(',');
                        db.all(`SELECT id, name, color FROM skills WHERE id IN (${skillPlaceholders})`, skillIds, (err, skillMapRows: any[]) => {
                          if (err) return reject(err);
                          const skillMap: any = {};
                          for (const s of skillMapRows) skillMap[s.id] = s;

                          const results: MatchResult[] = matchingUsers.map(c => {
                            const u = userMap[c.userId];
                            const shared = allRows
                              .filter((r: any) => r.user_id === c.userId && userSkillIds.includes(r.skill_id) && skillMap[r.skill_id])
                              .map((r: any) => ({ name: skillMap[r.skill_id].name, color: skillMap[r.skill_id].color }));
                            return buildMatchResult(u, Math.round(c.similarity * 100) / 100, shared, c.hiddenReason || '');
                          });

                          if (results.length >= limit) return resolve(results);

                          const matchedIds = matchingUsers.map(m => m.userId);
                          const nonMatchedIds = nonMatching.map(n => n.userId);
                          const fillNeeded = limit - results.length;

                          if (nonMatchedIds.length > 0) {
                            const shuffled = [...nonMatchedIds].sort(() => Math.random() - 0.5);
                            for (const uid of shuffled.slice(0, fillNeeded)) {
                              const u = userMap[uid];
                              if (u) results.push(buildMatchResult(u, 0, []));
                            }
                          }

                          if (results.length < limit) {
                            const excludeIds = [...matchedIds, ...nonMatchedIds];
                            getAllUsersExcept(userId, excludeIds, limit - results.length, typeInfo.clause, typeInfo.params)
                              .then((extraUsers) => {
                                for (const u of extraUsers) {
                                  if (results.length < limit) results.push(buildMatchResult(u, 0, []));
                                }
                                resolve(results);
                              }).catch(reject);
                          } else {
                            resolve(results);
                          }
                        });
                      }
                    );
                  }
                );
              }
            );
          }
        );
      });
    });
  });
}

function getFallbackMatches(userId: string, limit: number, userSearchType: string, filterType?: string): Promise<MatchResult[]> {
  return new Promise((resolve, reject) => {
    const typeInfo = buildTypeClause(userSearchType, filterType);
    db.all(
      `SELECT id, username, nickname, avatar, bio, search_type FROM users
       WHERE id != ? ${typeInfo.clause} ORDER BY RANDOM() LIMIT ?`,
      [userId, ...typeInfo.params, limit], (err, users: any[]) => {
        if (err) return reject(err);
        resolve(users.map((u: any) => buildMatchResult(u, 0, [])));
      }
    );
  });
}

function getAllUsersExcept(userId: string, excludeIds: string[], limit: number, typeClause: string, typeParams: string[]): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const exPlaceholders = [userId, ...excludeIds].map(() => '?').join(',');
    db.all(
      `SELECT id, username, nickname, avatar, bio, search_type FROM users
       WHERE id NOT IN (${exPlaceholders}) ${typeClause} ORDER BY RANDOM() LIMIT ?`,
      [...[userId, ...excludeIds], ...typeParams, limit], (err, rows: any[]) => {
        if (err) return reject(err);
        resolve(rows || []);
      }
    );
  });
}

export function searchUsersBySkills(query: string, currentUserId: string, filterType?: string): Promise<MatchResult[]> {
  return new Promise((resolve, reject) => {
    const typeParams = (filterType === 'student' || filterType === 'mentor') ? [filterType] : [];
    let typeClause = '';
    if (filterType === 'student' || filterType === 'mentor') {
      typeClause = `AND (search_type = ? OR search_type = 'both')`;
    }

    let nameQuery = `SELECT id, username, nickname, avatar, bio, search_type FROM users
                     WHERE (username LIKE ? OR nickname LIKE ?) AND id != ?`;
    const nameParams: any[] = [`%${query}%`, `%${query}%`, currentUserId, ...typeParams];
    if (typeClause) nameQuery += typeClause;
    nameQuery += ` ORDER BY CASE WHEN nickname LIKE ? THEN 0 WHEN username LIKE ? THEN 1 ELSE 2 END, RANDOM() LIMIT 20`;
    nameParams.push(`${query}%`, `${query}%`);

    db.all(nameQuery, nameParams, (err, nameMatches: any[]) => {
      if (err) return reject(err);

      const nameResults: MatchResult[] = (nameMatches || []).map((u: any) => ({
        userId: u.id, username: u.username, nickname: u.nickname,
        avatar: u.avatar || '', bio: u.bio || '', searchType: u.search_type || 'both',
        similarity: 0, sharedSkills: [],
        matchReason: 'Совпадение по имени',
      }));

      db.all(`SELECT s.id, s.name, s.color FROM skills s WHERE s.name LIKE ?`, [`%${query}%`], (err, matchedSkills: any[]) => {
        if (err) return reject(err);
        if (matchedSkills.length === 0) {
          return resolve(nameResults.slice(0, 20));
        }

        const skillIds = matchedSkills.map((s: any) => s.id);
        const placeholders = skillIds.map(() => '?').join(',');

        db.all(
          `SELECT us.user_id, us.skill_id, us.proficiency
           FROM user_skills us WHERE us.skill_id IN (${placeholders}) AND us.user_id != ?`,
          [...skillIds, currentUserId], (err, rows: any[]) => {
            if (err) return reject(err);

            const userSkillMap: { [uid: string]: Set<string> } = {};
            for (const row of rows) {
              if (!userSkillMap[row.user_id]) userSkillMap[row.user_id] = new Set();
              userSkillMap[row.user_id].add(row.skill_id);
            }

            const matchedUids = Object.keys(userSkillMap);
            const nameUidSet = new Set(nameMatches.map((u: any) => u.id));
            const newUids = matchedUids.filter(uid => !nameUidSet.has(uid));

            if (newUids.length === 0) {
              return resolve(nameResults.slice(0, 20));
            }

            const userPlaceholders = newUids.map(() => '?').join(',');
            let userQuery = `SELECT id, username, nickname, avatar, bio, search_type FROM users WHERE id IN (${userPlaceholders})`;
            const userParams: any[] = [...newUids, ...typeParams];
            if (typeClause) userQuery += typeClause;

            db.all(userQuery, userParams, (err, users: any[]) => {
              if (err) return reject(err);

              const skillResults: MatchResult[] = (users || []).map((u: any) => {
                const sharedSkillNames = matchedSkills
                  .filter((ms: any) => userSkillMap[u.id]?.has(ms.id))
                  .map((ms: any) => ({ name: ms.name, color: ms.color }));
                const score = sharedSkillNames.length / Math.max(matchedSkills.length, 1);
                return buildMatchResult(u, Math.round(score * 100) / 100, sharedSkillNames);
              });

              skillResults.sort((a: MatchResult, b: MatchResult) => b.similarity - a.similarity);

              const combined = [...nameResults, ...skillResults];
              const seen = new Set<string>();
              const deduped = combined.filter(r => {
                if (seen.has(r.userId)) return false;
                seen.add(r.userId);
                return true;
              });
              resolve(deduped.slice(0, 20));
            });
          }
        );
      });
    });
  });
}
