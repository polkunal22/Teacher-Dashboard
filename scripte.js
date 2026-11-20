document.addEventListener('DOMContentLoaded', () => {
  const toastEl = document.getElementById('appToast');
  const toast = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 2600 });
  const notify = (message) => {
    document.getElementById('toastMessage').textContent = message;
    toast.show();
  };
  const escapeHTML = (value) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const splitCourse = (value) => {
    const grade = value.match(/Grade\s+\d+[A-Z]?/i);
    if (!grade) return [value, ''];
    return [value.slice(0, grade.index).replace(/[- ]+$/g, '').trim(), grade[0]];
  };
  const studentRows = document.getElementById('studentRows');
  const studentTotal = document.getElementById('totalStudents');
  const studentCountLabel = document.getElementById('studentCountLabel');
  const sidebar = document.getElementById('sidebar');
  const pageContent = document.querySelector('.page-content');
  const pageHeading = document.createElement('section');
  pageHeading.className = 'page-heading';
  pageHeading.setAttribute('aria-live', 'polite');
  pageHeading.innerHTML = '<h1></h1><p></p>';
  pageContent.prepend(pageHeading);
  const updateWelcome = () => {
    const now = new Date();
    const hour = now.getHours();
    const salutation = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const firstName = document.querySelector('.user-chip strong').textContent.trim().split(/\s+/)[0];
    document.getElementById('welcomeDate').textContent = new Intl.DateTimeFormat('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    }).format(now).toUpperCase();
    document.getElementById('welcomeGreeting').textContent = `${salutation}, ${firstName}`;
  };
  const pageDetails = {
    overview: ['Overview', 'Here’s what’s happening in your classroom today.'],
    students: ['Students', 'Manage your learner roster and track progress.'],
    courses: ['Courses', 'Review your active learning spaces.'],
    attendance: ['Attendance', 'Monitor class attendance and mark today’s register.'],
    assignments: ['Assignments', 'Manage upcoming work and review its status.'],
    timetable: ['Timetable', 'Review your classes and teaching schedule.'],
    results: ['Results', 'Review recent student performance.'],
    announcements: ['Announcements', 'Share and review school updates.'],
    announcementManager: ['Manage announcements', 'Create, review, and remove school updates.'],
    profile: ['My profile', 'Manage your teacher account and contact details.']
  };
  const showPage = (pageId, updateHistory = true) => {
    const page = pageDetails[pageId] ? pageId : 'overview';
    document.body.dataset.page = page;
    pageHeading.querySelector('h1').textContent = pageDetails[page][0];
    pageHeading.querySelector('p').textContent = pageDetails[page][1];
    document.querySelectorAll('.focused-page-container, .focused-page-panel').forEach((element) => {
      element.classList.remove('focused-page-container', 'focused-page-panel');
    });
    document.querySelectorAll('.side-nav .nav-link').forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === `#${page}`);
    });
    if (page !== 'overview') {
      const target = document.getElementById(page);
      const container = target.closest('.dashboard-grid') || target;
      if (container !== target) container.classList.add('focused-page-container');
      target.classList.add('focused-page-panel');
    }
    document.querySelector('.breadcrumb-text strong').textContent = pageDetails[page][0];
    sidebar.classList.remove('open');
    if (updateHistory && location.hash !== `#${page}`) history.pushState({ page }, '', `#${page}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  let totalStudentCount = Number(studentTotal.textContent);
  let totalCourseCount = Number(document.getElementById('totalCourses').textContent);
  const syncAssignmentSummary = () => {
    const assignments = [...document.querySelectorAll('#assignmentList .assignment-item')];
    document.getElementById('totalAssignments').textContent = String(assignments.length).padStart(2, '0');
    document.getElementById('assignmentTotalStat').textContent = assignments.length;
    document.getElementById('assignmentPendingStat').textContent = assignments.filter((item) => item.querySelector('.status-pending')).length;
    document.getElementById('assignmentProgressStat').textContent = assignments.filter((item) => item.querySelector('.status-progress')).length;
  };
  const renderAnnouncementManager = () => {
    const feed = document.getElementById('announcementFeed');
    const list = document.getElementById('announcementManagerList');
    list.replaceChildren();
    [...feed.querySelectorAll('.announcement-content')].forEach((announcement, index) => {
      if (!announcement.dataset.announcementId) announcement.dataset.announcementId = `announcement-${index + 1}-${Date.now()}`;
      const row = document.createElement('article');
      row.className = 'manager-announcement-row';
      const copy = document.createElement('div');
      copy.className = 'manager-announcement-copy';
      const audience = document.createElement('small');
      audience.textContent = announcement.querySelector('.announcement-tag')?.textContent.trim() || 'ANNOUNCEMENT';
      const title = document.createElement('strong');
      title.textContent = announcement.querySelector('h3')?.textContent || 'Untitled announcement';
      const message = document.createElement('p');
      message.textContent = announcement.querySelector('p')?.textContent || '';
      copy.append(audience, title, message);
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'btn btn-outline-danger manager-delete';
      remove.dataset.announcementId = announcement.dataset.announcementId;
      remove.setAttribute('aria-label', `Delete ${title.textContent}`);
      remove.innerHTML = '<i class="bi bi-trash3"></i><span>Delete</span>';
      row.append(copy, remove);
      list.append(row);
    });
    const total = feed.querySelectorAll('.announcement-content').length;
    document.getElementById('announcementCount').textContent = `${total} ${total === 1 ? 'item' : 'items'}`;
    if (!total) {
      const empty = document.createElement('p');
      empty.className = 'manager-empty';
      empty.textContent = 'No announcements yet. Publish your first update above.';
      list.append(empty);
    }
  };

  const syncStudentCount = () => {
    studentTotal.textContent = String(totalStudentCount).padStart(2, '0');
    studentCountLabel.innerHTML = `Showing <b>${studentRows.querySelectorAll('tr:not(.filtered-out)').length}</b> of <b>${totalStudentCount}</b> students`;
  };
  const filterStudents = (query) => {
    const normalized = query.trim().toLowerCase();
    let visible = 0;
    studentRows.querySelectorAll('tr').forEach((row) => {
      const matches = row.dataset.search.includes(normalized);
      row.classList.toggle('filtered-out', !matches);
      row.classList.toggle('d-none', !matches);
      if (matches) visible++;
    });
    document.getElementById('emptySearch').classList.toggle('d-none', visible !== 0);
    studentCountLabel.innerHTML = `Showing <b>${visible}</b> of <b>${totalStudentCount}</b> students`;
  };
  const searchField = document.getElementById('studentSearch');
  searchField.addEventListener('input', () => filterStudents(searchField.value));
  document.getElementById('globalSearch').addEventListener('input', (event) => {
    searchField.value = event.target.value;
    filterStudents(event.target.value);
    if (event.target.value) showPage('students');
  });

  document.getElementById('studentForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.getElementById('studentName').value.trim();
    const email = document.getElementById('studentEmail').value.trim();
    const course = document.getElementById('studentCourse').value;
    if (!name || !email) return;
    const courseParts = splitCourse(course);
    const firstName = name.split(/\s+/)[0];
    const photoId = Math.floor(Math.random() * 70) + 1;
    const row = document.createElement('tr');
    row.dataset.search = `${name} ${email} ${course}`.toLowerCase();
    row.innerHTML = `<td><div class="student-name"><img src="https://i.pravatar.cc/80?img=${photoId}" alt=""><span><strong>${escapeHTML(name)}</strong><small>${escapeHTML(email)}</small></span></div></td><td>${escapeHTML(courseParts[0])}<small class="cell-sub">${escapeHTML(courseParts[1])}</small></td><td><span class="attendance-value">100%</span></td><td><span class="grade-pill grade-a">—</span></td><td><button class="row-menu" aria-label="Actions for ${escapeHTML(firstName)}"><i class="bi bi-three-dots"></i></button></td>`;
    studentRows.prepend(row);
    totalStudentCount++;
    event.target.reset();
    bootstrap.Modal.getInstance(document.getElementById('studentModal')).hide();
    filterStudents(searchField.value);
    syncStudentCount();
    notify(`${name} was added to your students.`);
  });

  studentRows.addEventListener('click', (event) => {
    const button = event.target.closest('.row-menu');
    if (!button) return;
    const row = button.closest('tr');
    const name = row.querySelector('.student-name strong').textContent;
    const action = window.prompt(`Student: ${name}\nType "edit" to update the name or "delete" to remove this student.`);
    if (!action) return;
    if (action.trim().toLowerCase() === 'delete') {
      row.remove();
      totalStudentCount = Math.max(0, totalStudentCount - 1);
      syncStudentCount();
      filterStudents(searchField.value);
      notify(`${name} was removed from your roster.`);
    } else if (action.trim().toLowerCase() === 'edit') {
      const newName = window.prompt('Enter the student’s updated name:', name);
      if (!newName || !newName.trim()) return;
      row.querySelector('.student-name strong').textContent = newName.trim();
      row.dataset.search = row.dataset.search.replace(name.toLowerCase(), newName.trim().toLowerCase());
      filterStudents(searchField.value);
      notify('Student name updated.');
    }
  });

  document.getElementById('assignmentForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const title = document.getElementById('assignmentName').value.trim();
    const course = document.getElementById('assignmentCourse').value;
    const dueValue = document.getElementById('assignmentDue').value;
    if (!title || !dueValue) return;
    const courseParts = splitCourse(course);
    const date = new Date(`${dueValue}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const item = document.createElement('article');
    item.className = 'assignment-item';
    item.innerHTML = `<span class="assignment-icon purple-bg"><i class="bi bi-file-earmark-text"></i></span><div><strong>${escapeHTML(title)}</strong><span>${escapeHTML(courseParts[0])} <i></i> ${escapeHTML(courseParts[1])}</span><small><i class="bi bi-calendar3"></i> Due ${date}</small></div><span class="status-pill status-pending">Pending</span>`;
    document.getElementById('assignmentList').prepend(item);
    syncAssignmentSummary();
    event.target.reset();
    bootstrap.Modal.getInstance(document.getElementById('assignmentModal')).hide();
    notify('Assignment created successfully.');
  });
  document.getElementById('assignmentModal').addEventListener('show.bs.modal', () => {
    const dueDate = document.getElementById('assignmentDue');
    const now = new Date();
    const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    dueDate.min = today;
    if (!dueDate.value || dueDate.value < today) dueDate.value = today;
  });

  document.getElementById('addCourseButton').addEventListener('click', () => bootstrap.Modal.getOrCreateInstance(document.getElementById('courseModal')).show());
  document.getElementById('courseForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.getElementById('courseName').value.trim();
    const grade = document.getElementById('courseGrade').value;
    if (!name) return;
    const card = document.createElement('article');
    card.className = 'course-card course-purple';
    card.innerHTML = `<span class="course-symbol"><i class="bi bi-journal-bookmark"></i></span><span class="course-term">FALL ${new Date().getFullYear()}</span><h3>${escapeHTML(name)}</h3><p>${escapeHTML(grade)} · 1 class</p><div class="course-progress"><span><i style="width:0%"></i></span><small>Just created</small></div>`;
    document.getElementById('coursesGrid').prepend(card);
    const courseOption = document.createElement('option');
    courseOption.value = `${name} - ${grade}`;
    courseOption.textContent = courseOption.value;
    document.querySelectorAll('#studentCourse, #assignmentCourse').forEach((select) => select.add(courseOption.cloneNode(true)));
    totalCourseCount++;
    document.getElementById('totalCourses').textContent = String(totalCourseCount).padStart(2, '0');
    event.target.reset();
    bootstrap.Modal.getInstance(document.getElementById('courseModal')).hide();
    notify(`${name} was added to your courses.`);
  });

  document.getElementById('editProfileButton').addEventListener('click', () => bootstrap.Modal.getOrCreateInstance(document.getElementById('profileModal')).show());
  document.getElementById('profileForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.getElementById('profileName').value.trim();
    const email = document.getElementById('profileEmail').value.trim();
    const phone = document.getElementById('profilePhone').value.trim();
    document.querySelector('#profile .profile-details > div:nth-child(2) strong').textContent = name;
    document.querySelector('#profile .profile-contact span:first-child').innerHTML = `<i class="bi bi-envelope"></i> ${escapeHTML(email)}`;
    document.querySelector('#profile .profile-contact span:last-child').innerHTML = `<i class="bi bi-telephone"></i> ${escapeHTML(phone)}`;
    document.querySelector('.user-chip strong').textContent = name;
    updateWelcome();
    document.getElementById('profileModalTitle').textContent = 'Edit profile';
    bootstrap.Modal.getInstance(document.getElementById('profileModal')).hide();
    notify('Your profile has been updated.');
  });

  document.getElementById('attendanceButton').addEventListener('click', () => {
    const button = document.getElementById('attendanceButton');
    const present = document.getElementById('presentCount');
    const absent = document.getElementById('absentCount');
    if (button.dataset.marked === 'true') {
      notify('Attendance for Grade 9A is already saved.');
      return;
    }
    button.dataset.marked = 'true';
    button.innerHTML = 'Attendance saved <i class="bi bi-check2"></i>';
    button.classList.add('btn-success');
    const count = Number(present.textContent) + Number(absent.textContent);
    document.getElementById('attendancePercent').textContent = `${Math.round((Number(present.textContent) / count) * 100)}%`;
    notify('Attendance marked for Grade 9A.');
  });

  document.getElementById('announcementButton').addEventListener('click', () => {
    renderAnnouncementManager();
    showPage('announcementManager');
  });
  document.getElementById('announcementManagerBack').addEventListener('click', () => showPage('announcements'));
  document.getElementById('announcementForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const title = document.getElementById('announcementTitle').value.trim();
    const message = document.getElementById('announcementMessage').value.trim();
    const audience = document.getElementById('announcementAudience').value;
    if (!title || !message) return;
    const announcement = document.createElement('div');
    announcement.className = 'announcement-content announcement-new';
    announcement.dataset.announcementId = `announcement-${Date.now()}`;
    announcement.innerHTML = '<span class="announcement-icon"><i class="bi bi-megaphone-fill"></i></span><div><span class="announcement-tag"></span><h3></h3><p></p></div>';
    announcement.querySelector('.announcement-tag').innerHTML = `${audience} <i></i> JUST NOW`;
    announcement.querySelector('h3').textContent = title;
    announcement.querySelector('p').textContent = message;
    document.getElementById('announcementFeed').prepend(announcement);
    event.target.reset();
    renderAnnouncementManager();
    showPage('announcements');
    notify('Announcement published.');
  });
  document.getElementById('announcementManagerList').addEventListener('click', (event) => {
    const button = event.target.closest('.manager-delete');
    if (!button) return;
    const announcement = [...document.querySelectorAll('#announcementFeed .announcement-content')]
      .find((item) => item.dataset.announcementId === button.dataset.announcementId);
    if (!announcement) return;
    const title = announcement.querySelector('h3')?.textContent || 'this announcement';
    if (!window.confirm(`Delete “${title}”?`)) return;
    announcement.remove();
    renderAnnouncementManager();
    notify('Announcement deleted.');
  });

  document.getElementById('menuToggle').addEventListener('click', () => sidebar.classList.toggle('open'));
  document.querySelectorAll('.side-nav .nav-link, .brand, .user-chip').forEach((link) => link.addEventListener('click', (event) => {
    const page = link.getAttribute('href')?.slice(1);
    if (page === 'logout') {
      event.preventDefault();
      notify('You’re all caught up. You can safely close this page.');
      return;
    }
    if (!pageDetails[page]) return;
    event.preventDefault();
    showPage(page);
  }));
  window.addEventListener('popstate', () => showPage(location.hash.slice(1) || 'overview', false));
  document.querySelectorAll('[data-jump]').forEach((button) => button.addEventListener('click', () => {
    const target = document.getElementById(button.dataset.jump);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else notify('You’re viewing all available records.');
  }));
  document.querySelector('.notification-button').addEventListener('click', () => notify('You’re all caught up on notifications.'));
  document.querySelectorAll('.icon-more, .announcement-more').forEach((button) => button.addEventListener('click', () => notify('No additional options right now.')));
  syncStudentCount();
  syncAssignmentSummary();
  renderAnnouncementManager();
  updateWelcome();
  showPage(location.hash.slice(1) || 'overview', false);
});
