(function(){
  "use strict";
  var KEY="cmp.admin.v1";
  var state={tab:"dashboard", editing:null, editKind:null, image:""};
  var $=function(s,r){return (r||document).querySelector(s)};
  var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
  var esc=function(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};
  var uid=function(p){return p+"-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7)};
  function read(){
    try{var d=JSON.parse(localStorage.getItem(KEY)||"{}");
      d.prebuilts=d.prebuilts||[];d.components=d.components||[];d.componentOverrides=d.componentOverrides||{};d.prebuiltOverrides=d.prebuiltOverrides||{};d.hiddenComponents=d.hiddenComponents||{};d.hiddenPrebuilts=d.hiddenPrebuilts||{};d.site=d.site||{};return d;
    }catch(e){return {prebuilts:[],components:[],componentOverrides:{},prebuiltOverrides:{},hiddenComponents:{},hiddenPrebuilts:{},site:{}}}
  }
  function save(d){localStorage.setItem(KEY,JSON.stringify(d));}
  function toast(msg){if(window.CMP&&CMP.toast)CMP.toast(msg);else alert(msg)}
  function fileToData(file,cb){if(!file)return cb("");var r=new FileReader();r.onload=function(){cb(r.result)};r.readAsDataURL(file)}
  function imagePreview(value){var el=$("#admin-image-preview");if(!el)return;el.innerHTML=value?'<img src="'+esc(value)+'" alt="Preview">':'<span>No image selected</span>'}
  function site(){return (window.CMP&&CMP.getSite)?CMP.getSite():{}}
  function allCatalog(){return window.CMP&&CMP.Catalog?CMP.Catalog.all():[]}
  function builtPrebuilts(){return window.CMP&&CMP.getPrebuilts?CMP.getPrebuilts().filter(function(x){return !x.custom}):[]}
  function specText(o){return Object.keys(o||{}).map(function(k){return k+": "+o[k]}).join("\n")}
  function parseSpecs(s){var o={};String(s||"").split(/\n/).forEach(function(line){var i=line.indexOf(":");if(i>0){var k=line.slice(0,i).trim(),v=line.slice(i+1).trim();if(k&&v)o[k]=v}});return o}

  function setTab(tab){state.tab=tab;state.editing=null;state.editKind=null;state.image="";$$('.admin-tab').forEach(function(b){b.classList.toggle('active',b.dataset.tab===tab)});render();window.scrollTo({top:0,behavior:'smooth'})}

  function dashboard(){
    var d=read(), cats=(site().categories||[]).length||((window.CHECKMYPC_CATALOG||{}).categories||[]).length, products=allCatalog().length, pb=(window.CMP&&CMP.getPrebuilts?CMP.getPrebuilts():[]).length;
    return '<div class="admin-dashboard">'+
      '<div class="admin-stat"><b>'+products+'</b><span>Components visible</span></div>'+'<div class="admin-stat"><b>'+pb+'</b><span>Prebuilt PCs visible</span></div>'+'<div class="admin-stat"><b>'+cats+'</b><span>Categories</span></div>'+'<div class="admin-stat"><b>'+((d.components||[]).filter(function(x){return x.published}).length)+'</b><span>Your published listings</span></div>'+
      '</div><div class="admin-quick"><button class="btn primary" data-go="components">Manage components</button><button class="btn primary" data-go="prebuilt">Manage prebuilts</button><button class="btn" data-go="content">Edit website content</button><button class="btn" data-go="categories">Manage categories</button></div>'+
      '<div class="admin-card admin-wide"><h2>What you can control</h2><div class="admin-feature-grid">'+
      ['Products: names, prices, brands, images, specs, stock and offer links.','Prebuilt PCs: complete specs, images, prices and View offer links.','Website content: homepage, page titles/descriptions, navigation and footer.','Categories: labels, descriptions, icons and visibility.','Built-in catalogue items can be overridden without editing the source files.','Export/import gives you a backup of the whole admin database.'].map(function(x){return '<div><b>✓</b><span>'+esc(x)+'</span></div>'}).join('')+'</div></div>';
  }

  function componentForm(id){
    var d=read(), custom=(d.components||[]).filter(function(x){return x.id===id})[0], base=!custom&&allCatalog().filter(function(x){return x.id===id})[0], ov=(d.componentOverrides||{})[id]||{}, x=custom||base||{};
    var editing=!!id, isBuilt=!custom&&!!base;
    state.image=(ov.image||x.image||"");
    var value=function(k){return ov[k]!=null?ov[k]:(x[k]!=null?x[k]:"")};
    return '<form id="component-form" class="admin-form">'+
      '<div class="admin-field full"><label>Name *</label><input required id="c-name" value="'+esc(value('name'))+'"></div>'+
      '<div class="admin-field"><label>Category *</label><select id="c-cat">'+['cpu','cooler','motherboard','ram','storage','gpu','psu','case','display','peripheral'].map(function(k){return '<option value="'+k+'" '+(value('category')===k?'selected':'')+'>'+k.toUpperCase()+'</option>'}).join('')+'</select></div>'+ 
      '<div class="admin-field"><label>Brand</label><input id="c-brand" value="'+esc(value('brand'))+'"></div>'+ 
      '<div class="admin-field"><label>Price (DH) *</label><input required type="number" min="0" id="c-price" value="'+esc(value('price')||value('best_price'))+'"></div>'+ 
      '<div class="admin-field"><label>Used price (DH)</label><input type="number" min="0" id="c-used-price" value="'+esc(value('used_price'))+'"></div>'+ 
      '<div class="admin-field"><label>Condition</label><select id="c-condition"><option value="new" '+(value('condition')==='new'?'selected':'')+'>New</option><option value="used" '+(value('condition')==='used'?'selected':'')+'>Used</option></select></div>'+ 
      '<div class="admin-field"><label>Store / seller</label><input id="c-store" value="'+esc(value('store'))+'"></div>'+ 
      '<div class="admin-field"><label>Stock</label><select id="c-stock"><option value="in_stock">In stock</option><option value="low_stock">Low stock</option><option value="out_of_stock">Out of stock</option></select></div>'+ 
      '<div class="admin-field full"><label>Offer URL</label><input type="url" id="c-offer" value="'+esc(value('offerUrl'))+'" placeholder="https://..."><span class="admin-help">View offer opens this exact URL.</span></div>'+ 
      '<div class="admin-field full"><label>Specifications</label><textarea id="c-specs" placeholder="Socket: AM5\nVRAM: 12 GB\nBoost: 2.7 GHz">'+esc(specText(ov.specs||x.specs))+'</textarea><span class="admin-help">One line per spec: Key: Value</span></div>'+ 
      '<div class="admin-field"><label>Image file</label><input id="c-image-file" type="file" accept="image/*"></div>'+ 
      '<div class="admin-field"><label>Or image URL</label><input id="c-image-url" value="'+(state.image&&state.image.indexOf('data:')!==0?esc(state.image):'')+'" placeholder="https://..."></div>'+ 
      '<div class="admin-field full"><div class="admin-image-preview" id="admin-image-preview"></div></div>'+ 
      '<div class="admin-field full admin-form-actions"><button class="btn primary" type="submit">'+(isBuilt?'Save override':'Save component')+'</button><button class="btn" id="admin-cancel" type="button">Cancel</button></div>'+ 
      (isBuilt?'<div class="admin-help full">This is a built-in catalogue item. Your changes are stored as an override, so the original seed data remains intact.</div>':'')+ 
      '</form>';
  }

  function prebuiltForm(id){
    var d=read(), custom=(d.prebuilts||[]).filter(function(x){return x.id===id})[0], base=!custom&&builtPrebuilts().filter(function(x){return x.id===id})[0], ov=(d.prebuiltOverrides||{})[id]||{}, x=custom||base||{};
    var isBuilt=!custom&&!!base;
    if(!id){ state.image=''; } state.image=ov.image||x.image||"";
    var val=function(k){return ov[k]!=null?ov[k]:(x[k]!=null?x[k]:"")};
    var parts=ov.partsText || (x.parts||[]).map(function(p){return p.name}).join('\n');
    return '<form id="prebuilt-form" class="admin-form">'+
      '<div class="admin-field full"><label>PC name *</label><input required id="pb-name" value="'+esc(val('title')||val('name'))+'"></div>'+ 
      '<div class="admin-field"><label>Price (DH) *</label><input required type="number" min="0" id="pb-price" value="'+esc(val('price'))+'"></div>'+ 
      '<div class="admin-field"><label>Condition</label><select id="pb-condition"><option value="new" '+(val('condition')==='new'?'selected':'')+'>New</option><option value="used" '+(val('condition')==='used'?'selected':'')+'>Used</option></select></div>'+ 
      '<div class="admin-field"><label>Store / seller</label><input id="pb-store" value="'+esc(val('store'))+'"></div>'+ 
      '<div class="admin-field"><label>Format</label><input id="pb-format" value="'+esc(val('format'))+'"></div>'+ 
      '<div class="admin-field"><label>CPU</label><input id="pb-cpu" value="'+esc(val('cpu'))+'"></div>'+ 
      '<div class="admin-field"><label>GPU</label><input id="pb-gpu" value="'+esc(val('gpu'))+'"></div>'+ 
      '<div class="admin-field"><label>RAM</label><input id="pb-ram" value="'+esc(val('ram'))+'"></div>'+ 
      '<div class="admin-field"><label>Storage</label><input id="pb-storage" value="'+esc(val('storage'))+'"></div>'+ 
      '<div class="admin-field"><label>Motherboard</label><input id="pb-mb" value="'+esc(val('motherboard'))+'"></div>'+ 
      '<div class="admin-field"><label>PSU</label><input id="pb-psu" value="'+esc(val('psu'))+'"></div>'+ 
      '<div class="admin-field"><label>Cooler / Case</label><input id="pb-extra" value="'+esc(val('extra'))+'"></div>'+ 
      '<div class="admin-field full"><label>Parts shown on card (one per line)</label><textarea id="pb-parts">'+esc(parts)+'</textarea></div>'+ 
      '<div class="admin-field full"><label>Description</label><textarea id="pb-desc">'+esc(val('description'))+'</textarea></div>'+ 
      '<div class="admin-field full"><label>Offer URL</label><input type="url" id="pb-offer" value="'+esc(val('offerUrl'))+'" placeholder="https://..."></div>'+ 
      '<div class="admin-field"><label>Image file</label><input id="pb-image-file" type="file" accept="image/*"></div>'+ 
      '<div class="admin-field"><label>Or image URL</label><input id="pb-image-url" value="'+(state.image&&state.image.indexOf('data:')!==0?esc(state.image):'')+'" placeholder="https://..."></div>'+ 
      '<div class="admin-field full"><div class="admin-image-preview" id="admin-image-preview"></div></div>'+ 
      '<div class="admin-field full admin-form-actions"><button class="btn primary" type="submit">'+(isBuilt?'Save override':'Save PC')+'</button><button class="btn" id="admin-cancel" type="button">Cancel</button></div>'+ 
      '</form>';
  }

  function bindImage(fileId,urlId){
    var f=$(fileId),u=$(urlId); if(f)f.onchange=function(){fileToData(this.files[0],function(v){state.image=v;imagePreview(v)})}; if(u)u.oninput=function(){if(this.value.trim()){state.image=this.value.trim();imagePreview(state.image)}}; imagePreview(state.image);
  }

  function saveComponent(id){
    var d=read(), custom=(d.components||[]).filter(function(x){return x.id===id})[0], base=!custom&&allCatalog().filter(function(x){return x.id===id})[0];
    var x={id:id||uid('cmp'),type:'component',name:$('#c-name').value.trim(),category:$('#c-cat').value,brand:$('#c-brand').value.trim()||'Other',price:+$('#c-price').value||0,used_price:+$('#c-used-price').value||0,condition:$('#c-condition').value,store:$('#c-store').value.trim()||'CHECKMYPC.MA',offerUrl:$('#c-offer').value.trim(),stock:$('#c-stock').value,image:state.image||'assets/parts/gpu.svg',specs:parseSpecs($('#c-specs').value),published:true,createdAt:custom?custom.createdAt:Date.now()};
    if(!x.name){toast('Name is required');return}
    if(base&&!custom){d.componentOverrides[id]=x;delete d.hiddenComponents[id];}
    else {var i=d.components.findIndex(function(z){return z.id===x.id});if(i>-1)d.components[i]=x;else d.components.unshift(x)}
    save(d);state.editing=null;state.editKind=null;state.image="";toast('Component saved');render();
  }
  function savePrebuilt(id){
    var d=read(), custom=(d.prebuilts||[]).filter(function(x){return x.id===id})[0], base=!custom&&builtPrebuilts().filter(function(x){return x.id===id})[0];
    var x={id:id||uid('pb'),type:'prebuilt',name:$('#pb-name').value.trim(),title:$('#pb-name').value.trim(),price:+$('#pb-price').value||0,condition:$('#pb-condition').value,store:$('#pb-store').value.trim()||'CHECKMYPC.MA',format:$('#pb-format').value.trim()||'Gaming PC',cpu:$('#pb-cpu').value.trim(),gpu:$('#pb-gpu').value.trim(),ram:$('#pb-ram').value.trim(),storage:$('#pb-storage').value.trim(),motherboard:$('#pb-mb').value.trim(),psu:$('#pb-psu').value.trim(),extra:$('#pb-extra').value.trim(),partsText:$('#pb-parts').value.trim(),description:$('#pb-desc').value.trim(),offerUrl:$('#pb-offer').value.trim()||'#',image:state.image||'assets/parts/gpu.svg',published:true,createdAt:custom?custom.createdAt:Date.now()};
    if(!x.name){toast('Name is required');return}
    if(base&&!custom){d.prebuiltOverrides[id]=x;delete d.hiddenPrebuilts[id];}
    else {var i=d.prebuilts.findIndex(function(z){return z.id===x.id});if(i>-1)d.prebuilts[i]=x;else d.prebuilts.unshift(x)}
    save(d);state.editing=null;state.editKind=null;state.image="";toast('Prebuilt saved');render();
  }

  function renderComponents(){
    var d=read(), base=allCatalog().filter(function(x){return !x.custom}), custom=d.components||[], rows=[];
    base.forEach(function(x){rows.push({x:x,built:true,hidden:!!d.hiddenComponents[x.id]})});
    custom.forEach(function(x){rows.push({x:x,built:false,hidden:false})});
    var host=$('#admin-list'); if(!host)return;
    host.innerHTML=rows.map(function(r){var x=r.x;return '<div class="admin-item"><img src="'+esc(x.image||'assets/parts/gpu.svg')+'" alt=""><div><h3>'+esc(x.name)+'</h3><p>'+esc((x.brand||'Other')+' · '+(x.category||'')+' · '+Number(x.best_price!=null?x.best_price:x.price||0).toLocaleString()+' DH')+'</p><span class="admin-status '+(r.hidden?'draft':'published')+'">'+(r.hidden?'HIDDEN':'VISIBLE')+(r.built?' · BUILT-IN':' · CUSTOM')+'</span></div><div class="admin-item-actions"><button class="btn" data-edit-component="'+esc(x.id)+'">Edit</button><button class="btn" data-toggle-component="'+esc(x.id)+'">'+(r.hidden?'Show':'Hide')+'</button>'+(!r.built?'<button class="btn admin-danger" data-delete-component="'+esc(x.id)+'">Delete</button>':'')+'</div></div>'}).join('');
    $$('[data-edit-component]',host).forEach(function(b){b.onclick=function(){state.editing=this.dataset.editComponent;state.editKind='component';render();window.scrollTo({top:0,behavior:'smooth'})}});
    $$('[data-toggle-component]',host).forEach(function(b){b.onclick=function(){var id=this.dataset.toggleComponent,d=read();d.hiddenComponents[id]=!d.hiddenComponents[id];save(d);render()}});
    $$('[data-delete-component]',host).forEach(function(b){b.onclick=function(){if(!confirm('Delete this custom component?'))return;var id=this.dataset.deleteComponent,d=read();d.components=d.components.filter(function(x){return x.id!==id});save(d);render()}});
  }

  function renderPrebuilts(){
    var d=read(), base=builtPrebuilts(), custom=d.prebuilts||[], rows=[]; base.forEach(function(x){rows.push({x:x,built:true,hidden:!!d.hiddenPrebuilts[x.id]})}); custom.forEach(function(x){rows.push({x:x,built:false,hidden:false})});
    var host=$('#admin-list'); if(!host)return;
    host.innerHTML=rows.map(function(r){var x=r.x,title=x.title||x.name;return '<div class="admin-item"><img src="'+esc(x.image||'assets/parts/gpu.svg')+'" alt=""><div><h3>'+esc(title)+'</h3><p>'+esc((x.cpu||'')+' · '+(x.gpu||'')+' · '+Number(x.price||0).toLocaleString()+' DH')+'</p><span class="admin-status '+(r.hidden?'draft':'published')+'">'+(r.hidden?'HIDDEN':'VISIBLE')+(r.built?' · BUILT-IN':' · CUSTOM')+'</span></div><div class="admin-item-actions"><button class="btn" data-edit-pb="'+esc(x.id)+'">Edit</button><button class="btn" data-toggle-pb="'+esc(x.id)+'">'+(r.hidden?'Show':'Hide')+'</button>'+(!r.built?'<button class="btn admin-danger" data-delete-pb="'+esc(x.id)+'">Delete</button>':'')+'</div></div>'}).join('');
    $$('[data-edit-pb]',host).forEach(function(b){b.onclick=function(){state.editing=this.dataset.editPb;state.editKind='prebuilt';render();window.scrollTo({top:0,behavior:'smooth'})}});
    $$('[data-toggle-pb]',host).forEach(function(b){b.onclick=function(){var id=this.dataset.togglePb,d=read();d.hiddenPrebuilts[id]=!d.hiddenPrebuilts[id];save(d);render()}});
    $$('[data-delete-pb]',host).forEach(function(b){b.onclick=function(){if(!confirm('Delete this custom prebuilt?'))return;var id=this.dataset.deletePb,d=read();d.prebuilts=d.prebuilts.filter(function(x){return x.id!==id});save(d);render()}});
  }

  function contentForm(){
    var s=site(), h=s.home||{}, p=s.pages||{}, f=s.footer||{}, n=s.nav||{};
    var inp=function(id,label,val,full){return '<div class="admin-field '+(full?'full':'')+'"><label>'+label+'</label><input id="'+id+'" value="'+esc(val||'')+'"></div>'};
    var ta=function(id,label,val,full){return '<div class="admin-field '+(full?'full':'')+'"><label>'+label+'</label><textarea id="'+id+'">'+esc(val||'')+'</textarea></div>'};
    return '<form id="content-form">'+
      '<h3 class="admin-subtitle">Global</h3><div class="admin-form">'+inp('s-brand','Brand name',s.brand,true)+inp('s-light','Light logo URL',s.logoLight)+inp('s-dark','Dark logo URL',s.logoDark)+inp('s-footer','Footer tagline',f.tagline,true)+'</div>'+ 
      '<h3 class="admin-subtitle">Navigation labels</h3><div class="admin-form">'+inp('n-builder','System Builder',n.builder)+inp('n-components','Components',n.components)+inp('n-guides','Build Guides',n.guides)+inp('n-prebuilts','Prebuilt PCs',n.prebuilts)+inp('n-trends','Trends',n.trends)+inp('n-mybuild','My Build',n.mybuild)+'</div>'+ 
      '<h3 class="admin-subtitle">Homepage</h3><div class="admin-form">'+inp('h-eyebrow','Eyebrow',h.eyebrow,true)+inp('h-title','Hero title (HTML allowed)',h.title,true)+ta('h-desc','Hero description',h.description,true)+inp('h-build','Build button',h.build)+inp('h-browse','Browse button',h.browse)+inp('h-inspect','Inspection button',h.inspect)+inp('h-ct','Components section title',h.componentsTitle)+inp('h-cd','Components section description',h.componentsDesc)+inp('h-cb','Components button',h.componentsButton)+inp('h-pt','Prebuilt section title',h.prebuiltTitle)+inp('h-pd','Prebuilt section description',h.prebuiltDesc)+inp('h-pb','Prebuilt button',h.prebuiltButton)+'</div>'+ 
      '<h3 class="admin-subtitle">Page titles & descriptions</h3><div class="admin-form">'+Object.keys(p).map(function(k){return '<div class="admin-page-box"><b>'+k+'</b>'+inp('p-'+k+'-eyebrow','Eyebrow',p[k].eyebrow,true)+inp('p-'+k+'-title','Title',p[k].title,true)+ta('p-'+k+'-desc','Description',p[k].description,true)+'</div>'}).join('')+'</div>'+ 
      '<div class="admin-form-actions"><button class="btn primary" type="submit">Save website content</button></div></form>';
  }
  function saveContent(){
    var d=read(),s=d.site||{}, old=site(); s.brand=$('#s-brand').value.trim()||old.brand;s.logoLight=$('#s-light').value.trim()||old.logoLight;s.logoDark=$('#s-dark').value.trim()||old.logoDark;s.footer=s.footer||{};s.footer.tagline=$('#s-footer').value.trim();s.nav={builder:$('#n-builder').value,components:$('#n-components').value,guides:$('#n-guides').value,prebuilts:$('#n-prebuilts').value,trends:$('#n-trends').value,mybuild:$('#n-mybuild').value};s.home={eyebrow:$('#h-eyebrow').value,title:$('#h-title').value,description:$('#h-desc').value,build:$('#h-build').value,browse:$('#h-browse').value,inspect:$('#h-inspect').value,componentsTitle:$('#h-ct').value,componentsDesc:$('#h-cd').value,componentsButton:$('#h-cb').value,prebuiltTitle:$('#h-pt').value,prebuiltDesc:$('#h-pd').value,prebuiltButton:$('#h-pb').value};s.pages=s.pages||{};Object.keys(s.pages).forEach(function(k){s.pages[k]={eyebrow:$('#p-'+k+'-eyebrow').value,title:$('#p-'+k+'-title').value,description:$('#p-'+k+'-desc').value}});d.site=s;save(d);toast('Website content saved. Refresh public pages to see it.');render();}

  function categoriesForm(){
    var base=(window.CHECKMYPC_CATALOG||{}).categories||[], d=read(), custom=(d.site&&d.site.categories)||[];
    var rows=base.map(function(c){var o=custom.filter(function(x){return x.slug===c.slug})[0]||{};return {slug:c.slug,label:o.label||c.label,description:o.description||'Compare prices across Moroccan stores.',icon:o.icon||c.icon,visible:o.visible!==false}});
    return '<div class="category-admin-grid">'+rows.map(function(c){return '<div class="category-admin-row"><div><b>'+esc(c.slug)+'</b><span>Base category</span></div><input data-cat-label="'+c.slug+'" value="'+esc(c.label)+'"><input data-cat-desc="'+c.slug+'" value="'+esc(c.description)+'"><input data-cat-icon="'+c.slug+'" value="'+esc(c.icon)+'"><label><input type="checkbox" data-cat-visible="'+c.slug+'" '+(c.visible?'checked':'')+'> Visible</label></div>'}).join('')+'</div><div class="admin-form-actions"><button class="btn primary" id="save-categories">Save categories</button></div>';
  }
  function saveCategories(){
    var d=read(), base=(window.CHECKMYPC_CATALOG||{}).categories||[];d.site=d.site||{};d.site.categories=base.map(function(c){var slug=c.slug;return {slug:slug,label:($('[data-cat-label="'+slug+'"]')||{}).value||c.label,description:($('[data-cat-desc="'+slug+'"]')||{}).value||'',icon:($('[data-cat-icon="'+slug+'"]')||{}).value||c.icon,visible:$('[data-cat-visible="'+slug+'"]')?$('[data-cat-visible="'+slug+'"]') .checked:true}});save(d);toast('Categories saved');render();}

  function render(){
    var host=$('#admin-main'); if(!host)return;
    var title={dashboard:'Dashboard',components:'Components manager',prebuilt:'Prebuilt PCs manager',content:'Website content editor',categories:'Categories manager',data:'Data & backup'}[state.tab]||'Admin';
    $('#admin-section-title').textContent=title;
    if(state.tab==='dashboard'){host.innerHTML=dashboard();$$('[data-go]',host).forEach(function(b){b.onclick=function(){setTab(this.dataset.go)}});return}
    if(state.tab==='components'){
      var form=state.editKind==='component'?componentForm(state.editing):'<div class="admin-empty">Select a component to edit, or click <b>+ Add component</b>.</div>';
      host.innerHTML='<div class="admin-split"><section class="admin-card"><h2>'+(state.editing?'Edit component':'Component editor')+'</h2>'+form+'</section><section class="admin-card"><div class="admin-list-head"><div><h2>All components</h2><p>Built-in and your own listings. Edit names, prices, specs, images and offer links.</p></div><button class="btn primary" id="add-component">+ Add component</button></div><div class="admin-list" id="admin-list"></div></section></div>';
      $('#add-component').onclick=function(){state.editing=null;state.editKind='component';render()};
      if(state.editing)$('#admin-cancel').onclick=function(){state.editing=null;state.editKind=null;state.image='';render()};
      if(state.editing){var sd=read(),co=(sd.componentOverrides||{})[state.editing]||((sd.components||[]).filter(function(z){return z.id===state.editing})[0]||{}); if($('#c-stock')) $('#c-stock').value=co.stock||'in_stock'; bindImage('#c-image-file','#c-image-url');$('#component-form').onsubmit=function(e){e.preventDefault();saveComponent(state.editing)}}
      renderComponents();return;
    }
    if(state.tab==='prebuilt'){
      var formp=state.editKind==='prebuilt'?prebuiltForm(state.editing):'<div class="admin-empty">Select a prebuilt to edit, or click <b>+ Add prebuilt</b>.</div>';
      host.innerHTML='<div class="admin-split"><section class="admin-card"><h2>'+(state.editing?'Edit prebuilt':'Prebuilt editor')+'</h2>'+formp+'</section><section class="admin-card"><div class="admin-list-head"><div><h2>All prebuilt PCs</h2><p>Built-in and custom systems. Change every visible field and the View offer destination.</p></div><button class="btn primary" id="add-pb">+ Add prebuilt</button></div><div class="admin-list" id="admin-list"></div></section></div>';
      $('#add-pb').onclick=function(){state.editing=null;state.editKind='prebuilt';render()};
      if(state.editing)$('#admin-cancel').onclick=function(){state.editing=null;state.editKind=null;state.image='';render()};
      if(state.editing){bindImage('#pb-image-file','#pb-image-url');$('#prebuilt-form').onsubmit=function(e){e.preventDefault();savePrebuilt(state.editing)}}
      renderPrebuilts();return;
    }
    if(state.tab==='content'){
      host.innerHTML='<section class="admin-card">'+contentForm()+'</section>';$('#content-form').onsubmit=function(e){e.preventDefault();saveContent()};return;
    }
    if(state.tab==='categories'){
      host.innerHTML='<section class="admin-card"><h2>Categories</h2><p>Edit the category names/descriptions/icons used around the public site.</p>'+categoriesForm()+'</section>';$('#save-categories').onclick=function(e){e.preventDefault();saveCategories()};return;
    }
    if(state.tab==='data'){
      host.innerHTML='<section class="admin-card"><h2>Data & backup</h2><p>Keep a JSON backup before moving the project or clearing browser data.</p><div class="admin-quick"><button class="btn primary" id="export-data">Export full admin data</button><label class="btn" for="import-data">Import JSON</label><input hidden id="import-data" type="file" accept="application/json"><button class="btn admin-danger" id="reset-admin">Reset admin data</button></div><div class="admin-note"><b>Important:</b> this prototype uses browser localStorage. It is not a real server CMS. localStorage is tied to the current origin/browser, so other visitors and other devices do not automatically receive your changes. A backend/database is required for true public publishing. citeturn0search4</div></section>';
      $('#export-data').onclick=function(){var blob=new Blob([JSON.stringify(read(),null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='checkmypc-admin-full-backup.json';a.click();setTimeout(function(){URL.revokeObjectURL(a.href)},500)};
      $('#import-data').onchange=function(){var f=this.files[0];if(!f)return;var r=new FileReader();r.onload=function(){try{var x=JSON.parse(r.result);save(x);toast('Backup imported');render()}catch(e){toast('Invalid JSON backup')}};r.readAsText(f);this.value=''};
      $('#reset-admin').onclick=function(){if(confirm('Reset all admin overrides, custom listings and website content?')){localStorage.removeItem(KEY);location.reload()}};return;
    }
  }

  document.addEventListener('DOMContentLoaded',function(){
    $$('.admin-tab').forEach(function(b){b.onclick=function(){setTab(this.dataset.tab)}});
    setTab('dashboard');
  });
})();
