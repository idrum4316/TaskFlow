<template>
  <div class="flex flex-col h-full">
    <!-- Board sub-header -->
    <div class="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700 flex-shrink-0">
      <!-- Row 1: breadcrumb + board name + actions -->
      <div class="flex items-center gap-2 px-4 sm:px-6 py-2.5">
        <!-- Breadcrumb -->
        <RouterLink
          to="/"
          class="flex items-center gap-1.5 text-sm text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors font-medium flex-shrink-0"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
          <span class="hidden sm:inline">Boards</span>
        </RouterLink>
        <svg class="w-4 h-4 text-zinc-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        <h2 class="font-semibold text-zinc-900 dark:text-zinc-100 text-sm truncate min-w-0">
          {{ board?.name || '…' }}
        </h2>

        <div class="ml-auto flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <!-- Desktop management buttons (md+) -->
          <button
            v-if="isOwner"
            @click="showStatusManager = true"
            class="hidden md:flex items-center gap-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-3 py-1.5 rounded-lg transition-colors"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Statuses
          </button>

          <button
            v-if="isOwner"
            @click="showLabelManager = true"
            class="hidden md:flex items-center gap-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-3 py-1.5 rounded-lg transition-colors"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6z" />
            </svg>
            Labels
          </button>

          <button
            v-if="isOwner"
            @click="showShareModal = true"
            class="hidden md:flex items-center gap-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-3 py-1.5 rounded-lg transition-colors"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
            </svg>
            Share
          </button>

          <button
            @click="showNotes = true"
            class="hidden md:flex items-center gap-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-3 py-1.5 rounded-lg transition-colors"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            Notes
          </button>

          <button
            v-if="isOwner"
            @click="showBoardSettings = true"
            class="hidden md:flex items-center gap-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-3 py-1.5 rounded-lg transition-colors"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
            Settings
          </button>

          <!-- Mobile notes button (all users, < md) -->
          <button
            @click="showNotes = true"
            class="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Board notes"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </button>

          <!-- Mobile overflow menu (< md, owner only) -->
          <div v-if="isOwner" class="relative md:hidden">
            <button
              @click="showBoardMenu = !showBoardMenu"
              class="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              :aria-expanded="showBoardMenu"
              aria-label="Board settings"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
              </svg>
            </button>
            <!-- Dropdown -->
            <div
              v-if="showBoardMenu"
              class="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-modal py-1 z-20 animate-scale-in"
            >
              <button
                @click="showStatusManager = true; showBoardMenu = false"
                class="flex items-center gap-2.5 w-full text-left text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 px-3 py-2.5 transition-colors"
              >
                <svg class="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Statuses
              </button>
              <button
                @click="showLabelManager = true; showBoardMenu = false"
                class="flex items-center gap-2.5 w-full text-left text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 px-3 py-2.5 transition-colors"
              >
                <svg class="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6z" />
                </svg>
                Labels
              </button>
              <button
                @click="showShareModal = true; showBoardMenu = false"
                class="flex items-center gap-2.5 w-full text-left text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 px-3 py-2.5 transition-colors"
              >
                <svg class="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                </svg>
                Share
              </button>
              <button
                @click="showNotes = true; showBoardMenu = false"
                class="flex items-center gap-2.5 w-full text-left text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 px-3 py-2.5 transition-colors"
              >
                <svg class="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                Notes
              </button>
              <button
                @click="showBoardSettings = true; showBoardMenu = false"
                class="flex items-center gap-2.5 w-full text-left text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 px-3 py-2.5 transition-colors"
              >
                <svg class="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                </svg>
                Settings
              </button>
            </div>
          </div>

          <button v-if="canEdit" @click="openCreate" class="btn-primary !py-1.5 !px-3 sm:!px-4 sm:!py-2.5">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span class="hidden sm:inline">Add Task</span>
            <span class="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      <!-- Row 2: View switcher + label filter -->
      <div class="flex flex-col sm:flex-row sm:items-center gap-2 px-4 sm:px-6 pb-2.5">
        <div
          class="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1"
          role="tablist"
          aria-label="Board view"
        >
          <button
            v-for="v in views"
            :key="v.id"
            role="tab"
            :aria-selected="activeView === v.id"
            :aria-label="v.label"
            @click="setView(v.id)"
            :class="[
              'flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150',
              activeView === v.id
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-card'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50',
            ]"
          >
            <component :is="v.icon" class="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span class="hidden sm:inline">{{ v.label }}</span>
          </button>
        </div>

        <button
          v-if="activeView === 'kanban'"
          type="button"
          @click="toggleKanbanChecklistVisibility"
          :class="[
            'inline-flex items-center gap-2 self-start rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
            showKanbanChecklist
              ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-400 dark:bg-brand-900/30 dark:text-brand-300'
              : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-200',
          ]"
          :aria-pressed="showKanbanChecklist"
        >
          <span
            :class="[
              'inline-flex h-5 w-5 items-center justify-center rounded border',
              showKanbanChecklist
                ? 'border-brand-500 bg-brand-500 text-white dark:border-brand-400 dark:bg-brand-400'
                : 'border-zinc-300 text-transparent dark:border-zinc-600',
            ]"
            aria-hidden="true"
          >
            <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </span>
          <span>{{ showKanbanChecklist ? 'Hide checklist items' : 'Show checklist items' }}</span>
        </button>

        <!-- Label filter -->
        <div v-if="boardLabels.length" class="flex items-center gap-1.5 sm:ml-1 overflow-x-auto scrollbar-none min-w-0">
          <svg class="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
          </svg>
          <button
            v-for="l in boardLabels"
            :key="l.id"
            type="button"
            @click="toggleLabelFilter(l.id)"
            :class="[
              'inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border transition-colors flex-shrink-0',
              selectedLabels.has(l.id)
                ? 'border-transparent text-white shadow-sm'
                : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600',
            ]"
            :style="selectedLabels.has(l.id) ? { backgroundColor: l.color } : {}"
            :aria-pressed="selectedLabels.has(l.id)"
          >
            <span class="w-2 h-2 rounded-full flex-shrink-0" :style="{ backgroundColor: selectedLabels.has(l.id) ? 'rgba(255,255,255,0.5)' : l.color }" />
            {{ l.name }}
          </button>
          <button
            v-if="selectedLabels.size"
            @click="clearLabelFilter"
            class="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 px-1.5 py-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
    </div>

    <!-- Error banner -->
    <div
      v-if="tasksStore.error"
      role="alert"
      class="flex items-center gap-2 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-800 px-6 py-3 flex-shrink-0"
    >
      <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
      </svg>
      {{ tasksStore.error }}
    </div>

    <!-- Views -->
    <template v-else>
      <KanbanBoard
        v-if="activeView === 'kanban'"
        :tasks="filteredTasks"
        :loading="tasksStore.loading"
        :statuses="boardStatuses"
        :show-checklist-items="showKanbanChecklist"
        @add="openCreateInColumn"
        @edit="openEdit"
        @delete="handleDelete"
        @reorder="handleReorder"
      />
      <TaskListView
        v-else-if="activeView === 'list'"
        :tasks="filteredTasks"
        :loading="tasksStore.loading"
        :statuses="boardStatuses"
        @add="openCreateInColumn"
        @edit="openEdit"
        @delete="handleDelete"
        @reorder="handleReorder"
      />
      <TaskCalendarView
        v-else-if="activeView === 'calendar'"
        :tasks="filteredTasks"
        :loading="tasksStore.loading"
        :statuses="boardStatuses"
        :board-id="boardId"
        :initial-mode="board?.default_calendar_mode"
        @edit="openEdit"
        @add="openCreate"
        @due-date-change="handleDueDateChange"
      />
    </template>

    <!-- Task form drawer -->
    <TaskForm
      v-if="showForm"
      :task="editingTask"
      :board-id="boardId"
      :default-status="defaultStatus"
      :read-only="!canEdit"
      :statuses="boardStatuses"
      :labels="boardLabels"
      @save="handleSave"
      @auto-save="handleAutoSave"
      @close="closeForm"
      @open-task="handleOpenLinkedTask"
      @delete="handleFormDelete"
    />

    <!-- Board notes panel -->
    <BoardNotes
      v-if="showNotes && board"
      :board-id="board._id"
      :board-name="board.name"
      :is-owner="isOwner"
      @close="showNotes = false"
    />

    <!-- Share board modal -->
    <ShareBoardModal
      v-if="showShareModal && board"
      :board-id="board._id"
      :board-name="board.name"
      @close="showShareModal = false"
    />

    <!-- Status manager drawer -->
    <StatusManager
      v-if="showStatusManager && board"
      :statuses="boardStatuses"
      :tasks="tasksStore.tasks"
      :board-id="board._id"
      :board-name="board.name"
      :save-fn="handleSaveStatuses"
      @close="showStatusManager = false"
    />
    <!-- Label manager drawer -->
    <LabelManager
      v-if="showLabelManager && board"
      :labels="boardLabels"
      :board-id="board._id"
      :board-name="board.name"
      :save-fn="handleSaveLabels"
      @close="showLabelManager = false"
    />

    <!-- Board settings modal -->
    <BoardSettingsModal
      v-if="showBoardSettings && board"
      :board-id="board._id"
      :current-view="board.default_view || 'kanban'"
      :current-calendar-mode="board.default_calendar_mode || 'month'"
      :save-fn="handleSaveSettings"
      @close="showBoardSettings = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, h, provide, nextTick } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { useBoardsStore } from '@/stores/boards';
