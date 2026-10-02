/**
 * SkillSetu LOFA Telemetry Engine
 * Tracks Pilot A (Demand Latency), Pilot B (Brokerage Split), and Pilot D (Browse vs Ask)
 */
const LOFA = {
  /**
   * Parse incoming URL query parameters (Pilot D: Direct Ask Tracking)
   */
  getReferralSource() {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get("ref");
    const projectCode = urlParams.get("project") || urlParams.get("project_id");

    if (ref === "direct_ask" || ref === "targeted") {
      return {
        source: "DirectAsk",
        targetProject: projectCode
      };
    }
    return {
      source: "Browse",
      targetProject: null
    };
  },

  /**
   * Calculate remaining hours for NGO response SLA (Pilot A)
   */
  getSLARemainingHours(appliedAtISO, windowHours = 120) { // 5 business days = 120 hrs
    if (!appliedAtISO) return { hoursLeft: windowHours, status: "GREEN" };

    const appliedTime = new Date(appliedAtISO).getTime();
    const currentTime = new Date().getTime();
    const elapsedHours = (currentTime - appliedTime) / (1000 * 60 * 60);
    const hoursLeft = Math.max(0, Math.round(windowHours - elapsedHours));

    let status = "GREEN";
    if (hoursLeft <= 24 && hoursLeft > 0) status = "ORANGE";
    if (hoursLeft === 0) status = "RED";

    return { hoursLeft, status };
  }
};
