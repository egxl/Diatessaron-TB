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

    function loadChapter(chapter) {
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
        chapterTitle.textContent = chapterData.title;
        chapterDiv.appendChild(chapterTitle);

        const versesContainer = document.createElement('div');
        versesContainer.className = 'verses-stream';

        chapterData.verses.forEach(verse => {
            const verseSpan = document.createElement('span');
            verseSpan.className = 'verse';
            verseSpan.dataset.ref = verse.ref;
            verseSpan.dataset.id = verse.id;
            verseSpan.textContent = ` ${verse.text} `;

            verseSpan.addEventListener('click', () => handleVerseClick(verseSpan));
            verseSpan.title = verse.ref; // Tooltip on hover

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
        showRef(element.dataset.ref);
    }

    function showRef(ref) {
        currentRefDisplay.textContent = ref;
        stickyHeader.classList.remove('hidden');
    }

    // Mobile Menu Toggle
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            chapterNav.classList.toggle('active');
        });
    }
});