import { useTasksStore } from '@/stores/tasks';
import { useSharesStore } from '@/stores/shares';
import { useNotesStore } from '@/stores/notes';
import KanbanBoard from '@/components/KanbanBoard.vue';
import TaskListView from '@/components/TaskListView.vue';
import TaskCalendarView from '@/components/TaskCalendarView.vue';
import TaskForm from '@/components/TaskForm.vue';
import ShareBoardModal from '@/components/ShareBoardModal.vue';
import BoardNotes from '@/components/BoardNotes.vue';
import StatusManager from '@/components/StatusManager.vue';
import LabelManager from '@/components/LabelManager.vue';
import BoardSettingsModal from '@/components/BoardSettingsModal.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { useBoardEvents } from '@/composables/useBoardEvents';

const route = useRoute();
const router = useRouter();
const boardsStore = useBoardsStore();
const tasksStore = useTasksStore();
const sharesStore = useSharesStore();
const notesStore = useNotesStore();

const boardId = computed(() => route.params.id);
const board = computed(() => boardsStore.boards.find((b) => b._id === boardId.value));

// Real-time updates via CouchDB _changes feed (SSE)
useBoardEvents(boardId);

const isOwner = computed(() => board.value?._role === 'owner');
const canEdit = computed(() => isOwner.value || board.value?._access === 'write');

