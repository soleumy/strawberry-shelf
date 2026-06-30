const PREFIX = 'strawberry-shelf';
const LOCAL_USER_ID = 'local-reader';

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(`${PREFIX}:${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(`${PREFIX}:${key}`, JSON.stringify(value));
}

export function getLocalUserId(userId) {
  return userId || LOCAL_USER_ID;
}

export function getLocalReadingStatus(userId, novelId) {
  const items = read('reading-list', []);
  return items.find((item) => item.user_id === getLocalUserId(userId) && item.novel_id === String(novelId))?.status || '';
}

export function setLocalReadingStatus(userId, novelId, status) {
  const id = getLocalUserId(userId);
  const items = read('reading-list', []).filter((item) => !(item.user_id === id && item.novel_id === String(novelId)));

  if (status) {
    items.push({
      user_id: id,
      novel_id: String(novelId),
      status,
      updated_at: new Date().toISOString(),
    });
  }

  write('reading-list', items);
  window.dispatchEvent(new CustomEvent('strawberry:library-updated'));
}

export function getLocalReadingList(userId) {
  const id = getLocalUserId(userId);
  return read('reading-list', []).filter((item) => item.user_id === id);
}

export function getLocalRatings(novelId) {
  return read('ratings', []).filter((item) => item.novel_id === String(novelId));
}

export function setLocalRating(userId, novelId, score) {
  const id = getLocalUserId(userId);
  const ratings = read('ratings', []).filter((item) => !(item.user_id === id && item.novel_id === String(novelId)));
  ratings.push({
    id: `${id}-${novelId}`,
    user_id: id,
    novel_id: String(novelId),
    score,
    updated_at: new Date().toISOString(),
  });
  write('ratings', ratings);
}

export function getLocalComments(novelId, chapterId) {
  return read('comments', [])
    .filter((item) => item.novel_id === String(novelId) && String(item.chapter_id || '') === String(chapterId || ''))
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

export function addLocalComment({ userId, novelId, chapterId, content, parentId = null }) {
  const row = {
    id: `local-${Date.now()}`,
    user_id: getLocalUserId(userId),
    novel_id: String(novelId),
    chapter_id: String(chapterId || ''),
    parent_id: parentId,
    content,
    is_edited: false,
    created_at: new Date().toISOString(),
    local: true,
  };

  write('comments', [...read('comments', []), row]);
  return row;
}

export function updateLocalComment(id, content) {
  const rows = read('comments', []).map((item) => (
    item.id === id ? { ...item, content, is_edited: true, updated_at: new Date().toISOString() } : item
  ));
  write('comments', rows);
}

export function deleteLocalComment(id) {
  write('comments', read('comments', []).filter((item) => item.id !== id && item.parent_id !== id));
}
