<template>
  <div class="fixed inset-0 z-50 flex items-stretch justify-center p-0 lg:p-4" role="dialog" aria-modal="true" aria-label="Board Notes">
    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" @click="requestClose" aria-hidden="true" />

    <div class="relative flex h-full w-full max-w-none flex-col overflow-hidden bg-white shadow-modal animate-scale-in dark:bg-zinc-900 lg:h-[calc(100vh-2rem)] lg:max-w-[96rem] lg:rounded-3xl lg:border lg:border-zinc-200 dark:lg:border-zinc-700">
      <!-- Header -->
      <header class="flex flex-shrink-0 items-center justify-between gap-4 border-b border-zinc-200 px-4 py-3.5 dark:border-zinc-700 sm:px-6">
        <div class="flex min-w-0 items-center gap-3">
          <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <div class="min-w-0">
            <h2 class="truncate text-base font-semibold text-zinc-950 dark:text-zinc-50">Board Notes</h2>
            <p class="truncate text-xs text-zinc-500 dark:text-zinc-400">
              {{ boardName }} · {{ noteCountLabel }}
            </p>
          </div>
        </div>

        <div class="flex flex-shrink-0 items-center gap-2">
          <span v-if="saveSuccess" class="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300 sm:inline-flex">
            Saved
          </span>
          <button v-if="canEdit" type="button" @click="startCreate" class="btn-primary !px-3 !py-2">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span class="hidden sm:inline">New Note</span>
          </button>
          <button type="button" @click="requestClose" class="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300" aria-label="Close">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </header>

      <div class="flex min-h-0 flex-1 bg-zinc-50/70 dark:bg-zinc-950/40 lg:flex-row">
        <!-- Notes navigation -->
        <aside :class="['min-h-0 w-full flex-col border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:w-72 lg:border-r xl:w-80 2xl:w-96', activeNote ? (focusEditor ? 'hidden' : 'hidden lg:flex') : 'flex']">
          <div class="flex-shrink-0 space-y-3 border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
            <div class="relative">
              <svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 15.75 21 21m-4.5-9a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
              <input
                v-model="searchQuery"
                type="search"
                class="input !py-2 !pl-9"
                placeholder="Search titles, content, people…"
                aria-label="Search notes"
              />
            </div>

            <div class="grid grid-cols-3 gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800" role="tablist" aria-label="Note filters">
              <button
                v-for="filter in filters"
                :key="filter.id"
                type="button"
                :class="[
                  'rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors',
                  activeFilter === filter.id
                    ? 'bg-white text-brand-700 shadow-sm dark:bg-zinc-900 dark:text-brand-300'
                    : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100',
                ]"
                @click="activeFilter = filter.id"
              >
                {{ filter.label }}
                <span class="ml-1 font-medium opacity-70">{{ filter.count }}</span>
              </button>
            </div>

            <div v-if="availableTags.length" class="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none" aria-label="Note hashtags">
              <button
                type="button"
                :class="[
                  'inline-flex flex-shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                  !selectedTag
                    ? 'border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-300'
                    : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200',
                ]"
                @click="selectedTag = ''"
              >
                All tags
              </button>
              <button
                v-for="tag in availableTags"
                :key="tag"
                type="button"
                :class="[
                  'inline-flex flex-shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                  selectedTag === tag
                    ? 'border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-300'
                    : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200',
                ]"
                @click="selectedTag = tag"
              >
                #{{ tag }}
              </button>
            </div>
          </div>

          <div v-if="notesStore.loading" class="flex-1 space-y-3 overflow-y-auto p-4">
            <div v-for="i in 5" :key="i" class="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/60">
              <div class="mb-3 h-4 w-2/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
              <div class="mb-2 h-3 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
              <div class="h-3 w-1/2 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
            </div>
          </div>

          <div v-else-if="!notesStore.notes.length" class="flex flex-1 items-center justify-center px-6 py-10 text-center">
            <div>
              <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12" />
                </svg>
              </div>
              <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">No notes yet</h3>
              <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {{ canEdit ? 'Capture decisions, meeting notes, and board context here.' : 'Notes will appear here once created.' }}
              </p>
              <button v-if="canEdit" type="button" @click="startCreate" class="btn-primary mt-5">
                Create first note
              </button>
            </div>
          </div>

          <div v-else-if="!filteredNotes.length" class="flex flex-1 items-center justify-center px-6 py-10 text-center">
            <div>
              <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 15.75 21 21m-4.5-9a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
              </div>
              <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">No matching notes</h3>
              <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Try a different search, filter, or tag.</p>
            </div>
          </div>

          <ul v-else class="flex-1 space-y-2 overflow-y-auto p-3">
            <li
              v-for="note in filteredNotes"
              :key="note._id"
              :class="[
                'group cursor-pointer rounded-2xl border p-3.5 transition-all duration-150',
                activeNote?._id === note._id
                  ? 'border-brand-300 bg-brand-50/80 shadow-card dark:border-brand-700/70 dark:bg-brand-950/30'
                  : 'border-zinc-200 bg-white hover:border-brand-200 hover:bg-zinc-50 hover:shadow-card dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/70',
              ]"
              @click="openNote(note)"
            >
              <div class="flex items-start gap-3">
                <div :class="['mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl', note.pinned ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300' : 'bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300']">
                  <svg v-if="note.pinned" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                  </svg>
                  <svg v-else class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12" />
                  </svg>
                </div>

                <div class="min-w-0 flex-1">
                  <div class="flex items-start gap-2">
                    <h3 class="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">{{ note.title || 'Untitled' }}</h3>
                    <span v-if="note.pinned" class="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">Pinned</span>
                  </div>
                  <p class="mt-1 line-clamp-2 text-sm leading-5 text-zinc-600 dark:text-zinc-300">{{ excerpt(note) }}</p>
                  <div class="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                    <span class="inline-flex items-center gap-1.5">
                      <span class="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-bold uppercase text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">{{ initials(note.username) }}</span>
                      {{ note.username || 'Unknown' }}
                    </span>
                    <span aria-hidden="true">•</span>
                    <span>{{ formatDate(note.updated_at) }}</span>
                    <span aria-hidden="true">•</span>
                    <span>{{ wordCount(note.content) }} words</span>
                  </div>
                  <div v-if="noteTags(note).length" class="mt-2 flex flex-wrap gap-1.5">
                    <span v-for="tag in noteTags(note).slice(0, 3)" :key="`${note._id}-${tag}`" class="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      #{{ tag }}
                    </span>
                    <span v-if="noteTags(note).length > 3" class="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      +{{ noteTags(note).length - 3 }}
                    </span>
                  </div>
                </div>

                <div class="flex flex-shrink-0 flex-col gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                  <button
                    v-if="canEdit"
                    type="button"
                    @click.stop="togglePinned(note)"
                    class="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-amber-50 hover:text-amber-600 dark:text-zinc-500 dark:hover:bg-amber-950/30 dark:hover:text-amber-300"
                    :aria-label="note.pinned ? 'Unpin note' : 'Pin note'"
                  >
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                    </svg>
                  </button>
                  <button
                    v-if="canDeleteNote(note)"
                    type="button"
                    @click.stop="confirmDelete(note)"
                    class="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-zinc-500 dark:hover:bg-red-950/40"
                    aria-label="Delete note"
                  >
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79" />
                    </svg>
                  </button>
                </div>
              </div>
            </li>
          </ul>
        </aside>

        <!-- Note detail / editor -->
        <section :class="['min-h-0 flex-1 flex-col bg-white dark:bg-zinc-900', activeNote ? 'flex' : 'hidden lg:flex']">
          <div v-if="!activeNote" class="flex flex-1 items-center justify-center p-8 text-center">
            <div class="max-w-lg">
              <div class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
                <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487 18.55 2.8a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25V18A2.25 2.25 0 0117.25 20.25H5.25A2.25 2.25 0 013 18V6A2.25 2.25 0 015.25 3.75H9" />
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-zinc-950 dark:text-zinc-50">A proper home for board knowledge</h3>
              <p class="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                Search, pin, tag with <span class="font-medium text-zinc-700 dark:text-zinc-200">#hashtags</span>, write Markdown, and keep context alongside the work it supports.
              </p>
              <div class="mt-6 grid gap-3 text-left sm:grid-cols-3">
                <div class="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/60">
                  <p class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Pinned notes</p>
                  <p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Keep key decisions at the top.</p>
                </div>
                <div class="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/60">
                  <p class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Live preview</p>
                  <p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Write Markdown with confidence.</p>
                </div>
                <div class="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/60">
                  <p class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Hashtag filters</p>
                  <p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Organize context with lightweight tags.</p>
                </div>
              </div>
              <button v-if="canEdit" type="button" @click="startCreate" class="btn-primary mt-6">
                Start a note
              </button>
            </div>
          </div>

          <template v-else>
            <div class="flex-shrink-0 border-b border-zinc-200 px-4 py-4 dark:border-zinc-800 sm:px-6">
              <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div class="flex min-w-0 items-start gap-3">
                  <button type="button" @click="backToList" class="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 lg:hidden" aria-label="Back to notes">
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                  <div class="min-w-0 flex-1">
                    <input
                      v-if="isEditing"
                      ref="titleEl"
                      v-model="editTitle"
                      type="text"
                      class="w-full border-none bg-transparent p-0 text-2xl font-semibold tracking-tight text-zinc-950 outline-none placeholder:text-zinc-400 focus:ring-0 dark:text-zinc-50"
                      placeholder="Note title"
                      @input="errorMsg = ''"
                    />
                    <h3 v-else class="truncate text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">{{ activeNote.title || 'Untitled' }}</h3>
                    <div class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                      <span class="inline-flex items-center gap-1.5">
                        <span class="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-bold uppercase text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">{{ initials(activeNote.username) }}</span>
                        {{ activeNote.username || 'Unknown' }}
                      </span>
                      <span aria-hidden="true">•</span>
                      <span>Updated {{ formatDate(activeNote.updated_at) }}</span>
                      <span aria-hidden="true">•</span>
                      <span>{{ activeMetrics.words }} words</span>
                      <span aria-hidden="true">•</span>
                      <span>{{ activeMetrics.readTime }}</span>
                      <span v-if="activeNote.pinned" class="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                        <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                        </svg>
                        Pinned
                      </span>
                    </div>
                  </div>
                </div>

                <div class="flex flex-wrap items-center gap-2 lg:flex-shrink-0">
                  <button
                    v-if="isEditing"
                    type="button"
                    @click="focusEditor = !focusEditor"
                    class="btn-secondary hidden lg:inline-flex !px-3 !py-2"
                  >
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <path v-if="focusEditor" stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                      <path v-else stroke-linecap="round" stroke-linejoin="round" d="M3.75 9h16.5m-16.5 6h16.5M9 3.75v16.5" />
                    </svg>
                    {{ focusEditor ? 'Show list' : 'Focus' }}
                  </button>
                  <button
                    v-if="canEdit && !isNew"
                    type="button"
                    @click="togglePinned(activeNote)"
                    class="btn-secondary !px-3 !py-2"
                    :aria-label="activeNote.pinned ? 'Unpin note' : 'Pin note'"
                  >
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                    </svg>
                    <span class="hidden sm:inline">{{ activeNote.pinned ? 'Unpin' : 'Pin' }}</span>
                  </button>
                  <button v-if="canEdit && !isEditing" type="button" @click="startEdit" class="btn-primary !px-3 !py-2">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487 18.55 2.8a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                    </svg>
                    Edit
                  </button>
                  <button v-if="isEditing" type="button" @click="discardEdit" class="btn-secondary !px-3 !py-2">Cancel</button>
                  <button v-if="canDeleteNote(activeNote) && !isNew" type="button" @click="confirmDelete(activeNote)" class="btn-danger !px-3 !py-2">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79" />
                    </svg>
                    <span class="hidden sm:inline">Delete</span>
                  </button>
                </div>
              </div>
            </div>

            <div class="flex-1 overflow-y-auto px-4 py-5 sm:px-6 2xl:px-8">
              <div v-if="errorMsg" role="alert" class="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
                <svg class="mt-0.5 h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                </svg>
                {{ errorMsg }}
              </div>

              <template v-if="isEditing">
                <div class="mx-auto w-full max-w-7xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-card dark:border-zinc-800 dark:bg-zinc-900">
                  <div class="flex flex-col gap-3 border-b border-zinc-200 bg-zinc-50/80 px-3 py-3 dark:border-zinc-800 dark:bg-zinc-800/50 xl:flex-row xl:items-center xl:justify-between">
                    <div class="flex flex-wrap items-center gap-1.5">
                      <button
                        v-for="action in formattingActions"
                        :key="action.id"
                        type="button"
                        class="inline-flex h-8 items-center justify-center rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-semibold text-zinc-600 transition-colors hover:border-brand-200 hover:text-brand-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-brand-700 dark:hover:text-brand-300"
                        :title="action.title"
                        @click="insertMarkdown(action.id)"
                      >
                        {{ action.label }}
                      </button>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="hidden text-xs text-zinc-500 dark:text-zinc-400 sm:inline">Markdown</span>
                      <div class="flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800" role="tablist" aria-label="Editor mode">
                        <button
                          v-for="mode in editorModes"
                          :key="mode.id"
                          type="button"
                          :class="[
                            'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
                            editorMode === mode.id
                              ? 'bg-white text-brand-700 shadow-sm dark:bg-zinc-900 dark:text-brand-300'
                              : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100',
                          ]"
                          @click="editorMode = mode.id"
                        >
                          {{ mode.label }}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div :class="['grid min-h-[520px]', editorMode === 'split' ? '2xl:grid-cols-[minmax(0,1fr)_minmax(30rem,0.9fr)]' : 'grid-cols-1']">
                    <div v-if="editorMode !== 'preview'" class="min-h-[520px]">
                      <textarea
                        ref="contentEl"
                        v-model="editContent"
                        class="h-full min-h-[520px] w-full resize-y border-0 bg-white p-5 font-mono text-sm leading-6 text-zinc-900 outline-none placeholder:text-zinc-400 focus:ring-0 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                        placeholder="Write in Markdown. Try ## Heading, - [ ] checklist items, #tags, links, tables, and code blocks…"
                        @input="errorMsg = ''"
                      />
                    </div>
                    <div v-if="editorMode !== 'write'" :class="['min-h-[360px] bg-zinc-50/70 dark:bg-zinc-950/30', editorMode === 'split' ? 'border-t border-zinc-200 dark:border-zinc-800 2xl:border-l 2xl:border-t-0' : '']">
                      <div class="border-b border-zinc-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">Preview</div>
                      <div v-if="editorRenderedContent" class="note-prose p-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300" v-html="editorRenderedContent" />
                      <div v-else class="p-4 text-sm italic text-zinc-400 dark:text-zinc-500">Start writing to see a live preview.</div>
                    </div>
                  </div>
                </div>

                <div class="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span class="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 font-medium dark:bg-zinc-800">
                    <span class="h-1.5 w-1.5 rounded-full bg-brand-500" />
                    Use <span class="font-semibold text-zinc-700 dark:text-zinc-200">#hashtags</span> anywhere to organize notes
                  </span>
                  <span class="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 font-medium dark:bg-zinc-800">
                    <kbd class="rounded border border-zinc-200 bg-white px-1 font-semibold dark:border-zinc-700 dark:bg-zinc-900">{{ shortcutKey }}</kbd> + <kbd class="rounded border border-zinc-200 bg-white px-1 font-semibold dark:border-zinc-700 dark:bg-zinc-900">S</kbd>
                    save
                  </span>
                </div>
              </template>

              <template v-else>
                <article class="mx-auto max-w-4xl rounded-2xl border border-zinc-200 bg-white p-5 shadow-card dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
                  <div v-if="renderedContent" class="note-prose text-sm leading-relaxed text-zinc-700 dark:text-zinc-300" v-html="renderedContent" />
                  <div v-else class="flex min-h-[280px] items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 text-center dark:border-zinc-800 dark:bg-zinc-800/40">
                    <div>
                      <svg class="mx-auto mb-3 h-8 w-8 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12" />
                      </svg>
                      <p class="text-sm font-medium text-zinc-500 dark:text-zinc-400">No content yet</p>
                      <button v-if="canEdit" type="button" @click="startEdit" class="mt-3 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">Add details</button>
                    </div>
                  </div>
                </article>
              </template>
            </div>

            <div class="flex-shrink-0 border-t border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900 sm:px-6">
              <div v-if="isEditing" class="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div class="min-w-0 flex-1 text-xs text-zinc-500 dark:text-zinc-400">
                  <span v-if="notesStore.saving" class="inline-flex items-center gap-1 text-indigo-500 dark:text-indigo-400">
                    <svg class="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Saving…
                  </span>
                  <span v-else-if="saveSuccess" class="text-emerald-500 dark:text-emerald-400">Saved</span>
                  <span v-else-if="isDirty">Unsaved changes · {{ activeMetrics.words }} words · {{ activeMetrics.readTime }}</span>
                  <span v-else>{{ isNew ? 'New note' : 'No changes' }} · {{ activeMetrics.words }} words · {{ activeMetrics.readTime }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <button type="button" @click="discardEdit" class="btn-secondary">Cancel</button>
                  <button type="button" @click="handleSave" :disabled="notesStore.saving || !editTitle.trim()" class="btn-primary">
                    {{ isNew ? 'Create Note' : 'Save Note' }}
                  </button>
                </div>
              </div>

              <div v-else class="flex flex-col gap-2 text-xs text-zinc-500 dark:text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
                <div class="flex flex-wrap items-center gap-2">
                  <span>Created {{ formatFullDate(activeNote.created_at) }}</span>
                  <span aria-hidden="true">•</span>
                  <span>Updated {{ formatFullDate(activeNote.updated_at) }}</span>
                </div>
                <div v-if="activeTags.length" class="flex flex-wrap gap-1.5">
                  <button
                    v-for="tag in activeTags"
                    :key="tag"
                    type="button"
                    class="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500 transition-colors hover:bg-brand-50 hover:text-brand-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-brand-950/40 dark:hover:text-brand-300"
                    @click="selectedTag = tag; activeFilter = 'all'; backToList()"
                  >
                    #{{ tag }}
                  </button>
                </div>
              </div>
            </div>
          </template>
        </section>
      </div>
    </div>

    <!-- Delete confirmation -->
    <Teleport to="body">
      <div v-if="pendingDelete" class="fixed inset-0 z-[60] flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Delete note">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="pendingDelete = null" aria-hidden="true" />
        <div class="relative mx-4 w-full max-w-sm rounded-2xl bg-white border border-zinc-200 dark:border-zinc-700 p-6 shadow-modal animate-scale-in dark:bg-zinc-900">
          <div class="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79" />
            </svg>
          </div>
          <h3 class="text-base font-semibold text-zinc-900 dark:text-zinc-100">Delete Note</h3>
          <p class="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Are you sure you want to delete <span class="font-medium text-zinc-800 dark:text-zinc-200">“{{ pendingDelete.title || 'Untitled' }}”</span>? This cannot be undone.
          </p>
          <div class="mt-5 flex items-center gap-3">
            <button type="button" @click="pendingDelete = null" class="btn-secondary flex-1">Cancel</button>
            <button type="button" @click="handleDelete" class="btn-primary flex-1 !bg-red-600 hover:!bg-red-700">Delete</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, inject, nextTick } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useNotesStore } from '@/stores/notes';
