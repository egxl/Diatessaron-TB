/**
 * DIATESSARON-TB — Modern Gospel Harmony Reader & Exegesis Application
 * 100% Static, Zero-Dependency, GitHub Pages Ready.
 */

(function () {
    'use strict';

    // =========================================================================
    // STATE & CONFIGURATION
    // =========================================================================
    const State = {
        indexData: null,
        currentChapterId: 1,
        currentChapterData: null,
        selectedVerseId: null,
        cachedChapters: new Map(),
        searchIndex: null,
        isSearchLoading: false,

        // User Preferences (Persisted in localStorage)
        preferences: {
            theme: localStorage.getItem('diatessaron_theme') || 'light',
            fontFamily: localStorage.getItem('diatessaron_font') || 'serif',
            fontSize: parseInt(localStorage.getItem('diatessaron_font_size') || '100', 10),
            colorHarmony: localStorage.getItem('diatessaron_color_harmony') === 'true',
            bookmarks: JSON.parse(localStorage.getItem('diatessaron_bookmarks') || '[]')
        },

        // Audio TTS State
        audio: {
            synth: window.speechSynthesis,
            utterance: null,
            isPlaying: false,
            activeVerseIndex: 0,
            rate: 1.0,
            voice: null
        }
    };

    // DOM Elements Cache
    const DOM = {};

    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    document.addEventListener('DOMContentLoaded', async () => {
        cacheDOMElements();
        applyPreferences();
        setupEventListeners();
        setupKeyboardShortcuts();
        setupSpeechVoices();

        try {
            // Strict relative path for GitHub Pages compatibility
            const response = await fetch('./data/index.json');
            if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
            State.indexData = await response.json();

            renderSidebarChronology();
            renderSidebarManuscript();
            renderSidebarStats();

            // Handle URL Hash or default to Chapter 1
            const hash = window.location.hash;
            const parsed = parseHash(hash);
            if (parsed.chapterId) {
                await loadChapter(parsed.chapterId, parsed.verseId);
            } else {
                await loadChapter(1);
            }
        } catch (err) {
            console.error('Failed to load Diatessaron index:', err);
            if (DOM.chapterContent) {
                DOM.chapterContent.innerHTML = `
                    <div style="text-align: center; padding: 4rem 1rem;">
                        <h2 style="font-family: var(--font-serif); margin-bottom: 0.5rem;">Gagal Memuat Data</h2>
                        <p style="color: var(--text-muted); font-size: 0.95rem;">Pastikan file data tersedia dan web server lokal aktif.</p>
                    </div>`;
            }
        }
    });

    function cacheDOMElements() {
        DOM.html = document.documentElement;
        DOM.sidebar = document.getElementById('sidebar');
        DOM.inspector = document.getElementById('inspector-pane');
        DOM.readingCanvasWrap = document.getElementById('reading-canvas-wrap');
        DOM.chapterContent = document.getElementById('chapter-content-container');
        DOM.inspectorContent = document.getElementById('inspector-content');
        DOM.chapterPickerBtn = document.getElementById('chapter-picker-btn');
        DOM.currentChapterPill = document.getElementById('current-chapter-pill');
        DOM.chapterJumpPopover = document.getElementById('chapter-jump-popover');
        DOM.chapterJumpFilter = document.getElementById('chapter-jump-filter');
        DOM.chapterJumpClear = document.getElementById('chapter-jump-filter-clear');
        DOM.chapterJumpList = document.getElementById('chapter-jump-list');
        DOM.chapterJumpCloseBtn = document.getElementById('chapter-jump-close-btn');

        DOM.moreMenuBtn = document.getElementById('more-menu-btn');
        DOM.moreMenuPopover = document.getElementById('more-menu-popover');
        DOM.moreHarmonyStatus = document.getElementById('more-harmony-status');
        DOM.appScrim = document.getElementById('app-scrim');

        // Gospel Meter
        DOM.meterMat = document.getElementById('meter-mat');
        DOM.meterMrk = document.getElementById('meter-mrk');
        DOM.meterLuk = document.getElementById('meter-luk');
        DOM.meterYoh = document.getElementById('meter-yoh');

        // Modals
        DOM.searchModal = document.getElementById('search-modal');
        DOM.searchInput = document.getElementById('search-input');
        DOM.searchResultsList = document.getElementById('search-results-list');
        DOM.displayModal = document.getElementById('display-modal');
        DOM.aboutModal = document.getElementById('about-modal');

        // Audio Dock
        DOM.audioDock = document.getElementById('audio-dock');
        DOM.audioPlayPauseBtn = document.getElementById('audio-play-pause-btn');
        DOM.audioTrackInfo = document.getElementById('audio-track-info');
        DOM.audioSpeedSelect = document.getElementById('audio-speed-select');
    }

    // =========================================================================
    // PREFERENCES & THEMES
    // =========================================================================
    function applyPreferences() {
        // Theme
        DOM.html.setAttribute('data-theme', State.preferences.theme);

        // Font Family
        if (State.preferences.fontFamily === 'sans') {
            DOM.html.style.setProperty('--font-serif', "var(--font-sans)");
        } else {
            DOM.html.style.removeProperty('--font-serif');
        }

        // Font Size
        const baseSize = (1.22 * (State.preferences.fontSize / 100)).toFixed(2);
        DOM.html.style.setProperty('--scripture-font-size', `${baseSize}rem`);

        // Color Harmony
        if (State.preferences.colorHarmony) {
            document.body.classList.add('harmony-mode-colors');
            const btn = document.getElementById('toggle-color-harmony-btn');
            if (btn) btn.classList.add('active');
        } else {
            document.body.classList.remove('harmony-mode-colors');
            const btn = document.getElementById('toggle-color-harmony-btn');
            if (btn) btn.classList.remove('active');
        }

        const sizeLabel = document.getElementById('font-size-label');
        if (sizeLabel) sizeLabel.textContent = `${State.preferences.fontSize}%`;
        const slider = document.getElementById('font-size-slider');
        if (slider) slider.value = State.preferences.fontSize;
    }

    function toggleTheme() {
        const themes = ['light', 'parchment', 'sepia', 'night'];
        const currentIdx = themes.indexOf(State.preferences.theme);
        const nextTheme = themes[(currentIdx + 1) % themes.length];
        setTheme(nextTheme);
    }

    function setTheme(theme) {
        State.preferences.theme = theme;
        localStorage.setItem('diatessaron_theme', theme);
        DOM.html.setAttribute('data-theme', theme);
    }

    function toggleColorHarmony() {
        State.preferences.colorHarmony = !State.preferences.colorHarmony;
        localStorage.setItem('diatessaron_color_harmony', State.preferences.colorHarmony);
        applyPreferences();
        updateMoreMenuBadges();
    }

    // =========================================================================
    // CHAPTER LOADING & RENDERING
    // =========================================================================
    async function loadChapter(chapterId, targetVerseId = null) {
        if (!State.indexData) return;
        chapterId = parseInt(chapterId, 10);
        if (chapterId < 1 || chapterId > 55) chapterId = 1;

        State.currentChapterId = chapterId;
        updateActiveSidebarCard(chapterId);

        // Check cache or fetch relative data file
        let chapterData = State.cachedChapters.get(chapterId);
        if (!chapterData) {
            try {
                const res = await fetch(`./data/bab_${chapterId}.json`);
                if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
                chapterData = await res.json();
                State.cachedChapters.set(chapterId, chapterData);
            } catch (err) {
                console.error(`Error loading chapter ${chapterId}:`, err);
                return;
            }
        }

        State.currentChapterData = chapterData;
        renderChapterCanvas(chapterData);
        updateHeaderGospelMeter(chapterData.stats);
        updateChapterPill(chapterData);

        // Update URL Hash cleanly
        if (targetVerseId) {
            selectVerse(targetVerseId, true);
        } else {
            history.replaceState(null, '', `#bab-${chapterId}`);
            DOM.readingCanvasWrap.scrollTop = 0;
            // Clear inspector if changing chapter
            renderInspectorEmpty();
        }
    }

    function updateChapterPill(chapter) {
        if (DOM.currentChapterPill) {
            DOM.currentChapterPill.textContent = `Bab ${chapter.id}`;
        }
        if (DOM.chapterPickerBtn) {
            const title = chapter.title_id || chapter.title || '';
            DOM.chapterPickerBtn.setAttribute('title', `Bab ${chapter.id}: ${title} — Klik untuk pilih bab`);
            DOM.chapterPickerBtn.setAttribute('aria-label', `Bab ${chapter.id}: ${title}`);
        }
    }

    function updateHeaderGospelMeter(stats) {
        if (!stats) return;
        const total = (stats.mat + stats.mrk + stats.luk + stats.yoh) || 1;
        DOM.meterMat.style.width = `${((stats.mat / total) * 100).toFixed(1)}%`;
        DOM.meterMrk.style.width = `${((stats.mrk / total) * 100).toFixed(1)}%`;
        DOM.meterLuk.style.width = `${((stats.luk / total) * 100).toFixed(1)}%`;
        DOM.meterYoh.style.width = `${((stats.yoh / total) * 100).toFixed(1)}%`;
    }

    function renderChapterCanvas(chapter) {
        const epoch = State.indexData.epochs.find(e => e.id === chapter.epoch_id) || {};
        const prevChapter = chapter.id > 1 ? State.indexData.chapters.find(c => c.id === chapter.id - 1) : null;
        const nextChapter = chapter.id < 55 ? State.indexData.chapters.find(c => c.id === chapter.id + 1) : null;

        // Build HTML
        let html = `
            <div class="chapter-hero">
                <div class="chapter-hero-epoch">${epoch.title || 'Kronologi Injil'}</div>
                <div class="chapter-hero-number">BAB ${chapter.id}</div>
                <h1 class="chapter-hero-title">${chapter.title_id || chapter.title}</h1>
                ${chapter.title_en ? `<div class="chapter-hero-subtitle">${chapter.title_en}</div>` : ''}
                
                <div class="chapter-hero-bar">
                    <div class="hero-stats-wrap">
                        <span><strong>${chapter.total_segments}</strong> ayat harmoni</span>
                        <span>•</span>
                        <span><strong>${chapter.total_words}</strong> kata</span>
                        ${chapter.arabic_page_range ? `<span>•</span> <span>Naskah Arab ${chapter.arabic_page_range}</span>` : ''}
                    </div>
                    <div class="hero-gospel-pills">
                        ${chapter.stats.mat ? `<span class="gospel-pill-btn mat">Matius ${chapter.stats.mat}</span>` : ''}
                        ${chapter.stats.mrk ? `<span class="gospel-pill-btn mrk">Markus ${chapter.stats.mrk}</span>` : ''}
                        ${chapter.stats.luk ? `<span class="gospel-pill-btn luk">Lukas ${chapter.stats.luk}</span>` : ''}
                        ${chapter.stats.yoh ? `<span class="gospel-pill-btn yoh">Yohanes ${chapter.stats.yoh}</span>` : ''}
                    </div>
                </div>
            </div>

            <div class="verses-stream" id="verses-stream" style="font-size: var(--scripture-font-size, 1.22rem);">
        `;

        let lastDVerse = null;
        let lastArabicPage = null;

        chapter.verses.forEach((v, index) => {
            // Milestone for new Arabic manuscript page
            if (v.arabic_page && v.arabic_page !== lastArabicPage) {
                lastArabicPage = v.arabic_page;
                html += `
                    <div class="arabic-page-milestone">
                        <span class="arabic-page-badge" title="Tanda halaman naskah kuno Diatessaron terjemahan bahasa Arab">
                            Halaman Arab ${v.arabic_page}
                        </span>
                    </div>`;
            }

            // Section anchor number (§)
            const showDVerse = v.diatessaron_verse && v.diatessaron_verse !== lastDVerse;
            if (showDVerse) {
                lastDVerse = v.diatessaron_verse;
            }

            // Check if first verse for drop cap
            const isFirst = index === 0;
            let verseText = v.text;
            let dropCapHtml = '';

            if (isFirst && verseText.length > 0) {
                const firstChar = verseText.charAt(0);
                dropCapHtml = `<span class="drop-cap">${firstChar}</span>`;
                verseText = verseText.slice(1);
            }

            html += `
                <span class="verse-segment source-${v.book_code}" 
                      id="verse-${v.id}"
                      data-id="${v.id}"
                      data-ref="${v.ref}"
                      data-ref-id="${v.ref_id}"
                      data-book="${v.book_code}"
                      data-d-verse="${v.diatessaron_verse || ''}"
                      data-page="${v.arabic_page || ''}"
                      data-footnote="${v.footnote_id || ''}"
                      title="${v.ref_id || v.ref} (Diatessaron §${chapter.id}:${v.diatessaron_verse || ''})">
                    ${dropCapHtml}
                    ${showDVerse ? `<span class="d-verse-num">§${v.diatessaron_verse}</span>` : ''}
                    ${verseText}
                    ${v.footnote_id ? `<span class="footnote-anchor" data-fn="${v.footnote_id}" title="Lihat catatan varian naskah">*</span>` : ''}
                </span> `;
        });

        html += `
            </div>

            <div class="chapter-nav-footer">
                ${prevChapter ? `
                    <button class="nav-ch-btn" onclick="window.DiatessaronApp.navigateToChapter(${prevChapter.id})">
                        <span class="nav-ch-dir">← Bab Sebelumnya</span>
                        <span class="nav-ch-title">Bab ${prevChapter.id}: ${prevChapter.title_id || prevChapter.title}</span>
                    </button>
                ` : `<div></div>`}

                ${nextChapter ? `
                    <button class="nav-ch-btn" style="text-align: right;" onclick="window.DiatessaronApp.navigateToChapter(${nextChapter.id})">
                        <span class="nav-ch-dir">Bab Selanjutnya →</span>
                        <span class="nav-ch-title">Bab ${nextChapter.id}: ${nextChapter.title_id || nextChapter.title}</span>
                    </button>
                ` : `<div></div>`}
            </div>
        `;

        DOM.chapterContent.innerHTML = html;

        // Attach Verse Click Listeners
        const verseElements = DOM.chapterContent.querySelectorAll('.verse-segment');
        verseElements.forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                const vId = parseInt(el.dataset.id, 10);
                selectVerse(vId);
            });
        });

        // Footnote Anchors Click Listeners
        const fnAnchors = DOM.chapterContent.querySelectorAll('.footnote-anchor');
        fnAnchors.forEach(a => {
            a.addEventListener('click', (e) => {
                e.stopPropagation();
                const parentVerse = a.closest('.verse-segment');
                if (parentVerse) {
                    const vId = parseInt(parentVerse.dataset.id, 10);
                    selectVerse(vId);
                    openInspector();
                }
            });
        });
    }

    // =========================================================================
    // VERSE SELECTION & EXEGESIS INSPECTOR
    // =========================================================================
    function selectVerse(verseId, scrollIntoView = false) {
        State.selectedVerseId = verseId;
        const verseEl = document.getElementById(`verse-${verseId}`);

        // Update visual highlight
        document.querySelectorAll('.verse-segment.selected').forEach(el => el.classList.remove('selected'));
        if (verseEl) {
            verseEl.classList.add('selected');
            if (scrollIntoView) {
                verseEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        // Update URL hash
        history.replaceState(null, '', `#bab-${State.currentChapterId}:v${verseId}`);

        // Render Inspector Details
        renderInspectorDetails(verseId);
    }

    function renderInspectorDetails(verseId) {
        if (!State.currentChapterData) return;
        const verse = State.currentChapterData.verses.find(v => v.id === verseId);
        if (!verse) return;

        const chId = State.currentChapterData.id;
        const isBookmarked = State.preferences.bookmarks.some(b => b.ch === chId && b.v === verseId);

        // Find textual critical footnote if available
        let footnoteHtml = '';
        if (verse.footnote_id && State.currentChapterData.footnotes) {
            const fn = State.currentChapterData.footnotes.find(f => f.id === verse.footnote_id);
            if (fn) {
                footnoteHtml = `
                    <div class="apparatus-box">
                        <div class="apparatus-title">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="16" x2="12" y2="12"></line>
                                <line x1="12" y1="8" x2="12.01" y2="8"></line>
                            </svg>
                            ${fn.title || 'Catatan Varian Naskah'}
                        </div>
                        <p>${fn.text}</p>
                    </div>`;
            }
        }

        // Author profile info
        const bookMeta = {
            mat: { name: 'Injil Matius', author: 'Matius (Lewi), murid dan rasul Yesus', desc: 'Menekankan Yesus sebagai Raja Mesias penggenap nubuat Perjanjian Lama.' },
            mrk: { name: 'Injil Markus', author: 'Yohanes Markus, rekan sekerja Rasul Petrus', desc: 'Menekankan Yesus sebagai Hamba yang menderita dan berkuasa dalam tindakan.' },
            luk: { name: 'Injil Lukas', author: 'Lukas, dokter dan sejarawan non-Yahudi', desc: 'Menekankan Yesus sebagai Anak Manusia dan Juruselamat bagi segala bangsa.' },
            yoh: { name: 'Injil Yohanes', author: 'Yohanes, murid yang dikasihi Yesus', desc: 'Menekankan Yesus sebagai Firman Allah yang kekal (Logos) dan Anak Allah.' }
        }[verse.book_code] || { name: 'Kanonik', author: 'Injil', desc: '' };

        // Alkitab SABDA URL Link
        const sabdaQuery = encodeURIComponent(verse.ref_id || verse.ref);
        const sabdaUrl = `https://alkitab.sabda.org/search.php?search=${sabdaQuery}`;

        const html = `
            <div class="exegesis-card">
                <div class="exegesis-card-ref">
                    <span class="exegesis-canonical-tag">${verse.ref_id || verse.ref}</span>
                    <span class="exegesis-diatessaron-tag">Diatessaron §${chId}:${verse.diatessaron_verse || ''}</span>
                </div>

                <div class="exegesis-text-preview">"${verse.text}"</div>

                <div style="margin-top: 0.5rem;">
                    <span class="exegesis-gospel-badge ${verse.book_code}">${bookMeta.name}</span>
                </div>

                ${footnoteHtml}

                <div style="margin-top: 1rem; font-size: 0.8rem; color: var(--text-muted); line-height: 1.4;">
                    <strong>${bookMeta.author}</strong><br>
                    <span>${bookMeta.desc}</span>
                </div>

                ${verse.arabic_page ? `
                    <div style="margin-top: 0.75rem; font-size: 0.78rem; color: var(--text-muted);">
                        📖 <strong>Manuskrip Kuno:</strong> Halaman Arab ke-${verse.arabic_page}
                    </div>` : ''}

                <div class="inspector-actions-grid">
                    <button class="inspector-action-btn" onclick="window.DiatessaronApp.copyCitation(${verse.id})">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        Salin Ayat
                    </button>
                    <a class="inspector-action-btn" href="${sabdaUrl}" target="_blank" rel="noopener noreferrer">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                        Teks SABDA
                    </a>
                    <button class="inspector-action-btn" onclick="window.DiatessaronApp.toggleBookmark(${chId}, ${verse.id})">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="${isBookmarked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                        </svg>
                        ${isBookmarked ? 'Tersimpan' : 'Tandai'}
                    </button>
                    <button class="inspector-action-btn" onclick="window.DiatessaronApp.speakSingleVerse(${verse.id})">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                        </svg>
                        Dengarkan
                    </button>
                </div>
            </div>
        `;

        DOM.inspectorContent.innerHTML = html;
        openInspector();
    }

    function renderInspectorEmpty() {
        DOM.inspectorContent.innerHTML = `
            <div class="inspector-empty-state">
                <div class="inspector-empty-icon">📖</div>
                <p style="font-weight: 600; margin-bottom: 0.35rem;">Pilih ayat pada teks</p>
                <p style="font-size: 0.8rem;">Klik pada kalimat mana saja dalam bacaan untuk memeriksa asal Injil kanonik, halaman naskah kuno, serta varian teks.</p>
            </div>`;
    }

    function isMobile() {
        return window.innerWidth <= 768 || window.matchMedia('(max-width: 768px)').matches;
    }

    function updateScrim() {
        if (!DOM.appScrim) return;
        const hasMobileSidebar = DOM.sidebar && DOM.sidebar.classList.contains('mobile-open');
        const hasMobileInspector = DOM.inspector && DOM.inspector.classList.contains('mobile-open');
        const hasChapterJump = DOM.chapterJumpPopover && DOM.chapterJumpPopover.classList.contains('active');
        const hasMoreMenu = DOM.moreMenuPopover && DOM.moreMenuPopover.classList.contains('active');

        if (hasMobileSidebar || hasMobileInspector || (isMobile() && hasChapterJump) || hasMoreMenu) {
            DOM.appScrim.classList.add('active');
            if (isMobile() && (hasMobileSidebar || hasMobileInspector || hasChapterJump)) {
                document.body.style.overflow = 'hidden';
            }
        } else {
            DOM.appScrim.classList.remove('active');
            document.body.style.removeProperty('overflow');
        }
    }

    function closeAllPopoversAndDrawers() {
        closeChapterJump();
        closeMoreMenu();
        if (DOM.sidebar && DOM.sidebar.classList.contains('mobile-open')) {
            DOM.sidebar.classList.remove('mobile-open');
        }
        if (DOM.inspector && DOM.inspector.classList.contains('mobile-open')) {
            DOM.inspector.classList.remove('mobile-open');
        }
        document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
        updateScrim();
    }

    function openInspector() {
        if (DOM.inspector) {
            DOM.inspector.classList.remove('collapsed');
            if (isMobile()) {
                DOM.inspector.classList.add('mobile-open');
                updateScrim();
            }
        }
    }

    function closeInspector() {
        if (DOM.inspector) {
            DOM.inspector.classList.add('collapsed');
            DOM.inspector.classList.remove('mobile-open');
            updateScrim();
        }
    }

    // =========================================================================
    // CHAPTER JUMP POPOVER / BOTTOM SHEET
    // =========================================================================
    let chapterJumpRendered = false;

    function renderChapterJumpList() {
        if (!DOM.chapterJumpList || !State.indexData) return;
        let html = '';
        State.indexData.epochs.forEach(epoch => {
            const epochChapters = State.indexData.chapters.filter(c => c.epoch_id === epoch.id);
            if (!epochChapters.length) return;

            html += `
                <div class="jump-epoch-group" data-epoch-id="${epoch.id}">
                    <div class="jump-epoch-title">${epoch.title}</div>
                    <div class="jump-epoch-items">
            `;

            epochChapters.forEach(ch => {
                const isActive = ch.id === State.currentChapterId;
                const searchKeywords = `${ch.id} ${ch.title_id || ''} ${ch.title || ''} ${ch.title_en || ''} ${epoch.title}`.toLowerCase();
                html += `
                    <button class="chapter-jump-item ${isActive ? 'active' : ''}" 
                            data-ch-id="${ch.id}" 
                            data-search="${searchKeywords}"
                            onclick="window.DiatessaronApp.navigateToChapter(${ch.id}); window.DiatessaronApp.closeChapterJump();">
                        <div class="jump-item-left">
                            <span class="jump-item-num">BAB ${ch.id}</span>
                            <span class="jump-item-title">${ch.title_id || ch.title}</span>
                            ${ch.title_en ? `<span class="jump-item-sub">${ch.title_en}</span>` : ''}
                        </div>
                        <div class="jump-item-right">
                            <div class="jump-item-badges">
                                ${ch.stats.mat ? `<span class="badge-mini mat">Mat</span>` : ''}
                                ${ch.stats.mrk ? `<span class="badge-mini mrk">Mrk</span>` : ''}
                                ${ch.stats.luk ? `<span class="badge-mini luk">Luk</span>` : ''}
                                ${ch.stats.yoh ? `<span class="badge-mini yoh">Yoh</span>` : ''}
                            </div>
                            <span class="jump-item-segments">${ch.total_segments} ayat</span>
                        </div>
                    </button>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        });

        DOM.chapterJumpList.innerHTML = html;
        chapterJumpRendered = true;
    }

    function openChapterJump() {
        if (!DOM.chapterJumpPopover) return;
        closeMoreMenu();
        if (!chapterJumpRendered) {
            renderChapterJumpList();
        } else {
            DOM.chapterJumpList.querySelectorAll('.chapter-jump-item').forEach(item => {
                const id = parseInt(item.dataset.chId, 10);
                item.classList.toggle('active', id === State.currentChapterId);
            });
        }

        DOM.chapterJumpPopover.classList.add('active');
        if (DOM.chapterPickerBtn) {
            DOM.chapterPickerBtn.setAttribute('aria-expanded', 'true');
            DOM.chapterPickerBtn.classList.add('active');
        }

        updateScrim();

        if (DOM.chapterJumpFilter) {
            DOM.chapterJumpFilter.value = '';
            filterChapterJumpList('');
            setTimeout(() => {
                DOM.chapterJumpFilter.focus();
            }, 60);
        }

        setTimeout(() => {
            const activeItem = DOM.chapterJumpList.querySelector('.chapter-jump-item.active');
            if (activeItem) {
                activeItem.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }
        }, 120);
    }

    function closeChapterJump() {
        if (!DOM.chapterJumpPopover) return;
        DOM.chapterJumpPopover.classList.remove('active');
        if (DOM.chapterPickerBtn) {
            DOM.chapterPickerBtn.setAttribute('aria-expanded', 'false');
            DOM.chapterPickerBtn.classList.remove('active');
        }
        updateScrim();
    }

    function toggleChapterJump() {
        if (DOM.chapterJumpPopover && DOM.chapterJumpPopover.classList.contains('active')) {
            closeChapterJump();
        } else {
            openChapterJump();
        }
    }

    function filterChapterJumpList(query) {
        if (!DOM.chapterJumpList) return;
        query = (query || '').trim().toLowerCase();
        if (DOM.chapterJumpClear) {
            DOM.chapterJumpClear.style.display = query ? 'inline-flex' : 'none';
        }

        const groups = DOM.chapterJumpList.querySelectorAll('.jump-epoch-group');
        groups.forEach(grp => {
            let visibleCount = 0;
            const items = grp.querySelectorAll('.chapter-jump-item');
            items.forEach(item => {
                const searchStr = item.dataset.search || '';
                const match = !query || searchStr.includes(query);
                item.style.display = match ? 'flex' : 'none';
                if (match) visibleCount++;
            });
            grp.style.display = visibleCount > 0 ? 'block' : 'none';
        });
    }

    // =========================================================================
    // MOBILE OVERFLOW "⋯" MENU
    // =========================================================================
    function openMoreMenu() {
        if (!DOM.moreMenuPopover) return;
        closeChapterJump();
        updateMoreMenuBadges();
        DOM.moreMenuPopover.classList.add('active');
        if (DOM.moreMenuBtn) {
            DOM.moreMenuBtn.setAttribute('aria-expanded', 'true');
            DOM.moreMenuBtn.classList.add('active');
        }
        updateScrim();
    }

    function closeMoreMenu() {
        if (!DOM.moreMenuPopover) return;
        DOM.moreMenuPopover.classList.remove('active');
        if (DOM.moreMenuBtn) {
            DOM.moreMenuBtn.setAttribute('aria-expanded', 'false');
            DOM.moreMenuBtn.classList.remove('active');
        }
        updateScrim();
    }

    function toggleMoreMenu() {
        if (DOM.moreMenuPopover && DOM.moreMenuPopover.classList.contains('active')) {
            closeMoreMenu();
        } else {
            openMoreMenu();
        }
    }

    function updateMoreMenuBadges() {
        if (DOM.moreHarmonyStatus) {
            DOM.moreHarmonyStatus.textContent = State.preferences.colorHarmony ? 'Aktif' : 'Mati';
            DOM.moreHarmonyStatus.className = `more-menu-badge ${State.preferences.colorHarmony ? 'active' : ''}`;
        }
    }

    // =========================================================================
    // SIDEBAR RENDERING (CHRONOLOGY, MANUSCRIPTS, STATS)
    // =========================================================================
    function renderSidebarChronology() {
        const container = document.getElementById('epoch-tree-container');
        if (!container || !State.indexData) return;

        let html = '';
        State.indexData.epochs.forEach(epoch => {
            const epochChapters = State.indexData.chapters.filter(c => c.epoch_id === epoch.id);
            html += `
                <div class="epoch-group">
                    <div class="epoch-header" onclick="this.nextElementSibling.classList.toggle('hidden')">
                        <span>${epoch.title}</span>
                        <span>▾</span>
                    </div>
                    <div class="chapter-cards-list">
            `;

            epochChapters.forEach(ch => {
                const totalG = (ch.stats.mat + ch.stats.mrk + ch.stats.luk + ch.stats.yoh) || 1;
                html += `
                    <button class="chapter-card-nav ${ch.id === State.currentChapterId ? 'active' : ''}" 
                            id="sidebar-card-${ch.id}"
                            onclick="window.DiatessaronApp.navigateToChapter(${ch.id})">
                        <div class="chapter-card-head">
                            <span class="chapter-card-num">BAB ${ch.id}</span>
                            <div class="chapter-card-badges">
                                ${ch.stats.mat ? `<span class="badge-mini mat">Mat</span>` : ''}
                                ${ch.stats.mrk ? `<span class="badge-mini mrk">Mrk</span>` : ''}
                                ${ch.stats.luk ? `<span class="badge-mini luk">Luk</span>` : ''}
                                ${ch.stats.yoh ? `<span class="badge-mini yoh">Yoh</span>` : ''}
                            </div>
                        </div>
                        <div class="chapter-card-title">${ch.title_id || ch.title}</div>
                        <div class="chapter-card-meta">
                            <span>${ch.total_segments} ayat</span>
                            ${ch.has_footnotes ? `<span>• 📝 Varian</span>` : ''}
                        </div>
                    </button>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    function renderSidebarManuscript() {
        const container = document.getElementById('manuscript-pages-container');
        if (!container || !State.indexData) return;

        let html = `
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.75rem; padding: 0 0.25rem;">
                Diatessaron terjemahan bahasa Arab terbagi dalam 208 penomoran halaman naskah kuno. Pilih halaman untuk menuju ke perikop terkait:
            </div>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.4rem;">
        `;

        // Gather Arabic pages from chapters
        for (let p = 2; p <= 209; p++) {
            // Find which chapter contains page p
            const ch = State.indexData.chapters.find(c => {
                if (!c.arabic_page_range) return false;
                const m = c.arabic_page_range.match(/p\.\s*(\d+)\s*-\s*p\.\s*(\d+)/);
                if (m) {
                    return p >= parseInt(m[1], 10) && p <= parseInt(m[2], 10);
                }
                return false;
            });

            if (ch) {
                html += `
                    <button class="inspector-action-btn" style="padding: 0.35rem 0.2rem; font-size: 0.75rem;" 
                            onclick="window.DiatessaronApp.navigateToChapter(${ch.id})">
                        Hal. ${p}
                    </button>`;
            }
        }

        html += `</div>`;
        container.innerHTML = html;
    }

    function renderSidebarStats() {
        const container = document.getElementById('sidebar-stats-container');
        if (!container || !State.indexData) return;

        const g = State.indexData.global_stats.gospels;
        const totalSegs = State.indexData.global_stats.total_segments;
        const totalWords = State.indexData.global_stats.total_words;

        let html = `
            <div style="padding: 0.5rem 0.25rem;">
                <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.75rem;">Harmoni Empat Injil</h4>
                <p style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 1rem; line-height: 1.5;">
                    Dari keseluruhan <strong>5.076 ayat</strong> dan <strong>${totalWords.toLocaleString()} kata</strong> dalam Diatessaron, berikut adalah proporsi kontribusi masing-masing Injil:
                </p>

                <div style="display: flex; flex-direction: column; gap: 0.85rem;">
        `;

        const list = [
            { key: 'luk', name: 'Injil Lukas', seg: g.luk.count, words: g.luk.words, col: 'var(--color-luk)' },
            { key: 'yoh', name: 'Injil Yohanes', seg: g.yoh.count, words: g.yoh.words, col: 'var(--color-yoh)' },
            { key: 'mat', name: 'Injil Matius', seg: g.mat.count, words: g.mat.words, col: 'var(--color-mat)' },
            { key: 'mrk', name: 'Injil Markus', seg: g.mrk.count, words: g.mrk.words, col: 'var(--color-mrk)' }
        ];

        list.forEach(item => {
            const pct = ((item.seg / totalSegs) * 100).toFixed(1);
            html += `
                <div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.25rem;">
                        <span>${item.name}</span>
                        <span>${pct}% (${item.seg} ayat)</span>
                    </div>
                    <div style="height: 6px; background-color: var(--border-subtle); border-radius: var(--radius-full); overflow: hidden;">
                        <div style="width: ${pct}%; height: 100%; background-color: ${item.col};"></div>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
                <div style="margin-top: 1.5rem; padding: 0.75rem; background: var(--bg-elevated); border-radius: var(--radius-md); font-size: 0.78rem; color: var(--text-muted); line-height: 1.5;">
                    Lukas dan Yohanes menyumbang porsi terbesar narasi karena Tatian menyusun kronologi bertumpu pada urutan perjalanan Lukas dan wacana teologis Yohanes.
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    function updateActiveSidebarCard(chapterId) {
        document.querySelectorAll('.chapter-card-nav.active').forEach(c => c.classList.remove('active'));
        const activeCard = document.getElementById(`sidebar-card-${chapterId}`);
        if (activeCard) {
            activeCard.classList.add('active');
            activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    // =========================================================================
    // SEARCH ENGINE (IN-MEMORY CLIENT-SIDE SEARCH)
    // =========================================================================
    async function openSearchModal() {
        if (!DOM.searchModal) return;
        DOM.searchModal.classList.add('active');
        DOM.searchInput.focus();

        // Lazy load search_index.json on demand
        if (!State.searchIndex && !State.isSearchLoading) {
            State.isSearchLoading = true;
            try {
                const res = await fetch('./data/search_index.json');
                if (res.ok) {
                    State.searchIndex = await res.json();
                }
            } catch (err) {
                console.error('Failed to load search index:', err);
            } finally {
                State.isSearchLoading = false;
            }
        }
    }

    function closeSearchModal() {
        if (DOM.searchModal) DOM.searchModal.classList.remove('active');
    }

    let searchDebounceTimer = null;
    function handleSearchInput(query, filterGospel = 'all') {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
            executeSearch(query, filterGospel);
        }, 150);
    }

    function executeSearch(query, filterGospel = 'all') {
        const q = query.trim().toLowerCase();
        if (!q || q.length < 2) {
            DOM.searchResultsList.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: var(--text-muted);">
                    Ketik minimal 2 huruf untuk mulai mencari.
                </div>`;
            return;
        }

        if (!State.searchIndex) {
            DOM.searchResultsList.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: var(--text-muted);">
                    Memuat indeks pencarian...
                </div>`;
            return;
        }

        const words = q.split(/\s+/).filter(Boolean);
        const results = [];

        for (let i = 0; i < State.searchIndex.length; i++) {
            const item = State.searchIndex[i];
            // Filter by book if selected
            if (filterGospel !== 'all' && item.b !== filterGospel) {
                continue;
            }

            const textLower = item.t.toLowerCase();
            const refLower = item.r.toLowerCase();
            const dVerseStr = String(item.dv);

            // Match all words
            const matchesAll = words.every(w => textLower.includes(w) || refLower.includes(w) || dVerseStr.includes(w));
            if (matchesAll) {
                results.push(item);
                if (results.length >= 60) break; // Cap at 60 for super responsive rendering
            }
        }

        renderSearchResults(results, q);
    }

    function renderSearchResults(results, query) {
        if (results.length === 0) {
            DOM.searchResultsList.innerHTML = `
                <div style="padding: 2.5rem; text-align: center; color: var(--text-muted);">
                    Tidak ditemukan ayat yang cocok dengan kata "${query}".
                </div>`;
            return;
        }

        const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const reg = new RegExp(`(${safeQuery})`, 'gi');

        let html = '';
        results.forEach(res => {
            const highlightedText = res.t.replace(reg, '<mark>$1</mark>');
            html += `
                <div class="search-result-item" onclick="window.DiatessaronApp.jumpToSearchResult(${res.c}, ${res.v})">
                    <div class="search-result-meta">
                        <span style="color: var(--text-primary);">${res.r}</span>
                        <span style="color: var(--text-muted); font-family: var(--font-mono);">Bab ${res.c}:${res.dv || res.v}</span>
                    </div>
                    <div class="search-result-text">"${highlightedText}"</div>
                </div>
            `;
        });

        DOM.searchResultsList.innerHTML = html;
    }

    // =========================================================================
    // AUDIO NARRATION (TEXT-TO-SPEECH)
    // =========================================================================
    function setupSpeechVoices() {
        if (!('speechSynthesis' in window)) return;
        const updateVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            // Prioritize Indonesian voices
            State.audio.voice = voices.find(v => v.lang.startsWith('id') || v.lang.startsWith('in')) ||
                voices.find(v => v.lang.startsWith('en')) || null;
        };
        updateVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = updateVoices;
        }
    }

    function toggleAudio() {
        if (!State.audio.synth) {
            alert('Browser Anda tidak mendukung fitur suara Text-to-Speech.');
            return;
        }

        if (State.audio.isPlaying) {
            stopAudio();
        } else {
            startAudio();
        }
    }

    function startAudio() {
        if (!State.currentChapterData) return;
        State.audio.synth.cancel();
        State.audio.isPlaying = true;
        DOM.audioDock.classList.add('active');

        // Start from selected verse or first verse
        const startIdx = State.selectedVerseId ?
            State.currentChapterData.verses.findIndex(v => v.id === State.selectedVerseId) : 0;
        State.audio.activeVerseIndex = startIdx >= 0 ? startIdx : 0;

        playCurrentVerseAudio();
    }

    function playCurrentVerseAudio() {
        if (!State.audio.isPlaying || !State.currentChapterData) return;
        const verses = State.currentChapterData.verses;
        if (State.audio.activeVerseIndex >= verses.length) {
            stopAudio();
            return;
        }

        const verse = verses[State.audio.activeVerseIndex];
        selectVerse(verse.id, true);

        DOM.audioTrackInfo.textContent = `Bab ${State.currentChapterData.id} • ${verse.ref_id || verse.ref}`;

        const u = new SpeechSynthesisUtterance(verse.text);
        if (State.audio.voice) u.voice = State.audio.voice;
        u.lang = 'id-ID';
        u.rate = State.audio.rate;

        u.onend = () => {
            if (State.audio.isPlaying) {
                State.audio.activeVerseIndex++;
                playCurrentVerseAudio();
            }
        };

        u.onerror = (e) => {
            console.warn('SpeechSynthesis error:', e);
            stopAudio();
        };

        State.audio.utterance = u;
        State.audio.synth.speak(u);
    }

    function stopAudio() {
        State.audio.isPlaying = false;
        if (State.audio.synth) State.audio.synth.cancel();
        if (DOM.audioDock) DOM.audioDock.classList.remove('active');
    }

    function speakSingleVerse(verseId) {
        if (!State.currentChapterData || !State.audio.synth) return;
        const verse = State.currentChapterData.verses.find(v => v.id === verseId);
        if (!verse) return;

        State.audio.synth.cancel();
        const u = new SpeechSynthesisUtterance(verse.text);
        if (State.audio.voice) u.voice = State.audio.voice;
        u.lang = 'id-ID';
        u.rate = State.audio.rate;
        State.audio.synth.speak(u);
    }

    // =========================================================================
    // EVENT LISTENERS & SHORTCUTS
    // =========================================================================
    function setupEventListeners() {
        // Toggle Sidebar
        const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
        if (toggleSidebarBtn) {
            toggleSidebarBtn.addEventListener('click', () => {
                if (isMobile()) {
                    DOM.sidebar.classList.toggle('mobile-open');
                    updateScrim();
                } else {
                    DOM.sidebar.classList.toggle('collapsed');
                }
            });
        }

        // Brand Home Btn -> Open About Modal
        const brandBtn = document.getElementById('brand-home-btn');
        if (brandBtn) {
            brandBtn.addEventListener('click', () => {
                DOM.aboutModal.classList.add('active');
            });
        }

        // Chapter Picker Btn -> Toggle Chapter Jump Menu
        const pickerBtn = document.getElementById('chapter-picker-btn');
        if (pickerBtn) {
            pickerBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleChapterJump();
            });
        }

        if (DOM.chapterJumpCloseBtn) {
            DOM.chapterJumpCloseBtn.addEventListener('click', closeChapterJump);
        }

        if (DOM.chapterJumpFilter) {
            DOM.chapterJumpFilter.addEventListener('input', (e) => {
                filterChapterJumpList(e.target.value);
            });
        }

        if (DOM.chapterJumpClear) {
            DOM.chapterJumpClear.addEventListener('click', () => {
                DOM.chapterJumpFilter.value = '';
                filterChapterJumpList('');
                DOM.chapterJumpFilter.focus();
            });
        }

        // Mobile More Menu Trigger & Items
        if (DOM.moreMenuBtn) {
            DOM.moreMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleMoreMenu();
            });
        }

        const moreItemHarmony = document.getElementById('more-item-harmony');
        if (moreItemHarmony) {
            moreItemHarmony.addEventListener('click', () => {
                toggleColorHarmony();
                closeMoreMenu();
            });
        }

        const moreItemAudio = document.getElementById('more-item-audio');
        if (moreItemAudio) {
            moreItemAudio.addEventListener('click', () => {
                closeMoreMenu();
                toggleAudio();
            });
        }

        const moreItemDisplay = document.getElementById('more-item-display');
        if (moreItemDisplay) {
            moreItemDisplay.addEventListener('click', () => {
                closeMoreMenu();
                DOM.displayModal.classList.add('active');
            });
        }

        const moreItemTheme = document.getElementById('more-item-theme');
        if (moreItemTheme) {
            moreItemTheme.addEventListener('click', () => {
                toggleTheme();
                closeMoreMenu();
            });
        }

        const moreItemInspector = document.getElementById('more-item-inspector');
        if (moreItemInspector) {
            moreItemInspector.addEventListener('click', () => {
                closeMoreMenu();
                if (DOM.inspector && (DOM.inspector.classList.contains('collapsed') || (isMobile() && !DOM.inspector.classList.contains('mobile-open')))) {
                    openInspector();
                } else {
                    closeInspector();
                }
            });
        }

        const moreItemAbout = document.getElementById('more-item-about');
        if (moreItemAbout) {
            moreItemAbout.addEventListener('click', () => {
                closeMoreMenu();
                DOM.aboutModal.classList.add('active');
            });
        }

        // Shared Scrim Click
        if (DOM.appScrim) {
            DOM.appScrim.addEventListener('click', closeAllPopoversAndDrawers);
        }

        // Close popovers on clicking outside
        document.addEventListener('click', (e) => {
            if (DOM.chapterJumpPopover && DOM.chapterJumpPopover.classList.contains('active')) {
                if (!DOM.chapterJumpPopover.contains(e.target) && !DOM.chapterPickerBtn.contains(e.target)) {
                    closeChapterJump();
                }
            }
            if (DOM.moreMenuPopover && DOM.moreMenuPopover.classList.contains('active')) {
                if (!DOM.moreMenuPopover.contains(e.target) && !DOM.moreMenuBtn.contains(e.target)) {
                    closeMoreMenu();
                }
            }
        });

        // Window resize listener
        window.addEventListener('resize', () => {
            if (!isMobile()) {
                if (DOM.sidebar) DOM.sidebar.classList.remove('mobile-open');
                if (DOM.inspector) DOM.inspector.classList.remove('mobile-open');
                updateScrim();
            }
        });

        // Sidebar Tabs
        document.querySelectorAll('.sidebar-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                switchSidebarTab(btn.dataset.tab);
            });
        });

        // Search Trigger
        const searchBtn = document.getElementById('search-trigger-btn');
        if (searchBtn) searchBtn.addEventListener('click', openSearchModal);
        const searchClose = document.getElementById('search-close-btn');
        if (searchClose) searchClose.addEventListener('click', closeSearchModal);

        DOM.searchInput.addEventListener('input', (e) => {
            const activeFilter = document.querySelector('.search-filter-pill.active')?.dataset.filter || 'all';
            handleSearchInput(e.target.value, activeFilter);
        });

        document.querySelectorAll('.search-filter-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                document.querySelectorAll('.search-filter-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                handleSearchInput(DOM.searchInput.value, pill.dataset.filter);
            });
        });

        // Theme Toggle
        const themeBtn = document.getElementById('theme-toggle-btn');
        if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

        // Color Harmony Toggle
        const harmonyBtn = document.getElementById('toggle-color-harmony-btn');
        if (harmonyBtn) harmonyBtn.addEventListener('click', toggleColorHarmony);

        // Display Settings Modal
        const displayBtn = document.getElementById('display-settings-btn');
        if (displayBtn) {
            displayBtn.addEventListener('click', () => {
                DOM.displayModal.classList.add('active');
            });
        }
        const displayClose = document.getElementById('display-modal-close');
        if (displayClose) {
            displayClose.addEventListener('click', () => {
                DOM.displayModal.classList.remove('active');
            });
        }

        // Theme Choice Buttons inside display modal
        document.querySelectorAll('.theme-choice-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                setTheme(btn.dataset.themeVal);
            });
        });

        // Font Family Buttons
        document.querySelectorAll('.font-family-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.font-family-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                State.preferences.fontFamily = btn.dataset.font;
                localStorage.setItem('diatessaron_font', State.preferences.fontFamily);
                applyPreferences();
            });
        });

        // Font Size Slider
        const fontSlider = document.getElementById('font-size-slider');
        if (fontSlider) {
            fontSlider.addEventListener('input', (e) => {
                State.preferences.fontSize = parseInt(e.target.value, 10);
                localStorage.setItem('diatessaron_font_size', State.preferences.fontSize);
                applyPreferences();
            });
        }

        // Inspector Close
        const closeInspectorBtn = document.getElementById('close-inspector-btn');
        if (closeInspectorBtn) closeInspectorBtn.addEventListener('click', closeInspector);
        const toggleInspectorBtn = document.getElementById('toggle-inspector-btn');
        if (toggleInspectorBtn) {
            toggleInspectorBtn.addEventListener('click', () => {
                if (DOM.inspector.classList.contains('collapsed')) {
                    openInspector();
                } else {
                    closeInspector();
                }
            });
        }

        // About Modal Close
        const aboutClose = document.getElementById('about-modal-close');
        if (aboutClose) {
            aboutClose.addEventListener('click', () => {
                DOM.aboutModal.classList.remove('active');
            });
        }

        // Audio Triggers
        const audioToggleBtn = document.getElementById('audio-toggle-btn');
        if (audioToggleBtn) audioToggleBtn.addEventListener('click', toggleAudio);
        const audioCloseBtn = document.getElementById('audio-close-btn');
        if (audioCloseBtn) audioCloseBtn.addEventListener('click', stopAudio);
        const audioPlayPauseBtn = document.getElementById('audio-play-pause-btn');
        if (audioPlayPauseBtn) audioPlayPauseBtn.addEventListener('click', toggleAudio);

        if (DOM.audioSpeedSelect) {
            DOM.audioSpeedSelect.addEventListener('change', (e) => {
                State.audio.rate = parseFloat(e.target.value);
            });
        }

        // Close modals on clicking overlay backdrop
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.classList.remove('active');
                    updateScrim();
                }
            });
        });

        // Window PopState / HashChange
        window.addEventListener('hashchange', () => {
            const parsed = parseHash(window.location.hash);
            if (parsed.chapterId && parsed.chapterId !== State.currentChapterId) {
                loadChapter(parsed.chapterId, parsed.verseId);
            } else if (parsed.verseId && parsed.verseId !== State.selectedVerseId) {
                selectVerse(parsed.verseId, true);
            }
        });
    }

    function switchSidebarTab(tabName) {
        document.querySelectorAll('.sidebar-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        document.getElementById('sidebar-tab-chronology').style.display = tabName === 'chronology' ? 'block' : 'none';
        document.getElementById('sidebar-tab-manuscript').style.display = tabName === 'manuscript' ? 'block' : 'none';
        document.getElementById('sidebar-tab-analytics').style.display = tabName === 'analytics' ? 'block' : 'none';
    }

    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Cmd+K or Ctrl+K -> Search
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                openSearchModal();
                return;
            }

            // Escape -> Close any open modal, popover, or drawer
            if (e.key === 'Escape') {
                closeAllPopoversAndDrawers();
                return;
            }

            // Navigation shortcuts (when not in input)
            if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
                return;
            }

            if (e.key === ']' && State.currentChapterId < 55) {
                loadChapter(State.currentChapterId + 1);
            } else if (e.key === '[' && State.currentChapterId > 1) {
                loadChapter(State.currentChapterId - 1);
            }
        });
    }

    // =========================================================================
    // UTILITIES
    // =========================================================================
    function parseHash(hash) {
        // e.g. #bab-1 or #bab-1:v12
        const m = (hash || '').match(/^#bab-(\d+)(?::v(\d+))?/i);
        if (m) {
            return {
                chapterId: parseInt(m[1], 10),
                verseId: m[2] ? parseInt(m[2], 10) : null
            };
        }
        return { chapterId: null, verseId: null };
    }

    function copyCitation(verseId) {
        if (!State.currentChapterData) return;
        const verse = State.currentChapterData.verses.find(v => v.id === verseId);
        if (!verse) return;

        const citation = `"${verse.text}"\n— Diatessaron §${State.currentChapterData.id}:${verse.diatessaron_verse || ''} (${verse.ref_id || verse.ref}, LAI-TB)`;
        navigator.clipboard.writeText(citation).then(() => {
            alert('Ayat dan sitasi akademis berhasil disalin ke papan klip!');
        }).catch(err => {
            console.error('Clipboard copy failed:', err);
        });
    }

    function toggleBookmark(chapterId, verseId) {
        const idx = State.preferences.bookmarks.findIndex(b => b.ch === chapterId && b.v === verseId);
        if (idx >= 0) {
            State.preferences.bookmarks.splice(idx, 1);
        } else {
            State.preferences.bookmarks.push({ ch: chapterId, v: verseId, date: Date.now() });
        }
        localStorage.setItem('diatessaron_bookmarks', JSON.stringify(State.preferences.bookmarks));
        renderInspectorDetails(verseId);
    }

    // =========================================================================
    // EXPOSE GLOBAL API
    // =========================================================================
    window.DiatessaronApp = {
        navigateToChapter: (chId) => {
            if (isMobile()) {
                DOM.sidebar.classList.remove('mobile-open');
                updateScrim();
            }
            loadChapter(chId);
        },
        jumpToSearchResult: (chId, vId) => {
            closeSearchModal();
            loadChapter(chId, vId);
        },
        selectVerse,
        copyCitation,
        toggleBookmark,
        speakSingleVerse,
        openChapterJump,
        closeChapterJump,
        toggleChapterJump,
        openMoreMenu,
        closeMoreMenu,
        toggleMoreMenu
    };

})();
