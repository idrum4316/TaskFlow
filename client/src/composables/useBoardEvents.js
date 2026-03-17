import { watch, onUnmounted, ref } from 'vue';
import { useBoardsStore } from '@/stores/boards';
import { useTasksStore } from '@/stores/tasks';

export function useBoardEvents(boardId) {
  let eventSource = null;
  const connected = ref(false);
  let wasConnected = false;

  function connect(id) {
    disconnect();
    if (!id) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const url = `/api/events?board_id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`;
    eventSource = new EventSource(url);

    eventSource.addEventListener('connected', () => {
      const reconnected = wasConnected;
      connected.value = true;
      wasConnected = true;

      // Refresh data on reconnect to catch events missed during downtime
      if (reconnected) {
        const tasksStore = useTasksStore();
        const boardsStore = useBoardsStore();
        tasksStore.fetchTasks(id);
        boardsStore.fetchBoards();
      }
    });

    eventSource.addEventListener('change', (e) => {
      try {
        const data = JSON.parse(e.data);
        handleChange(data);
      } catch {
        // Ignore malformed events
      }
    });

    eventSource.onerror = () => {
      connected.value = false;
      // EventSource auto-reconnects on error
    };
  }

  function disconnect() {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
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
