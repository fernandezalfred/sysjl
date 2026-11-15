// Lowercase without accents, so "jose" finds "José".
function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// The users whose name or email contains every word of `query` (any order, ignoring
// case and accents). An empty query keeps everyone.
export function filterUsers<T extends { name: string; email: string }>(users: T[], query: string): T[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return users;
  return users.filter((user) => {
    const haystack = normalize(`${user.name} ${user.email}`);
    return words.every((word) => haystack.includes(word));
  });
}
