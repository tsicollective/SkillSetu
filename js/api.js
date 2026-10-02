/**
 * SkillSetu Web API Client
 * Wraps GET and POST calls to Google Apps Script
 */
const API = {
  /**
   * Fetch active projects from Google Sheet
   */
  async getProjects() {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}?action=get_projects`);
      const result = await response.json();
      return result.status === "success" ? result.data : [];
    } catch (err) {
      console.error("API Error [getProjects]:", err);
      return [];
    }
  },

  /**
   * Fetch sprint cadence checklist for active projects
   */
  async getSprintStatus(projectId, email) {
    try {
      const url = `\({CONFIG.API_BASE_URL}?action=get_sprint_status&project_id=\){encodeURIComponent(projectId)}&email=${encodeURIComponent(email)}`;
      const response = await fetch(url);
      const result = await response.json();
      return result.status === "success" ? result.data : { tasks: [] };
    } catch (err) {
      console.error("API Error [getSprintStatus]:", err);
      return { tasks: [] };
    }
  },

  /**
   * Request 6-digit OTP code sent to work email
   */
  async requestOTP(email, role = "Volunteer") {
    return this.post({ action: "request_otp", email, role });
  },

  /**
   * Verify entered 6-digit OTP code
   */
  async verifyOTP(email, otpCode) {
    return this.post({ action: "verify_otp", email, otp_code: otpCode });
  },

  /**
   * Submit Volunteer Application (Triggers LOFA Pilots A, B, & D)
   */
  async submitApplication(payload) {
    return this.post({
      action: "submit_application",
      project_id: payload.projectId,
      volunteer_email: payload.volunteerEmail,
      ref_source: payload.refSource || "Browse"
    });
  },

  /**
   * Post a New NGO Project Need
   */
  async submitProject(projectData) {
    return this.post({
      action: "submit_project",
      ...projectData
    });
  },

  /**
   * Update task completion status in sprint cadence
   */
  async updateTaskStatus(taskId, isCompleted) {
    return this.post({
      action: "update_task",
      task_id: taskId,
      is_completed: isCompleted
    });
  },

  /**
   * Base POST wrapper using text/plain to avoid CORS preflight options blocks
   */
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
      return { status: "error", message: err.toString() };
    }
  }
};
