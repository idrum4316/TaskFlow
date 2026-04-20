<template>
  <!-- Backdrop -->
  <div
    class="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6"
    role="dialog"
    aria-modal="true"
    :aria-label="task ? 'Edit task' : 'New task'"
  >
    <!-- Dimmed backdrop -->
    <div
      class="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm animate-fade-in"
      @click="$emit('close')"
      aria-hidden="true"
    />

    <!-- Modal panel — wider for existing tasks, compact for new -->
    <div :class="[
      'relative bg-white dark:bg-zinc-900 shadow-modal rounded-xl flex flex-col animate-scale-in',
      task ? 'w-full max-w-4xl max-h-[90vh]' : 'w-full max-w-md max-h-[90vh]',
    ]">
      <!-- Modal header -->
      <div class="flex items-start justify-between px-5 sm:px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 flex-shrink-0">
        <div class="flex items-start gap-3 min-w-0 flex-1">
          <div class="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 mt-0.5"
            :class="task ? 'bg-brand-50 dark:bg-brand-950/40' : 'bg-emerald-50 dark:bg-emerald-950/40'"
          >
            <svg v-if="task" class="w-4 h-4 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            <svg v-else class="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <div class="min-w-0 flex-1">
            <h2 class="text-base font-semibold text-zinc-900 dark:text-zinc-100">{{ task ? (readOnly ? 'View Task' : 'Edit Task') : 'New Task' }}</h2>
            <p v-if="readOnly" class="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">Read-only access</p>
          </div>
        </div>
        <button
          @click="$emit('close')"
          class="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
          aria-label="Close modal"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Existing task: two-column top + full-width attachments + comments -->
      <div v-if="task" class="flex-1 overflow-y-auto min-h-0">
        <form @submit.prevent="handleSubmit">
          <!-- Top section: details left, metadata right -->
          <div class="flex flex-col md:flex-row">
            <!-- Left: title, description, links -->
            <div class="flex-1 min-w-0 px-5 sm:px-6 py-5 space-y-4">
              <!-- Title (wrapping) -->
              <div>
                <textarea
                  id="task-title"
                  v-model="form.title"
                  required
                  :disabled="readOnly"
                  rows="1"
                  class="w-full text-lg font-semibold bg-transparent border-none outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 disabled:cursor-default p-0 focus:ring-0 resize-none overflow-hidden"
                  placeholder="Task title"
                  @input="autoResizeTitle"
                  ref="titleInput"
                />
              </div>

              <!-- Description -->
              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">Description</label>
                <textarea
                  v-model="form.description"
                  rows="4"
                  :disabled="readOnly"
                  class="input resize-none text-sm disabled:bg-zinc-50 dark:disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-default"
                  placeholder="Add details, notes, or context…"
                />
              </div>

              <!-- Linked tasks section -->
              <TaskLinks :task-id="task._id" :board-id="boardId" :read-only="readOnly" @open-task="(id) => $emit('open-task', id)" />
            </div>

            <!-- Right: metadata sidebar -->
            <div class="w-full md:w-64 flex-shrink-0 md:border-l border-t md:border-t-0 border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/20 px-5 sm:px-5 py-5 space-y-4">
              <!-- Status -->
              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">Status</label>
                <div class="relative">
                  <select
                    v-model="form.status"
                    :disabled="readOnly"
                    class="appearance-none w-full text-xs font-medium pl-6 pr-6 py-1.5 rounded-full border cursor-pointer disabled:cursor-default focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                    :style="statusPillStyle"
                  >
                    <option v-for="s in statusOptions" :key="s.id" :value="s.id">{{ s.label }}</option>
                  </select>
                  <span class="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full pointer-events-none" :style="{ backgroundColor: currentStatusColor }" />
                  <svg class="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" :style="{ color: currentStatusColor }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                </div>
              </div>

              <!-- Priority -->
              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">Priority</label>
                <div class="relative">
                  <select
                    v-model="form.priority"
                    :disabled="readOnly"
                    class="appearance-none w-full text-xs font-medium pl-6 pr-6 py-1.5 rounded-full border cursor-pointer disabled:cursor-default focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                    :class="priorityPillClass"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                  <span :class="['absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full pointer-events-none', priorityDotClass]" />
                  <svg class="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none text-current opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                </div>
              </div>

              <!-- Due date -->
              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">Due Date</label>
                <label
                  @click="openDatePicker"
                  :class="[
                  'relative flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border cursor-pointer transition-colors',
                  form.due_date
                    ? dueDatePast
                      ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                      : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                    : 'bg-zinc-50 dark:bg-zinc-800/50 border-dashed border-zinc-300 dark:border-zinc-600 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-400',
                ]">
                  <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                  <span v-if="form.due_date">{{ formatDueDate(form.due_date) }}</span>
                  <span v-else>Add due date</span>
                  <input
                    ref="dateInput"
                    v-model="form.due_date"
                    type="date"
                    :disabled="readOnly"
                    class="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-default"
                    :aria-label="'Due date'"
                  />
                </label>
              </div>

              <!-- Recurrence -->
              <div v-if="form.due_date">
                <label class="block text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">Repeat</label>
                <div class="space-y-2">
                  <div class="relative">
                    <select
                      v-model="recurrenceType"
                      :disabled="readOnly"
                      class="appearance-none w-full text-xs font-medium px-3 py-1.5 rounded-full border bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 cursor-pointer disabled:cursor-default focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                    >
                      <option v-for="t in RECURRENCE_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
                    </select>
                    <svg class="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                  </div>

                  <!-- Interval (for all types except null) -->
                  <div v-if="recurrenceType" class="flex items-center gap-2">
                    <label class="text-[11px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap">Every</label>
                    <input
                      v-model.number="recurrenceInterval"
                      type="number"
                      min="1"
                      :disabled="readOnly"
                      class="w-14 text-xs font-medium px-2 py-1 rounded-md border bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                    />
                    <span class="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {{ recurrenceType === 'custom' ? '' : recurrenceType === 'daily' ? 'day(s)' : recurrenceType === 'weekly' ? 'week(s)' : 'month(s)' }}
                    </span>
                    <!-- Unit selector for custom -->
                    <select
                      v-if="recurrenceType === 'custom'"
                      v-model="recurrenceUnit"
                      :disabled="readOnly"
                      class="text-xs font-medium px-2 py-1 rounded-md border bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                    >
                      <option v-for="u in UNIT_OPTIONS" :key="u.value" :value="u.value">{{ u.label }}</option>
                    </select>
                  </div>

                  <!-- Day of week checkboxes for weekly -->
                  <div v-if="recurrenceType === 'weekly'" class="flex flex-wrap gap-1">
                    <button
                      v-for="(label, idx) in DAY_LABELS"
                      :key="idx"
                      type="button"
                      :disabled="readOnly"
                      @click="toggleDayOfWeek(idx)"
                      :class="[
                        'text-[10px] font-semibold w-7 h-7 rounded-full transition-colors',
                        recurrenceDaysOfWeek.includes(idx)
                          ? 'bg-brand-600 text-white'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700',
                      ]"
                    >
                      {{ label.charAt(0) }}
                    </button>
                  </div>

                  <!-- Day of month for monthly -->
                  <div v-if="recurrenceType === 'monthly'" class="flex items-center gap-2">
                    <label class="text-[11px] text-zinc-500 dark:text-zinc-400">on day</label>
                    <input
                      v-model.number="recurrenceDayOfMonth"
                      type="number"
                      min="1"
                      max="31"
                      :disabled="readOnly"
                      class="w-14 text-xs font-medium px-2 py-1 rounded-md border bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                    />
                  </div>

                  <!-- End date -->
                  <div v-if="recurrenceType" class="flex items-center gap-2">
                    <label class="text-[11px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap">Until</label>
                    <input
                      v-model="recurrenceEndDate"
                      type="date"
                      :disabled="readOnly"
                      class="flex-1 text-xs font-medium px-2 py-1 rounded-md border bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                      placeholder="No end date"
                    />
                  </div>
                </div>

                <!-- Completion history (for existing recurring tasks) -->
                <div v-if="task && (task.recurrence || task.completion_count)" class="mt-3">
                  <!-- Complete occurrence button -->
                  <button
                    v-if="task.recurrence && form.due_date && !readOnly"
                    type="button"
                    @click="completeOccurrence"
                    :disabled="completingOccurrence"
                    class="flex items-center gap-1.5 w-full text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 rounded-lg px-3 py-2 transition-colors disabled:opacity-50 mb-2"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {{ completingOccurrence ? 'Completing…' : 'Complete this occurrence' }}
                  </button>

                  <button
                    type="button"
                    @click="toggleCompletionHistory"
                    class="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                  >
                    <svg :class="['w-3 h-3 transition-transform', showCompletionHistory ? 'rotate-90' : '']" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                    Completion history
                    <span v-if="task.completion_count" class="text-[10px] text-zinc-400 dark:text-zinc-500">({{ task.completion_count }})</span>
                  </button>
                  <div v-if="showCompletionHistory" class="mt-2 space-y-1 max-h-40 overflow-y-auto">
                    <p v-if="completionsLoading && !completions.length" class="text-[11px] text-zinc-400">Loading…</p>
                    <div
                      v-for="c in completions"
                      :key="c._id"
                      class="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400"
                    >
                      <svg class="w-3 h-3 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      <span>{{ formatCompletionDate(c.completed_at) }}</span>
                      <span class="text-zinc-400 dark:text-zinc-600">·</span>
                      <span>due {{ formatDueDate(c.due_date) }}</span>
                    </div>
                    <p v-if="!completionsLoading && !completions.length" class="text-[11px] text-zinc-400 italic">No completions yet</p>
                    <button
                      v-if="completionsHasMore"
                      type="button"
                      @click="completionsStore.loadMore(task._id)"
                      :disabled="completionsLoading"
                      class="text-[11px] font-medium text-brand-600 dark:text-brand-400 hover:underline"
                    >
                      Load more
                    </button>
                  </div>
                </div>
              </div>

              <!-- Labels -->
              <div v-if="labels.length">
                <label class="block text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">Labels</label>
                <div class="flex flex-wrap gap-1.5">
                  <button
                    v-for="l in labels"
                    :key="l.id"
                    type="button"
                    :disabled="readOnly"
                    @click="toggleLabel(l.id)"
                    :class="[
                      'inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors',
                      form.labels.includes(l.id)
                        ? 'border-transparent text-white shadow-sm'
                        : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600',
                    ]"
                    :style="form.labels.includes(l.id) ? { backgroundColor: l.color } : {}"
                  >
                    <span class="w-2 h-2 rounded-full flex-shrink-0" :style="{ backgroundColor: form.labels.includes(l.id) ? 'rgba(255,255,255,0.5)' : l.color }" />
                    {{ l.name }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Full-width: Checklist -->
          <div class="border-t border-zinc-200 dark:border-zinc-700 px-5 sm:px-6 py-5">
            <div class="flex items-center gap-2 mb-3">
              <svg class="w-4 h-4 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 class="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Checklist</h3>
              <span v-if="form.checklist.length" class="min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-semibold rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400">{{ checklistDoneCount }}/{{ form.checklist.length }}</span>
            </div>
            <TaskChecklist v-model="form.checklist" :read-only="readOnly" />
          </div>

          <!-- Full-width: Attachments -->
          <div class="border-t border-zinc-200 dark:border-zinc-700 px-5 sm:px-6 py-5">
            <div class="flex items-center gap-2 mb-3">
              <svg class="w-4 h-4 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
              </svg>
              <h3 class="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Files</h3>
              <span v-if="attachments.length" class="min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-semibold rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400">{{ attachments.length }}</span>
            </div>
            <TaskAttachments :task-id="task._id" :read-only="readOnly" />
          </div>

          <!-- Full-width: Comments -->
          <div class="border-t border-zinc-200 dark:border-zinc-700 px-5 sm:px-6 py-5">
            <div class="flex items-center gap-2 mb-3">
              <svg class="w-4 h-4 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
              <h3 class="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Comments</h3>
              <span v-if="comments.length" class="min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-semibold rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400">{{ comments.length }}</span>
            </div>
            <TaskComments :task-id="task._id" :board-id="boardId" />
          </div>
        </form>
      </div>

      <!-- New task: single-column form -->
      <form v-else @submit.prevent="handleSubmit" class="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        <!-- Title -->
        <div>
          <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5" for="new-task-title">
            Title <span class="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="new-task-title"
            v-model="form.title"
            type="text"
            required
            autofocus
            class="input"
            placeholder="What needs to be done?"
          />
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5" for="new-task-desc">Description</label>
          <textarea
            id="new-task-desc"
            v-model="form.description"
            rows="3"
            class="input resize-none"
            placeholder="Add more context or details…"
          />
        </div>

        <!-- Status + Priority row -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5" for="new-task-status">Status</label>
            <div class="relative">
              <select id="new-task-status" v-model="form.status" class="input pr-8 appearance-none">
                <option v-for="s in statusOptions" :key="s.id" :value="s.id">{{ s.label }}</option>
              </select>
              <svg class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5" for="new-task-priority">Priority</label>
            <div class="relative">
              <select id="new-task-priority" v-model="form.priority" class="input pr-8 appearance-none">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              <svg class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
            </div>
          </div>
        </div>

        <!-- Due date -->
        <div>
          <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5" for="new-task-due">Due Date</label>
          <input id="new-task-due" v-model="form.due_date" type="date" class="input" />
        </div>

        <!-- Recurrence (new task) -->
        <div v-if="form.due_date">
          <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Repeat</label>
          <div class="space-y-2">
            <select v-model="recurrenceType" class="input">
              <option v-for="t in RECURRENCE_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>

            <div v-if="recurrenceType" class="flex items-center gap-2">
              <label class="text-xs text-zinc-500 dark:text-zinc-400">Every</label>
              <input v-model.number="recurrenceInterval" type="number" min="1" class="w-16 input text-sm" />
              <span v-if="recurrenceType !== 'custom'" class="text-xs text-zinc-500 dark:text-zinc-400">
                {{ recurrenceType === 'daily' ? 'day(s)' : recurrenceType === 'weekly' ? 'week(s)' : 'month(s)' }}
              </span>
              <select v-if="recurrenceType === 'custom'" v-model="recurrenceUnit" class="input text-sm">
                <option v-for="u in UNIT_OPTIONS" :key="u.value" :value="u.value">{{ u.label }}</option>
              </select>
            </div>

            <div v-if="recurrenceType === 'weekly'" class="flex flex-wrap gap-1">
              <button
                v-for="(label, idx) in DAY_LABELS" :key="idx"
                type="button" @click="toggleDayOfWeek(idx)"
                :class="['text-xs font-semibold w-8 h-8 rounded-full transition-colors', recurrenceDaysOfWeek.includes(idx) ? 'bg-brand-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700']"
              >{{ label.charAt(0) }}</button>
            </div>

            <div v-if="recurrenceType === 'monthly'" class="flex items-center gap-2">
              <label class="text-xs text-zinc-500 dark:text-zinc-400">on day</label>
              <input v-model.number="recurrenceDayOfMonth" type="number" min="1" max="31" class="w-16 input text-sm" />
            </div>

            <div v-if="recurrenceType" class="flex items-center gap-2">
              <label class="text-xs text-zinc-500 dark:text-zinc-400">Until</label>
              <input v-model="recurrenceEndDate" type="date" class="flex-1 input text-sm" />
            </div>
          </div>
        </div>

        <!-- Labels -->
        <div v-if="labels.length">
          <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Labels</label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="l in labels"
              :key="l.id"
              type="button"
              @click="toggleLabel(l.id)"
              :class="[
                'inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors',
                form.labels.includes(l.id)
                  ? 'border-transparent text-white shadow-sm'
                  : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600',
              ]"
              :style="form.labels.includes(l.id) ? { backgroundColor: l.color } : {}"
            >
              <span class="w-2 h-2 rounded-full flex-shrink-0" :style="{ backgroundColor: form.labels.includes(l.id) ? 'rgba(255,255,255,0.5)' : l.color }" />
              {{ l.name }}
            </button>
          </div>
        </div>

        <!-- Error -->
        <div
          v-if="errorMsg"
          role="alert"
          class="flex items-start gap-2 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2.5 rounded-lg"
        >
          <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
          </svg>
          {{ errorMsg }}
        </div>
      </form>

      <!-- Error (edit mode — sits above footer) -->
      <div
        v-if="task && errorMsg"
        role="alert"
        class="mx-6 mb-2 flex items-start gap-2 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2.5 rounded-lg"
      >
        <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
        </svg>
        {{ errorMsg }}
      </div>

      <!-- Footer actions -->
      <div class="px-5 sm:px-6 py-3 sm:py-4 border-t border-zinc-200 dark:border-zinc-700 flex items-center gap-3 flex-shrink-0 bg-zinc-50 dark:bg-zinc-800/50 rounded-b-xl">
        <template v-if="readOnly">
          <button type="button" @click="$emit('close')" class="btn-primary flex-1">
            Close
          </button>
        </template>
        <template v-else-if="!task">
          <!-- New task: always show cancel + create -->
          <button type="button" @click="$emit('close')" class="btn-secondary">
            Cancel
          </button>
          <button
            type="submit"
            :disabled="saving"
            class="btn-primary flex-1"
            @click="handleSubmit"
          >
            <svg v-if="saving" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {{ saving ? 'Saving…' : 'Create task' }}
          </button>
        </template>
        <template v-else>
          <!-- Delete -->
          <button
            type="button"
            @click="showDeleteConfirm = true"
            class="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 px-3 py-1.5 rounded-lg transition-colors"
          >
            Delete
          </button>
          <!-- Existing task: auto-save indicator + conditional save -->
          <span v-if="autoSaving" class="text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Saving…
          </span>
          <span class="flex-1" />
          <button type="button" @click="$emit('close')" :class="hasTextChanges ? 'btn-secondary' : 'btn-primary'">
            {{ hasTextChanges ? 'Discard text changes' : 'Close' }}
          </button>
          <button
            v-if="hasTextChanges"
            type="submit"
            :disabled="saving"
            class="btn-primary"
            @click="handleSubmit"
          >
            <svg v-if="saving" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {{ saving ? 'Saving…' : 'Save changes' }}
          </button>
        </template>
      </div>

      <ConfirmDialog
        v-model="showDeleteConfirm"
        title="Delete task?"
        message="This will permanently delete this task and all its comments, attachments, and links. This cannot be undone."
        @confirm="confirmDelete"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue';