import { useAuthStore } from '@/stores/auth';

const props = defineProps({
  boardId: { type: String, required: true },
  boardName: { type: String, required: true },
  isOwner: { type: Boolean, default: false },
  initialNoteId: { type: String, default: null },
});

const emit = defineEmits(['close']);

const notesStore = useNotesStore();
const authStore = useAuthStore();
const canEdit = inject('canEdit', computed(() => props.isOwner));

const activeNote = ref(null);
const isNew = ref(false);
const isEditing = ref(false);
const editTitle = ref('');
const editContent = ref('');
const saveSuccess = ref(false);
const errorMsg = ref('');
const pendingDelete = ref(null);
const contentEl = ref(null);
const titleEl = ref(null);
const searchQuery = ref('');
const activeFilter = ref('all');
const selectedTag = ref('');
const editorMode = ref('write');
const focusEditor = ref(false);

let savedTimer = null;
let initialNoteRequestId = 0;

marked.setOptions({ breaks: true, gfm: true });

const editorModes = [
  { id: 'write', label: 'Write' },
  { id: 'split', label: 'Both' },
  { id: 'preview', label: 'Preview' },
];

const formattingActions = [
  { id: 'heading', label: 'H2', title: 'Heading' },
  { id: 'bold', label: 'B', title: 'Bold' },
  { id: 'italic', label: 'I', title: 'Italic' },
  { id: 'check', label: '☑', title: 'Checklist item' },
  { id: 'bullet', label: '•', title: 'Bulleted list' },
  { id: 'quote', label: '❝', title: 'Quote' },
  { id: 'code', label: '</>', title: 'Code' },
  { id: 'link', label: 'Link', title: 'Link' },
  { id: 'divider', label: '—', title: 'Divider' },
];

