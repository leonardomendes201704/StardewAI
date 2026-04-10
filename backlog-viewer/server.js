const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { URL } = require("node:url");

const ROOT_DIR = path.resolve(__dirname, "..");
const VIEW_DIR = __dirname;
const PORT = Number(process.env.PORT || 3210);

const STATIC_FILES = {
  "/": {
    filePath: path.join(VIEW_DIR, "index.html"),
    contentType: "text/html; charset=utf-8",
  },
  "/app.js": {
    filePath: path.join(VIEW_DIR, "app.js"),
    contentType: "application/javascript; charset=utf-8",
  },
  "/styles.css": {
    filePath: path.join(VIEW_DIR, "styles.css"),
    contentType: "text/css; charset=utf-8",
  },
};

function readUtf8(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function parseInlineList(value) {
  const matches = [...value.matchAll(/`([^`]+)`/g)].map((match) => match[1].trim());
  if (matches.length) {
    return matches;
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function joinParagraphs(parts) {
  return parts
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
}

function taskNumericId(id) {
  return Number((id.match(/\d+/) || ["0"])[0]);
}

function backlogNumericId(id) {
  return Number((id.match(/\d+/) || ["0"])[0]);
}

function parseBacklog(markdown) {
  const lines = markdown.split(/\r?\n/);
  const items = [];
  let currentEpic = null;
  let currentItem = null;
  let section = null;

  function flushItem() {
    if (!currentItem) {
      return;
    }

    currentItem.description = joinParagraphs(currentItem.descriptionParts);
    currentItem.notes = joinParagraphs(currentItem.noteParts);
    delete currentItem.descriptionParts;
    delete currentItem.noteParts;
    items.push(currentItem);
    currentItem = null;
    section = null;
  }

  for (const line of lines) {
    const epicMatch = line.match(/^###\s+(EP\d+)\s+-\s+(.+)$/);
    if (epicMatch) {
      flushItem();
      currentEpic = { id: epicMatch[1], title: epicMatch[2].trim() };
      continue;
    }

    const itemMatch = line.match(/^####\s+(BKL-\d+)\s+\[(P\d)\]\s+(.+)$/);
    if (itemMatch) {
      flushItem();
      currentItem = {
        id: itemMatch[1],
        priority: itemMatch[2],
        title: itemMatch[3].trim(),
        status: "TODO",
        updatedAt: null,
        evidences: [],
        criteria: [],
        descriptionParts: [],
        noteParts: [],
        epic: currentEpic || { id: "SEM_EPIC", title: "Sem epic" },
      };
      section = null;
      continue;
    }

    if (!currentItem) {
      continue;
    }

    const statusMatch = line.match(/^Status:\s+(.+)$/);
    if (statusMatch) {
      currentItem.status = statusMatch[1].trim();
      section = null;
      continue;
    }

    const updatedAtMatch = line.match(/^Atualizado em:\s+(.+)$/);
    if (updatedAtMatch) {
      currentItem.updatedAt = updatedAtMatch[1].trim();
      section = null;
      continue;
    }

    const evidencesMatch = line.match(/^Evidencias:\s*(.+)$/);
    if (evidencesMatch) {
      currentItem.evidences = parseInlineList(evidencesMatch[1]);
      section = null;
      continue;
    }

    if (line === "Descricao:") {
      section = "description";
      continue;
    }

    if (line === "Criterios de aceite:") {
      section = "criteria";
      continue;
    }

    if (line === "Observacao:") {
      section = "notes";
      continue;
    }

    if (!line.trim()) {
      continue;
    }

    if (section === "description") {
      currentItem.descriptionParts.push(line);
    } else if (section === "notes") {
      currentItem.noteParts.push(line);
    } else if (section === "criteria" && line.startsWith("- ")) {
      currentItem.criteria.push(line.slice(2).trim());
    }
  }

  flushItem();

  return items.sort((left, right) => backlogNumericId(left.id) - backlogNumericId(right.id));
}

function extractMarkdownLink(markdownCell) {
  const match = markdownCell.match(/\[([^\]]+)\]\(([^)]+)\)/);
  if (!match) {
    return null;
  }

  return {
    label: match[1].trim(),
    href: match[2].trim(),
  };
}

function parseTasks(markdown) {
  const rows = markdown.split(/\r?\n/).filter((line) => line.startsWith("| TASK-"));
  return rows
    .map((row) => {
      const cells = row
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim());

      if (cells.length < 7) {
        return null;
      }

      const [id, title, status, start, end, backlogRelated, documentCell] = cells;
      const documentLink = extractMarkdownLink(documentCell);
      const backlogIds = backlogRelated.match(/BKL-\d+/g) || [];

      return {
        id,
        title,
        status,
        start,
        end,
        backlogLabel: backlogRelated,
        backlogIds,
        documentPath: documentLink ? documentLink.href.replace(/\//g, path.sep) : null,
      };
    })
    .filter(Boolean)
    .sort((left, right) => taskNumericId(right.id) - taskNumericId(left.id));
}

function countBy(items, pickKey) {
  return items.reduce((accumulator, item) => {
    const key = pickKey(item);
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});
}

function summarizeTaskStatuses(tasks) {
  return {
    total: tasks.length,
    done: tasks.filter((task) => task.status === "DONE").length,
    inProgress: tasks.filter((task) => task.status === "IN_PROGRESS").length,
    blocked: tasks.filter((task) => task.status === "BLOCKED").length,
    todo: tasks.filter((task) => task.status === "TODO").length,
  };
}

function createPayload() {
  const backlogMarkdown = readUtf8(path.join(ROOT_DIR, "BACKLOG.md"));
  const tasksMarkdown = readUtf8(path.join(ROOT_DIR, "TASKS.md"));

  const backlogUpdatedAt =
    backlogMarkdown.match(/^Ultima atualizacao:\s+(.+)$/m)?.[1].trim() || null;
  const tasksUpdatedAt =
    tasksMarkdown.match(/^Ultima atualizacao:\s+(.+)$/m)?.[1].trim() || null;
  const taskSequence =
    tasksMarkdown.match(/^Sequencia atual de task:\s+(.+)$/m)?.[1].trim() || null;

  const backlog = parseBacklog(backlogMarkdown);
  const tasks = parseTasks(tasksMarkdown);
  const backlogMap = new Map(backlog.map((item) => [item.id, item]));

  for (const task of tasks) {
    task.backlogTitles = task.backlogIds
      .map((id) => backlogMap.get(id))
      .filter(Boolean)
      .map((item) => item.title);
    task.documentUrl = task.documentPath
      ? `/repo/${task.documentPath.split(path.sep).join("/")}`
      : null;
  }

  const backlogWithTasks = backlog.map((item) => {
    const relatedTasks = tasks
      .filter((task) => task.backlogIds.includes(item.id))
      .sort((left, right) => taskNumericId(right.id) - taskNumericId(left.id));

    return {
      ...item,
      tasks: relatedTasks,
      taskSummary: summarizeTaskStatuses(relatedTasks),
    };
  });

  const epics = Object.values(
    backlogWithTasks.reduce((accumulator, item) => {
      if (!accumulator[item.epic.id]) {
        accumulator[item.epic.id] = {
          id: item.epic.id,
          title: item.epic.title,
          itemCount: 0,
        };
      }

      accumulator[item.epic.id].itemCount += 1;
      return accumulator;
    }, {})
  ).sort((left, right) => left.id.localeCompare(right.id));

  return {
    generatedAt: new Date().toISOString(),
    documents: {
      backlogUpdatedAt,
      tasksUpdatedAt,
      taskSequence,
    },
    summary: {
      backlog: {
        totalItems: backlogWithTasks.length,
        byStatus: countBy(backlogWithTasks, (item) => item.status),
        byPriority: countBy(backlogWithTasks, (item) => item.priority),
      },
      tasks: {
        totalItems: tasks.length,
        byStatus: countBy(tasks, (task) => task.status),
      },
    },
    epics,
    backlog: backlogWithTasks,
    tasks,
  };
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload, null, 2));
}

function sendText(response, statusCode, text, contentType) {
  response.writeHead(statusCode, {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
  });
  response.end(text);
}

function safeResolveRepoPath(urlPath) {
  const relativePath = decodeURIComponent(urlPath.replace(/^\/repo\//, ""));
  const absolutePath = path.resolve(ROOT_DIR, relativePath);
  const relativeToRoot = path.relative(ROOT_DIR, absolutePath);

  if (
    !relativeToRoot ||
    relativeToRoot.startsWith("..") ||
    path.isAbsolute(relativeToRoot)
  ) {
    return null;
  }

  return absolutePath;
}

function handleRequest(request, response) {
  const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);

  if (requestUrl.pathname === "/api/overview") {
    try {
      sendJson(response, 200, createPayload());
    } catch (error) {
      sendJson(response, 500, {
        error: "Nao foi possivel ler BACKLOG.md e TASKS.md.",
        details: error.message,
      });
    }
    return;
  }

  if (requestUrl.pathname.startsWith("/repo/")) {
    const absolutePath = safeResolveRepoPath(requestUrl.pathname);

    if (!absolutePath || !fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
      sendText(response, 404, "Arquivo nao encontrado.", "text/plain; charset=utf-8");
      return;
    }

    const extension = path.extname(absolutePath).toLowerCase();
    const contentType =
      extension === ".md" ? "text/markdown; charset=utf-8" : "text/plain; charset=utf-8";
    sendText(response, 200, readUtf8(absolutePath), contentType);
    return;
  }

  const staticEntry = STATIC_FILES[requestUrl.pathname];
  if (!staticEntry) {
    sendText(response, 404, "Rota nao encontrada.", "text/plain; charset=utf-8");
    return;
  }

  sendText(response, 200, readUtf8(staticEntry.filePath), staticEntry.contentType);
}

function startServer() {
  const server = http.createServer(handleRequest);
  server.listen(PORT, () => {
    console.log(`Backlog viewer ativo em http://localhost:${PORT}`);
  });
  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = {
  createPayload,
  parseBacklog,
  parseTasks,
  startServer,
};
