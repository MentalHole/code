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

function buildTypeClause(userSearchType: string, filterType?: string): { clause: string; params: string[] } {
  if (filterType === 'student' || filterType === 'mentor') {
    return { clause: `AND (search_type = ? OR search_type = 'both')`, params: [filterType] };
  } else if (userSearchType !== 'both') {
    const opposite = userSearchType === 'student' ? 'mentor' : 'student';
    return { clause: `AND (search_type = ? OR search_type = 'both')`, params: [opposite] };
  }
  return { clause: '', params: [] };
}

function buildMatchResult(user: any, similarity: number, sharedSkills: { name: string; color: string }[]): MatchResult {
  let matchReason = '';
  if (similarity > 0) {
    if (similarity >= 0.8) matchReason = 'Отличное совпадение! Очень похожий набор навыков.';
    else if (similarity >= 0.6) matchReason = 'Прекрасное совпадение! Сильное пересечение навыков.';
    else if (similarity >= 0.4) matchReason = 'Хорошее совпадение! Есть общие навыки.';
    else matchReason = 'Некоторые общие интересы.';
  } else {
    matchReason = 'Нет общих навыков, но возможно интересный собеседник!';
  }
  return {
    userId: user.id,
    username: user.username,
    nickname: user.nickname,
    avatar: user.avatar || '',
    bio: user.bio || '',
    searchType: user.search_type || 'both',
    similarity,
    sharedSkills: sharedSkills.slice(0, 5),
    matchReason,
  };
}

function getAllUsersExcept(userId: string, excludeIds: string[], limit: number, typeClause: string, typeParams: string[]): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const exPlaceholders = [userId, ...excludeIds].map(() => '?').join(',');
    db.all(
      `SELECT id, username, nickname, avatar, bio, search_type FROM users
       WHERE id NOT IN (${exPlaceholders}) ${typeClause}
       ORDER BY RANDOM() LIMIT ?`,
      [...[userId, ...excludeIds], ...typeParams, limit],
      (err, rows: any[]) => {
        if (err) return reject(err);
        resolve(rows || []);
      }
    );
  });
}

