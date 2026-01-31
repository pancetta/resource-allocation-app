/**********************
* IndexedDB
**********************/
const DB_NAME="resource-planning";
const DB_VERSION=2;
let db;
async function openDatabase(){return new Promise((resolve,reject)=>{const request=indexedDB.open(DB_NAME,DB_VERSION);request.onupgradeneeded=(e)=>{const db=e.target.result;if(!db.objectStoreNames.contains("people"))db.createObjectStore("people",{keyPath:"id"});if(!db.objectStoreNames.contains("projects"))db.createObjectStore("projects",{keyPath:"id"});if(!db.objectStoreNames.contains("defaultAllocations"))db.createObjectStore("defaultAllocations",{keyPath:"id",autoIncrement:true});};request.onsuccess=(e)=>{db=e.target.result;resolve(db)};request.onerror=(e)=>reject(e.target.error);});}
function getAll(storeName){return new Promise((resolve,reject)=>{const tx=db.transaction(storeName,"readonly");const store=tx.objectStore(storeName);const req=store.getAll();req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}

/**********************
* DAL
**********************/
async function getPeople(){return getAll("people");}
async function addPerson(p){const tx=db.transaction("people","readwrite");tx.objectStore("people").add(p);return tx.complete;}
async function updatePerson(p){const tx=db.transaction("people","readwrite");tx.objectStore("people").put(p);return tx.complete;}
async function deletePersonRow(id){await db.transaction("people","readwrite").objectStore("people").delete(id);renderPeople();}
async function getProjects(){return getAll("projects");}
async function addProject(p){const tx=db.transaction("projects","readwrite");tx.objectStore("projects").add(p);return tx.complete;}
async function updateProject(p){const tx=db.transaction("projects","readwrite").objectStore("projects").put(p);return tx.complete;}
async function deleteProjectRow(id){await db.transaction("projects","readwrite").objectStore("projects").delete(id);renderProjects();}
async function getAllocations(){return getAll("defaultAllocations");}
async function addAllocation(a){const tx=db.transaction("defaultAllocations","readwrite").objectStore("defaultAllocations").add(a);return tx.complete;}
async function updateAllocation(a){const tx=db.transaction("defaultAllocations","readwrite").objectStore("defaultAllocations").put(a);return tx.complete;}
async function deleteAllocationRow(id){await db.transaction("defaultAllocations","readwrite").objectStore("defaultAllocations").delete(id);renderAllocations();}

/**********************
* Tabs with last active
**********************/
document.querySelectorAll(".tab-button").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".tab-button").forEach(b=>b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c=>c.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
    localStorage.setItem("lastActiveTab", btn.dataset.tab);
  });
});

/**********************
* Auto-generate IDs
**********************/
async function addPersonAuto(name){
  const people=await getPeople();
  const maxNum=people.reduce((max,p)=>{const m=p.id.match(/^p(\d+)$/);return m?Math.max(max,parseInt(m[1])):max;},0);
  const id=`p${String(maxNum+1).padStart(3,'0')}`;
  await addPerson({id,name,active:true,fte:1});
  renderPeople();
}
async function addProjectAuto(name){
  const projects=await getProjects();
  const maxNum=projects.reduce((max,p)=>{const m=p.id.match(/^proj(\d+)$/);return m?Math.max(max,parseInt(m[1])):max;},0);
  const id=`proj${String(maxNum+1).padStart(3,'0')}`;
  await addProject({id,name,plannedPM:0});
  renderProjects();
}

