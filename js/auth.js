/**
 * SkillSetu Authentication & Session Manager
 */
const AUTH = {
  getUser() {
    const session = localStorage.getItem(CONFIG.SESSION_STORAGE_KEY);
    return session ? JSON.parse(session) : null;
  },

  setUser(email, verified = true) {
    const user = { email, verified, loggedInAt: new Date().toISOString() };
    localStorage.setItem(CONFIG.SESSION_STORAGE_KEY, JSON.stringify(user));
    return user;
  },

  logout() {
    localStorage.removeItem(CONFIG.SESSION_STORAGE_KEY);
    window.location.reload();
  },

  isLoggedIn() {
    const user = this.getUser();
    return Boolean(user && user.verified);
  }
};
