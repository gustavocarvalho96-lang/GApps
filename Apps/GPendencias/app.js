const STORAGE_KEY = "pendencias-plantao-v1";
const BACKUP_INDEX_KEY = "pendencias-plantao-backup-index-v1";
const BACKUP_PREFIX = "pendencias-plantao-backup-";
const BACKUP_VERSION = 1;

const form = document.querySelector("#task-form");
const taskList = document.querySelector("#task-list");
const template = document.querySelector("#task-template");
const pendingItems = document.querySelector("#pending-items");
const pendingItemTemplate = document.querySelector("#pending-item-template");
const addItemButton = document.querySelector("#add-item-button");
const emptyState = document.querySelector("#empty-state");
const searchInput = document.querySelector("#search-input");
const filterButtons = document.querySelectorAll(".filter-button");
const listTitle = document.querySelector("#list-title");
const listContext = document.querySelector("#list-context");
const clearDoneButton = document.querySelector("#clear-done-button");
const clearAllButton = document.querySelector("#clear-all-button");
const saveButton = document.querySelector("#save-button");
const backupMenuButton = document.querySelector("#backup-menu-button");
const backupMenuPanel = document.querySelector("#backup-menu-panel");
const exportButton = document.querySelector("#export-button");
const importButton = document.querySelector("#import-button");
const importFileInput = document.querySelector("#import-file-input");
const copyBackupButton = document.querySelector("#copy-backup-button");
const restoreBackupButton = document.querySelector("#restore-backup-button");
const restoreDateButton = document.querySelector("#restore-date-button");
const saveStatus = document.querySelector("#save-status");
const currentClock = document.querySelector("#current-clock");
const openCount = document.querySelector("#open-count");
const lateCount = document.querySelector("#late-count");
const toggleFormButton = document.querySelector("#toggle-form-button");
const workspaceLayout = document.querySelector(".workspace-layout");

let tasks = loadTasks();
let activeFilter = "open";
let saveStatusTimer;

form?.addEventListener("submit", (event) => {
  event.preventDefault();

  const data = new FormData(form);
  const patient = clean(data.get("patient"));
  const diagnosis = clean(data.get("diagnosis"));
  const note = clean(data.get("note"));
  const newTasks = getPendingItemData(patient, diagnosis, note);

  if (newTasks.length === 0) return;

  tasks.unshift(...newTasks);
  saveTasks(`${newTasks.length} pendência(s) salva(s) neste computador`);
  form.reset();
  resetPendingItems();
  document.querySelector("#patient-input").focus();
  render();
});

searchInput?.addEventListener("input", render);

addItemButton?.addEventListener("click", () => {
  pendingItems.append(createPendingItem());
  updatePendingItemControls();
});

pendingItems?.addEventListener("click", (event) => {
  const removeButton = event.target.closest(".remove-item-button");
  if (!removeButton) return;

  const item = removeButton.closest(".pending-item");
  if (!item || pendingItems.children.length === 1) return;

  item.remove();
  updatePendingItemControls();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    render();
  });
});

clearDoneButton?.addEventListener("click", () => {
  const completeGroupIds = new Set(
    groupTasks(tasks)
      .filter((group) => group.tasks.every((task) => task.done))
      .map((group) => group.id)
  );

  tasks = tasks.filter((task) => !completeGroupIds.has(getTaskGroupId(task)));
  saveTasks("Cards completos foram limpos");
  render();
});

clearAllButton?.addEventListener("click", () => {
  const confirmed = window.confirm("Encerrar o plantão e apagar todos os cards salvos neste computador?");

  if (!confirmed) return;

  tasks = [];
  saveTasks("Plantão encerrado");
  render();
});

saveButton?.addEventListener("click", () => {
  closeBackupMenu();
  saveTasks("Tudo salvo neste computador");
  render();
});

exportButton?.addEventListener("click", () => {
  closeBackupMenu();
  exportBackupFile();
});

importButton?.addEventListener("click", () => {
  closeBackupMenu();
  importFileInput?.click();
});

