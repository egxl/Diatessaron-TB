document.addEventListener('DOMContentLoaded', () => {
    const readerView = document.getElementById('reader-view');
    const chapterList = document.getElementById('chapter-list');
    const stickyHeader = document.getElementById('sticky-header');
    const currentRefDisplay = document.getElementById('current-ref');
    const menuToggle = document.getElementById('menu-toggle');
    const chapterNav = document.getElementById('chapter-nav');

    // Fetch data
    fetch('data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error("HTTP error " + response.status);
            }
            return response.json();
        })
        .then(data => {
            renderChapters(data.chapters);
        })
        .catch(err => {
            console.error('Error loading data:', err);
            readerView.innerHTML = '<p>Error loading content.</p>';
        });

    function renderChapters(chapters) {
        if (!chapters || chapters.length === 0) {
            readerView.innerHTML = '<p>No content available.</p>';
            return;
        }

        chapters.forEach((chapter, index) => {
            // 1. Add to Navigation
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.textContent = chapter.title;
            a.href = `#chapter-${index}`;
            a.dataset.targetId = `chapter-${index}`;

            a.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.getElementById(a.dataset.targetId);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                    // On mobile, close menu after click
                    if (window.innerWidth <= 768) {
                        chapterNav.classList.remove('active');
                    }
                }
            });

            li.appendChild(a);
            chapterList.appendChild(li);

            // 2. Render Text
            const chapterDiv = document.createElement('div');
            chapterDiv.id = `chapter-${index}`;
            chapterDiv.className = 'chapter-container';

            const chapterTitle = document.createElement('h3');
            chapterTitle.textContent = chapter.title;
            chapterDiv.appendChild(chapterTitle);

            const versesContainer = document.createElement('div');
            versesContainer.className = 'verses-stream';

            chapter.verses.forEach(verse => {
                const verseSpan = document.createElement('span');
                verseSpan.className = 'verse';
                verseSpan.dataset.ref = verse.ref;
                verseSpan.dataset.id = verse.id;

                // Add a space before verse text for readability if needed, 
                // or assume text has leading/trailing spaces.
                // Based on user req: continuous stream.
                verseSpan.textContent = ` ${verse.text} `;

                // Interactions
                verseSpan.addEventListener('click', () => handleVerseClick(verseSpan));
                verseSpan.addEventListener('mouseenter', () => handleVerseHover(verseSpan));

                versesContainer.appendChild(verseSpan);
            });

            chapterDiv.appendChild(versesContainer);
            readerView.appendChild(chapterDiv);
        });
    }

    function handleVerseClick(element) {
        // Remove highlight from all verses
        document.querySelectorAll('.verse.highlight').forEach(el => {
            el.classList.remove('highlight');
        });

        // Add highlight
        element.classList.add('highlight');

        // Update header
        showRef(element.dataset.ref);
    }

    function handleVerseHover(element) {
        // Optional: show ref on hover too? 
        // User asked: "On click/hover ... show data-ref"
        // Let's settle on updating the display.
        // showRef(element.dataset.ref); 
        // Note: Hover might be too noisy if it updates sticky header constantly.
        // Let's stick to click for persistent highlighting, but maybe tooltip for hover?
        // For simplicity, let's just make the sticky header update on click, 
        // or maybe a tooltip would be better for hover.
        // Re-reading: "show ... in a sticky header or tooltip".
        // Let's use the title attribute for native tooltip on hover, and sticky header for click.
        element.title = element.dataset.ref;
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
