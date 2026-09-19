/* Logic smoke tests. Run: node tools/smoke.js
   Uses a minimal DOM stub (no jsdom offline) so views bail out and the
   pure logic - catalog, build state, i18n - stays testable. */
const store={};
global.localStorage={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]}};
global.CustomEvent=class{constructor(n,o){this.type=n;this.detail=o&&o.detail}};
const attrs={}; global.__attrs=attrs; const fakes={};
global.document={readyState:'complete',querySelector:()=>null,querySelectorAll:sel=>fakes[sel]||[],
  addEventListener:()=>{},dispatchEvent:()=>{},
  documentElement:{setAttribute:(k,v)=>{attrs[k]=v},getAttribute:k=>attrs[k],classList:{toggle:()=>{}}},
  body:{getAttribute:()=>'home',appendChild:()=>{},classList:{toggle:()=>{},remove:()=>{}}},
  createElement:()=>({classList:{add(){},remove(){},toggle(){}},style:{}})};
global.window={CHECKMYPC_ROOT:'',matchMedia:q=>({matches:global.__prefersDark===true,addEventListener:(e,f)=>{global.__mqlFn=f}})};
global.navigator={language:'en-US'};
global.location={search:'',href:'http://x/'};
global.URLSearchParams=URLSearchParams;
const fs=require('fs');
eval(fs.readFileSync(__dirname+'/../assets/catalog.js','utf8'));
eval(fs.readFileSync(__dirname+'/../assets/app.js','utf8'));
const { Catalog, Build, t, setLang, getLang, langs } = window.CMP;
let fail=0; const ok=(c,m)=>{console.log((c?'PASS  ':'FAIL  ')+m); if(!c)fail++;};


ok(Catalog.all().length === 31, 'catalog loads 31 products');
ok(Catalog.byCategory('gpu').length === 4, 'gpu category resolves');

// best_price must equal cheapest IN-STOCK offer, not cheapest overall
let priceBug = Catalog.all().filter(p => {
  const o = Catalog.bestOffer(p);
  return o && o.price !== p.best_price;
});
ok(priceBug.length === 0, 'best_price tracks cheapest in-stock offer');

// facets must discriminate, never explode
const f = Catalog.facets(Catalog.byCategory('cooler'));
ok(Object.keys(f.brands).length >= 2, 'cooler brand facet populated');
ok('Water cooled' in f.specs, 'cooler exposes "Water cooled" facet');
ok(!('Radiator size' in f.specs) || Object.keys(f.specs['Radiator size']).length <= 8, 'facets bounded');

// build state round-trips and is keyed by category (one part per slot)
Build.add('ryzen-5-5600', 1);
Build.add('ryzen-5-7600', 1);
ok(Build.count() === 1, 'second CPU replaces first in the cpu slot');
Build.add('rtx-4060-8gb', 2);
ok(Build.count() === 2, 'gpu occupies its own slot');
const items = Build.items();
const gpuLine = items.find(i => i.product.category === 'gpu');
ok(gpuLine.line === gpuLine.offer.price * 2, 'qty multiplies the line total');
ok(Build.total() === items.reduce((a, i) => a + i.line, 0), 'total sums line items');
Build.clear();
ok(Build.count() === 0, 'clear empties the build');




ok(Object.keys(langs).join(',')==='en,fr,ar','three languages registered');
ok(getLang()==='en','defaults to en');
ok(t('foot.tagline').includes('27+'),'EN tagline present');

setLang('fr');
ok(getLang()==='fr','switches to fr');
ok(attrs.lang==='fr'&&attrs.dir==='ltr','fr stays LTR');
ok(t('nav.builder')==='Configurateur','fr nav translated');
ok(Catalog.categoryLabel('gpu')==='Cartes graphiques','fr category label');

setLang('ar');
ok(attrs.lang==='ar'&&attrs.dir==='rtl','ar sets dir=rtl');
ok(/[\u0600-\u06FF]/.test(t('foot.cityTitle')),'ar footer heading is Arabic script');
ok(Catalog.categoryLabel('cpu')!=='cat.cpu','ar category resolves, no raw key');
ok(store['cmp.lang.v1']==='ar','preference persisted to localStorage');

// every key present in EN must exist in FR and AR
setLang('en');
const all=['nav.builder','nav.components','foot.tagline','foot.rights','ui.filters','stock.in','cat.storage'];
['fr','ar'].forEach(L=>{setLang(L);
  const missing=all.filter(k=>t(k)===k);
  ok(missing.length===0,L+' has no missing keys in sample: '+(missing.join(',')||'none'));
});

// unknown language must be ignored, not blank the UI
setLang('de');
ok(getLang()!=='de','unknown language rejected');



/* ---- theme system ---- */
const {setTheme,getTheme}=window.CMP;
ok(['light','dark'].includes(getTheme()),'theme resolves to a valid value');
setTheme('dark');
ok(attrs['data-theme']==='dark','dark sets data-theme=dark');
ok(store['cmp.theme.v1']==='dark','explicit theme choice persisted');
setTheme('light');
ok(attrs['data-theme']==='light','light sets data-theme=light');
ok(store['cmp.theme.v1']==='light','light choice persisted');

/* an explicit choice must survive an OS theme change */
if(global.__mqlFn){global.__prefersDark=true;global.__mqlFn({matches:true});}
ok(getTheme()==='light','OS change does not override an explicit choice');

/* control sync: every [data-lang-select] mirrors the active language */
const sels=[{value:'en'},{value:'en'}];
fakes['[data-lang-select]']=sels;
fakes['[data-theme-toggle]']=[{setAttribute(k,v){this[k]=v}},{setAttribute(k,v){this[k]=v}}];
setLang('fr');
ok(sels.every(s=>s.value==='fr'),'header and footer language selects stay in sync');
setLang('ar');
ok(sels.every(s=>s.value==='ar')&&attrs.dir==='rtl','both selects follow the RTL switch');
ok(fakes['[data-theme-toggle]'].every(b=>b['aria-pressed']!==undefined),'theme toggles expose aria-pressed');
setLang('en');

console.log(fail?('\n'+fail+' FAILED'):'\nall passed');
process.exit(fail?1:0);