importFileInput?.addEventListener("change", async () => {
  const file = importFileInput.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    restoreBackupText(text, "Backup importado");
  } catch {
    window.alert("Não foi possível importar este arquivo de backup.");
  } finally {
    importFileInput.value = "";
  }
});

copyBackupButton?.addEventListener("click", async () => {
  closeBackupMenu();
  const backupText = createBackupText();

  try {
    await copyText(backupText);
    showSaveStatus("Backup copiado");
  } catch {
    window.prompt("Copie o backup abaixo:", backupText);
  }
});

restoreBackupButton?.addEventListener("click", () => {
  closeBackupMenu();
  const backupText = window.prompt("Cole aqui o backup copiado ou o conteúdo do arquivo JSON:");
  if (!backupText) return;

  restoreBackupText(backupText, "Backup restaurado");
});

restoreDateButton?.addEventListener("click", () => {
  closeBackupMenu();
  restoreDatedBackup();
});

backupMenuButton?.addEventListener("click", () => {
  const isOpening = backupMenuPanel.hidden;
  backupMenuPanel.hidden = !isOpening;
  backupMenuButton.setAttribute("aria-expanded", String(isOpening));
});

toggleFormButton?.addEventListener("click", () => {
  const isClosed = workspaceLayout.classList.toggle("is-form-closed");
  toggleFormButton.textContent = isClosed ? "Abrir cadastro" : "Fechar cadastro";
  toggleFormButton.setAttribute("aria-expanded", String(!isClosed));
});

document.addEventListener("click", (event) => {
  if (backupMenuPanel && !backupMenuPanel.hidden && !event.target.closest(".backup-menu")) {
    closeBackupMenu();
  }

  if (!event.target.closest(".task-actions")) {
    closeCardOptionMenus();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeBackupMenu();
    closeCardOptionMenus();
  }
});