provide('canEdit', canEdit);

const boardLabels = computed(() => board.value?.labels || []);
provide('boardLabels', boardLabels);

const doneStatusIds = computed(() => {
  const statuses = board.value?.statuses || DEFAULT_STATUSES;
  return new Set(statuses.filter((s) => s.done).map((s) => s.id));
});
provide('doneStatusIds', doneStatusIds);

const showShareModal = ref(false);
const showStatusManager = ref(false);
const showLabelManager = ref(false);
const showBoardSettings = ref(false);
const showNotes = ref(false);
const showBoardMenu = ref(false);
const showDeleteConfirm = ref(false);
const pendingDeleteId = ref(null);

const DEFAULT_STATUSES = [
  { id: 'todo', label: 'To Do', color: '#a1a1aa', done: false },
  { id: 'in-progress', label: 'In Progress', color: '#6366f1', done: false },
  { id: 'done', label: 'Done', color: '#10b981', done: true },
];

const boardStatuses = computed(() => board.value?.statuses || DEFAULT_STATUSES);

const activeView = computed(() => {
  const v = route.query.view;
  if (['kanban', 'list', 'calendar'].includes(v)) return v;
  const def = board.value?.default_view;
  return ['kanban', 'list', 'calendar'].includes(def) ? def : 'kanban';
});

const showKanbanChecklist = computed(() => route.query.showChecklist === '1');

function setView(id) {
  router.replace({ query: { ...route.query, view: id } });
}

function toggleKanbanChecklistVisibility() {
  router.replace({
    query: {
      ...route.query,
      showChecklist: showKanbanChecklist.value ? undefined : '1',
    },
  });
}

// Label filter — persisted via URL query param
const selectedLabels = computed(() => {
  const raw = route.query.labels;
  if (!raw) return new Set();
  return new Set(raw.split(',').filter(Boolean));
});

const filteredTasks = computed(() => {
  if (!selectedLabels.value.size) return tasksStore.tasks;
  return tasksStore.tasks.filter((t) =>
    [...selectedLabels.value].every((labelId) => (t.labels || []).includes(labelId))
  );
});

function toggleLabelFilter(labelId) {
  const current = new Set(selectedLabels.value);
  if (current.has(labelId)) current.delete(labelId);
  else current.add(labelId);
  const labels = [...current].join(',') || undefined;
  router.replace({ query: { ...route.query, labels } });
}

function clearLabelFilter() {
  const { labels, ...rest } = route.query;
  router.replace({ query: rest });
}