/**********************
* Render
**********************/
async function renderPeople(){
  const tbody=document.querySelector("#peopleTable tbody");
  tbody.innerHTML="";
  const people=await getPeople();
  people.forEach(p=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td contenteditable="true" onblur="updatePersonName('${p.id}',this.textContent)">${p.name}</td>
<td contenteditable="true" onblur="updatePersonFTE('${p.id}',this.textContent)">${p.fte ?? 1}</td>
<td><input type="checkbox" ${p.active?"checked":""} onchange="togglePersonActive('${p.id}',this.checked)"></td>
<td><button onclick="deletePersonRow('${p.id}')">Delete</button></td>`;
    tbody.appendChild(tr);
  });
  populatePersonSelect();
}

async function renderProjects(){
  const tbody=document.querySelector("#projectsTable tbody");
  tbody.innerHTML="";
  const projects=await getProjects();
  projects.forEach(p=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td contenteditable="true" onblur="updateProjectName('${p.id}',this.textContent)">${p.name}</td>
<td contenteditable="true" onblur="updateProjectPM('${p.id}',this.textContent)">${p.plannedPM ?? 0}</td>
<td><button onclick="deleteProjectRow('${p.id}')">Delete</button></td>`;
    tbody.appendChild(tr);
  });
  populateProjectSelect();
}