taskList?.addEventListener("click", (event) => {
  const action = event.target.closest("button");
  const checkbox = event.target.closest(".subtask-checkbox");
  const card = event.target.closest(".task-card");

  if ((!action && !checkbox) || !card) return;

  let message = "Alteração salva neste computador";

  if (action?.classList.contains("options-button")) {
    const menu = card.querySelector(".card-options-menu");
    const isOpening = menu.hidden;

    closeCardOptionMenus(card);
    menu.hidden = !isOpening;
    action.setAttribute("aria-expanded", String(isOpening));
    return;
  }

  if (action?.classList.contains("add-subtask-button")) {
    const addForm = card.querySelector(".card-add-form");
    addForm.hidden = false;
    closeCardOptionMenus();
    addForm.querySelector('[name="task"]').focus();
    return;
  }

  if (action?.classList.contains("edit-card-button")) {
    const editForm = card.querySelector(".card-edit-form");
    const groupTasksList = tasks.filter((task) => getTaskGroupId(task) === card.dataset.groupId);
    const mainTask = groupTasksList[0];

    if (!mainTask) return;

    editForm.elements.patient.value = mainTask.patient || "";
    editForm.elements.diagnosis.value = mainTask.diagnosis || "";
    editForm.elements.note.value = mainTask.note || "";
    editForm.hidden = false;
    closeCardOptionMenus();
    editForm.elements.patient.focus();
    return;
  }

  if (action?.classList.contains("cancel-subtask-button")) {
    const addForm = card.querySelector(".card-add-form");
    addForm.reset();
    addForm.hidden = true;
    return;
  }

  if (action?.classList.contains("cancel-card-edit-button")) {
    const editForm = card.querySelector(".card-edit-form");
    editForm.reset();
    editForm.hidden = true;
    return;
  }

  if (action?.classList.contains("edit-subtask-button")) {
    const subtask = action.closest(".subtask-item");
    const task = tasks.find((item) => item.id === subtask.dataset.taskId);
    const editForm = subtask.querySelector(".subtask-edit-form");

    if (!task || !editForm) return;

    closeCardOptionMenus();
    card.querySelectorAll(".subtask-item.is-editing").forEach((item) => {
      if (item !== subtask) {
        item.classList.remove("is-editing");
        const form = item.querySelector(".subtask-edit-form");
        if (form) {
          form.reset();
          form.hidden = true;
        }
      }
    });
    editForm.elements.task.value = task.description || "";
    editForm.elements.type.value = task.type || "Exame";
    editForm.hidden = false;
    subtask.classList.add("is-editing");
    editForm.elements.task.focus();
    return;
  }

  if (action?.classList.contains("cancel-subtask-edit-button")) {
    const editForm = action.closest(".subtask-edit-form");
    const subtask = action.closest(".subtask-item");
    editForm.reset();
    editForm.hidden = true;
    subtask?.classList.remove("is-editing");
    return;
  }

  if (action?.classList.contains("delete-subtask-button")) {
    const subtask = action.closest(".subtask-item");
    const groupTasksList = tasks.filter((task) => getTaskGroupId(task) === card.dataset.groupId);

    if (groupTasksList.length === 1) {
      window.alert("Este card tem apenas uma solicitação. Use Excluir card para apagar o paciente inteiro.");
      return;
    }

    const confirmed = window.confirm("Excluir apenas esta solicitação?");
    if (!confirmed) return;

    tasks = tasks.filter((task) => task.id !== subtask.dataset.taskId);
    saveTasks("Solicitação excluída");
    render();
    return;
  }

  if (action?.closest(".card-add-form") || action?.closest(".card-edit-form") || action?.closest(".subtask-edit-form")) {
    return;
  }

  if (checkbox) {
    const task = tasks.find((item) => item.id === checkbox.dataset.taskId);
    if (!task) return;

    task.done = checkbox.checked;
    message = task.done ? "Pendência marcada como feita" : "Pendência reaberta";
  }

  if (action?.classList.contains("delete-button")) {
    const confirmed = window.confirm("Excluir este card e todas as solicitações do paciente?");
    if (!confirmed) return;

    tasks = tasks.filter((item) => getTaskGroupId(item) !== card.dataset.groupId);
    message = "Card removido";
  }

  saveTasks(message);
  render();
});

taskList?.addEventListener("submit", (event) => {
  const addForm = event.target.closest(".card-add-form");
  const cardEditForm = event.target.closest(".card-edit-form");
  const subtaskEditForm = event.target.closest(".subtask-edit-form");
  const card = event.target.closest(".task-card");

  if ((!addForm && !cardEditForm && !subtaskEditForm) || !card) return;

  event.preventDefault();

  if (cardEditForm) {
    const data = new FormData(cardEditForm);
    const patient = clean(data.get("patient"));

    if (!patient) return;

    tasks = tasks.map((task) => {
      if (getTaskGroupId(task) !== card.dataset.groupId) return task;

      return {
        ...task,
        patient,
        diagnosis: clean(data.get("diagnosis")),
        note: clean(data.get("note")),
      };
    });

    saveTasks("Dados do paciente atualizados");
    render();
    return;
  }

  if (subtaskEditForm) {
    const subtask = subtaskEditForm.closest(".subtask-item");
    const data = new FormData(subtaskEditForm);
    const description = clean(data.get("task"));

    if (!description) return;

    tasks = tasks.map((task) => {
      if (task.id !== subtask.dataset.taskId) return task;

      return {
        ...task,
        description,
        type: data.get("type"),
      };
    });

    saveTasks("Solicitação atualizada");
    render();
    return;
  }

  const groupTasksList = tasks.filter((task) => getTaskGroupId(task) === card.dataset.groupId);
  const mainTask = groupTasksList[0];
  const data = new FormData(addForm);
  const description = clean(data.get("task"));

  if (!mainTask || !description) return;

  tasks.push({
    id: crypto.randomUUID(),
    groupId: card.dataset.groupId,
    patient: mainTask.patient,
    diagnosis: mainTask.diagnosis || "",
    description,
    type: data.get("type"),
    note: mainTask.note || "",
    done: false,
    createdAt: new Date().toISOString(),
  });

  saveTasks("Pendência adicionada ao paciente");
  render();
});

