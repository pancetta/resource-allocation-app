var App = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // js/main.js
  var main_exports = {};
  __export(main_exports, {
    scheduleAutoBackup: () => scheduleAutoBackup
  });

  // js/data/database.js
  var DB_NAME = "resource-planning";
  var DB_VERSION = 3;
  var db;
  var cache = {
    people: null,
    projects: null,
    defaultAllocations: null,
    fteOverrides: null,
    projectBudgetOverrides: null,
    allocationOverrides: null
  };
  var cacheValid = {
    people: false,
    projects: false,
    defaultAllocations: false,
    fteOverrides: false,
    projectBudgetOverrides: false,
    allocationOverrides: false
  };
  function invalidateCache(storeName) {
    if (storeName) {
      cacheValid[storeName] = false;
      cache[storeName] = null;
    } else {
      cacheValid.people = false;
      cacheValid.projects = false;
      cacheValid.defaultAllocations = false;
      cacheValid.fteOverrides = false;
      cacheValid.projectBudgetOverrides = false;
      cacheValid.allocationOverrides = false;
      cache.people = null;
      cache.projects = null;
      cache.defaultAllocations = null;
      cache.fteOverrides = null;
      cache.projectBudgetOverrides = null;
      cache.allocationOverrides = null;
    }
  }
  async function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db2 = e.target.result;
        const oldVersion = e.oldVersion;
        if (!db2.objectStoreNames.contains("people")) {
          db2.createObjectStore("people", { keyPath: "id" });
        }
        if (!db2.objectStoreNames.contains("projects")) {
          db2.createObjectStore("projects", { keyPath: "id" });
        }
        if (!db2.objectStoreNames.contains("defaultAllocations")) {
          db2.createObjectStore("defaultAllocations", { keyPath: "id", autoIncrement: true });
        }
        if (oldVersion < 3) {
          if (!db2.objectStoreNames.contains("fteOverrides")) {
            db2.createObjectStore("fteOverrides", { keyPath: "id", autoIncrement: true });
          }
          if (!db2.objectStoreNames.contains("projectBudgetOverrides")) {
            db2.createObjectStore("projectBudgetOverrides", { keyPath: "id", autoIncrement: true });
          }
          if (!db2.objectStoreNames.contains("allocationOverrides")) {
            db2.createObjectStore("allocationOverrides", { keyPath: "id", autoIncrement: true });
          }
        }
      };
      request.onsuccess = (e) => {
        db = e.target.result;
        resolve(db);
      };
      request.onerror = (e) => reject(e.target.error);
    });
  }
  function getAll(storeName, useCache = true) {
    if (useCache && cacheValid[storeName] && cache[storeName]) {
      return Promise.resolve([...cache[storeName]]);
    }
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => {
          const result = req.result;
          if (useCache) {
            cache[storeName] = result;
            cacheValid[storeName] = true;
          }
          resolve(result);
        };
        req.onerror = () => reject(req.error);
      } catch (error) {
        reject(error);
      }
    });
  }
  async function getPeople() {
    return getAll("people");
  }
  async function addPerson(p) {
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction("people", "readwrite");
        tx.objectStore("people").add(p);
        tx.oncomplete = () => {
          invalidateCache("people");
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      } catch (error) {
        reject(error);
      }
    });
  }
  async function updatePerson(p) {
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction("people", "readwrite");
        tx.objectStore("people").put(p);
        tx.oncomplete = () => {
          invalidateCache("people");
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      } catch (error) {
        reject(error);
      }
    });
  }
  async function deletePerson(id) {
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction("people", "readwrite");
        tx.objectStore("people").delete(id);
        tx.oncomplete = () => {
          invalidateCache("people");
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      } catch (error) {
        reject(error);
      }
    });
  }
  async function getProjects() {
    return getAll("projects");
  }
  async function addProject(p) {
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction("projects", "readwrite");
        tx.objectStore("projects").add(p);
        tx.oncomplete = () => {
          invalidateCache("projects");
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      } catch (error) {
        reject(error);
      }
    });
  }
  async function updateProject(p) {
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction("projects", "readwrite");
        tx.objectStore("projects").put(p);
        tx.oncomplete = () => {
          invalidateCache("projects");
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      } catch (error) {
        reject(error);
      }
    });
  }
  async function deleteProject(id) {
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction("projects", "readwrite");
        tx.objectStore("projects").delete(id);
        tx.oncomplete = () => {
          invalidateCache("projects");
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      } catch (error) {
        reject(error);
      }
    });
  }
  async function getAllocations() {
    return getAll("defaultAllocations");
  }
  async function addAllocation(a) {
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction("defaultAllocations", "readwrite");
        tx.objectStore("defaultAllocations").add(a);
        tx.oncomplete = () => {
          invalidateCache("defaultAllocations");
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      } catch (error) {
        reject(error);
      }
    });
  }
  async function updateAllocation(a) {
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction("defaultAllocations", "readwrite");
        tx.objectStore("defaultAllocations").put(a);
        tx.oncomplete = () => {
          invalidateCache("defaultAllocations");
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      } catch (error) {
        reject(error);
      }
    });
  }
  async function deleteAllocation(id) {
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction("defaultAllocations", "readwrite");
        tx.objectStore("defaultAllocations").delete(id);
        tx.oncomplete = () => {
          invalidateCache("defaultAllocations");
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      } catch (error) {
        reject(error);
      }
    });
  }
  async function generatePersonId() {
    const people = await getPeople();
    if (people.length === 0) {
      return "p001";
    }
    const maxNum = people.reduce((max, p) => {
      const m = p.id.match(/^p(\d+)$/);
      return Math.max(max, m ? parseInt(m[1], 10) : 0);
    }, 0);
    return `p${String(maxNum + 1).padStart(3, "0")}`;
  }
  async function generateProjectId() {
    const projects = await getProjects();
    if (projects.length === 0) {
      return "proj001";
    }
    const maxNum = projects.reduce((max, p) => {
      const m = p.id.match(/^proj(\d+)$/);
      return Math.max(max, m ? parseInt(m[1], 10) : 0);
    }, 0);
    return `proj${String(maxNum + 1).padStart(3, "0")}`;
  }
  async function exportAllData() {
    const people = await getPeople();
    const projects = await getProjects();
    const allocations = await getAllocations();
    const fteOverrides = await getFteOverrides();
    const projectBudgetOverrides = await getProjectBudgetOverrides();
    const allocationOverrides = await getAllocationOverrides();
    return {
      version: "2.0",
      exportDate: (/* @__PURE__ */ new Date()).toISOString(),
      data: {
        people,
        projects,
        allocations,
        fteOverrides,
        projectBudgetOverrides,
        allocationOverrides
      }
    };
  }
  async function importAllData(importedData) {
    if (!importedData || !importedData.data) {
      throw new Error("Invalid data format");
    }
    const {
      people,
      projects,
      allocations,
      fteOverrides = [],
      projectBudgetOverrides = [],
      allocationOverrides = []
    } = importedData.data;
    const tx = db.transaction([
      "people",
      "projects",
      "defaultAllocations",
      "fteOverrides",
      "projectBudgetOverrides",
      "allocationOverrides"
    ], "readwrite");
    await tx.objectStore("people").clear();
    await tx.objectStore("projects").clear();
    await tx.objectStore("defaultAllocations").clear();
    await tx.objectStore("fteOverrides").clear();
    await tx.objectStore("projectBudgetOverrides").clear();
    await tx.objectStore("allocationOverrides").clear();
    if (people && Array.isArray(people)) {
      for (const person of people) {
        await addPerson(person);
      }
    }
    if (projects && Array.isArray(projects)) {
      for (const project of projects) {
        await addProject(project);
      }
    }
    if (allocations && Array.isArray(allocations)) {
      for (const allocation of allocations) {
        await addAllocation(allocation);
      }
    }
    if (fteOverrides && Array.isArray(fteOverrides)) {
      for (const override of fteOverrides) {
        await addFteOverride(override);
      }
    }
    if (projectBudgetOverrides && Array.isArray(projectBudgetOverrides)) {
      for (const override of projectBudgetOverrides) {
        await addProjectBudgetOverride(override);
      }
    }
    if (allocationOverrides && Array.isArray(allocationOverrides)) {
      for (const override of allocationOverrides) {
        await addAllocationOverride(override);
      }
    }
  }
  var BACKUP_KEY_PREFIX = "resource-planning-backup-";
  var MAX_BACKUPS = 10;
  var AUTO_JSON_BACKUP_KEY = "resource-planning-auto-json-backup";
  async function createBackup() {
    const data = await exportAllData();
    const timestamp = Date.now();
    const backupKey = `${BACKUP_KEY_PREFIX}${timestamp}`;
    try {
      localStorage.setItem(backupKey, JSON.stringify(data));
      localStorage.setItem(AUTO_JSON_BACKUP_KEY, JSON.stringify({
        data,
        preparedAt: timestamp,
        preparedDate: new Date(timestamp).toISOString()
      }));
      const allBackups = getAllBackups();
      if (allBackups.length > MAX_BACKUPS) {
        const toDelete = allBackups.slice(MAX_BACKUPS);
        toDelete.forEach((backup) => {
          localStorage.removeItem(backup.key);
        });
      }
      return backupKey;
    } catch (e) {
      console.error("Failed to create backup:", e);
      throw e;
    }
  }
  function getAllBackups() {
    const backups = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(BACKUP_KEY_PREFIX)) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          const timestamp = parseInt(key.replace(BACKUP_KEY_PREFIX, ""));
          backups.push({
            key,
            timestamp,
            date: new Date(timestamp),
            exportDate: data.exportDate
          });
        } catch (e) {
          console.error("Error reading backup:", key, e);
        }
      }
    }
    return backups.sort((a, b) => b.timestamp - a.timestamp);
  }
  async function restoreBackup(backupKey) {
    const backupData = localStorage.getItem(backupKey);
    if (!backupData) {
      throw new Error("Backup not found");
    }
    const data = JSON.parse(backupData);
    await importAllData(data);
  }
  function deleteBackup(backupKey) {
    localStorage.removeItem(backupKey);
  }
  function getAutoPreparedBackup() {
    const backupData = localStorage.getItem(AUTO_JSON_BACKUP_KEY);
    if (!backupData) return null;
    try {
      return JSON.parse(backupData);
    } catch (e) {
      console.error("Error reading auto-prepared backup:", e);
      return null;
    }
  }
  async function getFteOverrides() {
    return getAll("fteOverrides");
  }
  async function addFteOverride(override) {
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction("fteOverrides", "readwrite");
        tx.objectStore("fteOverrides").add(override);
        tx.oncomplete = () => {
          invalidateCache("fteOverrides");
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      } catch (error) {
        reject(error);
      }
    });
  }
  async function updateFteOverride(override) {
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction("fteOverrides", "readwrite");
        tx.objectStore("fteOverrides").put(override);
        tx.oncomplete = () => {
          invalidateCache("fteOverrides");
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      } catch (error) {
        reject(error);
      }
    });
  }
  async function deleteFteOverride(id) {
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction("fteOverrides", "readwrite");
        tx.objectStore("fteOverrides").delete(id);
        tx.oncomplete = () => {
          invalidateCache("fteOverrides");
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      } catch (error) {
        reject(error);
      }
    });
  }
  async function getProjectBudgetOverrides() {
    return getAll("projectBudgetOverrides");
  }
  async function addProjectBudgetOverride(override) {
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction("projectBudgetOverrides", "readwrite");
        tx.objectStore("projectBudgetOverrides").add(override);
        tx.oncomplete = () => {
          invalidateCache("projectBudgetOverrides");
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      } catch (error) {
        reject(error);
      }
    });
  }
  async function updateProjectBudgetOverride(override) {
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction("projectBudgetOverrides", "readwrite");
        tx.objectStore("projectBudgetOverrides").put(override);
        tx.oncomplete = () => {
          invalidateCache("projectBudgetOverrides");
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      } catch (error) {
        reject(error);
      }
    });
  }
  async function deleteProjectBudgetOverride(id) {
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction("projectBudgetOverrides", "readwrite");
        tx.objectStore("projectBudgetOverrides").delete(id);
        tx.oncomplete = () => {
          invalidateCache("projectBudgetOverrides");
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      } catch (error) {
        reject(error);
      }
    });
  }
  async function getAllocationOverrides() {
    return getAll("allocationOverrides");
  }
  async function addAllocationOverride(override) {
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction("allocationOverrides", "readwrite");
        tx.objectStore("allocationOverrides").add(override);
        tx.oncomplete = () => {
          invalidateCache("allocationOverrides");
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      } catch (error) {
        reject(error);
      }
    });
  }
  async function updateAllocationOverride(override) {
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction("allocationOverrides", "readwrite");
        tx.objectStore("allocationOverrides").put(override);
        tx.oncomplete = () => {
          invalidateCache("allocationOverrides");
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      } catch (error) {
        reject(error);
      }
    });
  }
  async function deleteAllocationOverride(id) {
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction("allocationOverrides", "readwrite");
        tx.objectStore("allocationOverrides").delete(id);
        tx.oncomplete = () => {
          invalidateCache("allocationOverrides");
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  // js/ui/tabs.js
  function initTabs() {
    if (typeof document === "undefined") {
      return;
    }
    const tabButtons = document.querySelectorAll(".tab-button");
    if (tabButtons.length === 0) {
      return;
    }
    tabButtons.forEach((btn2) => {
      btn2.addEventListener("click", () => {
        document.querySelectorAll(".tab-button").forEach((b) => b.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
        btn2.classList.add("active");
        document.getElementById(btn2.dataset.tab).classList.add("active");
        localStorage.setItem("lastActiveTab", btn2.dataset.tab);
      });
    });
    const lastTab = localStorage.getItem("lastActiveTab") || "people";
    const btn = document.querySelector(`.tab-button[data-tab="${lastTab}"]`);
    const tabDiv = document.getElementById(lastTab);
    if (btn && tabDiv) {
      btn.classList.add("active");
      tabDiv.classList.add("active");
    } else {
      const firstButton = document.querySelector(".tab-button");
      const firstContent = document.querySelector(".tab-content");
      if (firstButton) firstButton.classList.add("active");
      if (firstContent) firstContent.classList.add("active");
    }
  }

  // js/views/peopleView.js
  async function renderPeople() {
    if (typeof document === "undefined") return;
    const tbody = document.querySelector("#peopleTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    const people = await getPeople();
    people.forEach((p) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
            <td contenteditable="true" data-id="${p.id}" data-field="name">${p.name}</td>
            <td contenteditable="true" data-id="${p.id}" data-field="fte">${p.fte ?? 1}</td>
            <td><input type="checkbox" ${p.active ? "checked" : ""} data-id="${p.id}" data-field="active"></td>
            <td><button class="delete-person" data-id="${p.id}">Delete</button></td>
        `;
      tbody.appendChild(tr);
    });
    attachPeopleEventListeners();
    populatePersonSelect();
  }
  function attachPeopleEventListeners() {
    if (typeof document === "undefined") return;
    document.querySelectorAll("#peopleTable td[contenteditable]").forEach((td) => {
      td.addEventListener("blur", async function() {
        const id = this.dataset.id;
        const field = this.dataset.field;
        const value = this.textContent;
        const people = await getPeople();
        const person = people.find((p) => p.id === id);
        if (field === "name") {
          person.name = value;
          populatePersonSelect();
        } else if (field === "fte") {
          person.fte = parseFloat(value);
        }
        await updatePerson(person);
        scheduleAutoBackup();
      });
    });
    document.querySelectorAll("#peopleTable input[type=checkbox]").forEach((checkbox) => {
      checkbox.addEventListener("change", async function() {
        const id = this.dataset.id;
        const checked = this.checked;
        const people = await getPeople();
        const person = people.find((p) => p.id === id);
        person.active = checked;
        await updatePerson(person);
        scheduleAutoBackup();
        populatePersonSelect();
      });
    });
    document.querySelectorAll(".delete-person").forEach((btn) => {
      btn.addEventListener("click", async function() {
        const id = this.dataset.id;
        await deletePerson(id);
        scheduleAutoBackup();
        renderPeople();
      });
    });
  }
  async function populatePersonSelect() {
    if (typeof document === "undefined") return;
    const select = document.getElementById("personSelect");
    if (!select) return;
    select.innerHTML = "";
    const people = await getPeople();
    people.filter((p) => p.active).forEach((p) => {
      const option = document.createElement("option");
      option.value = p.id;
      option.textContent = p.name;
      select.appendChild(option);
    });
  }
  async function addPersonAuto(name) {
    const id = await generatePersonId();
    await addPerson({ id, name, active: true, fte: 1 });
    scheduleAutoBackup();
    renderPeople();
  }
  function initPeopleView() {
    if (typeof document === "undefined") return;
    const addPersonBtn = document.getElementById("addPersonBtn");
    if (!addPersonBtn) return;
    addPersonBtn.addEventListener("click", async () => {
      const name = prompt("Person name");
      if (name) await addPersonAuto(name);
    });
  }

  // js/views/projectsView.js
  async function renderProjects() {
    if (typeof document === "undefined") return;
    const tbody = document.querySelector("#projectsTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    const projects = await getProjects();
    projects.forEach((p) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
            <td contenteditable="true" data-id="${p.id}" data-field="name">${p.name}</td>
            <td contenteditable="true" data-id="${p.id}" data-field="plannedPM">${p.plannedPM ?? 0}</td>
            <td><button class="delete-project" data-id="${p.id}">Delete</button></td>
        `;
      tbody.appendChild(tr);
    });
    attachProjectsEventListeners();
    populateProjectSelect();
  }
  function attachProjectsEventListeners() {
    document.querySelectorAll("#projectsTable td[contenteditable]").forEach((td) => {
      td.addEventListener("blur", async function() {
        const id = this.dataset.id;
        const field = this.dataset.field;
        const value = this.textContent;
        const projects = await getProjects();
        const project = projects.find((p) => p.id === id);
        if (field === "name") {
          project.name = value;
          populateProjectSelect();
        } else if (field === "plannedPM") {
          project.plannedPM = parseFloat(value);
        }
        await updateProject(project);
        scheduleAutoBackup();
      });
    });
    document.querySelectorAll(".delete-project").forEach((btn) => {
      btn.addEventListener("click", async function() {
        const id = this.dataset.id;
        await deleteProject(id);
        scheduleAutoBackup();
        renderProjects();
      });
    });
  }
  async function populateProjectSelect() {
    if (typeof document === "undefined") return;
    const select = document.getElementById("projectSelect");
    if (!select) return;
    select.innerHTML = "";
    const projects = await getProjects();
    projects.forEach((p) => {
      const option = document.createElement("option");
      option.value = p.id;
      option.textContent = p.name;
      select.appendChild(option);
    });
  }
  async function addProjectAuto(name) {
    const id = await generateProjectId();
    await addProject({ id, name, plannedPM: 0 });
    scheduleAutoBackup();
    renderProjects();
  }
  function initProjectsView() {
    if (typeof document === "undefined") return;
    const addProjectBtn = document.getElementById("addProjectBtn");
    if (!addProjectBtn) return;
    addProjectBtn.addEventListener("click", async () => {
      const name = prompt("Project name");
      if (name) await addProjectAuto(name);
    });
  }

  // js/helpers/allocationHelper.js
  function buildAllocationIndex(allocations) {
    const index = /* @__PURE__ */ new Map();
    for (const alloc of allocations) {
      const key = `${alloc.personId}:${alloc.projectId}`;
      if (!index.has(key)) {
        index.set(key, []);
      }
      index.get(key).push(alloc);
    }
    return index;
  }
  function buildAllocationOverrideIndex(allocationOverrides) {
    const index = /* @__PURE__ */ new Map();
    for (const override of allocationOverrides) {
      const key = `${override.allocationId}:${override.month}`;
      index.set(key, override);
    }
    return index;
  }
  function calculatePM(allocationIndex, personId, projectId, month, fte, allocationOverrideIndex = null) {
    const key = `${personId}:${projectId}`;
    const allocations = allocationIndex.get(key);
    if (!allocations) {
      return 0;
    }
    return allocations.reduce((sum, alloc) => {
      if (alloc.startMonth <= month && (!alloc.endMonth || alloc.endMonth >= month)) {
        let pct = alloc.pct;
        if (allocationOverrideIndex) {
          const overrideKey = `${alloc.id}:${month}`;
          const override = allocationOverrideIndex.get(overrideKey);
          if (override) {
            pct = override.pct;
          }
        }
        return sum + pct * fte;
      }
      return sum;
    }, 0);
  }
  function calculatePersonTotal(allocationIndex, personId, projects, month, fte, allocationOverrideIndex = null) {
    let total = 0;
    for (const project of projects) {
      total += calculatePM(allocationIndex, personId, project.id, month, fte, allocationOverrideIndex);
    }
    return total;
  }
  function calculateProjectTotal(allocationIndex, projectId, people, month, fteOverrides = null, allocationOverrideIndex = null) {
    let total = 0;
    for (const person of people) {
      let fte = person.fte ?? 1;
      if (fteOverrides) {
        const applicableOverrides = fteOverrides.filter(
          (override) => override.personId === person.id && override.startMonth <= month && (!override.endMonth || override.endMonth >= month)
        );
        if (applicableOverrides.length > 0) {
          const sortedOverrides = applicableOverrides.sort(
            (a, b) => b.startMonth.localeCompare(a.startMonth)
          );
          fte = sortedOverrides[0].fte;
        }
      }
      total += calculatePM(allocationIndex, person.id, projectId, month, fte, allocationOverrideIndex);
    }
    return total;
  }
  function calculatePersonMonthlyTotals(allocationIndex, personId, projects, months, fte, fteOverrides = null, allocationOverrideIndex = null) {
    return months.map((month) => {
      let effectiveFte = fte;
      if (fteOverrides) {
        const applicableOverrides = fteOverrides.filter(
          (override) => override.personId === personId && override.startMonth <= month && (!override.endMonth || override.endMonth >= month)
        );
        if (applicableOverrides.length > 0) {
          const sortedOverrides = applicableOverrides.sort(
            (a, b) => b.startMonth.localeCompare(a.startMonth)
          );
          effectiveFte = sortedOverrides[0].fte;
        }
      }
      return calculatePersonTotal(allocationIndex, personId, projects, month, effectiveFte, allocationOverrideIndex);
    });
  }
  function calculateProjectMonthlyTotals(allocationIndex, projectId, people, months, fteOverrides = null, allocationOverrideIndex = null) {
    return months.map((month) => calculateProjectTotal(allocationIndex, projectId, people, month, fteOverrides, allocationOverrideIndex));
  }
  function sumArray(arr) {
    return arr.reduce((sum, val) => sum + val, 0);
  }
  function pctToPMPerMonth(fte, pct) {
    return fte * pct;
  }
  function pctToPMPerYear(fte, pct) {
    return fte * pct * 12;
  }
  function formatPMWithPct(pm, fte) {
    if (fte === 0) {
      return `${pm.toFixed(2)} (N/A)`;
    }
    const pct = pm / fte * 100;
    return `${pm.toFixed(2)} (${pct.toFixed(0)}%)`;
  }

  // js/views/allocationsView.js
  async function renderAllocations() {
    if (typeof document === "undefined") return;
    const tbody = document.querySelector("#allocationsTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    const allocs = await getAllocations();
    const people = await getPeople();
    const projects = await getProjects();
    allocs.forEach((a) => {
      const tr = document.createElement("tr");
      const personOptions = people.filter((p) => p.active).map(
        (p) => `<option value="${p.id}" ${p.id === a.personId ? "selected" : ""}>${p.name}</option>`
      ).join("");
      const projectOptions = projects.map(
        (p) => `<option value="${p.id}" ${p.id === a.projectId ? "selected" : ""}>${p.name}</option>`
      ).join("");
      const person = people.find((p) => p.id === a.personId);
      const fte = person ? person.fte ?? 1 : 1;
      const pmPerMonth = pctToPMPerMonth(fte, a.pct);
      const pmPerYear = pctToPMPerYear(fte, a.pct);
      tr.innerHTML = `
            <td><select class="alloc-person" data-id="${a.id}">${personOptions}</select></td>
            <td><select class="alloc-project" data-id="${a.id}">${projectOptions}</select></td>
            <td><input type="number" class="alloc-pct" step="0.01" min="0" max="1" value="${a.pct}" data-id="${a.id}"></td>
            <td class="pm-display">${pmPerMonth.toFixed(2)}</td>
            <td class="pm-display">${pmPerYear.toFixed(2)}</td>
            <td><input type="month" class="alloc-start" value="${a.startMonth}" data-id="${a.id}"></td>
            <td><input type="month" class="alloc-end" value="${a.endMonth ?? ""}" data-id="${a.id}"></td>
            <td><button class="delete-allocation" data-id="${a.id}">Delete</button></td>
        `;
      tbody.appendChild(tr);
    });
    attachAllocationsEventListeners();
  }
  async function updateRowPMValues(row, alloc) {
    const people = await getPeople();
    const person = people.find((p) => p.id === alloc.personId);
    const fte = person ? person.fte ?? 1 : 1;
    const pmPerMonth = pctToPMPerMonth(fte, alloc.pct);
    const pmPerYear = pctToPMPerYear(fte, alloc.pct);
    const cells = row.querySelectorAll(".pm-display");
    if (cells.length >= 2) {
      cells[0].textContent = pmPerMonth.toFixed(2);
      cells[1].textContent = pmPerYear.toFixed(2);
    }
  }
  function attachAllocationsEventListeners() {
    document.querySelectorAll(".alloc-person").forEach((select) => {
      select.addEventListener("change", async function() {
        const id = parseInt(this.dataset.id);
        const allocs = await getAllocations();
        const alloc = allocs.find((a) => a.id === id);
        alloc.personId = this.value;
        await updateAllocation(alloc);
        scheduleAutoBackup();
        await updateRowPMValues(this.closest("tr"), alloc);
      });
    });
    document.querySelectorAll(".alloc-project").forEach((select) => {
      select.addEventListener("change", async function() {
        const id = parseInt(this.dataset.id);
        const allocs = await getAllocations();
        const alloc = allocs.find((a) => a.id === id);
        alloc.projectId = this.value;
        await updateAllocation(alloc);
        scheduleAutoBackup();
      });
    });
    document.querySelectorAll(".alloc-pct").forEach((input) => {
      input.addEventListener("blur", async function() {
        const id = parseInt(this.dataset.id);
        const allocs = await getAllocations();
        const alloc = allocs.find((a) => a.id === id);
        alloc.pct = parseFloat(this.value);
        await updateAllocation(alloc);
        scheduleAutoBackup();
        await updateRowPMValues(this.closest("tr"), alloc);
      });
    });
    document.querySelectorAll(".alloc-start").forEach((input) => {
      input.addEventListener("blur", async function() {
        const id = parseInt(this.dataset.id);
        const allocs = await getAllocations();
        const alloc = allocs.find((a) => a.id === id);
        alloc.startMonth = this.value;
        await updateAllocation(alloc);
        scheduleAutoBackup();
      });
    });
    document.querySelectorAll(".alloc-end").forEach((input) => {
      input.addEventListener("blur", async function() {
        const id = parseInt(this.dataset.id);
        const allocs = await getAllocations();
        const alloc = allocs.find((a) => a.id === id);
        alloc.endMonth = this.value || null;
        await updateAllocation(alloc);
        scheduleAutoBackup();
      });
    });
    document.querySelectorAll(".delete-allocation").forEach((btn) => {
      btn.addEventListener("click", async function() {
        const id = parseInt(this.dataset.id);
        await deleteAllocation(id);
        scheduleAutoBackup();
        renderAllocations();
      });
    });
  }
  async function renderAllocationOverrides() {
    if (typeof document === "undefined") return;
    const tbody = document.querySelector("#allocationOverridesTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    const overrides = await getAllocationOverrides();
    const allocations = await getAllocations();
    const people = await getPeople();
    const projects = await getProjects();
    const sortedOverrides = overrides.sort((a, b) => {
      if (a.allocationId !== b.allocationId) {
        return a.allocationId - b.allocationId;
      }
      return a.month.localeCompare(b.month);
    });
    sortedOverrides.forEach((override) => {
      const allocation = allocations.find((a) => a.id === override.allocationId);
      let allocationLabel = `Allocation #${override.allocationId}`;
      if (allocation) {
        const person = people.find((p) => p.id === allocation.personId);
        const project = projects.find((p) => p.id === allocation.projectId);
        allocationLabel = `${person ? person.name : allocation.personId} \u2192 ${project ? project.name : allocation.projectId}`;
      }
      const tr = document.createElement("tr");
      tr.innerHTML = `
            <td>${allocationLabel}</td>
            <td><input type="month" class="override-month" value="${override.month}" data-id="${override.id}"></td>
            <td contenteditable="true" data-id="${override.id}" data-field="pct">${override.pct}</td>
            <td><button class="delete-allocation-override" data-id="${override.id}">Delete</button></td>
        `;
      tbody.appendChild(tr);
    });
    attachAllocationOverrideEventListeners();
    populateAllocationSelect();
  }
  function attachAllocationOverrideEventListeners() {
    if (typeof document === "undefined") return;
    document.querySelectorAll("#allocationOverridesTable td[contenteditable]").forEach((td) => {
      td.addEventListener("blur", async function() {
        const id = parseInt(this.dataset.id);
        const field = this.dataset.field;
        const value = this.textContent;
        const overrides = await getAllocationOverrides();
        const override = overrides.find((o) => o.id === id);
        if (field === "pct") {
          override.pct = parseFloat(value);
        }
        await updateAllocationOverride(override);
        scheduleAutoBackup();
      });
    });
    document.querySelectorAll(".override-month").forEach((input) => {
      input.addEventListener("blur", async function() {
        const id = parseInt(this.dataset.id);
        const overrides = await getAllocationOverrides();
        const override = overrides.find((o) => o.id === id);
        override.month = this.value;
        await updateAllocationOverride(override);
        scheduleAutoBackup();
      });
    });
    document.querySelectorAll(".delete-allocation-override").forEach((btn) => {
      btn.addEventListener("click", async function() {
        const id = parseInt(this.dataset.id);
        await deleteAllocationOverride(id);
        scheduleAutoBackup();
        renderAllocationOverrides();
      });
    });
  }
  async function populateAllocationSelect() {
    if (typeof document === "undefined") return;
    const select = document.getElementById("allocationSelect");
    if (!select) return;
    select.innerHTML = "";
    const allocations = await getAllocations();
    const people = await getPeople();
    const projects = await getProjects();
    allocations.forEach((a) => {
      const person = people.find((p) => p.id === a.personId);
      const project = projects.find((p) => p.id === a.projectId);
      const label = `${person ? person.name : a.personId} \u2192 ${project ? project.name : a.projectId}`;
      const option = document.createElement("option");
      option.value = a.id;
      option.textContent = label;
      select.appendChild(option);
    });
  }
  function initAllocationsView() {
    if (typeof document === "undefined") return;
    const addAllocationBtn = document.getElementById("addAllocationBtn");
    if (!addAllocationBtn) return;
    addAllocationBtn.addEventListener("click", async () => {
      await addAllocation({
        personId: document.getElementById("personSelect").value,
        projectId: document.getElementById("projectSelect").value,
        pct: parseFloat(document.getElementById("pctInput").value),
        startMonth: document.getElementById("startMonthInput").value,
        endMonth: document.getElementById("endMonthInput").value || null
      });
      scheduleAutoBackup();
      renderAllocations();
      populateAllocationSelect();
    });
    const addOverrideBtn = document.getElementById("addAllocationOverrideBtn");
    if (addOverrideBtn) {
      addOverrideBtn.addEventListener("click", async () => {
        const allocationId = parseInt(document.getElementById("allocationSelect").value);
        const month = document.getElementById("overrideMonthInput").value;
        const pct = parseFloat(document.getElementById("overridePctInput").value);
        if (!allocationId || !month) {
          alert("Please select an allocation and month");
          return;
        }
        await addAllocationOverride({
          allocationId,
          month,
          pct
        });
        scheduleAutoBackup();
        renderAllocationOverrides();
      });
    }
  }

  // js/views/fteHistoryView.js
  async function renderFteOverrides() {
    if (typeof document === "undefined") return;
    const tbody = document.querySelector("#fteOverridesTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    const overrides = await getFteOverrides();
    const people = await getPeople();
    const sortedOverrides = overrides.sort((a, b) => {
      if (a.personId !== b.personId) {
        return a.personId.localeCompare(b.personId);
      }
      return a.startMonth.localeCompare(b.startMonth);
    });
    sortedOverrides.forEach((override) => {
      const person = people.find((p) => p.id === override.personId);
      const personName = person ? person.name : override.personId;
      const tr = document.createElement("tr");
      tr.innerHTML = `
            <td>${personName}</td>
            <td contenteditable="true" data-id="${override.id}" data-field="fte">${override.fte}</td>
            <td><input type="month" class="fte-start" value="${override.startMonth}" data-id="${override.id}"></td>
            <td><input type="month" class="fte-end" value="${override.endMonth || ""}" data-id="${override.id}"></td>
            <td><button class="delete-fte-override" data-id="${override.id}">Delete</button></td>
        `;
      tbody.appendChild(tr);
    });
    attachFteOverrideEventListeners();
    populateFtePersonSelect();
  }
  function attachFteOverrideEventListeners() {
    if (typeof document === "undefined") return;
    document.querySelectorAll("#fteOverridesTable td[contenteditable]").forEach((td) => {
      td.addEventListener("blur", async function() {
        const id = parseInt(this.dataset.id);
        const field = this.dataset.field;
        const value = this.textContent;
        const overrides = await getFteOverrides();
        const override = overrides.find((o) => o.id === id);
        if (field === "fte") {
          override.fte = parseFloat(value);
        }
        await updateFteOverride(override);
        scheduleAutoBackup();
      });
    });
    document.querySelectorAll(".fte-start").forEach((input) => {
      input.addEventListener("blur", async function() {
        const id = parseInt(this.dataset.id);
        const overrides = await getFteOverrides();
        const override = overrides.find((o) => o.id === id);
        override.startMonth = this.value;
        await updateFteOverride(override);
        scheduleAutoBackup();
      });
    });
    document.querySelectorAll(".fte-end").forEach((input) => {
      input.addEventListener("blur", async function() {
        const id = parseInt(this.dataset.id);
        const overrides = await getFteOverrides();
        const override = overrides.find((o) => o.id === id);
        override.endMonth = this.value || null;
        await updateFteOverride(override);
        scheduleAutoBackup();
      });
    });
    document.querySelectorAll(".delete-fte-override").forEach((btn) => {
      btn.addEventListener("click", async function() {
        const id = parseInt(this.dataset.id);
        await deleteFteOverride(id);
        scheduleAutoBackup();
        renderFteOverrides();
      });
    });
  }
  async function populateFtePersonSelect() {
    if (typeof document === "undefined") return;
    const select = document.getElementById("ftePersonSelect");
    if (!select) return;
    select.innerHTML = "";
    const people = await getPeople();
    people.filter((p) => p.active).forEach((p) => {
      const option = document.createElement("option");
      option.value = p.id;
      option.textContent = p.name;
      select.appendChild(option);
    });
  }
  function initFteHistoryView() {
    if (typeof document === "undefined") return;
    const addBtn = document.getElementById("addFteOverrideBtn");
    if (!addBtn) return;
    addBtn.addEventListener("click", async () => {
      const personId = document.getElementById("ftePersonSelect").value;
      const fte = parseFloat(document.getElementById("fteValueInput").value);
      const startMonth = document.getElementById("fteStartMonthInput").value;
      const endMonth = document.getElementById("fteEndMonthInput").value || null;
      if (!personId || !startMonth) {
        alert("Please select a person and start month");
        return;
      }
      await addFteOverride({
        personId,
        fte,
        startMonth,
        endMonth
      });
      scheduleAutoBackup();
      renderFteOverrides();
    });
  }

  // js/views/budgetHistoryView.js
  async function renderBudgetOverrides() {
    if (typeof document === "undefined") return;
    const tbody = document.querySelector("#budgetOverridesTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    const overrides = await getProjectBudgetOverrides();
    const projects = await getProjects();
    const sortedOverrides = overrides.sort((a, b) => {
      if (a.projectId !== b.projectId) {
        return a.projectId.localeCompare(b.projectId);
      }
      return a.startMonth.localeCompare(b.startMonth);
    });
    sortedOverrides.forEach((override) => {
      const project = projects.find((p) => p.id === override.projectId);
      const projectName = project ? project.name : override.projectId;
      const tr = document.createElement("tr");
      tr.innerHTML = `
            <td>${projectName}</td>
            <td contenteditable="true" data-id="${override.id}" data-field="plannedPM">${override.plannedPM}</td>
            <td><input type="month" class="budget-start" value="${override.startMonth}" data-id="${override.id}"></td>
            <td><input type="month" class="budget-end" value="${override.endMonth || ""}" data-id="${override.id}"></td>
            <td><button class="delete-budget-override" data-id="${override.id}">Delete</button></td>
        `;
      tbody.appendChild(tr);
    });
    attachBudgetOverrideEventListeners();
    populateBudgetProjectSelect();
  }
  function attachBudgetOverrideEventListeners() {
    if (typeof document === "undefined") return;
    document.querySelectorAll("#budgetOverridesTable td[contenteditable]").forEach((td) => {
      td.addEventListener("blur", async function() {
        const id = parseInt(this.dataset.id);
        const field = this.dataset.field;
        const value = this.textContent;
        const overrides = await getProjectBudgetOverrides();
        const override = overrides.find((o) => o.id === id);
        if (field === "plannedPM") {
          override.plannedPM = parseFloat(value);
        }
        await updateProjectBudgetOverride(override);
        scheduleAutoBackup();
      });
    });
    document.querySelectorAll(".budget-start").forEach((input) => {
      input.addEventListener("blur", async function() {
        const id = parseInt(this.dataset.id);
        const overrides = await getProjectBudgetOverrides();
        const override = overrides.find((o) => o.id === id);
        override.startMonth = this.value;
        await updateProjectBudgetOverride(override);
        scheduleAutoBackup();
      });
    });
    document.querySelectorAll(".budget-end").forEach((input) => {
      input.addEventListener("blur", async function() {
        const id = parseInt(this.dataset.id);
        const overrides = await getProjectBudgetOverrides();
        const override = overrides.find((o) => o.id === id);
        override.endMonth = this.value || null;
        await updateProjectBudgetOverride(override);
        scheduleAutoBackup();
      });
    });
    document.querySelectorAll(".delete-budget-override").forEach((btn) => {
      btn.addEventListener("click", async function() {
        const id = parseInt(this.dataset.id);
        await deleteProjectBudgetOverride(id);
        scheduleAutoBackup();
        renderBudgetOverrides();
      });
    });
  }
  async function populateBudgetProjectSelect() {
    if (typeof document === "undefined") return;
    const select = document.getElementById("budgetProjectSelect");
    if (!select) return;
    select.innerHTML = "";
    const projects = await getProjects();
    projects.forEach((p) => {
      const option = document.createElement("option");
      option.value = p.id;
      option.textContent = p.name;
      select.appendChild(option);
    });
  }
  function initBudgetHistoryView() {
    if (typeof document === "undefined") return;
    const addBtn = document.getElementById("addBudgetOverrideBtn");
    if (!addBtn) return;
    addBtn.addEventListener("click", async () => {
      const projectId = document.getElementById("budgetProjectSelect").value;
      const plannedPM = parseFloat(document.getElementById("budgetValueInput").value);
      const startMonth = document.getElementById("budgetStartMonthInput").value;
      const endMonth = document.getElementById("budgetEndMonthInput").value || null;
      if (!projectId || !startMonth) {
        alert("Please select a project and start month");
        return;
      }
      await addProjectBudgetOverride({
        projectId,
        plannedPM,
        startMonth,
        endMonth
      });
      scheduleAutoBackup();
      renderBudgetOverrides();
    });
  }

  // js/helpers/classUtil.js
  function cellClass(actual, expected) {
    if (actual === expected) return "correct";
    return "warning";
  }

  // js/views/monthlyReport.js
  async function calculateMonth(month) {
    const people = await getPeople();
    const projects = await getProjects();
    const allocations = await getAllocations();
    const fteOverrides = await getFteOverrides();
    const projectBudgetOverrides = await getProjectBudgetOverrides();
    const allocationOverrides = await getAllocationOverrides();
    const allocationIndex = buildAllocationIndex(allocations);
    const allocationOverrideIndex = buildAllocationOverrideIndex(allocationOverrides);
    const resultsOutput = document.getElementById("resultsOutput");
    resultsOutput.innerHTML = `<h3>Monthly Report ${month}</h3>`;
    const personTable = document.createElement("table");
    const pHeader = ["Person", ...projects.map((p) => p.name), "Total", "FTE", "Delta"];
    personTable.innerHTML = `<thead><tr>${pHeader.map((h) => `<th>${h}</th>`).join("")}</tr></thead>`;
    const pTbody = document.createElement("tbody");
    people.forEach((p) => {
      let fte = p.fte ?? 1;
      const applicableFteOverrides = fteOverrides.filter(
        (override) => override.personId === p.id && override.startMonth <= month && (!override.endMonth || override.endMonth >= month)
      );
      if (applicableFteOverrides.length > 0) {
        const sortedOverrides = applicableFteOverrides.sort(
          (a, b) => b.startMonth.localeCompare(a.startMonth)
        );
        fte = sortedOverrides[0].fte;
      }
      const cells = projects.map((proj) => calculatePM(allocationIndex, p.id, proj.id, month, fte, allocationOverrideIndex));
      const total = calculatePersonTotal(allocationIndex, p.id, projects, month, fte, allocationOverrideIndex);
      const delta = total - fte;
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${p.name}</td>` + cells.map((c) => `<td class="${cellClass(c, fte / projects.length)}">${formatPMWithPct(c, fte)}</td>`).join("") + `<td class="${cellClass(total, fte)}">${formatPMWithPct(total, fte)}</td><td>${fte.toFixed(2)}</td><td class="${cellClass(delta, 0)}">${delta.toFixed(2)}</td>`;
      pTbody.appendChild(tr);
    });
    const tfoot = document.createElement("tfoot");
    const sumRow = document.createElement("tr");
    sumRow.innerHTML = `<td><strong>Total</strong></td>` + projects.map((proj) => {
      const sum = calculateProjectTotal(allocationIndex, proj.id, people, month, fteOverrides, allocationOverrideIndex);
      return `<td><strong>${sum.toFixed(2)}</strong></td>`;
    }).join("") + `<td colspan="3"></td>`;
    tfoot.appendChild(sumRow);
    personTable.appendChild(pTbody);
    personTable.appendChild(tfoot);
    resultsOutput.appendChild(personTable);
    const projTable = document.createElement("table");
    const projHeader = ["Project", "Allocated PM", "Planned PM", "Delta"];
    projTable.innerHTML = `<thead><tr>${projHeader.map((h) => `<th>${h}</th>`).join("")}</tr></thead>`;
    const projTbody = document.createElement("tbody");
    projects.forEach((proj) => {
      const total = calculateProjectTotal(allocationIndex, proj.id, people, month, fteOverrides, allocationOverrideIndex);
      let planned = proj.plannedPM ?? 0;
      const applicableBudgetOverrides = projectBudgetOverrides.filter(
        (override) => override.projectId === proj.id && override.startMonth <= month && (!override.endMonth || override.endMonth >= month)
      );
      if (applicableBudgetOverrides.length > 0) {
        const sortedOverrides = applicableBudgetOverrides.sort(
          (a, b) => b.startMonth.localeCompare(a.startMonth)
        );
        planned = sortedOverrides[0].plannedPM;
      }
      const delta = total - planned;
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${proj.name}</td><td class="${cellClass(total, planned)}">${total.toFixed(2)}</td><td>${planned.toFixed(2)}</td><td class="${cellClass(delta, 0)}">${delta.toFixed(2)}</td>`;
      projTbody.appendChild(tr);
    });
    projTable.appendChild(projTbody);
    resultsOutput.appendChild(projTable);
  }
  function initMonthlyReport() {
    if (typeof document === "undefined") return;
    const calculateBtn = document.getElementById("calculateBtn");
    if (!calculateBtn) return;
    calculateBtn.addEventListener("click", async () => {
      const month = document.getElementById("monthInput").value;
      await calculateMonth(month);
    });
  }

  // js/views/yearlyReport.js
  async function calculateYear(year) {
    const people = await getPeople();
    const projects = await getProjects();
    const allocations = await getAllocations();
    const fteOverrides = await getFteOverrides();
    const projectBudgetOverrides = await getProjectBudgetOverrides();
    const allocationOverrides = await getAllocationOverrides();
    const allocationIndex = buildAllocationIndex(allocations);
    const allocationOverrideIndex = buildAllocationOverrideIndex(allocationOverrides);
    const resultsOutput = document.getElementById("resultsOutput");
    resultsOutput.innerHTML = `<h3>Yearly Overview ${year}</h3>`;
    const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
    const personTable = document.createElement("table");
    const pHeader = ["Person", ...months, "Total", "FTE", "Delta"];
    personTable.innerHTML = `<thead><tr>${pHeader.map((h) => `<th>${h}</th>`).join("")}</tr></thead>`;
    const pTbody = document.createElement("tbody");
    people.forEach((p) => {
      const fte = p.fte ?? 1;
      const cells = calculatePersonMonthlyTotals(allocationIndex, p.id, projects, months, fte, fteOverrides, allocationOverrideIndex);
      const total = sumArray(cells);
      let expectedFteYearly = 0;
      months.forEach((month) => {
        let monthFte = fte;
        const applicableFteOverrides = fteOverrides.filter(
          (override) => override.personId === p.id && override.startMonth <= month && (!override.endMonth || override.endMonth >= month)
        );
        if (applicableFteOverrides.length > 0) {
          const sortedOverrides = applicableFteOverrides.sort(
            (a, b) => b.startMonth.localeCompare(a.startMonth)
          );
          monthFte = sortedOverrides[0].fte;
        }
        expectedFteYearly += monthFte;
      });
      const delta = total - expectedFteYearly;
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${p.name}</td>` + cells.map((c, idx) => {
        const month = months[idx];
        let monthFte = fte;
        const applicableFteOverrides = fteOverrides.filter(
          (override) => override.personId === p.id && override.startMonth <= month && (!override.endMonth || override.endMonth >= month)
        );
        if (applicableFteOverrides.length > 0) {
          const sortedOverrides = applicableFteOverrides.sort(
            (a, b) => b.startMonth.localeCompare(a.startMonth)
          );
          monthFte = sortedOverrides[0].fte;
        }
        return `<td class="${cellClass(c, monthFte)}">${formatPMWithPct(c, monthFte)}</td>`;
      }).join("") + `<td class="${cellClass(total, expectedFteYearly)}">${total.toFixed(2)}</td><td>${expectedFteYearly.toFixed(2)}</td><td class="${cellClass(delta, 0)}">${delta.toFixed(2)}</td>`;
      pTbody.appendChild(tr);
    });
    const tfoot = document.createElement("tfoot");
    const sumRow = document.createElement("tr");
    const monthlySums = months.map((m) => {
      let sum = 0;
      people.forEach((p) => {
        let fte = p.fte ?? 1;
        const applicableFteOverrides = fteOverrides.filter(
          (override) => override.personId === p.id && override.startMonth <= m && (!override.endMonth || override.endMonth >= m)
        );
        if (applicableFteOverrides.length > 0) {
          const sortedOverrides = applicableFteOverrides.sort(
            (a, b) => b.startMonth.localeCompare(a.startMonth)
          );
          fte = sortedOverrides[0].fte;
        }
        sum += calculatePersonTotal(allocationIndex, p.id, projects, m, fte, allocationOverrideIndex);
      });
      return sum;
    });
    const totalSum = sumArray(monthlySums);
    let fteSum = 0;
    people.forEach((p) => {
      months.forEach((month) => {
        let monthFte = p.fte ?? 1;
        const applicableFteOverrides = fteOverrides.filter(
          (override) => override.personId === p.id && override.startMonth <= month && (!override.endMonth || override.endMonth >= month)
        );
        if (applicableFteOverrides.length > 0) {
          const sortedOverrides = applicableFteOverrides.sort(
            (a, b) => b.startMonth.localeCompare(a.startMonth)
          );
          monthFte = sortedOverrides[0].fte;
        }
        fteSum += monthFte;
      });
    });
    const deltaSum = totalSum - fteSum;
    sumRow.innerHTML = `<td><strong>Total</strong></td>` + monthlySums.map((sum) => `<td><strong>${sum.toFixed(2)}</strong></td>`).join("") + `<td><strong>${totalSum.toFixed(2)}</strong></td><td><strong>${fteSum.toFixed(2)}</strong></td><td class="${cellClass(deltaSum, 0)}"><strong>${deltaSum.toFixed(2)}</strong></td>`;
    tfoot.appendChild(sumRow);
    personTable.appendChild(pTbody);
    personTable.appendChild(tfoot);
    resultsOutput.appendChild(personTable);
    const projTable = document.createElement("table");
    const projHeader = ["Project", ...months, "Total", "Planned", "Delta"];
    projTable.innerHTML = `<thead><tr>${projHeader.map((h) => `<th>${h}</th>`).join("")}</tr></thead>`;
    const projTbody = document.createElement("tbody");
    projects.forEach((p) => {
      const cells = calculateProjectMonthlyTotals(allocationIndex, p.id, people, months, fteOverrides, allocationOverrideIndex);
      const total = sumArray(cells);
      let expectedPlannedYearly = 0;
      months.forEach((month) => {
        let monthPlanned = p.plannedPM ?? 0;
        const applicableBudgetOverrides = projectBudgetOverrides.filter(
          (override) => override.projectId === p.id && override.startMonth <= month && (!override.endMonth || override.endMonth >= month)
        );
        if (applicableBudgetOverrides.length > 0) {
          const sortedOverrides = applicableBudgetOverrides.sort(
            (a, b) => b.startMonth.localeCompare(a.startMonth)
          );
          monthPlanned = sortedOverrides[0].plannedPM;
        }
        expectedPlannedYearly += monthPlanned;
      });
      const delta = total - expectedPlannedYearly;
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${p.name}</td>` + cells.map((c, idx) => {
        const month = months[idx];
        let monthPlanned = p.plannedPM ?? 0;
        const applicableBudgetOverrides = projectBudgetOverrides.filter(
          (override) => override.projectId === p.id && override.startMonth <= month && (!override.endMonth || override.endMonth >= month)
        );
        if (applicableBudgetOverrides.length > 0) {
          const sortedOverrides = applicableBudgetOverrides.sort(
            (a, b) => b.startMonth.localeCompare(a.startMonth)
          );
          monthPlanned = sortedOverrides[0].plannedPM;
        }
        return `<td class="${cellClass(c, monthPlanned)}">${c.toFixed(2)}</td>`;
      }).join("") + `<td class="${cellClass(total, expectedPlannedYearly)}">${total.toFixed(2)}</td><td>${expectedPlannedYearly.toFixed(2)}</td><td class="${cellClass(delta, 0)}">${delta.toFixed(2)}</td>`;
      projTbody.appendChild(tr);
    });
    const tfootProj = document.createElement("tfoot");
    const sumRowProj = document.createElement("tr");
    const monthlySumsProj = months.map((m) => {
      let sum = 0;
      projects.forEach((p) => {
        sum += calculateProjectTotal(allocationIndex, p.id, people, m, fteOverrides, allocationOverrideIndex);
      });
      return sum;
    });
    const totalSumProj = sumArray(monthlySumsProj);
    let plannedSumProj = 0;
    projects.forEach((p) => {
      months.forEach((month) => {
        let monthPlanned = p.plannedPM ?? 0;
        const applicableBudgetOverrides = projectBudgetOverrides.filter(
          (override) => override.projectId === p.id && override.startMonth <= month && (!override.endMonth || override.endMonth >= month)
        );
        if (applicableBudgetOverrides.length > 0) {
          const sortedOverrides = applicableBudgetOverrides.sort(
            (a, b) => b.startMonth.localeCompare(a.startMonth)
          );
          monthPlanned = sortedOverrides[0].plannedPM;
        }
        plannedSumProj += monthPlanned;
      });
    });
    const deltaSumProj = totalSumProj - plannedSumProj;
    sumRowProj.innerHTML = `<td><strong>Total</strong></td>` + monthlySumsProj.map((sum) => `<td><strong>${sum.toFixed(2)}</strong></td>`).join("") + `<td><strong>${totalSumProj.toFixed(2)}</strong></td><td><strong>${plannedSumProj.toFixed(2)}</strong></td><td class="${cellClass(deltaSumProj, 0)}"><strong>${deltaSumProj.toFixed(2)}</strong></td>`;
    tfootProj.appendChild(sumRowProj);
    projTable.appendChild(projTbody);
    projTable.appendChild(tfootProj);
    resultsOutput.appendChild(projTable);
  }
  function initYearlyReport() {
    if (typeof document === "undefined") return;
    const calculateYearBtn = document.getElementById("calculateYearBtn");
    if (!calculateYearBtn) return;
    calculateYearBtn.addEventListener("click", async () => {
      const year = document.getElementById("yearInput").value;
      await calculateYear(year);
    });
  }

  // js/views/projectOverview.js
  async function renderProjectMonthlyOverview(year) {
    const projects = await getProjects();
    const people = await getPeople();
    const allocations = await getAllocations();
    const fteOverrides = await getFteOverrides();
    const projectBudgetOverrides = await getProjectBudgetOverrides();
    const allocationOverrides = await getAllocationOverrides();
    const allocationIndex = buildAllocationIndex(allocations);
    const allocationOverrideIndex = buildAllocationOverrideIndex(allocationOverrides);
    const resultsOutput = document.getElementById("resultsOutput");
    resultsOutput.innerHTML = `<h3>Project \xD7 Month Overview ${year}</h3>`;
    const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
    const table = document.createElement("table");
    const header = ["Project", ...months, "Total", "Planned", "Delta"];
    table.innerHTML = `<thead><tr>${header.map((h) => `<th>${h}</th>`).join("")}</tr></thead>`;
    const tbody = document.createElement("tbody");
    projects.forEach((p) => {
      const cells = calculateProjectMonthlyTotals(allocationIndex, p.id, people, months, fteOverrides, allocationOverrideIndex);
      const total = sumArray(cells);
      let expectedPlannedYearly = 0;
      months.forEach((month) => {
        let monthPlanned = p.plannedPM ?? 0;
        const applicableBudgetOverrides = projectBudgetOverrides.filter(
          (override) => override.projectId === p.id && override.startMonth <= month && (!override.endMonth || override.endMonth >= month)
        );
        if (applicableBudgetOverrides.length > 0) {
          const sortedOverrides = applicableBudgetOverrides.sort(
            (a, b) => b.startMonth.localeCompare(a.startMonth)
          );
          monthPlanned = sortedOverrides[0].plannedPM;
        }
        expectedPlannedYearly += monthPlanned;
      });
      const delta = total - expectedPlannedYearly;
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${p.name}</td>` + cells.map((c, idx) => {
        const month = months[idx];
        let monthPlanned = p.plannedPM ?? 0;
        const applicableBudgetOverrides = projectBudgetOverrides.filter(
          (override) => override.projectId === p.id && override.startMonth <= month && (!override.endMonth || override.endMonth >= month)
        );
        if (applicableBudgetOverrides.length > 0) {
          const sortedOverrides = applicableBudgetOverrides.sort(
            (a, b) => b.startMonth.localeCompare(a.startMonth)
          );
          monthPlanned = sortedOverrides[0].plannedPM;
        }
        return `<td class="${cellClass(c, monthPlanned)}">${c.toFixed(2)}</td>`;
      }).join("") + `<td class="${cellClass(total, expectedPlannedYearly)}">${total.toFixed(2)}</td><td>${expectedPlannedYearly.toFixed(2)}</td><td class="${cellClass(delta, 0)}">${delta.toFixed(2)}</td>`;
      tbody.appendChild(tr);
    });
    const tfoot = document.createElement("tfoot");
    const sumRow = document.createElement("tr");
    sumRow.innerHTML = `<td><strong>Total</strong></td>` + months.map((month) => {
      let monthSum = 0;
      projects.forEach((p) => {
        monthSum += calculateProjectTotal(allocationIndex, p.id, people, month, fteOverrides, allocationOverrideIndex);
      });
      return `<td><strong>${monthSum.toFixed(2)}</strong></td>`;
    }).join("") + `<td colspan="3"></td>`;
    tfoot.appendChild(sumRow);
    table.appendChild(tbody);
    table.appendChild(tfoot);
    resultsOutput.appendChild(table);
  }
  function initProjectOverview() {
    if (typeof document === "undefined") return;
    const projectMonthlyBtn = document.getElementById("projectMonthlyBtn");
    if (!projectMonthlyBtn) return;
    projectMonthlyBtn.addEventListener("click", async () => {
      const year = document.getElementById("overviewYearInput").value;
      await renderProjectMonthlyOverview(year);
    });
  }

  // js/views/dataManagement.js
  async function init() {
    if (typeof document === "undefined") {
      return;
    }
    const exportBtn = document.getElementById("exportDataBtn");
    if (exportBtn) {
      exportBtn.addEventListener("click", async () => {
        try {
          const data = await exportAllData();
          const filename = downloadJSON(data);
          showDownloadSuccess(filename);
        } catch (e) {
          alert("Export failed: " + e.message);
        }
      });
    }
    const downloadAutoBtn = document.getElementById("downloadAutoBackupBtn");
    if (downloadAutoBtn) {
      downloadAutoBtn.addEventListener("click", () => {
        const autoBackup = getAutoPreparedBackup();
        if (!autoBackup) {
          alert("No automatic backup available yet. Please wait a moment and try again.");
          return;
        }
        try {
          const filename = downloadJSON(autoBackup.data);
          showDownloadSuccess(filename);
        } catch (e) {
          alert("Download failed: " + e.message);
        }
      });
    }
    const importBtn = document.getElementById("importDataBtn");
    const importFileInput = document.getElementById("importFileInput");
    if (importBtn && importFileInput) {
      importBtn.addEventListener("click", () => {
        importFileInput.click();
      });
      importFileInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          if (!confirm("This will replace all existing data. Are you sure?")) {
            e.target.value = "";
            return;
          }
          await importAllData(data);
          alert("Data imported successfully! Refreshing...");
          location.reload();
        } catch (e2) {
          alert("Import failed: " + e2.message);
        } finally {
          e.target.value = "";
        }
      });
    }
    const createBackupBtn = document.getElementById("createBackupBtn");
    if (createBackupBtn) {
      createBackupBtn.addEventListener("click", async () => {
        try {
          await createBackup();
          alert("\u2705 Backup created successfully!\n\nThe backup is stored in your browser's localStorage. To save a permanent copy, use the 'Download Latest Auto-Backup' button above.");
          await renderBackups();
        } catch (e) {
          alert("Backup failed: " + e.message);
        }
      });
    }
    await renderBackups();
    updateAutoBackupStatus();
    setupBeforeUnloadWarning();
  }
  function downloadJSON(data) {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const filename = `resource-allocation-backup-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json`;
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return filename;
  }
  function showDownloadSuccess(filename) {
    const message = `\u2705 Download started successfully!

File: ${filename}

The file will be saved to your browser's default Downloads folder.

\u{1F4A1} Tip: Check your browser's download bar (usually at the bottom) or Downloads folder to find the file.`;
    alert(message);
  }
  function setupBeforeUnloadWarning() {
    if (typeof window === "undefined") {
      return;
    }
    const BACKUP_WARNING_THRESHOLD_MINUTES = 5;
    window.addEventListener("beforeunload", (e) => {
      const autoBackup = getAutoPreparedBackup();
      if (autoBackup) {
        const preparedDate = new Date(autoBackup.preparedAt);
        if (isNaN(preparedDate.getTime())) {
          return;
        }
        const minutesAgo = Math.floor((Date.now() - preparedDate.getTime()) / 6e4);
        if (minutesAgo >= BACKUP_WARNING_THRESHOLD_MINUTES) {
          const message = "You have unsaved changes! Consider downloading a backup before leaving.";
          e.preventDefault();
          e.returnValue = message;
          return message;
        }
      }
    });
  }
  function updateAutoBackupStatus() {
    if (typeof document === "undefined") {
      return;
    }
    const statusElement = document.getElementById("autoBackupStatus");
    const downloadBtn = document.getElementById("downloadAutoBackupBtn");
    if (!statusElement || !downloadBtn) {
      return;
    }
    const autoBackup = getAutoPreparedBackup();
    if (autoBackup) {
      const preparedDate = new Date(autoBackup.preparedAt);
      const timeAgo = getTimeAgo(preparedDate);
      statusElement.textContent = `Last prepared: ${timeAgo} (${preparedDate.toLocaleString()})`;
      statusElement.className = "auto-backup-status ready";
      downloadBtn.disabled = false;
    } else {
      statusElement.textContent = "No automatic backup prepared yet";
      statusElement.className = "auto-backup-status not-ready";
      downloadBtn.disabled = true;
    }
  }
  function getTimeAgo(date) {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1e3);
    if (seconds < 60) return `${seconds} second${seconds !== 1 ? "s" : ""} ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  }
  async function renderBackups() {
    if (typeof document === "undefined") {
      return;
    }
    const tbody = document.querySelector("#backupsTable tbody");
    if (!tbody) {
      return;
    }
    const backups = getAllBackups();
    tbody.innerHTML = "";
    if (backups.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3">No backups found</td></tr>';
      return;
    }
    backups.forEach((backup) => {
      const row = document.createElement("tr");
      const dateCell = document.createElement("td");
      dateCell.textContent = backup.date.toLocaleString();
      row.appendChild(dateCell);
      const exportDateCell = document.createElement("td");
      exportDateCell.textContent = new Date(backup.exportDate).toLocaleString();
      row.appendChild(exportDateCell);
      const actionsCell = document.createElement("td");
      const restoreBtn = document.createElement("button");
      restoreBtn.textContent = "Restore";
      restoreBtn.addEventListener("click", async () => {
        if (!confirm("This will replace all current data with this backup. Continue?")) {
          return;
        }
        try {
          await restoreBackup(backup.key);
          alert("Backup restored successfully! Refreshing...");
          location.reload();
        } catch (e) {
          alert("Restore failed: " + e.message);
        }
      });
      actionsCell.appendChild(restoreBtn);
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.style.marginLeft = "5px";
      deleteBtn.addEventListener("click", () => {
        if (confirm("Delete this backup?")) {
          deleteBackup(backup.key);
          renderBackups();
        }
      });
      actionsCell.appendChild(deleteBtn);
      row.appendChild(actionsCell);
      tbody.appendChild(row);
    });
    updateAutoBackupStatus();
  }
  var autoBackupTimer = null;
  function scheduleAutoBackup() {
    if (autoBackupTimer) {
      clearTimeout(autoBackupTimer);
    }
    autoBackupTimer = setTimeout(async () => {
      try {
        await createBackup();
        console.log("Auto-backup created at", (/* @__PURE__ */ new Date()).toLocaleString());
        if (document.getElementById("autoBackupStatus")) {
          updateAutoBackupStatus();
          await renderBackups();
        }
      } catch (e) {
        console.error("Auto-backup failed:", e);
      }
    }, 5e3);
  }

  // js/main.js
  if (typeof window !== "undefined" && typeof document !== "undefined" && document.readyState !== void 0) {
    (async () => {
      await openDatabase();
      initTabs();
      initPeopleView();
      initProjectsView();
      initAllocationsView();
      initFteHistoryView();
      initBudgetHistoryView();
      init();
      initMonthlyReport();
      initYearlyReport();
      initProjectOverview();
      await renderPeople();
      await renderProjects();
      await renderAllocations();
      await renderAllocationOverrides();
      await renderFteOverrides();
      await renderBudgetOverrides();
      await populatePersonSelect();
      await populateProjectSelect();
      await populateAllocationSelect();
      await populateFtePersonSelect();
      await populateBudgetProjectSelect();
      try {
        await createBackup();
        console.log("Initial backup created");
        updateAutoBackupStatus();
      } catch (e) {
        console.error("Failed to create initial backup:", e);
      }
      window.modulesLoaded = true;
    })();
  }
  return __toCommonJS(main_exports);
})();
