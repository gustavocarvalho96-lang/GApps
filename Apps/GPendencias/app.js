import { equal, validTasks, mergeTasks } from "./sync-core.mjs";
const LEGACY_STORAGE_KEY = "pendencias-plantao-v1";
const BACKUP_INDEX_BASE = "pendencias-plantao-backup-index-v1";
const BACKUP_PREFIX_BASE = "pendencias-plantao-backup-";
const BACKUP_VERSION = 1;
const ACTIVE_SESSION_KEY = "gpendencias-cloudflare-session-v1";
const API_URL =
  "https://gpendencias-teste.gustavocarvalho96.workers.dev/api/tasks";

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
const sessionScreen = document.querySelector("#session-screen");
const sessionForm = document.querySelector("#session-form");
const sessionPassword = document.querySelector("#session-password");
const sessionError = document.querySelector("#session-error");
const sessionButton = document.querySelector("#session-button");
const sessionCancelButton = document.querySelector("#session-cancel-button");

let activeSession = "";
let tasks = [];
let activeFilter = "open";
let cloudSaveTimer;
let cloudSavePending = false;
let cloudSaveGeneration = 0;
let cloudRevision = 0;
let baseTasks = [];
let syncInFlight = false;
let syncConflicts = [];
let connected = false;
const entryDialog = document.querySelector("#entry-dialog");
const handoffDialog = document.querySelector("#handoff-dialog");
const conflictDialog = document.querySelector("#conflict-dialog");
const clientId =
  sessionStorage.getItem("gpendencias-client-v2") || crypto.randomUUID();
sessionStorage.setItem("gpendencias-client-v2", clientId);
const outboxKey = (session) =>
  "gpendencias-outbox-v2-" + session + "-" + clientId;
const fieldNames = {
  patient: "Paciente",
  diagnosis: "Contexto",
  description: "Pendência",
  note: "Observações",
  nextAction: "Próximo passo",
  owner: "Responsável",
  done: "Conclusão",
  dueAt: "Horário",
  priority: "Prioridade",
  type: "Tipo",
  "*": "Item completo",
};

sessionForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const password = clean(new FormData(sessionForm).get("password"));
  await connectSession(password);
});

sessionButton?.addEventListener("click", () => {
  if (syncInFlight || cloudSavePending) {
    window.alert(
      "Há alterações aguardando sincronização. Sincronize ou revise os conflitos antes de trocar de sessão.",
    );
    return;
  }
  showSessionScreen();
});
sessionCancelButton?.addEventListener("click", () => {
  if (connected) sessionScreen.close();
});
sessionScreen.addEventListener("cancel", (event) => {
  if (!connected) event.preventDefault();
});
document
  .querySelectorAll("[data-close]")
  .forEach((button) =>
    button.addEventListener("click", () =>
      document.getElementById(button.dataset.close).close(),
    ),
  );

form?.addEventListener("submit", (event) => {
  event.preventDefault();

  const data = new FormData(form);
  const patient = clean(data.get("patient"));
  const diagnosis = clean(data.get("diagnosis"));
  const note = clean(data.get("note"));
  const newTasks = getPendingItemData(patient, diagnosis, note);

  if (newTasks.length === 0) return;

  tasks.unshift(...newTasks);
  saveTasks(`${newTasks.length} pendência(s) salva(s)`);
  form.reset();
  resetPendingItems();
  entryDialog.close();
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
    filterButtons.forEach((item) => {
      item.classList.toggle("is-active", item === button);
      item.setAttribute("aria-pressed", String(item === button));
    });
    render();
  });
});

clearDoneButton?.addEventListener("click", () => {
  const completeGroupIds = new Set(
    groupTasks(tasks)
      .filter((group) => group.tasks.every((task) => task.done))
      .map((group) => group.id),
  );

  if (
    !completeGroupIds.size ||
    !window.confirm("Remover os pacientes concluídos da sessão compartilhada?")
  )
    return;
  saveDatedBackup();
  tasks = tasks.filter((task) => !completeGroupIds.has(getTaskGroupId(task)));
  saveTasks("Cards completos foram limpos");
  render();
});

