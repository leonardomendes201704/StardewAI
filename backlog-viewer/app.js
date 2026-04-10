const state = {
  data: null,
  filters: {
    query: "",
    backlogStatus: "ALL",
    priority: "ALL",
    epic: "ALL",
    taskStatus: "ALL",
  },
};

const refs = {
  refreshButton: document.getElementById("refresh-button"),
  generatedAt: document.getElementById("generated-at"),
  backlogUpdatedAt: document.getElementById("backlog-updated-at"),
  tasksUpdatedAt: document.getElementById("tasks-updated-at"),
  taskSequence: document.getElementById("task-sequence"),
  statsGrid: document.getElementById("stats-grid"),
  backlogGroups: document.getElementById("backlog-groups"),
  backlogCounter: document.getElementById("backlog-counter"),
  tasksCounter: document.getElementById("tasks-counter"),
  tasksTableBody: document.getElementById("tasks-table-body"),
  queryInput: document.getElementById("query-input"),
  backlogStatusFilter: document.getElementById("backlog-status-filter"),
  priorityFilter: document.getElementById("priority-filter"),
  epicFilter: document.getElementById("epic-filter"),
  taskStatusFilter: document.getElementById("task-status-filter"),
  emptyStateTemplate: document.getElementById("empty-state-template"),
};

initialize();

function initialize() {
  refs.queryInput.addEventListener("input", (event) => {
    state.filters.query = event.target.value.trim();
    render();
  });

  refs.backlogStatusFilter.addEventListener("change", (event) => {
    state.filters.backlogStatus = event.target.value;
    render();
  });

  refs.priorityFilter.addEventListener("change", (event) => {
    state.filters.priority = event.target.value;
    render();
  });

  refs.epicFilter.addEventListener("change", (event) => {
    state.filters.epic = event.target.value;
    render();
  });

  refs.taskStatusFilter.addEventListener("change", (event) => {
    state.filters.taskStatus = event.target.value;
    render();
  });

  refs.refreshButton.addEventListener("click", () => loadData());

  loadData();
  window.setInterval(() => loadData({ silent: true }), 30000);
}

async function loadData(options = {}) {
  const { silent = false } = options;

  if (!silent) {
    refs.refreshButton.disabled = true;
    refs.refreshButton.textContent = "Atualizando...";
  }

  try {
    const response = await fetch(`/api/overview?ts=${Date.now()}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Falha ao carregar dados (${response.status})`);
    }

    const data = await response.json();
    state.data = data;

    syncFilters(data);
    render();
  } catch (error) {
    renderError(error);
  } finally {
    refs.refreshButton.disabled = false;
    refs.refreshButton.textContent = "Atualizar agora";
  }
}

function syncFilters(data) {
  setSelectOptions(refs.backlogStatusFilter, [
    { value: "ALL", label: "Todos" },
    ...Object.keys(data.summary.backlog.byStatus).map((status) => ({
      value: status,
      label: formatStatus(status),
    })),
  ]);

  setSelectOptions(refs.priorityFilter, [
    { value: "ALL", label: "Todas" },
    ...Object.keys(data.summary.backlog.byPriority).map((priority) => ({
      value: priority,
      label: priority,
    })),
  ]);

  setSelectOptions(refs.epicFilter, [
    { value: "ALL", label: "Todos" },
    ...data.epics.map((epic) => ({
      value: epic.id,
      label: `${epic.id} - ${epic.title}`,
    })),
  ]);

  setSelectOptions(refs.taskStatusFilter, [
    { value: "ALL", label: "Todos" },
    ...Object.keys(data.summary.tasks.byStatus).map((status) => ({
      value: status,
      label: formatStatus(status),
    })),
  ]);
}

