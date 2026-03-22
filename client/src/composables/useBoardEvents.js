import { watch, onUnmounted, ref } from 'vue';
import { useBoardsStore } from '@/stores/boards';
import { useTasksStore } from '@/stores/tasks';

const RECONNECT_BASE = 1000;
const RECONNECT_MAX = 30000;

export function useBoardEvents(boardId) {
  let ws = null;
  let reconnectTimer = null;
  let reconnectDelay = RECONNECT_BASE;
  let currentBoardId = null;
  const connected = ref(false);
  let wasConnected = false;

  function getWsUrl(id) {
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${location.host}/ws`;
  }

  function scheduleReconnect() {
    if (reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      if (currentBoardId) connect(currentBoardId);
    }, reconnectDelay);
    reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX);
  }

  function connect(id) {
    disconnect();
    currentBoardId = id;
    if (!id) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    ws = new WebSocket(getWsUrl(id));

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'subscribe', token, boardId: id }));
    };

    ws.onmessage = (e) => {
      let msg;
      try {
        msg = JSON.parse(e.data);
      } catch {
        return;
      }

      if (msg.event === 'connected') {
        const reconnected = wasConnected;
        connected.value = true;
        wasConnected = true;
        reconnectDelay = RECONNECT_BASE;

        if (reconnected) {
          const tasksStore = useTasksStore();
          const boardsStore = useBoardsStore();
          tasksStore.fetchTasks(id);
          boardsStore.fetchBoards();
        }
        return;
      }

      if (msg.event === 'change') {
        handleChange(msg);
      }
    };

    ws.onclose = (e) => {
      connected.value = false;
      ws = null;
      // Don't reconnect on auth/permission errors (custom close codes)
      if (e.code >= 4400 && e.code < 4500) return;
      scheduleReconnect();
    };

    ws.onerror = () => {
      // onclose will fire after this — reconnect handled there
    };
  }

  function disconnect() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (ws) {
      ws.close();
      ws = null;
      connected.value = false;
    }
  }

  function handleChange(data) {
    const tasksStore = useTasksStore();
    const boardsStore = useBoardsStore();

    if (data.type === 'deleted') {
      tasksStore.tasks = tasksStore.tasks.filter((t) => t._id !== data.id);
      return;
    }

    if (data.type === 'task' && data.action === 'upsert') {
      const idx = tasksStore.tasks.findIndex((t) => t._id === data.id);
      if (idx !== -1) {
        const existing = tasksStore.tasks[idx];
        tasksStore.tasks[idx] = {
          ...data.doc,
          comment_count: existing.comment_count ?? 0,
          attachment_count: existing.attachment_count ?? 0,
        };
      } else {
        tasksStore.tasks.push({
          ...data.doc,
          comment_count: 0,
          attachment_count: 0,
        });
      }
      tasksStore.sortByPosition();
    }

    if (data.type === 'board' && data.action === 'upsert') {
      const idx = boardsStore.boards.findIndex((b) => b._id === data.id);
      if (idx !== -1) {
        const existing = boardsStore.boards[idx];
        boardsStore.boards[idx] = {
          ...data.doc,
          _role: existing._role,
          _access: existing._access,
        };
      }
    }
  }

  watch(boardId, (newId) => {
    connect(newId);
  }, { immediate: true });

  onUnmounted(() => {
    disconnect();
  });

  return { connected };
}