import TaskComments from './TaskComments.vue';
import TaskLinks from './TaskLinks.vue';
import TaskAttachments from './TaskAttachments.vue';
import TaskChecklist from './TaskChecklist.vue';
import ConfirmDialog from './ConfirmDialog.vue';
import { useCommentsStore } from '@/stores/comments';
import { useAttachmentsStore } from '@/stores/attachments';
import { useCompletionsStore } from '@/stores/completions';
import { useTasksStore } from '@/stores/tasks';
import { describeRecurrence } from '@/utils/recurrence';
import { storeToRefs } from 'pinia';

const props = defineProps({
  task: { type: Object, default: null },
  boardId: { type: String, default: null },
  defaultStatus: { type: String, default: 'todo' },
  readOnly: { type: Boolean, default: false },
  statuses: { type: Array, default: () => [] },
  labels: { type: Array, default: () => [] },
});
const emit = defineEmits(['save', 'close', 'open-task', 'auto-save', 'delete']);

const DEFAULT_STATUSES = [
  { id: 'todo', label: 'To Do', color: '#a1a1aa', done: false },
  { id: 'in-progress', label: 'In Progress', color: '#6366f1', done: false },
  { id: 'done', label: 'Done', color: '#10b981', done: true },
];

const statusOptions = computed(() =>
  props.statuses.length ? props.statuses : DEFAULT_STATUSES
);

