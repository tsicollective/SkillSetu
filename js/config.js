/**
 * SkillSetu Configuration & LOFA Experiment Flags
 * Repository: SkillSetu (GitHub Pages)
 */
const CONFIG = {
  // Live Google Apps Script Web API Deployment Endpoint
  API_BASE_URL: "https://script.google.com/macros/s/AKfycbxjyuxdjutwcx9qltbY9bvMIikKcC7UEZ2Prp3nqWSOLj24roe5r2OI4U7DITtUSzT-/exec",
  
  // LOFA Experiment Toggles
  LOFA_EXPERIMENTS: {
    PILOT_A_LATENCY: true,   // Demand Latency Timers (5-day NGO SLA)
    PILOT_B_BROKERAGE: true, // 50/50 A/B Automated vs Human Brokerage
    PILOT_D_ASKING: true     // Direct Ask URL Attribution
  },

  // Local Storage Storage Key
  SESSION_STORAGE_KEY: "skillsetu_user_session"
};
