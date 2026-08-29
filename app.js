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
const emptyState = document.querySelector("#empty-state");
const accessDialog = document.querySelector("#access-dialog");
const accessEyebrow = document.querySelector("#access-eyebrow");
const accessTitle = document.querySelector("#access-title");
const accessSummary = document.querySelector("#access-summary");
const accessItems = document.querySelector("#access-items");
const accessNote = document.querySelector("#access-note");
const copyToast = document.querySelector("#copy-toast");

const state = {
  activities: [],
  activityIndex: 0,
  cases: [],
  category: "全部",
  platform: "全部平台",
  query: "",
  timer: null,
  paused: false,
  dialogTrigger: null,
};

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const cardObserver = !reduceMotion.matches && "IntersectionObserver" in window
  ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.dataset.visible = "true";
        cardObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "72px 0px" })
  : null;

const PLATFORM_LABELS = {
  Apple: "苹果",
  Android: "安卓",
  HarmonyOS: "鸿蒙",
};

const PLATFORM_ICONS = {
  "全部平台": `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="2"></rect><rect x="14" y="4" width="6" height="6" rx="2"></rect><rect x="4" y="14" width="6" height="6" rx="2"></rect><rect x="14" y="14" width="6" height="6" rx="2"></rect></svg>`,
  Apple: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.9 12.9c0-2.2 1.8-3.3 1.9-3.4-1.1-1.5-2.7-1.7-3.3-1.7-1.4-.1-2.7.8-3.4.8-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 6.9 1.1 9.1.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3.1-.7 1.4 0 1.9.7 3.1.7 1.3 0 2.1-1.1 2.8-2.2.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.7-1-2.7-3.7zM14.6 6.3c.6-.8 1.1-2 1-3.1-1 .1-2.2.7-2.9 1.5-.6.7-1.1 1.9-1 3 1.1.1 2.2-.5 2.9-1.4z"></path></svg>`,
  Android: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.1 8.2h9.8c1.1 0 2 .9 2 2v7.1c0 .6-.5 1.1-1.1 1.1h-1v2.1a1.2 1.2 0 0 1-2.4 0v-2.1H9.6v2.1a1.2 1.2 0 0 1-2.4 0v-2.1h-1c-.6 0-1.1-.5-1.1-1.1v-7.1c0-1.1.9-2 2-2z"></path><path d="M7.7 8.1a4.5 4.5 0 0 1 8.6 0M8.1 3.2l1.2 2M15.9 3.2l-1.2 2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"></path><circle cx="9.2" cy="6.9" r=".7" fill="var(--icon-cutout, #fff)"></circle><circle cx="14.8" cy="6.9" r=".7" fill="var(--icon-cutout, #fff)"></circle></svg>`,
  HarmonyOS: `<span class="harmony-logo" aria-hidden="true"></span>`,
};

const ACCESS_META = {
  bilibili: {
    label: "哔哩哔哩",
    icon: "./assets/platforms/bilibili.svg",
  },
  xiaohongshu: {
    label: "小红书",
    icon: "./assets/platforms/xiaohongshu.svg",
  },
  douyin: {
    label: "抖音",
    icon: "./assets/platforms/douyin.svg",
  },
  kdocs: {
    label: "金山文档",
    icon: "./assets/platforms/kdocs.svg",
  },
  qq: {
    label: "QQ",
    icon: "./assets/platforms/qq.svg",
  },
  github: {
    label: "GitHub",
    icon: "./assets/platforms/github.svg",
  },
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

function getAccess(item) {
  if (item.access && Array.isArray(item.access.items)) return item.access;
  return { items: [] };
}

function closeAccessDialog() {
  if (!accessDialog) return;
  if (typeof accessDialog.close === "function" && accessDialog.open) {
    accessDialog.close();
  } else {
    accessDialog.removeAttribute("open");
    document.body.classList.remove("dialog-open");
    state.dialogTrigger?.focus();
  }
}

function fallbackCopy(value) {
  const input = document.createElement("textarea");
  input.value = value;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.append(input);
  input.select();
  const copied = document.execCommand("copy");
  input.remove();
  if (!copied) throw new Error("copy failed");
}

async function copyAccessValue(value, label, button, status) {
  try {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
    } else {
      fallbackCopy(value);
    }
    const original = status.textContent;
    status.textContent = "已复制到剪贴板";
    button.dataset.copied = "true";
    if (copyToast) {
      copyToast.textContent = `已复制${label}`;
      copyToast.dataset.visible = "true";
    }
    window.setTimeout(() => {
      status.textContent = original;
      delete button.dataset.copied;
      if (copyToast) delete copyToast.dataset.visible;
    }, 1600);
  } catch (error) {
    console.error(error);
    if (copyToast) {
      copyToast.textContent = "复制失败，请长按内容手动复制";
      copyToast.dataset.visible = "true";
      window.setTimeout(() => delete copyToast.dataset.visible, 2200);
    }
  }
}

function openAccessDialog(item, trigger) {
  if (!accessDialog || !accessItems) return;
  const access = getAccess(item);
  state.dialogTrigger = trigger;

  accessEyebrow.textContent = access.eyebrow || (item.partnerName === "千机百变官方" ? "官方发布" : "获取信息");
  accessTitle.textContent = access.title || item.name || item.title;
  accessSummary.textContent = access.summary || item.summary || "选择对应平台，复制所需内容后自行前往该平台。";
  accessNote.textContent = access.note || "复制后请自行打开对应平台，并粘贴内容完成后续操作。";
  accessItems.replaceChildren();

  access.items.forEach((accessItem) => {
    const meta = ACCESS_META[accessItem.platform];
    if (!meta) return;
    const option = document.createElement("button");
    const icon = document.createElement("span");
    const logo = document.createElement("img");
    const label = document.createElement("strong");
    const status = document.createElement("small");

    option.className = "access-option";
    option.type = "button";
    option.dataset.platform = accessItem.platform;
    option.disabled = accessItem.copyable === false;
    icon.className = "access-option-icon";
    logo.src = meta.icon;
    logo.alt = "";
    logo.decoding = "async";
    logo.setAttribute("aria-hidden", "true");
    icon.append(logo);
    label.textContent = accessItem.label || meta.label;
    status.textContent = accessItem.copyable === false
      ? "正式内容待发布"
      : (accessItem.description || "点击复制所需信息");
    option.append(icon, label, status);
    if (accessItem.copyable !== false) {
      option.setAttribute("aria-label", `选择${accessItem.label || meta.label}并复制所需信息`);
      option.addEventListener("click", () => copyAccessValue(accessItem.value, accessItem.label || meta.label, option, status));
    }
    accessItems.append(option);
  });

  if (!access.items.length) {
    const unavailable = document.createElement("p");
    unavailable.className = "access-unavailable";
    unavailable.textContent = "相关信息还在整理中。";
    accessItems.append(unavailable);
  }

  document.body.classList.add("dialog-open");
  if (typeof accessDialog.showModal === "function") {
    accessDialog.showModal();
  } else {
    accessDialog.setAttribute("open", "");
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
    const title = fragment.querySelector("h3");
    const summary = fragment.querySelector("p");
    const action = fragment.querySelector(".banner-action");

    slide.setAttribute("aria-label", `${index + 1} / ${state.activities.length}：${activity.title}`);
    slide.setAttribute("aria-roledescription", "幻灯片");
    cover.src = activity.cover;
    cover.alt = activity.coverAlt || `${activity.title}活动视觉`;
    title.textContent = activity.title;
    summary.textContent = activity.summary;
    if (getAccess(activity).items.length) {
      action.querySelector("span").textContent = activity.linkLabel || "获取信息";
      action.addEventListener("click", () => openAccessDialog(activity, action));
    } else {
      action.hidden = true;
    }
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
    slide.querySelector(".banner-action")?.setAttribute("tabindex", active ? "0" : "-1");
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

  if (!reduceMotion.matches) {
    activityCarousel.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") return;
      const bounds = activityCarousel.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * -12;
      const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * -8;
      activityCarousel.style.setProperty("--banner-x", `${x.toFixed(2)}px`);
      activityCarousel.style.setProperty("--banner-y", `${y.toFixed(2)}px`);
    });
    activityCarousel.addEventListener("pointerleave", () => {
      activityCarousel.style.setProperty("--banner-x", "0px");
      activityCarousel.style.setProperty("--banner-y", "0px");
    });
  }

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
  cardObserver?.disconnect();
  caseGrid.replaceChildren();

  const editorialLayouts = ["hero", "support", "standard", "standard", "standard", "standard", "wide", "wide"];

  items.forEach((item, index) => {
    const fragment = caseTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".case-card");
    const trigger = fragment.querySelector(".case-card-trigger");
    const image = fragment.querySelector(".case-media img");
    const title = fragment.querySelector("h3");
    const partner = fragment.querySelector(".partner-name");
    const platforms = fragment.querySelector(".case-platforms");

    const access = getAccess(item);
    trigger.setAttribute("aria-label", `${item.name}，由 ${item.partnerName} 创作，查看并复制获取信息，共 ${access.items.length} 项`);
    trigger.addEventListener("click", () => openAccessDialog(item, trigger));
    card.dataset.featured = item.featured ? "true" : "false";
    card.dataset.official = item.partnerName === "千机百变官方" ? "true" : "false";
    card.dataset.layout = editorialLayouts[index % editorialLayouts.length];
    card.style.setProperty("--card-index", Math.min(index, 7));
    image.src = item.cover;
    image.alt = item.coverAlt || `${item.name}案例封面`;
    title.textContent = item.name;
    partner.textContent = item.partnerName === "千机百变官方" ? "官方" : item.partnerName;
    platforms.setAttribute("aria-label", `支持平台：${item.platforms.map(platformLabel).join("、")}`);
    item.platforms.forEach((platform) => platforms.append(createPlatformIcon(platform, "platform-icon--case")));
    caseGrid.append(fragment);
    if (cardObserver) cardObserver.observe(card);
    else card.dataset.visible = "true";
  });

  if (emptyState) emptyState.hidden = items.length !== 0;
}

