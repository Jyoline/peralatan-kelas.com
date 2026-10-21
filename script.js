/* ==========================================================================
   SPIDEY CLASS TOOLS - MAIN JAVASCRIPT
   Functional Core: Real-time Clock, Spidey Notes (CRUD), LocalStorage,
   Calculator, Todo List, Stopwatch, & Background Web Effect.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initSpiderWebBackground();
    initDigitalClock();
    initSpideyNotes();
    initCalculator();
    initTodoList();
    initStopwatch();
    initTips();
    initNavigation();
    updateFooterYear();
});

/* --- 1. SPIDER-WEB CANVAS BACKGROUND ANIMATION --- */
function initSpiderWebBackground() {
    const canvas = document.getElementById('web-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const numParticles = Math.min(Math.floor(width / 25), 40);

    for (let i = 0; i < numParticles; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8,
            radius: Math.random() * 2 + 1
        });
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);

        // Draw connections (Web lines)
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 150) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(0, 229, 255, ${1 - dist / 150})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }

        // Move particles
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#E62429';
            ctx.fill();
        });

        requestAnimationFrame(animate);
    }

    animate();
}

/* --- 2. JAM DIGITAL FUTURISTIK --- */
let is24HourFormat = true;

function initDigitalClock() {
    const timeDisplay = document.getElementById('time-display');
    const periodDisplay = document.getElementById('period-display');
    const dateDisplay = document.getElementById('date-display');
    const toggleBtn = document.getElementById('format-toggle');

    toggleBtn.addEventListener('click', () => {
        is24HourFormat = !is24HourFormat;
        toggleBtn.textContent = is24HourFormat ? 'Format 24H' : 'Format 12H';
        updateClock();
    });

    function updateClock() {
        const now = new Date();
        let hours = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        let period = '';
        if (!is24HourFormat) {
            period = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12;
            periodDisplay.style.display = 'inline';
            periodDisplay.textContent = period;
        } else {
            periodDisplay.style.display = 'none';
        }

        const formattedHours = String(hours).padStart(2, '0');
        timeDisplay.textContent = `${formattedHours}:${minutes}:${seconds}`;

        // Indonesian Date Format
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateDisplay.textContent = now.toLocaleDateString('id-ID', options);
    }

    updateClock();
    setInterval(updateClock, 1000);
}

/* --- 3. SPIDEY NOTES CATATAN (CRUD + LOCALSTORAGE) --- */
function initSpideyNotes() {
    const noteForm = document.getElementById('note-form');
    const noteIdInput = document.getElementById('note-id');
    const noteTitleInput = document.getElementById('note-title');
    const noteBodyInput = document.getElementById('note-body');
    const clearBtn = document.getElementById('clear-note-btn');
    const searchInput = document.getElementById('search-notes');
    const notesContainer = document.getElementById('notes-container');

    let notes = JSON.parse(localStorage.getItem('spidey_notes')) || [];

    function saveNotesToStorage() {
        localStorage.setItem('spidey_notes', JSON.stringify(notes));
    }

    function renderNotes(filterText = '') {
        notesContainer.innerHTML = '';

        const filteredNotes = notes.filter(note => 
            note.title.toLowerCase().includes(filterText.toLowerCase()) || 
            note.body.toLowerCase().includes(filterText.toLowerCase())
        );

        if (filteredNotes.length === 0) {
            notesContainer.innerHTML = `<div class="empty-notes"><i class="fa-solid fa-spider"></i> Belum ada catatan, Web-Head!</div>`;
            return;
        }

        filteredNotes.forEach(note => {
            const noteEl = document.createElement('div');
            noteEl.className = 'note-item';
            noteEl.innerHTML = `
                <div>
                    <div class="note-item-title">${escapeHTML(note.title)}</div>
                    <div class="note-item-body">${escapeHTML(note.body)}</div>
                </div>
                <div class="note-item-footer">
                    <span>${note.date}</span>
                    <div class="note-actions">
                        <button class="action-btn edit" onclick="editNote('${note.id}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
                        <button class="action-btn delete" onclick="deleteNote('${note.id}')" title="Hapus"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            `;
            notesContainer.appendChild(noteEl);
        });
    }

    noteForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = noteTitleInput.value.trim();
        const body = noteBodyInput.value.trim();
        const id = noteIdInput.value;

        if (!title || !body) return;

        const dateStr = new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });

        if (id) {
            // Update Note
            notes = notes.map(n => n.id === id ? { ...n, title, body, date: `${dateStr} (Edited)` } : n);
            showToast('Catatan berhasil diperbarui!');
        } else {
            // Create Note
            const newNote = {
                id: Date.now().toString(),
                title,
                body,
                date: dateStr
            };
            notes.unshift(newNote);
            showToast('Catatan berhasil disimpan!');
        }

        saveNotesToStorage();
        resetForm();
        renderNotes(searchInput.value);
    });

    clearBtn.addEventListener('click', resetForm);

    function resetForm() {
        noteIdInput.value = '';
        noteTitleInput.value = '';
        noteBodyInput.value = '';
        document.getElementById('save-note-btn').innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Simpan Catatan`;
    }

    window.editNote = function(id) {
        const note = notes.find(n => n.id === id);
        if (note) {
            noteIdInput.value = note.id;
            noteTitleInput.value = note.title;
            noteBodyInput.value = note.body;
            document.getElementById('save-note-btn').innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Perbarui Catatan`;
            window.scrollTo({ top: document.getElementById('notes-section').offsetTop - 80, behavior: 'smooth' });
        }
    };

    window.deleteNote = function(id) {
        notes = notes.filter(n => n.id !== id);
        saveNotesToStorage();
        renderNotes(searchInput.value);
        showToast('Catatan telah dihapus!');
    };

    searchInput.addEventListener('input', (e) => {
        renderNotes(e.target.value);
    });

    renderNotes();
}