clearAllButton?.addEventListener("click", () => {
  const confirmed = window.confirm(
    `Encerrar o plantão e apagar todos os cards da sessão ${activeSession}?`,
  );

  if (!confirmed) return;

  saveDatedBackup();
  tasks = [];
  saveTasks("Plantão encerrado");
  render();
});

saveButton?.addEventListener("click", () => {
  closeBackupMenu();
  if (cloudSavePending) void pushTasksToCloud();
  else void refreshFromCloud();
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
    updateSyncState();
  } catch {
    window.prompt("Copie o backup abaixo:", backupText);
  }
});

restoreBackupButton?.addEventListener("click", () => {
  closeBackupMenu();
  const backupText = window.prompt(
    "Cole aqui o backup copiado ou o conteúdo do arquivo JSON:",
  );
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
  entryDialog.showModal();
  document.querySelector("#patient-input").focus();
});

document.addEventListener("click", (event) => {
  if (
    backupMenuPanel &&
    !backupMenuPanel.hidden &&
    !event.target.closest(".backup-menu")
  ) {
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

  let message = "Alteração salva";

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
    const groupTasksList = tasks.filter(
      (task) => getTaskGroupId(task) === card.dataset.groupId,
    );
    const mainTask = groupTasksList[0];

    if (!mainTask) return;

    editForm.elements.patient.value = mainTask.patient || "";
    editForm.elements.diagnosis.value = mainTask.diagnosis || "";
    editForm.elements.note.value = mainTask.note || "";
    editForm.elements.nextAction.value = mainTask.nextAction || "";
    editForm.elements.owner.value = mainTask.owner || "";
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
    editForm.elements.dueAt.value = toLocalInput(task.dueAt);
    editForm.elements.priority.value = task.priority || "normal";
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
    const groupTasksList = tasks.filter(
      (task) => getTaskGroupId(task) === card.dataset.groupId,
    );

    if (groupTasksList.length === 1) {
      window.alert(
        "Este card tem apenas uma solicitação. Use Excluir card para apagar o paciente inteiro.",
      );
      return;
    }

    const confirmed = window.confirm("Excluir apenas esta solicitação?");
    if (!confirmed) return;

    tasks = tasks.filter((task) => task.id !== subtask.dataset.taskId);
    saveTasks("Solicitação excluída");
    render();
    return;
  }

  if (
    action?.closest(".card-add-form") ||
    action?.closest(".card-edit-form") ||
    action?.closest(".subtask-edit-form")
  ) {
    return;
  }

  if (checkbox) {
    const task = tasks.find((item) => item.id === checkbox.dataset.taskId);
    if (!task) return;

    task.done = checkbox.checked;
    message = task.done ? "Pendência marcada como feita" : "Pendência reaberta";
  }

  if (action?.classList.contains("delete-button")) {
    const confirmed = window.confirm(
      "Excluir este card e todas as solicitações do paciente?",
    );
    if (!confirmed) return;

    tasks = tasks.filter(
      (item) => getTaskGroupId(item) !== card.dataset.groupId,
    );
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
        nextAction: clean(data.get("nextAction")),
        owner: clean(data.get("owner")),
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
        dueAt: readDue(data.get("dueAt")),
        priority: data.get("priority") || "normal",
      };
    });

    saveTasks("Solicitação atualizada");
    render();
    return;
  }

  const groupTasksList = tasks.filter(
    (task) => getTaskGroupId(task) === card.dataset.groupId,
  );
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
    nextAction: mainTask.nextAction || "",
    owner: mainTask.owner || "",
    dueAt: readDue(data.get("dueAt")),
    priority: data.get("priority") || "normal",
    done: false,
    createdAt: new Date().toISOString(),
  });

  saveTasks("Pendência adicionada ao paciente");
  render();
});

