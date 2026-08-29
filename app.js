const activityTrack = document.querySelector("#activity-track");
const activityDots = document.querySelector("#activity-dots");
const activityCarousel = document.querySelector("#activity-carousel");
const activityStatus = document.querySelector("#activity-status");
const activityTemplate = document.querySelector("#activity-template");
const caseTemplate = document.querySelector("#case-template");
const caseGrid = document.querySelector("#case-grid");
const categoryTabs = document.querySelector("#category-tabs");
const searchInput = document.querySelector("#case-search");
const platformButtons = document.querySelector("#platform-buttons");
const resultsCount = document.querySelector("#results-count");
const emptyState = document.querySelector("#empty-state");

const state = {
  activities: [],
  activityIndex: 0,
  cases: [],
  category: "全部",
  platform: "全部平台",
  query: "",
  timer: null,
  paused: false,
};

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const PLATFORM_LABELS = {
  Apple: "苹果",
  Android: "安卓",
  HarmonyOS: "鸿蒙",
};

const PLATFORM_ICONS = {
  "全部平台": `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="2"></rect><rect x="14" y="4" width="6" height="6" rx="2"></rect><rect x="4" y="14" width="6" height="6" rx="2"></rect><rect x="14" y="14" width="6" height="6" rx="2"></rect></svg>`,
  Apple: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.9 12.9c0-2.2 1.8-3.3 1.9-3.4-1.1-1.5-2.7-1.7-3.3-1.7-1.4-.1-2.7.8-3.4.8-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 6.9 1.1 9.1.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3.1-.7 1.4 0 1.9.7 3.1.7 1.3 0 2.1-1.1 2.8-2.2.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.7-1-2.7-3.7zM14.6 6.3c.6-.8 1.1-2 1-3.1-1 .1-2.2.7-2.9 1.5-.6.7-1.1 1.9-1 3 1.1.1 2.2-.5 2.9-1.4z"></path></svg>`,
  Android: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.1 8.2h9.8c1.1 0 2 .9 2 2v7.1c0 .6-.5 1.1-1.1 1.1h-1v2.1a1.2 1.2 0 0 1-2.4 0v-2.1H9.6v2.1a1.2 1.2 0 0 1-2.4 0v-2.1h-1c-.6 0-1.1-.5-1.1-1.1v-7.1c0-1.1.9-2 2-2z"></path><path d="M7.7 8.1a4.5 4.5 0 0 1 8.6 0M8.1 3.2l1.2 2M15.9 3.2l-1.2 2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"></path><circle cx="9.2" cy="6.9" r=".7" fill="var(--icon-cutout, #fff)"></circle><circle cx="14.8" cy="6.9" r=".7" fill="var(--icon-cutout, #fff)"></circle></svg>`,
  HarmonyOS: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.2 9.5c2-2.7 4.6-4.1 7.8-4.1s5.8 1.4 7.8 4.1M6.1 13c1.5-1.8 3.5-2.7 5.9-2.7s4.4.9 5.9 2.7M8.5 16.4c.9-.9 2.1-1.4 3.5-1.4s2.6.5 3.5 1.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path><circle cx="12" cy="19.2" r="1.45" fill="currentColor"></circle></svg>`,
};

function platformLabel(platform) {
  return platform === "全部平台" ? "全部平台" : PLATFORM_LABELS[platform] || platform;
}

function createPlatformIcon(platform, className = "") {
  const icon = document.createElement("span");
  icon.className = `platform-icon ${className}`.trim();
  icon.innerHTML = PLATFORM_ICONS[platform] || "";
  icon.title = platformLabel(platform);
  return icon;
}

function isExternalUrl(url) {
  return /^(https?:|mailto:)/i.test(url);
}

function configureLink(anchor, url) {
  anchor.href = url;
  if (/^https?:/i.test(url)) {
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
  }
}

async function loadJson(url) {
  const response = await fetch(url, { cache: "no-cache" });
  if (!response.ok) throw new Error(`无法读取 ${url}`);
  return response.json();
}

function renderActivities() {
  if (!activityTrack || !activityTemplate) return;
  activityTrack.replaceChildren();
  activityDots?.replaceChildren();

  state.activities.forEach((activity, index) => {
    const fragment = activityTemplate.content.cloneNode(true);
    const slide = fragment.querySelector(".activity-slide");
    const cover = fragment.querySelector(".activity-cover");
    const badge = fragment.querySelector(".activity-badge");
    const title = fragment.querySelector("h3");
    const summary = fragment.querySelector("p");
    const link = fragment.querySelector(".banner-action");

    slide.setAttribute("aria-label", `${index + 1} / ${state.activities.length}：${activity.title}`);
    slide.setAttribute("aria-roledescription", "幻灯片");
    cover.src = activity.cover;
    cover.alt = activity.coverAlt || `${activity.title}活动视觉`;
    badge.textContent = activity.badge;
    title.textContent = activity.title;
    summary.textContent = activity.summary;
    link.querySelector("span").textContent = activity.linkLabel;
    link.querySelector("b").textContent = isExternalUrl(activity.url) ? "↗" : "→";
    configureLink(link, activity.url);
    activityTrack.append(fragment);

    if (activityDots) {
      const dot = document.createElement("button");
      dot.className = "activity-dot";
      dot.type = "button";
      dot.setAttribute("aria-label", `显示活动：${activity.title}`);
      dot.addEventListener("click", () => setActivity(index, true));
      activityDots.append(dot);
    }
  });

  setActivity(0, false);
  scheduleCarousel();
}

function setActivity(index, announce = false) {
  if (!state.activities.length || !activityTrack) return;
  const total = state.activities.length;
  state.activityIndex = (index + total) % total;
  activityTrack.style.transform = `translateX(-${state.activityIndex * 100}%)`;

  activityDots?.querySelectorAll(".activity-dot").forEach((dot, dotIndex) => {
    dot.setAttribute("aria-current", dotIndex === state.activityIndex ? "true" : "false");
  });
  activityTrack.querySelectorAll(".activity-slide").forEach((slide, slideIndex) => {
    const active = slideIndex === state.activityIndex;
    slide.setAttribute("aria-hidden", active ? "false" : "true");
    slide.querySelector("a")?.setAttribute("tabindex", active ? "0" : "-1");
  });

  if (announce && activityStatus) {
    const item = state.activities[state.activityIndex];
    activityStatus.textContent = `当前活动：${item.title}，第 ${state.activityIndex + 1} 项，共 ${total} 项`;
  }
  scheduleCarousel();
}

function scheduleCarousel() {
  window.clearTimeout(state.timer);
  if (state.paused || reduceMotion.matches || state.activities.length < 2 || document.hidden) return;
  state.timer = window.setTimeout(() => setActivity(state.activityIndex + 1), 7000);
}

function bindCarouselControls() {
  document.querySelector("#activity-prev")?.addEventListener("click", () => setActivity(state.activityIndex - 1, true));
  document.querySelector("#activity-next")?.addEventListener("click", () => setActivity(state.activityIndex + 1, true));

  if (!activityCarousel) return;
  const pause = () => {
    state.paused = true;
    window.clearTimeout(state.timer);
  };
  const resume = () => {
    state.paused = false;
    scheduleCarousel();
  };

  activityCarousel.addEventListener("mouseenter", pause);
  activityCarousel.addEventListener("mouseleave", resume);
  activityCarousel.addEventListener("focusin", pause);
  activityCarousel.addEventListener("focusout", resume);

  let pointerStart = null;
  activityCarousel.addEventListener("pointerdown", (event) => {
    pointerStart = event.clientX;
    pause();
  });
  activityCarousel.addEventListener("pointerup", (event) => {
    if (pointerStart === null) return;
    const delta = event.clientX - pointerStart;
    pointerStart = null;
    if (Math.abs(delta) > 48) setActivity(state.activityIndex + (delta < 0 ? 1 : -1), true);
    resume();
  });
  activityCarousel.addEventListener("pointercancel", () => {
    pointerStart = null;
    resume();
  });

  document.addEventListener("visibilitychange", scheduleCarousel);
  reduceMotion.addEventListener?.("change", scheduleCarousel);
}

function renderFilters() {
  if (!categoryTabs || !platformButtons) return;
  const categories = ["全部", ...new Set(state.cases.map((item) => item.category))];

  categoryTabs.replaceChildren();
  categories.forEach((category) => {
    const button = document.createElement("button");
    button.className = "category-button";
    button.type = "button";
    button.textContent = category;
    button.setAttribute("aria-pressed", category === state.category ? "true" : "false");
    button.addEventListener("click", () => {
      state.category = category;
      categoryTabs.querySelectorAll("button").forEach((item) => {
        item.setAttribute("aria-pressed", item === button ? "true" : "false");
      });
      renderCases();
    });
    categoryTabs.append(button);
  });

  platformButtons.replaceChildren();
  ["全部平台", "Apple", "Android", "HarmonyOS"].forEach((platform) => {
    const button = document.createElement("button");
    const label = platformLabel(platform);
    button.className = "platform-button";
    button.type = "button";
    button.dataset.platform = platform;
    button.setAttribute("aria-label", label);
    button.setAttribute("aria-pressed", platform === state.platform ? "true" : "false");
    button.title = label;
    button.append(createPlatformIcon(platform));
    button.addEventListener("click", () => {
      state.platform = platform;
      platformButtons.querySelectorAll("button").forEach((item) => {
        item.setAttribute("aria-pressed", item === button ? "true" : "false");
      });
      renderCases();
    });
    platformButtons.append(button);
  });
}

function getFilteredCases() {
  const query = state.query.trim().toLocaleLowerCase("zh-CN");
  return state.cases.filter((item) => {
    const categoryMatches = state.category === "全部" || item.category === state.category;
    const platformMatches = state.platform === "全部平台" || item.platforms.includes(state.platform);
    const searchable = [item.name, item.summary, item.partnerName, item.category, ...item.platforms, ...item.tags]
      .join(" ")
      .toLocaleLowerCase("zh-CN");
    return categoryMatches && platformMatches && (!query || searchable.includes(query));
  });
}

function renderCases() {
  if (!caseGrid || !caseTemplate) return;
  const items = getFilteredCases();
  caseGrid.replaceChildren();

  items.forEach((item) => {
    const fragment = caseTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".case-card");
    const image = fragment.querySelector(".case-media img");
    const featured = fragment.querySelector(".case-featured");
    const destination = fragment.querySelector(".case-destination");
    const title = fragment.querySelector("h3");
    const summary = fragment.querySelector(".case-summary");
    const partner = fragment.querySelector(".partner-name");
    const category = fragment.querySelector(".case-category");
    const platforms = fragment.querySelector(".case-platforms");

    configureLink(card, item.url);
    card.setAttribute("aria-label", `${item.name}，由 ${item.partnerName} 创作，前往 ${item.sourceName}`);
    card.dataset.featured = item.featured ? "true" : "false";
    card.dataset.official = item.partnerName === "千机百变官方" ? "true" : "false";
    image.src = item.cover;
    image.alt = item.coverAlt || `${item.name}案例封面`;
    featured.hidden = !item.featured;
    destination.textContent = item.sourceName;
    title.textContent = item.name;
    summary.textContent = item.summary;
    partner.textContent = item.partnerName;
    category.textContent = item.category;
    platforms.setAttribute("aria-label", `支持平台：${item.platforms.map(platformLabel).join("、")}`);
    item.platforms.forEach((platform) => platforms.append(createPlatformIcon(platform, "platform-icon--case")));
    caseGrid.append(fragment);
  });

  if (resultsCount) resultsCount.textContent = `显示 ${items.length} / ${state.cases.length} 个案例`;
  if (emptyState) emptyState.hidden = items.length !== 0;
}

function bindCaseControls() {
  searchInput?.addEventListener("input", (event) => {
    state.query = event.target.value;
    renderCases();
  });
}

function renderLoadError(error) {
  console.error(error);
  if (resultsCount) resultsCount.textContent = "案例暂时无法载入";
  if (emptyState) {
    emptyState.hidden = false;
    emptyState.querySelector("strong").textContent = "内容载入失败";
    emptyState.querySelector("p").textContent = "请稍后重试或联系官方。";
  }
}

async function initialize() {
  bindCarouselControls();
  bindCaseControls();
  try {
    const [activities, cases] = await Promise.all([
      loadJson("./data/activities.json"),
      loadJson("./data/cases.json"),
    ]);
    state.activities = activities.filter((item) => item.visible !== false);
    state.cases = cases.filter((item) => item.visible !== false);
    renderActivities();
    renderFilters();
    renderCases();
  } catch (error) {
    renderLoadError(error);
  }
}

initialize();
