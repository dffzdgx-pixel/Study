 import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
 import {
     getFirestore,
     collection,
     onSnapshot,
     addDoc,
     updateDoc,
     deleteDoc,
     doc,
     enableIndexedDbPersistence
 } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

 // Config
    // Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDxp_Tg5VyN4fTen_uSvTOnKHgdthABcbs",
  authDomain: "sewl-e1b65.firebaseapp.com",
  projectId: "sewl-e1b65",
  storageBucket: "sewl-e1b65.firebasestorage.app",
  messagingSenderId: "356187502194",
  appId: "1:356187502194:web:3ceee938857e8193f8b4eb",
  measurementId: "G-N13J9RCC70"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

 

 // Init Firebase
 const app = initializeApp(firebaseConfig);
 const db = getFirestore(app);

 // Offline Data Persistence
 enableIndexedDbPersistence(db).catch((err) => {
     if (err.code == 'failed-precondition') {
         console.warn('Persistence failed: Multiple tabs open');
     } else if (err.code == 'unimplemented') {
         console.warn('Browser does not support persistence');
     }
 });

 const tasksCollection = collection(db, "tasks");

 // State Variables
 let tasks = [];
 let currentFilter = 'all';
 let searchQuery = '';
 let pendingFile = null;
 let pendingDeleteId = null;

 // DOM Elements
 const form = document.getElementById('task-form');
 const tasksContainer = document.getElementById('tasks-container');
 const noTasksMessage = document.getElementById('no-tasks-message');
 const loadingSpinner = document.getElementById('loading-spinner');
 const searchInput = document.getElementById('search-input');
 const filterTabs = document.querySelectorAll('.filter-tab');
 const themeToggleBtn = document.getElementById('theme-toggle');

 // Attachment Preview Elements
 const localFileInput = document.getElementById('local-file');
 const attachmentPreviewBox = document.getElementById('attachment-preview-box');
 const attachmentThumb = document.getElementById('attachment-thumb');
 const attachmentBadge = document.getElementById('attachment-badge');
 const attachmentFileName = document.getElementById('attachment-file-name');
 const attachmentFileSize = document.getElementById('attachment-file-size');
 const removeFileBtn = document.getElementById('remove-file-btn');

 // Modal Elements
 const notesModal = document.getElementById('notes-modal');
 const modalTitle = document.getElementById('modal-title');
 const modalNotesText = document.getElementById('modal-notes-text');
 const fileAttachmentInfo = document.getElementById('file-attachment-info');
 const downloadLink = document.getElementById('download-link');
 const filePreview = document.getElementById('file-preview');
 const modalCloseBtn = document.getElementById('modal-close-btn');

 // Delete Modal Elements
 const deleteModal = document.getElementById('delete-modal');
 const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
 const cancelDeleteBtn = document.getElementById('cancel-delete-btn');

 // Audio Synth Feedback (Web Audio API)
 function playAudioFeedback(type = 'success') {
     try {
         const AudioCtx = window.AudioContext || window.webkitAudioContext;
         if (!AudioCtx) return;
         const ctx = new AudioCtx();
         const osc = ctx.createOscillator();
         const gain = ctx.createGain();

         osc.connect(gain);
         gain.connect(ctx.destination);

         if (type === 'success') {
             osc.type = 'sine';
             osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
             osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
             gain.gain.setValueAtTime(0.12, ctx.currentTime);
             gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
             osc.start();
             osc.stop(ctx.currentTime + 0.22);
         } else if (type === 'complete') {
             osc.type = 'triangle';
             osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
             osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
             gain.gain.setValueAtTime(0.15, ctx.currentTime);
             gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
             osc.start();
             osc.stop(ctx.currentTime + 0.3);
         }
     } catch (e) {
         // Audio not supported or blocked
     }
 }

 // Toast Notification System (3 Seconds)
 function showToast(message, type = 'success') {
     const container = document.getElementById('toast-container');
     const toast = document.createElement('div');
     toast.className = `toast ${type}`;

     const icon = type === 'success' ? 'fa-circle-check' : (type === 'danger' ? 'fa-circle-exclamation' : 'fa-bell');
     toast.innerHTML = `<i class="fas ${icon}" style="font-size:1.1rem; color:var(--${type === 'success' ? 'secondary' : 'danger'});"></i> <span>${message}</span>`;

     container.appendChild(toast);

     setTimeout(() => {
         toast.classList.add('toast-out');
         toast.addEventListener('animationend', () => toast.remove());
     }, 3000);
 }

 // Confetti Celebration FX
 function triggerConfetti() {
     const canvas = document.getElementById('confetti-canvas');
     const ctx = canvas.getContext('2d');
     canvas.width = window.innerWidth;
     canvas.height = window.innerHeight;

     const particles = Array.from({ length: 40 }).map(() => ({
         x: canvas.width / 2,
         y: canvas.height / 2,
         vx: (Math.random() - 0.5) * 12,
         vy: (Math.random() - 0.7) * 12,
         color: ['#4f46e5', '#10b981', '#f59e0b', '#06b6d4', '#ec4899'][Math.floor(Math.random() * 5)],
         size: Math.random() * 6 + 3,
         alpha: 1
     }));

     function animate() {
         ctx.clearRect(0, 0, canvas.width, canvas.height);
         let alive = false;
         particles.forEach(p => {
             p.x += p.vx;
             p.y += p.vy;
             p.vy += 0.25; // Gravity
             p.alpha -= 0.02;
             if (p.alpha > 0) {
                 alive = true;
                 ctx.globalAlpha = p.alpha;
                 ctx.fillStyle = p.color;
                 ctx.beginPath();
                 ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                 ctx.fill();
             }
         });
         if (alive) requestAnimationFrame(animate);
         else ctx.clearRect(0, 0, canvas.width, canvas.height);
     }
     animate();
 }

 // Theme Toggle Logic
 if (localStorage.getItem('theme') === 'dark') {
     document.body.classList.add('dark-theme');
     themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
 }

 themeToggleBtn.addEventListener('click', () => {
     document.body.classList.toggle('dark-theme');
     const isDark = document.body.classList.contains('dark-theme');
     localStorage.setItem('theme', isDark ? 'dark' : 'light');
     themeToggleBtn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
 });

 // Live Attachment Upload Handlers
 localFileInput.addEventListener('change', async(e) => {
     if (e.target.files.length === 0) return;
     const file = e.target.files[0];

     if (file.size > 3 * 1024 * 1024) {
         showToast("حجم الملف كبير جداً. يرجى اختيار ملف أقل من 3 ميجابايت.", "danger");
         localFileInput.value = '';
         return;
     }

     const reader = new FileReader();
     reader.onload = () => {
         pendingFile = {
             base64: reader.result,
             name: file.name,
             type: file.type
         };

         // Show preview UI
         attachmentFileName.textContent = file.name;
         attachmentFileSize.textContent = (file.size / 1024).toFixed(1) + " KB";

         if (file.type.startsWith('image/')) {
             attachmentThumb.src = reader.result;
             attachmentThumb.style.display = 'block';
             attachmentBadge.style.display = 'none';
         } else {
             attachmentThumb.style.display = 'none';
             attachmentBadge.style.display = 'flex';
         }

         attachmentPreviewBox.classList.add('active');
     };
     reader.readAsDataURL(file);
 });

 removeFileBtn.addEventListener('click', () => {
     clearAttachmentPreview();
 });

 function clearAttachmentPreview() {
     pendingFile = null;
     localFileInput.value = '';
     attachmentPreviewBox.classList.remove('active');
     attachmentThumb.src = '';
 }

 // Realtime Firebase Listener
 onSnapshot(tasksCollection, (snapshot) => {
     tasks = snapshot.docs.map(doc => ({
         id: doc.id,
         ...doc.data()
     }));
     loadingSpinner.style.display = 'none';
     renderTasks();
     updateDashboard();
 }, (error) => {
     console.error("Firebase Sync Error: ", error);
     loadingSpinner.innerHTML = '<p style="color:var(--danger)">حدث خطأ في تحميل البيانات. تأكد من الاتصال.</p>';
 });

 // Add New Task
 form.addEventListener('submit', async(e) => {
     e.preventDefault();

     const dueDate = document.getElementById('due-date-picker').value;
     const dueDay = document.getElementById('due-day-select').value;
     const dueTime = document.getElementById('due-time').value || '23:59';

     if (!dueDate && !dueDay) {
         showToast('يرجى تحديد تاريخ استحقاق أو يوم أسبوعي.', 'danger');
         return;
     }

     const newTask = {
         course: document.getElementById('course-name').value.trim(),
         type: document.getElementById('task-type').value,
         dueDate: dueDate,
         dueDay: dueDay,
         dueTime: dueTime,
         priority: document.getElementById('priority').value,
         notes: document.getElementById('notes').value.trim(),
         referenceUrl: document.getElementById('reference-url').value.trim(),
         attachedFile: pendingFile,
         completed: false,
         completionDate: null,
         createdAt: new Date().toISOString()
     };

     try {
         await addDoc(tasksCollection, newTask);

         // Form Reset & Clear Attachment
         form.reset();
         document.getElementById('due-time').value = "23:59";
         clearAttachmentPreview();

         // Feedback: Audio + Toast Notification (3 Seconds)
         playAudioFeedback('success');
         showToast("تم حفظ الواجب بنجاح! 🎉", "success");

         // Scroll Smoothly to Top of Tasks List / First Task
         document.getElementById('tasks-list-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });

     } catch (error) {
         showToast("حدث خطأ أثناء حفظ الواجب.", "danger");
     }
 });

 // Calculate Target Date
 function getActualDueDate(task) {
     if (task.dueDate) {
         return new Date(`${task.dueDate}T${task.dueTime}:00`);
     }
     if (task.dueDay) {
         const daysMap = { 'الأحد': 0, 'الاثنين': 1, 'الثلاثاء': 2, 'الأربعاء': 3, 'الخميس': 4, 'الجمعة': 5, 'السبت': 6 };
         const targetDay = daysMap[task.dueDay];
         if (targetDay === undefined) return null;

         const now = new Date();
         let dayDiff = targetDay - now.getDay();
         if (dayDiff < 0) dayDiff += 7;
         else if (dayDiff === 0) {
             const [h, m] = task.dueTime.split(':');
             const targetTime = new Date();
             targetTime.setHours(h, m, 0, 0);
             if (now > targetTime) dayDiff = 7;
         }

         const nextDate = new Date();
         nextDate.setDate(now.getDate() + dayDiff);
         const [hours, minutes] = task.dueTime.split(':');
         nextDate.setHours(hours, minutes, 0, 0);
         return nextDate;
     }
     return null;
 }

 // Render Tasks Function
 function renderTasks() {
     let filtered = tasks.filter(t => {
         const matchesSearch = t.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
             (t.notes && t.notes.toLowerCase().includes(searchQuery.toLowerCase()));

         if (!matchesSearch) return false;

         if (currentFilter === 'pending') return !t.completed;
         if (currentFilter === 'completed') return t.completed;
         if (currentFilter === 'high') return t.priority === 'high' && !t.completed;
         return true;
     });

     // Sorting
     filtered.sort((a, b) => {
         if (a.completed !== b.completed) return a.completed ? 1 : -1;
         const dateA = getActualDueDate(a);
         const dateB = getActualDueDate(b);
         if (dateA && dateB) return dateA - dateB;
         return 0;
     });

     tasksContainer.innerHTML = '';

     if (filtered.length === 0) {
         noTasksMessage.style.display = 'block';
         return;
     }
     noTasksMessage.style.display = 'none';

     filtered.forEach(task => {
                 const row = document.createElement('tr');
                 row.className = `task-row ${task.priority} ${task.completed ? 'completed' : ''}`;

                 const actualDue = getActualDueDate(task);
                 let dateDisplay = task.dueDay ? `${task.dueDay} (أسبوعي)` : task.dueDate;
                 let countdownHTML = '';

                 if (!task.completed && actualDue) {
                     const remaining = calculateCountdown(actualDue);
                     countdownHTML = `<br><span class="countdown-tag"><i class="far fa-clock"></i> ${remaining}</span>`;
                 }

                 const typeLabels = {
                     homework: 'واجب بيتي',
                     project: 'مشروع',
                     report: 'تقرير',
                     exam: 'امتحان'
                 };

                 row.innerHTML = `
                    <td data-label="المادة">
                        <span class="course-title">${escapeHtml(task.course)}</span>
                    </td>
                    <td data-label="النوع">
                        <span class="type-badge">${typeLabels[task.type] || task.type}</span>
                    </td>
                    <td data-label="الموعد">
                        <span class="time-badge">${dateDisplay || '--'} | ${task.dueTime}</span>
                        ${countdownHTML}
                    </td>
                    <td data-label="الأولوية">
                        <span class="priority-badge ${task.priority}">${getPriorityText(task.priority)}</span>
                    </td>
                    <td data-label="الحالة">
                        ${task.completed ? '<span style="color:var(--secondary); font-weight:bold;"><i class="fas fa-check-circle"></i> مكتمل</span>' : '<span style="color:var(--text-muted)">قادم</span>'}
                    </td>
                    <td data-label="الإجراءات">
                        <div class="actions-cell">
                            <button class="btn-icon btn-toggle" data-id="${task.id}" title="${task.completed ? 'تحديد كغير مكتمل' : 'تحديد كمكتمل'}">
                                <i class="${task.completed ? 'fas fa-undo' : 'fas fa-check'}"></i>
                            </button>
                            ${(task.referenceUrl || task.attachedFile) ? `
                                <button class="btn-icon btn-ref" data-id="${task.id}" title="عرض المرجع">
                                    <i class="fas fa-paperclip"></i>
                                </button>
                            ` : ''}
                            ${task.notes ? `
                                <button class="btn-icon btn-notes" data-id="${task.id}" title="عرض الملاحظات">
                                    <i class="fas fa-sticky-note"></i>
                                </button>
                            ` : ''}
                            <button class="btn-icon btn-delete" data-id="${task.id}" title="حذف">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </td>
                `;

                tasksContainer.appendChild(row);
            });

            bindActions();
        }

        // Action Buttons Setup
        function bindActions() {
            // Toggle complete
            document.querySelectorAll('.btn-toggle').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.currentTarget.dataset.id;
                    const task = tasks.find(t => t.id === id);
                    if (task) {
                        const isNowCompleted = !task.completed;
                        const taskRef = doc(db, "tasks", id);
                        await updateDoc(taskRef, {
                            completed: isNowCompleted,
                            completionDate: isNowCompleted ? new Date().toISOString() : null
                        });

                        if (isNowCompleted) {
                            playAudioFeedback('complete');
                            triggerConfetti();
                            showToast("عاشت ايدك! تم إنجاز الواجب 👏", "success");
                        }
                    }
                });
            });

            // Delete task with custom sleek modal
            document.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    pendingDeleteId = e.currentTarget.dataset.id;
                    deleteModal.classList.add('show');
                });
            });

            // Open Notes/Ref Modal
            document.querySelectorAll('.btn-notes, .btn-ref').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.id;
                    const task = tasks.find(t => t.id === id);
                    if (!task) return;

                    fileAttachmentInfo.style.display = 'none';
                    filePreview.style.display = 'none';
                    modalNotesText.innerHTML = '';

                    if (e.currentTarget.classList.contains('btn-notes')) {
                        modalTitle.innerHTML = `<i class="fas fa-sticky-note"></i> ملاحظات: ${escapeHtml(task.course)}`;
                        modalNotesText.textContent = task.notes;
                    } else {
                        modalTitle.innerHTML = `<i class="fas fa-paperclip"></i> المرجع المرفق: ${escapeHtml(task.course)}`;
                        
                        if (task.referenceUrl) {
                            modalNotesText.innerHTML = `رابط خارجي: <a href="${task.referenceUrl}" target="_blank" style="color:var(--primary); word-break:break-all;">${task.referenceUrl}</a>`;
                        }

                        if (task.attachedFile) {
                            fileAttachmentInfo.style.display = 'block';
                            downloadLink.href = task.attachedFile.base64;
                            downloadLink.download = task.attachedFile.name;

                            if (task.attachedFile.type.includes('pdf') || task.attachedFile.type.includes('image')) {
                                filePreview.src = task.attachedFile.base64;
                                filePreview.style.display = 'block';
                            }
                        }
                    }

                    notesModal.classList.add('show');
                });
            });
        }

        // Delete Confirm Listener
        confirmDeleteBtn.addEventListener('click', async () => {
            if (pendingDeleteId) {
                await deleteDoc(doc(db, "tasks", pendingDeleteId));
                showToast("تم حذف الواجب.", "danger");
                pendingDeleteId = null;
                deleteModal.classList.remove('show');
            }
        });

        cancelDeleteBtn.addEventListener('click', () => {
            pendingDeleteId = null;
            deleteModal.classList.remove('show');
        });

        // Dashboard Metrics Update
        function updateDashboard() {
            const total = tasks.length;
            const upcoming = tasks.filter(t => !t.completed).length;
            const completed = total - upcoming;

            document.getElementById('upcoming-count').textContent = upcoming;
            const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
            document.getElementById('completion-rate').textContent = `${rate}%`;
            document.getElementById('progress-fill').style.width = `${rate}%`;

            // Average Delay Calculation
            let totalDelay = 0;
            let count = 0;
            tasks.filter(t => t.completed && t.completionDate).forEach(t => {
                const due = getActualDueDate(t);
                if (due) {
                    const delayDays = (new Date(t.completionDate) - due) / (1000 * 60 * 60 * 24);
                    totalDelay += delayDays;
                    count++;
                }
            });

            const avg = count > 0 ? (totalDelay / count).toFixed(1) : 0;
            document.getElementById('average-delay').textContent = avg > 0 ? `${avg} يوم` : 'في الموعد';

            // Nearest Due
            const sortedUpcoming = tasks
                .filter(t => !t.completed)
                .map(t => ({ task: t, date: getActualDueDate(t) }))
                .filter(item => item.date)
                .sort((a, b) => a.date - b.date);

            if (sortedUpcoming.length > 0) {
                const nearest = sortedUpcoming[0];
                document.getElementById('nearest-due').innerHTML = `
                    <strong>${escapeHtml(nearest.task.course)}</strong><br>
                    <small style="color:var(--danger)">${calculateCountdown(nearest.date)}</small>
                `;
            } else {
                document.getElementById('nearest-due').textContent = 'لا يوجد حاليًا';
            }
        }

        // Helpers
        function calculateCountdown(dueDate) {
            const diffMs = dueDate - new Date();
            if (diffMs < 0) return 'متأخر!';
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            if (diffDays > 0) return `متبقي ${diffDays} يوم`;
            if (diffHours > 0) return `متبقي ${diffHours} ساعة`;
            return 'أقل من ساعة!';
        }

        function getPriorityText(p) {
            return p === 'high' ? 'عالية 🔥' : (p === 'medium' ? 'متوسطة ⚡' : 'منخفضة ☕');
        }

        function escapeHtml(str) {
            return str.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
        }

        // Listeners for Filters & Search
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderTasks();
        });

        filterTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                filterTabs.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                currentFilter = e.target.dataset.filter;
                renderTasks();
            });
        });

        // Close Modals on click outside or close button
        modalCloseBtn.addEventListener('click', () => notesModal.classList.remove('show'));
        window.addEventListener('click', (e) => {
            if (e.target === notesModal) notesModal.classList.remove('show');
            if (e.target === deleteModal) deleteModal.classList.remove('show');
        });