function render() {
  const focusedTask = document.activeElement?.classList.contains(
    "subtask-checkbox",
  )
    ? document.activeElement.dataset.taskId
    : null;
  updateCounters();
  updateListCopy();

  if (!taskList || !template) return;

  taskList.replaceChildren();

  const visibleGroups = getVisibleGroups();
  emptyState.hidden = visibleGroups.length > 0;

  visibleGroups.forEach((group) => {
    const mainTask = group.tasks[0];
    const isComplete = group.tasks.every((task) => task.done);
    const isPartiallyDone =
      group.tasks.some((task) => task.done) && !isComplete;
    const card = template.content.firstElementChild.cloneNode(true);
    card.dataset.groupId = group.id;
    card.classList.toggle("is-done", isComplete);
    card.classList.toggle("needs-attention", group.tasks.some(needsAttention));
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
      hdSpan.textContent = mainTask.diagnosis;
      diagnosisPill.append(hdSpan);
    }
    diagnosisPill.hidden = !mainTask.diagnosis;
    card.querySelector(".task-description").hidden = true;
    card
      .querySelector(".subtask-list")
      .replaceChildren(...buildSubtasks(group.tasks));
    const meta = card.querySelector(".task-meta");
    const count = document.createElement("span");
    count.textContent = isComplete
      ? "Todas concluídas"
      : group.tasks.filter((t) => !t.done).length + " em aberto";
    meta.append(count);
    if (mainTask.owner) {
      const owner = document.createElement("span");
      owner.textContent = "Responsável: " + mainTask.owner;
      meta.append(owner);
    }
    if (mainTask.nextAction) {
      const next = document.createElement("span");
      next.className = "next-action";
      next.textContent = "Próximo passo → " + mainTask.nextAction;
      meta.append(next);
    }

    const note = card.querySelector(".task-note");
    note.textContent = mainTask.note ? `Obs.: ${mainTask.note}` : "";
    note.hidden = !mainTask.note;

    taskList.append(card);
  });
  if (focusedTask)
    [...taskList.querySelectorAll(".subtask-checkbox")]
      .find((input) => input.dataset.taskId === focusedTask)
      ?.focus({ preventScroll: true });
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
      nextAction: clean(form.elements.nextAction.value),
      owner: clean(form.elements.owner.value),
      dueAt: readDue(item.querySelector('[name="dueAt"]').value),
      priority: item.querySelector('[name="priority"]').value,
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
          .map((task) =>
            [
              task.patient,
              task.diagnosis,
              task.description,
              task.type,
              task.note,
              task.nextAction,
              task.owner,
            ].join(" "),
          )
          .join(" "),
      );

      if (activeFilter === "attention" && !group.tasks.some(needsAttention))
        return false;
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

  const score = (group) =>
    group.tasks.some((t) => !t.done && t.priority === "high")
      ? 0
      : group.tasks.some(isOverdue)
        ? 1
        : 2;
  const due = (group) =>
    Math.min(
      ...group.tasks
        .filter((t) => !t.done && t.dueAt)
        .map((t) => new Date(t.dueAt).getTime()),
      Infinity,
    );
  return (
    score(a) - score(b) ||
    due(a) - due(b) ||
    0 ||
    new Date(a.tasks[0].createdAt) - new Date(b.tasks[0].createdAt)
  );
}

function sortTasks(a, b) {
  if (a.done !== b.done) return a.done ? 1 : -1;
  return new Date(b.createdAt) - new Date(a.createdAt);
}

function updateCounters() {
  const openTasks = tasks.filter((task) => !task.done);
  const completeGroups = groupTasks(tasks).filter((group) =>
    group.tasks.every((task) => task.done),
  );
  openCount.textContent = openTasks.length;
  lateCount.textContent = completeGroups.length;
  document.querySelector("#patient-count").textContent =
    groupTasks(tasks).length - completeGroups.length;
  document.querySelector("#attention-count").textContent = groupTasks(
    tasks,
  ).filter((g) => g.tasks.some(needsAttention)).length;
}

