/**
 * SkillSetu app: hash router, views and event handling.
 * Pilot D: ?ref=direct_ask&project=TSI999 is read once on load via LOFA.
 * Pilot B: assigned server-side. Pilot A: starts at AppliedAt, ended by NGO ack link.
 */
const S = {
  projects: [],
  loaded: false,
  filter: "All",
  applied: new Set(),
  notice: "",
  ref: LOFA.getReferralSource(),
  login: { step: "email", email: "", role: "Volunteer", msg: "" },
  busy: false
};

const E = UI.esc;
const $ = id => document.getElementById(id);
const currentRoute = () => (location.hash.replace(/^#\/?/, "") || "home").split("?")[0];

/* ---------------- Views ---------------- */
const VIEWS = {
  home() {
    const featured = S.projects.slice(0, 3);
    return `<section class="hero">
        <div class="eyebrow">Skilled giving for India</div>
        <h1>You know something someone needs.</h1>
        <p>Verified nonprofits describe a specific need. Experienced professionals give a few hours. One nonprofit, one volunteer, one need. No payments, no bidding.</p>
        <div class="actions">
          <a class="btn btn-accent" href="#/projects">See open needs →</a>
          <a class="btn btn-outline" href="#/post">Post a need</a>
        </div>
      </section>
      <section class="section">
        <div class="eyebrow" style="margin-bottom:14px">Open right now</div>
        ${featured.length
          ? `<div class="grid">${featured.map(p => UI.projectCard(p, { applied: S.applied.has(p.project_id) })).join("")}</div>`
          : `<div class="empty card">No open needs at the moment. Check back soon.</div>`}
      </section>`;
  },

  projects() {
    const cats = ["All", ...new Set(S.projects.map(p => p.category).filter(Boolean))];
    const list = S.projects.filter(p => S.filter === "All" || p.category === S.filter);
    const target = S.ref.source === "DirectAsk" ? S.ref.targetProject : null;
    const askBanner = target && S.projects.some(p => p.project_id === target)
      ? UI.banner(`👋 You were personally invited to help with <strong>${E(target)}</strong>. It's highlighted below.`, "warm") : "";
    return `<div class="page-head"><div class="eyebrow">Open needs</div><h1>Where your skills can help</h1>
        <p>Needs from nonprofits, scoped into short engagements.</p></div>
      ${S.notice}${askBanner}
      <div class="pills">${cats.map(c => `<button class="pill ${S.filter === c ? "on" : ""}" data-action="filter" data-cat="${E(c)}">${E(c)}</button>`).join("")}</div>
      ${list.length
        ? `<div class="grid">${list.map(p => UI.projectCard(p, { applied: S.applied.has(p.project_id), highlight: p.project_id === target })).join("")}</div>`
        : `<div class="empty card">Nothing here yet.</div>`}`;
  },

  login() {
    const L = S.login;
    let body = "";
    if (L.step === "email") {
      body = `<form data-form="email">
        <label class="fl">I am a</label>
        <div class="seg">
          <label><input type="radio" name="role" value="Volunteer" ${L.role === "Volunteer" ? "checked" : ""}><span>Volunteer</span></label>
          <label><input type="radio" name="role" value="NGO" ${L.role === "NGO" ? "checked" : ""}><span>Nonprofit contact</span></label>
        </div>
        <label class="fl">Email</label>
        <input type="email" name="email" required value="${E(L.email)}" placeholder="you@example.com">
        <button class="btn btn-primary btn-block" style="margin-top:20px" ${S.busy ? "disabled" : ""}>Send me a code →</button>
      </form>`;
    } else if (L.step === "otp") {
      body = `<p class="small muted">We sent a 6-digit code to <strong>${E(L.email)}</strong>. It expires in 15 minutes.</p>
      <form data-form="otp">
        <label class="fl">Access code</label>
        <input class="otp" type="text" name="otp" inputmode="numeric" maxlength="6" required autocomplete="one-time-code">
        <button class="btn btn-primary btn-block" style="margin-top:20px" ${S.busy ? "disabled" : ""}>Verify and continue →</button>
        <button type="button" class="btn btn-ghost btn-block" data-action="login-back">Use a different email</button>
      </form>`;
    } else {
      body = `<p class="small muted">We couldn't find <strong>${E(L.email)}</strong>. Join the volunteer network. It takes a minute.</p>
      <form data-form="register">
        <label class="fl">Full name</label><input type="text" name="name" required>
        <label class="fl">Phone (optional)</label><input type="tel" name="phone">
        <label class="fl">LinkedIn URL</label><input type="text" name="linkedin" required placeholder="https://www.linkedin.com/in/...">
        <label class="fl">Skills you can offer (comma separated)</label><input type="text" name="skills" required placeholder="Data analysis, Donor pitches, Marketing">
        <label class="fl">Causes you care about</label><input type="text" name="interest" placeholder="Education, Healthcare">
        <label class="fl">Hours per week you can give</label><input type="number" name="hours" min="1" max="40" value="3">
        <label class="small" style="display:flex;gap:8px;margin-top:16px"><input type="checkbox" name="agree" required> I agree to be contacted about volunteering opportunities.</label>
        <button class="btn btn-primary btn-block" style="margin-top:20px" ${S.busy ? "disabled" : ""}>Register and send code →</button>
        <button type="button" class="btn btn-ghost btn-block" data-action="login-back">Back</button>
      </form>`;
    }
    return `<div class="page-head narrow"><div class="eyebrow">Log in</div><h1>${L.step === "register" ? "Join SkillSetu" : "Welcome"}</h1></div>
      <div class="narrow card">${L.msg ? UI.banner(L.msg, "err") : ""}${body}</div>`;
  },

  post() {
    const u = AUTH.getUser();
    if (!u || u.role !== "NGO") {
      return `<div class="page-head narrow"><div class="eyebrow">For nonprofits</div><h1>Post a need</h1>
        <p>Log in with your registered nonprofit contact email to describe a need in plain language.</p></div>
        <div class="narrow"><a class="btn btn-primary" href="#/login" data-action="prefer-ngo">Log in as a nonprofit →</a></div>`;
    }
    return `<div class="page-head narrow"><div class="eyebrow">For nonprofits</div><h1>What do you need help with?</h1>
        <p>Describe it the way you'd explain it to a colleague. One need, one volunteer.</p></div>
      <div class="narrow card"><form data-form="project">
        <label class="fl">Organisation name</label><input type="text" name="non_profit" required>
        <label class="fl">Your name</label><input type="text" name="poc_name" required>
        <label class="fl">Type of help</label>
        <select name="category"><option>Donor Pitches</option><option>Data Analysis</option><option>Marketing</option>
          <option>Research &amp; Insights</option><option>Process Automation</option></select>
        <label class="fl">Describe the need</label><textarea name="problem" rows="4" required></textarea>
        <label class="fl">Skills that would help (comma separated, optional)</label><input type="text" name="skills">
        <label class="fl">City / location</label><input type="text" name="location" value="Remote">
        <label class="fl">Duration (weeks)</label><input type="number" name="weeks" min="1" max="12" value="5">
        <button class="btn btn-accent btn-block" style="margin-top:22px" ${S.busy ? "disabled" : ""}>Post this need →</button>
      </form></div>`;
  },

  me() {
    if (!AUTH.isLoggedIn()) return VIEWS.login();
    return `<div class="page-head"><div class="eyebrow">My engagement</div><h1>Your sprint</h1></div><div id="me-body">${UI.loading()}</div>`;
  }
};

/* ---------------- Rendering ---------------- */
async function loadProjects() {
  S.projects = await API.getProjects();
  S.loaded = true;
}

async function show() {
  const r = currentRoute();
  $("nav").innerHTML = UI.nav(r);
  if (!S.loaded && (r === "home" || r === "projects")) {
    $("view").innerHTML = UI.loading("Loading open needs…");
    await loadProjects();
  }
  $("view").innerHTML = (VIEWS[r] || VIEWS.home)();
  if (r === "me" && AUTH.isLoggedIn()) loadMe();
}

async function loadMe() {
  const body = $("me-body");
  const profile = await API.getUserProfile();
  if (!profile || !profile.active_project_id) {
    body.innerHTML = `<div class="card empty">You don't have an active engagement yet. Browse <a href="#/projects" style="color:var(--primary);font-weight:600">open needs</a> and apply.</div>`;
    return;
  }
  const sprint = await API.getSprintStatus(profile.active_project_id);
  body.innerHTML = `<p class="muted small" style="margin-bottom:14px">Project ${E(profile.active_project_id)} · stage: ${E(sprint.current_stage)}</p>` +
    (sprint.tasks.length ? sprint.tasks.map(UI.taskItem).join("") : `<div class="card empty">No tasks yet. Your coordinator will add them.</div>`);
}

function onRoute() {
  show();
  window.scrollTo(0, 0);
}

/* ---------------- Actions (click delegation) ---------------- */
const ACTIONS = {
  filter(el) { S.filter = el.dataset.cat; show(); },

  logout() { AUTH.logout(); },

  "login-back"() { S.login = { ...S.login, step: "email", msg: "" }; show(); },

  "prefer-ngo"() { S.login.role = "NGO"; },

  async apply(el) {
    if (S.busy) return;
    const user = AUTH.getUser();
    if (!user) { UI.toast("Please log in to apply."); location.hash = "#/login"; return; }
    if (user.role !== "Volunteer") { UI.toast("Applying is for volunteer accounts."); return; }
    const id = el.dataset.id;
    // Pilot D: only attribute to DirectAsk if this is the project the person was asked about
    const asked = S.ref.source === "DirectAsk" && (!S.ref.targetProject || S.ref.targetProject === id);
    S.busy = true; el.disabled = true; el.textContent = "Sending…";
    const res = await API.submitApplication(id, asked ? "DirectAsk" : "Browse");
    S.busy = false;
    if (res.status === "success") {
      S.applied.add(id);
      S.notice = UI.applyNotice(res);
      location.hash = "#/projects";
      show();
      window.scrollTo(0, 0);
    } else {
      if (res.code === "DUPLICATE") S.applied.add(id);
      UI.toast(res.message || "Something went wrong.");
      show();
    }
  },

  async "toggle-task"(el) {
    const done = el.dataset.done !== "1";
    const res = await API.updateTaskStatus(el.dataset.id, done);
    if (res.status !== "success") UI.toast(res.message || "Could not update task.");
    loadMe();
  }
};

document.addEventListener("click", e => {
  const el = e.target.closest("[data-action]");
  if (el && ACTIONS[el.dataset.action]) ACTIONS[el.dataset.action](el);
});

/* ---------------- Forms ---------------- */
async function sendCode(email, role) {
  const res = await API.requestOTP(email, role);
  if (res.status === "success") {
    S.login = { step: "otp", email, role, msg: "" };
  } else if (res.code === "NOT_REGISTERED" && role === "Volunteer") {
    S.login = { step: "register", email, role, msg: "" };
  } else {
    S.login = { step: "email", email, role, msg: res.message || "Could not send code." };
  }
}

const FORMS = {
  async email(f) {
    const email = f.email.value.trim().toLowerCase();
    await sendCode(email, f.role.value);
  },

  async otp(f) {
    const res = await AUTH.login(S.login.email, f.otp.value.trim());
    if (res.status === "success") {
      UI.toast("You're in ✓");
      S.login = { step: "email", email: "", role: "Volunteer", msg: "" };
      location.hash = res.role === "NGO" ? "#/post" : "#/projects";
      return;
    }
    S.login.msg = res.message || "Invalid code.";
  },

  async register(f) {
    const reg = await API.registerVolunteer({
      name: f.name.value.trim(), email: S.login.email, phone: f.phone.value.trim(),
      linkedin: f.linkedin.value.trim(), skills: f.skills.value.trim(),
      interest_sector: f.interest.value.trim(), weekly_hours: f.hours.value, agree: f.agree.checked
    });
    if (reg.status !== "success") { S.login.msg = reg.message || "Registration failed."; return; }
    await sendCode(S.login.email, "Volunteer");
  },

  async project(f) {
    const res = await API.submitProject({
      non_profit: f.non_profit.value.trim(), poc_name: f.poc_name.value.trim(),
      category: f.category.value, problem: f.problem.value.trim(),
      suggested_skills: f.skills.value.trim(), location: f.location.value.trim(),
      duration_weeks: f.weeks.value
    });
    if (res.status === "success") {
      UI.toast("Posted as " + res.project_id + " ✓");
      S.loaded = false;
      location.hash = "#/projects";
      return;
    }
    UI.toast(res.message || "Could not post.");
  }
};

document.addEventListener("submit", async e => {
  const f = e.target.closest("[data-form]");
  if (!f) return;
  e.preventDefault();
  if (S.busy) return;
  S.busy = true;
  try { await FORMS[f.dataset.form](f); } finally { S.busy = false; }
  show();
});

/* ---------------- Boot ---------------- */
window.addEventListener("hashchange", onRoute);

(async function init() {
  // Pilot D: a direct-ask link should land on the board, with the project highlighted
  if (S.ref.source === "DirectAsk" && !location.hash) location.hash = "#/projects";
  await show();
  if (S.ref.targetProject) {
    const el = document.getElementById("p-" + S.ref.targetProject);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }
})();
