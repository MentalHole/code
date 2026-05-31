import db from '../models/database';

interface UserSkill {
  skill_id: string;
  proficiency: number;
}

interface SkillVector {
  [skillId: string]: number;
}

function cosineSimilarity(a: SkillVector, b: SkillVector): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  const allSkills = new Set([...Object.keys(a), ...Object.keys(b)]);

  for (const skill of allSkills) {
    const valA = a[skill] || 0;
    const valB = b[skill] || 0;
    dotProduct += valA * valB;
    normA += valA * valA;
    normB += valB * valB;
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function buildSkillVector(skills: UserSkill[]): SkillVector {
  const vector: SkillVector = {};
  for (const s of skills) {
    vector[s.skill_id] = s.proficiency;
  }
  return vector;
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

export function findMatchesForUser(userId: string, limit: number = 20, filterType?: string): Promise<MatchResult[]> {
  return new Promise((resolve, reject) => {
    db.get(`SELECT search_type FROM users WHERE id = ?`, [userId], (err, currentUser: any) => {
      if (err) return reject(err);
      const userSearchType = currentUser?.search_type || 'both';

      db.all(
        `SELECT user_id, skill_id, proficiency FROM user_skills WHERE user_id = ?`,
        [userId],
        (err, userSkillRows: any[]) => {
          if (err) return reject(err);
          if (!userSkillRows || userSkillRows.length === 0) {
            return getFallbackMatches(userId, limit, filterType).then(resolve).catch(reject);
          }

          const userVector = buildSkillVector(userSkillRows);
          const userSkillIds = userSkillRows.map(r => r.skill_id);

          db.all(
            `SELECT us.user_id, us.skill_id, us.proficiency
             FROM user_skills us
             WHERE us.skill_id IN (${userSkillIds.map(() => '?').join(',')})
             AND us.user_id != ?`,
            [...userSkillIds, userId],
            (err, allRows: any[]) => {
              if (err) return reject(err);

              const userScores: { [uid: string]: UserSkill[] } = {};
              for (const row of allRows) {
                if (!userScores[row.user_id]) userScores[row.user_id] = [];
                userScores[row.user_id].push({ skill_id: row.skill_id, proficiency: row.proficiency });
              }

              const uids = Object.keys(userScores);
              if (uids.length === 0) {
                return getFallbackMatches(userId, limit, filterType).then(resolve).catch(reject);
              }

              const uidPlaceholders = uids.map(() => '?').join(',');
              let typeFilter = '';
              const params: any[] = [];
              if (filterType === 'student' || filterType === 'mentor') {
                typeFilter = `AND (search_type = ? OR search_type = 'both')`;
                params.push(filterType);
              } else if (userSearchType !== 'both') {
                const opposite = userSearchType === 'student' ? 'mentor' : 'student';
                typeFilter = `AND (search_type = ? OR search_type = 'both')`;
                params.push(opposite);
              }

              db.all(
                `SELECT id, username, nickname, avatar, bio, search_type FROM users WHERE id IN (${uidPlaceholders}) ${typeFilter}`,
                [...uids, ...params],
                (err, users: any[]) => {
                  if (err) return reject(err);

                  const validUserIds = new Set(users.map((u: any) => u.id));
                  const userMap: any = {};
                  for (const u of users) userMap[u.id] = u;

                  const scored = uids
                    .filter(uid => validUserIds.has(uid))
                    .map(uid => ({
                      userId: uid,
                      vector: buildSkillVector(userScores[uid]),
                      similarity: cosineSimilarity(userVector, buildSkillVector(userScores[uid])),
                    }))
                    .filter(s => s.similarity > 0);

                  scored.sort((a, b) => b.similarity - a.similarity);
                  const topCandidates = scored.slice(0, limit);

                  if (topCandidates.length === 0) {
                    return getFallbackMatches(userId, limit, filterType).then(resolve).catch(reject);
                  }

                  const skillIds = [...new Set(allRows.map((r: any) => r.skill_id))];
                  const skillPlaceholders = skillIds.map(() => '?').join(',');
                  db.all(
                    `SELECT id, name, color FROM skills WHERE id IN (${skillPlaceholders})`,
                    skillIds,
                    (err, skillMapRows: any[]) => {
                      if (err) return reject(err);
                      const skillMap: any = {};
                      for (const s of skillMapRows) skillMap[s.id] = s;

                      const results: MatchResult[] = topCandidates.map(c => {
                        const u = userMap[c.userId];
                        const shared = allRows
                          .filter((r: any) => r.user_id === c.userId && userSkillIds.includes(r.skill_id) && skillMap[r.skill_id])
                          .map((r: any) => ({ name: skillMap[r.skill_id].name, color: skillMap[r.skill_id].color }));

                        let matchReason = '';
                        if (c.similarity >= 0.8) matchReason = 'Отличное совпадение! Очень похожий набор навыков.';
                        else if (c.similarity >= 0.6) matchReason = 'Прекрасное совпадение! Сильное пересечение навыков.';
                        else if (c.similarity >= 0.4) matchReason = 'Хорошее совпадение! Есть общие навыки.';
                        else matchReason = 'Некоторые общие интересы.';

                        return {
                          userId: c.userId,
                          username: u?.username || 'неизвестно',
                          nickname: u?.nickname || 'Неизвестно',
                          avatar: u?.avatar || '',
                          bio: u?.bio || '',
                          searchType: u?.search_type || 'both',
                          similarity: Math.round(c.similarity * 100) / 100,
                          sharedSkills: shared.slice(0, 5),
                          matchReason,
                        };
                      });

                      resolve(results);
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
}

function getFallbackMatches(userId: string, limit: number, filterType?: string): Promise<MatchResult[]> {
  return new Promise((resolve, reject) => {
    let query = `SELECT id, username, nickname, avatar, bio, search_type FROM users WHERE id != ?`;
    const params: any[] = [userId];
    if (filterType === 'student' || filterType === 'mentor') {
      query += ` AND (search_type = ? OR search_type = 'both')`;
      params.push(filterType);
    }
    query += ` ORDER BY RANDOM() LIMIT ?`;
    params.push(limit);

    db.all(query, params, (err, users: any[]) => {
      if (err) return reject(err);
      const results: MatchResult[] = users.map((u: any) => ({
        userId: u.id,
        username: u.username,
        nickname: u.nickname,
        avatar: u.avatar,
        bio: u.bio,
        searchType: u.search_type || 'both',
        similarity: 0,
        sharedSkills: [],
        matchReason: 'Популярный пользователь — загляните в профиль!',
      }));
      resolve(results);
    });
  });
}

export function searchUsersBySkills(query: string, currentUserId: string, filterType?: string): Promise<MatchResult[]> {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT s.id, s.name, s.color FROM skills s WHERE s.name LIKE ?`,
      [`%${query}%`],
      (err, matchedSkills: any[]) => {
        if (err) return reject(err);

        const buildTypeClause = (tableAlias: string, prepend: string): string => {
          if (filterType === 'student' || filterType === 'mentor') {
            return `${prepend} (${tableAlias}.search_type = ? OR ${tableAlias}.search_type = 'both')`;
          }
          return '';
        };

        const typeParams = (filterType === 'student' || filterType === 'mentor') ? [filterType] : [];

        if (matchedSkills.length === 0) {
          let nameQuery = `SELECT id, username, nickname, avatar, bio, search_type FROM users
             WHERE (username LIKE ? OR nickname LIKE ?) AND id != ?`;
          const nameParams: any[] = [`%${query}%`, `%${query}%`, currentUserId];
          const typeClause = buildTypeClause('', ' AND ');
          if (typeClause) {
            nameQuery += typeClause;
            nameParams.push(...typeParams);
          }
          nameQuery += ` LIMIT 20`;

          db.all(nameQuery, nameParams, (err, users: any[]) => {
            if (err) return reject(err);
            resolve(users.map((u: any) => ({
              userId: u.id, username: u.username, nickname: u.nickname,
              avatar: u.avatar, bio: u.bio, searchType: u.search_type || 'both',
              similarity: 0, sharedSkills: [],
              matchReason: 'Совпадение по имени',
            })));
          });
          return;
        }

        const skillIds = matchedSkills.map((s: any) => s.id);
        const placeholders = skillIds.map(() => '?').join(',');

        db.all(
          `SELECT us.user_id, us.skill_id, us.proficiency
           FROM user_skills us WHERE us.skill_id IN (${placeholders}) AND us.user_id != ?`,
          [...skillIds, currentUserId],
          (err, rows: any[]) => {
            if (err) return reject(err);

            const userSkillMap: { [uid: string]: Set<string> } = {};
            for (const row of rows) {
              if (!userSkillMap[row.user_id]) userSkillMap[row.user_id] = new Set();
              userSkillMap[row.user_id].add(row.skill_id);
            }

            const uids = Object.keys(userSkillMap);
            if (uids.length === 0) return resolve([]);

            const userPlaceholders = uids.map(() => '?').join(',');
            let userQuery = `SELECT id, username, nickname, avatar, bio, search_type FROM users WHERE id IN (${userPlaceholders})`;
            const userParams: any[] = [...uids];
            const typeClause = buildTypeClause('', ' AND ');
            if (typeClause) {
              userQuery += typeClause;
              userParams.push(...typeParams);
            }

            db.all(userQuery, userParams, (err, users: any[]) => {
              if (err) return reject(err);
              const userMap: any = {};
              for (const u of users) userMap[u.id] = u;

              const results: MatchResult[] = uids
                .filter(uid => userMap[uid])
                .map(uid => {
                  const u = userMap[uid];
                  const sharedSkillNames = matchedSkills
                    .filter((ms: any) => userSkillMap[uid].has(ms.id))
                    .map((ms: any) => ({ name: ms.name, color: ms.color }));

                  const score = sharedSkillNames.length / Math.max(matchedSkills.length, 1);

                  return {
                    userId: uid,
                    username: u?.username || 'неизвестно',
                    nickname: u?.nickname || 'Неизвестно',
                    avatar: u?.avatar || '',
                    bio: u?.bio || '',
                    searchType: u?.search_type || 'both',
                    similarity: Math.round(score * 100) / 100,
                    sharedSkills: sharedSkillNames,
                    matchReason: score >= 0.5 ? 'Отличное совпадение по вашему запросу!' : 'Частично соответствует запросу.',
                  };
                });

              results.sort((a, b) => b.similarity - a.similarity);
              resolve(results.slice(0, 20));
            });
          }
        );
      }
    );
  });
}