// Inline SVG icon render functions
const KanbanIcon = {
  render: () => h('svg', { viewBox: '0 0 20 20', fill: 'currentColor' }, [
    h('rect', { x: 2, y: 3, width: 4, height: 14, rx: 1.5 }),
    h('rect', { x: 8, y: 3, width: 4, height: 9, rx: 1.5 }),
    h('rect', { x: 14, y: 3, width: 4, height: 11, rx: 1.5 }),
  ]),
};
const ListIcon = {
  render: () => h('svg', { viewBox: '0 0 20 20', fill: 'currentColor' }, [
    h('rect', { x: 2, y: 4, width: 16, height: 2, rx: 1 }),
    h('rect', { x: 2, y: 9, width: 16, height: 2, rx: 1 }),
    h('rect', { x: 2, y: 14, width: 10, height: 2, rx: 1 }),
  ]),
};
const CalendarIcon = {
  render: () => h('svg', { viewBox: '0 0 20 20', fill: 'currentColor' }, [
    h('path', { 'fill-rule': 'evenodd', d: 'M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z', 'clip-rule': 'evenodd' }),
  ]),
};

const views = [
  { id: 'kanban', label: 'Kanban', icon: KanbanIcon },
  { id: 'list', label: 'List', icon: ListIcon },
  { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
];

const showForm = ref(false);
const editingTask = ref(null);
const defaultStatus = ref('todo');

async function load() {
  tasksStore.clearTasks();
  if (!boardsStore.boards.length) await boardsStore.fetchBoards();
  await tasksStore.fetchTasks(boardId.value);
}

function closeBoardMenu(e) {
  if (showBoardMenu.value && !e.target.closest('[aria-label="Board settings"]')) {
    showBoardMenu.value = false;
  }
}

onMounted(() => {
  load();
  document.addEventListener('click', closeBoardMenu);
});
onUnmounted(() => {
  tasksStore.clearTasks();
  sharesStore.clearShares();    notesStore.clearNotes();  document.removeEventListener('click', closeBoardMenu);
});
watch(boardId, load);

function openCreate() {
  defaultStatus.value = boardStatuses.value[0]?.id || 'todo';
  editingTask.value = null;
  showForm.value = true;
}

function openCreateInColumn(status) {
  defaultStatus.value = status;
  editingTask.value = null;
  showForm.value = true;
}

function openEdit(task) {
  editingTask.value = task;
  showForm.value = true;
}

function closeForm() {
  showForm.value = false;
  editingTask.value = null;
  defaultStatus.value = 'todo';
}

async function handleSave(payload) {
  if (editingTask.value) {
    await tasksStore.updateTask(editingTask.value._id, payload);
  } else {
    await tasksStore.createTask({ ...payload, board_id: boardId.value });
  }
  closeForm();
}

async function handleAutoSave(payload) {
  if (editingTask.value) {
    const updated = await tasksStore.updateTask(editingTask.value._id, payload);
    if (updated) editingTask.value = updated;
  }
}

async function handleDelete(id) {
  pendingDeleteId.value = id;
  showDeleteConfirm.value = true;
}

async function executeDelete() {
  if (pendingDeleteId.value) {
    await tasksStore.deleteTask(pendingDeleteId.value);
    pendingDeleteId.value = null;
  }
}

async function handleFormDelete(id) {
  await tasksStore.deleteTask(id);
  closeForm();
}

async function handleStatusChange({ id, status }) {
  const task = tasksStore.tasks.find((t) => t._id === id);
  if (task) await tasksStore.updateTask(id, { ...task, status });
}

async function handleReorder({ id, status, position }) {
  await tasksStore.reorderTask(id, status, position);
}

async function handleDueDateChange({ id, due_date }) {
  const task = tasksStore.tasks.find((t) => t._id === id);
  if (task) await tasksStore.updateTask(id, { ...task, due_date });
}

async function handleOpenLinkedTask(taskId) {
  const task = tasksStore.tasks.find((t) => t._id === taskId);
  if (task) {
    showForm.value = false;
    await nextTick();
    editingTask.value = task;
    showForm.value = true;
  }
}

async function handleSaveStatuses({ statuses, reassignments }) {
  const entries = Object.entries(reassignments || {});
  for (const [fromStatus, toStatus] of entries) {
    const affected = tasksStore.tasks.filter((t) => t.status === fromStatus);
    for (const task of affected) {
      await tasksStore.updateTask(task._id, { ...task, status: toStatus });
    }
  }
  await boardsStore.updateBoard(board.value._id, { name: board.value.name, statuses });
}

async function handleSaveLabels({ labels }) {
  await boardsStore.updateBoard(board.value._id, { name: board.value.name, labels });
}

async function handleSaveSettings({ default_view, default_calendar_mode }) {
  await boardsStore.updateBoard(board.value._id, { name: board.value.name, default_view, default_calendar_mode });
}
</script>