export function findMatchesForUser(userId: string, limit: number = 20, filterType?: string): Promise<MatchResult[]> {
  return new Promise((resolve, reject) => {
    db.get(`SELECT search_type FROM users WHERE id = ?`, [userId], (err, currentUser: any) => {
      if (err) return reject(err);
      const userSearchType = currentUser?.search_type || 'both';
      const typeInfo = buildTypeClause(userSearchType, filterType);

      db.all(
        `SELECT user_id, skill_id, proficiency FROM user_skills WHERE user_id = ?`,
        [userId],
        (err, userSkillRows: any[]) => {
          if (err) return reject(err);

          if (!userSkillRows || userSkillRows.length === 0) {
            return getFallbackMatches(userId, limit, userSearchType, filterType).then(resolve).catch(reject);
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
                return getFallbackMatches(userId, limit, userSearchType, filterType).then(resolve).catch(reject);
              }

              const uidPlaceholders = uids.map(() => '?').join(',');
              db.all(
                `SELECT id, username, nickname, avatar, bio, search_type FROM users
                 WHERE id IN (${uidPlaceholders}) ${typeInfo.clause}`,
                [...uids, ...typeInfo.params],
                (err, users: any[]) => {
                  if (err) return reject(err);

                  const validUserIds = new Set(users.map((u: any) => u.id));
                  const userMap: any = {};
                  for (const u of users) userMap[u.id] = u;

                  const scored = uids
                    .filter(uid => validUserIds.has(uid))
                    .map(uid => ({
                      userId: uid,
                      similarity: cosineSimilarity(userVector, buildSkillVector(userScores[uid])),
                    }));

                  scored.sort((a, b) => b.similarity - a.similarity);

                  const matching = scored.filter(s => s.similarity > 0);
                  const nonMatching = scored.filter(s => s.similarity === 0);

                  const matchingUsers = matching.slice(0, limit);

                  const skillIds = [...new Set(allRows.map((r: any) => r.skill_id))];
                  const skillPlaceholders = skillIds.map(() => '?').join(',');
                  db.all(
                    `SELECT id, name, color FROM skills WHERE id IN (${skillPlaceholders})`,
                    skillIds,
                    (err, skillMapRows: any[]) => {
                      if (err) return reject(err);
                      const skillMap: any = {};
                      for (const s of skillMapRows) skillMap[s.id] = s;

                      const results: MatchResult[] = matchingUsers.map(c => {
                        const u = userMap[c.userId];
                        const shared = allRows
                          .filter((r: any) => r.user_id === c.userId && userSkillIds.includes(r.skill_id) && skillMap[r.skill_id])
                          .map((r: any) => ({ name: skillMap[r.skill_id].name, color: skillMap[r.skill_id].color }));
                        return buildMatchResult(u, Math.round(c.similarity * 100) / 100, shared);
                      });

                      if (results.length >= limit) return resolve(results);

                      const matchedIds = matchingUsers.map(m => m.userId);
                      const nonMatchedIds = nonMatching.map(n => n.userId);
                      const fillNeeded = limit - results.length;

                      if (nonMatchedIds.length > 0) {
                        const shuffled = [...nonMatchedIds].sort(() => Math.random() - 0.5);
                        const fillIds = shuffled.slice(0, fillNeeded);
                        for (const uid of fillIds) {
                          const u = userMap[uid];
                          if (u) {
                            results.push(buildMatchResult(u, 0, []));
                          }
                        }
                      }

                      if (results.length < limit) {
                        const excludeIds = [...matchedIds, ...nonMatchedIds];
                        getAllUsersExcept(userId, excludeIds, limit - results.length, typeInfo.clause, typeInfo.params)
                          .then((extraUsers) => {
                            for (const u of extraUsers) {
                              if (results.length < limit) {
                                results.push(buildMatchResult(u, 0, []));
                              }
                            }
                            resolve(results);
                          })
                          .catch(reject);
                      } else {
                        resolve(results);
                      }
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

function getFallbackMatches(userId: string, limit: number, userSearchType: string, filterType?: string): Promise<MatchResult[]> {
  return new Promise((resolve, reject) => {
    const typeInfo = buildTypeClause(userSearchType, filterType);
    db.all(
      `SELECT id, username, nickname, avatar, bio, search_type FROM users
       WHERE id != ? ${typeInfo.clause}
       ORDER BY RANDOM() LIMIT ?`,
      [userId, ...typeInfo.params, limit],
      (err, users: any[]) => {
        if (err) return reject(err);
        const results: MatchResult[] = users.map((u: any) =>
          buildMatchResult(u, 0, [])
        );
        resolve(results);
      }
    );
  });
}

export function searchUsersBySkills(query: string, currentUserId: string, filterType?: string): Promise<MatchResult[]> {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT s.id, s.name, s.color FROM skills s WHERE s.name LIKE ?`,
      [`%${query}%`],
      (err, matchedSkills: any[]) => {
        if (err) return reject(err);

        const typeParams = (filterType === 'student' || filterType === 'mentor') ? [filterType] : [];

        let typeClause = '';
        if (filterType === 'student' || filterType === 'mentor') {
          typeClause = `AND (search_type = ? OR search_type = 'both')`;
        }

        if (matchedSkills.length === 0) {
          let nameQuery = `SELECT id, username, nickname, avatar, bio, search_type FROM users
             WHERE (username LIKE ? OR nickname LIKE ?) AND id != ?`;
          const nameParams: any[] = [`%${query}%`, `%${query}%`, currentUserId, ...typeParams];
          if (typeClause) nameQuery += typeClause;
          nameQuery += ` ORDER BY RANDOM() LIMIT 20`;

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

            const matchedUids = Object.keys(userSkillMap);

            const userPlaceholders = matchedUids.map(() => '?').join(',');
            let userQuery = `SELECT id, username, nickname, avatar, bio, search_type FROM users WHERE id IN (${userPlaceholders})`;
            const userParams: any[] = [...matchedUids, ...typeParams];
            if (typeClause) userQuery += typeClause;

            db.all(userQuery, userParams, (err, users: any[]) => {
              if (err) return reject(err);

              const matchedUsers = (users || []).map((u: any) => {
                const sharedSkillNames = matchedSkills
                  .filter((ms: any) => userSkillMap[u.id]?.has(ms.id))
                  .map((ms: any) => ({ name: ms.name, color: ms.color }));
                const score = sharedSkillNames.length / Math.max(matchedSkills.length, 1);
                return buildMatchResult(u, Math.round(score * 100) / 100, sharedSkillNames);
              });

              matchedUsers.sort((a: MatchResult, b: MatchResult) => b.similarity - a.similarity);
              resolve(matchedUsers.slice(0, 20));
            });
          }
        );
      }
    );
  });
}