function updateListCopy() {
  if (!listTitle || !listContext) return;

  const copy = {
    open: ["Pacientes em acompanhamento", "Prioridades e horários primeiro"],
    attention: [
      "Pacientes que pedem atenção",
      "Prioridade marcada ou horário atingido",
    ],
    all: ["Todas as pendências", ""],
    done: ["Pacientes completos", ""],
  };

  listTitle.textContent = copy[activeFilter][0];
  listContext.textContent = copy[activeFilter][1];
  emptyState.replaceChildren();
  const title = document.createElement("strong");
  title.textContent = searchInput.value
    ? "Nenhum resultado"
    : activeFilter === "attention"
      ? "Nenhuma atenção sinalizada"
      : activeFilter === "done"
        ? "Nenhum paciente concluído"
        : "Tudo em dia por aqui.";
  const subtitle = document.createElement("p");
  subtitle.textContent = searchInput.value
    ? "Tente outro nome, leito ou termo."
    : "Cadastre um paciente para acompanhar as próximas ações do plantão.";
  emptyState.append(title, subtitle);
  if (!tasks.length) {
    const button = document.createElement("button");
    button.textContent = "+ Adicionar primeiro paciente";
    button.className = "primary-button";
    button.onclick = () => toggleFormButton.click();
    emptyState.append(button);
  }
}