function setSelectOptions(selectElement, options) {
  const previousValue = selectElement.value || "ALL";
  selectElement.innerHTML = options
    .map(
      (option) =>
        `<option value="${escapeAttribute(option.value)}">${escapeHtml(option.label)}</option>`
    )
    .join("");

  const nextValue = options.some((option) => option.value === previousValue)
    ? previousValue
    : "ALL";

  selectElement.value = nextValue;

  if (selectElement === refs.backlogStatusFilter) {
    state.filters.backlogStatus = nextValue;
  } else if (selectElement === refs.priorityFilter) {
    state.filters.priority = nextValue;
  } else if (selectElement === refs.epicFilter) {
    state.filters.epic = nextValue;
  } else if (selectElement === refs.taskStatusFilter) {
    state.filters.taskStatus = nextValue;
  }
}

function render() {
  if (!state.data) {
    return;
  }

  const filteredBacklog = state.data.backlog.filter(matchesBacklogFilters);
  const visibleBacklogIds = new Set(filteredBacklog.map((item) => item.id));
  const filteredTasks = state.data.tasks.filter((task) =>
    matchesTaskFilters(task, visibleBacklogIds)
  );

  refs.generatedAt.textContent = formatDateTime(state.data.generatedAt);
  refs.backlogUpdatedAt.textContent =
    state.data.documents.backlogUpdatedAt || "-";
  refs.tasksUpdatedAt.textContent = state.data.documents.tasksUpdatedAt || "-";
  refs.taskSequence.textContent = state.data.documents.taskSequence || "-";

  renderStats(filteredBacklog, filteredTasks);
  renderBacklog(filteredBacklog);
  renderTasks(filteredTasks);
}

function renderStats(filteredBacklog, filteredTasks) {
  const backlogDone = filteredBacklog.filter((item) => item.status === "DONE").length;
  const backlogInProgress = filteredBacklog.filter(
    (item) => item.status === "IN_PROGRESS"
  ).length;
  const backlogTodo = filteredBacklog.filter((item) => item.status === "TODO").length;
  const taskBlocked = filteredTasks.filter((task) => task.status === "BLOCKED").length;
  const taskDone = filteredTasks.filter((task) => task.status === "DONE").length;

  const cards = [
    {
      label: "Itens de backlog visiveis",
      value: filteredBacklog.length,
      footnote: `${state.data.summary.backlog.totalItems} no total`,
    },
    {
      label: "Backlog concluido",
      value: backlogDone,
      footnote: `${percentage(backlogDone, filteredBacklog.length)} da selecao`,
    },
    {
      label: "Backlog em progresso",
      value: backlogInProgress,
      footnote: "Itens com entrega parcial",
    },
    {
      label: "Backlog pendente",
      value: backlogTodo,
      footnote: "TODO por default quando nao houver status explicito",
    },
    {
      label: "Tasks visiveis",
      value: filteredTasks.length,
      footnote: `${taskDone} concluidas nesta selecao`,
    },
    {
      label: "Tasks bloqueadas",
      value: taskBlocked,
      footnote: taskBlocked ? "Exigem atencao do plano" : "Sem bloqueios na selecao",
    },
  ];

  refs.statsGrid.innerHTML = cards
    .map(
      (card) => `
        <article class="stat-card">
          <p class="stat-label">${escapeHtml(card.label)}</p>
          <p class="stat-value">${escapeHtml(String(card.value))}</p>
          <p class="stat-footnote">${escapeHtml(card.footnote)}</p>
        </article>
      `
    )
    .join("");
}

function renderBacklog(items) {
  refs.backlogCounter.textContent = `${items.length} item(ns)`;

  if (!items.length) {
    refs.backlogGroups.innerHTML = "";
    refs.backlogGroups.appendChild(cloneEmptyState());
    return;
  }

  const groups = groupBy(items, (item) => item.epic.id);

  refs.backlogGroups.innerHTML = Object.entries(groups)
    .map(([epicId, groupItems]) => {
      const epic = groupItems[0].epic;
      return `
        <section class="epic-group">
          <div class="epic-header">
            <h3 class="epic-title">${escapeHtml(epicId)} - ${escapeHtml(epic.title)}</h3>
            <span class="epic-meta">${escapeHtml(String(groupItems.length))} item(ns)</span>
          </div>
          <div class="backlog-list">
            ${groupItems.map(renderBacklogCard).join("")}
          </div>
        </section>
      `;
    })
    .join("");
}