const currentUserId = computed(() => authStore.user?.id || authStore.user?.sub || authStore.user?._id);
const shortcutKey = computed(() => (/Mac|iPhone|iPad|iPod/.test(navigator.platform) ? '⌘' : 'Ctrl'));

const sortedNotes = computed(() => [...notesStore.notes].sort((a, b) => {
  if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
  return timestamp(b.updated_at) - timestamp(a.updated_at);
}));

const noteCountLabel = computed(() => {
  const count = notesStore.notes.length;
  return `${count} ${count === 1 ? 'note' : 'notes'}`;
});

const filters = computed(() => [
  { id: 'all', label: 'All', count: notesStore.notes.length },
  { id: 'pinned', label: 'Pinned', count: notesStore.notes.filter((note) => note.pinned).length },
  { id: 'mine', label: 'Mine', count: notesStore.notes.filter((note) => note.user_id === currentUserId.value).length },
]);

const availableTags = computed(() => {
  const tags = new Set();
  notesStore.notes.forEach((note) => noteTags(note).forEach((tag) => tags.add(tag)));
  return [...tags].sort((a, b) => a.localeCompare(b));
});

const filteredNotes = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();

  return sortedNotes.value.filter((note) => {
    if (activeFilter.value === 'pinned' && !note.pinned) return false;
    if (activeFilter.value === 'mine' && note.user_id !== currentUserId.value) return false;
    if (selectedTag.value && !noteTags(note).includes(selectedTag.value)) return false;

    if (!query) return true;
    const haystack = [
      note.title,
      note.content,
      note.username,
      ...noteTags(note).map((tag) => `#${tag}`),
    ].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(query);
  });
});

