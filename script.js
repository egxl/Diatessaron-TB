document.addEventListener('DOMContentLoaded', () => {
    const readerView = document.getElementById('reader-view');
    const chapterList = document.getElementById('chapter-list');
    const stickyHeader = document.getElementById('sticky-header');
    const currentRefDisplay = document.getElementById('current-ref');
    const menuToggle = document.getElementById('menu-toggle');
    const chapterNav = document.getElementById('chapter-nav');

    let chaptersIndex = [];
    let loadedChapters = new Set();

    // Fetch chapter index
    fetch('data/index.json')
        .then(response => {
            if (!response.ok) throw new Error("HTTP error " + response.status);
            return response.json();
        })
        .then(data => {
            chaptersIndex = data.chapters;
            renderChapterNav(chaptersIndex);
            // Load first chapter by default
            if (chaptersIndex.length > 0) {
                loadChapter(chaptersIndex[0]);
            }
        })
        .catch(err => {
            console.error('Error loading index:', err);
            readerView.innerHTML = '<p>Error loading content. Run parser first.</p>';
        });

    function renderChapterNav(chapters) {
        chapters.forEach((chapter) => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.textContent = chapter.title;
            a.href = `#chapter-${chapter.id}`;
            a.dataset.chapterId = chapter.id;

            a.addEventListener('click', (e) => {
                e.preventDefault();
                loadChapter(chapter);
                // On mobile, close menu after click
                if (window.innerWidth <= 768) {
                    chapterNav.classList.remove('active');
                }
            });

            li.appendChild(a);
            chapterList.appendChild(li);
        });
    }

    function updateActiveNav(chapterId) {
        document.querySelectorAll('#chapter-list a').forEach(a => {
            if (a.dataset.chapterId == chapterId) {
                a.classList.add('active');
            } else {
                a.classList.remove('active');
            }
        });
    }

    function loadChapter(chapter) {
        updateActiveNav(chapter.id);

        // Check if already loaded
        const existingDiv = document.getElementById(`chapter-${chapter.id}`);
        if (existingDiv) {
            existingDiv.scrollIntoView({ behavior: 'smooth' });
            return;
        }

        // Fetch and render
        fetch(`data/${chapter.file}`)
            .then(response => {
                if (!response.ok) throw new Error("HTTP error " + response.status);
                return response.json();
            })
            .then(chapterData => {
                renderChapter(chapter.id, chapterData);
                loadedChapters.add(chapter.id);

                // Scroll to new chapter
                const newDiv = document.getElementById(`chapter-${chapter.id}`);
                if (newDiv) {
                    newDiv.scrollIntoView({ behavior: 'smooth' });
                }
            })
            .catch(err => {
                console.error(`Error loading chapter ${chapter.id}:`, err);
            });
    }

    function renderChapter(chapterId, chapterData) {
        const chapterDiv = document.createElement('div');
        chapterDiv.id = `chapter-${chapterId}`;
        chapterDiv.className = 'chapter-container';

        const chapterTitle = document.createElement('h3');
        let titleText = chapterData.title;
        if (chapterData.canonical_books && chapterData.canonical_books.length > 0) {
            titleText += ` (${chapterData.canonical_books.join(', ')})`;
        }
        chapterTitle.textContent = titleText;
        chapterDiv.appendChild(chapterTitle);

        const versesContainer = document.createElement('div');
        versesContainer.className = 'verses-stream';

        chapterData.verses.forEach(verse => {
            const verseSpan = document.createElement('span');
            verseSpan.className = 'verse';
            verseSpan.dataset.ref = verse.ref || '';
            verseSpan.dataset.id = verse.id;
            verseSpan.dataset.diatessaronVerse = verse.diatessaron_verse || '';
            verseSpan.dataset.arabicPage = verse.arabic_page || '';
            verseSpan.textContent = ` ${verse.text} `;

            verseSpan.addEventListener('click', () => handleVerseClick(verseSpan));

            let tooltip = verse.ref || '';
            if (verse.diatessaron_verse) {
                tooltip += ` (Diatessaron §${chapterId}:${verse.diatessaron_verse})`;
            }
            if (verse.arabic_page) {
                tooltip += ` [Hal. Arab ${verse.arabic_page}]`;
            }
            verseSpan.title = tooltip;

            versesContainer.appendChild(verseSpan);
        });

        chapterDiv.appendChild(versesContainer);
        readerView.appendChild(chapterDiv);
    }

    function handleVerseClick(element) {
        document.querySelectorAll('.verse.highlight').forEach(el => {
            el.classList.remove('highlight');
        });
        element.classList.add('highlight');
        showRef(element);
    }

    function showRef(element) {
        const ref = element.dataset.ref;
        const dVerse = element.dataset.diatessaronVerse;
        const page = element.dataset.arabicPage;
        const chId = element.closest('.chapter-container')?.id?.replace('chapter-', '') || '';

        let html = '';
        if (ref) {
            html += `<span class="ref-title">${ref}</span>`;
        }
        if (dVerse) {
            html += `<span class="badge badge-diatessaron">Diatessaron §${chId}:${dVerse}</span>`;
        }
        if (page) {
            html += `<span class="badge badge-page">Hal. Arab ${page}</span>`;
        }

        currentRefDisplay.innerHTML = html || 'Ayat terpilih';
        stickyHeader.classList.remove('hidden');
    }

    // Mobile Menu Toggle
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            chapterNav.classList.toggle('active');
        });
    }
});