function renderBacklogCard(item) {
  const description = item.description
    ? `<p>${escapeHtml(item.description)}</p>`
    : '<p class="muted">Sem descricao registrada.</p>';

  const details = item.criteria.length || item.notes
    ? `
      <details>
        <summary>Ver criterios e observacoes</summary>
        ${
          item.criteria.length
            ? `<ul class="criteria-list">${item.criteria
                .map((criterion) => `<li class="criteria-item">${escapeHtml(criterion)}</li>`)
                .join("")}</ul>`
            : ""
        }
        ${item.notes ? `<p class="muted">${escapeHtml(item.notes)}</p>` : ""}
      </details>
    `
    : "";

  const taskList = item.tasks.length
    ? `
      <ul class="task-list">
        ${item.tasks.map(renderInlineTask).join("")}
      </ul>
    `
    : '<div class="empty-state"><p class="empty-title">Sem tasks relacionadas</p><p class="empty-copy">Este item ainda nao tem task vinculada no registro.</p></div>';

  return `
    <article class="backlog-card">
      <div class="card-topline">
        <div class="card-heading">
          <span class="card-id">${escapeHtml(item.id)}</span>
          <h3>${escapeHtml(item.title)}</h3>
        </div>
        <div class="card-summary">
          <span class="pill priority-${item.priority.toLowerCase()}">${escapeHtml(item.priority)}</span>
          <span class="pill status-${item.status.toLowerCase()}">${escapeHtml(formatStatus(item.status))}</span>
        </div>
      </div>

      <div class="card-summary">
        <span>Atualizado em ${escapeHtml(item.updatedAt || "-")}</span>
        <span>${escapeHtml(renderTaskSummary(item.taskSummary))}</span>
      </div>

      <div class="card-body">
        ${description}
        ${details}
        ${taskList}
      </div>
    </article>
  `;
}

function renderInlineTask(task) {
  const link = task.documentUrl
    ? `<a class="task-link" href="${escapeAttribute(task.documentUrl)}" target="_blank" rel="noreferrer">${escapeHtml(task.id)}</a>`
    : escapeHtml(task.id);

  return `
    <li class="task-item">
      <div class="task-row">
        ${link}
        <span class="pill status-${task.status.toLowerCase()}">${escapeHtml(formatStatus(task.status))}</span>
      </div>
      <p class="task-title">${escapeHtml(task.title)}</p>
      <div class="task-meta">
        <span>Inicio ${escapeHtml(task.start || "-")}</span>
        <span>Fim ${escapeHtml(task.end || "-")}</span>
      </div>
    </li>
  `;
}

