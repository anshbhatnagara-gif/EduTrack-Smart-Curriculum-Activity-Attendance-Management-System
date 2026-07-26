const TOKEN_KEY = 'edutrack_access_token';

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (err) {
    console.error('Error reading token from localStorage:', err);
    return null;
  }
};

export const setToken = (token) => {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
  } catch (err) {
    console.error('Error saving token to localStorage:', err);
  }
};

export const removeToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (err) {
    console.error('Error removing token from localStorage:', err);
  }
};

export const hasToken = () => {
  return !!getToken();
};