const renderedContent = computed(() => renderMarkdown(activeNote.value?.content || ''));
const editorRenderedContent = computed(() => renderMarkdown(editContent.value || ''));

const activeTags = computed(() => {
  if (!activeNote.value) return [];
  const title = isEditing.value ? editTitle.value : activeNote.value.title;
  const content = isEditing.value ? editContent.value : activeNote.value.content;
  return extractTags(`${title || ''} ${content || ''}`);
});

const activeMetrics = computed(() => {
  const content = isEditing.value ? editContent.value : activeNote.value?.content || '';
  const words = wordCount(content);
  return { words, readTime: readTimeForWords(words) };
});

const isDirty = computed(() => {
  if (!isEditing.value || !activeNote.value) return false;
  if (isNew.value) return !!editTitle.value.trim() || !!editContent.value;
  return editTitle.value.trim() !== (activeNote.value.title || '') || editContent.value !== (activeNote.value.content || '');
});

onMounted(async () => {
  await notesStore.fetchNotes(props.boardId);
  openInitialNote();
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  clearTimeout(savedTimer);
});

watch(() => props.initialNoteId, openInitialNote);
watch(() => notesStore.notes, (notes) => {
  openInitialNote();
  if (!activeNote.value?._id || isNew.value || isEditing.value) return;
  const fresh = notes.find((note) => note._id === activeNote.value._id);
  if (fresh) activeNote.value = fresh;
}, { deep: true });