function renderTasks(tasks) {
  refs.tasksCounter.textContent = `${tasks.length} task(s)`;

  if (!tasks.length) {
    refs.tasksTableBody.innerHTML = "";
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.appendChild(cloneEmptyState());
    row.appendChild(cell);
    refs.tasksTableBody.appendChild(row);
    return;
  }

  refs.tasksTableBody.innerHTML = tasks
    .map(
      (task) => `
        <tr>
          <td>
            <div class="task-cell-title">
              <strong>
                ${
                  task.documentUrl
                    ? `<a class="task-link" href="${escapeAttribute(
                        task.documentUrl
                      )}" target="_blank" rel="noreferrer">${escapeHtml(task.id)}</a>`
                    : escapeHtml(task.id)
                }
              </strong>
              <span>${escapeHtml(task.title)}</span>
            </div>
          </td>
          <td>
            <span class="pill status-${task.status.toLowerCase()}">${escapeHtml(
              formatStatus(task.status)
            )}</span>
          </td>
          <td>${escapeHtml(formatDate(task.start))}</td>
          <td>${escapeHtml(formatDate(task.end))}</td>
          <td>
            ${
              task.backlogIds.length
                ? `<div class="backlog-chip-list">${task.backlogIds
                    .map((id) => `<span class="backlog-chip">${escapeHtml(id)}</span>`)
                    .join("")}</div>`
                : '<span class="muted">Sem backlog</span>'
            }
          </td>
        </tr>
      `
    )
    .join("");
}

function matchesBacklogFilters(item) {
  const query = normalize(state.filters.query);
  const matchesQuery =
    !query ||
    [
      item.id,
      item.title,
      item.description,
      item.notes,
      item.epic.id,
      item.epic.title,
      ...item.tasks.map((task) => `${task.id} ${task.title}`),
    ]
      .join(" ")
      .toLowerCase()
      .includes(query);

  const matchesBacklogStatus =
    state.filters.backlogStatus === "ALL" ||
    item.status === state.filters.backlogStatus;

  const matchesPriority =
    state.filters.priority === "ALL" || item.priority === state.filters.priority;

  const matchesEpic =
    state.filters.epic === "ALL" || item.epic.id === state.filters.epic;

  const matchesTaskStatus =
    state.filters.taskStatus === "ALL" ||
    item.tasks.some((task) => task.status === state.filters.taskStatus);

  return (
    matchesQuery &&
    matchesBacklogStatus &&
    matchesPriority &&
    matchesEpic &&
    matchesTaskStatus
  );
}

function matchesTaskFilters(task, visibleBacklogIds) {
  const query = normalize(state.filters.query);
  const haystack = [task.id, task.title, task.backlogIds.join(" "), task.backlogTitles.join(" ")]
    .join(" ")
    .toLowerCase();

  const matchesQuery = !query || haystack.includes(query);
  const matchesTaskStatus =
    state.filters.taskStatus === "ALL" || task.status === state.filters.taskStatus;

  const matchesBacklogVisibility =
    !task.backlogIds.length ||
    task.backlogIds.some((id) => visibleBacklogIds.has(id));

  return matchesQuery && matchesTaskStatus && matchesBacklogVisibility;
}

function renderTaskSummary(taskSummary) {
  if (!taskSummary.total) {
    return "0 tasks relacionadas";
  }

  return `${taskSummary.done}/${taskSummary.total} tasks concluida(s)`;
}

function renderError(error) {
  refs.statsGrid.innerHTML = `
    <article class="stat-card">
      <p class="stat-label">Falha</p>
      <p class="stat-value">Erro</p>
      <p class="stat-footnote">${escapeHtml(error.message || "Nao foi possivel carregar os dados.")}</p>
    </article>
  `;
  refs.backlogGroups.innerHTML = "";
  refs.tasksTableBody.innerHTML = "";
}

function cloneEmptyState() {
  return refs.emptyStateTemplate.content.firstElementChild.cloneNode(true);
}

function groupBy(items, getKey) {
  return items.reduce((accumulator, item) => {
    const key = getKey(item);
    accumulator[key] = accumulator[key] || [];
    accumulator[key].push(item);
    return accumulator;
  }, {});
}

function percentage(numerator, denominator) {
  if (!denominator) {
    return "0%";
  }

  return `${Math.round((numerator / denominator) * 100)}%`;
}

function formatStatus(status) {
  const labels = {
    TODO: "TODO",
    IN_PROGRESS: "IN PROGRESS",
    DONE: "DONE",
    BLOCKED: "BLOCKED",
  };

  return labels[status] || status;
}

function formatDate(value) {
  if (!value || value === "-") {
    return "-";
  }

  const [year, month, day] = value.split("-");
  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);
}

function normalize(value) {
  return (value || "").toLowerCase();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
