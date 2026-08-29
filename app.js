const activityTrack = document.querySelector("#activity-track");
const activityDots = document.querySelector("#activity-dots");
const activityCarousel = document.querySelector("#activity-carousel");
const activityStatus = document.querySelector("#activity-status");
const activityTemplate = document.querySelector("#activity-template");
const caseTemplate = document.querySelector("#case-template");
const caseGrid = document.querySelector("#case-grid");
const categoryTabs = document.querySelector("#category-tabs");
const searchInput = document.querySelector("#case-search");
const platformSelect = document.querySelector("#platform-select");
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
  if (!categoryTabs || !platformSelect) return;
  const categories = ["全部", ...new Set(state.cases.map((item) => item.category))];
  const platforms = [...new Set(state.cases.flatMap((item) => item.platforms))];

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

  platformSelect.querySelectorAll("option:not(:first-child)").forEach((option) => option.remove());
  platforms.forEach((platform) => {
    const option = document.createElement("option");
    option.value = platform;
    option.textContent = platform;
    platformSelect.append(option);
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
    const platform = fragment.querySelector(".case-platform");

    configureLink(card, item.url);
    card.setAttribute("aria-label", `${item.name}，由 ${item.partnerName} 创作，前往 ${item.sourceName}`);
    image.src = item.cover;
    image.alt = item.coverAlt || `${item.name}案例封面`;
    featured.hidden = !item.featured;
    destination.textContent = item.sourceName;
    title.textContent = item.name;
    summary.textContent = item.summary;
    partner.textContent = `by ${item.partnerName}`;
    platform.textContent = item.platforms.slice(0, 2).join(" · ");
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
  platformSelect?.addEventListener("change", (event) => {
    state.platform = event.target.value;
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