function buildSubtasks(taskItems) {
  return [...taskItems].sort(sortTasks).map((task) => {
    const item = document.createElement("div");
    item.className = "subtask-item";
    item.dataset.taskId = task.id;

    const row = document.createElement("div");
    row.className = "subtask-row";

    const checkWrapper = document.createElement("label");
    checkWrapper.className = "subtask-check";
    checkWrapper.classList.toggle("is-checked", task.done);

    const checkbox = document.createElement("input");
    checkbox.className = "subtask-checkbox";
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.dataset.taskId = task.id;
    checkbox.setAttribute(
      "aria-label",
      (task.done ? "Reabrir: " : "Concluir: ") + task.description,
    );

    const content = document.createElement("span");
    content.className = "subtask-content";

    const description = document.createElement("strong");
    description.textContent = task.description;

    const details = document.createElement("small");
    details.textContent = [
      task.type,
      !task.done && task.priority === "high" ? "Priorizar" : "",
      task.dueAt
        ? (isOverdue(task) ? "Horário atingido · " : "Rever · ") +
          formatDue(task.dueAt)
        : "",
    ]
      .filter(Boolean)
      .join(" · ");
    details.classList.toggle("due-late", needsAttention(task));

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
        <label><span>Rever em</span><input name="dueAt" type="datetime-local"></label>
        <label><span>Prioridade</span><select name="priority"><option value="normal">Normal</option><option value="high">Priorizar</option></select></label>
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

function sessionStorageKey(session = activeSession) {
  return session
    ? `${LEGACY_STORAGE_KEY}-sessao-${session}`
    : LEGACY_STORAGE_KEY;
}

function backupIndexKey(session = activeSession) {
  return session ? `${BACKUP_INDEX_BASE}-sessao-${session}` : BACKUP_INDEX_BASE;
}

function backupPrefix(session = activeSession) {
  return session
    ? `${BACKUP_PREFIX_BASE}sessao-${session}-`
    : BACKUP_PREFIX_BASE;
}

function persistState() {
  try {
    // Keep base and local edits together so retries can distinguish changes from old cache.
    if (cloudSavePending)
      localStorage.setItem(
        outboxKey(activeSession),
        JSON.stringify({
          base: baseTasks,
          tasks,
          revision: cloudRevision,
          conflicts: syncConflicts,
        }),
      );
    else localStorage.removeItem(outboxKey(activeSession));
    localStorage.setItem(sessionStorageKey(), JSON.stringify(tasks));
    return true;
  } catch {
    showSaveStatus(
      "Armazenamento local indisponível. Mantenha esta aba aberta até sincronizar.",
    );
    return false;
  }
}

function saveTasks() {
  cloudSavePending = true;
  cloudSaveGeneration++;
  const stored = persistState();
  saveDatedBackup();
  if (stored) showSaveStatus("Salvando alterações…");
  clearTimeout(cloudSaveTimer);
  cloudSaveTimer = setTimeout(() => void pushTasksToCloud(), 350);
}

async function sessionRequest(session, options = {}) {
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${session}`);
  return fetch(API_URL, {
    ...options,
    headers,
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
  });
}

async function connectSession(password) {
  if (!/^[1-9]$/.test(password)) {
    sessionError.textContent = "Digite um número de 1 a 9.";
    return false;
  }
  const submit = sessionForm.querySelector('[type="submit"]');
  submit.disabled = true;
  sessionError.textContent = "Conectando…";
  try {
    const response = await sessionRequest(password);
    if (!response.ok)
      throw new Error("Não foi possível acessar esta sessão. Tente novamente.");
    const data = await response.json();
    if (!validTasks(data.tasks))
      throw new Error(
        "Dados da sessão inválidos. Nenhuma alteração foi feita.",
      );
    let pending;
    try {
      pending = JSON.parse(localStorage.getItem(outboxKey(password)));
    } catch {
      /* no valid outbox */
    }
    activeSession = password;
    connected = true;
    baseTasks = structuredClone(data.tasks);
    tasks = structuredClone(data.tasks);
    cloudRevision = data.revision;
    syncConflicts = [];
    cloudSavePending = false;
    if (pending && validTasks(pending.tasks) && validTasks(pending.base)) {
      const merged = mergeTasks(pending.base, pending.tasks, data.tasks);
      tasks = merged.tasks;
      // Previously flagged conflicts remain explicit until the user resolves them.
      syncConflicts = [...merged.conflicts];
      for (const previous of pending.conflicts || []) {
        if (
          !syncConflicts.some(
            (c) => c.id === previous.id && c.field === previous.field,
          )
        ) {
          const remote = data.tasks.find((t) => t.id === previous.id);
          syncConflicts.push({
            ...previous,
            remote: previous.field === "*" ? remote : remote?.[previous.field],
          });
        }
      }
      cloudSavePending = !equal(tasks, baseTasks) || syncConflicts.length > 0;
    }
    localStorage.setItem(ACTIVE_SESSION_KEY, password);
    persistState();
    sessionButton.textContent = "Sessão " + password;
    sessionScreen.close();
    sessionForm.reset();
    form.reset();
    resetPendingItems();
    searchInput.value = "";
    render();
    updateSyncState();
    if (cloudSavePending && !syncConflicts.length) void pushTasksToCloud();
    return true;
  } catch (error) {
    sessionError.textContent = error.message || "Sem conexão. Tente novamente.";
    return false;
  } finally {
    submit.disabled = false;
  }
}

function showSessionScreen() {
  sessionError.textContent = "";
  sessionPassword.value = "";
  sessionCancelButton.hidden = !connected;
  if (!sessionScreen.open) sessionScreen.showModal();
  sessionPassword.focus();
}

function updateSyncState(message) {
  document.querySelector("#conflict-banner").hidden = !syncConflicts.length;
  document.querySelector("#retry-sync").hidden =
    !cloudSavePending || !!syncConflicts.length || syncInFlight;
  showSaveStatus(
    message ||
      (syncConflicts.length
        ? "Edições aguardando revisão"
        : cloudSavePending
          ? "Alterações aguardando envio"
          : "Sincronizado"),
  );
}

async function pushTasksToCloud() {
  if (!connected || syncInFlight || syncConflicts.length || !cloudSavePending)
    return false;
  syncInFlight = true;
  const session = activeSession;
  updateSyncState("Sincronizando…");
  try {
    // Serialize writes. A stale revision can never replace newer server state.
    for (let attempt = 0; attempt < 5 && cloudSavePending; attempt++) {
      const snapshot = structuredClone(tasks);
      const response = await sessionRequest(session, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: snapshot, revision: cloudRevision }),
      });
      const data = await response.json();
      if (response.status === 409 && validTasks(data.tasks)) {
        const merged = mergeTasks(baseTasks, tasks, data.tasks);
        baseTasks = structuredClone(data.tasks);
        cloudRevision = data.revision;
        tasks = merged.tasks;
        syncConflicts = merged.conflicts;
        cloudSavePending = !equal(tasks, baseTasks) || syncConflicts.length > 0;
        persistState();
        if (!isEditing()) render();
        if (syncConflicts.length) break;
        continue;
      }
      if (!response.ok)
        throw new Error(data.error || "Não foi possível salvar.");
      baseTasks = snapshot;
      cloudRevision = data.revision;
      cloudSavePending = !equal(tasks, baseTasks);
      persistState();
    }
    updateSyncState();
    return !cloudSavePending;
  } catch (error) {
    // Never clear pending changes on a network error; the next cycle retries the outbox.
    persistState();
    updateSyncState(
      navigator.onLine
        ? "Falha no envio. Alterações aguardando nova tentativa."
        : "Sem conexão · alterações aguardando envio",
    );
    return false;
  } finally {
    syncInFlight = false;
    document.querySelector("#retry-sync").hidden =
      !cloudSavePending || !!syncConflicts.length;
  }
}

function isEditing() {
  return !!document.querySelector(
    "dialog[open], .card-edit-form:not([hidden]), .card-add-form:not([hidden]), .subtask-edit-form:not([hidden])",
  );
}

async function refreshFromCloud() {
  if (
    !connected ||
    cloudSavePending ||
    syncInFlight ||
    document.hidden ||
    isEditing()
  )
    return;
  const session = activeSession,
    generation = cloudSaveGeneration;
  try {
    const response = await sessionRequest(session);
    if (!response.ok) throw new Error("refresh");
    const data = await response.json();
    if (
      session !== activeSession ||
      generation !== cloudSaveGeneration ||
      cloudSavePending ||
      isEditing()
    )
      return;
    if (!validTasks(data.tasks)) throw new Error("invalid");
    if (data.revision > cloudRevision) {
      tasks = structuredClone(data.tasks);
      baseTasks = structuredClone(data.tasks);
      cloudRevision = data.revision;
      persistState();
      render();
    }
    updateSyncState();
  } catch {
    if (!cloudSavePending)
      showSaveStatus("Sem atualização recente · verificando conexão");
  }
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
  updateSyncState();
}

function restoreBackupText(text, message) {
  let payload;

  try {
    payload = JSON.parse(text);
  } catch {
    window.alert(
      "Backup inválido. Cole o texto completo do backup ou importe um arquivo JSON válido.",
    );
    return;
  }

  if (syncConflicts.length) {
    window.alert("Revise as edições simultâneas antes de restaurar um backup.");
    return;
  }
  const restoredTasks = Array.isArray(payload) ? payload : payload?.tasks;
  if (!validTasks(restoredTasks)) {
    window.alert("Backup inválido. Não encontrei a lista de cards.");
    return;
  }

  const confirmed = window.confirm(
    `Restaurar este backup vai substituir as pendências da sessão ${activeSession} para todas as pessoas. Continuar?`,
  );
  if (!confirmed) return;

  saveDatedBackup();
  tasks = restoredTasks;
  saveTasks(message);
  render();
}

function saveDatedBackup() {
  if (tasks.length === 0) return;

  try {
    const dateKey = todayKey();
    const backupKey = `${backupPrefix()}${dateKey}`;
    const payload = createBackupPayload();
    localStorage.setItem(backupKey, JSON.stringify(payload));

    const dates = loadBackupDates();
    if (!dates.includes(dateKey)) {
      dates.unshift(dateKey);
      dates.sort((a, b) => b.localeCompare(a));
      localStorage.setItem(backupIndexKey(), JSON.stringify(dates));
    }
  } catch {
    // O backup datado é uma proteção extra; o salvamento principal já aconteceu.
  }
}

function loadBackupDates() {
  try {
    const dates = JSON.parse(localStorage.getItem(backupIndexKey()));
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

  const selectedDate = window.prompt(
    `Digite a data para restaurar:\n\n${dates.join("\n")}`,
  );
  if (!selectedDate) return;

  const dateKey = selectedDate.trim();
  const backupText = localStorage.getItem(`${backupPrefix()}${dateKey}`);
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
  saveStatus.textContent = message;
}

function readDue(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}
function toLocalInput(value) {
  if (!value || Number.isNaN(new Date(value).getTime())) return "";
  const d = new Date(value);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
function formatDue(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return (
    date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) +
    " às " +
    formatTime(date)
  );
}
function isOverdue(task) {
  return (
    !task.done && !!task.dueAt && new Date(task.dueAt).getTime() <= Date.now()
  );
}
function needsAttention(task) {
  return !task.done && (task.priority === "high" || isOverdue(task));
}

document
  .querySelector("#retry-sync")
  .addEventListener("click", () => void pushTasksToCloud());
document.querySelector("#handoff-button").addEventListener("click", () => {
  const selection = document.querySelector("#handoff-selection");
  selection.replaceChildren();
  for (const group of groupTasks(tasks)
    .filter((g) => g.tasks.some((t) => !t.done))
    .sort(sortGroups)) {
    const label = document.createElement("label"),
      check = document.createElement("input");
    check.type = "checkbox";
    check.value = group.id;
    check.checked = true;
    label.append(check, document.createTextNode(group.tasks[0].patient));
    selection.append(label);
  }
  document.querySelector("#handoff-status").textContent = cloudSavePending
    ? "Há alterações ainda não sincronizadas. Este resumo reflete esta tela."
    : "";
  buildHandoff();
  handoffDialog.showModal();
});
document
  .querySelector("#handoff-selection")
  .addEventListener("change", buildHandoff);
function buildHandoff() {
  const selected = new Set(
    [...document.querySelectorAll("#handoff-selection input:checked")].map(
      (i) => i.value,
    ),
  );
  const groups = groupTasks(tasks)
    .filter((g) => selected.has(g.id))
    .sort(sortGroups);
  const lines = [
    "PASSAGEM DE PLANTÃO · Sessão " + activeSession,
    new Date().toLocaleString("pt-BR"),
    "",
  ];
  for (const group of groups) {
    const patient = group.tasks[0];
    lines.push(patient.patient);
    if (patient.diagnosis) lines.push("Contexto: " + patient.diagnosis);
    for (const task of group.tasks.filter((t) => !t.done).sort(sortTasks)) {
      lines.push(
        "• " +
          task.description +
          (task.priority === "high" ? " [Priorizar]" : "") +
          (task.dueAt ? " — rever " + formatDue(task.dueAt) : ""),
      );
    }
    if (patient.nextAction) lines.push("Próximo passo: " + patient.nextAction);
    if (patient.owner) lines.push("Responsável: " + patient.owner);
    if (patient.note) lines.push("Observações: " + patient.note);
    lines.push("");
  }
  document.querySelector("#handoff-text").value = groups.length
    ? lines.join("\n").trim()
    : "";
  document.querySelector("#copy-handoff").disabled = !groups.length;
}
document.querySelector("#copy-handoff").addEventListener("click", async () => {
  try {
    await copyText(document.querySelector("#handoff-text").value);
    document.querySelector("#handoff-status").textContent =
      "Passagem copiada. As pendências continuam abertas.";
  } catch {
    document.querySelector("#handoff-text").select();
    document.querySelector("#handoff-status").textContent =
      "Selecione e copie o texto manualmente.";
  }
});

document.querySelector("#review-conflicts").addEventListener("click", () => {
  const container = document.querySelector("#conflict-items");
  container.replaceChildren();
  syncConflicts.forEach((conflict, index) => {
    const item = document.createElement("fieldset");
    item.className = "conflict-item";
    const title = document.createElement("legend");
    title.textContent =
      (conflict.patient ||
        conflict.local?.patient ||
        conflict.remote?.patient ||
        "Paciente") +
      " · " +
      (fieldNames[conflict.field] || conflict.field);
    item.append(title);
    for (const side of ["local", "remote"]) {
      const label = document.createElement("label"),
        radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "conflict-" + index;
      radio.value = side;
      radio.required = true;
      const task = tasks.find((t) => t.id === conflict.id);
      const value =
        side === "local"
          ? conflict.field === "*"
            ? task
            : task?.[conflict.field]
          : conflict.remote;
      const text =
        value === undefined
          ? "Excluído"
          : typeof value === "object"
            ? JSON.stringify(value, null, 2)
            : typeof value === "boolean"
              ? value
                ? "Concluída"
                : "Em aberto"
              : String(value);
      label.append(
        radio,
        document.createTextNode(
          (side === "local" ? "Sua edição: " : "Online: ") + text,
        ),
      );
      item.append(label);
    }
    container.append(item);
  });
  conflictDialog.showModal();
});
document.querySelector("#conflict-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(event.target);
  syncConflicts.forEach((conflict, index) => {
    if (data.get("conflict-" + index) !== "remote") return;
    if (conflict.field === "*") {
      tasks = tasks.filter((t) => t.id !== conflict.id);
      if (conflict.remote) tasks.push(conflict.remote);
    } else {
      const task = tasks.find((t) => t.id === conflict.id);
      if (task) {
        if (conflict.remote === undefined) delete task[conflict.field];
        else task[conflict.field] = conflict.remote;
      }
    }
  });
  syncConflicts = [];
  conflictDialog.close();
  saveTasks();
  render();
  updateSyncState();
});

updatePendingItemControls();
updateClock();
setInterval(() => {
  updateClock();
  if (!isEditing() && connected) render();
}, 30000);
render();
showSessionScreen();
// Opening the page always requires an explicit session choice.
setInterval(() => {
  if (cloudSavePending) void pushTasksToCloud();
  else void refreshFromCloud();
}, 12000);
window.addEventListener("online", () => {
  if (cloudSavePending) void pushTasksToCloud();
  else void refreshFromCloud();
});
window.addEventListener("beforeunload", (event) => {
  if (cloudSavePending) {
    event.preventDefault();
    event.returnValue = "";
  }
});

const recoveryButton = document.createElement("button");
recoveryButton.type = "button";
recoveryButton.textContent = "Recuperar alterações locais";
backupMenuPanel.insertBefore(recoveryButton, backupMenuPanel.firstChild);
recoveryButton.addEventListener("click", () => {
  closeBackupMenu();
  if (cloudSavePending || syncInFlight) {
    window.alert("Sincronize as alterações desta aba primeiro.");
    return;
  }
  const prefix = "gpendencias-outbox-v2-" + activeSession;
  const candidates = Object.keys(localStorage).filter(
    (key) =>
      (key === prefix || key.startsWith(prefix + "-")) &&
      key !== outboxKey(activeSession),
  );
  if (!candidates.length) {
    window.alert("Não há alterações locais de outras abas para recuperar.");
    return;
  }
  if (
    !window.confirm(
      "Recuperar alterações não enviadas de outras abas desta sessão? Feche as outras abas antes de continuar.",
    )
  )
    return;
  const recovered = [];
  for (const key of candidates) {
    try {
      const raw = localStorage.getItem(key),
        pending = JSON.parse(raw);
      if (!validTasks(pending?.base) || !validTasks(pending?.tasks)) continue;
      const merged = mergeTasks(pending.base, pending.tasks, tasks);
      tasks = merged.tasks;
      syncConflicts.push(...merged.conflicts, ...(pending.conflicts || []));
      recovered.push([key, raw]);
    } catch {
      /* Invalid outboxes are preserved for manual export. */
    }
  }
  cloudSavePending = true;
  if (persistState())
    for (const [key, raw] of recovered) {
      if (localStorage.getItem(key) === raw) localStorage.removeItem(key);
    }
  saveTasks();
  render();
  updateSyncState();
});
