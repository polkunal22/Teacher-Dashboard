document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isPointerFine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const toastEl = document.getElementById('appToast');
  const toast = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 2800 });
  const notify = (message) => {
    document.getElementById('toastMessage').textContent = message;
    toast.show();
  };

  const escapeHTML = (value) =>
    value.replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]);

  const splitCourse = (value) => {
    const grade = value.match(/Grade\s+\d+[A-Z]?/i);
    if (!grade) return [value, ''];
    return [value.slice(0, grade.index).replace(/[- ]+$/g, '').trim(), grade[0]];
  };

  const studentRows = document.getElementById('studentRows');
  const studentTotal = document.getElementById('totalStudents');
  const sidebarStudentCount = document.getElementById('sidebarStudentCount');
  const sidebarAssignmentCount = document.getElementById('sidebarAssignmentCount');
  const studentCountLabel = document.getElementById('studentCountLabel');
  const sidebar = document.getElementById('sidebar');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');
  const topbar = document.getElementById('topbar');
  const pageContent = document.querySelector('.page-content');

  const pageHeading = document.createElement('section');
  pageHeading.className = 'page-heading';
  pageHeading.setAttribute('aria-live', 'polite');
  pageHeading.innerHTML = '<h1></h1><p></p>';
  pageContent.prepend(pageHeading);

  /* ==========================================================================
     1. Dynamic Greeting & Live Date
     ========================================================================== */
  const updateWelcome = () => {
    const now = new Date();
    const hour = now.getHours();
    const salutation = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const firstName = document.querySelector('.user-chip strong').textContent.trim().split(/\s+/)[0];
    document.getElementById('welcomeDate').textContent = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(now).toUpperCase();
    document.getElementById('welcomeGreeting').textContent = `${salutation}, ${firstName}`;
  };

  /* ==========================================================================
     2. Animated Number Counters & Attendance Conic Ring
     ========================================================================== */
  const animateCounter = (el, targetValue, padLength = 0, suffix = '') => {
    if (!el) return;
    const formatVal = (n) => (padLength ? String(Math.round(n)).padStart(padLength, '0') : String(Math.round(n))) + suffix;
    if (prefersReducedMotion) {
      el.textContent = formatVal(targetValue);
      return;
    }
    const duration = 900;
    const startTime = performance.now();
    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = formatVal(targetValue * eased);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = formatVal(targetValue);
      }
    };
    requestAnimationFrame(step);
  };

  const animateAttendanceRing = (targetPct) => {
    const ring = document.getElementById('attendanceRing');
    const label = document.getElementById('attendancePercent');
    if (!ring || !label) return;
    if (prefersReducedMotion) {
      ring.style.setProperty('--attendance-pct', targetPct);
      label.textContent = `${targetPct}%`;
      return;
    }
    const duration = 1000;
    const startTime = performance.now();
    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(targetPct * eased);
      ring.style.setProperty('--attendance-pct', current);
      label.textContent = `${current}%`;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  /* ==========================================================================
     3. Entrance Reveal Animations & Interactive Hover Physics
     ========================================================================== */
  const triggerEntranceAnimations = () => {
    const animatedEls = document.querySelectorAll('[data-animate]');
    if (prefersReducedMotion) {
      animatedEls.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    animatedEls.forEach((el, idx) => {
      el.style.transitionDelay = `${Math.min(idx * 55, 360)}ms`;
      requestAnimationFrame(() => {
        el.classList.add('is-visible');
      });
    });
  };

  const attachInteractiveCardEffects = (root = document) => {
    if (!isPointerFine || prefersReducedMotion) return;
    root.querySelectorAll('.interactive-card').forEach((card) => {
      if (card.dataset.interactiveBound) return;
      card.dataset.interactiveBound = 'true';
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      });
    });

    root.querySelectorAll('.magnetic-btn').forEach((btn) => {
      if (btn.dataset.magneticBound) return;
      btn.dataset.magneticBound = 'true';
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const dx = (e.clientX - (rect.left + rect.width / 2)) * 0.16;
        const dy = (e.clientY - (rect.top + rect.height / 2)) * 0.16;
        btn.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  };

  /* ==========================================================================
     4. SPA Workspace Navigation & Mobile Drawer
     ========================================================================== */
  const pageDetails = {
    overview: ['Overview', 'Here’s what’s happening in your classroom today.'],
    students: ['Students', 'Manage your learner roster and track progress.'],
    courses: ['Courses', 'Review your active learning spaces.'],
    attendance: ['Attendance', 'Monitor class attendance and mark today’s register.'],
    assignments: ['Assignments', 'Manage upcoming work and review its status.'],
    timetable: ['Lectures & Schedule', 'Review your lectures and teaching schedule for today.'],
    results: ['Results', 'Review recent student performance.'],
    announcements: ['Announcements', 'Share and review school updates.'],
    announcementManager: ['Manage announcements', 'Create, review, and remove school updates.'],
    database: ['SQL Database Studio', 'Inspect live relational SQL tables, execute queries, and export SQL dumps.'],
    profile: ['My profile', 'Manage your teacher account and contact details.']
  };

  const teacherAllowedPages = new Set([
    'overview',
    'students',
    'timetable',
    'announcements',
    'announcementManager',
    'profile'
  ]);

  const closeSidebar = () => {
    sidebar.classList.remove('open');
    if (sidebarBackdrop) sidebarBackdrop.classList.remove('show');
  };

  /* ==========================================================================
     4A. End-to-End Authentication (Admin & Teacher) + Workspace Persistence
     ========================================================================== */
  const AUTH_STORAGE_KEY = 'learnly_auth_session_v1';
  const ACCOUNTS_STORAGE_KEY = 'learnly_auth_accounts_v1';
  const WORKSPACE_STORAGE_KEY = 'learnly_workspace_state_v1';

  const defaultAccounts = {
    admin: {
      username: 'admin',
      email: 'admin@learnly.edu',
      password: 'Admin@123',
      name: 'Olivia Martin',
      roleBadge: 'ADMIN',
      roleShort: 'System Admin',
      roleTitle: 'Mathematics & Science Teacher · System Administrator',
      phone: '+1 (555) 204-8190'
    },
    teacher: {
      username: 'teacher',
      email: 'olivia.martin@learnly.edu',
      password: 'Teacher@123',
      name: 'Olivia Martin',
      roleBadge: 'EDUCATOR',
      roleShort: 'Lead Educator',
      roleTitle: 'Mathematics & Science Teacher · Senior Faculty',
      phone: '+1 (555) 204-8190'
    }
  };

  const getAccounts = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(ACCOUNTS_STORAGE_KEY));
      if (saved && saved.admin && saved.teacher) return saved;
    } catch (_) {}
    return structuredClone ? structuredClone(defaultAccounts) : JSON.parse(JSON.stringify(defaultAccounts));
  };

  const saveAccounts = (accounts) => {
    try {
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    } catch (_) {}
  };

  let accounts = getAccounts();
  let currentSession = null;

  const authOverlay = document.getElementById('authOverlay');
  const authForm = document.getElementById('authForm');
  const authEmailInput = document.getElementById('authEmail');
  const authPasswordInput = document.getElementById('authPassword');
  const authRememberInput = document.getElementById('authRemember');
  const authError = document.getElementById('authError');
  const authErrorText = document.getElementById('authErrorText');
  const fillAdminBtn = document.getElementById('fillAdminBtn');
  const fillTeacherBtn = document.getElementById('fillTeacherBtn');
  const roleTabAdmin = document.getElementById('roleTabAdmin');
  const roleTabTeacher = document.getElementById('roleTabTeacher');
  const togglePasswordBtn = document.getElementById('togglePasswordBtn');

  const setAuthPortalMode = (mode) => {
    const isTeacher = mode === 'teacher';
    if (authOverlay) authOverlay.dataset.authMode = isTeacher ? 'teacher' : 'admin';

    const targetAcc = isTeacher ? accounts.teacher : accounts.admin;
    if (authEmailInput) authEmailInput.value = targetAcc.email;
    if (authPasswordInput) authPasswordInput.value = targetAcc.password;

    fillAdminBtn?.classList.toggle('active', !isTeacher);
    fillTeacherBtn?.classList.toggle('active', isTeacher);
    roleTabAdmin?.classList.toggle('active', !isTeacher);
    roleTabTeacher?.classList.toggle('active', isTeacher);
    roleTabAdmin?.setAttribute('aria-selected', String(!isTeacher));
    roleTabTeacher?.setAttribute('aria-selected', String(isTeacher));

    const hintEl = document.getElementById('authPasswordHint');
    if (hintEl) hintEl.textContent = `Default: ${targetAcc.password}`;

    const submitLabel = document.getElementById('authSubmitLabel');
    if (submitLabel) {
      submitLabel.textContent = isTeacher ? 'Sign in as Educator' : 'Sign in as Administrator';
    }

    const cardBadge = document.getElementById('authCardRoleBadge');
    if (cardBadge) {
      cardBadge.textContent = isTeacher ? 'TEACHER PORTAL' : 'ADMIN PORTAL';
    }

    const previewIcon = document.getElementById('authPreviewIcon');
    const previewTitle = document.getElementById('authPreviewTitle');
    const previewBadge = document.getElementById('authPreviewBadge');
    const previewDesc = document.getElementById('authPreviewDesc');

    if (previewIcon) {
      previewIcon.innerHTML = isTeacher
        ? '<i class="bi bi-person-workspace"></i>'
        : '<i class="bi bi-shield-fill-check"></i>';
    }
    if (previewTitle) {
      previewTitle.textContent = isTeacher ? 'Faculty Educator Portal' : 'System Administrator Portal';
    }
    if (previewBadge) {
      previewBadge.textContent = isTeacher ? '3 CORE MODULES' : 'FULL ACCESS · 8 MODULES';
    }
    if (previewDesc) {
      previewDesc.textContent = isTeacher
        ? 'Focused classroom view showing only Students, Today’s Lectures, and School Announcements.'
        : 'Unrestricted control across all 8 institutional modules, faculty settings, and analytics.';
    }

    authError?.classList.add('d-none');
  };

  const applyAuthenticatedUser = (user) => {
    currentSession = user;
    const roleKey = user.roleKey || (user.roleBadge === 'EDUCATOR' ? 'teacher' : 'admin');
    document.body.dataset.role = roleKey;

    const brandBadge = document.querySelector('.sidebar .brand-badge');
    if (brandBadge) brandBadge.textContent = roleKey === 'admin' ? 'ADMIN' : 'TEACHER';

    const topbarRoleBadge = document.getElementById('topbarRoleBadge');
    if (topbarRoleBadge) {
      topbarRoleBadge.textContent = roleKey === 'admin' ? 'ADMIN · FULL ACCESS' : 'TEACHER · LIMITED';
    }

    const welcomeCopy = document.querySelector('.welcome-copy');
    if (welcomeCopy) {
      welcomeCopy.textContent =
        roleKey === 'admin'
          ? 'Full Admin Workspace — Manage all students, courses, attendance, assignments, lectures, results, and announcements.'
          : 'Teacher Workspace — Manage your students, today’s lectures, and school announcements.';
    }

    document.querySelector('.user-chip strong').textContent = user.name;
    const chipRole = document.querySelector('.user-chip small');
    if (chipRole) chipRole.textContent = user.roleShort || (roleKey === 'admin' ? 'System Admin' : 'Lead Educator');

    const profileNameStrong = document.querySelector('#profile .profile-details strong');
    if (profileNameStrong) profileNameStrong.textContent = user.name;

    const profileRoleBadge = document.getElementById('profileRoleBadge');
    if (profileRoleBadge) profileRoleBadge.textContent = user.roleBadge || 'ADMIN';

    const profileRoleTitle = document.getElementById('profileRoleTitle');
    if (profileRoleTitle) profileRoleTitle.textContent = user.roleTitle || 'System Administrator';

    document.querySelector('#profile .profile-contact span:first-child').innerHTML = `<i class="bi bi-envelope"></i> ${escapeHTML(user.email)}`;
    document.querySelector('#profile .profile-contact span:last-child').innerHTML = `<i class="bi bi-telephone"></i> ${escapeHTML(user.phone || '+1 (555) 204-8190')}`;

    const profileNameInput = document.getElementById('profileName');
    const profileEmailInput = document.getElementById('profileEmail');
    const profilePhoneInput = document.getElementById('profilePhone');
    if (profileNameInput) profileNameInput.value = user.name;
    if (profileEmailInput) profileEmailInput.value = user.email;
    if (profilePhoneInput) profilePhoneInput.value = user.phone || '+1 (555) 204-8190';

    updateWelcome();

    const activePage = document.body.dataset.page || 'overview';
    if (roleKey === 'teacher' && !teacherAllowedPages.has(activePage)) {
      showPage('overview');
    }
  };

  const unlockDashboard = (user, persist = true, animateDashboard = false) => {
    applyAuthenticatedUser(user);
    if (authOverlay) {
      authOverlay.classList.remove('is-launching');
      authOverlay.classList.add('auth-hidden');
    }
    document.body.classList.remove('auth-locked');
    if (persist) {
      const storage = authRememberInput?.checked !== false ? localStorage : sessionStorage;
      try {
        storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      } catch (_) {}
    }
    if (animateDashboard && !prefersReducedMotion) {
      const animatedEls = document.querySelectorAll('[data-animate]');
      animatedEls.forEach((el) => {
        el.style.transition = 'none';
        el.classList.remove('is-visible');
      });
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          animatedEls.forEach((el, idx) => {
            el.style.transition = '';
            el.style.transitionDelay = `${Math.min(idx * 65, 420)}ms`;
            el.classList.add('is-visible');
          });
        });
      });
      document.querySelectorAll('[data-counter]').forEach((el) => {
        const target = Number(el.textContent) || Number(el.dataset.counter);
        const pad = Number(el.dataset.pad || 0);
        if (!Number.isNaN(target)) animateCounter(el, target, pad);
      });
      const present = Number(document.getElementById('presentCount')?.textContent || 21);
      const absent = Number(document.getElementById('absentCount')?.textContent || 3);
      animateAttendanceRing(Math.round((present / Math.max(1, present + absent)) * 100));
    }
  };

  let isAuthenticating = false;

  const playLoginAnimationAndUnlock = (user, persist = true) => {
    if (prefersReducedMotion || !authOverlay) {
      unlockDashboard(user, persist, false);
      notify(`Welcome back, ${user.name} (${user.roleBadge})!`);
      return;
    }
    if (isAuthenticating) return;
    isAuthenticating = true;

    const roleKey = user.roleKey || (user.roleBadge === 'EDUCATOR' ? 'teacher' : 'admin');
    const isTeacher = roleKey === 'teacher';
    authOverlay.dataset.authMode = roleKey;
    authOverlay.classList.remove('auth-hidden');
    document.body.classList.add('auth-locked');

    const submitBtn = document.getElementById('authSubmitBtn');
    const submitLabel = document.getElementById('authSubmitLabel');
    const submitIcon = document.getElementById('authSubmitIcon');
    if (submitBtn) submitBtn.disabled = true;
    if (submitLabel) submitLabel.textContent = 'Verifying credentials...';
    if (submitIcon) submitIcon.className = 'bi bi-arrow-repeat spin-icon';

    const launchRoleIcon = document.getElementById('launchRoleIcon');
    const launchRoleBadge = document.getElementById('launchRoleBadge');
    const launchWelcomeTitle = document.getElementById('launchWelcomeTitle');
    const launchStatusText = document.getElementById('launchStatusText');
    const launchProgressBar = document.getElementById('launchProgressBar');
    const launchModulesRow = document.getElementById('launchModulesRow');

    if (launchRoleIcon) {
      launchRoleIcon.innerHTML = isTeacher
        ? '<i class="bi bi-person-workspace"></i>'
        : '<i class="bi bi-shield-fill-check"></i>';
    }
    if (launchRoleBadge) {
      launchRoleBadge.textContent = isTeacher
        ? 'TEACHER PORTAL · 3 CORE MODULES'
        : 'ADMIN PORTAL · FULL ACCESS (8 MODULES)';
    }
    if (launchWelcomeTitle) {
      launchWelcomeTitle.textContent = `Welcome, ${user.name}`;
    }
    if (launchStatusText) {
      launchStatusText.textContent = 'Authenticating end-to-end session...';
    }
    if (launchProgressBar) {
      launchProgressBar.style.width = '12%';
    }
    if (launchModulesRow) {
      const modules = isTeacher
        ? ['Students', 'Today’s Lectures', 'Announcements']
        : ['Overview', 'Students', 'Courses', 'Attendance', 'Assignments', 'Lectures', 'Results', 'Announcements'];
      launchModulesRow.innerHTML = modules
        .map(
          (m, idx) =>
            `<span style="animation-delay:${idx * 55}ms"><i class="bi bi-check2-circle"></i> ${escapeHTML(m)}</span>`
        )
        .join('');
    }

    setTimeout(() => {
      authOverlay.classList.add('is-launching');
      if (launchProgressBar) launchProgressBar.style.width = '58%';
      if (launchStatusText) {
        launchStatusText.textContent = isTeacher
          ? 'Preparing Teacher Workspace (Students, Lectures & Announcements)...'
          : 'Unlocking all 8 Administrator modules & analytics...';
      }
    }, 280);

    setTimeout(() => {
      if (launchProgressBar) launchProgressBar.style.width = '100%';
      if (launchStatusText) launchStatusText.textContent = 'Workspace ready — Launching dashboard...';
    }, 880);

    setTimeout(() => {
      if (submitBtn) submitBtn.disabled = false;
      if (submitIcon) submitIcon.className = 'bi bi-arrow-right';
      setAuthPortalMode(roleKey);
      isAuthenticating = false;
      unlockDashboard(user, persist, true);
      notify(
        isTeacher
          ? `Signed in as ${user.name} (Teacher View: Students, Lectures & Announcements)`
          : `Signed in as ${user.name} (Admin View: Full Workspace Access)`
      );
    }, 1350);
  };

  const lockDashboard = (message = 'You have been signed out.') => {
    currentSession = null;
    isAuthenticating = false;
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (_) {}
    if (authOverlay) {
      authOverlay.classList.remove('is-launching');
      authOverlay.classList.remove('auth-hidden');
    }
    document.body.classList.add('auth-locked');
    if (authError) authError.classList.add('d-none');
    closeSidebar();
    if (message) notify(message);
  };

  if (togglePasswordBtn && authPasswordInput) {
    togglePasswordBtn.addEventListener('click', () => {
      const isPwd = authPasswordInput.type === 'password';
      authPasswordInput.type = isPwd ? 'text' : 'password';
      togglePasswordBtn.innerHTML = `<i class="bi ${isPwd ? 'bi-eye-slash' : 'bi-eye'}"></i>`;
    });
  }

  if (fillAdminBtn) {
    fillAdminBtn.addEventListener('click', () => setAuthPortalMode('admin'));
  }

  if (fillTeacherBtn) {
    fillTeacherBtn.addEventListener('click', () => setAuthPortalMode('teacher'));
  }

  if (roleTabAdmin) {
    roleTabAdmin.addEventListener('click', () => setAuthPortalMode('admin'));
  }

  if (roleTabTeacher) {
    roleTabTeacher.addEventListener('click', () => setAuthPortalMode('teacher'));
  }

  if (authForm) {
    authForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const identifier = authEmailInput.value.trim().toLowerCase();
      const pwd = authPasswordInput.value;

      const matchedKey = Object.keys(accounts).find((key) => {
        const acc = accounts[key];
        return (
          (acc.email.toLowerCase() === identifier || acc.username.toLowerCase() === identifier) &&
          acc.password === pwd
        );
      });

      if (!matchedKey) {
        if (authError && authErrorText) {
          authErrorText.textContent = 'Invalid credentials. Use admin@learnly.edu / Admin@123';
          authError.classList.remove('d-none');
        }
        return;
      }

      if (authError) authError.classList.add('d-none');
      const user = { ...accounts[matchedKey], roleKey: matchedKey };
      playLoginAnimationAndUnlock(user, true);
    });
  }

  // Password Change Modal Handler
  const passwordForm = document.getElementById('passwordForm');
  if (passwordForm) {
    passwordForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const currentPwd = document.getElementById('currentPasswordInput').value;
      const newPwd = document.getElementById('newPasswordInput').value;
      const roleKey = currentSession?.roleKey || 'admin';
      const account = accounts[roleKey];

      if (!account || account.password !== currentPwd) {
        notify('Current password does not match.');
        return;
      }
      account.password = newPwd;
      saveAccounts(accounts);
      currentSession.password = newPwd;
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentSession));
      } catch (_) {}
      event.target.reset();
      bootstrap.Modal.getInstance(document.getElementById('passwordModal')).hide();
      notify('Password updated successfully.');
    });
  }

  // End-to-End Workspace State Save & Restore
  const saveWorkspaceState = () => {
    try {
      const state = {
        totalStudentCount,
        studentRowsHTML: studentRows.innerHTML,
        scheduleListHTML: document.getElementById('scheduleList')?.innerHTML || '',
        assignmentListHTML: document.getElementById('assignmentList')?.innerHTML || '',
        coursesGridHTML: document.getElementById('coursesGrid')?.innerHTML || '',
        resultsListHTML: document.getElementById('resultsList')?.innerHTML || '',
        announcementFeedHTML: document.getElementById('announcementFeed')?.innerHTML || '',
        attendanceMarked: document.getElementById('attendanceButton')?.dataset.marked === 'true'
      };
      localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(state));
    } catch (_) {}
  };

  const restoreWorkspaceState = () => {
    try {
      const raw = localStorage.getItem(WORKSPACE_STORAGE_KEY);
      if (!raw) return;
      const state = JSON.parse(raw);
      if (state.studentRowsHTML) studentRows.innerHTML = state.studentRowsHTML;
      if (typeof state.totalStudentCount === 'number') totalStudentCount = state.totalStudentCount;
      if (state.scheduleListHTML && document.getElementById('scheduleList')) {
        document.getElementById('scheduleList').innerHTML = state.scheduleListHTML;
      }
      if (state.assignmentListHTML && document.getElementById('assignmentList')) {
        document.getElementById('assignmentList').innerHTML = state.assignmentListHTML;
      }
      if (state.coursesGridHTML && document.getElementById('coursesGrid')) {
        document.getElementById('coursesGrid').innerHTML = state.coursesGridHTML;
      }
      if (state.resultsListHTML && document.getElementById('resultsList')) {
        document.getElementById('resultsList').innerHTML = state.resultsListHTML;
      }
      if (state.announcementFeedHTML && document.getElementById('announcementFeed')) {
        document.getElementById('announcementFeed').innerHTML = state.announcementFeedHTML;
      }
      if (state.attendanceMarked) {
        const btn = document.getElementById('attendanceButton');
        if (btn) {
          btn.dataset.marked = 'true';
          btn.innerHTML = 'Attendance saved <i class="bi bi-check2"></i>';
          btn.classList.add('btn-success');
        }
      }
    } catch (_) {}
  };

  const resetWorkspaceBtn = document.getElementById('resetWorkspaceButton');
  if (resetWorkspaceBtn) {
    resetWorkspaceBtn.addEventListener('click', () => {
      try {
        localStorage.removeItem(WORKSPACE_STORAGE_KEY);
        localStorage.removeItem(ACCOUNTS_STORAGE_KEY);
      } catch (_) {}
      location.reload();
    });
  }

  const profileLogoutBtn = document.getElementById('profileLogoutButton');
  if (profileLogoutBtn) {
    profileLogoutBtn.addEventListener('click', () => lockDashboard('Signed out of Learnly workspace.'));
  }

  const quickSwitchRoleBtn = document.getElementById('quickSwitchRoleBtn');
  if (quickSwitchRoleBtn) {
    quickSwitchRoleBtn.addEventListener('click', () => {
      const nextRole = document.body.dataset.role === 'admin' ? 'teacher' : 'admin';
      const nextUser = { ...accounts[nextRole], roleKey: nextRole };
      playLoginAnimationAndUnlock(nextUser, true);
    });
  }

  const toggleSidebar = () => {
    const isOpen = sidebar.classList.toggle('open');
    if (sidebarBackdrop) sidebarBackdrop.classList.toggle('show', isOpen);
  };

  const showPage = (pageId, updateHistory = true) => {
    let requestedPage = pageDetails[pageId] ? pageId : 'overview';
    if (document.body.dataset.role === 'teacher' && !teacherAllowedPages.has(requestedPage)) {
      notify('Teacher account shows Students, Lectures, and Announcements only.');
      requestedPage = 'overview';
    }
    const page = requestedPage;
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
    closeSidebar();
    if (updateHistory && location.hash !== `#${page}`) {
      history.pushState({ page }, '', `#${page}`);
    }
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  };

  /* ==========================================================================
     5. Counts, Roster Filtering & Student Actions
     ========================================================================== */
  let totalStudentCount = Number(studentTotal.textContent);
  let totalCourseCount = Number(document.getElementById('totalCourses').textContent);

  const scheduleList = document.getElementById('scheduleList');
  const totalClassesTodayEl = document.getElementById('totalClassesToday');

  const syncScheduleSummary = () => {
    if (!scheduleList) return;
    const items = [...scheduleList.querySelectorAll('.schedule-item')];
    const count = items.length;
    if (totalClassesTodayEl) {
      totalClassesTodayEl.textContent = String(count).padStart(2, '0');
    }
    const totalStat = document.getElementById('scheduleTotalStat');
    if (totalStat) totalStat.textContent = count;

    const subjects = new Set();
    const rooms = new Set();
    items.forEach((item) => {
      const subj = item.dataset.subject || item.querySelector('.class-details span')?.textContent.split('\n')[0]?.trim();
      const room = item.dataset.room || item.querySelector('.room-pill')?.textContent.trim();
      if (subj) subjects.add(subj);
      if (room) rooms.add(room);
    });

    const subjectsStat = document.getElementById('scheduleSubjectsStat');
    if (subjectsStat) subjectsStat.textContent = subjects.size;

    const subjectsListEl = document.getElementById('scheduleSubjectsList');
    if (subjectsListEl) {
      subjectsListEl.textContent = subjects.size ? [...subjects].slice(0, 3).join(', ') : 'No subjects today';
    }

    const spacesStat = document.getElementById('scheduleSpacesStat');
    if (spacesStat) spacesStat.textContent = rooms.size;

    const emptySchedule = document.getElementById('emptySchedule');
    if (emptySchedule) {
      emptySchedule.classList.toggle('d-none', count !== 0);
    }
  };

  const syncAssignmentSummary = () => {
    const assignments = [...document.querySelectorAll('#assignmentList .assignment-item')];
    document.getElementById('totalAssignments').textContent = String(assignments.length).padStart(2, '0');
    if (sidebarAssignmentCount) sidebarAssignmentCount.textContent = assignments.length;
    document.getElementById('assignmentTotalStat').textContent = assignments.length;
    document.getElementById('assignmentPendingStat').textContent = assignments.filter((item) =>
      item.querySelector('.status-pending')
    ).length;
    document.getElementById('assignmentProgressStat').textContent = assignments.filter((item) =>
      item.querySelector('.status-progress')
    ).length;
    const emptyAssignments = document.getElementById('emptyAssignments');
    if (emptyAssignments) {
      emptyAssignments.classList.toggle('d-none', assignments.length !== 0);
    }
  };

  const syncCoursesSummary = () => {
    const cards = [...document.querySelectorAll('#coursesGrid .course-card')];
    totalCourseCount = cards.length;
    document.getElementById('totalCourses').textContent = String(totalCourseCount).padStart(2, '0');
    const emptyCourses = document.getElementById('emptyCourses');
    if (emptyCourses) {
      emptyCourses.classList.toggle('d-none', totalCourseCount !== 0);
    }
  };

  const syncResultsSummary = () => {
    const rows = [...document.querySelectorAll('#resultsList .result-row')];
    const count = rows.length;
    const totalEl = document.getElementById('resultsTotalStat');
    const avgEl = document.getElementById('resultsAverageStat');
    const highEl = document.getElementById('resultsHighestStat');
    const emptyResults = document.getElementById('emptyResults');

    if (totalEl) totalEl.textContent = count;
    if (count > 0) {
      const scores = rows.map((r) => Number(r.dataset.score || 0));
      const avg = Math.round(scores.reduce((a, b) => a + b, 0) / count);
      const high = Math.max(...scores);
      if (avgEl) avgEl.textContent = `${avg}%`;
      if (highEl) highEl.textContent = `${high}%`;
    } else {
      if (avgEl) avgEl.textContent = '0%';
      if (highEl) highEl.textContent = '0%';
    }
    if (emptyResults) {
      emptyResults.classList.toggle('d-none', count !== 0);
    }
  };

  const renderAnnouncementManager = () => {
    const feed = document.getElementById('announcementFeed');
    const list = document.getElementById('announcementManagerList');
    list.replaceChildren();
    [...feed.querySelectorAll('.announcement-content')].forEach((announcement, index) => {
      if (!announcement.dataset.announcementId) {
        announcement.dataset.announcementId = `announcement-${index + 1}-${Date.now()}`;
      }
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
    if (sidebarStudentCount) sidebarStudentCount.textContent = totalStudentCount;
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

  const globalSearch = document.getElementById('globalSearch');
  globalSearch.addEventListener('input', (event) => {
    searchField.value = event.target.value;
    filterStudents(event.target.value);
    if (event.target.value) showPage('students');
  });

  // Keyboard shortcut: Cmd+K or Ctrl+K to focus global search
  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      globalSearch.focus();
      globalSearch.select();
    } else if (event.key === 'Escape' && document.activeElement === globalSearch) {
      globalSearch.blur();
    }
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
    row.innerHTML = `<td><div class="student-name"><img src="https://i.pravatar.cc/80?img=${photoId}" alt="" loading="lazy"><span><strong>${escapeHTML(name)}</strong><small>${escapeHTML(email)}</small></span></div></td><td>${escapeHTML(courseParts[0])}<small class="cell-sub">${escapeHTML(courseParts[1])}</small></td><td><div class="attendance-cell"><span class="attendance-value">100%</span><span class="attendance-mini-track" aria-hidden="true"><i style="width:100%"></i></span></div></td><td><span class="grade-pill grade-a">A</span></td><td><button class="row-menu" type="button" aria-label="Actions for ${escapeHTML(firstName)}"><i class="bi bi-three-dots"></i></button></td>`;
    studentRows.prepend(row);
    totalStudentCount++;
    event.target.reset();
    bootstrap.Modal.getInstance(document.getElementById('studentModal')).hide();
    filterStudents(searchField.value);
    syncStudentCount();
    notify(`${name} was added to your students.`);
  });

  // Modern Student Action Modal (Full Record Editor: Name, Email, Attendance %, Grade)
  let activeStudentRow = null;
  const studentActionModalEl = document.getElementById('studentActionModal');
  const editStudentNameInput = document.getElementById('editStudentNameInput');
  const editStudentEmailInput = document.getElementById('editStudentEmailInput');
  const editStudentAttendanceInput = document.getElementById('editStudentAttendanceInput');
  const editStudentGradeInput = document.getElementById('editStudentGradeInput');

  studentRows.addEventListener('click', (event) => {
    const button = event.target.closest('.row-menu');
    if (!button) return;
    const row = button.closest('tr');
    const name = row.querySelector('.student-name strong')?.textContent.trim() || '';
    const email = row.querySelector('.student-name small')?.textContent.trim() || '';
    const attPct = parseInt(row.querySelector('.attendance-value')?.textContent || '95', 10);
    const grade = row.querySelector('.grade-pill')?.textContent.trim() || 'A';

    if (studentActionModalEl && editStudentNameInput) {
      activeStudentRow = row;
      editStudentNameInput.value = name;
      if (editStudentEmailInput) editStudentEmailInput.value = email;
      if (editStudentAttendanceInput) editStudentAttendanceInput.value = attPct;
      if (editStudentGradeInput) editStudentGradeInput.value = grade;
      bootstrap.Modal.getOrCreateInstance(studentActionModalEl).show();
    }
  });

  if (studentActionModalEl) {
    document.getElementById('studentActionForm').addEventListener('submit', (event) => {
      event.preventDefault();
      if (!activeStudentRow) return;
      const newName = editStudentNameInput.value.trim();
      const newEmail = editStudentEmailInput ? editStudentEmailInput.value.trim() : '';
      const newAtt = editStudentAttendanceInput
        ? Math.min(100, Math.max(0, Number(editStudentAttendanceInput.value)))
        : 95;
      const newGrade = editStudentGradeInput ? editStudentGradeInput.value : 'A';
      if (!newName) return;

      activeStudentRow.querySelector('.student-name strong').textContent = newName;
      if (newEmail && activeStudentRow.querySelector('.student-name small')) {
        activeStudentRow.querySelector('.student-name small').textContent = newEmail;
      }
      const attValEl = activeStudentRow.querySelector('.attendance-value');
      const attBarEl = activeStudentRow.querySelector('.attendance-mini-track i');
      if (attValEl) attValEl.textContent = `${newAtt}%`;
      if (attBarEl) {
        attBarEl.className = newAtt < 80 ? 'warn' : '';
        attBarEl.style.width = `${newAtt}%`;
      }
      const gradePill = activeStudentRow.querySelector('.grade-pill');
      if (gradePill) {
        gradePill.textContent = newGrade;
        const gradeClass = newGrade.startsWith('A') ? 'grade-a' : newGrade.startsWith('B') ? 'grade-b' : 'grade-c';
        gradePill.className = `grade-pill ${gradeClass}`;
      }

      const courseText = activeStudentRow.children[1]?.textContent || '';
      activeStudentRow.dataset.search = `${newName} ${newEmail} ${courseText}`.toLowerCase();
      filterStudents(searchField.value);
      bootstrap.Modal.getInstance(studentActionModalEl).hide();
      notify(`Updated student record for ${newName}.`);
    });

    document.getElementById('deleteStudentBtn').addEventListener('click', () => {
      if (!activeStudentRow) return;
      const name = activeStudentRow.querySelector('.student-name strong').textContent.trim();
      activeStudentRow.remove();
      activeStudentRow = null;
      totalStudentCount = Math.max(0, totalStudentCount - 1);
      syncStudentCount();
      filterStudents(searchField.value);
      bootstrap.Modal.getInstance(studentActionModalEl).hide();
      notify(`${name} was removed from your roster.`);
    });
  }

  /* ==========================================================================
     6. Assignments, Courses, Profile, Attendance & Announcements
     ========================================================================== */
  document.getElementById('assignmentForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const title = document.getElementById('assignmentName').value.trim();
    const course = document.getElementById('assignmentCourse').value;
    const dueValue = document.getElementById('assignmentDue').value;
    if (!title || !dueValue) return;
    const courseParts = splitCourse(course);
    const date = new Date(`${dueValue}T12:00:00`).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const item = document.createElement('article');
    item.className = 'assignment-item';
    item.innerHTML = `<span class="assignment-icon purple-bg"><i class="bi bi-file-earmark-text"></i></span><div><strong>${escapeHTML(title)}</strong><span>${escapeHTML(courseParts[0])} <i></i> ${escapeHTML(courseParts[1])}</span><small><i class="bi bi-calendar3"></i> Due ${date}</small></div><div class="assignment-actions"><span class="status-pill status-pending" role="button" tabindex="0" title="Click to cycle status">Pending</span><button aria-label="Remove ${escapeHTML(title)}" class="assignment-remove" title="Remove assignment" type="button"><i class="bi bi-trash3"></i></button></div>`;
    document.getElementById('assignmentList').prepend(item);
    syncAssignmentSummary();
    event.target.reset();
    bootstrap.Modal.getInstance(document.getElementById('assignmentModal')).hide();
    notify('Assignment created successfully.');
  });

  // Interactive status cycling & removal on assignments
  document.getElementById('assignmentList').addEventListener('click', (event) => {
    const removeBtn = event.target.closest('.assignment-remove');
    if (removeBtn) {
      const item = removeBtn.closest('.assignment-item');
      const title = item?.querySelector('strong')?.textContent.trim() || 'Assignment';
      item?.remove();
      syncAssignmentSummary();
      notify(`${title} removed from assignments.`);
      return;
    }

    const pill = event.target.closest('.status-pill');
    if (!pill) return;
    if (pill.classList.contains('status-pending')) {
      pill.classList.remove('status-pending');
      pill.classList.add('status-progress');
      pill.textContent = 'In progress';
      notify('Assignment marked as in progress.');
    } else if (pill.classList.contains('status-progress')) {
      pill.classList.remove('status-progress');
      pill.classList.add('status-completed');
      pill.textContent = 'Completed';
      notify('Assignment marked as completed.');
    } else {
      pill.classList.remove('status-completed');
      pill.classList.add('status-pending');
      pill.textContent = 'Pending';
      notify('Assignment marked as pending.');
    }
    syncAssignmentSummary();
  });

  document.getElementById('assignmentModal').addEventListener('show.bs.modal', () => {
    const dueDate = document.getElementById('assignmentDue');
    const now = new Date();
    const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    dueDate.min = today;
    if (!dueDate.value || dueDate.value < today) dueDate.value = today;
  });

  document
    .getElementById('addCourseButton')
    .addEventListener('click', () => bootstrap.Modal.getOrCreateInstance(document.getElementById('courseModal')).show());

  document.getElementById('courseForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.getElementById('courseName').value.trim();
    const grade = document.getElementById('courseGrade').value;
    if (!name) return;
    const card = document.createElement('article');
    card.className = 'course-card course-purple interactive-card';
    card.dataset.course = name;
    card.innerHTML = `<div class="course-card-top"><span class="course-symbol"><i class="bi bi-journal-bookmark"></i></span><div class="course-card-meta"><span class="course-term">FALL ${new Date().getFullYear()}</span><button aria-label="Remove ${escapeHTML(name)}" class="course-remove" title="Remove course" type="button"><i class="bi bi-trash3"></i></button></div></div><h3>${escapeHTML(name)}</h3><p>${escapeHTML(grade)} · 1 class</p><div class="course-progress"><span><i style="width:8%"></i></span><small>Just created</small></div>`;
    document.getElementById('coursesGrid').prepend(card);
    attachInteractiveCardEffects(card.parentElement);
    const courseOption = document.createElement('option');
    courseOption.value = `${name} - ${grade}`;
    courseOption.textContent = courseOption.value;
    document
      .querySelectorAll('#studentCourse, #assignmentCourse, #scheduleCourse')
      .forEach((select) => select.add(courseOption.cloneNode(true)));
    syncCoursesSummary();
    event.target.reset();
    bootstrap.Modal.getInstance(document.getElementById('courseModal')).hide();
    notify(`${name} was added to your courses.`);
  });

  // Course Card Interactions (Remove course or filter students by course)
  document.getElementById('coursesGrid').addEventListener('click', (event) => {
    const removeBtn = event.target.closest('.course-remove');
    if (removeBtn) {
      event.stopPropagation();
      const card = removeBtn.closest('.course-card');
      const title = card?.querySelector('h3')?.textContent.trim() || 'Course';
      card?.remove();
      syncCoursesSummary();
      notify(`${title} removed from your courses.`);
      return;
    }
    const card = event.target.closest('.course-card');
    if (!card) return;
    const courseName = card.querySelector('h3')?.textContent.trim() || '';
    if (courseName) {
      searchField.value = courseName;
      filterStudents(courseName);
      showPage('students');
      notify(`Filtering students enrolled in ${courseName}.`);
    }
  });

  // Results Module Add & Remove
  const resultForm = document.getElementById('resultForm');
  const resultsList = document.getElementById('resultsList');
  if (resultForm && resultsList) {
    resultForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const studentName = document.getElementById('resultStudentName').value.trim();
      const assessmentName = document.getElementById('resultAssessmentName').value.trim();
      const scoreVal = Math.min(100, Math.max(0, Number(document.getElementById('resultScoreInput').value)));
      if (!studentName || !assessmentName || Number.isNaN(scoreVal)) return;

      const tier = scoreVal >= 95 ? 'Top score' : scoreVal >= 90 ? 'Excellent' : scoreVal >= 80 ? 'Proficient' : 'Reviewed';
      const photoId = Math.floor(Math.random() * 70) + 1;
      const row = document.createElement('div');
      row.className = 'result-row';
      row.dataset.score = scoreVal;
      row.innerHTML = `
        <div class="result-student">
          <img alt="" loading="lazy" src="https://i.pravatar.cc/80?img=${photoId}">
          <span>
            <strong>${escapeHTML(studentName)}</strong>
            <small>${escapeHTML(assessmentName)}</small>
          </span>
        </div>
        <div class="result-right">
          <div class="result-score">
            <strong>${scoreVal}<span>/100</span></strong>
            <small>${scoreVal}% · ${tier}</small>
            <span class="score-track"><i style="width:${scoreVal}%"></i></span>
          </div>
          <button aria-label="Remove ${escapeHTML(studentName)} result" class="result-remove" title="Remove result" type="button">
            <i class="bi bi-trash3"></i>
          </button>
        </div>
      `;
      resultsList.prepend(row);
      syncResultsSummary();
      event.target.reset();
      bootstrap.Modal.getInstance(document.getElementById('resultModal')).hide();
      notify(`Result recorded for ${studentName}.`);
    });

    resultsList.addEventListener('click', (event) => {
      const removeBtn = event.target.closest('.result-remove');
      if (!removeBtn) return;
      const row = removeBtn.closest('.result-row');
      const name = row?.querySelector('.result-student strong')?.textContent.trim() || 'Student';
      row?.remove();
      syncResultsSummary();
      notify(`Removed assessment result for ${name}.`);
    });
  }

  // Add & Remove Class in Today's Schedule
  const getSubjectStyle = (subject) => {
    const lower = subject.toLowerCase();
    if (lower.includes('bio') || lower.includes('sci') || lower.includes('hist')) {
      return { color: 'orange', icon: lower.includes('hist') ? 'bi-globe-americas' : 'bi-flower1' };
    }
    if (lower.includes('eng') || lower.includes('writ') || lower.includes('comp')) {
      return { color: 'blue', icon: lower.includes('comp') ? 'bi-laptop' : 'bi-book-half' };
    }
    if (lower.includes('geom')) {
      return { color: 'green', icon: 'bi-calculator' };
    }
    return { color: 'purple', icon: 'bi-braces-asterisk' };
  };

  const formatTime12h = (time24) => {
    const [hStr, mStr] = time24.split(':');
    let hours = Number(hStr);
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return {
      time: `${String(hours).padStart(2, '0')}:${mStr}`,
      period
    };
  };

  const scheduleForm = document.getElementById('scheduleForm');
  if (scheduleForm && scheduleList) {
    scheduleForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const title = document.getElementById('scheduleTitle').value.trim();
      const course = document.getElementById('scheduleCourse').value;
      const timeVal = document.getElementById('scheduleTime').value;
      const room = document.getElementById('scheduleRoom').value.trim();
      if (!title || !timeVal || !room) return;

      const [subject, grade] = splitCourse(course);
      const { time, period } = formatTime12h(timeVal);
      const theme = getSubjectStyle(`${subject} ${title}`);
      const roomIcon = room.toLowerCase().includes('lab') ? 'bi-eyedropper' : 'bi-door-open';

      const item = document.createElement('article');
      item.className = 'schedule-item';
      item.dataset.time = timeVal;
      item.dataset.subject = subject;
      item.dataset.room = room;
      item.innerHTML = `
        <time>${escapeHTML(time)}<small>${escapeHTML(period)}</small></time>
        <span class="schedule-line ${theme.color}-line"></span>
        <div class="class-icon ${theme.color}-bg"><i class="bi ${theme.icon}"></i></div>
        <div class="class-details">
          <strong>${escapeHTML(title)}</strong>
          <span>${escapeHTML(subject)} <i></i> ${escapeHTML(grade || 'All grades')}</span>
        </div>
        <span class="room-pill"><i class="bi ${roomIcon}"></i> ${escapeHTML(room)}</span>
        <button aria-label="Remove ${escapeHTML(title)}" class="schedule-remove" title="Remove class" type="button">
          <i class="bi bi-trash3"></i>
        </button>
      `;

      // Insert in chronological order
      const existingItems = [...scheduleList.querySelectorAll('.schedule-item')];
      const nextItem = existingItems.find((el) => (el.dataset.time || '99:99') > timeVal);
      if (nextItem) {
        scheduleList.insertBefore(item, nextItem);
      } else {
        scheduleList.append(item);
      }

      syncScheduleSummary();
      event.target.reset();
      document.getElementById('scheduleTime').value = '11:30';
      bootstrap.Modal.getInstance(document.getElementById('scheduleModal')).hide();
      notify(`${title} added to today’s schedule.`);
    });

    scheduleList.addEventListener('click', (event) => {
      const removeBtn = event.target.closest('.schedule-remove');
      if (!removeBtn) return;
      const item = removeBtn.closest('.schedule-item');
      if (!item) return;
      const title = item.querySelector('.class-details strong')?.textContent.trim() || 'Class';
      item.remove();
      syncScheduleSummary();
      notify(`${title} removed from today’s schedule.`);
    });
  }

  document
    .getElementById('editProfileButton')
    .addEventListener('click', () => bootstrap.Modal.getOrCreateInstance(document.getElementById('profileModal')).show());

  document.getElementById('profileForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.getElementById('profileName').value.trim();
    const email = document.getElementById('profileEmail').value.trim();
    const phone = document.getElementById('profilePhone').value.trim();
    document.querySelector('#profile .profile-details strong').textContent = name;
    document.querySelector('#profile .profile-contact span:first-child').innerHTML = `<i class="bi bi-envelope"></i> ${escapeHTML(email)}`;
    document.querySelector('#profile .profile-contact span:last-child').innerHTML = `<i class="bi bi-telephone"></i> ${escapeHTML(phone)}`;
    document.querySelector('.user-chip strong').textContent = name;
    if (currentSession) {
      currentSession.name = name;
      currentSession.email = email;
      currentSession.phone = phone;
      const roleKey = currentSession.roleKey || 'admin';
      if (accounts[roleKey]) {
        accounts[roleKey].name = name;
        accounts[roleKey].email = email;
        accounts[roleKey].phone = phone;
        saveAccounts(accounts);
      }
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentSession));
      } catch (_) {}
    }
    updateWelcome();
    document.getElementById('profileModalTitle').textContent = 'Edit profile';
    bootstrap.Modal.getInstance(document.getElementById('profileModal')).hide();
    notify('Your profile has been updated.');
  });

  // Interactive Attendance Register & Steppers
  const updateAttendanceDisplay = (newPresent, totalEnrolled = 24) => {
    const clampedPresent = Math.min(totalEnrolled, Math.max(0, newPresent));
    const newAbsent = totalEnrolled - clampedPresent;
    const pct = Math.round((clampedPresent / Math.max(1, totalEnrolled)) * 100);
    const exactPct = ((clampedPresent / Math.max(1, totalEnrolled)) * 100).toFixed(1);

    const presentEl = document.getElementById('presentCount');
    const absentEl = document.getElementById('absentCount');
    const enrolledStat = document.getElementById('attendanceEnrolledStat');
    const presentStat = document.getElementById('attendancePresentStat');
    const presentPctNote = document.getElementById('attendancePresentPctNote');
    const absentStat = document.getElementById('attendanceAbsentStat');

    if (presentEl) presentEl.textContent = clampedPresent;
    if (absentEl) absentEl.textContent = newAbsent;
    if (enrolledStat) enrolledStat.textContent = totalEnrolled;
    if (presentStat) presentStat.textContent = clampedPresent;
    if (presentPctNote) presentPctNote.textContent = `${exactPct}% of class`;
    if (absentStat) absentStat.textContent = newAbsent;

    animateAttendanceRing(pct);
    saveWorkspaceState();
  };

  document.getElementById('presentDecBtn')?.addEventListener('click', () => {
    const current = Number(document.getElementById('presentCount')?.textContent || 21);
    updateAttendanceDisplay(current - 1, 24);
  });

  document.getElementById('presentIncBtn')?.addEventListener('click', () => {
    const current = Number(document.getElementById('presentCount')?.textContent || 21);
    updateAttendanceDisplay(current + 1, 24);
  });

  document.getElementById('markAllPresentBtn')?.addEventListener('click', () => {
    updateAttendanceDisplay(24, 24);
    notify('All 24 students marked present (100%).');
  });

  document.getElementById('attendanceButton').addEventListener('click', () => {
    const button = document.getElementById('attendanceButton');
    const present = document.getElementById('presentCount');
    const absent = document.getElementById('absentCount');
    button.dataset.marked = 'true';
    button.innerHTML = 'Attendance saved <i class="bi bi-check2"></i>';
    button.classList.add('btn-success');
    const count = Number(present.textContent) + Number(absent.textContent);
    const pct = Math.round((Number(present.textContent) / count) * 100);
    animateAttendanceRing(pct);
    notify(`Attendance saved for Grade 9A (${pct}% present).`);
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
    announcement.innerHTML =
      '<span class="announcement-icon"><i class="bi bi-megaphone-fill"></i></span><div><span class="announcement-tag"></span><h3></h3><p></p></div>';
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
    const announcement = [...document.querySelectorAll('#announcementFeed .announcement-content')].find(
      (item) => item.dataset.announcementId === button.dataset.announcementId
    );
    if (!announcement) return;
    const title = announcement.querySelector('h3')?.textContent || 'this announcement';
    if (!window.confirm(`Delete “${title}”?`)) return;
    announcement.remove();
    renderAnnouncementManager();
    notify('Announcement deleted.');
  });

  /* ==========================================================================
     7. Navigation & Sticky Topbar Events
     ========================================================================== */
  document.getElementById('menuToggle').addEventListener('click', toggleSidebar);
  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener('click', closeSidebar);
  }

  window.addEventListener(
    'scroll',
    () => {
      if (topbar) {
        topbar.classList.toggle('scrolled', window.scrollY > 10);
      }
    },
    { passive: true }
  );

  document.querySelectorAll('.side-nav .nav-link, .brand, .user-chip').forEach((link) =>
    link.addEventListener('click', (event) => {
      const page = link.getAttribute('href')?.slice(1);
      if (page === 'logout') {
        event.preventDefault();
        lockDashboard('Signed out of Learnly workspace.');
        return;
      }
      if (!pageDetails[page]) return;
      event.preventDefault();
      showPage(page);
    })
  );

  window.addEventListener('popstate', () => showPage(location.hash.slice(1) || 'overview', false));

  document.querySelectorAll('[data-jump]').forEach((button) => {
    const handleJump = () => {
      const targetId = button.dataset.jump;
      if (targetId === 'students' && searchField.value) {
        searchField.value = '';
        globalSearch.value = '';
        filterStudents('');
      }
      if (pageDetails[targetId] && document.body.dataset.page !== targetId) {
        showPage(targetId);
        return;
      }
      const target = document.getElementById(targetId);
      if (target) target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
      else notify('You’re viewing all available records.');
    };
    button.addEventListener('click', handleJump);
    if (button.classList.contains('stat-card')) {
      button.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleJump();
        }
      });
    }
  });

  // Notification Popover Toggle & Mark All Read
  const notificationBtn = document.getElementById('notificationBtn');
  const notificationPopover = document.getElementById('notificationPopover');
  const notificationDot = document.getElementById('notificationDot');
  const clearNotificationsBtn = document.getElementById('clearNotificationsBtn');

  if (notificationBtn && notificationPopover) {
    notificationBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      const isHidden = notificationPopover.classList.toggle('d-none');
      notificationBtn.setAttribute('aria-expanded', String(!isHidden));
    });

    document.addEventListener('click', (event) => {
      if (!notificationPopover.classList.contains('d-none') && !event.target.closest('.notification-wrap')) {
        notificationPopover.classList.add('d-none');
        notificationBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  if (clearNotificationsBtn) {
    clearNotificationsBtn.addEventListener('click', () => {
      document.querySelectorAll('.notification-item.unread').forEach((item) => item.classList.remove('unread'));
      if (notificationDot) notificationDot.classList.add('d-none');
      if (notificationPopover) notificationPopover.classList.add('d-none');
      notify('All notifications marked as read.');
    });
  }

  document.getElementById('announcementFeed').addEventListener('click', (event) => {
    const moreBtn = event.target.closest('.announcement-more');
    if (!moreBtn) return;
    renderAnnouncementManager();
    showPage('announcementManager');
  });

  /* ==========================================================================
     7B. Relational SQL Database Engine, CSV/SQL Export & Dark Theme Toggle
     ========================================================================== */
  const THEME_STORAGE_KEY = 'learnly_theme_mode_v1';
  const themeToggleBtn = document.getElementById('themeToggleBtn');

  const applyTheme = (theme) => {
    const isDark = theme === 'dark';
    document.body.dataset.theme = isDark ? 'dark' : 'light';
    if (themeToggleBtn) {
      themeToggleBtn.innerHTML = `<i class="bi ${isDark ? 'bi-sun-fill' : 'bi-moon-stars'}"></i>`;
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
    } catch (_) {}
  };

  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'dark') applyTheme('dark');
  } catch (_) {}

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const nextTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
      notify(`Switched to ${nextTheme === 'dark' ? 'Obsidian Dark' : 'Studio Light'} theme.`);
    });
  }

  // Build Live Relational SQL Tables from Current Workspace State
  const buildRelationalTables = () => {
    const studentsTable = [...studentRows.querySelectorAll('tr')].map((row, index) => {
      const fullName = row.querySelector('.student-name strong')?.textContent.trim() || '';
      const email = row.querySelector('.student-name small')?.textContent.trim() || '';
      const courseCell = row.children[1];
      const gradeLevel = courseCell?.querySelector('.cell-sub')?.textContent.trim() || '';
      const courseName = (courseCell?.childNodes[0]?.textContent || '').trim();
      const attendancePct = parseInt(row.querySelector('.attendance-value')?.textContent || '100', 10);
      const letterGrade = row.querySelector('.grade-pill')?.textContent.trim() || 'A';
      return {
        id: index + 1,
        full_name: fullName,
        email,
        course_name: courseName,
        grade_level: gradeLevel,
        attendance_pct: attendancePct,
        letter_grade: letterGrade
      };
    });

    const coursesTable = [...document.querySelectorAll('#coursesGrid .course-card')].map((card, index) => {
      const courseName = card.querySelector('h3')?.textContent.trim() || '';
      const subtitle = card.querySelector('p')?.textContent.trim() || '';
      const gradeLevel = subtitle.split('·')[0]?.trim() || 'Grade 9';
      const term = card.querySelector('.course-term')?.textContent.trim() || 'FALL 2026';
      const progressText = card.querySelector('.course-progress small')?.textContent.trim() || '0%';
      const progressPct = parseInt(progressText, 10) || 0;
      return {
        id: index + 1,
        course_name: courseName,
        grade_level: gradeLevel,
        term,
        progress_pct: progressPct
      };
    });

    const scheduleTable = [...document.querySelectorAll('#scheduleList .schedule-item')].map((item, index) => {
      const title = item.querySelector('.class-details strong')?.textContent.trim() || '';
      const subject = item.dataset.subject || 'General';
      const timeText = item.querySelector('time')?.childNodes[0]?.textContent.trim() || '';
      const period = item.querySelector('time small')?.textContent.trim() || '';
      const room = item.dataset.room || item.querySelector('.room-pill')?.textContent.trim() || '';
      return {
        id: index + 1,
        title,
        subject,
        start_time: `${timeText} ${period}`.trim(),
        room
      };
    });

    const assignmentsTable = [...document.querySelectorAll('#assignmentList .assignment-item')].map((item, index) => {
      const title = item.querySelector('strong')?.textContent.trim() || '';
      const meta = item.querySelector('div > span')?.textContent.replace(/\s+/g, ' ').trim() || '';
      const due = item.querySelector('small')?.textContent.replace('Due', '').trim() || '';
      const status = item.querySelector('.status-pill')?.textContent.trim() || 'Pending';
      return {
        id: index + 1,
        title,
        course_info: meta,
        due_date: due,
        status
      };
    });

    const resultsTable = [...document.querySelectorAll('#resultsList .result-row')].map((row, index) => {
      const studentName = row.querySelector('.result-student strong')?.textContent.trim() || '';
      const assessmentTitle = row.querySelector('.result-student small')?.textContent.trim() || '';
      const score = Number(row.dataset.score || 0);
      return {
        id: index + 1,
        student_name: studentName,
        assessment_title: assessmentTitle,
        score
      };
    });

    const announcementsTable = [...document.querySelectorAll('#announcementFeed .announcement-content')].map(
      (item, index) => {
        const tag = item.querySelector('.announcement-tag')?.textContent.replace(/\s+/g, ' ').trim() || 'SCHOOL-WIDE';
        const title = item.querySelector('h3')?.textContent.trim() || '';
        const message = item.querySelector('p')?.textContent.trim() || '';
        return {
          id: index + 1,
          audience_tag: tag,
          title,
          message
        };
      }
    );

    const usersTable = Object.keys(accounts).map((key, index) => ({
      id: index + 1,
      username: accounts[key].username,
      email: accounts[key].email,
      full_name: accounts[key].name,
      role: key,
      role_title: accounts[key].roleTitle
    }));

    return {
      students: studentsTable,
      courses: coursesTable,
      schedule: scheduleTable,
      assignments: assignmentsTable,
      results: resultsTable,
      announcements: announcementsTable,
      users: usersTable
    };
  };

  const updateSqlStats = () => {
    const db = buildRelationalTables();
    const totalRows = Object.values(db).reduce((sum, table) => sum + table.length, 0);
    const dbTotalEl = document.getElementById('dbTotalRowsStat');
    const sidebarDbEl = document.getElementById('sidebarDbRecordsCount');
    if (dbTotalEl) dbTotalEl.textContent = `${totalRows} Rows`;
    if (sidebarDbEl) sidebarDbEl.textContent = totalRows;

    // Optional sync to Node server (/api/db) if running on Node host
    if (location.protocol.startsWith('http')) {
      fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(db)
      })
        .then((r) => {
          if (r.ok) {
            const modeEl = document.getElementById('sqlConnectionMode');
            if (modeEl) modeEl.textContent = 'Connected to Node SQL API (/api/db)';
          }
        })
        .catch(() => {});
    }
  };

  const executeSqlQuery = (rawSql) => {
    const startTime = performance.now();
    const db = buildRelationalTables();
    const sql = rawSql.trim().replace(/;+$/, '');
    const selectMatch = sql.match(
      /^SELECT\s+(.+?)\s+FROM\s+([a-zA-Z_]+)(?:\s+WHERE\s+(.+?))?(?:\s+ORDER\s+BY\s+([a-zA-Z_]+)(?:\s+(ASC|DESC))?)?(?:\s+LIMIT\s+(\d+))?$/i
    );

    const headEl = document.getElementById('sqlResultHead');
    const bodyEl = document.getElementById('sqlResultBody');
    const metaEl = document.getElementById('sqlResultMeta');
    if (!headEl || !bodyEl || !metaEl) return;

    if (!selectMatch) {
      metaEl.innerHTML =
        '<i class="bi bi-exclamation-circle-fill"></i> Supported syntax: SELECT [columns] FROM [table] [WHERE col >= val] [ORDER BY col ASC|DESC]';
      return;
    }

    const [, colClause, tableNameRaw, whereClause, orderCol, orderDir, limitVal] = selectMatch;
    const tableName = tableNameRaw.toLowerCase();
    const sourceTable = db[tableName];

    if (!sourceTable) {
      metaEl.innerHTML = `<i class="bi bi-x-circle-fill"></i> Unknown table "${escapeHTML(tableName)}". Available: ${Object.keys(db).join(', ')}`;
      headEl.innerHTML = '';
      bodyEl.innerHTML = '';
      return;
    }

    let rows = [...sourceTable];

    if (whereClause) {
      const condMatch = whereClause.match(/^([a-zA-Z_]+)\s*(>=|<=|=|>|<|LIKE)\s*(.+)$/i);
      if (condMatch) {
        const [, cName, op, rawVal] = condMatch;
        const cleanVal = rawVal.trim().replace(/^['"]|['"]$/g, '');
        rows = rows.filter((r) => {
          const cell = r[cName];
          if (cell === undefined) return false;
          const numCell = Number(cell);
          const numVal = Number(cleanVal);
          if (op === '>=') return numCell >= numVal;
          if (op === '<=') return numCell <= numVal;
          if (op === '>') return numCell > numVal;
          if (op === '<') return numCell < numVal;
          if (op.toUpperCase() === 'LIKE') {
            const regex = new RegExp('^' + cleanVal.replace(/%/g, '.*') + '$', 'i');
            return regex.test(String(cell));
          }
          return String(cell).toLowerCase() === cleanVal.toLowerCase();
        });
      }
    }

    if (orderCol) {
      const dir = (orderDir || 'ASC').toUpperCase() === 'DESC' ? -1 : 1;
      rows.sort((a, b) => {
        const va = a[orderCol];
        const vb = b[orderCol];
        if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
        return String(va || '').localeCompare(String(vb || '')) * dir;
      });
    }

    if (limitVal) {
      rows = rows.slice(0, Number(limitVal));
    }

    const allCols = sourceTable[0] ? Object.keys(sourceTable[0]) : ['id'];

    // Support Aggregate SELECT COUNT(*)
    if (/^COUNT\(\*\)$/i.test(colClause.trim())) {
      headEl.innerHTML = '<tr><th>COUNT(*)</th><th>TABLE_NAME</th></tr>';
      bodyEl.innerHTML = `<tr><td>${rows.length}</td><td>${escapeHTML(tableName)}</td></tr>`;
      const elapsed = (performance.now() - startTime).toFixed(2);
      metaEl.innerHTML = `<i class="bi bi-check-circle-fill"></i> Aggregate query on <b>${escapeHTML(tableName)}</b> executed in ${elapsed}ms · COUNT = ${rows.length}`;
      return;
    }

    const selectedCols =
      colClause.trim() === '*'
        ? allCols
        : colClause
            .split(',')
            .map((c) => c.trim())
            .filter((c) => allCols.includes(c));
    const finalCols = selectedCols.length ? selectedCols : allCols;

    headEl.innerHTML = `<tr>${finalCols.map((c) => `<th>${escapeHTML(c.toUpperCase())}</th>`).join('')}</tr>`;
    bodyEl.innerHTML = rows.length
      ? rows
          .map(
            (r) =>
              `<tr>${finalCols.map((c) => `<td>${escapeHTML(String(r[c] ?? ''))}</td>`).join('')}</tr>`
          )
          .join('')
      : `<tr><td colspan="${finalCols.length}">0 rows returned.</td></tr>`;

    const elapsed = (performance.now() - startTime).toFixed(2);
    metaEl.innerHTML = `<i class="bi bi-check-circle-fill"></i> Query on <b>${escapeHTML(tableName)}</b> executed in ${elapsed}ms · ${rows.length} ${rows.length === 1 ? 'row' : 'rows'} returned`;
  };

  const sqlQueryInput = document.getElementById('sqlQueryInput');
  const runSqlQueryBtn = document.getElementById('runSqlQueryBtn');
  const copySqlQueryBtn = document.getElementById('copySqlQueryBtn');
  if (runSqlQueryBtn && sqlQueryInput) {
    runSqlQueryBtn.addEventListener('click', () => {
      executeSqlQuery(sqlQueryInput.value);
      notify('SQL query executed.');
    });
  }
  if (copySqlQueryBtn && sqlQueryInput) {
    copySqlQueryBtn.addEventListener('click', () => {
      navigator.clipboard?.writeText(sqlQueryInput.value);
      notify('SQL query copied to clipboard.');
    });
  }

  document.querySelectorAll('.sql-preset-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.sql-preset-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      if (sqlQueryInput) {
        sqlQueryInput.value = chip.dataset.sql;
        executeSqlQuery(chip.dataset.sql);
      }
    });
  });

  // Download file helper
  const downloadFile = (filename, content, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Export .SQL Dump
  const exportSqlDumpBtn = document.getElementById('exportSqlDumpBtn');
  if (exportSqlDumpBtn) {
    exportSqlDumpBtn.addEventListener('click', () => {
      const db = buildRelationalTables();
      const lines = [
        '-- Learnly Pro Relational SQL Database Dump',
        `-- Generated at ${new Date().toISOString()}`,
        ''
      ];
      Object.entries(db).forEach(([table, rows]) => {
        lines.push(`-- Table: ${table} (${rows.length} rows)`);
        rows.forEach((row) => {
          const cols = Object.keys(row).join(', ');
          const vals = Object.values(row)
            .map((v) => (typeof v === 'number' ? v : `'${String(v).replace(/'/g, "''")}'`))
            .join(', ');
          lines.push(`INSERT INTO ${table} (${cols}) VALUES (${vals});`);
        });
        lines.push('');
      });
      downloadFile('learnly_database_dump.sql', lines.join('\n'), 'application/sql;charset=utf-8');
      notify('Exported learnly_database_dump.sql');
    });
  }

  // View schema.sql in SQL Editor
  const viewSchemaSqlBtn = document.getElementById('viewSchemaSqlBtn');
  if (viewSchemaSqlBtn && sqlQueryInput) {
    viewSchemaSqlBtn.addEventListener('click', () => {
      sqlQueryInput.value =
        'SELECT id, full_name, email, course_name, grade_level, attendance_pct, letter_grade FROM students ORDER BY attendance_pct DESC;';
      executeSqlQuery(sqlQueryInput.value);
      notify('Loaded relational schema query into SQL Studio.');
    });
  }

  // Export Students Roster CSV
  const exportStudentsCsvBtn = document.getElementById('exportStudentsCsvBtn');
  if (exportStudentsCsvBtn) {
    exportStudentsCsvBtn.addEventListener('click', () => {
      const { students } = buildRelationalTables();
      const header = 'ID,Full Name,Email,Course,Grade Level,Attendance %,Letter Grade';
      const csvRows = students.map(
        (s) =>
          `${s.id},"${s.full_name.replace(/"/g, '""')}","${s.email}","${s.course_name}","${s.grade_level}",${s.attendance_pct},"${s.letter_grade}"`
      );
      downloadFile('learnly_students_roster.csv', [header, ...csvRows].join('\n'), 'text/csv;charset=utf-8');
      notify('Exported learnly_students_roster.csv');
    });
  }

  /* ==========================================================================
     8. Initialize Application State & Launch Animations
     ========================================================================== */
  restoreWorkspaceState();

  // Check saved auth session or show Login Overlay
  try {
    const savedSession =
      JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY)) ||
      JSON.parse(sessionStorage.getItem(AUTH_STORAGE_KEY));
    if (savedSession && savedSession.email) {
      unlockDashboard(savedSession, false);
    } else {
      document.body.classList.add('auth-locked');
    }
  } catch (_) {
    document.body.classList.add('auth-locked');
  }

  // Persist workspace automatically whenever any module mutates
  const mutationTargets = [
    studentRows,
    document.getElementById('scheduleList'),
    document.getElementById('assignmentList'),
    document.getElementById('coursesGrid'),
    document.getElementById('resultsList'),
    document.getElementById('announcementFeed'),
    document.getElementById('attendanceButton')
  ].filter(Boolean);

  const persistenceObserver = new MutationObserver(() => {
    saveWorkspaceState();
    updateSqlStats();
  });
  mutationTargets.forEach((target) =>
    persistenceObserver.observe(target, { childList: true, subtree: true, attributes: true })
  );

  syncStudentCount();
  syncAssignmentSummary();
  syncScheduleSummary();
  syncCoursesSummary();
  syncResultsSummary();
  renderAnnouncementManager();
  updateSqlStats();
  executeSqlQuery('SELECT * FROM students ORDER BY id ASC;');
  updateWelcome();
  showPage(location.hash.slice(1) || 'overview', false);

  triggerEntranceAnimations();
  attachInteractiveCardEffects();

  // Animate KPI counters & attendance ring on initial load
  document.querySelectorAll('[data-counter]').forEach((el) => {
    const target = Number(el.textContent) || Number(el.dataset.counter);
    const pad = Number(el.dataset.pad || 0);
    if (!Number.isNaN(target)) {
      animateCounter(el, target, pad);
    }
  });
  animateAttendanceRing(88);
});