function render() {
  updateCounters();
  updateListCopy();

  if (!taskList || !template) return;

  taskList.replaceChildren();

  const visibleGroups = getVisibleGroups();
  emptyState.hidden = visibleGroups.length > 0;

  visibleGroups.forEach((group) => {
    const mainTask = group.tasks[0];
    const isComplete = group.tasks.every((task) => task.done);
    const isPartiallyDone = group.tasks.some((task) => task.done) && !isComplete;
    const card = template.content.firstElementChild.cloneNode(true);
    card.dataset.groupId = group.id;
    card.classList.toggle("is-done", isComplete);
    card.classList.toggle("is-partial", isPartiallyDone);

    card.querySelector("h3").textContent = mainTask.patient;
    card.querySelector(".created-time").hidden = true;
    const diagnosisPill = card.querySelector(".diagnosis-pill");
    diagnosisPill.replaceChildren();
    const timeSpan = document.createElement("span");
    timeSpan.className = "diagnosis-time";
    timeSpan.textContent = formatTime(mainTask.createdAt);
    diagnosisPill.append(timeSpan);
    if (mainTask.diagnosis) {
      const hdSpan = document.createElement("span");
      hdSpan.className = "diagnosis-hd";
      hdSpan.textContent = `HD: ${mainTask.diagnosis}`;
      diagnosisPill.append(hdSpan);
    }
    diagnosisPill.hidden = false;
    card.querySelector(".task-description").hidden = true;
    card.querySelector(".subtask-list").replaceChildren(...buildSubtasks(group.tasks));
    card.querySelector(".task-meta").replaceChildren();

    const note = card.querySelector(".task-note");
    note.textContent = mainTask.note ? `Obs.: ${mainTask.note}` : "";
    note.hidden = !mainTask.note;

    taskList.append(card);
  });
}

function getPendingItemData(patient, diagnosis, note) {
  const now = Date.now();
  const groupId = crypto.randomUUID();

  return [...pendingItems.querySelectorAll(".pending-item")]
    .map((item, index) => ({
      id: crypto.randomUUID(),
      groupId,
      patient,
      diagnosis,
      description: clean(item.querySelector('[name="task"]').value),
      type: item.querySelector('[name="type"]').value,
      note,
      done: false,
      createdAt: new Date(now + index).toISOString(),
    }))
    .filter((task) => task.patient && task.description);
}

function createPendingItem() {
  if (!pendingItemTemplate) return document.createElement("article");
  const item = pendingItemTemplate.content.firstElementChild.cloneNode(true);
  return item;
}

function resetPendingItems() {
  if (!pendingItems) return;
  pendingItems.replaceChildren(createPendingItem());
  updatePendingItemControls();
}

function updatePendingItemControls() {
  if (!pendingItems) return;
  const items = [...pendingItems.querySelectorAll(".pending-item")];

  items.forEach((item, index) => {
    item.querySelector("strong").textContent = `Pendência ${index + 1}`;
    item.querySelector(".remove-item-button").disabled = items.length === 1;
  });
}

function getVisibleGroups() {
  const query = normalize(searchInput.value);

  return groupTasks(tasks)
    .filter((group) => {
      const isComplete = group.tasks.every((task) => task.done);
      const haystack = normalize(
        group.tasks
          .map((task) => [task.patient, task.diagnosis, task.description, task.type, task.note].join(" "))
          .join(" ")
      );

      if (activeFilter === "done" && !isComplete) return false;
      if (activeFilter === "open" && isComplete) return false;
      return haystack.includes(query);
    })
    .sort(sortGroups);
}

function groupTasks(taskItems) {
  const groups = new Map();

  taskItems.forEach((task) => {
    const groupId = getTaskGroupId(task);
    if (!groups.has(groupId)) {
      groups.set(groupId, {
        id: groupId,
        tasks: [],
      });
    }

    groups.get(groupId).tasks.push(task);
  });

  return [...groups.values()];
}

