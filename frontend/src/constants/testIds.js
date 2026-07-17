export const HOME = {
  emergentLink: "home-emergent-link",
};

export const NAV = {
  brand: "nav-brand",
  linkAlumni: "nav-link-alumni",
  linkAluPal: "nav-link-alupal",
  linkLeaderboard: "nav-link-leaderboard",
  linkCertificate: "nav-link-certificate",
  login: "nav-login",
  signup: "nav-signup",
  logout: "nav-logout",
  userChip: "nav-user-chip",
};

export const LANDING = {
  ctaSignup: "landing-cta-signup",
  ctaBrowse: "landing-cta-browse",
  ctaAluPal: "landing-cta-alupal",
};

export const AUTH = {
  emailInput: "auth-email",
  passwordInput: "auth-password",
  nameInput: "auth-name",
  roleAlumni: "auth-role-alumni",
  roleJunior: "auth-role-junior",
  schoolInput: "auth-school",
  gradeSelect: "auth-grade",
  collegeInput: "auth-college",
  streamInput: "auth-stream",
  bioInput: "auth-bio",
  whStart: "auth-wh-start",
  whEnd: "auth-wh-end",
  idCardInput: "auth-idcard",
  submitBtn: "auth-submit",
  switchModeLink: "auth-switch-mode",
  errorMsg: "auth-error",
  // Argus (Lighthouse Learning EuroSchool) linking
  tabEmail: "auth-tab-email",
  tabArgus: "auth-tab-argus",
  argusId: "auth-argus-id",
  argusPassword: "auth-argus-password",
  argusRole: "auth-argus-role",
  argusSubmit: "auth-argus-submit",
  linkArgusToggle: "auth-link-argus-toggle",
};

export const ALUMNI = {
  list: "alumni-list",
  card: (id) => `alumni-card-${id}`,
  cardName: (id) => `alumni-card-name-${id}`,
  filterCollege: "alumni-filter-college",
  filterStream: "alumni-filter-stream",
  filterSearch: "alumni-filter-search",
  applyBtn: "alumni-filter-apply",
  chatBtn: (id) => `alumni-chat-${id}`,
  helpedBtn: (id) => `alumni-helped-${id}`,
};

export const ALUPAL = {
  targetCollege: "alupal-target-college",
  stream: "alupal-stream",
  grade: "alupal-grade",
  note: "alupal-note",
  submitBtn: "alupal-submit",
  reasoning: "alupal-reasoning",
  matchList: "alupal-match-list",
};

export const LEADERBOARD = {
  root: "leaderboard-root",
  row: (id) => `leaderboard-row-${id}`,
  scopeAll: "leaderboard-scope-all",
  scopeWeek: "leaderboard-scope-week",
  schoolFilter: "leaderboard-school-filter",
  selfCallout: "leaderboard-self-callout",
};

export const CHAT = {
  root: "chat-root",
  convList: "chat-conv-list",
  conv: (id) => `chat-conv-${id}`,
  thread: "chat-thread",
  input: "chat-input",
  sendBtn: "chat-send",
  message: (id) => `chat-message-${id}`,
  trustToggle: "chat-trust-toggle",
  closedBanner: "chat-closed-banner",
  emptyState: "chat-empty-state",
  header: "chat-header",
};

export const CERT = {
  root: "certificate-root",
  downloadBtn: "certificate-download",
  points: "certificate-points",
  rank: "certificate-rank",
  percentile: "certificate-percentile",
};
