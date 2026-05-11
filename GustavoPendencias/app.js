const STORAGE_KEY = "pendencias-plantao-v1";

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
const saveStatus = document.querySelector("#save-status");
const currentClock = document.querySelector("#current-clock");
const openCount = document.querySelector("#open-count");
const lateCount = document.querySelector("#late-count");
const doneCount = document.querySelector("#done-count");

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
  saveTasks("Tudo salvo neste computador");
  render();
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

    menu.hidden = !isOpening;
    action.setAttribute("aria-expanded", String(isOpening));
    return;
  }

  if (action?.classList.contains("add-subtask-button")) {
    const addForm = card.querySelector(".card-add-form");
    addForm.hidden = false;
    card.querySelector(".card-options-menu").hidden = true;
    card.querySelector(".options-button").setAttribute("aria-expanded", "false");
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
    card.querySelector(".card-options-menu").hidden = true;
    card.querySelector(".options-button").setAttribute("aria-expanded", "false");
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

    editForm.elements.task.value = task.description || "";
    editForm.elements.type.value = task.type || "Exame";
    editForm.elements.priority.value = task.priority || "media";
    editForm.hidden = false;
    editForm.elements.task.focus();
    return;
  }

  if (action?.classList.contains("cancel-subtask-edit-button")) {
    const editForm = action.closest(".subtask-edit-form");
    editForm.reset();
    editForm.hidden = true;
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
        priority: data.get("priority"),
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
    priority: data.get("priority"),
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
    const priority = getGroupPriority(group.tasks);
    const card = template.content.firstElementChild.cloneNode(true);
    card.dataset.groupId = group.id;
    card.classList.add(`priority-${priority}`);
    card.classList.toggle("is-done", isComplete);
    card.classList.toggle("is-partial", isPartiallyDone);

    card.querySelector("h3").textContent = mainTask.patient;
    card.querySelector(".created-time").textContent = formatTime(mainTask.createdAt);
    const diagnosisPill = card.querySelector(".diagnosis-pill");
    diagnosisPill.textContent = mainTask.diagnosis ? `HD: ${mainTask.diagnosis}` : "";
    diagnosisPill.hidden = !mainTask.diagnosis;
    card.querySelector(".priority-pill").textContent = isComplete ? "Completo" : priorityLabel(priority);
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
      priority: item.querySelector('[name="priority"]').value,
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
          .map((task) => [task.patient, task.diagnosis, task.description, task.type, task.priority, task.note].join(" "))
          .join(" ")
      );

      if (activeFilter === "done" && !isComplete) return false;
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

  const priorityDiff = priorityRank(getGroupPriority(a.tasks)) - priorityRank(getGroupPriority(b.tasks));
  if (priorityDiff !== 0) return priorityDiff;

  return new Date(b.tasks[0].createdAt) - new Date(a.tasks[0].createdAt);
}

function sortTasks(a, b) {
  if (a.done !== b.done) return a.done ? 1 : -1;
  const priorityOrder = { alta: 0, media: 1, baixa: 2 };
  const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
  if (priorityDiff !== 0) return priorityDiff;
  return new Date(b.createdAt) - new Date(a.createdAt);
}

function getGroupPriority(taskItems) {
  return [...taskItems].sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority))[0]?.priority || "baixa";
}

function priorityRank(priority) {
  const priorityOrder = { alta: 0, media: 1, baixa: 2 };
  return priorityOrder[priority] ?? 3;
}

function updateCounters() {
  const openTasks = tasks.filter((task) => !task.done);
  const completeGroups = groupTasks(tasks).filter((group) => group.tasks.every((task) => task.done));
  openCount.textContent = openTasks.length;
  lateCount.textContent = completeGroups.length;
  doneCount.textContent = tasks.filter((task) => task.done).length;
}

function updateListCopy() {
  if (!listTitle || !listContext) return;

  const copy = {
    open: ["Cards pendentes", "Cards permanecem até você limpar ou excluir."],
    all: ["Todas as pendências", "Abertas primeiro, depois as concluídas."],
    done: ["Cards completos", "Pacientes com todos os itens feitos."],
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
        <label>
          <span>Prioridade</span>
          <select name="priority">
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>
        </label>
      </div>
      <div class="inline-actions">
        <button class="primary-button" type="submit">Salvar solicitação</button>
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

function priorityLabel(priority) {
  const labels = {
    alta: "Alta",
    media: "Média",
    baixa: "Baixa",
  };
  return labels[priority] || priority;
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
  showSaveStatus(message);
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
render();