const currentStatus = computed(() =>
  statusOptions.value.find((s) => s.id === form.status)
);
const currentStatusColor = computed(() => currentStatus.value?.color || '#a1a1aa');

const statusPillStyle = computed(() => {
  const color = currentStatusColor.value;
  return {
    backgroundColor: `${color}18`,
    borderColor: `${color}40`,
    color: color,
  };
});

const saving = ref(false);
const errorMsg = ref('');
const autoSaving = ref(false);
const dateInput = ref(null);
const titleInput = ref(null);
const showDeleteConfirm = ref(false);

function autoResizeTitle() {
  const el = titleInput.value;
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

onMounted(() => {
  nextTick(() => autoResizeTitle());
});

function openDatePicker() {
  if (props.readOnly) return;
  dateInput.value?.showPicker?.();
}

const form = reactive({
  title: props.task?.title || '',
  description: props.task?.description || '',
  status: props.task?.status || props.defaultStatus,
  priority: props.task?.priority || 'medium',
  due_date: props.task?.due_date || '',
  labels: props.task?.labels || [],
  recurrence: props.task?.recurrence || null,
  checklist: props.task?.checklist || [],
});

const RECURRENCE_TYPES = [
  { value: null, label: 'Does not repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom' },
];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const UNIT_OPTIONS = [
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
  { value: 'months', label: 'Months' },
];

const recurrenceType = ref(props.task?.recurrence?.type || null);
const recurrenceInterval = ref(props.task?.recurrence?.interval || 1);
const recurrenceDaysOfWeek = ref(props.task?.recurrence?.daysOfWeek || []);
const recurrenceDayOfMonth = ref(props.task?.recurrence?.dayOfMonth || 1);
const recurrenceUnit = ref(props.task?.recurrence?.unit || 'days');
const recurrenceEndDate = ref(props.task?.recurrence?.endDate || '');

function buildRecurrence() {
  if (!recurrenceType.value) return null;
  const rule = { type: recurrenceType.value, interval: recurrenceInterval.value };
  if (recurrenceType.value === 'weekly' && recurrenceDaysOfWeek.value.length) {
    rule.daysOfWeek = [...recurrenceDaysOfWeek.value];
  }
  if (recurrenceType.value === 'monthly') {
    rule.dayOfMonth = recurrenceDayOfMonth.value;
  }
  if (recurrenceType.value === 'custom') {
    rule.unit = recurrenceUnit.value;
  }
  if (recurrenceEndDate.value) {
    rule.endDate = recurrenceEndDate.value;
  }
  return rule;
}

function syncRecurrenceToForm() {
  form.recurrence = buildRecurrence();
  if (props.task) autoSaveMetadata();
}

watch(recurrenceType, syncRecurrenceToForm);
watch(recurrenceInterval, syncRecurrenceToForm);
watch(recurrenceDaysOfWeek, syncRecurrenceToForm, { deep: true });
watch(recurrenceDayOfMonth, syncRecurrenceToForm);
watch(recurrenceUnit, syncRecurrenceToForm);
watch(recurrenceEndDate, syncRecurrenceToForm);

// Completion history
const completionsStore = useCompletionsStore();
const tasksStore = useTasksStore();
const { completions, loading: completionsLoading, hasMore: completionsHasMore } = storeToRefs(completionsStore);
const showCompletionHistory = ref(false);
const completingOccurrence = ref(false);

async function completeOccurrence() {
  if (completingOccurrence.value || !props.task?._id) return;
  completingOccurrence.value = true;
  try {
    const updated = await tasksStore.completeOccurrence(props.task._id);
    // Refresh form with updated task data
    if (updated.due_date) form.due_date = updated.due_date;
    if (updated.recurrence) {
      syncRecurrenceFields(updated.recurrence);
    } else {
      recurrenceType.value = '';
    }
    // Refresh completion history if it's open
    if (showCompletionHistory.value) {
      completionsStore.fetchCompletions(props.task._id);
    }
  } finally {
    completingOccurrence.value = false;
  }
}

function syncRecurrenceFields(rule) {
  recurrenceType.value = rule.type || '';
  recurrenceInterval.value = rule.interval || 1;
  recurrenceDaysOfWeek.value = rule.daysOfWeek || [];
  recurrenceDayOfMonth.value = rule.dayOfMonth || 1;
  recurrenceUnit.value = rule.unit || 'days';
  recurrenceEndDate.value = rule.endDate || '';
}

function toggleCompletionHistory() {
  showCompletionHistory.value = !showCompletionHistory.value;
  if (showCompletionHistory.value && props.task?._id) {
    completionsStore.fetchCompletions(props.task._id);
  }
}

function formatCompletionDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

const showLabelPicker = ref(false);

const labelMap = computed(() => {
  const map = {};
  for (const l of props.labels) map[l.id] = l;
  return map;
});

function toggleLabel(labelId) {
  if (props.readOnly) return;
  const idx = form.labels.indexOf(labelId);
  if (idx >= 0) form.labels.splice(idx, 1);
  else form.labels.push(labelId);
  if (props.task) autoSaveMetadata();
}

function toggleDayOfWeek(day) {
  if (props.readOnly) return;
  const idx = recurrenceDaysOfWeek.value.indexOf(day);
  if (idx >= 0) recurrenceDaysOfWeek.value.splice(idx, 1);
  else recurrenceDaysOfWeek.value.push(day);
}

const priorityPillClass = computed(() => ({
  low: 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400',
  medium: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400',
  high: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400',
  critical: 'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-400',
}[form.priority] || 'bg-zinc-100 border-zinc-200 text-zinc-600'));

const priorityDotClass = computed(() => ({
  low: 'bg-zinc-400',
  medium: 'bg-amber-400',
  high: 'bg-rose-500',
  critical: 'bg-violet-500',
}[form.priority] || 'bg-zinc-400'));

const dueDatePast = computed(() => {
  if (!form.due_date) return false;
  return new Date(form.due_date) < new Date(new Date().toDateString());
});

// Track whether text fields have unsaved changes
const hasTextChanges = computed(() => {
  if (!props.task) return true; // new task always needs save
  return form.title !== (props.task.title || '') ||
         form.description !== (props.task.description || '');
});

// Auto-save metadata fields (non-text) for existing tasks
function autoSaveMetadata() {
  if (!props.task || props.readOnly) return;
  autoSaving.value = true;
  errorMsg.value = '';
  try {
    emit('auto-save', { ...form, due_date: form.due_date || null, recurrence: form.recurrence });
  } catch (err) {
    errorMsg.value = err.response?.data?.error || 'Auto-save failed';
  } finally {
    setTimeout(() => { autoSaving.value = false; }, 600);
  }
}

// Watch metadata fields for auto-save (skip initial values)
watch(() => form.status, () => { if (props.task) autoSaveMetadata(); });
watch(() => form.priority, () => { if (props.task) autoSaveMetadata(); });
watch(() => form.due_date, () => { if (props.task) autoSaveMetadata(); });
watch(() => form.checklist, () => { if (props.task) autoSaveMetadata(); }, { deep: true });

// Live counts for section headers
const commentsStore = useCommentsStore();
const attachmentsStore = useAttachmentsStore();
const { comments } = storeToRefs(commentsStore);
const { attachments } = storeToRefs(attachmentsStore);

const checklistDoneCount = computed(() =>
  (form.checklist || []).filter((i) => i.done).length
);

function formatDueDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function confirmDelete() {
  emit('delete', props.task._id);
}

async function handleSubmit() {
  errorMsg.value = '';
  saving.value = true;
  try {
    await emit('save', { ...form, due_date: form.due_date || null, recurrence: form.recurrence });
  } catch (err) {
    errorMsg.value = err.response?.data?.error || 'Failed to save task';
    saving.value = false;
  }
}
</script>
