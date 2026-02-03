var App = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
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

  // js/ui/toast.js
  var toast_exports = {};
  __export(toast_exports, {
    showError: () => showError,
    showInfo: () => showInfo,
    showSuccess: () => showSuccess,
    showToast: () => showToast,
    showWarning: () => showWarning
  });
  function showToast(message, type = "info", duration = 3e3) {
    if (typeof document === "undefined") return;
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.className = "toast-container";
      document.body.appendChild(container);
    }
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    const icons = {
      success: "\u2713",
      error: "\u2717",
      warning: "\u26A0",
      info: "\u2139"
    };
    const icon = icons[type] || icons.info;
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" aria-label="Close">&times;</button>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add("toast-show"), 10);
    const closeBtn = toast.querySelector(".toast-close");
    closeBtn.addEventListener("click", () => removeToast(toast));
    setTimeout(() => removeToast(toast), duration);
  }
  function removeToast(toast) {
    if (!toast || !toast.parentElement) return;
    toast.classList.remove("toast-show");
    toast.classList.add("toast-hide");
    setTimeout(() => {
      if (toast.parentElement) {
        toast.parentElement.removeChild(toast);
      }
    }, 300);
  }
  function showSuccess(message, duration) {
    showToast(message, "success", duration);
  }
  function showError(message, duration) {
    showToast(message, "error", duration);
  }
  function showWarning(message, duration) {
    showToast(message, "warning", duration);
  }
  function showInfo(message, duration) {
    showToast(message, "info", duration);
  }
  var init_toast = __esm({
    "js/ui/toast.js"() {
    }
  });

  // js/helpers/tableHelpers.js
  var tableHelpers_exports = {};
  __export(tableHelpers_exports, {
    addBatchSelection: () => addBatchSelection,
    addTableFilter: () => addTableFilter,
    getSelectedRows: () => getSelectedRows,
    makeTableSortable: () => makeTableSortable
  });
  function makeTableSortable(table, sortableColumns = []) {
    if (!table) return;
    const thead = table.querySelector("thead");
    if (!thead) return;
    const headers = thead.querySelectorAll("th");
    const tbody = table.querySelector("tbody");
    headers.forEach((header, index) => {
      if (sortableColumns.length > 0 && !sortableColumns.includes(index)) {
        return;
      }
      header.classList.add("sortable");
      header.style.cursor = "pointer";
      header.addEventListener("click", () => {
        sortTable(table, index, header);
      });
    });
  }
  function sortTable(table, columnIndex, header) {
    const tbody = table.querySelector("tbody");
    if (!tbody) return;
    const rows = Array.from(tbody.querySelectorAll("tr"));
    let ascending = true;
    if (header.classList.contains("sort-asc")) {
      ascending = false;
    }
    table.querySelectorAll("th").forEach((th) => {
      th.classList.remove("sort-asc", "sort-desc");
    });
    header.classList.add(ascending ? "sort-asc" : "sort-desc");
    rows.sort((a, b) => {
      const aCell = a.cells[columnIndex];
      const bCell = b.cells[columnIndex];
      if (!aCell || !bCell) return 0;
      let aValue = getCellValue(aCell);
      let bValue = getCellValue(bCell);
      const aNum = parseFloat(aValue);
      const bNum = parseFloat(bValue);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return ascending ? aNum - bNum : bNum - aNum;
      }
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
      if (aValue < bValue) return ascending ? -1 : 1;
      if (aValue > bValue) return ascending ? 1 : -1;
      return 0;
    });
    rows.forEach((row) => tbody.appendChild(row));
  }
  function getCellValue(cell) {
    const input = cell.querySelector('input[type="text"], input[type="number"]');
    if (input) return input.value;
    const select = cell.querySelector("select");
    if (select) return select.options[select.selectedIndex]?.text || "";
    const checkbox = cell.querySelector('input[type="checkbox"]');
    if (checkbox) return checkbox.checked ? "1" : "0";
    return cell.textContent.trim();
  }
  function addTableFilter(table, searchInput) {
    if (!table || !searchInput) return;
    searchInput.addEventListener("input", () => {
      filterTable(table, searchInput.value);
    });
  }
  function filterTable(table, searchTerm) {
    const tbody = table.querySelector("tbody");
    if (!tbody) return;
    const rows = tbody.querySelectorAll("tr");
    const term = searchTerm.toLowerCase();
    rows.forEach((row) => {
      if (row.classList.contains("quick-add-row")) {
        return;
      }
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(term) ? "" : "none";
    });
  }
  function addBatchSelection(table, onSelectionChange) {
    if (!table) return;
    const thead = table.querySelector("thead tr");
    const tbody = table.querySelector("tbody");
    if (!thead || !tbody) return;
    if (thead.querySelector(".select-all-checkbox")) {
      return;
    }
    const selectAllTh = document.createElement("th");
    selectAllTh.innerHTML = '<input type="checkbox" class="select-all-checkbox">';
    thead.appendChild(selectAllTh);
    const selectAllCheckbox = selectAllTh.querySelector(".select-all-checkbox");
    selectAllCheckbox.addEventListener("change", () => {
      const checkboxes = tbody.querySelectorAll(".row-select-checkbox");
      checkboxes.forEach((cb) => {
        cb.checked = selectAllCheckbox.checked;
      });
      updateSelection();
    });
    const rows = tbody.querySelectorAll("tr");
    rows.forEach((row) => {
      const selectTd = document.createElement("td");
      selectTd.innerHTML = '<input type="checkbox" class="row-select-checkbox">';
      row.appendChild(selectTd);
      const checkbox = selectTd.querySelector(".row-select-checkbox");
      checkbox.addEventListener("change", updateSelection);
    });
    function updateSelection() {
      const checkboxes = Array.from(tbody.querySelectorAll(".row-select-checkbox"));
      const selected = checkboxes.filter((cb) => cb.checked);
      if (onSelectionChange) {
        onSelectionChange(selected.length, checkboxes.length);
      }
    }
  }
  function getSelectedRows(table) {
    if (!table) return [];
    const tbody = table.querySelector("tbody");
    if (!tbody) return [];
    const selected = [];
    const checkboxes = tbody.querySelectorAll(".row-select-checkbox:checked");
    checkboxes.forEach((checkbox) => {
      const row = checkbox.closest("tr");
      const deleteBtn = row.querySelector("[data-id]");
      if (deleteBtn) {
        selected.push(deleteBtn.getAttribute("data-id"));
      }
    });
    return selected;
  }
  var init_tableHelpers = __esm({
    "js/helpers/tableHelpers.js"() {
    }
  });

  // js/main.js
  var main_exports = {};
  __export(main_exports, {
    scheduleAutoBackup: () => scheduleAutoBackup
  });

  // js/data/crudHelper.js
  function performTransaction(db2, storeName, operation, data, invalidateCache2) {
    return new Promise((resolve, reject) => {
      try {
        const tx = db2.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        if (operation === "add") {
          store.add(data);
        } else if (operation === "put") {
          store.put(data);
        } else if (operation === "delete") {
          store.delete(data);
        } else {
          throw new Error(`Unknown operation: ${operation}`);
        }
        tx.oncomplete = () => {
          invalidateCache2();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      } catch (error) {
        reject(error);
      }
    });
  }
  function addRecord(db2, storeName, data, invalidateCache2) {
    return performTransaction(db2, storeName, "add", data, invalidateCache2);
  }
  function updateRecord(db2, storeName, data, invalidateCache2) {
    return performTransaction(db2, storeName, "put", data, invalidateCache2);
  }
  function deleteRecord(db2, storeName, id, invalidateCache2) {
    return performTransaction(db2, storeName, "delete", id, invalidateCache2);
  }

  // js/config/entitySchemas.js
  var peopleSchema = {
    fields: [
      {
        key: "name",
        label: "Name",
        type: "text",
        required: true,
        editable: true,
        showInTable: true,
        order: 1
      },
      {
        key: "type",
        label: "Type",
        type: "select",
        required: true,
        editable: true,
        showInTable: true,
        order: 2,
        options: [
          { value: "210", label: "210" },
          { value: "220", label: "220" },
          { value: "230", label: "230" },
          { value: "240", label: "240" },
          { value: "250", label: "250" }
        ],
        defaultValue: "210",
        validate: (value) => {
          const validValues = ["210", "220", "230", "240", "250"];
          if (!validValues.includes(value)) {
            return { valid: false, message: `Type must be one of: ${validValues.join(", ")}` };
          }
          return { valid: true, message: "" };
        }
      },
      {
        key: "active",
        label: "Active",
        type: "checkbox",
        required: false,
        editable: true,
        showInTable: true,
        order: 3,
        defaultValue: true
      }
    ],
    // Default values for new person
    getDefaults: () => ({
      name: "",
      type: "210",
      active: true
    })
  };
  var projectsSchema = {
    fields: [
      {
        key: "name",
        label: "Name",
        type: "text",
        required: true,
        editable: true,
        showInTable: true,
        order: 1
      }
    ],
    // Default values for new project
    getDefaults: () => ({
      name: ""
    })
  };
  function getTableHeaders(schema) {
    return schema.fields.filter((f) => f.showInTable).sort((a, b) => a.order - b.order).map((f) => f.label);
  }
  function getEditableFields(schema) {
    return schema.fields.filter((f) => f.editable).sort((a, b) => a.order - b.order);
  }

  // js/config/constants.js
  var MILLISECONDS_PER_SECOND = 1e3;
  var SECONDS_PER_MINUTE = 60;
  var MINUTES_PER_HOUR = 60;
  var HOURS_PER_DAY = 24;
  var MILLISECONDS_PER_MINUTE = MILLISECONDS_PER_SECOND * SECONDS_PER_MINUTE;
  var AUTO_BACKUP_DELAY_MS = 5e3;
  var DEFAULT_START_MONTH = "2020-01";
  var DEFAULT_FTE = 1;
  var MIN_FTE = 0;
  var MAX_FTE = 1;
  var MIN_PM = 0;
  var PM_STEP = 0.01;
  var MONTHS_PER_YEAR = 12;

  // js/data/database.js
  var DB_NAME = "resource-planning";
  var DB_VERSION = 5;
  var db;
  var cache = {
    people: null,
    projects: null,
    defaultAllocations: null,
    fteValues: null,
    budgetValues: null,
    allocationOverrides: null
  };
  var cacheValid = {
    people: false,
    projects: false,
    defaultAllocations: false,
    fteValues: false,
    budgetValues: false,
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
      cacheValid.fteValues = false;
      cacheValid.budgetValues = false;
      cacheValid.allocationOverrides = false;
      cache.people = null;
      cache.projects = null;
      cache.defaultAllocations = null;
      cache.fteValues = null;
      cache.budgetValues = null;
      cache.allocationOverrides = null;
    }
  }
  async function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db2 = e.target.result;
        const oldVersion = e.oldVersion;
        const transaction = e.target.transaction;
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
        if (oldVersion < 4 && oldVersion >= 3) {
          if (db2.objectStoreNames.contains("fteOverrides")) {
            const fteValuesStore = db2.createObjectStore("fteValues", { keyPath: "id", autoIncrement: true });
            const oldFteStore = transaction.objectStore("fteOverrides");
            const fteRequest = oldFteStore.getAll();
            fteRequest.onsuccess = () => {
              const records = fteRequest.result;
              records.forEach((record) => {
                fteValuesStore.add(record);
              });
            };
          }
          if (db2.objectStoreNames.contains("projectBudgetOverrides")) {
            const budgetValuesStore = db2.createObjectStore("budgetValues", { keyPath: "id", autoIncrement: true });
            const oldBudgetStore = transaction.objectStore("projectBudgetOverrides");
            const budgetRequest = oldBudgetStore.getAll();
            budgetRequest.onsuccess = () => {
              const records = budgetRequest.result;
              records.forEach((record) => {
                budgetValuesStore.add(record);
              });
            };
          }
          const peopleStore = transaction.objectStore("people");
          const peopleRequest = peopleStore.getAll();
          peopleRequest.onsuccess = () => {
            const people = peopleRequest.result;
            const fteValuesStore = transaction.objectStore("fteValues");
            people.forEach((person) => {
              if (person.fte !== void 0 && person.fte !== null) {
                fteValuesStore.add({
                  personId: person.id,
                  fte: person.fte,
                  startMonth: DEFAULT_START_MONTH,
                  // Use a reasonable start date
                  endMonth: null
                  // Open-ended
                });
                delete person.fte;
                peopleStore.put(person);
              }
            });
          };
          const projectsStore = transaction.objectStore("projects");
          const projectsRequest = projectsStore.getAll();
          projectsRequest.onsuccess = () => {
            const projects = projectsRequest.result;
            const budgetValuesStore = transaction.objectStore("budgetValues");
            projects.forEach((project) => {
              if (project.plannedPM !== void 0 && project.plannedPM !== null) {
                budgetValuesStore.add({
                  projectId: project.id,
                  plannedPM: project.plannedPM,
                  startMonth: DEFAULT_START_MONTH,
                  // Use a reasonable start date
                  endMonth: null
                  // Open-ended
                });
                delete project.plannedPM;
                projectsStore.put(project);
              }
            });
          };
        } else if (oldVersion < 4 && oldVersion < 3) {
          if (!db2.objectStoreNames.contains("fteValues")) {
            db2.createObjectStore("fteValues", { keyPath: "id", autoIncrement: true });
          }
          if (!db2.objectStoreNames.contains("budgetValues")) {
            db2.createObjectStore("budgetValues", { keyPath: "id", autoIncrement: true });
          }
          if (!db2.objectStoreNames.contains("allocationOverrides")) {
            db2.createObjectStore("allocationOverrides", { keyPath: "id", autoIncrement: true });
          }
          const peopleStore = transaction.objectStore("people");
          const peopleRequest = peopleStore.getAll();
          peopleRequest.onsuccess = () => {
            const people = peopleRequest.result;
            const fteValuesStore = transaction.objectStore("fteValues");
            people.forEach((person) => {
              if (person.fte !== void 0 && person.fte !== null) {
                fteValuesStore.add({
                  personId: person.id,
                  fte: person.fte,
                  startMonth: DEFAULT_START_MONTH,
                  endMonth: null
                });
                delete person.fte;
                peopleStore.put(person);
              }
            });
          };
          const projectsStore = transaction.objectStore("projects");
          const projectsRequest = projectsStore.getAll();
          projectsRequest.onsuccess = () => {
            const projects = projectsRequest.result;
            const budgetValuesStore = transaction.objectStore("budgetValues");
            projects.forEach((project) => {
              if (project.plannedPM !== void 0 && project.plannedPM !== null) {
                budgetValuesStore.add({
                  projectId: project.id,
                  plannedPM: project.plannedPM,
                  startMonth: DEFAULT_START_MONTH,
                  endMonth: null
                });
                delete project.plannedPM;
                projectsStore.put(project);
              }
            });
          };
        }
        if (oldVersion < 5) {
          const peopleStore = transaction.objectStore("people");
          const peopleRequest = peopleStore.getAll();
          peopleRequest.onsuccess = () => {
            const people = peopleRequest.result;
            const defaults = peopleSchema.getDefaults();
            people.forEach((person) => {
              if (!person.type) {
                person.type = defaults.type;
                peopleStore.put(person);
              }
            });
          };
          const allocationsStore = transaction.objectStore("defaultAllocations");
          const fteValuesStore = transaction.objectStore("fteValues");
          const allocationsRequest = allocationsStore.getAll();
          const fteValuesRequest = fteValuesStore.getAll();
          allocationsRequest.onsuccess = () => {
            fteValuesRequest.onsuccess = () => {
              const allocations = allocationsRequest.result;
              const fteValues = fteValuesRequest.result;
              allocations.forEach((allocation) => {
                if (allocation.pct !== void 0 && allocation.pct !== null) {
                  let fte = 1;
                  const applicableFteValues = fteValues.filter(
                    (fv) => fv.personId === allocation.personId && fv.startMonth <= allocation.startMonth && (fv.endMonth === null || fv.endMonth >= allocation.startMonth)
                  );
                  if (applicableFteValues.length > 0) {
                    applicableFteValues.sort((a, b) => b.startMonth.localeCompare(a.startMonth));
                    fte = applicableFteValues[0].fte;
                  }
                  allocation.pm = allocation.pct * fte;
                  delete allocation.pct;
                  allocationsStore.put(allocation);
                }
              });
              if (db2.objectStoreNames.contains("allocationOverrides")) {
                const overridesStore = transaction.objectStore("allocationOverrides");
                const overridesRequest = overridesStore.getAll();
                overridesRequest.onsuccess = () => {
                  const overrides = overridesRequest.result;
                  overrides.forEach((override) => {
                    if (override.pct !== void 0 && override.pct !== null) {
                      const allocationId = override.allocationId;
                      const allocRequest = allocationsStore.get(allocationId);
                      allocRequest.onsuccess = () => {
                        const allocation = allocRequest.result;
                        if (allocation) {
                          let fte = 1;
                          const applicableFteValues = fteValues.filter(
                            (fv) => fv.personId === allocation.personId && fv.startMonth <= override.month && (fv.endMonth === null || fv.endMonth >= override.month)
                          );
                          if (applicableFteValues.length > 0) {
                            applicableFteValues.sort((a, b) => b.startMonth.localeCompare(a.startMonth));
                            fte = applicableFteValues[0].fte;
                          }
                          override.pm = override.pct * fte;
                          delete override.pct;
                          overridesStore.put(override);
                        }
                      };
                    }
                  });
                };
              }
            };
          };
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
    return addRecord(db, "people", p, () => invalidateCache("people"));
  }
  async function updatePerson(p) {
    return updateRecord(db, "people", p, () => invalidateCache("people"));
  }
  async function deletePerson(id) {
    return deleteRecord(db, "people", id, () => invalidateCache("people"));
  }
  async function getProjects() {
    return getAll("projects");
  }
  async function addProject(p) {
    if (p.plannedPM !== void 0 && p.plannedPM !== null) {
      const plannedPM = p.plannedPM;
      const projectId = p.id;
      const cleanProject = { ...p };
      delete cleanProject.plannedPM;
      await addRecord(db, "projects", cleanProject, () => invalidateCache("projects"));
      const existingBudgetValues = await getBudgetValues();
      const existingBudget = existingBudgetValues.find((bv) => bv.projectId === projectId);
      if (existingBudget) {
        existingBudget.plannedPM = plannedPM;
        await updateBudgetValue(existingBudget);
      } else {
        await addBudgetValue({
          projectId,
          plannedPM,
          startMonth: DEFAULT_START_MONTH,
          endMonth: null
        });
      }
    } else {
      return addRecord(db, "projects", p, () => invalidateCache("projects"));
    }
  }
  async function updateProject(p) {
    if (p.plannedPM !== void 0 && p.plannedPM !== null) {
      const plannedPM = p.plannedPM;
      const projectId = p.id;
      const cleanProject = { ...p };
      delete cleanProject.plannedPM;
      await updateRecord(db, "projects", cleanProject, () => invalidateCache("projects"));
      const existingBudgetValues = await getBudgetValues();
      const existingBudget = existingBudgetValues.find((bv) => bv.projectId === projectId);
      if (existingBudget) {
        existingBudget.plannedPM = plannedPM;
        await updateBudgetValue(existingBudget);
      } else {
        await addBudgetValue({
          projectId,
          plannedPM,
          startMonth: DEFAULT_START_MONTH,
          endMonth: null
        });
      }
    } else {
      return updateRecord(db, "projects", p, () => invalidateCache("projects"));
    }
  }
  async function deleteProject(id) {
    return deleteRecord(db, "projects", id, () => invalidateCache("projects"));
  }
  async function getAllocations() {
    return getAll("defaultAllocations");
  }
  async function addAllocation(a) {
    return addRecord(db, "defaultAllocations", a, () => invalidateCache("defaultAllocations"));
  }
  async function updateAllocation(a) {
    return updateRecord(db, "defaultAllocations", a, () => invalidateCache("defaultAllocations"));
  }
  async function deleteAllocation(id) {
    return deleteRecord(db, "defaultAllocations", id, () => invalidateCache("defaultAllocations"));
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
    const fteValues = await getFteValues();
    const budgetValues = await getBudgetValues();
    const allocationOverrides = await getAllocationOverrides();
    return {
      version: "3.0",
      exportDate: (/* @__PURE__ */ new Date()).toISOString(),
      data: {
        people,
        projects,
        allocations,
        fteValues,
        budgetValues,
        allocationOverrides
      }
    };
  }
  function convertAllocationToPm(allocation, fteValues) {
    if (allocation.pm !== void 0 && allocation.pm !== null) {
      return allocation;
    }
    if (allocation.pct !== void 0 && allocation.pct !== null) {
      let fte = 1;
      const applicableFteValues = fteValues.filter(
        (fv) => fv.personId === allocation.personId && fv.startMonth <= allocation.startMonth && (fv.endMonth === null || fv.endMonth >= allocation.startMonth)
      );
      if (applicableFteValues.length > 0) {
        applicableFteValues.sort((a, b) => b.startMonth.localeCompare(a.startMonth));
        fte = applicableFteValues[0].fte;
      }
      const converted = { ...allocation };
      converted.pm = allocation.pct * fte;
      delete converted.pct;
      return converted;
    }
    return { ...allocation, pm: 0 };
  }
  function convertOverrideToPm(override, fteValues, allocations) {
    if (override.pm !== void 0 && override.pm !== null) {
      return override;
    }
    if (override.pct !== void 0 && override.pct !== null) {
      const allocation = allocations.find((a) => a.id === override.allocationId);
      if (allocation) {
        let fte = 1;
        const applicableFteValues = fteValues.filter(
          (fv) => fv.personId === allocation.personId && fv.startMonth <= override.month && (fv.endMonth === null || fv.endMonth >= override.month)
        );
        if (applicableFteValues.length > 0) {
          applicableFteValues.sort((a, b) => b.startMonth.localeCompare(a.startMonth));
          fte = applicableFteValues[0].fte;
        }
        const converted = { ...override };
        converted.pm = override.pct * fte;
        delete converted.pct;
        return converted;
      }
    }
    return { ...override, pm: 0 };
  }
  async function importAllData(importedData) {
    if (!importedData || !importedData.data) {
      throw new Error("Invalid data format");
    }
    const {
      people,
      projects,
      allocations,
      fteValues = [],
      budgetValues = [],
      allocationOverrides = [],
      // Support old format for backward compatibility
      fteOverrides = [],
      projectBudgetOverrides = []
    } = importedData.data;
    const tx = db.transaction([
      "people",
      "projects",
      "defaultAllocations",
      "fteValues",
      "budgetValues",
      "allocationOverrides"
    ], "readwrite");
    await tx.objectStore("people").clear();
    await tx.objectStore("projects").clear();
    await tx.objectStore("defaultAllocations").clear();
    await tx.objectStore("fteValues").clear();
    await tx.objectStore("budgetValues").clear();
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
    const fteData = fteValues.length > 0 ? fteValues : fteOverrides;
    if (fteData && Array.isArray(fteData)) {
      for (const value of fteData) {
        await addFteValue(value);
      }
    }
    const budgetData = budgetValues.length > 0 ? budgetValues : projectBudgetOverrides;
    if (budgetData && Array.isArray(budgetData)) {
      for (const value of budgetData) {
        await addBudgetValue(value);
      }
    }
    if (allocations && Array.isArray(allocations)) {
      const currentFteValues = await getFteValues();
      for (const allocation of allocations) {
        const converted = convertAllocationToPm(allocation, currentFteValues);
        await addAllocation(converted);
      }
    }
    if (allocationOverrides && Array.isArray(allocationOverrides)) {
      const currentFteValues = await getFteValues();
      const currentAllocations = await getAllocations();
      for (const override of allocationOverrides) {
        const converted = convertOverrideToPm(override, currentFteValues, currentAllocations);
        await addAllocationOverride(converted);
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
  async function getFteValues() {
    return getAll("fteValues");
  }
  async function addFteValue(value) {
    return addRecord(db, "fteValues", value, () => invalidateCache("fteValues"));
  }
  async function updateFteValue(value) {
    return updateRecord(db, "fteValues", value, () => invalidateCache("fteValues"));
  }
  async function deleteFteValue(id) {
    return deleteRecord(db, "fteValues", id, () => invalidateCache("fteValues"));
  }
  async function getBudgetValues() {
    return getAll("budgetValues");
  }
  async function addBudgetValue(value) {
    return addRecord(db, "budgetValues", value, () => invalidateCache("budgetValues"));
  }
  async function updateBudgetValue(value) {
    return updateRecord(db, "budgetValues", value, () => invalidateCache("budgetValues"));
  }
  async function deleteBudgetValue(id) {
    return deleteRecord(db, "budgetValues", id, () => invalidateCache("budgetValues"));
  }
  async function getAllocationOverrides() {
    return getAll("allocationOverrides");
  }
  async function addAllocationOverride(override) {
    return addRecord(db, "allocationOverrides", override, () => invalidateCache("allocationOverrides"));
  }
  async function updateAllocationOverride(override) {
    return updateRecord(db, "allocationOverrides", override, () => invalidateCache("allocationOverrides"));
  }
  async function deleteAllocationOverride(id) {
    return deleteRecord(db, "allocationOverrides", id, () => invalidateCache("allocationOverrides"));
  }
  async function exportData() {
    return await exportAllData();
  }
  async function importData(data, reload = true) {
    await importAllData(data);
    invalidateCache();
    if (reload && typeof window !== "undefined") {
      window.location.reload();
    } else if (!reload) {
      const event = new CustomEvent("dataImported");
      if (typeof document !== "undefined") {
        document.dispatchEvent(event);
      }
    }
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

  // js/helpers/validationHelper.js
  function validateFteValue(fte) {
    const value = parseFloat(fte);
    if (isNaN(value)) {
      return { valid: false, message: "FTE must be a valid number" };
    }
    if (value < MIN_FTE) {
      return { valid: false, message: `FTE cannot be below ${MIN_FTE}` };
    }
    if (value > MAX_FTE) {
      return { valid: false, message: `FTE cannot be above ${MAX_FTE}` };
    }
    return { valid: true, message: "" };
  }
  function validatePlannedPM(plannedPM) {
    const value = parseFloat(plannedPM);
    if (isNaN(value)) {
      return { valid: false, message: "Planned PM must be a valid number" };
    }
    if (value < MIN_PM) {
      return { valid: false, message: "Planned PM cannot be negative" };
    }
    return { valid: true, message: "" };
  }
  async function validateFteValueDeletion(fteValueId) {
    const fteValues = await getFteValues();
    const value = fteValues.find((v) => v.id === fteValueId);
    if (!value) {
      return { valid: false, message: "FTE value not found" };
    }
    const count = fteValues.filter((v) => v.personId === value.personId).length;
    if (count <= 1) {
      return {
        valid: false,
        message: "Cannot delete the last FTE value for a person. Add another FTE value first."
      };
    }
    return { valid: true, message: "" };
  }
  async function validateBudgetValueDeletion(budgetValueId) {
    const budgetValues = await getBudgetValues();
    const value = budgetValues.find((v) => v.id === budgetValueId);
    if (!value) {
      return { valid: false, message: "Budget value not found" };
    }
    const count = budgetValues.filter((v) => v.projectId === value.projectId).length;
    if (count <= 1) {
      return {
        valid: false,
        message: "Cannot delete the last budget value for a project. Add another budget value first."
      };
    }
    return { valid: true, message: "" };
  }
  function dateRangesOverlap(start1, end1, start2, end2) {
    if (!end1 || !end2) {
      if (!end1 && !end2) {
        return true;
      }
      if (!end1) {
        return end2 >= start1;
      }
      if (!end2) {
        return end1 >= start2;
      }
    }
    return start1 <= end2 && start2 <= end1;
  }
  function getMonthBefore(month) {
    const date = /* @__PURE__ */ new Date(month + "-01");
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().slice(0, 7);
  }
  async function findOverlappingAllocations(personId, projectId, startMonth, endMonth, excludeId = null) {
    const allocations = await getAllocations();
    return allocations.filter((alloc) => {
      if (excludeId !== null && alloc.id === excludeId) {
        return false;
      }
      if (alloc.personId !== personId || alloc.projectId !== projectId) {
        return false;
      }
      return dateRangesOverlap(startMonth, endMonth, alloc.startMonth, alloc.endMonth);
    });
  }
  async function findOpenEndedAllocationsToClose(personId, projectId, startMonth) {
    const allocations = await getAllocations();
    return allocations.filter((alloc) => {
      if (alloc.personId !== personId || alloc.projectId !== projectId) {
        return false;
      }
      if (alloc.endMonth !== null) {
        return false;
      }
      return alloc.startMonth < startMonth;
    });
  }

  // js/views/peopleView.js
  init_toast();

  // js/helpers/undoManager.js
  var MAX_HISTORY = 20;
  var undoStack = [];
  var redoStack = [];
  var isApplyingState = false;
  async function saveState(actionName) {
    if (isApplyingState) return;
    try {
      const state = await exportData();
      undoStack.push({
        data: state,
        action: actionName,
        timestamp: Date.now()
      });
      if (undoStack.length > MAX_HISTORY) {
        undoStack.shift();
      }
      redoStack = [];
      updateUndoRedoButtons();
    } catch (error) {
      console.error("Failed to save state:", error);
    }
  }
  async function undo() {
    if (undoStack.length === 0) return false;
    try {
      isApplyingState = true;
      const currentState = await exportData();
      const lastAction = undoStack.pop();
      redoStack.push({
        data: currentState,
        action: lastAction.action,
        timestamp: Date.now()
      });
      await importData(lastAction.data, false);
      updateUndoRedoButtons();
      return true;
    } catch (error) {
      console.error("Undo failed:", error);
      return false;
    } finally {
      isApplyingState = false;
    }
  }
  async function redo() {
    if (redoStack.length === 0) return false;
    try {
      isApplyingState = true;
      const currentState = await exportData();
      const nextAction = redoStack.pop();
      undoStack.push({
        data: currentState,
        action: nextAction.action,
        timestamp: Date.now()
      });
      await importData(nextAction.data, false);
      updateUndoRedoButtons();
      return true;
    } catch (error) {
      console.error("Redo failed:", error);
      return false;
    } finally {
      isApplyingState = false;
    }
  }
  function canUndo() {
    return undoStack.length > 0;
  }
  function canRedo() {
    return redoStack.length > 0;
  }
  function getLastAction() {
    if (undoStack.length === 0) return null;
    return undoStack[undoStack.length - 1].action;
  }
  function getNextRedoAction() {
    if (redoStack.length === 0) return null;
    return redoStack[redoStack.length - 1].action;
  }
  function updateUndoRedoButtons() {
    if (typeof document === "undefined") return;
    const undoBtn = document.getElementById("undoBtn");
    const redoBtn = document.getElementById("redoBtn");
    if (undoBtn) {
      undoBtn.disabled = !canUndo();
      const lastAction = getLastAction();
      undoBtn.title = lastAction ? `Undo: ${lastAction}` : "Nothing to undo";
    }
    if (redoBtn) {
      redoBtn.disabled = !canRedo();
      const nextAction = getNextRedoAction();
      redoBtn.title = nextAction ? `Redo: ${nextAction}` : "Nothing to redo";
    }
  }
  function initUndoRedoShortcuts() {
    if (typeof document === "undefined") return;
    document.addEventListener("keydown", async (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        const success = await undo();
        if (success) {
          const { showSuccess: showSuccess2 } = await Promise.resolve().then(() => (init_toast(), toast_exports));
          showSuccess2("Undo successful");
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey || (e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        const success = await redo();
        if (success) {
          const { showSuccess: showSuccess2 } = await Promise.resolve().then(() => (init_toast(), toast_exports));
          showSuccess2("Redo successful");
        }
      }
    });
  }

  // js/helpers/quickAdd.js
  function addQuickAddRow(table, placeholders, onAdd, onCancel) {
    if (!table) return;
    const tbody = table.querySelector("tbody");
    if (!tbody) return;
    const existing = tbody.querySelector(".quick-add-row");
    if (existing) {
      existing.remove();
    }
    const tr = document.createElement("tr");
    tr.className = "quick-add-row";
    const thead = table.querySelector("thead");
    const headerRow = thead ? thead.querySelector("tr") : null;
    const totalColumns = headerRow ? headerRow.querySelectorAll("th").length : placeholders.length + 1;
    const cells = placeholders.map((placeholder, index) => {
      return `<td><input type="text" class="quick-add-input" data-index="${index}" placeholder="${placeholder}"></td>`;
    }).join("");
    const emptyCellsNeeded = totalColumns - placeholders.length - 1;
    const emptyCells = emptyCellsNeeded > 0 ? "<td></td>".repeat(emptyCellsNeeded) : "";
    tr.innerHTML = `
        ${cells}
        ${emptyCells}
        <td class="quick-add-actions">
            <button class="quick-add-save" title="Save (Enter)">\u2713</button>
            <button class="quick-add-cancel" title="Cancel (Esc)">\u2717</button>
        </td>
    `;
    tbody.insertBefore(tr, tbody.firstChild);
    const inputs = tr.querySelectorAll(".quick-add-input");
    const saveBtn = tr.querySelector(".quick-add-save");
    const cancelBtn = tr.querySelector(".quick-add-cancel");
    if (inputs.length > 0) {
      inputs[0].focus();
    }
    const handleSave = () => {
      const values = Array.from(inputs).map((input) => input.value.trim());
      if (values.every((v) => !v)) {
        handleCancel();
        return;
      }
      if (onAdd) {
        onAdd(values);
      }
      tr.remove();
    };
    const handleCancel = () => {
      tr.remove();
      if (onCancel) {
        onCancel();
      }
    };
    saveBtn.addEventListener("click", handleSave);
    cancelBtn.addEventListener("click", handleCancel);
    inputs.forEach((input, index) => {
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (index === inputs.length - 1) {
            handleSave();
          } else {
            inputs[index + 1].focus();
          }
        } else if (e.key === "Escape") {
          e.preventDefault();
          handleCancel();
        } else if (e.key === "Tab" && index === inputs.length - 1 && !e.shiftKey) {
          e.preventDefault();
          handleSave();
        }
      });
    });
    return tr;
  }

  // js/views/peopleView.js
  init_tableHelpers();

  // js/helpers/batchOperations.js
  init_tableHelpers();
  function addBatchOperationsToolbar(table, operations) {
    if (!table) return null;
    let toolbar = table.previousElementSibling;
    if (toolbar && toolbar.classList.contains("batch-toolbar")) {
      return toolbar;
    }
    toolbar = document.createElement("div");
    toolbar.className = "batch-toolbar";
    toolbar.style.display = "none";
    const counter = document.createElement("span");
    counter.className = "batch-counter";
    counter.textContent = "0 selected";
    toolbar.appendChild(counter);
    Object.entries(operations).forEach(([name, handler]) => {
      const button = document.createElement("button");
      button.className = "batch-action-btn";
      button.textContent = name;
      button.addEventListener("click", async () => {
        const selectedIds = getSelectedRows(table);
        if (selectedIds.length > 0) {
          await handler(selectedIds);
        }
      });
      toolbar.appendChild(button);
    });
    table.parentNode.insertBefore(toolbar, table);
    return toolbar;
  }
  function updateBatchToolbar(toolbar, selectedCount, totalCount) {
    if (!toolbar) return;
    const counter = toolbar.querySelector(".batch-counter");
    if (counter) {
      counter.textContent = `${selectedCount} of ${totalCount} selected`;
    }
    if (selectedCount > 0) {
      toolbar.style.display = "flex";
    } else {
      toolbar.style.display = "none";
    }
  }

  // js/views/peopleView.js
  async function renderPeople() {
    if (typeof document === "undefined") return;
    const table = document.querySelector("#peopleTable");
    if (!table) return;
    const tbody = table.querySelector("tbody");
    if (!tbody) return;
    const thead = table.querySelector("thead");
    if (thead) {
      const headers = getTableHeaders(peopleSchema);
      thead.innerHTML = `<tr>${headers.map((h) => `<th>${h}</th>`).join("")}<th>Actions</th></tr>`;
    }
    tbody.innerHTML = "";
    const people = await getPeople();
    people.forEach((p) => {
      const tr = document.createElement("tr");
      const fields = getEditableFields(peopleSchema);
      const cells = fields.map((field) => {
        if (field.type === "checkbox") {
          return `<td><input type="checkbox" ${p[field.key] ? "checked" : ""} data-id="${p.id}" data-field="${field.key}"></td>`;
        } else if (field.type === "select") {
          const options = field.options.map(
            (opt) => `<option value="${opt.value}" ${p[field.key] === opt.value ? "selected" : ""}>${opt.label}</option>`
          ).join("");
          return `<td><select data-id="${p.id}" data-field="${field.key}">${options}</select></td>`;
        } else {
          return `<td contenteditable="true" data-id="${p.id}" data-field="${field.key}">${p[field.key] || ""}</td>`;
        }
      }).join("");
      tr.innerHTML = `${cells}<td><button class="delete-person" data-id="${p.id}">Delete</button></td>`;
      tbody.appendChild(tr);
    });
    addBatchSelection(table, (selectedCount, totalCount) => {
      const toolbar = table.previousElementSibling;
      if (toolbar && toolbar.classList.contains("batch-toolbar")) {
        updateBatchToolbar(toolbar, selectedCount, totalCount);
      }
    });
    attachPeopleEventListeners();
    populatePersonSelect();
  }
  async function renderFteValues() {
    if (typeof document === "undefined") return;
    const tbody = document.querySelector("#fteValuesTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    const fteValues = await getFteValues();
    const people = await getPeople();
    const sortedValues = fteValues.sort((a, b) => {
      if (a.personId !== b.personId) {
        return a.personId.localeCompare(b.personId);
      }
      return a.startMonth.localeCompare(b.startMonth);
    });
    sortedValues.forEach((value) => {
      const person = people.find((p) => p.id === value.personId);
      const personName = person ? person.name : value.personId;
      const tr = document.createElement("tr");
      tr.innerHTML = `
            <td>${personName}</td>
            <td contenteditable="true" data-id="${value.id}" data-field="fte">${value.fte}</td>
            <td><input type="month" class="fte-start" value="${value.startMonth}" data-id="${value.id}"></td>
            <td><input type="month" class="fte-end" value="${value.endMonth || ""}" data-id="${value.id}"></td>
            <td><button class="delete-fte-value" data-id="${value.id}">Delete</button></td>
        `;
      tbody.appendChild(tr);
    });
    attachFteValueEventListeners();
    populateFtePersonSelect();
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
        person[field] = value;
        if (field === "name") {
          populatePersonSelect();
          renderFteValues();
        }
        await updatePerson(person);
        scheduleAutoBackup();
      });
    });
    document.querySelectorAll("#peopleTable select").forEach((select) => {
      select.addEventListener("change", async function() {
        const id = this.dataset.id;
        const field = this.dataset.field;
        const value = this.value;
        const people = await getPeople();
        const person = people.find((p) => p.id === id);
        if (!person) {
          console.error(`Person with id ${id} not found`);
          return;
        }
        const fieldDef = peopleSchema.fields.find((f) => f.key === field);
        if (fieldDef && fieldDef.validate) {
          const validation = fieldDef.validate(value);
          if (!validation.valid) {
            alert(validation.message);
            this.value = person[field];
            return;
          }
        }
        person[field] = value;
        await updatePerson(person);
        scheduleAutoBackup();
      });
    });
    document.querySelectorAll("#peopleTable input[type=checkbox]").forEach((checkbox) => {
      checkbox.addEventListener("change", async function() {
        const id = this.dataset.id;
        const field = this.dataset.field;
        const checked = this.checked;
        const people = await getPeople();
        const person = people.find((p) => p.id === id);
        if (!person) {
          console.error(`Person with id ${id} not found`);
          return;
        }
        person[field] = checked;
        await updatePerson(person);
        scheduleAutoBackup();
        if (field === "active") {
          populatePersonSelect();
        }
      });
    });
    document.querySelectorAll(".delete-person").forEach((btn) => {
      btn.addEventListener("click", async function() {
        const id = this.dataset.id;
        const people = await getPeople();
        const person = people.find((p) => p.id === id);
        const personName = person ? person.name : id;
        if (typeof window !== "undefined" && window.confirm) {
          if (!confirm(`Delete ${personName}? This will also delete their FTE values.`)) {
            return;
          }
        }
        await saveState(`Delete person: ${personName}`);
        const fteValues = await getFteValues();
        const personFteValues = fteValues.filter((v) => v.personId === id);
        for (const value of personFteValues) {
          await deleteFteValue(value.id);
        }
        await deletePerson(id);
        scheduleAutoBackup();
        renderPeople();
        renderFteValues();
        showSuccess(`Deleted ${personName}`);
      });
    });
  }
  function attachFteValueEventListeners() {
    if (typeof document === "undefined") return;
    document.querySelectorAll("#fteValuesTable td[contenteditable]").forEach((td) => {
      td.addEventListener("blur", async function() {
        const id = parseInt(this.dataset.id);
        const field = this.dataset.field;
        const value = this.textContent;
        const fteValues = await getFteValues();
        const fteValue = fteValues.find((v) => v.id === id);
        if (field === "fte") {
          const validation = validateFteValue(value);
          if (!validation.valid) {
            alert(validation.message);
            this.textContent = fteValue.fte;
            return;
          }
          fteValue.fte = parseFloat(value);
        }
        await updateFteValue(fteValue);
        scheduleAutoBackup();
      });
    });
    document.querySelectorAll(".fte-start").forEach((input) => {
      input.addEventListener("blur", async function() {
        const id = parseInt(this.dataset.id);
        const fteValues = await getFteValues();
        const fteValue = fteValues.find((v) => v.id === id);
        fteValue.startMonth = this.value;
        await updateFteValue(fteValue);
        scheduleAutoBackup();
      });
    });
    document.querySelectorAll(".fte-end").forEach((input) => {
      input.addEventListener("blur", async function() {
        const id = parseInt(this.dataset.id);
        const fteValues = await getFteValues();
        const fteValue = fteValues.find((v) => v.id === id);
        fteValue.endMonth = this.value || null;
        await updateFteValue(fteValue);
        scheduleAutoBackup();
      });
    });
    document.querySelectorAll(".delete-fte-value").forEach((btn) => {
      btn.addEventListener("click", async function() {
        const id = parseInt(this.dataset.id);
        const validation = await validateFteValueDeletion(id);
        if (!validation.valid) {
          alert(validation.message);
          return;
        }
        await deleteFteValue(id);
        scheduleAutoBackup();
        renderFteValues();
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
  async function addPersonAuto(name) {
    await saveState(`Add person: ${name}`);
    const id = await generatePersonId();
    const defaults = peopleSchema.getDefaults();
    await addPerson({
      id,
      name: name || defaults.name,
      type: defaults.type,
      active: defaults.active
    });
    const currentMonth = (/* @__PURE__ */ new Date()).toISOString().slice(0, 7);
    await addFteValue({
      personId: id,
      fte: DEFAULT_FTE,
      startMonth: currentMonth,
      endMonth: null
      // Open-ended
    });
    scheduleAutoBackup();
    renderPeople();
    renderFteValues();
    showSuccess(`Added person: ${name}`);
  }
  function initPeopleView() {
    if (typeof document === "undefined") return;
    const addPersonBtn = document.getElementById("addPersonBtn");
    if (addPersonBtn) {
      addPersonBtn.addEventListener("click", async () => {
        const peopleTable = document.getElementById("peopleTable");
        if (!peopleTable) return;
        addQuickAddRow(
          peopleTable,
          ["Enter name..."],
          async (values) => {
            const name = values[0];
            if (name) {
              await addPersonAuto(name);
            }
          }
        );
      });
    }
    const addFteValueBtn = document.getElementById("addFteValueBtn");
    if (addFteValueBtn) {
      addFteValueBtn.addEventListener("click", async () => {
        const personId = document.getElementById("ftePersonSelect").value;
        const fte = parseFloat(document.getElementById("fteValueInput").value);
        const startMonth = document.getElementById("fteStartMonthInput").value;
        const endMonth = document.getElementById("fteEndMonthInput").value || null;
        if (!personId || !startMonth) {
          alert("Please select a person and start month");
          return;
        }
        await addFteValue({
          personId,
          fte,
          startMonth,
          endMonth
        });
        scheduleAutoBackup();
        renderFteValues();
      });
    }
    Promise.resolve().then(() => (init_tableHelpers(), tableHelpers_exports)).then(({ makeTableSortable: makeTableSortable2, addTableFilter: addTableFilter2 }) => {
      const peopleTable = document.getElementById("peopleTable");
      const fteValuesTable = document.getElementById("fteValuesTable");
      const peopleSearchInput = document.getElementById("peopleSearchInput");
      const fteSearchInput = document.getElementById("fteSearchInput");
      if (peopleTable) {
        makeTableSortable2(peopleTable);
        addBatchOperationsToolbar(peopleTable, {
          "Delete Selected": async (selectedIds) => {
            if (!confirm(`Delete ${selectedIds.length} selected people? This will also delete their FTE values.`)) {
              return;
            }
            await saveState(`Batch delete ${selectedIds.length} people`);
            for (const id of selectedIds) {
              const fteValues = await getFteValues();
              const personFteValues = fteValues.filter((v) => v.personId === id);
              for (const value of personFteValues) {
                await deleteFteValue(value.id);
              }
              await deletePerson(id);
            }
            scheduleAutoBackup();
            renderPeople();
            renderFteValues();
            showSuccess(`Deleted ${selectedIds.length} people`);
          }
        });
      }
      if (fteValuesTable) {
        makeTableSortable2(fteValuesTable);
      }
      if (peopleTable && peopleSearchInput) {
        addTableFilter2(peopleTable, peopleSearchInput);
      }
      if (fteValuesTable && fteSearchInput) {
        addTableFilter2(fteValuesTable, fteSearchInput);
      }
    });
  }

  // js/views/projectsView.js
  init_toast();
  init_tableHelpers();
  async function renderProjects() {
    if (typeof document === "undefined") return;
    const table = document.querySelector("#projectsTable");
    if (!table) return;
    const tbody = table.querySelector("tbody");
    if (!tbody) return;
    const thead = table.querySelector("thead");
    if (thead) {
      const headers = getTableHeaders(projectsSchema);
      thead.innerHTML = `<tr>${headers.map((h) => `<th>${h}</th>`).join("")}<th>Actions</th></tr>`;
    }
    tbody.innerHTML = "";
    const projects = await getProjects();
    projects.forEach((p) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
            <td contenteditable="true" data-id="${p.id}" data-field="name">${p.name}</td>
            <td><button class="delete-project" data-id="${p.id}">Delete</button></td>
        `;
      tbody.appendChild(tr);
    });
    addBatchSelection(table, (selectedCount, totalCount) => {
      const toolbar = table.previousElementSibling;
      if (toolbar && toolbar.classList.contains("batch-toolbar")) {
        updateBatchToolbar(toolbar, selectedCount, totalCount);
      }
    });
    attachProjectsEventListeners();
    populateProjectSelect();
  }
  async function renderBudgetValues() {
    if (typeof document === "undefined") return;
    const tbody = document.querySelector("#budgetValuesTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    const budgetValues = await getBudgetValues();
    const projects = await getProjects();
    const sortedValues = budgetValues.sort((a, b) => {
      if (a.projectId !== b.projectId) {
        return a.projectId.localeCompare(b.projectId);
      }
      return a.startMonth.localeCompare(b.startMonth);
    });
    sortedValues.forEach((value) => {
      const project = projects.find((p) => p.id === value.projectId);
      const projectName = project ? project.name : value.projectId;
      const tr = document.createElement("tr");
      tr.innerHTML = `
            <td>${projectName}</td>
            <td contenteditable="true" data-id="${value.id}" data-field="plannedPM">${value.plannedPM}</td>
            <td><input type="month" class="budget-start" value="${value.startMonth}" data-id="${value.id}"></td>
            <td><input type="month" class="budget-end" value="${value.endMonth || ""}" data-id="${value.id}"></td>
            <td><button class="delete-budget-value" data-id="${value.id}">Delete</button></td>
        `;
      tbody.appendChild(tr);
    });
    attachBudgetValueEventListeners();
    populateBudgetProjectSelect();
  }
  function attachProjectsEventListeners() {
    document.querySelectorAll("#projectsTable td[contenteditable]").forEach((td) => {
      td.addEventListener("blur", async function() {
        const id = this.dataset.id;
        const field = this.dataset.field;
        const value = this.textContent;
        const projects = await getProjects();
        const project = projects.find((p) => p.id === id);
        if (!project) {
          console.error(`Project with id ${id} not found`);
          return;
        }
        if (field === "name") {
          project.name = value;
          populateProjectSelect();
          renderBudgetValues();
        }
        await updateProject(project);
        scheduleAutoBackup();
      });
    });
    document.querySelectorAll(".delete-project").forEach((btn) => {
      btn.addEventListener("click", async function() {
        const id = this.dataset.id;
        const budgetValues = await getBudgetValues();
        const projectBudgetValues = budgetValues.filter((v) => v.projectId === id);
        for (const value of projectBudgetValues) {
          await deleteBudgetValue(value.id);
        }
        await deleteProject(id);
        scheduleAutoBackup();
        renderProjects();
        renderBudgetValues();
      });
    });
  }
  function attachBudgetValueEventListeners() {
    if (typeof document === "undefined") return;
    document.querySelectorAll("#budgetValuesTable td[contenteditable]").forEach((td) => {
      td.addEventListener("blur", async function() {
        const id = parseInt(this.dataset.id);
        const field = this.dataset.field;
        const value = this.textContent;
        const budgetValues = await getBudgetValues();
        const budgetValue = budgetValues.find((v) => v.id === id);
        if (field === "plannedPM") {
          const validation = validatePlannedPM(value);
          if (!validation.valid) {
            alert(validation.message);
            this.textContent = budgetValue.plannedPM;
            return;
          }
          budgetValue.plannedPM = parseFloat(value);
        }
        await updateBudgetValue(budgetValue);
        scheduleAutoBackup();
      });
    });
    document.querySelectorAll(".budget-start").forEach((input) => {
      input.addEventListener("blur", async function() {
        const id = parseInt(this.dataset.id);
        const budgetValues = await getBudgetValues();
        const budgetValue = budgetValues.find((v) => v.id === id);
        budgetValue.startMonth = this.value;
        await updateBudgetValue(budgetValue);
        scheduleAutoBackup();
      });
    });
    document.querySelectorAll(".budget-end").forEach((input) => {
      input.addEventListener("blur", async function() {
        const id = parseInt(this.dataset.id);
        const budgetValues = await getBudgetValues();
        const budgetValue = budgetValues.find((v) => v.id === id);
        budgetValue.endMonth = this.value || null;
        await updateBudgetValue(budgetValue);
        scheduleAutoBackup();
      });
    });
    document.querySelectorAll(".delete-budget-value").forEach((btn) => {
      btn.addEventListener("click", async function() {
        const id = parseInt(this.dataset.id);
        const validation = await validateBudgetValueDeletion(id);
        if (!validation.valid) {
          alert(validation.message);
          return;
        }
        await deleteBudgetValue(id);
        scheduleAutoBackup();
        renderBudgetValues();
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
  async function addProjectAuto(name) {
    await saveState(`Add project: ${name}`);
    const id = await generateProjectId();
    await addProject({ id, name });
    const currentMonth = (/* @__PURE__ */ new Date()).toISOString().slice(0, 7);
    await addBudgetValue({
      projectId: id,
      plannedPM: 0,
      startMonth: currentMonth,
      endMonth: null
      // Open-ended
    });
    scheduleAutoBackup();
    renderProjects();
    renderBudgetValues();
    showSuccess(`Added project: ${name}`);
  }
  function initProjectsView() {
    if (typeof document === "undefined") return;
    const addProjectBtn = document.getElementById("addProjectBtn");
    if (addProjectBtn) {
      addProjectBtn.addEventListener("click", async () => {
        const projectsTable = document.getElementById("projectsTable");
        if (!projectsTable) return;
        addQuickAddRow(
          projectsTable,
          ["Enter project name..."],
          async (values) => {
            const name = values[0];
            if (name) {
              await addProjectAuto(name);
            }
          }
        );
      });
    }
    const addBudgetValueBtn = document.getElementById("addBudgetValueBtn");
    if (addBudgetValueBtn) {
      addBudgetValueBtn.addEventListener("click", async () => {
        const projectId = document.getElementById("budgetProjectSelect").value;
        const plannedPM = parseFloat(document.getElementById("budgetValueInput").value);
        const startMonth = document.getElementById("budgetStartMonthInput").value;
        const endMonth = document.getElementById("budgetEndMonthInput").value || null;
        if (!projectId || !startMonth) {
          alert("Please select a project and start month");
          return;
        }
        await addBudgetValue({
          projectId,
          plannedPM,
          startMonth,
          endMonth
        });
        scheduleAutoBackup();
        renderBudgetValues();
      });
    }
    Promise.resolve().then(() => (init_tableHelpers(), tableHelpers_exports)).then(({ makeTableSortable: makeTableSortable2, addTableFilter: addTableFilter2 }) => {
      const projectsTable = document.getElementById("projectsTable");
      const budgetValuesTable = document.getElementById("budgetValuesTable");
      const projectsSearchInput = document.getElementById("projectsSearchInput");
      const budgetSearchInput = document.getElementById("budgetSearchInput");
      if (projectsTable) {
        makeTableSortable2(projectsTable);
        addBatchOperationsToolbar(projectsTable, {
          "Delete Selected": async (selectedIds) => {
            if (!confirm(`Delete ${selectedIds.length} selected projects? This will also delete their budget values.`)) {
              return;
            }
            await saveState(`Batch delete ${selectedIds.length} projects`);
            for (const id of selectedIds) {
              const budgetValues = await getBudgetValues();
              const projectBudgetValues = budgetValues.filter((v) => v.projectId === id);
              for (const value of projectBudgetValues) {
                await deleteBudgetValue(value.id);
              }
              await deleteProject(id);
            }
            scheduleAutoBackup();
            renderProjects();
            renderBudgetValues();
            showSuccess(`Deleted ${selectedIds.length} projects`);
          }
        });
      }
      if (budgetValuesTable) {
        makeTableSortable2(budgetValuesTable);
      }
      if (projectsTable && projectsSearchInput) {
        addTableFilter2(projectsTable, projectsSearchInput);
      }
      if (budgetValuesTable && budgetSearchInput) {
        addTableFilter2(budgetValuesTable, budgetSearchInput);
      }
    });
  }

  // js/helpers/dateHelper.js
  function getMonthsInYear(year) {
    return Array.from(
      { length: MONTHS_PER_YEAR },
      (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`
    );
  }
  function isMonthInRange(month, startMonth, endMonth) {
    return month >= startMonth && (!endMonth || month <= endMonth);
  }
  function compareMonths(month1, month2) {
    return month1.localeCompare(month2);
  }

  // js/helpers/overrideHelper.js
  function getEffectiveFte(personId, month, fteValues) {
    const applicableValues = fteValues.filter(
      (value) => value.personId === personId && isMonthInRange(month, value.startMonth, value.endMonth)
    );
    if (applicableValues.length === 0) {
      return 1;
    }
    const sortedValues = applicableValues.sort(
      (a, b) => compareMonths(b.startMonth, a.startMonth)
    );
    return sortedValues[0].fte;
  }
  function getEffectiveProjectBudget(projectId, month, budgetValues) {
    const applicableValues = budgetValues.filter(
      (value) => value.projectId === projectId && isMonthInRange(month, value.startMonth, value.endMonth)
    );
    if (applicableValues.length === 0) {
      return 0;
    }
    const sortedValues = applicableValues.sort(
      (a, b) => compareMonths(b.startMonth, a.startMonth)
    );
    return sortedValues[0].plannedPM;
  }
  function getTotalEffectiveFte(personId, months, fteValues) {
    return months.reduce((sum, month) => {
      const monthFte = getEffectiveFte(personId, month, fteValues);
      return sum + monthFte;
    }, 0);
  }
  function getTotalEffectiveProjectBudget(projectId, months, budgetValues) {
    return months.reduce((sum, month) => {
      const monthPlanned = getEffectiveProjectBudget(projectId, month, budgetValues);
      return sum + monthPlanned;
    }, 0);
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
      if (isMonthInRange(month, alloc.startMonth, alloc.endMonth)) {
        let pm = alloc.pm;
        if (allocationOverrideIndex) {
          const overrideKey = `${alloc.id}:${month}`;
          const override = allocationOverrideIndex.get(overrideKey);
          if (override) {
            pm = override.pm;
          }
        }
        const safePm = pm !== void 0 && pm !== null && !isNaN(pm) ? pm : 0;
        return sum + safePm;
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
  function calculateProjectTotal(allocationIndex, projectId, people, month, fteValues = null, allocationOverrideIndex = null) {
    let total = 0;
    for (const person of people) {
      const fte = fteValues ? getEffectiveFte(person.id, month, fteValues) : 1;
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
  function pmPerMonthToYear(pmPerMonth) {
    return pmPerMonth * MONTHS_PER_YEAR;
  }
  function pmToPercentage(pm, fte) {
    if (fte === 0) return 0;
    return pm / fte * 100;
  }

  // js/views/allocationsView.js
  async function renderAllocations() {
    if (typeof document === "undefined") return;
    const tbody = document.querySelector("#allocationsTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    const allocations = await getAllocations();
    const people = await getPeople();
    const projects = await getProjects();
    allocations.forEach((a) => {
      const tr = document.createElement("tr");
      const personOptions = people.filter((p) => p.active).map(
        (p) => `<option value="${p.id}" ${p.id === a.personId ? "selected" : ""}>${p.name}</option>`
      ).join("");
      const projectOptions = projects.map(
        (p) => `<option value="${p.id}" ${p.id === a.projectId ? "selected" : ""}>${p.name}</option>`
      ).join("");
      const pmPerMonth = a.pm;
      const pmPerYear = pmPerMonthToYear(a.pm);
      tr.innerHTML = `
            <td><select class="alloc-person" data-id="${a.id}">${personOptions}</select></td>
            <td><select class="alloc-project" data-id="${a.id}">${projectOptions}</select></td>
            <td><input type="number" class="alloc-pm" step="${PM_STEP}" min="${MIN_PM}" value="${a.pm}" data-id="${a.id}"></td>
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
    const pmPerMonth = alloc.pm;
    const pmPerYear = pmPerMonthToYear(alloc.pm);
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
        const allocations = await getAllocations();
        const alloc = allocations.find((a) => a.id === id);
        if (!alloc) {
          console.error(`Allocation with id ${id} not found`);
          return;
        }
        alloc.personId = this.value;
        await updateAllocation(alloc);
        scheduleAutoBackup();
        await updateRowPMValues(this.closest("tr"), alloc);
      });
    });
    document.querySelectorAll(".alloc-project").forEach((select) => {
      select.addEventListener("change", async function() {
        const id = parseInt(this.dataset.id);
        const allocations = await getAllocations();
        const alloc = allocations.find((a) => a.id === id);
        if (!alloc) {
          console.error(`Allocation with id ${id} not found`);
          return;
        }
        alloc.projectId = this.value;
        await updateAllocation(alloc);
        scheduleAutoBackup();
      });
    });
    document.querySelectorAll(".alloc-pm").forEach((input) => {
      input.addEventListener("blur", async function() {
        const id = parseInt(this.dataset.id);
        const allocations = await getAllocations();
        const alloc = allocations.find((a) => a.id === id);
        if (!alloc) {
          console.error(`Allocation with id ${id} not found`);
          return;
        }
        const pm = parseFloat(this.value);
        if (isNaN(pm) || pm < MIN_PM) {
          alert("PM must be a positive number");
          this.value = alloc.pm;
          return;
        }
        alloc.pm = pm;
        await updateAllocation(alloc);
        scheduleAutoBackup();
        await updateRowPMValues(this.closest("tr"), alloc);
      });
    });
    document.querySelectorAll(".alloc-start").forEach((input) => {
      input.addEventListener("blur", async function() {
        const id = parseInt(this.dataset.id);
        const allocations = await getAllocations();
        const alloc = allocations.find((a) => a.id === id);
        if (!alloc) {
          console.error(`Allocation with id ${id} not found`);
          return;
        }
        const newStartMonth = this.value;
        const overlapping = await findOverlappingAllocations(
          alloc.personId,
          alloc.projectId,
          newStartMonth,
          alloc.endMonth,
          id
          // Exclude current allocation
        );
        if (overlapping.length > 0) {
          const people = await getPeople();
          const projects = await getProjects();
          const person = people.find((p) => p.id === alloc.personId);
          const project = projects.find((p) => p.id === alloc.projectId);
          const label = `${person ? person.name : alloc.personId} \u2192 ${project ? project.name : alloc.projectId}`;
          const overlapMsg = overlapping.map(
            (a) => `  - ${a.pm.toFixed(2)} PM from ${a.startMonth} to ${a.endMonth || "ongoing"}`
          ).join("\n");
          const confirmOverlap = confirm(
            `Warning: This change creates overlapping allocations for ${label}:
${overlapMsg}

The system will use the most recent allocation when multiple values apply.
Are you sure you want to continue?`
          );
          if (!confirmOverlap) {
            this.value = alloc.startMonth;
            return;
          }
        }
        alloc.startMonth = newStartMonth;
        await updateAllocation(alloc);
        scheduleAutoBackup();
      });
    });
    document.querySelectorAll(".alloc-end").forEach((input) => {
      input.addEventListener("blur", async function() {
        const id = parseInt(this.dataset.id);
        const allocations = await getAllocations();
        const alloc = allocations.find((a) => a.id === id);
        if (!alloc) {
          console.error(`Allocation with id ${id} not found`);
          return;
        }
        const newEndMonth = this.value || null;
        const overlapping = await findOverlappingAllocations(
          alloc.personId,
          alloc.projectId,
          alloc.startMonth,
          newEndMonth,
          id
          // Exclude current allocation
        );
        if (overlapping.length > 0) {
          const people = await getPeople();
          const projects = await getProjects();
          const person = people.find((p) => p.id === alloc.personId);
          const project = projects.find((p) => p.id === alloc.projectId);
          const label = `${person ? person.name : alloc.personId} \u2192 ${project ? project.name : alloc.projectId}`;
          const overlapMsg = overlapping.map(
            (a) => `  - ${a.pm.toFixed(2)} PM from ${a.startMonth} to ${a.endMonth || "ongoing"}`
          ).join("\n");
          const confirmOverlap = confirm(
            `Warning: This change creates overlapping allocations for ${label}:
${overlapMsg}

The system will use the most recent allocation when multiple values apply.
Are you sure you want to continue?`
          );
          if (!confirmOverlap) {
            this.value = alloc.endMonth || "";
            return;
          }
        }
        alloc.endMonth = newEndMonth;
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
            <td contenteditable="true" data-id="${override.id}" data-field="pm">${override.pm}</td>
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
        if (field === "pm") {
          const pm = parseFloat(value);
          if (isNaN(pm) || pm < 0) {
            alert("PM must be a positive number");
            this.textContent = override.pm;
            return;
          }
          override.pm = pm;
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
      const personId = document.getElementById("personSelect").value;
      const projectId = document.getElementById("projectSelect").value;
      const pm = parseFloat(document.getElementById("pmInput").value);
      const startMonth = document.getElementById("startMonthInput").value;
      const endMonth = document.getElementById("endMonthInput").value || null;
      if (!personId || !projectId || !startMonth) {
        alert("Please select a person, project, and start month");
        return;
      }
      if (isNaN(pm) || pm < 0) {
        alert("PM must be a positive number");
        return;
      }
      const overlapping = await findOverlappingAllocations(personId, projectId, startMonth, endMonth);
      if (overlapping.length > 0) {
        const toClose = await findOpenEndedAllocationsToClose(personId, projectId, startMonth);
        if (toClose.length > 0) {
          const people = await getPeople();
          const projects = await getProjects();
          const person = people.find((p) => p.id === personId);
          const project = projects.find((p) => p.id === projectId);
          const label = `${person ? person.name : personId} \u2192 ${project ? project.name : projectId}`;
          const closeMsg = toClose.map((a) => {
            const suggestedEnd = getMonthBefore(startMonth);
            return `  - ${a.pm.toFixed(2)} PM allocation starting ${a.startMonth} (will set end to ${suggestedEnd})`;
          }).join("\n");
          const shouldClose = confirm(
            `This allocation for ${label} overlaps with existing open-ended entries:
${closeMsg}

Click OK to AUTO-CLOSE (set end date), or Cancel for more options.`
          );
          if (shouldClose) {
            const suggestedEnd = getMonthBefore(startMonth);
            for (const alloc of toClose) {
              alloc.endMonth = suggestedEnd;
              await updateAllocation(alloc);
            }
          } else {
            const shouldOverwrite = confirm(
              `Do you want to OVERWRITE (delete) the conflicting allocations instead?
Click OK to delete conflicting allocations, or Cancel to keep overlapping allocations.`
            );
            if (shouldOverwrite) {
              for (const alloc of overlapping) {
                await deleteAllocation(alloc.id);
              }
            } else {
              const warnConfirm = confirm(
                `Warning: Creating overlapping allocations may lead to unexpected behavior.
The system will use the most recent allocation when multiple values apply.

Are you sure you want to continue?`
              );
              if (!warnConfirm) {
                return;
              }
            }
          }
        } else {
          const people = await getPeople();
          const projects = await getProjects();
          const person = people.find((p) => p.id === personId);
          const project = projects.find((p) => p.id === projectId);
          const label = `${person ? person.name : personId} \u2192 ${project ? project.name : projectId}`;
          const overlapMsg = overlapping.map(
            (a) => `  - ${a.pm.toFixed(2)} PM from ${a.startMonth} to ${a.endMonth || "ongoing"}`
          ).join("\n");
          const shouldOverwrite = confirm(
            `Warning: This allocation for ${label} overlaps with existing entries:
${overlapMsg}

Click OK to OVERWRITE (delete conflicting allocations), or Cancel for more options.`
          );
          if (shouldOverwrite) {
            for (const alloc of overlapping) {
              await deleteAllocation(alloc.id);
            }
          } else {
            const confirmOverlap = confirm(
              `Do you want to keep the overlapping allocations?
The system will use the most recent allocation when multiple values apply.

Click OK to proceed with overlap, or Cancel to abort.`
            );
            if (!confirmOverlap) {
              return;
            }
          }
        }
      }
      await addAllocation({
        personId,
        projectId,
        pm,
        startMonth,
        endMonth
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
        const pm = parseFloat(document.getElementById("overridePmInput").value);
        if (!allocationId || !month) {
          alert("Please select an allocation and month");
          return;
        }
        if (isNaN(pm) || pm < 0) {
          alert("PM must be a positive number");
          return;
        }
        await addAllocationOverride({
          allocationId,
          month,
          pm
        });
        scheduleAutoBackup();
        renderAllocationOverrides();
      });
    }
    Promise.resolve().then(() => (init_tableHelpers(), tableHelpers_exports)).then(({ makeTableSortable: makeTableSortable2, addTableFilter: addTableFilter2 }) => {
      const allocationsTable = document.getElementById("allocationsTable");
      const overridesTable = document.getElementById("allocationOverridesTable");
      const allocationsSearchInput = document.getElementById("allocationsSearchInput");
      const overridesSearchInput = document.getElementById("overridesSearchInput");
      if (allocationsTable) {
        makeTableSortable2(allocationsTable);
      }
      if (overridesTable) {
        makeTableSortable2(overridesTable);
      }
      if (allocationsTable && allocationsSearchInput) {
        addTableFilter2(allocationsTable, allocationsSearchInput);
      }
      if (overridesTable && overridesSearchInput) {
        addTableFilter2(overridesTable, overridesSearchInput);
      }
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
    const fteValues = await getFteValues();
    const budgetValues = await getBudgetValues();
    const allocationOverrides = await getAllocationOverrides();
    const allocationIndex = buildAllocationIndex(allocations);
    const allocationOverrideIndex = buildAllocationOverrideIndex(allocationOverrides);
    const resultsOutput = document.getElementById("resultsOutput");
    resultsOutput.innerHTML = `<h3>Monthly Report ${month}</h3>`;
    const personTable = document.createElement("table");
    const headerRow1 = document.createElement("tr");
    headerRow1.innerHTML = `<th rowspan="2">Person</th><th rowspan="2">FTE</th><th rowspan="2">Delta</th><th colspan="2">Total</th>` + projects.map((p) => `<th colspan="2">${p.name}</th>`).join("");
    const headerRow2 = document.createElement("tr");
    headerRow2.innerHTML = `<th class="sub-header">%</th><th class="sub-header">PM</th>` + projects.map(() => `<th class="sub-header">%</th><th class="sub-header">PM</th>`).join("");
    const thead = document.createElement("thead");
    thead.appendChild(headerRow1);
    thead.appendChild(headerRow2);
    personTable.appendChild(thead);
    const pTbody = document.createElement("tbody");
    people.forEach((p) => {
      const fte = getEffectiveFte(p.id, month, fteValues);
      const cells = projects.map((proj) => calculatePM(allocationIndex, p.id, proj.id, month, fte, allocationOverrideIndex));
      const total = calculatePersonTotal(allocationIndex, p.id, projects, month, fte, allocationOverrideIndex);
      const delta = total - fte;
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${p.name}</td><td>${fte.toFixed(2)}</td><td class="${cellClass(delta, 0)}">${delta.toFixed(2)}</td><td class="pct-cell">${pmToPercentage(total, fte).toFixed(1)}%</td><td class="${cellClass(total, fte)}">${total.toFixed(2)}</td>` + cells.map((c) => {
        const pct = pmToPercentage(c, fte);
        return `<td class="pct-cell">${pct.toFixed(1)}%</td><td class="${cellClass(c, fte / projects.length)}">${c.toFixed(2)}</td>`;
      }).join("");
      pTbody.appendChild(tr);
    });
    const tfoot = document.createElement("tfoot");
    const sumRow = document.createElement("tr");
    const totalFte = people.reduce((sum, p) => {
      const fte = getEffectiveFte(p.id, month, fteValues);
      return sum + fte;
    }, 0);
    const totalDelta = people.reduce((sum, p) => {
      const fte = getEffectiveFte(p.id, month, fteValues);
      const personTotal = calculatePersonTotal(allocationIndex, p.id, projects, month, fte, allocationOverrideIndex);
      return sum + (personTotal - fte);
    }, 0);
    const overallTotal = people.reduce((sum, p) => {
      const fte = getEffectiveFte(p.id, month, fteValues);
      return sum + calculatePersonTotal(allocationIndex, p.id, projects, month, fte, allocationOverrideIndex);
    }, 0);
    const overallPct = totalFte > 0 ? pmToPercentage(overallTotal, totalFte) : 0;
    const projectTotalCells = projects.map((proj) => {
      const sum = calculateProjectTotal(allocationIndex, proj.id, people, month, fteValues, allocationOverrideIndex);
      const sumPct = totalFte > 0 ? pmToPercentage(sum, totalFte) : 0;
      return `<td class="pct-cell"><strong>${sumPct.toFixed(1)}%</strong></td><td><strong>${sum.toFixed(2)}</strong></td>`;
    }).join("");
    sumRow.innerHTML = `<td><strong>Total</strong></td><td><strong>${totalFte.toFixed(2)}</strong></td><td class="${cellClass(totalDelta, 0)}"><strong>${totalDelta.toFixed(2)}</strong></td><td class="pct-cell"><strong>${overallPct.toFixed(1)}%</strong></td><td><strong>${overallTotal.toFixed(2)}</strong></td>` + projectTotalCells;
    tfoot.appendChild(sumRow);
    personTable.appendChild(pTbody);
    personTable.appendChild(tfoot);
    resultsOutput.appendChild(personTable);
    const projTable = document.createElement("table");
    const projHeader = ["Project", "Allocated PM", "Planned PM", "Delta"];
    projTable.innerHTML = `<thead><tr>${projHeader.map((h) => `<th>${h}</th>`).join("")}</tr></thead>`;
    const projTbody = document.createElement("tbody");
    projects.forEach((proj) => {
      const total = calculateProjectTotal(allocationIndex, proj.id, people, month, fteValues, allocationOverrideIndex);
      const planned = getEffectiveProjectBudget(proj.id, month, budgetValues);
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
    const fteValues = await getFteValues();
    const budgetValues = await getBudgetValues();
    const allocationOverrides = await getAllocationOverrides();
    const allocationIndex = buildAllocationIndex(allocations);
    const allocationOverrideIndex = buildAllocationOverrideIndex(allocationOverrides);
    const resultsOutput = document.getElementById("resultsOutput");
    resultsOutput.innerHTML = `<h3>Yearly Overview ${year}</h3>`;
    const months = getMonthsInYear(year);
    const personTable = document.createElement("table");
    const pHeader = ["Person", ...months, "Total", "FTE", "Delta"];
    personTable.innerHTML = `<thead><tr>${pHeader.map((h) => `<th>${h}</th>`).join("")}</tr></thead>`;
    const pTbody = document.createElement("tbody");
    people.forEach((p) => {
      const cells = calculatePersonMonthlyTotals(allocationIndex, p.id, projects, months, 1, fteValues, allocationOverrideIndex);
      const total = sumArray(cells);
      const expectedFteYearly = getTotalEffectiveFte(p.id, months, fteValues);
      const delta = total - expectedFteYearly;
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${p.name}</td>` + cells.map((c, idx) => {
        const month = months[idx];
        const monthFte = getEffectiveFte(p.id, month, fteValues);
        return `<td class="${cellClass(c, monthFte)}">${c.toFixed(2)}</td>`;
      }).join("") + `<td class="${cellClass(total, expectedFteYearly)}">${total.toFixed(2)}</td><td>${expectedFteYearly.toFixed(2)}</td><td class="${cellClass(delta, 0)}">${delta.toFixed(2)}</td>`;
      pTbody.appendChild(tr);
    });
    const tfoot = document.createElement("tfoot");
    const sumRow = document.createElement("tr");
    const monthlySums = months.map((m) => {
      let sum = 0;
      people.forEach((p) => {
        const monthFte = getEffectiveFte(p.id, m, fteValues);
        sum += calculatePersonTotal(allocationIndex, p.id, projects, m, monthFte, allocationOverrideIndex);
      });
      return sum;
    });
    const totalSum = sumArray(monthlySums);
    let fteSum = 0;
    people.forEach((p) => {
      months.forEach((month) => {
        const monthFte = getEffectiveFte(p.id, month, fteValues);
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
      const cells = calculateProjectMonthlyTotals(allocationIndex, p.id, people, months, fteValues, allocationOverrideIndex);
      const total = sumArray(cells);
      const expectedPlannedYearly = getTotalEffectiveProjectBudget(p.id, months, budgetValues);
      const delta = total - expectedPlannedYearly;
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${p.name}</td>` + cells.map((c, idx) => {
        const month = months[idx];
        const monthPlanned = getEffectiveProjectBudget(p.id, month, budgetValues);
        return `<td class="${cellClass(c, monthPlanned)}">${c.toFixed(2)}</td>`;
      }).join("") + `<td class="${cellClass(total, expectedPlannedYearly)}">${total.toFixed(2)}</td><td>${expectedPlannedYearly.toFixed(2)}</td><td class="${cellClass(delta, 0)}">${delta.toFixed(2)}</td>`;
      projTbody.appendChild(tr);
    });
    const tfootProj = document.createElement("tfoot");
    const sumRowProj = document.createElement("tr");
    const monthlySumsProj = months.map((m) => {
      let sum = 0;
      projects.forEach((p) => {
        sum += calculateProjectTotal(allocationIndex, p.id, people, m, fteValues, allocationOverrideIndex);
      });
      return sum;
    });
    const totalSumProj = sumArray(monthlySumsProj);
    let plannedSumProj = 0;
    projects.forEach((p) => {
      plannedSumProj += getTotalEffectiveProjectBudget(p.id, months, budgetValues);
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
    const fteValues = await getFteValues();
    const budgetValues = await getBudgetValues();
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
      const cells = calculateProjectMonthlyTotals(allocationIndex, p.id, people, months, fteValues, allocationOverrideIndex);
      const total = sumArray(cells);
      const expectedPlannedYearly = getTotalEffectiveProjectBudget(p.id, months, budgetValues);
      const delta = total - expectedPlannedYearly;
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${p.name}</td>` + cells.map((c, idx) => {
        const month = months[idx];
        const monthPlanned = getEffectiveProjectBudget(p.id, month, budgetValues);
        return `<td class="${cellClass(c, monthPlanned)}">${c.toFixed(2)}</td>`;
      }).join("") + `<td class="${cellClass(total, expectedPlannedYearly)}">${total.toFixed(2)}</td><td>${expectedPlannedYearly.toFixed(2)}</td><td class="${cellClass(delta, 0)}">${delta.toFixed(2)}</td>`;
      tbody.appendChild(tr);
    });
    const tfoot = document.createElement("tfoot");
    const sumRow = document.createElement("tr");
    sumRow.innerHTML = `<td><strong>Total</strong></td>` + months.map((month) => {
      let monthSum = 0;
      projects.forEach((p) => {
        monthSum += calculateProjectTotal(allocationIndex, p.id, people, month, fteValues, allocationOverrideIndex);
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

  // js/views/timelineView.js
  function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = hash % 360;
    const s = 65;
    const l = 55;
    return `hsl(${h}, ${s}%, ${l}%)`;
  }
  function parseMonth(monthStr) {
    const [year, month] = monthStr.split("-").map(Number);
    return new Date(year, month - 1, 1);
  }
  function formatMonth(monthStr) {
    const date = parseMonth(monthStr);
    return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  }
  async function renderTimeline(containerId, year) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";
    const allocations = await getAllocations();
    const people = await getPeople();
    const projects = await getProjects();
    const yearStart = `${year}-01`;
    const yearEnd = `${year}-12`;
    const relevantAllocations = allocations.filter((a) => {
      const start = a.startMonth;
      const end = a.endMonth || "9999-12";
      return start <= yearEnd && end >= yearStart;
    });
    if (relevantAllocations.length === 0) {
      container.innerHTML = "<p>No allocations found for this year.</p>";
      return;
    }
    const months = [];
    for (let m = 1; m <= 12; m++) {
      months.push(`${year}-${String(m).padStart(2, "0")}`);
    }
    const html = `
        <div class="timeline-container">
            <h3>Allocation Timeline for ${year}</h3>
            <div class="timeline-grid">
                <div class="timeline-row timeline-header-row">
                    <div class="timeline-label">Person \u2192 Project</div>
                    ${months.map((m) => `<div class="timeline-month-header">${formatMonth(m)}</div>`).join("")}
                </div>
                ${relevantAllocations.map((alloc) => {
      const person = people.find((p) => p.id === alloc.personId);
      const project = projects.find((p) => p.id === alloc.projectId);
      const personName = person ? person.name : alloc.personId;
      const projectName = project ? project.name : alloc.projectId;
      const color = stringToColor(alloc.projectId);
      return `
                        <div class="timeline-row">
                            <div class="timeline-label" title="${personName} \u2192 ${projectName}">${personName} \u2192 ${projectName}</div>
                            ${months.map((m) => {
        const start = alloc.startMonth;
        const end = alloc.endMonth || "9999-12";
        const isActive = m >= start && m <= end;
        const pm = alloc.pm;
        return `
                                    <div class="timeline-cell ${isActive ? "timeline-active" : ""}" 
                                         style="${isActive ? `background-color: ${color}; opacity: ${Math.min(pm * 0.5 + 0.3, 1)}` : ""}"
                                         title="${isActive ? `${personName} \u2192 ${projectName}: ${pm} PM` : ""}">
                                        ${isActive ? pm.toFixed(1) : ""}
                                    </div>
                                `;
      }).join("")}
                        </div>
                    `;
    }).join("")}
            </div>
            <div class="timeline-legend">
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #ccc;"></div>
                    <span>No allocation</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: hsl(200, 65%, 55%); opacity: 0.5;"></div>
                    <span>Low allocation (&lt;0.5 PM)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: hsl(200, 65%, 55%);"></div>
                    <span>High allocation (\u22650.5 PM)</span>
                </div>
            </div>
        </div>
    `;
    container.innerHTML = html;
  }
  function initTimelineView() {
    if (typeof document === "undefined") return;
    const showTimelineBtn = document.getElementById("showTimelineBtn");
    if (showTimelineBtn) {
      showTimelineBtn.addEventListener("click", async () => {
        const year = parseInt(document.getElementById("timelineYearInput")?.value || (/* @__PURE__ */ new Date()).getFullYear());
        await renderTimeline("timelineOutput", year);
      });
    }
  }

  // js/helpers/importPreview.js
  async function showImportPreview(data) {
    if (typeof document === "undefined") return false;
    const overlay = document.createElement("div");
    overlay.className = "import-preview-overlay";
    const modal = document.createElement("div");
    modal.className = "import-preview-modal";
    const stats = analyzeImportData(data);
    modal.innerHTML = `
        <div class="import-preview-header">
            <h2>\u{1F4E4} Import Data Preview</h2>
            <button class="import-preview-close" title="Cancel">&times;</button>
        </div>
        <div class="import-preview-body">
            <div class="import-warning">
                \u26A0\uFE0F <strong>Warning:</strong> This will replace all existing data!
            </div>
            
            <h3>Data to be Imported:</h3>
            <table class="import-stats-table">
                <tr>
                    <td><strong>People:</strong></td>
                    <td>${stats.people} person(s)</td>
                </tr>
                <tr>
                    <td><strong>Projects:</strong></td>
                    <td>${stats.projects} project(s)</td>
                </tr>
                <tr>
                    <td><strong>Allocations:</strong></td>
                    <td>${stats.allocations} allocation(s)</td>
                </tr>
                <tr>
                    <td><strong>FTE Values:</strong></td>
                    <td>${stats.fteValues} FTE value(s)</td>
                </tr>
                <tr>
                    <td><strong>Budget Values:</strong></td>
                    <td>${stats.budgetValues} budget value(s)</td>
                </tr>
                <tr>
                    <td><strong>Overrides:</strong></td>
                    <td>${stats.overrides} override(s)</td>
                </tr>
            </table>
            
            ${stats.errors.length > 0 ? `
            <div class="import-errors">
                <h3>\u26A0\uFE0F Validation Issues:</h3>
                <ul>
                    ${stats.errors.map((err) => `<li>${err}</li>`).join("")}
                </ul>
            </div>
            ` : '<div class="import-success">\u2705 Data structure looks valid</div>'}
            
            ${stats.warnings.length > 0 ? `
            <div class="import-warnings">
                <h3>\u26A0\uFE0F Warnings:</h3>
                <ul>
                    ${stats.warnings.map((warn) => `<li>${warn}</li>`).join("")}
                </ul>
            </div>
            ` : ""}
        </div>
        <div class="import-preview-footer">
            <button class="import-preview-cancel">Cancel</button>
            <button class="import-preview-confirm" ${stats.errors.length > 0 ? "disabled" : ""}>
                ${stats.errors.length > 0 ? "Cannot Import (Errors Found)" : "Import Data"}
            </button>
        </div>
    `;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    return new Promise((resolve) => {
      const closeBtn = modal.querySelector(".import-preview-close");
      const cancelBtn = modal.querySelector(".import-preview-cancel");
      const confirmBtn = modal.querySelector(".import-preview-confirm");
      const cleanup = () => {
        overlay.remove();
      };
      const handleCancel = () => {
        cleanup();
        resolve(false);
      };
      const handleConfirm = async () => {
        if (stats.errors.length > 0) return;
        cleanup();
        resolve(true);
      };
      closeBtn.addEventListener("click", handleCancel);
      cancelBtn.addEventListener("click", handleCancel);
      confirmBtn.addEventListener("click", handleConfirm);
      const handleEscape = (e) => {
        if (e.key === "Escape") {
          handleCancel();
          document.removeEventListener("keydown", handleEscape);
        }
      };
      document.addEventListener("keydown", handleEscape);
    });
  }
  function analyzeImportData(data) {
    const stats = {
      people: 0,
      projects: 0,
      allocations: 0,
      fteValues: 0,
      budgetValues: 0,
      overrides: 0,
      errors: [],
      warnings: []
    };
    try {
      if (!data || typeof data !== "object") {
        stats.errors.push("Invalid data format");
        return stats;
      }
      if (data.people && Array.isArray(data.people)) {
        stats.people = data.people.length;
      } else {
        stats.warnings.push("No people data found");
      }
      if (data.projects && Array.isArray(data.projects)) {
        stats.projects = data.projects.length;
      } else {
        stats.warnings.push("No projects data found");
      }
      if (data.defaultAllocations && Array.isArray(data.defaultAllocations)) {
        stats.allocations = data.defaultAllocations.length;
      } else {
        stats.warnings.push("No allocations data found");
      }
      if (data.fteValues && Array.isArray(data.fteValues)) {
        stats.fteValues = data.fteValues.length;
      } else {
        stats.warnings.push("No FTE values found");
      }
      if (data.budgetValues && Array.isArray(data.budgetValues)) {
        stats.budgetValues = data.budgetValues.length;
      } else {
        stats.warnings.push("No budget values found");
      }
      if (data.allocationOverrides && Array.isArray(data.allocationOverrides)) {
        stats.overrides = data.allocationOverrides.length;
      }
      if (stats.people === 0 && stats.projects === 0) {
        stats.errors.push("No people or projects found in import data");
      }
    } catch (e) {
      stats.errors.push(`Error analyzing data: ${e.message}`);
    }
    return stats;
  }

  // js/helpers/dataPruning.js
  init_toast();
  async function showDataPruningDialog() {
    if (typeof document === "undefined") return;
    const overlay = document.createElement("div");
    overlay.className = "import-preview-overlay";
    const modal = document.createElement("div");
    modal.className = "import-preview-modal";
    modal.innerHTML = `
        <div class="import-preview-header">
            <h2>\u{1F5D1}\uFE0F Data Pruning Tool</h2>
            <button class="import-preview-close" title="Close">&times;</button>
        </div>
        <div class="import-preview-body">
            <div class="import-warning">
                \u26A0\uFE0F <strong>Warning:</strong> This will permanently delete data. Use undo if needed.
            </div>
            
            <h3>Prune Options:</h3>
            
            <div class="prune-option">
                <input type="checkbox" id="pruneInactivePeople" checked>
                <label for="pruneInactivePeople">
                    <strong>Delete Inactive People</strong>
                    <span id="inactivePeopleCount" class="prune-count">Checking...</span>
                </label>
                <p class="prune-description">Remove people marked as inactive and all their FTE values.</p>
            </div>
            
            <div class="prune-option">
                <label for="pruneOldDataBefore"><strong>Delete Old FTE/Budget Values Before:</strong></label>
                <input type="month" id="pruneOldDataBefore">
                <span id="oldDataCount" class="prune-count">Select date to see count</span>
                <p class="prune-description">Remove FTE and budget values that end before this date.</p>
            </div>
            
            <div class="prune-option">
                <label for="pruneOldAllocationsBefore"><strong>Delete Old Allocations Before:</strong></label>
                <input type="month" id="pruneOldAllocationsBefore">
                <span id="oldAllocationsCount" class="prune-count">Select date to see count</span>
                <p class="prune-description">Remove allocations that end before this date.</p>
            </div>
            
            <div id="prunePreview" style="display: none; margin-top: 20px;">
                <h3>Preview of Items to be Deleted:</h3>
                <div id="prunePreviewContent"></div>
            </div>
        </div>
        <div class="import-preview-footer">
            <button class="import-preview-cancel">Cancel</button>
            <button id="previewPruneBtn" class="import-preview-confirm" style="background-color: #8CB903;">Preview</button>
            <button id="executePruneBtn" class="import-preview-confirm" style="display: none;">Execute Pruning</button>
        </div>
    `;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    const closeBtn = modal.querySelector(".import-preview-close");
    const cancelBtn = modal.querySelector(".import-preview-cancel");
    const previewBtn = modal.querySelector("#previewPruneBtn");
    const executeBtn = modal.querySelector("#executePruneBtn");
    const oldDataInput = modal.querySelector("#pruneOldDataBefore");
    const oldAllocationsInput = modal.querySelector("#pruneOldAllocationsBefore");
    updateInactivePeopleCount();
    oldDataInput.addEventListener("change", updateOldDataCount);
    oldAllocationsInput.addEventListener("change", updateOldAllocationsCount);
    previewBtn.addEventListener("click", async () => {
      const preview = await generatePrunePreview();
      displayPrunePreview(preview);
      previewBtn.style.display = "none";
      executeBtn.style.display = "inline-block";
    });
    executeBtn.addEventListener("click", async () => {
      const pruneInactivePeople = modal.querySelector("#pruneInactivePeople").checked;
      const oldDataBefore = oldDataInput.value;
      const oldAllocationsBefore = oldAllocationsInput.value;
      const count = await executePruning(pruneInactivePeople, oldDataBefore, oldAllocationsBefore);
      overlay.remove();
      showSuccess(`Pruned ${count} items successfully`);
    });
    const handleClose = () => overlay.remove();
    closeBtn.addEventListener("click", handleClose);
    cancelBtn.addEventListener("click", handleClose);
    document.addEventListener("keydown", function escHandler(e) {
      if (e.key === "Escape") {
        handleClose();
        document.removeEventListener("keydown", escHandler);
      }
    });
    async function updateInactivePeopleCount() {
      const people = await getPeople();
      const inactiveCount = people.filter((p) => !p.active).length;
      modal.querySelector("#inactivePeopleCount").textContent = `(${inactiveCount} people)`;
    }
    async function updateOldDataCount() {
      const date = oldDataInput.value;
      if (!date) return;
      const fteValues = await getFteValues();
      const budgetValues = await getBudgetValues();
      const oldFte = fteValues.filter((v) => v.endMonth && v.endMonth < date).length;
      const oldBudget = budgetValues.filter((v) => v.endMonth && v.endMonth < date).length;
      modal.querySelector("#oldDataCount").textContent = `(${oldFte} FTE + ${oldBudget} budget = ${oldFte + oldBudget} total)`;
    }
    async function updateOldAllocationsCount() {
      const date = oldAllocationsInput.value;
      if (!date) return;
      const allocations = await getAllocations();
      const oldCount = allocations.filter((a) => a.endMonth && a.endMonth < date).length;
      modal.querySelector("#oldAllocationsCount").textContent = `(${oldCount} allocations)`;
    }
    async function generatePrunePreview() {
      const preview = {
        inactivePeople: [],
        oldFteValues: [],
        oldBudgetValues: [],
        oldAllocations: []
      };
      if (modal.querySelector("#pruneInactivePeople").checked) {
        const people = await getPeople();
        preview.inactivePeople = people.filter((p) => !p.active);
      }
      const oldDataBefore = oldDataInput.value;
      if (oldDataBefore) {
        const fteValues = await getFteValues();
        const budgetValues = await getBudgetValues();
        const people = await getPeople();
        const projects = await getProjects();
        preview.oldFteValues = fteValues.filter((v) => v.endMonth && v.endMonth < oldDataBefore).map((v) => {
          const person = people.find((p) => p.id === v.personId);
          return { ...v, personName: person?.name || v.personId };
        });
        preview.oldBudgetValues = budgetValues.filter((v) => v.endMonth && v.endMonth < oldDataBefore).map((v) => {
          const project = projects.find((p) => p.id === v.projectId);
          return { ...v, projectName: project?.name || v.projectId };
        });
      }
      const oldAllocationsBefore = oldAllocationsInput.value;
      if (oldAllocationsBefore) {
        const allocations = await getAllocations();
        const people = await getPeople();
        const projects = await getProjects();
        preview.oldAllocations = allocations.filter((a) => a.endMonth && a.endMonth < oldAllocationsBefore).map((a) => {
          const person = people.find((p) => p.id === a.personId);
          const project = projects.find((p) => p.id === a.projectId);
          return { ...a, personName: person?.name || a.personId, projectName: project?.name || a.projectId };
        });
      }
      return preview;
    }
    function displayPrunePreview(preview) {
      const previewDiv = modal.querySelector("#prunePreview");
      const contentDiv = modal.querySelector("#prunePreviewContent");
      let html = "";
      if (preview.inactivePeople.length > 0) {
        html += `<h4>Inactive People (${preview.inactivePeople.length}):</h4><ul>`;
        preview.inactivePeople.forEach((p) => {
          html += `<li>${p.name}</li>`;
        });
        html += `</ul>`;
      }
      if (preview.oldFteValues.length > 0) {
        html += `<h4>Old FTE Values (${preview.oldFteValues.length}):</h4><ul>`;
        preview.oldFteValues.slice(0, 10).forEach((v) => {
          html += `<li>${v.personName}: ${v.fte} (${v.startMonth} to ${v.endMonth || "ongoing"})</li>`;
        });
        if (preview.oldFteValues.length > 10) {
          html += `<li>... and ${preview.oldFteValues.length - 10} more</li>`;
        }
        html += `</ul>`;
      }
      if (preview.oldBudgetValues.length > 0) {
        html += `<h4>Old Budget Values (${preview.oldBudgetValues.length}):</h4><ul>`;
        preview.oldBudgetValues.slice(0, 10).forEach((v) => {
          html += `<li>${v.projectName}: ${v.plannedPM} PM (${v.startMonth} to ${v.endMonth || "ongoing"})</li>`;
        });
        if (preview.oldBudgetValues.length > 10) {
          html += `<li>... and ${preview.oldBudgetValues.length - 10} more</li>`;
        }
        html += `</ul>`;
      }
      if (preview.oldAllocations.length > 0) {
        html += `<h4>Old Allocations (${preview.oldAllocations.length}):</h4><ul>`;
        preview.oldAllocations.slice(0, 10).forEach((a) => {
          html += `<li>${a.personName} \u2192 ${a.projectName}: ${a.pm} PM (${a.startMonth} to ${a.endMonth || "ongoing"})</li>`;
        });
        if (preview.oldAllocations.length > 10) {
          html += `<li>... and ${preview.oldAllocations.length - 10} more</li>`;
        }
        html += `</ul>`;
      }
      if (!html) {
        html = "<p><em>No items selected for pruning</em></p>";
      }
      contentDiv.innerHTML = html;
      previewDiv.style.display = "block";
    }
    async function executePruning(pruneInactivePeople, oldDataBefore, oldAllocationsBefore) {
      let totalDeleted = 0;
      await saveState("Data pruning");
      if (pruneInactivePeople) {
        const people = await getPeople();
        const inactivePeople = people.filter((p) => !p.active);
        for (const person of inactivePeople) {
          const fteValues = await getFteValues();
          const personFte = fteValues.filter((v) => v.personId === person.id);
          for (const fte of personFte) {
            await deleteFteValue(fte.id);
            totalDeleted++;
          }
          await deletePerson(person.id);
          totalDeleted++;
        }
      }
      if (oldDataBefore) {
        const fteValues = await getFteValues();
        const budgetValues = await getBudgetValues();
        const oldFte = fteValues.filter((v) => v.endMonth && v.endMonth < oldDataBefore);
        for (const fte of oldFte) {
          await deleteFteValue(fte.id);
          totalDeleted++;
        }
        const oldBudget = budgetValues.filter((v) => v.endMonth && v.endMonth < oldDataBefore);
        for (const budget of oldBudget) {
          await deleteBudgetValue(budget.id);
          totalDeleted++;
        }
      }
      if (oldAllocationsBefore) {
        const allocations = await getAllocations();
        const oldAllocations = allocations.filter((a) => a.endMonth && a.endMonth < oldAllocationsBefore);
        for (const allocation of oldAllocations) {
          await deleteAllocation(allocation.id);
          totalDeleted++;
        }
      }
      return totalDeleted;
    }
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
          const confirmed = await showImportPreview(data);
          if (!confirmed) {
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
    const dataPruningBtn = document.getElementById("dataPruningBtn");
    if (dataPruningBtn) {
      dataPruningBtn.addEventListener("click", async () => {
        await showDataPruningDialog();
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
    const seconds = Math.floor((Date.now() - date.getTime()) / MILLISECONDS_PER_SECOND);
    if (seconds < SECONDS_PER_MINUTE) return `${seconds} second${seconds !== 1 ? "s" : ""} ago`;
    const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
    if (minutes < MINUTES_PER_HOUR) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
    const hours = Math.floor(minutes / MINUTES_PER_HOUR);
    if (hours < HOURS_PER_DAY) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    const days = Math.floor(hours / HOURS_PER_DAY);
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
    }, AUTO_BACKUP_DELAY_MS);
  }

  // js/ui/enhancements.js
  init_toast();
  function initUndoRedoButtons() {
    if (typeof document === "undefined") return;
    const undoBtn = document.getElementById("undoBtn");
    const redoBtn = document.getElementById("redoBtn");
    if (undoBtn) {
      undoBtn.addEventListener("click", async () => {
        const success = await undo();
        if (success) {
          showSuccess("Undo successful");
        } else {
          showError("Nothing to undo");
        }
      });
    }
    if (redoBtn) {
      redoBtn.addEventListener("click", async () => {
        const success = await redo();
        if (success) {
          showSuccess("Redo successful");
        } else {
          showError("Nothing to redo");
        }
      });
    }
    updateUndoRedoButtons();
  }
  function initHelpPanel() {
    if (typeof document === "undefined") return;
    const helpBtn = document.getElementById("helpBtn");
    const helpPanel = document.getElementById("helpPanel");
    const closeHelpBtn = document.getElementById("closeHelpBtn");
    if (helpBtn && helpPanel) {
      helpBtn.addEventListener("click", () => {
        helpPanel.classList.add("open");
      });
    }
    if (closeHelpBtn && helpPanel) {
      closeHelpBtn.addEventListener("click", () => {
        helpPanel.classList.remove("open");
      });
    }
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && helpPanel && helpPanel.classList.contains("open")) {
        helpPanel.classList.remove("open");
      }
    });
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("tab-button")) {
        updateHelpContent(e.target.dataset.tab);
      }
    });
  }
  function updateHelpContent(tabName) {
    const helpContent = document.getElementById("helpPanelContent");
    if (!helpContent) return;
    const helpData = {
      people: {
        title: "People Tab Help",
        sections: [
          {
            heading: "Adding People",
            content: 'Click "Add Person" to add a new team member. Fill in their name and details.'
          },
          {
            heading: "FTE (Full-Time Equivalent)",
            content: "FTE represents work capacity: 1.0 = full-time, 0.5 = half-time, 0.0 = on leave. You can set different FTE values for different time periods.<br><br><strong>Key concept:</strong> For a single month, 1.0 FTE = 1 PM of available capacity. See the Glossary for more details."
          },
          {
            heading: "Active Status",
            content: 'Uncheck "Active" to hide people from allocations (e.g., former employees) without deleting them.'
          }
        ]
      },
      projects: {
        title: "Projects Tab Help",
        sections: [
          {
            heading: "Adding Projects",
            content: 'Click "Add Project" to create a new project.'
          },
          {
            heading: "Budget Values (Planned PM)",
            content: "Set planned person-months (PM) for different time periods. This helps track if projects are over or under allocated.<br><br><strong>Example:</strong> A project with 5 PM planned per month means it expects 5 person-months of effort each month."
          }
        ]
      },
      allocations: {
        title: "Allocations Tab Help",
        sections: [
          {
            heading: "Creating Allocations",
            content: "Assign people to projects with specific PM (person-months) per month.<br><br><strong>Example:</strong> 0.5 PM = half a person's working time for that month.<br><br><strong>Note:</strong> PM is the source of truth. Percentages in reports are calculated as (PM / FTE) \xD7 100."
          },
          {
            heading: "Date Ranges",
            content: "Set start and end months. Leave end month empty for ongoing allocations."
          },
          {
            heading: "Overrides",
            content: "Create month-specific exceptions for special cases (e.g., vacation, partial month)."
          }
        ]
      },
      results: {
        title: "Results Tab Help",
        sections: [
          {
            heading: "Monthly Report",
            content: `View person and project allocations for a specific month. Green = matches budget, Yellow = slight mismatch, Red = significant mismatch.<br><br><strong>Understanding the columns:</strong><ul style="margin-top: 8px;"><li><strong>FTE:</strong> Person's capacity for that month</li><li><strong>PM:</strong> Actual allocated work (source of truth)</li><li><strong>%:</strong> Utilization (calculated as PM/FTE \xD7 100)</li><li><strong>Delta:</strong> Over/under allocation (PM - FTE)</li></ul>`
          },
          {
            heading: "Yearly Overview",
            content: "See allocation trends across an entire year month-by-month. Values shown are in PM (person-months).<br><br><strong>Person table:</strong> Shows PM allocated per month, compared to FTE capacity.<br><br><strong>Project table:</strong> Shows PM allocated per month, compared to planned PM budget."
          },
          {
            heading: "Project \xD7 Month",
            content: "View all projects across months in a grid format showing PM allocations."
          }
        ]
      },
      data: {
        title: "Data Management Help",
        sections: [
          {
            heading: "Export Data",
            content: "Download all your data as a JSON file. Do this regularly to prevent data loss!"
          },
          {
            heading: "Import Data",
            content: "Restore data from a previously exported JSON file. This replaces ALL current data."
          },
          {
            heading: "Automatic Backups",
            content: 'Backups are saved in browser storage. Use "Download Latest Auto-Backup" for instant access to your latest changes.'
          }
        ]
      }
    };
    const data = helpData[tabName];
    if (!data) return;
    let html = `<div class="help-section"><h3>${data.title}</h3></div>`;
    data.sections.forEach((section) => {
      html += `
            <div class="help-section">
                <h3>${section.heading}</h3>
                <p>${section.content}</p>
            </div>
        `;
    });
    html += `
        <div class="help-section glossary-section">
            <h3>\u{1F4D6} Glossary: FTE, PM, and %</h3>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 10px;">
                <p style="margin-top: 0;"><strong>Understanding the three units in this app:</strong></p>
                
                <div style="margin: 12px 0; padding: 10px; background: white; border-left: 4px solid #007bff;">
                    <strong>FTE (Full-Time Equivalent)</strong> \u2014 Capacity
                    <ul style="margin: 5px 0 0 20px;">
                        <li><strong>What:</strong> A person's work capacity/availability</li>
                        <li><strong>Range:</strong> 0.0 to 1.0 (1.0 = full-time, 0.5 = half-time)</li>
                        <li><strong>For a month:</strong> 1.0 FTE = 1 PM of capacity</li>
                        <li><strong>Example:</strong> Someone working part-time has 0.5 FTE</li>
                    </ul>
                </div>
                
                <div style="margin: 12px 0; padding: 10px; background: white; border-left: 4px solid #28a745;">
                    <strong>PM (Person-Months)</strong> \u2014 Allocation (Source of Truth)
                    <ul style="margin: 5px 0 0 20px;">
                        <li><strong>What:</strong> Amount of work allocated to a project</li>
                        <li><strong>Unit:</strong> Person-months (time-based effort)</li>
                        <li><strong>Source of truth:</strong> This is the primary value stored</li>
                        <li><strong>Example:</strong> 0.5 PM = half a person's month of work</li>
                    </ul>
                </div>
                
                <div style="margin: 12px 0; padding: 10px; background: white; border-left: 4px solid #ffc107;">
                    <strong>% (Percentage)</strong> \u2014 Utilization (Calculated)
                    <ul style="margin: 5px 0 0 20px;">
                        <li><strong>What:</strong> How much of a person's capacity is used</li>
                        <li><strong>Formula:</strong> % = (PM / FTE) \xD7 100</li>
                        <li><strong>Derived:</strong> Always calculated from PM and FTE</li>
                        <li><strong>Example:</strong> 0.5 PM on 1.0 FTE = 50% utilization</li>
                        <li><strong>Example:</strong> 0.5 PM on 0.5 FTE = 100% utilization</li>
                    </ul>
                </div>
                
                <div style="margin-top: 15px; padding: 10px; background: #e7f3ff; border-radius: 4px;">
                    <strong>\u{1F4A1} Key Insight:</strong> PM is the single source of truth. FTE defines capacity, and % shows utilization. For a single month: <code>1.0 FTE = 1 PM of capacity</code>
                </div>
            </div>
        </div>
        
        <div class="help-section">
            <h3>Keyboard Shortcuts</h3>
            <p><kbd>Ctrl/Cmd + Z</kbd> - Undo last change</p>
            <p><kbd>Ctrl/Cmd + Shift + Z</kbd> or <kbd>Ctrl/Cmd + Y</kbd> - Redo</p>
        </div>
        
        <div class="help-section">
            <h3>General Tips</h3>
            <p>\u2022 Click column headers to sort tables</p>
            <p>\u2022 Use search boxes to quickly find items</p>
            <p>\u2022 Hover over \u2139\uFE0F icons for field-specific help</p>
            <p>\u2022 Export data regularly to prevent loss</p>
        </div>
    `;
    helpContent.innerHTML = html;
  }
  function initAutoSaveIndicator() {
    if (typeof document === "undefined") return;
    const indicator = document.getElementById("autoSaveIndicator");
    if (!indicator) return;
    indicator.style.display = "flex";
    let saveTimeout;
    document.addEventListener("dataChanged", () => {
      if (saveTimeout) clearTimeout(saveTimeout);
      indicator.classList.remove("saved");
      indicator.classList.add("saving");
      indicator.querySelector("#autoSaveText").textContent = "Saving...";
      saveTimeout = setTimeout(() => {
        indicator.classList.remove("saving");
        indicator.classList.add("saved");
        indicator.querySelector("#autoSaveText").textContent = "All changes saved";
      }, 1e3);
    });
  }
  function initUIEnhancements() {
    initUndoRedoButtons();
    initHelpPanel();
    initAutoSaveIndicator();
  }

  // js/helpers/smartDefaults.js
  function getCurrentMonth() {
    const now = /* @__PURE__ */ new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }
  function getCurrentYear() {
    return (/* @__PURE__ */ new Date()).getFullYear();
  }
  function initSmartDefaults() {
    if (typeof document === "undefined") return;
    const startMonthInputs = [
      "fteStartMonthInput",
      "budgetStartMonthInput",
      "startMonthInput",
      "overrideMonthInput"
    ];
    const currentMonth = getCurrentMonth();
    startMonthInputs.forEach((id) => {
      const input = document.getElementById(id);
      if (input && !input.value) {
        input.value = currentMonth;
      }
    });
    const yearInputs = [
      "yearInput",
      "overviewYearInput"
    ];
    const currentYear = getCurrentYear();
    yearInputs.forEach((id) => {
      const input = document.getElementById(id);
      if (input && !input.value) {
        input.value = currentYear;
      }
    });
    const monthInput = document.getElementById("monthInput");
    if (monthInput && !monthInput.value) {
      monthInput.value = currentMonth;
    }
    setupValueMemory();
  }
  function setupValueMemory() {
    const inputsToRemember = [
      { id: "fteValueInput", key: "lastFTE", default: 1 },
      { id: "budgetValueInput", key: "lastBudget", default: 5 },
      { id: "pmInput", key: "lastPM", default: 1 }
    ];
    inputsToRemember.forEach(({ id, key, default: defaultValue }) => {
      const input = document.getElementById(id);
      if (!input) return;
      const saved = localStorage.getItem(key);
      if (saved) {
        input.value = saved;
      }
      input.addEventListener("change", () => {
        localStorage.setItem(key, input.value);
      });
    });
  }

  // js/main.js
  async function rerenderAllViews() {
    await renderPeople();
    await renderFteValues();
    await renderProjects();
    await renderBudgetValues();
    await renderAllocations();
    await renderAllocationOverrides();
    await populatePersonSelect();
    await populateFtePersonSelect();
    await populateProjectSelect();
    await populateBudgetProjectSelect();
    await populateAllocationSelect();
  }
  if (typeof window !== "undefined" && typeof document !== "undefined" && document.readyState !== void 0) {
    (async () => {
      await openDatabase();
      initTabs();
      initUIEnhancements();
      initSmartDefaults();
      initPeopleView();
      initProjectsView();
      initAllocationsView();
      init();
      initMonthlyReport();
      initYearlyReport();
      initProjectOverview();
      initTimelineView();
      initUndoRedoShortcuts();
      await rerenderAllViews();
      document.addEventListener("dataImported", async () => {
        await rerenderAllViews();
      });
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
