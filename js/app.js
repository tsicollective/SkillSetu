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

const OPTIONS = {
  skills: ["Data Analysis", "Donor Pitches", "Marketing & Comms", "Research & Insights", "Process Automation", "Content writing", "Creative design"],
  sectors: ["Education", "Livelihood", "Environment", "Gender", "Healthcare", "No preference"],
  needs: ["Communication collateral", "Fundraising pitch collateral", "Research and insights", "Data analysis", "Process automation"],
  education: ["Bachelors", "Masters", "Doctoral", "CA / CFA", "Other"],
  orgType: ["Section-8 NPO", "Trust", "Society", "Other"],
  budget: ["Under ₹10 lakh", "₹10–50 lakh", "₹50 lakh – ₹1 crore", "₹1–5 crore", "Above ₹5 crore"]
};
const opts = list => list.map(o => `<option>${E(o)}</option>`).join("");

/* ---------------- Views ---------------- */
const VIEWS = {
  home() {
    const featured = S.projects.slice(0, 3);
    return `<section class="hero">
        <div class="eyebrow">Skilled giving for India</div>
        <h1>You know something someone needs.</h1>
        <p>Verified nonprofits describe a specific need. Experienced professionals give a few hours. One nonprofit, one volunteer, one need. No payments, no bidding.</p>
        <div class="actions">
          <a class="btn btn-accent" href="#/join/volunteer">Join as a volunteer →</a>
          <a class="btn btn-outline" href="#/join/ngo">Register your nonprofit</a>
          <a class="btn btn-ghost" href="#/projects">See open needs</a>
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
    let body;
    if (L.step === "otp") {
      body = `<p class="small muted">We sent a 6-digit code to <strong>${E(L.email)}</strong>. It expires in 15 minutes.</p>
      <form data-form="otp">
        <label class="fl">Access code</label>
        <input class="otp" type="text" name="otp" inputmode="numeric" maxlength="6" required autocomplete="one-time-code">
        <button class="btn btn-primary btn-block" style="margin-top:20px" ${S.busy ? "disabled" : ""}>Verify and continue →</button>
        <button type="button" class="btn btn-ghost btn-block" data-action="login-back">Use a different email</button>
      </form>`;
    } else {
      body = `<form data-form="email">
        <label class="fl">I am a</label>
        <div class="seg">
          <label><input type="radio" name="role" value="Volunteer" ${L.role === "Volunteer" ? "checked" : ""}><span>Volunteer</span></label>
          <label><input type="radio" name="role" value="NGO" ${L.role === "NGO" ? "checked" : ""}><span>Nonprofit contact</span></label>
        </div>
        <label class="fl">Email</label>
        <input type="email" name="email" required value="${E(L.email)}" placeholder="you@example.com">
        <button class="btn btn-primary btn-block" style="margin-top:20px" ${S.busy ? "disabled" : ""}>Send me a code →</button>
      </form>
      <p class="small muted" style="margin-top:18px">New here? <a href="#/join" style="color:var(--primary);font-weight:600">Join SkillSetu</a></p>`;
    }
    return `<div class="page-head narrow"><div class="eyebrow">Log in</div><h1>Welcome back</h1></div>
      <div class="narrow card">${L.msg ? UI.banner(L.msg, "err") : ""}${body}</div>`;
  },

  join() {
    return `<div class="page-head narrow"><div class="eyebrow">Join SkillSetu</div><h1>How would you like to take part?</h1>
        <p>You only join once. After that, you log in with a code sent to your email.</p></div>
      <div class="grid" style="max-width:720px;margin:0 auto 40px">
        <a class="card" href="#/join/volunteer"><div class="eyebrow">Volunteer</div><h3 style="margin:8px 0">I have skills to give</h3>
          <p class="small muted">Working professionals who can give a few hours to a nonprofit.</p></a>
        <a class="card" href="#/join/ngo"><div class="eyebrow">Nonprofit</div><h3 style="margin:8px 0">We need skilled help</h3>
          <p class="small muted">Register your organisation, then post the needs you want help with.</p></a>
      </div>`;
  },

  "join/volunteer"() {
    return `<div class="page-head narrow"><div class="eyebrow">Join as a volunteer</div><h1>Tell us about yourself</h1>
        <p>We'll email a code to verify your address. Already a member? <a href="#/login" style="color:var(--primary);font-weight:600">Log in</a>.</p></div>
      <div class="narrow card"><form data-form="join-volunteer">
        <label class="fl">Full name</label><input type="text" name="name" required>
        <label class="fl">Email</label><input type="email" name="email" required>
        <label class="fl">Phone (optional)</label><input type="tel" name="phone">
        <label class="fl">LinkedIn profile URL</label><input type="text" name="linkedin" required placeholder="https://www.linkedin.com/in/...">
        <label class="fl">Highest education</label><select name="education">${opts(OPTIONS.education)}</select>
        <label class="fl">Year of graduation</label><input type="number" name="graduated" min="1970" max="2035">
        <label class="fl">Skills you can offer</label>${UI.checks("skills", OPTIONS.skills)}
        <input type="text" name="skills_other" placeholder="Anything else? (optional)" style="margin-top:10px">
        <label class="fl">Causes you care about</label>${UI.checks("interest", OPTIONS.sectors)}
        <label class="fl">Hours per week you can give</label><input type="number" name="hours" min="1" max="40" value="3">
        <label class="small" style="display:flex;gap:8px;margin-top:18px"><input type="checkbox" name="agree" required> I agree to be contacted about volunteering opportunities.</label>
        <button class="btn btn-accent btn-block" style="margin-top:22px" ${S.busy ? "disabled" : ""}>Join and send my code →</button>
      </form></div>`;
  },

  "join/ngo"() {
    return `<div class="page-head narrow"><div class="eyebrow">Register your nonprofit</div><h1>Tell us about your organisation</h1>
        <p>You only do this once. Then you can post needs. Already registered? <a href="#/login" style="color:var(--primary);font-weight:600">Log in</a>.</p></div>
      <div class="narrow card"><form data-form="join-ngo">
        <label class="fl">Organisation name</label><input type="text" name="non_profit" required>
        <label class="fl">Website or social media link</label><input type="text" name="website">
        <label class="fl">Type of organisation</label><select name="registration_type">${opts(OPTIONS.orgType)}</select>
        <label class="fl">Annual budget</label><select name="annual_budget">${opts(OPTIONS.budget)}</select>
        <label class="fl">Sectors you work in</label>${UI.checks("sectors", OPTIONS.sectors)}
        <label class="fl">Kinds of help you usually need</label>${UI.checks("needs", OPTIONS.needs)}
        <hr style="border:none;border-top:1px solid var(--line);margin:24px 0 4px">
        <label class="fl">Your name (main contact)</label><input type="text" name="poc_name" required>
        <label class="fl">Your role</label><input type="text" name="designation" required placeholder="Founder, Programme Lead…">
        <label class="fl">Your email</label><input type="email" name="poc_email" required>
        <label class="fl">Phone</label><input type="tel" name="poc_phone">
        <label class="fl">LinkedIn (optional)</label><input type="text" name="poc_linkedin">
        <button class="btn btn-accent btn-block" style="margin-top:22px" ${S.busy ? "disabled" : ""}>Register and send my code →</button>
      </form></div>`;
  },

  post() {
    const u = AUTH.getUser();
    if (!u || u.role !== "NGO") {
      return `<div class="page-head narrow"><div class="eyebrow">For nonprofits</div><h1>Post a need</h1>
        <p>Only registered nonprofits can post. Log in with your contact email, or register your organisation first.</p></div>
        <div class="narrow" style="display:flex;gap:12px;flex-wrap:wrap">
          <a class="btn btn-primary" href="#/login" data-action="prefer-ngo">Log in as a nonprofit</a>
          <a class="btn btn-outline" href="#/join/ngo">Register your nonprofit</a></div>`;
    }
    return `<div class="page-head narrow"><div class="eyebrow">For nonprofits</div><h1>What do you need help with?</h1>
        <p>Describe it the way you'd explain it to a colleague. One need, one volunteer.</p></div>
      <div class="narrow" id="post-body">${UI.loading()}</div>`;
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
  if (r === "post") loadPost();
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

async function loadPost() {
  const u = AUTH.getUser();
  const body = $("post-body");
  if (!u || u.role !== "NGO" || !body) return;
  const p = (await API.getUserProfile()) || {};
  if (p.approved === false) {
    body.innerHTML = UI.banner("Your organisation is registered and awaiting approval. You'll be able to post soon.", "warm");
    return;
  }
  const who = p.org_name
    ? `<p class="small muted">Posting as <strong>${E(p.org_name)}</strong> (${E(p.poc_name)})</p>`
    : `<label class="fl">Organisation name</label><input type="text" name="non_profit" required>
       <label class="fl">Your name</label><input type="text" name="poc_name" required>`;
  body.innerHTML = `<div class="card"><form data-form="project">${who}
    <label class="fl">Type of help</label>
    <select name="category"><option>Donor Pitches</option><option>Data Analysis</option><option>Marketing</option><option>Research &amp; Insights</option><option>Process Automation</option></select>
    <label class="fl">Describe the need</label><textarea name="problem" rows="4" required></textarea>
    <label class="fl">Skills that would help (comma separated, optional)</label><input type="text" name="skills">
    <label class="fl">City / location</label><input type="text" name="location" value="Remote">
    <label class="fl">Duration (weeks)</label><input type="number" name="weeks" min="1" max="12" value="5">
    <button class="btn btn-accent btn-block" style="margin-top:22px">Post this need →</button>
  </form></div>`;
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
    return true;
  }
  const joinLink = role === "NGO"
    ? `<a href="#/join/ngo">Register your nonprofit</a>` : `<a href="#/join/volunteer">Join as a volunteer</a>`;
  const msg = res.code === "NOT_REGISTERED"
    ? `We couldn't find that email. ${joinLink} first.` : E(res.message || "Could not send code.");
  S.login = { step: "email", email, role, msg };
  return false;
}

const checked = (f, name) => Array.from(f.querySelectorAll(`input[name="${name}"]:checked`)).map(x => x.value);

const FORMS = {
  async email(f) {
    await sendCode(f.email.value.trim().toLowerCase(), f.role.value);
  },

  async otp(f) {
    const res = await AUTH.login(S.login.email, f.otp.value.trim());
    if (res.status === "success") {
      UI.toast("You're in ✓");
      S.login = { step: "email", email: "", role: "Volunteer", msg: "" };
      location.hash = res.role === "NGO" ? "#/post" : "#/projects";
      return;
    }
    S.login.msg = E(res.message || "Invalid code.");
  },

  async "join-volunteer"(f) {
    const email = f.email.value.trim().toLowerCase();
    const skills = [...checked(f, "skills"), ...f.skills_other.value.split(",").map(x => x.trim()).filter(Boolean)];
    if (!skills.length) { UI.toast("Please pick at least one skill."); return; }
    const reg = await API.registerVolunteer({
      name: f.name.value.trim(), email, phone: f.phone.value.trim(), linkedin: f.linkedin.value.trim(),
      education: f.education.value, graduated: f.graduated.value, skills,
      interest_sector: checked(f, "interest"), weekly_hours: f.hours.value, agree: f.agree.checked
    });
    if (reg.status !== "success") { UI.toast(reg.message || "Could not register."); return; }
    await sendCode(email, "Volunteer");
    UI.toast(reg.already_registered ? "You're already a member. We sent a login code." : "Welcome! We sent a code to verify your email.");
    location.hash = "#/login";
  },

  async "join-ngo"(f) {
    const email = f.poc_email.value.trim().toLowerCase();
    const reg = await API.registerNgo({
      non_profit: f.non_profit.value.trim(), website: f.website.value.trim(),
      registration_type: f.registration_type.value, annual_budget: f.annual_budget.value,
      sectors: checked(f, "sectors"), needs: checked(f, "needs"),
      poc_name: f.poc_name.value.trim(), designation: f.designation.value.trim(),
      poc_email: email, poc_phone: f.poc_phone.value.trim(), poc_linkedin: f.poc_linkedin.value.trim()
    });
    if (reg.status !== "success") { UI.toast(reg.message || "Could not register."); return; }
    S.login.role = "NGO";
    await sendCode(email, "NGO");
    UI.toast(reg.already_registered ? "This contact is already registered. We sent a login code." : "Registered! We sent a code to verify your email.");
    location.hash = "#/login";
  },

  async project(f) {
    const val = n => (f[n] ? f[n].value.trim() : "");
    const res = await API.submitProject({
      non_profit: val("non_profit"), poc_name: val("poc_name"),
      category: f.category.value, problem: val("problem"),
      suggested_skills: val("skills"), location: val("location"),
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
