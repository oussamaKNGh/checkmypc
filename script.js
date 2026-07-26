// =======================================
// PC REPORT SYSTEM
// script.js
// Part 1
// =======================================

const content = document.getElementById("pageContent");

// ----------------------------
// Pages
// ----------------------------

const pages = {

customer: renderCustomer,

cpu: renderCPU,

gpu: renderComingSoon,

ram: renderComingSoon,

storage: renderComingSoon,

motherboard: renderComingSoon,

photos: renderComingSoon,

result: renderComingSoon,

pdf: renderComingSoon

};

// ----------------------------
// Sidebar
// ----------------------------

document
.querySelectorAll(".sidebar li")
.forEach(item=>{

item.addEventListener("click",()=>{

document
.querySelectorAll(".sidebar li")
.forEach(x=>x.classList.remove("active"));

item.classList.add("active");

const page=item.dataset.page;

pages[page]();

});

});

// ----------------------------
// Customer Page
// ----------------------------

function renderCustomer(){

content.innerHTML=

createCard(

"👤 معلومات الزبون",

createRow(

createCol(

createInput(

"customerName",

"اسم الزبون"

)

)

+

createCol(

createInput(

"customerPhone",

"رقم الهاتف"

)

)

)

+

createRow(

createCol(

createInput(

"sellerName",

"اسم البائع"

)

)

+

createCol(

createInput(

"reportDate",

"التاريخ",

"date"

)

)

)

+

createTextarea(

"notes",

"ملاحظات"

)

+

createButton(

"saveCustomer",

"حفظ المعلومات"

)

);

}

// ----------------------------
// CPU
// ----------------------------

function renderCPU(){

content.innerHTML=

createCard(

"💻 معلومات المعالج",

createRow(

createCol(

createSelect(

"cpuBrand",

"الشركة",

Object.keys(DATA.cpu)

)

)

+

createCol(

createSelect(

"cpuFamily",

"الفئة",

[]

)

)

)

+

createRow(

createCol(

createSelect(

"cpuModel",

"الموديل",

[]

)

)

+

createCol(

createStatus(

"cpuStatus"

)

)

)

);

loadCPU();

}

// ----------------------------
// CPU Engine
// ----------------------------

function loadCPU(){

const brand=document.getElementById("cpuBrand");

const family=document.getElementById("cpuFamily");

const model=document.getElementById("cpuModel");

function loadFamilies(){

family.innerHTML="";

Object
.keys(DATA.cpu[brand.value])
.forEach(f=>{

family.innerHTML+=`<option>${f}</option>`;

});

loadModels();

}

function loadModels(){

model.innerHTML="";

DATA
.cpu[brand.value][family.value]
.forEach(m=>{

model.innerHTML+=`<option>${m}</option>`;

});

}

brand.onchange=loadFamilies;

family.onchange=loadModels;

loadFamilies();

}

// ----------------------------
// Coming Soon
// ----------------------------

function renderComingSoon(){

content.innerHTML=

createCard(

"🚧",

"<h4 class='text-center'>قريباً</h4>"

);

}

// ----------------------------
// Start
// ----------------------------

renderCustomer();
// =======================================
// PART 2
// GPU
// =======================================

function renderGPU(){

content.innerHTML=

createCard(

"🎮 كارت الشاشة",

createRow(

createCol(

createSelect(

"gpuBrand",

"الشركة",

Object.keys(DATA.gpu)

)

)

+

createCol(

createSelect(

"gpuModel",

"الموديل",

[]

)

)

)

+

createRow(

createCol(

createInput(

"gpuTemp",

"درجة الحرارة °C",

"number"

)

)

+

createCol(

createStatus(

"gpuStatus"

)

)

)

);

loadGPU();

}

function loadGPU(){

const brand=document.getElementById("gpuBrand");

const model=document.getElementById("gpuModel");

model.innerHTML="";

DATA.gpu[brand.value].forEach(g=>{

model.innerHTML+=`<option>${g}</option>`;

});

brand.onchange=function(){

model.innerHTML="";

DATA.gpu[brand.value].forEach(g=>{

model.innerHTML+=`<option>${g}</option>`;

});

};

}

// =======================================
// RAM
// =======================================

function renderRAM(){

content.innerHTML=

createCard(

"🧠 RAM",

createRow(

createCol(

createSelect(

"ramSize",

"السعة",

DATA.ram.size

)

)

+

createCol(

createSelect(

"ramType",

"النوع",

DATA.ram.type

)

)

)

+

createRow(

createCol(

createSelect(

"ramSpeed",

"التردد",

DATA.ram.speed

)

)

+

createCol(

createStatus(

"ramStatus"

)

)

)

);

}

// =======================================
// STORAGE
// =======================================

function renderStorage(){

content.innerHTML=

createCard(

"💾 التخزين",

createRow(

createCol(

createSelect(

"storageType",

"النوع",

DATA.storage.type

)

)

+

createCol(

createSelect(

"storageSize",

"السعة",

DATA.storage.size

)

)

)

+

createRow(

createCol(

createInput(

"storageHealth",

"الصحة %",

"number"

)

)

+

createCol(

createStatus(

"storageStatus"

)

)

)

);

}

// =======================================
// UPDATE ROUTER
// =======================================

pages.gpu=renderGPU;

pages.ram=renderRAM;

pages.storage=renderStorage;