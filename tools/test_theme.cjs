const {readFileSync} = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = readFileSync(require('node:path').join(__dirname, '../theme.js'), 'utf8');
function boot(initial) {
  const css = {}, events = [], listeners = {}, meta = {}, select = {};
  const media = {matches:false, addEventListener:(_,fn) => media.change = fn};
  const document = {documentElement:{style:{setProperty:(k,v)=>css[k]=v}, dataset:{}},
    querySelector:s=>s.startsWith('meta') ? {setAttribute:(k,v)=>meta[k]=v} : select,
    addEventListener:(key,fn)=>listeners[key]=fn, hidden:false};
  const window = {matchMedia:()=>media, dispatchEvent:e=>events.push(e), __APP_THEME__:initial};
  vm.runInNewContext(source, {window, document, CustomEvent:class {constructor(type,init){this.type=type;this.detail=init.detail}}, console});
  return {api:window.QianjiTheme, window, css, document, media, events, meta};
}
function luminance(hex) {
  const channels=hex.slice(1).match(/../g).map(c=>parseInt(c,16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);
  return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;
}
function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
const t=boot();
assert.equal(t.api.getTheme().resolvedMode,'light');
assert.equal(t.events.at(-1).type,'qianji:themeready');
for (const seed of ['#4285f4','#ff5500','#008844','#000000','#ffffff','#ad00ec']) {
 t.api.setSeedColor(seed);
 for (const mode of ['light','dark']) {
  const result=t.api.setMode(mode), c=result.colors;
  assert.equal(t.document.documentElement.style.colorScheme,mode);
  assert.equal(t.meta.content,c.surface);
  for (const [fg,bg] of [['onSurface','surface'],['onSurfaceVariant','surfaceContainer'],['onPrimary','primary'],['onPrimaryContainer','primaryContainer']]) assert(contrast(c[fg],c[bg])>=4.5,`${seed}/${mode}: ${fg}/${bg}`);
 }
}
t.api.setMode('light');t.media.matches=true;t.media.change();assert.equal(t.api.getTheme().resolvedMode,'light');
t.api.setMode('system');assert.equal(t.api.getTheme().resolvedMode,'dark');
t.media.matches=false;t.media.change();assert.equal(t.api.getTheme().resolvedMode,'light');
const light=t.api.setMode('light').colors, dark=t.api.setMode('dark').colors;
light.primary='#235800';light.onPrimary='#ffffff';
t.api.setPalettes({light,dark});t.api.setMode('light');assert.equal(t.css['--md-sys-color-primary'],'#235800');
t.api.setMode('dark');assert.equal(t.css['--md-sys-color-primary'],dark.primary);
const before=JSON.stringify(t.api.getTheme());
for(const patch of [{mode:'sepia'},{seedColor:'red'},{palettes:{light}},{colorMode:'bad'},{colors:{}},{seedColor:'#000000; display:none'}]) {
 assert.throws(()=>t.api.setTheme(patch));assert.equal(JSON.stringify(t.api.getTheme()),before);
}
const snap=t.api.getTheme();snap.palettes.light.primary='#ffffff';assert.equal(t.api.getTheme().palettes.light.primary,'#235800');
assert.equal(t.api.reset().colorMode,'default');
assert.equal(boot({mode:'dark',colorMode:'seed',seedColor:'#ff5500'}).api.getTheme().resolvedMode,'dark');
assert.equal(typeof t.window.setAppTheme,'function');
console.log('Theme API passed: generated contrast, explicit/system modes, custom palettes, atomic validation, bootstrap and reset.');
