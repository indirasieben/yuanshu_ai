export const buildUserScopedStorageKey = (baseKey, userId) => {
  if (!userId) return `${baseKey}:guest`;
  return `${baseKey}:user:${String(userId)}`;
};