async function renderAllocations(){
  const tbody=document.querySelector("#allocationsTable tbody");
  tbody.innerHTML="";
  const allocs=await getAllocations();
  const people=await getPeople();
  const projects=await getProjects();
  allocs.forEach(a=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td><select onchange="editAllocationPerson(this,${a.id})">${people.filter(p=>p.active).map(p=>`<option value="${p.id}" ${p.id===a.personId?'selected':''}>${p.name}</option>`).join('')}</select></td>
<td><select onchange="editAllocationProject(this,${a.id})">${projects.map(p=>`<option value="${p.id}" ${p.id===a.projectId?'selected':''}>${p.name}</option>`).join('')}</select></td>
<td><input type="number" step="0.01" min="0" max="1" value="${a.pct}" onblur="editAllocationPct(this,${a.id})"></td>
<td><input type="month" value="${a.startMonth}" onblur="editAllocationStart(this,${a.id})"></td>
<td><input type="month" value="${a.endMonth??''}" onblur="editAllocationEnd(this,${a.id})"></td>
<td><button onclick="deleteAllocationRow(${a.id})">Delete</button></td>`;
    tbody.appendChild(tr);
  });
}

/**********************
* Populate selects
**********************/
async function populatePersonSelect(){const s=document.getElementById("personSelect");s.innerHTML="";(await getPeople()).filter(p=>p.active).forEach(p=>{const o=document.createElement("option");o.value=p.id;o.textContent=p.name;s.appendChild(o);});}
async function populateProjectSelect(){const s=document.getElementById("projectSelect");s.innerHTML="";(await getProjects()).forEach(p=>{const o=document.createElement("option");o.value=p.id;o.textContent=p.name;s.appendChild(o);});}

/**********************
* Edit handlers
**********************/
async function updatePersonName(id,val){const p=(await getPeople()).find(x=>x.id===id);p.name=val;await updatePerson(p);populatePersonSelect();}
async function updatePersonFTE(id,val){const p=(await getPeople()).find(x=>x.id===id);p.fte=parseFloat(val);await updatePerson(p);}
async function togglePersonActive(id,checked){const p=(await getPeople()).find(x=>x.id===id);p.active=checked;await updatePerson(p);populatePersonSelect();}
async function updateProjectName(id,val){const p=(await getProjects()).find(x=>x.id===id);p.name=val;await updateProject(p);populateProjectSelect();}
async function updateProjectPM(id,val){const p=(await getProjects()).find(x=>x.id===id);p.plannedPM=parseFloat(val);await updateProject(p);}
async function editAllocationPerson(sel,id){const a=(await getAllocations()).find(x=>x.id===id);a.personId=sel.value;await updateAllocation(a);}
async function editAllocationProject(sel,id){const a=(await getAllocations()).find(x=>x.id===id);a.projectId=sel.value;await updateAllocation(a);}
async function editAllocationPct(inp,id){const a=(await getAllocations()).find(x=>x.id===id);a.pct=parseFloat(inp.value);await updateAllocation(a);}
async function editAllocationStart(inp,id){const a=(await getAllocations()).find(x=>x.id===id);a.startMonth=inp.value;await updateAllocation(a);}
async function editAllocationEnd(inp,id){const a=(await getAllocations()).find(x=>x.id===id);a.endMonth=inp.value;await updateAllocation(a);}

/**********************
* Add buttons
**********************/
document.getElementById("addPersonBtn").addEventListener("click",async()=>{
  const name=prompt("Person name");
  if(name) await addPersonAuto(name);
});
document.getElementById("addProjectBtn").addEventListener("click",async()=>{
  const name=prompt("Project name");
  if(name) await addProjectAuto(name);
});
document.getElementById("addAllocationBtn").addEventListener("click",async()=>{
  await addAllocation({
    personId:document.getElementById("personSelect").value,
    projectId:document.getElementById("projectSelect").value,
    pct:parseFloat(document.getElementById("pctInput").value),
    startMonth:document.getElementById("startMonthInput").value,
    endMonth:document.getElementById("endMonthInput").value || null
  });
  renderAllocations();
});

/**********************
* Calculation and results
**********************/
// [Monthly, Yearly, Project×Month calculation code goes here]
// With column totals and cell-only highlighting as discussed

/**********************
* Fixed Calculation & Reporting Functions
**********************/

// Helper to apply correct/warning classes
function cellClass(actual, expected) {
  if (actual === expected) return 'correct';
  return 'warning';
}

/**********************
* Monthly Report
**********************/
async function calculateMonth(month) {
  const people = await getPeople();
  const projects = await getProjects();
  const allocations = await getAllocations();
  const resultsOutput = document.getElementById("resultsOutput");
  resultsOutput.innerHTML = `<h3>Monthly Report ${month}</h3>`;

  // --- Person table ---
  const personTable = document.createElement("table");
  const pHeader = ["Person", ...projects.map(p=>p.name), "Total", "FTE", "Delta"];
  personTable.innerHTML = `<thead><tr>${pHeader.map(h=>`<th>${h}</th>`).join('')}</tr></thead>`;
  const pTbody = document.createElement("tbody");

  people.forEach(p => {
    const fte = p.fte ?? 1;
    let total = 0;
    const cells = projects.map(proj => {
      const alloc = allocations.filter(a => a.personId === p.id && a.projectId === proj.id
        && a.startMonth <= month && (!a.endMonth || a.endMonth >= month));
      const pm = alloc.reduce((s,a)=>s + a.pct*fte, 0);
      total += pm;
      return pm;
    });
    const delta = total - fte;
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${p.name}</td>` +
      cells.map(c => `<td class="${cellClass(c, fte/projects.length)}">${c.toFixed(2)}</td>`).join('') +
      `<td class="${cellClass(total, fte)}">${total.toFixed(2)}</td>` +
      `<td>${fte.toFixed(2)}</td>` +
      `<td class="${cellClass(delta,0)}">${delta.toFixed(2)}</td>`;
    pTbody.appendChild(tr);
  });

  // Column totals
  const tfoot = document.createElement("tfoot");
  const sumRow = document.createElement("tr");
  sumRow.innerHTML = `<td><strong>Total</strong></td>` +
    projects.map(proj => {
      let sum = 0;
      people.forEach(p => {
        const fte = p.fte ?? 1;
        const alloc = allocations.filter(a => a.personId === p.id && a.projectId === proj.id
          && a.startMonth <= month && (!a.endMonth || a.endMonth >= month));
        sum += alloc.reduce((s,a)=>s + a.pct*fte,0);
      });
      return `<td class="${cellClass(sum, sum)}"><strong>${sum.toFixed(2)}</strong></td>`; // totals assumed correct
    }).join('') +
    `<td></td><td></td><td></td>`; // Total, FTE, Delta columns
  tfoot.appendChild(sumRow);
  pTbody.appendChild(tfoot);

  personTable.appendChild(pTbody);
  resultsOutput.appendChild(personTable);

  // --- Project table ---
  const projTable = document.createElement("table");
  const projHeader = ["Project", "Allocated PM", "Planned PM", "Delta"];
  projTable.innerHTML = `<thead><tr>${projHeader.map(h=>`<th>${h}</th>`).join('')}</tr></thead>`;
  const projTbody = document.createElement("tbody");

  projects.forEach(proj => {
    let total = 0;
    people.forEach(p => {
      const fte = p.fte ?? 1;
      const alloc = allocations.filter(a => a.personId===p.id && a.projectId===proj.id
        && a.startMonth<=month && (!a.endMonth || a.endMonth>=month));
      total += alloc.reduce((s,a)=>s + a.pct*fte,0);
    });
    const planned = proj.plannedPM ?? 0;
    const delta = total - planned;
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${proj.name}</td>` +
      `<td class="${cellClass(total, planned)}">${total.toFixed(2)}</td>` +
      `<td>${planned.toFixed(2)}</td>` +
      `<td class="${cellClass(delta,0)}">${delta.toFixed(2)}</td>`;
    projTbody.appendChild(tr);
  });

  projTable.appendChild(projTbody);
  resultsOutput.appendChild(projTable);
}

async function calculateYear(year){
  const people = await getPeople();
  const projects = await getProjects();
  const allocations = await getAllocations();
  const resultsOutput = document.getElementById("resultsOutput");
  resultsOutput.innerHTML = `<h3>Yearly Overview ${year}</h3>`;

  const months = Array.from({length:12},(_,i)=>`${year}-${String(i+1).padStart(2,'0')}`);

  // --- People × Months Table ---
  const personTable = document.createElement("table");
  const pHeader = ["Person", ...months, "Total", "FTE", "Delta"];
  personTable.innerHTML = `<thead><tr>${pHeader.map(h=>`<th>${h}</th>`).join('')}</tr></thead>`;
  const pTbody = document.createElement("tbody");

  people.forEach(p=>{
    const fte = p.fte ?? 1;
    let total = 0;
    const cells = months.map(m=>{
      const alloc = allocations.filter(a=>a.personId===p.id && a.startMonth<=m && (!a.endMonth || a.endMonth>=m));
      const pm = alloc.reduce((s,a)=>s + a.pct*fte,0);
      total += pm;
      return pm;
    });
    const delta = total - (fte*12);
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${p.name}</td>` +
      cells.map(c=>`<td class="${cellClass(c,fte)}">${c.toFixed(2)}</td>`).join('') +
      `<td class="${cellClass(total,fte*12)}">${total.toFixed(2)}</td>` +
      `<td>${(fte*12).toFixed(2)}</td>` +
      `<td class="${cellClass(delta,0)}">${delta.toFixed(2)}</td>`;
    pTbody.appendChild(tr);
  });

  // --- Totals Row ---
  const tfoot = document.createElement("tfoot");
  const sumRow = document.createElement("tr");

  // Person column label
  const totalLabel = `<td><strong>Total</strong></td>`;

  // Month sums
  const monthSums = months.map(m=>{
    let sum = 0;
    people.forEach(p=>{
      const fte = p.fte ?? 1;
      const alloc = allocations.filter(a=>a.personId===p.id && a.startMonth<=m && (!a.endMonth || a.endMonth>=m));
      sum += alloc.reduce((s,a)=>s + a.pct*fte,0);
    });
    return `<td class="${cellClass(sum,sum)}"><strong>${sum.toFixed(2)}</strong></td>`;
  }).join('');

  // Total sum
  const totalSum = people.reduce((sum,p)=>{
    const fte = p.fte ??1;
    let s=0;
    months.forEach(m=>{
      const alloc = allocations.filter(a=>a.personId===p.id && a.startMonth<=m && (!a.endMonth || a.endMonth>=m));
      s += alloc.reduce((s,a)=>s + a.pct*fte,0);
    });
    return sum + s;
  },0);

  // FTE sum
  const fteSum = people.reduce((sum,p)=>sum + (p.fte??1)*12,0);
  const deltaSum = totalSum - fteSum;

  const totalCells = `<td class="${cellClass(totalSum,totalSum)}"><strong>${totalSum.toFixed(2)}</strong></td>` +
                     `<td>${fteSum.toFixed(2)}</td>` +
                     `<td class="${cellClass(deltaSum,0)}">${deltaSum.toFixed(2)}</td>`;

  sumRow.innerHTML = totalLabel + monthSums + totalCells;
  tfoot.appendChild(sumRow);
  
  personTable.appendChild(pTbody);
  personTable.appendChild(tfoot);
  resultsOutput.appendChild(personTable);

  // --- Project × Months Table ---
  const projTable = document.createElement("table");
  const projHeader = ["Project", ...months, "Total", "Planned", "Delta"];
  projTable.innerHTML = `<thead><tr>${projHeader.map(h=>`<th>${h}</th>`).join('')}</tr></thead>`;
  const projTbody = document.createElement("tbody");

  projects.forEach(p=>{
    let total = 0;
    const cells = months.map(m=>{
      let pm = 0;
      people.forEach(person=>{
        const fte = person.fte??1;
        const alloc = allocations.filter(a=>a.projectId===p.id && a.personId===person.id && a.startMonth<=m && (!a.endMonth || a.endMonth>=m));
        pm += alloc.reduce((s,a)=>s+a.pct*fte,0);
      });
      total += pm;
      return pm;
    });

    const plannedTotal = (p.plannedPM??0)*12;
    const delta = total - plannedTotal;
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${p.name}</td>` +
      cells.map(c=>`<td class="${cellClass(c,p.plannedPM??0)}">${c.toFixed(2)}</td>`).join('') +
      `<td class="${cellClass(total,plannedTotal)}">${total.toFixed(2)}</td>` +
      `<td>${plannedTotal.toFixed(2)}</td>` +
      `<td class="${cellClass(delta,0)}">${delta.toFixed(2)}</td>`;
    projTbody.appendChild(tr);
  });

  // Totals row for projects
  const tfootProj = document.createElement("tfoot");
  const sumRowProj = document.createElement("tr");

  const totalLabelProj = `<td><strong>Total</strong></td>`;

  const monthSumsProj = months.map(m=>{
    let sum = 0;
    projects.forEach(p=>{
      people.forEach(person=>{
        const fte = person.fte??1;
        const alloc = allocations.filter(a=>a.projectId===p.id && a.personId===person.id && a.startMonth<=m && (!a.endMonth || a.endMonth>=m));
        sum += alloc.reduce((s,a)=>s + a.pct*fte,0);
      });
    });
    return `<td class="${cellClass(sum,sum)}"><strong>${sum.toFixed(2)}</strong></td>`;
  }).join('');

  const totalSumProj = projects.reduce((sum,p)=>{
    let s = 0;
    people.forEach(person=>{
      const fte = person.fte??1;
      months.forEach(m=>{
        const alloc = allocations.filter(a=>a.projectId===p.id && a.personId===person.id && a.startMonth<=m && (!a.endMonth || a.endMonth>=m));
        s += alloc.reduce((s,a)=>s+a.pct*fte,0);
      });
    });
    return sum+s;
  },0);

  const plannedSumProj = projects.reduce((sum,p)=>(sum + (p.plannedPM??0)*12),0);
  const deltaSumProj = totalSumProj - plannedSumProj;

  const totalCellsProj = `<td class="${cellClass(totalSumProj,plannedSumProj)}">${totalSumProj.toFixed(2)}</td>` +
                         `<td>${plannedSumProj.toFixed(2)}</td>` +
                         `<td class="${cellClass(deltaSumProj,0)}">${deltaSumProj.toFixed(2)}</td>`;

  sumRowProj.innerHTML = totalLabelProj + monthSumsProj + totalCellsProj;
  tfootProj.appendChild(sumRowProj);
  projTable.appendChild(projTbody);
  projTable.appendChild(tfootProj);

  resultsOutput.appendChild(projTable);
}


/**********************
* Project × Month Overview
**********************/
async function renderProjectMonthlyOverview(year){
  const projects=await getProjects();
  const people=await getPeople();
  const allocations=await getAllocations();
  const resultsOutput=document.getElementById("resultsOutput");
  resultsOutput.innerHTML=`<h3>Project × Month Overview ${year}</h3>`;

  const months=Array.from({length:12},(_,i)=>`${year}-${String(i+1).padStart(2,'0')}`);
  const table=document.createElement("table");
  const header=["Project",...months,"Total","Planned","Delta"];
  table.innerHTML=`<thead><tr>${header.map(h=>`<th>${h}</th>`).join('')}</tr></thead>`;
  const tbody=document.createElement("tbody");

  projects.forEach(p=>{
    let total=0;
    const cells=months.map(month=>{
      let pm=0;
      people.forEach(person=>{
        const fte=person.fte??1;
        const alloc=allocations.filter(a=>a.projectId===p.id && a.personId===person.id && a.startMonth<=month && (!a.endMonth || a.endMonth>=month));
        pm+=alloc.reduce((s,a)=>s+a.pct*fte,0);
      });
      total+=pm;
      return pm;
    });

    const plannedTotal=(p.plannedPM??0)*12;
    const delta=total-plannedTotal;
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${p.name}</td>`+
      cells.map(c=>`<td class="${cellClass(c,p.plannedPM??0)}">${c.toFixed(2)}</td>`).join('')+
      `<td class="${cellClass(total,plannedTotal)}">${total.toFixed(2)}</td>`+
      `<td>${plannedTotal.toFixed(2)}</td>`+
      `<td class="${cellClass(delta,0)}">${delta.toFixed(2)}</td>`;
    tbody.appendChild(tr);
  });

  // Column totals
  const tfoot=document.createElement("tfoot");
  const sumRow=document.createElement("tr");
  sumRow.innerHTML=`<td><strong>Total</strong></td>`+
    months.map(month=>{
      let monthSum=0;
      projects.forEach(p=>{
        people.forEach(person=>{
          const fte=person.fte??1;
          const alloc=allocations.filter(a=>a.projectId===p.id && a.personId===person.id && a.startMonth<=month && (!a.endMonth || a.endMonth>=month));
          monthSum+=alloc.reduce((s,a)=>s+a.pct*fte,0);
        });
      });
      return `<td class="${cellClass(monthSum,monthSum)}"><strong>${monthSum.toFixed(2)}</strong></td>`;
    }).join('')+
    `<td></td><td></td><td></td>`; // Total, Planned, Delta
  tfoot.appendChild(sumRow);
  table.appendChild(tbody);
  table.appendChild(tfoot);
  resultsOutput.appendChild(table);
}


/**********************
* Buttons bindings
**********************/
document.getElementById("calculateBtn").addEventListener("click",async()=>{
  const month=document.getElementById("monthInput").value;
  await calculateMonth(month);
});
document.getElementById("calculateYearBtn").addEventListener("click",async()=>{
  const year=document.getElementById("yearInput").value;
  await calculateYear(year);
});
document.getElementById("projectMonthlyBtn").addEventListener("click",async()=>{
  const year=document.getElementById("overviewYearInput").value;
  await renderProjectMonthlyOverview(year);
});

/**********************
* Init
**********************/
(async()=>{
  await openDatabase();
  renderPeople();
  renderProjects();
  renderAllocations();
  
  // Restore last active tab
  const lastTab = localStorage.getItem("lastActiveTab") || "people";
  document.querySelectorAll(".tab-button").forEach(b=>b.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c=>c.classList.remove("active"));
  const btn = document.querySelector(`.tab-button[data-tab="${lastTab}"]`);
  const tabDiv = document.getElementById(lastTab);
  if(btn && tabDiv){
    btn.classList.add("active");
    tabDiv.classList.add("active");
  } else {
    document.querySelector(".tab-button").classList.add("active");
    document.querySelector(".tab-content").classList.add("active");
  }
})();
