import { Hct, argbFromHex, hexFromArgb, SchemeTonalSpot, MaterialDynamicColors } from '../vendor/material-color-utilities/index.js';

// Synchronous, local bundle: available before app.js and the first page paint.
(() => {
  const root = document.documentElement;
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const roles = ['primary','onPrimary','primaryContainer','onPrimaryContainer','secondary','onSecondary','secondaryContainer','onSecondaryContainer','tertiary','onTertiary','surface','onSurface','onSurfaceVariant','surfaceContainerLow','surfaceContainer','surfaceContainerHigh','surfaceContainerHighest','outline','outlineVariant','inverseSurface','inverseOnSurface','error','onError'];
  const required = ['primary','onPrimary','primaryContainer','onPrimaryContainer','surface','onSurface','onSurfaceVariant','surfaceContainer','outline'];
  const defaults = () => ({mode:'system', colorMode:'default', seedColor:'#4285f4', palettes:{}});
  let settings = defaults();
  let resolved;
  const clone = value => JSON.parse(JSON.stringify(value));
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const color = value => {
    if (typeof value !== 'string' || !/^#[0-9a-f]{6}$/i.test(value)) throw new TypeError('Colors must use #RRGGBB.');
    return value.toLowerCase();
  };
  const validate = patch => {
    if (!object(patch)) throw new TypeError('Theme must be an object.');
    const next = clone(settings);
    for (const key of Object.keys(patch)) {
      if (!Object.hasOwn(next, key)) throw new TypeError(`Unknown theme field: ${key}`);
    }
    if ('mode' in patch) {
      if (!['light','dark','system'].includes(patch.mode)) throw new TypeError('mode: light | dark | system');
      next.mode = patch.mode;
    }
    if ('colorMode' in patch) {
      if (!['default','seed','custom'].includes(patch.colorMode)) throw new TypeError('colorMode: default | seed | custom');
      next.colorMode = patch.colorMode;
    }
    if ('seedColor' in patch) next.seedColor = color(patch.seedColor);
    if ('palettes' in patch) {
      if (!object(patch.palettes)) throw new TypeError('palettes must contain light and dark objects.');
      const palettes = {};
      for (const [mode, palette] of Object.entries(patch.palettes)) {
        if (!['light','dark'].includes(mode) || !object(palette)) throw new TypeError('Invalid palette mode.');
        if (required.some(role => !Object.hasOwn(palette, role))) throw new TypeError(`Missing required color roles in ${mode} palette.`);
        palettes[mode] = {};
        for (const [role, value] of Object.entries(palette)) {
          if (!roles.includes(role)) throw new TypeError(`Unknown color role: ${role}`);
          palettes[mode][role] = color(value);
        }
      }
      next.palettes = palettes;
    }
    if (next.colorMode === 'custom' && (!next.palettes.light || !next.palettes.dark)) throw new TypeError('Custom mode requires both light and dark palettes.');
    return next;
  };
  function apply() {
    const mode = settings.mode === 'system' ? (media.matches ? 'dark' : 'light') : settings.mode;
    const seed = settings.colorMode === 'default' ? '#4285f4' : settings.seedColor;
    const scheme = new SchemeTonalSpot(Hct.fromInt(argbFromHex(seed)), mode === 'dark', 0);
    const dynamic = new MaterialDynamicColors();
    const colors = Object.fromEntries(roles.map(role => [role, hexFromArgb(dynamic[role]().getArgb(scheme))]));
    if (settings.colorMode === 'custom') {
      const p = settings.palettes[mode];
      Object.assign(colors, p);
      // Keep missing surface levels coherent with the app's supplied surfaces.
      for (const role of ['surfaceContainerLow','surfaceContainerHigh','surfaceContainerHighest']) colors[role] = p[role] || p.surfaceContainer;
      colors.outlineVariant = p.outlineVariant || p.outline;
      colors.inverseSurface = p.inverseSurface || p.onSurface;
      colors.inverseOnSurface = p.inverseOnSurface || p.surface;
    }
    for (const [role,value] of Object.entries(colors)) {
      root.style.setProperty('--md-sys-color-' + role.replace(/[A-Z]/g, x => '-' + x.toLowerCase()), value);
    }
    root.dataset.theme = mode;
    root.dataset.colorMode = settings.colorMode;
    root.style.colorScheme = mode;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colors.surface);
    resolved = {...clone(settings), resolvedMode: mode, colors};
    window.dispatchEvent(new CustomEvent('qianji:themechange', {detail: clone(resolved)}));
    return clone(resolved);
  }
  function setTheme(patch) {
    const next = validate(patch); // Reject the entire update without mutating on invalid input.
    settings = next;
    return apply();
  }
  window.QianjiTheme = Object.freeze({
    version: 1,
    setTheme,
    setMode: mode => setTheme({mode}),
    setColorMode: colorMode => setTheme({colorMode}),
    setSeedColor: seedColor => setTheme({seedColor, colorMode:'seed'}),
    setPalettes: palettes => setTheme({palettes, colorMode:'custom'}),
    getTheme: () => clone(resolved),
    reset: () => { settings = defaults(); return apply(); }
  });
  window.setAppTheme = setTheme;
  apply();
  if (window.__APP_THEME__ !== undefined) {
    try { setTheme(window.__APP_THEME__); }
    catch (error) { console.warn('Invalid initial app theme:', error.message); }
  }
  const onSystemChange = () => { if (settings.mode === 'system') apply(); };
  if (media.addEventListener) media.addEventListener('change', onSystemChange);
  else media.addListener(onSystemChange);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && settings.mode === 'system') apply(); });
  window.dispatchEvent(new CustomEvent('qianji:themeready', {detail: window.QianjiTheme.getTheme()}));
})();
