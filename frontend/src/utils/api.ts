export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('pdks_token');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