async function openInitialNote() {
  const noteId = props.initialNoteId;
  if (!noteId || activeNote.value?._id === noteId) return;

  const note = notesStore.notes.find((n) => n._id === noteId);
  if (note) {
    openNote(note);
    return;
  }

  if (notesStore.loading) return;

  const requestId = ++initialNoteRequestId;
  try {
    const fetched = await notesStore.fetchNote(props.boardId, noteId);
    if (requestId === initialNoteRequestId && props.initialNoteId === noteId) {
      openNote(fetched);
    }
  } catch {
    // Leave the panel on the list if the note is unavailable.
  }
}

function requestClose() {
  if (!confirmDiscard()) return;
  emit('close');
}

function confirmDiscard() {
  if (!isDirty.value) return true;
  return window.confirm('Discard unsaved note changes?');
}

function timestamp(iso) {
  const time = Date.parse(iso || '');
  return Number.isNaN(time) ? 0 : time;
}

function renderMarkdown(content) {
  if (!content) return '';
  const raw = marked.parse(content);
  return DOMPurify.sanitize(raw);
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

function formatFullDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function initials(name) {
  if (!name) return '?';
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function plainText(markdown = '') {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[>#*_~|`-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function wordCount(content = '') {
  const text = plainText(content);
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

function readTimeForWords(words) {
  if (!words) return '0 min read';
  const minutes = Math.max(1, Math.ceil(words / 220));
  return `${minutes} min read`;
}

function readTimeFor(content = '') {
  return readTimeForWords(wordCount(content));
}

function excerpt(note) {
  const text = plainText(note.content || '');
  if (!text) return 'No content yet';
  return text.length > 150 ? `${text.slice(0, 150).trim()}…` : text;
}

function extractTags(text = '') {
  const matches = text.match(/#[A-Za-z0-9_-]+/g) || [];
  return [...new Set(matches.map((tag) => tag.slice(1).toLowerCase()))];
}

function noteTags(note) {
  return extractTags(`${note.title || ''} ${note.content || ''}`);
}

function openNote(note) {
  if (isEditing.value && isDirty.value && !confirmDiscard()) return;
  activeNote.value = note;
  isNew.value = false;
  isEditing.value = false;
  editTitle.value = note.title || '';
  editContent.value = note.content || '';
  errorMsg.value = '';
  saveSuccess.value = false;
  focusEditor.value = false;
}

function startCreate() {
  if (isEditing.value && isDirty.value && !confirmDiscard()) return;
  const now = new Date().toISOString();
  activeNote.value = {
    _id: null,
    username: authStore.user?.username || '',
    user_id: currentUserId.value,
    title: '',
    content: '',
    pinned: false,
    created_at: now,
    updated_at: now,
  };
  isNew.value = true;
  isEditing.value = true;
  editTitle.value = '';
  editContent.value = '';
  editorMode.value = 'write';
  focusEditor.value = true;
  errorMsg.value = '';
  saveSuccess.value = false;
  nextTick(() => titleEl.value?.focus());
}

function startEdit() {
  if (!activeNote.value || !canEdit.value) return;
  editTitle.value = activeNote.value.title || '';
  editContent.value = activeNote.value.content || '';
  if (editorMode.value === 'preview') editorMode.value = 'write';
  focusEditor.value = true;
  isEditing.value = true;
  errorMsg.value = '';
  nextTick(() => contentEl.value?.focus());
}

function discardEdit() {
  if (!confirmDiscard()) return;
  if (isNew.value) {
    backToList(true);
    return;
  }
  editTitle.value = activeNote.value?.title || '';
  editContent.value = activeNote.value?.content || '';
  isEditing.value = false;
  focusEditor.value = false;
  errorMsg.value = '';
}

function backToList(force = false) {
  if (!force && !confirmDiscard()) return;
  activeNote.value = null;
  isNew.value = false;
  isEditing.value = false;
  editTitle.value = '';
  editContent.value = '';
  saveSuccess.value = false;
  errorMsg.value = '';
  focusEditor.value = false;
  clearTimeout(savedTimer);
}

function canDeleteNote(note) {
  if (!note || !note._id) return false;
  return props.isOwner || note.user_id === currentUserId.value;
}

function confirmDelete(note) {
  pendingDelete.value = note;
}

async function handleDelete() {
  const note = pendingDelete.value;
  if (!note) return;
  try {
    await notesStore.deleteNote(props.boardId, note._id);
    pendingDelete.value = null;
    if (activeNote.value?._id === note._id) backToList(true);
  } catch {
    errorMsg.value = 'Failed to delete note. Please try again.';
  }
}

async function handleSave() {
  if (!editTitle.value.trim()) {
    errorMsg.value = 'A title is required.';
    nextTick(() => titleEl.value?.focus());
    return;
  }

  errorMsg.value = '';
  const payload = {
    title: editTitle.value.trim(),
    content: editContent.value,
    pinned: !!activeNote.value?.pinned,
  };

  try {
    if (isNew.value) {
      const created = await notesStore.createNote(props.boardId, payload);
      activeNote.value = created;
      isNew.value = false;
    } else {
      const updated = await notesStore.updateNote(props.boardId, activeNote.value._id, payload);
      activeNote.value = updated;
    }
    editTitle.value = activeNote.value.title || '';
    editContent.value = activeNote.value.content || '';
    isEditing.value = false;
    focusEditor.value = false;
    showSaved();
  } catch {
    errorMsg.value = 'Failed to save note. Please try again.';
  }
}

async function togglePinned(note = activeNote.value) {
  if (!note || !note._id || !canEdit.value || notesStore.saving) return;

  const editingActive = isEditing.value && activeNote.value?._id === note._id;
  const title = editingActive ? editTitle.value.trim() : note.title || '';
  const content = editingActive ? editContent.value : note.content || '';

  if (!title.trim()) {
    errorMsg.value = 'A title is required before pinning.';
    return;
  }

  try {
    const updated = await notesStore.updateNote(props.boardId, note._id, {
      title: title.trim(),
      content,
      pinned: !note.pinned,
    });
    if (activeNote.value?._id === note._id) {
      activeNote.value = updated;
      editTitle.value = updated.title || '';
      editContent.value = updated.content || '';
    }
    showSaved();
  } catch {
    errorMsg.value = 'Failed to update note. Please try again.';
  }
}

function showSaved() {
  saveSuccess.value = true;
  clearTimeout(savedTimer);
  savedTimer = setTimeout(() => { saveSuccess.value = false; }, 2000);
}

function handleKeydown(event) {
  if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 's') return;
  if (!isEditing.value) return;
  event.preventDefault();
  if (!notesStore.saving) handleSave();
}

function insertMarkdown(action) {
  const el = contentEl.value;
  if (!el) return;

  const start = el.selectionStart ?? editContent.value.length;
  const end = el.selectionEnd ?? editContent.value.length;
  const selected = editContent.value.slice(start, end);
  let replacement = selected;
  let cursorStart = start;
  let cursorEnd = start;

  if (action === 'heading') {
    replacement = selected ? selected.split('\n').map((line) => `## ${line.replace(/^#+\s*/, '')}`).join('\n') : '## Heading';
    cursorStart = start + 3;
    cursorEnd = start + replacement.length;
  } else if (action === 'bold') {
    replacement = `**${selected || 'bold text'}**`;
    cursorStart = start + 2;
    cursorEnd = start + replacement.length - 2;
  } else if (action === 'italic') {
    replacement = `*${selected || 'italic text'}*`;
    cursorStart = start + 1;
    cursorEnd = start + replacement.length - 1;
  } else if (action === 'check') {
    replacement = selected ? selected.split('\n').map((line) => `- [ ] ${line}`).join('\n') : '- [ ] Checklist item';
    cursorStart = start + 6;
    cursorEnd = start + replacement.length;
  } else if (action === 'bullet') {
    replacement = selected ? selected.split('\n').map((line) => `- ${line}`).join('\n') : '- List item';
    cursorStart = start + 2;
    cursorEnd = start + replacement.length;
  } else if (action === 'quote') {
    replacement = selected ? selected.split('\n').map((line) => `> ${line}`).join('\n') : '> Quote';
    cursorStart = start + 2;
    cursorEnd = start + replacement.length;
  } else if (action === 'code') {
    if (selected.includes('\n')) {
      replacement = `\`\`\`\n${selected}\n\`\`\``;
      cursorStart = start + 4;
      cursorEnd = start + replacement.length - 4;
    } else {
      replacement = `\`${selected || 'code'}\``;
      cursorStart = start + 1;
      cursorEnd = start + replacement.length - 1;
    }
  } else if (action === 'link') {
    replacement = `[${selected || 'link text'}](https://)`;
    cursorStart = start + replacement.length - 9;
    cursorEnd = start + replacement.length - 1;
  } else if (action === 'divider') {
    replacement = `${selected ? `${selected}\n\n` : ''}---`;
    cursorStart = start + replacement.length;
    cursorEnd = cursorStart;
  }

  editContent.value = `${editContent.value.slice(0, start)}${replacement}${editContent.value.slice(end)}`;
  nextTick(() => {
    contentEl.value?.focus();
    contentEl.value?.setSelectionRange(cursorStart, cursorEnd);
  });
}
</script>

<style scoped>
.note-prose :deep(*) { max-width: 100%; }
.note-prose :deep(h1) { font-size: 1.5rem; line-height: 2rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.75rem; color: inherit; }
.note-prose :deep(h2) { font-size: 1.25rem; line-height: 1.75rem; font-weight: 700; margin-top: 1.25rem; margin-bottom: 0.625rem; color: inherit; }
.note-prose :deep(h3) { font-size: 1.125rem; line-height: 1.5rem; font-weight: 600; margin-top: 1rem; margin-bottom: 0.5rem; color: inherit; }
.note-prose :deep(h4) { font-size: 1rem; font-weight: 600; margin-top: 0.875rem; margin-bottom: 0.375rem; color: inherit; }
.note-prose :deep(p) { margin-bottom: 0.75rem; }
.note-prose :deep(p:last-child) { margin-bottom: 0; }
.note-prose :deep(ul) { list-style-type: disc; padding-left: 1.4rem; margin-bottom: 0.75rem; }
.note-prose :deep(ol) { list-style-type: decimal; padding-left: 1.4rem; margin-bottom: 0.75rem; }
.note-prose :deep(li) { margin-bottom: 0.25rem; }
.note-prose :deep(li > p) { display: inline; margin: 0; }
.note-prose :deep(input[type='checkbox']) { margin-right: 0.5rem; border-radius: 0.25rem; vertical-align: -0.1rem; }
.note-prose :deep(code) { font-size: 0.8125rem; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace; padding: 0.125rem 0.375rem; border-radius: 0.375rem; }
.note-prose :deep(pre) { border-radius: 0.75rem; padding: 1rem; margin: 1rem 0; overflow-x: auto; }
.note-prose :deep(pre code) { padding: 0; background: transparent; border-radius: 0; }
.note-prose :deep(blockquote) { border-left: 4px solid; padding: 0.25rem 0 0.25rem 1rem; font-style: italic; margin: 1rem 0; }
.note-prose :deep(a) { text-decoration: underline; text-underline-offset: 3px; font-weight: 500; }
.note-prose :deep(hr) { margin: 1.5rem 0; border: 0; border-top: 1px solid; }
.note-prose :deep(table) { display: block; width: 100%; overflow-x: auto; font-size: 0.875rem; border-collapse: collapse; margin: 1rem 0; }
.note-prose :deep(th),
.note-prose :deep(td) { padding: 0.5rem 0.75rem; text-align: left; border: 1px solid; }
.note-prose :deep(th) { font-weight: 600; }
.note-prose :deep(img) { max-width: 100%; border-radius: 0.75rem; margin: 1rem 0; }

.note-prose :deep(code) { background: rgb(244 244 245); color: rgb(190 24 93); }
.note-prose :deep(pre) { background: rgb(244 244 245); }
.note-prose :deep(pre code) { color: rgb(39 39 42); }
.note-prose :deep(blockquote) { border-color: rgb(212 212 216); color: rgb(82 82 91); }
.note-prose :deep(a) { color: rgb(124 58 237); }
.note-prose :deep(a:hover) { color: rgb(109 40 217); }
.note-prose :deep(hr) { border-color: rgb(228 228 231); }
.note-prose :deep(th) { background: rgb(250 250 250); border-color: rgb(212 212 216); }
.note-prose :deep(td) { border-color: rgb(212 212 216); }

:root.dark .note-prose :deep(code),
.dark .note-prose :deep(code) { background: rgb(39 39 42); color: rgb(244 114 182); }
:root.dark .note-prose :deep(pre),
.dark .note-prose :deep(pre) { background: rgb(24 24 27); }
:root.dark .note-prose :deep(pre code),
.dark .note-prose :deep(pre code) { color: rgb(228 228 231); }
:root.dark .note-prose :deep(blockquote),
.dark .note-prose :deep(blockquote) { border-color: rgb(82 82 91); color: rgb(161 161 170); }
:root.dark .note-prose :deep(a),
.dark .note-prose :deep(a) { color: rgb(167 139 250); }
:root.dark .note-prose :deep(a:hover),
.dark .note-prose :deep(a:hover) { color: rgb(196 181 253); }
:root.dark .note-prose :deep(hr) { border-color: rgb(63 63 70); }
.dark .note-prose :deep(hr) { border-color: rgb(63 63 70); }
:root.dark .note-prose :deep(th),
.dark .note-prose :deep(th) { background: rgb(39 39 42); border-color: rgb(82 82 91); }
:root.dark .note-prose :deep(td),
.dark .note-prose :deep(td) { border-color: rgb(82 82 91); }
</style>
