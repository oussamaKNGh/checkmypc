// =======================================
// COMPONENTS
// PC REPORT SYSTEM
// =======================================


// ==========================
// CARD
// ==========================

function createCard(title, content) {

    return `
        <div class="card-box">

            <h3 class="mb-4">${title}</h3>

            ${content}

        </div>
    `;

}



// ==========================
// INPUT
// ==========================

function createInput(id, label, type = "text", placeholder = "") {

    return `

<div class="mb-3">

<label class="form-label">

${label}

</label>

<input

type="${type}"

id="${id}"

placeholder="${placeholder}"

class="form-control"

>

</div>

`;

}



// ==========================
// SELECT
// ==========================

function createSelect(id, label, options = []) {

    let html = `

<div class="mb-3">

<label class="form-label">

${label}

</label>

<select

id="${id}"

class="form-select">

`;

    options.forEach(option => {

        html += `

<option value="${option}">

${option}

</option>

`;

    });

    html += `

</select>

</div>

`;

    return html;

}



// ==========================
// TEXTAREA
// ==========================

function createTextarea(id, label) {

    return `

<div class="mb-3">

<label class="form-label">

${label}

</label>

<textarea

id="${id}"

rows="5"

class="form-control">

</textarea>

</div>

`;

}



// ==========================
// STATUS
// ==========================

function createStatus(id) {

    return createSelect(

        id,

        "الحالة",

        DATA.status

    );

}



// ==========================
// BUTTON
// ==========================

function createButton(id, text, color = "primary") {

    return `

<button

id="${id}"

class="btn btn-${color}">

${text}

</button>

`;

}



// ==========================
// UPLOAD
// ==========================

function createUpload(id) {

    return `

<div class="mb-3">

<label class="form-label">

الصور

</label>

<input

type="file"

id="${id}"

multiple

accept="image/*"

class="form-control"

>

</div>

`;

}



// ==========================
// ROW
// ==========================

function createRow(content){

return `

<div class="row g-3">

${content}

</div>

`;

}



// ==========================
// COLUMN
// ==========================

function createCol(content,size=6){

return `

<div class="col-md-${size}">

${content}

</div>

`;

}