function bindCardMotion() {
  if (!caseGrid || reduceMotion.matches) return;
  caseGrid.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") return;
    const card = event.target.closest(".case-card");
    if (!card) return;
    const bounds = card.getBoundingClientRect();
    const px = (event.clientX - bounds.left) / bounds.width - 0.5;
    const py = (event.clientY - bounds.top) / bounds.height - 0.5;
    card.style.setProperty("--card-rx", `${(-py * 2.4).toFixed(2)}deg`);
    card.style.setProperty("--card-ry", `${(px * 2.4).toFixed(2)}deg`);
    card.style.setProperty("--glow-x", `${((px + 0.5) * 100).toFixed(1)}%`);
    card.style.setProperty("--glow-y", `${((py + 0.5) * 100).toFixed(1)}%`);
  });
  caseGrid.addEventListener("pointerout", (event) => {
    const card = event.target.closest(".case-card");
    if (!card || card.contains(event.relatedTarget)) return;
    card.style.setProperty("--card-rx", "0deg");
    card.style.setProperty("--card-ry", "0deg");
  });
}

function bindCaseControls() {
  searchInput?.addEventListener("input", (event) => {
    state.query = event.target.value;
    renderCases();
  });
}

function bindAccessDialog() {
  accessDialog?.addEventListener("click", (event) => {
    if (event.target === accessDialog) closeAccessDialog();
  });
  accessDialog?.addEventListener("close", () => {
    document.body.classList.remove("dialog-open");
    state.dialogTrigger?.focus();
  });
}

function renderLoadError(error) {
  console.error(error);
  if (emptyState) {
    emptyState.hidden = false;
    emptyState.querySelector("strong").textContent = "内容载入失败";
    emptyState.querySelector("p").textContent = "请稍后重试或联系官方。";
  }
}

async function initialize() {
  bindCarouselControls();
  bindCaseControls();
  bindCardMotion();
  bindAccessDialog();
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
