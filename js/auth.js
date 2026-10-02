/**
 * SkillSetu Authentication & Session Manager
 * Session = { email, role, token, loggedInAt }. The token is issued by the
 * backend after a successful OTP check and is required for protected calls.
 */
const AUTH = {
  SESSION_DAYS: 7,

  getUser() {
    try {
      const raw = localStorage.getItem(CONFIG.SESSION_STORAGE_KEY);
      if (!raw) return null;
      const user = JSON.parse(raw);
      const ageDays = (Date.now() - new Date(user.loggedInAt).getTime()) / 86400000;
      if (!user.token || ageDays > this.SESSION_DAYS) {
        localStorage.removeItem(CONFIG.SESSION_STORAGE_KEY);
        return null;
      }
      return user;
    } catch (e) {
      return null;
    }
  },

  setUser(email, token, role = "Volunteer") {
    const user = { email, role, token, loggedInAt: new Date().toISOString() };
    localStorage.setItem(CONFIG.SESSION_STORAGE_KEY, JSON.stringify(user));
    return user;
  },

  isLoggedIn() {
    return Boolean(this.getUser());
  },

  /** Full login helper: verify OTP and store the session. */
  async login(email, otpCode) {
    const res = await API.verifyOTP(email, otpCode);
    if (res.status === "success" && res.token) {
      this.setUser(res.email, res.token, res.role);
    }
    return res;
  },

  logout() {
    localStorage.removeItem(CONFIG.SESSION_STORAGE_KEY);
    window.location.reload();
  }
};
