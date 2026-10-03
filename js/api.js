/**
 * SkillSetu Web API Client
 * Wraps GET and POST calls to the Google Apps Script web app.
 * Protected calls automatically attach the session email + token from AUTH.
 */
const API = {
  /** Public: open/potential projects (no NGO emails). Returns an array. */
  async getProjects() {
    const res = await this.get({ action: "get_projects" });
    return res.status === "success" && Array.isArray(res.data) ? res.data : [];
  },

  /** Protected: sprint checklist for the logged-in volunteer. */
  async getSprintStatus(projectId) {
    const user = AUTH.getUser();
    if (!user) return { tasks: [], current_stage: "1. Match" };
    const res = await this.get({
      action: "get_sprint_status",
      project_id: projectId,
      email: user.email,
      token: user.token
    });
    return res.status === "success" ? res.data : { tasks: [], current_stage: "1. Match" };
  },

  /** Protected: volunteer profile row. */
  async getUserProfile() {
    const user = AUTH.getUser();
    if (!user) return null;
    const res = await this.get({ action: "get_user_profile", email: user.email, token: user.token });
    return res.status === "success" ? res.data : null;
  },

  /** Register a new volunteer row (no login needed). */
  async registerVolunteer(data) {
    return this.post({ action: "register_volunteer", ...data });
  },

  /** Register a new nonprofit (once). Needed before it can log in and post needs. */
  async registerNgo(data) {
    return this.post({ action: "register_ngo", ...data });
  },

  /** Request a 6-digit OTP. May return { code: "NOT_REGISTERED" }. */
  async requestOTP(email, role = "Volunteer") {
    return this.post({ action: "request_otp", email, role });
  },

  /** Verify OTP. On success the response includes { token, role }. */
  async verifyOTP(email, otpCode) {
    return this.post({ action: "verify_otp", email, otp_code: otpCode });
  },

  /** Apply to a project (triggers LOFA Pilots A, B and D server-side). */
  async submitApplication(projectId, refSource = "Browse") {
    const user = AUTH.getUser();
    if (!user) return { status: "error", message: "Please log in first." };
    return this.post({
      action: "submit_application",
      project_id: projectId,
      volunteer_email: user.email,
      token: user.token,
      ref_source: refSource
    });
  },

  /** NGO posts a new need. Requires NGO login (poc_email = session email). */
  async submitProject(projectData) {
    const user = AUTH.getUser();
    if (!user) return { status: "error", message: "Please log in first." };
    return this.post({
      action: "submit_project",
      ...projectData,
      poc_email: user.email,
      token: user.token
    });
  },

  async updateTaskStatus(taskId, isCompleted) {
    const user = AUTH.getUser();
    if (!user) return { status: "error", message: "Please log in first." };
    return this.post({
      action: "update_task",
      task_id: taskId,
      is_completed: isCompleted,
      email: user.email,
      token: user.token
    });
  },

  /** GET wrapper. Always resolves to an object with a status field. */
  async get(params) {
    try {
      const qs = new URLSearchParams(params).toString();
      const response = await fetch(`${CONFIG.API_BASE_URL}?${qs}`);
      return await response.json();
    } catch (err) {
      console.error("API GET Error:", err);
      return { status: "error", message: String(err) };
    }
  },

  /** POST wrapper. text/plain avoids a CORS preflight that Apps Script can't answer. */
  async post(payload) {
    try {
      const response = await fetch(CONFIG.API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });
      return await response.json();
    } catch (err) {
      console.error("API POST Error:", err);
      return { status: "error", message: String(err) };
    }
  }
};