function getTaskGroupId(task) {
  return task.groupId || task.id;
}

function sortGroups(a, b) {
  const aComplete = a.tasks.every((task) => task.done);
  const bComplete = b.tasks.every((task) => task.done);

  if (aComplete !== bComplete) return aComplete ? 1 : -1;

  return new Date(b.tasks[0].createdAt) - new Date(a.tasks[0].createdAt);
}

function sortTasks(a, b) {
  if (a.done !== b.done) return a.done ? 1 : -1;
  return new Date(b.createdAt) - new Date(a.createdAt);
}

function updateCounters() {
  const openTasks = tasks.filter((task) => !task.done);
  const completeGroups = groupTasks(tasks).filter((group) => group.tasks.every((task) => task.done));
  openCount.textContent = openTasks.length;
  lateCount.textContent = completeGroups.length;
}

function updateListCopy() {
  if (!listTitle || !listContext) return;

  const copy = {
    open: ["Pacientes pendentes", ""],
    all: ["Todas as pendências", ""],
    done: ["Pacientes completos", ""],
  };

  listTitle.textContent = copy[activeFilter][0];
  listContext.textContent = copy[activeFilter][1];
}

function buildSubtasks(taskItems) {
  return [...taskItems].sort(sortTasks).map((task) => {
    const item = document.createElement("div");
    item.className = "subtask-item";
    item.dataset.taskId = task.id;

    const row = document.createElement("div");
    row.className = "subtask-row";

    const checkWrapper = document.createElement("div");
    checkWrapper.className = "subtask-check";
    checkWrapper.classList.toggle("is-checked", task.done);

    const checkbox = document.createElement("input");
    checkbox.className = "subtask-checkbox";
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.dataset.taskId = task.id;
    checkbox.setAttribute("aria-label", task.done ? "Pendência feita" : "Marcar pendência como feita");

    const content = document.createElement("span");
    content.className = "subtask-content";

    const description = document.createElement("strong");
    description.textContent = task.description;

    const details = document.createElement("small");
    details.textContent = `${task.type} · ${formatTime(task.createdAt)}`;

    content.append(description, details);
    checkWrapper.append(checkbox, content);

    const actions = document.createElement("div");
    actions.className = "subtask-actions";

    const editButton = document.createElement("button");
    editButton.className = "ghost-button edit-subtask-button";
    editButton.type = "button";
    editButton.textContent = "Editar";

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-subtask-button";
    deleteButton.type = "button";
    deleteButton.textContent = "Excluir";

    actions.append(editButton, deleteButton);
    row.append(checkWrapper, actions);

    const editForm = document.createElement("form");
    editForm.className = "subtask-edit-form";
    editForm.hidden = true;
    editForm.innerHTML = `
      <label>
        <span>Solicitação</span>
        <textarea name="task" rows="2" required></textarea>
      </label>
      <div class="form-grid">
        <label>
          <span>Tipo</span>
          <select name="type">
            <option>Exame</option>
            <option>Reavaliação</option>
            <option>Medicação</option>
            <option>Interconsulta</option>
            <option>Alta / transferência</option>
            <option>Outro</option>
          </select>
        </label>
      </div>
      <div class="inline-actions">
        <button class="primary-button" type="submit">Salvar</button>
        <button class="ghost-button cancel-subtask-edit-button" type="button">Cancelar</button>
      </div>
    `;

    item.append(row, editForm);
    return item;
  });
}

function buildGroupMeta(taskItems) {
  const total = taskItems.length;
  const done = taskItems.filter((task) => task.done).length;
  const open = total - done;
  const parts = [`${done}/${total} itens feitos`, open ? `${open} faltando` : "Completo"];

  return parts.map((text) => {
    const span = document.createElement("span");
    span.textContent = text;
    return span;
  });
}

function updateClock() {
  if (!currentClock) return;
  currentClock.textContent = formatTime(new Date());
}

