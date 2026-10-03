/**
 * SkillSetu UI components. Pure functions that return HTML strings.
 * Everything coming from the sheet or the user goes through UI.esc().
 */
const UI = {
  esc(s) {
    return String(s === null || s === undefined ? "" : s).replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  },

  toast(msg) {
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  },

  loading(text = "Loading…") {
    return `<div class="loading">${UI.esc(text)}</div>`;
  },

  banner(html, kind = "") {
    return `<div class="banner ${kind}">${html}</div>`;
  },

  nav(route) {
    const u = AUTH.getUser();
    const link = (r, label) => `<a href="#/${r}" class="${route === r ? "active" : ""}">${label}</a>`;
    return `<div class="topnav-inner">
      <a class="brand" href="#/home"><span class="brand-mark">SS</span>SkillSetu</a>
      <nav>
        ${link("projects", "Projects")}
        ${link("post", "Post a need")}
        ${u && u.role === "Volunteer" ? link("me", "My engagement") : ""}
        ${u
          ? `<button class="btn btn-ghost btn-sm" data-action="logout">Log out</button>`
          : `${link("join", "Join")}<a class="btn btn-primary btn-sm" href="#/login">Log in</a>`}
      </nav>
    </div>`;
  },

  projectCard(p, opts = {}) {
    const skills = (p.suggested_skills || []).map(s => `<span class="chip">${UI.esc(s)}</span>`).join("");
    return `<article class="card project ${opts.highlight ? "highlight" : ""}" id="p-${UI.esc(p.project_id)}">
      <div class="row"><span class="badge">${UI.esc(p.category || "General")}</span><span class="mono muted small">${UI.esc(p.project_id)}</span></div>
      <h3>${UI.esc(p.non_profit)}</h3>
      <p>${UI.esc(p.problem)}</p>
      <div>${skills}</div>
      <div class="row meta"><span>📍 ${UI.esc(p.location)}</span><span>⏱ ${UI.esc(p.duration_weeks)} weeks</span></div>
      <button class="btn btn-accent btn-block" data-action="apply" data-id="${UI.esc(p.project_id)}" ${opts.applied ? "disabled" : ""}>
        ${opts.applied ? "Applied ✓" : "I can help with this →"}
      </button>
    </article>`;
  },

  /** Shown after a successful application (Pilot A: tells the volunteer the SLA window). */
  applyNotice(res) {
    const sla = LOFA.getSLARemainingHours(new Date().toISOString());
    const days = Math.round(sla.hoursLeft / 24);
    const intro = res.intro_sent
      ? "We've emailed you and the NGO an introduction."
      : "Our coordinator will introduce you to the NGO shortly.";
    return UI.banner(`<strong>Application sent (${UI.esc(res.app_id)}).</strong> ${intro} The NGO has about ${days} days to respond.`);
  },

  /** Pill-style checkbox group. */
  checks(name, options) {
    return `<div class="checks">${options.map(o =>
      `<label class="chk"><input type="checkbox" name="${UI.esc(name)}" value="${UI.esc(o)}"> ${UI.esc(o)}</label>`).join("")}</div>`;
  },

  taskItem(t) {
    return `<div class="task ${t.is_completed ? "done" : ""}" data-action="toggle-task" data-id="${UI.esc(t.task_id)}" data-done="${t.is_completed ? "1" : "0"}">
      <input type="checkbox" ${t.is_completed ? "checked" : ""} tabindex="-1" style="pointer-events:none">
      <span>${UI.esc(t.task_description)}</span>
      <span class="due">${UI.esc(t.due_date ? "DUE " + t.due_date : "WEEK " + (t.week_number || ""))}</span>
    </div>`;
  }
};