/* --- 4. MINI CALCULATOR --- */
function initCalculator() {
    window.calcDisplay = document.getElementById('calc-display');
}

function calcAppend(val) {
    if (calcDisplay.value === '0' || calcDisplay.value === 'Error') {
        calcDisplay.value = val;
    } else {
        calcDisplay.value += val;
    }
}

function calcClear() { calcDisplay.value = '0'; }

function calcDel() {
    calcDisplay.value = calcDisplay.value.slice(0, -1);
    if (calcDisplay.value === '') calcDisplay.value = '0';
}

function calcSolve() {
    try {
        calcDisplay.value = eval(calcDisplay.value.replace(/×/g, '*').replace(/÷/g, '/'));
    } catch {
        calcDisplay.value = 'Error';
    }
}

/* --- 5. DAFTAR TUGAS (TODO LIST) --- */
function initTodoList() {
    const todoForm = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');

    let todos = JSON.parse(localStorage.getItem('spidey_todos')) || [];

    function saveTodos() {
        localStorage.setItem('spidey_todos', JSON.stringify(todos));
    }

    function renderTodos() {
        todoList.innerHTML = '';
        todos.forEach((todo, idx) => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.done ? 'completed' : ''}`;
            li.innerHTML = `
                <span class="todo-text" onclick="toggleTodo(${idx})">${escapeHTML(todo.text)}</span>
                <button class="action-btn delete" onclick="deleteTodo(${idx})"><i class="fa-solid fa-xmark"></i></button>
            `;
            todoList.appendChild(li);
        });
    }

    todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = todoInput.value.trim();
        if (text) {
            todos.push({ text, done: false });
            saveTodos();
            renderTodos();
            todoInput.value = '';
        }
    });

    window.toggleTodo = function(idx) {
        todos[idx].done = !todos[idx].done;
        saveTodos();
        renderTodos();
    };

    window.deleteTodo = function(idx) {
        todos.splice(idx, 1);
        saveTodos();
        renderTodos();
    };

    renderTodos();
}

/* --- 6. STOPWATCH --- */
function initStopwatch() {
    let timer = null;
    let startTime = 0;
    let elapsedTime = 0;

    const display = document.getElementById('sw-display');
    const startBtn = document.getElementById('sw-start-btn');
    const pauseBtn = document.getElementById('sw-pause-btn');
    const resetBtn = document.getElementById('sw-reset-btn');

    function updateTime() {
        const totalMs = elapsedTime + (Date.now() - startTime);
        const mins = String(Math.floor(totalMs / 60000)).padStart(2, '0');
        const secs = String(Math.floor((totalMs % 60000) / 1000)).padStart(2, '0');
        const ms = String(Math.floor((totalMs % 1000) / 10)).padStart(2, '0');
        display.textContent = `${mins}:${secs}.${ms}`;
    }

    startBtn.addEventListener('click', () => {
        startTime = Date.now();
        timer = setInterval(updateTime, 10);
        startBtn.disabled = true;
        pauseBtn.disabled = false;
    });

    pauseBtn.addEventListener('click', () => {
        clearInterval(timer);
        elapsedTime += Date.now() - startTime;
        startBtn.disabled = false;
        pauseBtn.disabled = true;
    });

    resetBtn.addEventListener('click', () => {
        clearInterval(timer);
        elapsedTime = 0;
        display.textContent = '00:00.00';
        startBtn.disabled = false;
        pauseBtn.disabled = true;
    });
}

/* --- 7. STUDY TIPS --- */
function initTips() {
    const tips = [
        "\"With great focus comes great grades! Kelola waktumu dengan teknik Pomodoro!\"",
        "\"Catat poin-poin utama pelajaran layaknya agen rahasia mencatat target!\"",
        "\"Istirahat sejenak 5 menit setelah 25 menit belajar intensif agar otak tetap segar!\"",
        "\"Latihan soal secara konsisten adalah kunci refleks akademik yang cepat!\""
    ];

    let currentTipIndex = 0;
    const quoteEl = document.getElementById('spidey-quote');
    const nextBtn = document.getElementById('next-tip-btn');

    nextBtn.addEventListener('click', () => {
        currentTipIndex = (currentTipIndex + 1) % tips.length;
        quoteEl.textContent = tips[currentTipIndex];
    });
}

/* --- 8. NAVIGATION & UTILS --- */
function initNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');

    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('show');
    });
}

function updateFooterYear() {
    document.getElementById('current-year').textContent = new Date().getFullYear();
}

function showToast(msg) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fa-solid fa-mask"></i> ${msg}`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}