function formatTime(value) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "--:--";

  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function clean(value) {
  return String(value || "").trim();
}

function normalize(value) {
  return clean(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function loadTasks() {
  try {
    const storedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(storedTasks) ? storedTasks : [];
  } catch {
    return [];
  }
}

function saveTasks(message = "Salvo neste computador") {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  saveDatedBackup();
  showSaveStatus(message);
}

function createBackupPayload() {
  return {
    app: "GPendencias",
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    tasks,
  };
}

function createBackupText() {
  return JSON.stringify(createBackupPayload(), null, 2);
}

function exportBackupFile() {
  const text = createBackupText();
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `gpendencias-backup-${todayKey()}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showSaveStatus("Backup exportado");
}

function restoreBackupText(text, message) {
  let payload;

  try {
    payload = JSON.parse(text);
  } catch {
    window.alert("Backup inválido. Cole o texto completo do backup ou importe um arquivo JSON válido.");
    return;
  }

  const restoredTasks = Array.isArray(payload) ? payload : payload?.tasks;
  if (!Array.isArray(restoredTasks)) {
    window.alert("Backup inválido. Não encontrei a lista de cards.");
    return;
  }

  const confirmed = window.confirm("Restaurar este backup vai substituir os cards atuais neste navegador. Continuar?");
  if (!confirmed) return;

  tasks = restoredTasks;
  saveTasks(message);
  render();
}

function saveDatedBackup() {
  if (tasks.length === 0) return;

  try {
    const dateKey = todayKey();
    const backupKey = `${BACKUP_PREFIX}${dateKey}`;
    const payload = createBackupPayload();
    localStorage.setItem(backupKey, JSON.stringify(payload));

    const dates = loadBackupDates();
    if (!dates.includes(dateKey)) {
      dates.unshift(dateKey);
      dates.sort((a, b) => b.localeCompare(a));
      localStorage.setItem(BACKUP_INDEX_KEY, JSON.stringify(dates));
    }
  } catch {
    // O backup datado é uma proteção extra; o salvamento principal já aconteceu.
  }
}

function loadBackupDates() {
  try {
    const dates = JSON.parse(localStorage.getItem(BACKUP_INDEX_KEY));
    return Array.isArray(dates) ? dates.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function restoreDatedBackup() {
  const dates = loadBackupDates();
  if (dates.length === 0) {
    window.alert("Ainda não existe backup datado salvo neste navegador.");
    return;
  }

  const selectedDate = window.prompt(`Digite a data para restaurar:\n\n${dates.join("\n")}`);
  if (!selectedDate) return;

  const dateKey = selectedDate.trim();
  const backupText = localStorage.getItem(`${BACKUP_PREFIX}${dateKey}`);
  if (!backupText) {
    window.alert("Não encontrei backup para esta data.");
    return;
  }

  restoreBackupText(backupText, `Backup de ${dateKey} restaurado`);
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();

  if (!copied) throw new Error("copy failed");
}

function closeBackupMenu() {
  if (!backupMenuPanel || !backupMenuButton) return;

  backupMenuPanel.hidden = true;
  backupMenuButton.setAttribute("aria-expanded", "false");
}

function closeCardOptionMenus(exceptCard) {
  document.querySelectorAll(".task-card").forEach((card) => {
    if (exceptCard && card === exceptCard) return;
    const menu = card.querySelector(".card-options-menu");
    const button = card.querySelector(".options-button");
    if (menu) menu.hidden = true;
    if (button) button.setAttribute("aria-expanded", "false");
  });
}

function todayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function showSaveStatus(message) {
  if (!saveStatus) return;

  saveStatus.textContent = message;
  saveStatus.classList.add("is-fresh");

  clearTimeout(saveStatusTimer);
  saveStatusTimer = setTimeout(() => {
    saveStatus.textContent = "Salvo neste computador";
    saveStatus.classList.remove("is-fresh");
  }, 1800);
}

updatePendingItemControls();
updateClock();
setInterval(updateClock, 30000);
saveDatedBackup();
render();
