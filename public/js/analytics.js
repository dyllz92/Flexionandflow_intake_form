/**
 * Analytics Dashboard - Client-side logic
 */

class AnalyticsDashboard {
    constructor() {
        this.sessionId = localStorage.getItem('analyticsSession');
        this.userRole = localStorage.getItem('analyticsUserRole') || 'manager';
        this.userFirstName = localStorage.getItem('analyticsUserFirstName') || 'User';
        this.charts = {};
        this.init();
    }

    async init() {
        this.setupEventListeners();

        if (this.sessionId) {
            // Display user's first name if logged in
            const userFirstNameElement = document.getElementById('userFirstName');
            if (userFirstNameElement) {
                userFirstNameElement.textContent = this.userFirstName;
            }

            this.showDashboard();
            // Load admin panel if user is admin
            if (this.userRole === 'admin') {
                this.showAdminPanel();
            } else {
                this.hideAdminPanel();
            }
            await this.loadDashboard();
        } else {
            // Determine which form to show based on URL path or hash
            const currentPath = window.location.pathname;
            const currentHash = window.location.hash;

            this.showLogin();

            // Check if user came from /register path or has #register hash
            if (currentPath === '/register' || currentHash === '#register') {
                this.showRegistrationForm();
            } else {
                this.showLoginForm();
            }
        }
    }

    setupEventListeners() {
        // Login form
        document.getElementById('loginForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Clear login error message when user starts editing fields
        document.getElementById('loginEmail')?.addEventListener('input', () => {
            const errorDiv = document.getElementById('loginError');
            if (errorDiv) errorDiv.style.display = 'none';
        });

        document.getElementById('loginPassword')?.addEventListener('input', () => {
            const errorDiv = document.getElementById('loginError');
            if (errorDiv) errorDiv.style.display = 'none';
        });

        // Registration form
        document.getElementById('registerForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // Clear registration error message when user starts editing fields
        const registrationFields = ['regEmail', 'regFirstName', 'regLastName', 'regDateOfBirth', 'regPassword', 'regConfirmPassword'];
        registrationFields.forEach(fieldId => {
            document.getElementById(fieldId)?.addEventListener('input', () => {
                const errorDiv = document.getElementById('loginError');
                if (errorDiv) errorDiv.style.display = 'none';
            });
        });

        // Dashboard actions
        document.getElementById('updateDataBtn')?.addEventListener('click', () => {
            this.handleUpdateData();
        });

        document.getElementById('refreshBtn')?.addEventListener('click', () => {
            this.loadDashboard();
        });

        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.handleLogout();
        });

        // Account settings
        document.getElementById('accountSettingsBtn')?.addEventListener('click', () => {
            this.showAccountSettings();
        });

        // Admin panel
        document.getElementById('toggleAdminPanel')?.addEventListener('click', () => {
            const content = document.getElementById('adminContent');
            if (content) {
                const isVisible = content.style.display !== 'none';
                content.style.display = isVisible ? 'none' : 'block';
                const btn = document.getElementById('toggleAdminPanel');
                if (btn) btn.textContent = isVisible ? '▶ Show' : '▼ Hide';
            }
        });

        // Filters
        document.getElementById('periodFilter')?.addEventListener('change', () => {
            this.loadDashboard();
        });

        document.getElementById('formTypeFilter')?.addEventListener('change', () => {
            this.loadDashboard();
        });

        // Password strength indicator
        document.getElementById('regPassword')?.addEventListener('input', (e) => {
            this.checkPasswordStrength(e.target.value);
        });

        // Modal event listeners
        const accountSettingsModal = document.getElementById('accountSettingsModal');
        if (accountSettingsModal) {
            // Close modal when clicking the X button
            const closeBtn = accountSettingsModal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    accountSettingsModal.style.display = 'none';
                });
            }

            // Close modal when clicking outside the modal content
            accountSettingsModal.addEventListener('click', (e) => {
                if (e.target === accountSettingsModal) {
                    accountSettingsModal.style.display = 'none';
                }
            });
        }

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const accountSettingsModal = document.getElementById('accountSettingsModal');
                if (accountSettingsModal && accountSettingsModal.style.display === 'flex') {
                    accountSettingsModal.style.display = 'none';
                }
            }
        });
    }

    showLogin() {
        const loginScreen = document.getElementById('loginScreen');
        const dashboardScreen = document.getElementById('dashboardScreen');
        if (loginScreen) loginScreen.style.display = 'flex';
        if (dashboardScreen) dashboardScreen.style.display = 'none';
    }

    showDashboard() {
        const loginScreen = document.getElementById('loginScreen');
        const dashboardScreen = document.getElementById('dashboardScreen');
        if (loginScreen) loginScreen.style.display = 'none';
        if (dashboardScreen) dashboardScreen.style.display = 'flex';
    }

    showLoading(show = true) {
        const loadingSpinner = document.getElementById('loadingSpinner');
        if (loadingSpinner) loadingSpinner.style.display = show ? 'flex' : 'none';
    }

    async handleLogin() {
        const emailEl = document.getElementById('loginEmail');
        const passwordEl = document.getElementById('loginPassword');
        const errorDiv = document.getElementById('loginError');

        if (!emailEl || !passwordEl) {
            console.error('Login form elements not found');
            return;
        }

        const email = emailEl.value;
        const password = passwordEl.value;
        if (errorDiv) errorDiv.style.display = 'none';

        try {
            this.showLoading(true);

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            this.showLoading(false);

            if (response.ok) {
                const data = await response.json();
                this.sessionId = data.sessionId;
                this.userRole = data.role;
                this.userFirstName = data.firstName;
                localStorage.setItem('analyticsSession', this.sessionId);
                localStorage.setItem('analyticsUserRole', data.role);
                localStorage.setItem('analyticsUserFirstName', data.firstName);
                localStorage.setItem('analyticsUserEmail', data.email);
                localStorage.setItem('analyticsUserLastName', data.lastName);
                localStorage.setItem('analyticsUserDOB', data.dateOfBirth);
                localStorage.setItem('analyticsUserCreatedAt', data.createdAt);
                const loginForm = document.getElementById('loginForm');
                if (loginForm) loginForm.reset();

                // Update UI with user's first name
                const userFirstNameElement = document.getElementById('userFirstName');
                if (userFirstNameElement) {
                    userFirstNameElement.textContent = data.firstName;
                }

                this.showDashboard();
                if (data.role === 'admin') {
                    this.showAdminPanel();
                } else {
                    this.hideAdminPanel();
                }
                await this.loadDashboard();
            } else {
                const data = await response.json();
                errorDiv.textContent = data.error || 'Login failed. Please try again.';
                errorDiv.style.display = 'block';
            }
        } catch (error) {
            this.showLoading(false);
            errorDiv.textContent = 'Login failed. Please try again.';
            errorDiv.style.display = 'block';
            console.error('Login error:', error);
        }
    }

    async handleRegister() {
        const emailEl = document.getElementById('regEmail');
        const firstNameEl = document.getElementById('regFirstName');
        const lastNameEl = document.getElementById('regLastName');
        const dateOfBirthEl = document.getElementById('regDateOfBirth');
        const passwordEl = document.getElementById('regPassword');
        const confirmPasswordEl = document.getElementById('regConfirmPassword');
        const errorDiv = document.getElementById('loginError');
        const successDiv = document.getElementById('registerSuccess');

        if (!emailEl || !firstNameEl || !lastNameEl || !dateOfBirthEl || !passwordEl || !confirmPasswordEl) {
            console.error('Registration form elements not found');
            return;
        }

        const email = emailEl.value;
        const firstName = firstNameEl.value;
        const lastName = lastNameEl.value;
        const dateOfBirth = dateOfBirthEl.value;
        const password = passwordEl.value;
        const confirmPassword = confirmPasswordEl.value;

        if (errorDiv) errorDiv.style.display = 'none';
        if (successDiv) successDiv.style.display = 'none';

        try {
            this.showLoading(true);

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, firstName, lastName, dateOfBirth, password, confirmPassword })
            });

            this.showLoading(false);

            if (response.status === 201) {
                const data = await response.json();
                if (successDiv) {
                    successDiv.textContent = '✓ ' + data.message + ' You will receive an email once approved.';
                    successDiv.style.display = 'block';
                }
                const registerForm = document.getElementById('registerForm');
                if (registerForm) registerForm.reset();
                setTimeout(() => this.showLoginForm(), 3000);
            } else {
                const data = await response.json();
                if (errorDiv) {
                    errorDiv.textContent = data.error || 'Registration failed. Please try again.';
                    errorDiv.style.display = 'block';
                }
            }
        } catch (error) {
            this.showLoading(false);
            if (errorDiv) {
                errorDiv.textContent = 'Registration failed. Please try again.';
                errorDiv.style.display = 'block';
            }
            console.error('Registration error:', error);
        }
    }

    showLoginForm() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const loginError = document.getElementById('loginError');
        const registerSuccess = document.getElementById('registerSuccess');

        if (loginForm) loginForm.style.display = 'block';
        if (registerForm) registerForm.style.display = 'none';
        if (loginError) loginError.style.display = 'none';
        if (registerSuccess) registerSuccess.style.display = 'none';
    }

    showRegistrationForm() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const loginError = document.getElementById('loginError');
        const registerSuccess = document.getElementById('registerSuccess');

        if (loginForm) loginForm.style.display = 'none';
        if (registerForm) registerForm.style.display = 'block';
        if (loginError) loginError.style.display = 'none';
        if (registerSuccess) registerSuccess.style.display = 'none';
    }

    checkPasswordStrength(password) {
        const strengthDiv = document.getElementById('passwordStrength');
        if (!strengthDiv) return;

        let strength = 0;
        const criteria = [];

        if (password.length >= 8) {
            strength++;
            criteria.push('length');
        }
        if (/[A-Z]/.test(password)) {
            strength++;
            criteria.push('uppercase');
        }
        if (/[a-z]/.test(password)) {
            strength++;
            criteria.push('lowercase');
        }
        if (/[0-9]/.test(password) || /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            strength++;
            criteria.push('special');
        }

        const strengthLevels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
        const strengthClasses = ['very-weak', 'weak', 'fair', 'good', 'strong'];
        const strengthText = strengthLevels[strength] || 'Very Weak';
        const strengthClass = strengthClasses[strength] || 'very-weak';

        strengthDiv.textContent = strengthText;
        strengthDiv.className = `password-strength ${strengthClass}`;
    }

    async handleLogout() {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'X-Session-Id': this.sessionId
                }
            });
        } catch (error) {
            console.error('Logout error:', error);
        }

        localStorage.removeItem('analyticsSession');
        localStorage.removeItem('analyticsUserRole');
        localStorage.removeItem('analyticsUserFirstName');
        localStorage.removeItem('analyticsUserEmail');
        localStorage.removeItem('analyticsUserLastName');
        localStorage.removeItem('analyticsUserDOB');
        localStorage.removeItem('analyticsUserCreatedAt');
        this.sessionId = null;
        this.userRole = 'manager';
        this.userFirstName = 'User';
        this.clearCharts();
        this.showLogin();
        this.showLoginForm();
    }

    showAccountSettings() {
        const email = localStorage.getItem('analyticsUserEmail') || '-';
        const firstName = localStorage.getItem('analyticsUserFirstName') || 'User';
        const lastName = localStorage.getItem('analyticsUserLastName') || '-';
        const dob = localStorage.getItem('analyticsUserDOB') || '-';
        const createdAt = localStorage.getItem('analyticsUserCreatedAt') || '-';

        // Format dates for display
        let dobDisplay = dob;
        let memberSinceDisplay = createdAt;

        if (dob && dob !== '-') {
            try {
                const dobDate = new Date(dob);
                dobDisplay = dobDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            } catch (e) {
                dobDisplay = dob;
            }
        }

        if (createdAt && createdAt !== '-') {
            try {
                const createdDate = new Date(createdAt);
                memberSinceDisplay = createdDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            } catch (e) {
                memberSinceDisplay = createdAt;
            }
        }

        // Populate modal fields
        const settingsEmail = document.getElementById('settingsEmail');
        const settingsName = document.getElementById('settingsName');
        const settingsDOB = document.getElementById('settingsDOB');
        const settingsMemberSince = document.getElementById('settingsMemberSince');
        const accountSettingsModal = document.getElementById('accountSettingsModal');

        if (settingsEmail) settingsEmail.textContent = email;
        if (settingsName) settingsName.textContent = `${firstName} ${lastName}`.trim();
        if (settingsDOB) settingsDOB.textContent = dobDisplay;
        if (settingsMemberSince) settingsMemberSince.textContent = memberSinceDisplay;

        // Show modal
        if (accountSettingsModal) accountSettingsModal.style.display = 'flex';
    }

    async handleUpdateData() {
        const updateBtn = document.getElementById('updateDataBtn');
        if (!updateBtn) return;

        try {
            // Disable button and show loading state
            updateBtn.disabled = true;
            const originalText = updateBtn.innerHTML;
            updateBtn.innerHTML = '<span>⏳ Updating...</span>';

            this.showLoading(true);

            const response = await this.fetchAPI('/api/analytics/update-data', {
                method: 'POST'
            });

            if (response.success) {
                // Show success message
                alert(`✓ Data updated successfully!\n\n${response.message}`);

                // Reload dashboard data
                await this.loadDashboard();
            } else {
                alert(`⚠ Update completed with issues:\n\n${response.message}`);
                await this.loadDashboard();
            }
        } catch (error) {
            console.error('Update data error:', error);
            alert(`✗ Update failed: ${error.message || 'Please try again'}`);
            this.showLoading(false);
        } finally {
            // Restore button state
            updateBtn.disabled = false;
            updateBtn.innerHTML = '<span>⬇ Update Data</span>';
        }
    }

    async loadDashboard() {
        try {
            this.showLoading(true);

            // Get filter values with safe defaults
            let period = '30';
            let formType = 'all';

            try {
                const periodFilter = document.getElementById('periodFilter');
                if (periodFilter && periodFilter.value) {
                    period = periodFilter.value;
                }
            } catch (e) {
                console.warn('Could not access periodFilter:', e.message);
            }

            try {
                const formTypeFilter = document.getElementById('formTypeFilter');
                if (formTypeFilter && formTypeFilter.value) {
                    formType = formTypeFilter.value;
                }
            } catch (e) {
                console.warn('Could not access formTypeFilter:', e.message);
            }

            console.log('Loading dashboard with period:', period, 'formType:', formType);

            // Fetch all analytics data in parallel
            const responses = await Promise.all([
                this.fetchAPI(`/api/analytics/summary`),
                this.fetchAPI(`/api/analytics/trends?period=${period}`),
                this.fetchAPI(`/api/analytics/health-issues`),
                this.fetchAPI(`/api/analytics/therapists`),
                this.fetchAPI(`/api/analytics/pressure`),
                this.fetchAPI(`/api/analytics/feeling-scores`),
                this.fetchAPI(`/api/analytics/health-notes`).catch(() => null),
                this.fetchAPI(`/api/analytics/data-quality`).catch(() => null),
                this.fetchAPI(`/api/analytics/sessions?period=${period}`).catch(() => null)
            ]);

            const [summary, trends, health, therapists, pressure, feelings, healthNotes, dataQuality, sessions] = responses;

            // Safely render each section
            try {
                if (summary) this.renderSummaryCards(summary);
            } catch (e) {
                console.error('Error rendering summary cards:', e);
            }

            try {
                if (trends) this.renderTrendsChart(trends);
            } catch (e) {
                console.error('Error rendering trends chart:', e);
            }

            try {
                if (health) this.renderHealthChart(health);
            } catch (e) {
                console.error('Error rendering health chart:', e);
            }

            try {
                if (therapists) this.renderTherapistsChart(therapists);
            } catch (e) {
                console.error('Error rendering therapists chart:', e);
            }

            try {
                if (pressure) this.renderPressureChart(pressure);
            } catch (e) {
                console.error('Error rendering pressure chart:', e);
            }

            try {
                if (feelings) this.renderFeelingsChart(feelings);
            } catch (e) {
                console.error('Error rendering feelings chart:', e);
            }

            try {
                if (healthNotes) this.renderHealthNotes(healthNotes);
            } catch (e) {
                console.error('Error rendering health notes:', e);
            }

            try {
                if (dataQuality) this.renderDataQuality(dataQuality);
            } catch (e) {
                console.error('Error rendering data quality:', e);
            }

            try {
                if (sessions) this.renderSessionCalendar(sessions);
            } catch (e) {
                console.error('Error rendering session calendar:', e);
            }

            console.log('Dashboard loaded successfully');
            this.showLoading(false);
        } catch (error) {
            this.showLoading(false);

            if (error.status === 401) {
                console.warn('Session expired, logging out');
                this.handleLogout();
                return;
            }

            console.error('Error loading dashboard:', error);
            console.error('Error details:', error.message, error.stack);
            alert('Failed to load dashboard data. Please refresh the page. (Check console for details)');
        }
    }

    /**
     * Render the day-by-day session tracking table
     * @param {Object} sessions - { dates: ["27/1", ...], counts: [14, 19, ...] }
     */
    renderSessionCalendar(sessions) {
        const datesRow = document.getElementById('calendarDatesRow');
        const body = document.getElementById('calendarSessionsBody');
        if (!datesRow || !body) return;

        // Clear previous
        datesRow.innerHTML = '<th>Date</th>';
        body.innerHTML = '';

        // Insert date columns
        (sessions.dates || []).forEach(date => {
            const th = document.createElement('th');
            th.textContent = date;
            datesRow.appendChild(th);
        });
        const totalTh = document.createElement('th');
        totalTh.textContent = 'Total';
        totalTh.className = 'total-col';
        datesRow.appendChild(totalTh);

        // Insert session row
        const tr = document.createElement('tr');
        const labelTd = document.createElement('td');
        labelTd.textContent = 'Sessions';
        tr.appendChild(labelTd);
        let total = 0;
        (sessions.counts || []).forEach(count => {
            const td = document.createElement('td');
            td.textContent = (count === null || count === undefined || count === '-') ? '-' : count;
            if (typeof count === 'number') total += count;
            tr.appendChild(td);
        });
        const totalTd = document.createElement('td');
        totalTd.textContent = total;
        totalTd.className = 'total-col';
        tr.appendChild(totalTd);
        body.appendChild(tr);
    }

    async fetchAPI(endpoint, options = {}) {
        const fetchOptions = {
            headers: {
                'X-Session-Id': this.sessionId,
                'Content-Type': 'application/json'
            },
            ...options
        };

        const response = await fetch(endpoint, fetchOptions);

        if (!response.ok) {
            const error = new Error('API request failed');
            error.status = response.status;
            throw error;
        }

        return response.json();
    }

    renderSummaryCards(data) {
        // Validate input data
        if (!data || typeof data !== 'object') {
            console.warn('Invalid data passed to renderSummaryCards:', data);
            return;
        }

        // Helper function to safely set element text
        const setText = (elementId, value) => {
            const el = document.getElementById(elementId);
            if (el) {
                el.textContent = value || '-';
            }
        };

        // Total Submissions
        setText('totalSubmissions', data.totalSubmissions || '-');
        const intakeCount = data.totalIntakes !== undefined ? data.totalIntakes : '-';
        const feedbackCount = data.totalFeedback !== undefined ? data.totalFeedback : '-';
        setText('submissionDetail', `${intakeCount} intakes, ${feedbackCount} feedback`);

        // Average Improvement
        if (data.avgImprovement !== undefined && data.avgImprovement !== null) {
            setText('avgImprovement', data.avgImprovement > 0 ? `+${data.avgImprovement}` : data.avgImprovement);
        } else {
            setText('avgImprovement', '-');
        }

        // Recommendation Rate
        if (data.recommendationRate !== undefined && data.recommendationRate !== null) {
            setText('recommendationRate', data.recommendationRate !== 0 ? `${data.recommendationRate}%` : 'N/A');
        } else {
            setText('recommendationRate', 'N/A');
        }

        // Top Therapist
        setText('topTherapist', data.topTherapist || '-');
        const sessions = data.topTherapistSessions !== undefined ? data.topTherapistSessions : 0;
        setText('topTherapistDetail', `${sessions} sessions`);

        // Match Quality
        const matchRate = data.matchedFeedbackRate !== undefined ? data.matchedFeedbackRate : 0;
        const matchQuality = Math.round((matchRate || 0) / 10) * 10;
        setText('matchQuality', `${matchQuality}%`);
        setText('matchQualityDetail', `${matchRate}% matched`);

        // Data Quality (always show "Good" for now as per original logic)
        setText('dataQuality', 'Good');
    }

    renderTrendsChart(data) {
        // Validate inputs
        const canvasEl = document.getElementById('trendsChart');
        if (!canvasEl) {
            console.warn('Canvas element trendsChart not found');
            return;
        }

        if (!data || !Array.isArray(data.labels) || !Array.isArray(data.values)) {
            console.warn('Invalid data for trends chart:', data);
            return;
        }

        const ctx = canvasEl.getContext('2d');
        if (!ctx) {
            console.warn('Could not get canvas context for trendsChart');
            return;
        }

        if (this.charts.trends) {
            this.charts.trends.destroy();
        }

        this.charts.trends = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels || [],
                datasets: [
                    {
                        label: 'Total',
                        data: data.values || [],
                        borderColor: '#9D4EDD',
                        backgroundColor: 'rgba(157, 78, 221, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#9D4EDD',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1, color: '#FFFFFF' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#FFFFFF' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                }
            }
        });
    }

    renderHealthChart(data) {
        // Validate inputs
        const canvasEl = document.getElementById('healthIssuesChart');
        if (!canvasEl) {
            console.warn('Canvas element healthIssuesChart not found');
            return;
        }

        if (!data || !Array.isArray(data.labels) || !Array.isArray(data.data)) {
            console.warn('Invalid data for health chart:', data);
            return;
        }

        const ctx = canvasEl.getContext('2d');
        if (!ctx) {
            console.warn('Could not get canvas context for healthIssuesChart');
            return;
        }

        if (this.charts.health) {
            this.charts.health.destroy();
        }

        this.charts.health = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels || [],
                datasets: [
                    {
                        label: 'Frequency',
                        data: data.data || [],
                        backgroundColor: [
                            '#9D4EDD',
                            '#AD63ED',
                            '#7B2CBF',
                            '#B878E8',
                            '#6B1BA1',
                            '#BD73F5',
                            '#5D0F93',
                            '#C27FF9',
                            '#4B0A7B',
                            '#D28FFF'
                        ],
                        borderRadius: 8
                    }
                ]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: { stepSize: 1, color: '#FFFFFF' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    y: {
                        ticks: { color: '#FFFFFF' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                }
            }
        });
    }

    renderPressureChart(data) {
        // Validate inputs
        const canvasEl = document.getElementById('pressureChart');
        if (!canvasEl) {
            console.warn('Canvas element pressureChart not found');
            return;
        }

        if (!data || !Array.isArray(data.labels) || !Array.isArray(data.data)) {
            console.warn('Invalid data for pressure chart:', data);
            return;
        }

        const ctx = canvasEl.getContext('2d');
        if (!ctx) {
            console.warn('Could not get canvas context for pressureChart');
            return;
        }

        if (this.charts.pressure) {
            this.charts.pressure.destroy();
        }

        const colors = data.backgroundColor || ['#9D4EDD', '#7B2CBF', '#AD63ED'];

        this.charts.pressure = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels || [],
                datasets: [
                    {
                        data: data.data || [],
                        backgroundColor: colors,
                        borderColor: 'rgba(0, 0, 0, 0.3)',
                        borderWidth: 3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 16,
                            font: { size: 13, weight: 500 },
                            color: '#FFFFFF'
                        }
                    }
                }
            }
        });
    }

    renderTherapistsChart(data) {
        // Validate inputs
        const canvasEl = document.getElementById('therapistsChart');
        if (!canvasEl) {
            console.warn('Canvas element therapistsChart not found');
            return;
        }

        if (!data || !Array.isArray(data.labels) || !Array.isArray(data.datasets) || data.datasets.length < 3) {
            console.warn('Invalid data for therapists chart:', data);
            return;
        }

        const ctx = canvasEl.getContext('2d');
        if (!ctx) {
            console.warn('Could not get canvas context for therapistsChart');
            return;
        }

        // Validate all three datasets exist and have data
        const ds0 = data.datasets[0] && Array.isArray(data.datasets[0].data) ? data.datasets[0].data : [];
        const ds1 = data.datasets[1] && Array.isArray(data.datasets[1].data) ? data.datasets[1].data : [];
        const ds2 = data.datasets[2] && Array.isArray(data.datasets[2].data) ? data.datasets[2].data : [];

        if (this.charts.therapists) {
            this.charts.therapists.destroy();
        }

        this.charts.therapists = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels || [],
                datasets: [
                    {
                        label: 'Sessions',
                        data: ds0,
                        backgroundColor: '#9D4EDD',
                        borderRadius: 8
                    },
                    {
                        label: 'Avg Pre-Feeling',
                        data: ds1,
                        backgroundColor: '#AD63ED',
                        borderRadius: 8
                    },
                    {
                        label: 'Avg Post-Feeling',
                        data: ds2,
                        backgroundColor: '#7B2CBF',
                        borderRadius: 8
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 16,
                            font: { size: 13, weight: 500 },
                            color: '#FFFFFF'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#FFFFFF' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#FFFFFF' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                }
            }
        });
    }

    renderFeelingsChart(data) {
        // Validate inputs
        const canvasEl = document.getElementById('feelingScoresChart');
        if (!canvasEl) {
            console.warn('Canvas element feelingScoresChart not found');
            return;
        }

        if (!data || typeof data !== 'object' || !data.summary) {
            console.warn('Invalid data for feelings chart:', data);
            return;
        }

        const ctx = canvasEl.getContext('2d');
        if (!ctx) {
            console.warn('Could not get canvas context for feelingScoresChart');
            return;
        }

        if (this.charts.feelings) {
            this.charts.feelings.destroy();
        }

        const summary = data.summary;
        const improvement = summary.avgImprovement !== undefined ? summary.avgImprovement : 0;
        const avgPre = summary.avgPre !== undefined ? summary.avgPre : 0;
        const avgPost = summary.avgPost !== undefined ? summary.avgPost : 0;

        this.charts.feelings = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Pre-Session', 'Post-Session'],
                datasets: [
                    {
                        label: 'Average Feeling Score',
                        data: [avgPre, avgPost],
                        backgroundColor: ['#9D4EDD', '#7B2CBF'],
                        borderRadius: 8
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 16,
                            font: { size: 13, weight: 500 },
                            color: '#FFFFFF'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            afterLabel: (context) => {
                                if (context.dataIndex === 1 && improvement) {
                                    return `Improvement: +${improvement}`;
                                }
                                return '';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        min: 0,
                        max: 10,
                        ticks: { color: '#FFFFFF' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#FFFFFF' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                }
            }
        });
    }

    clearCharts() {
        for (const key in this.charts) {
            if (this.charts[key]) {
                this.charts[key].destroy();
            }
        }
        this.charts = {};
    }

    renderHealthNotes(data) {
        const container = document.getElementById('healthNotesContainer');
        if (!container) return;

        container.style.display = 'block';

        const reviewNotesList = document.getElementById('reviewNotesList');
        const avoidNotesList = document.getElementById('avoidNotesList');

        if (data.reviewNotes && data.reviewNotes.length > 0) {
            reviewNotesList.innerHTML = data.reviewNotes
                .map(note => `<div class="note-item"><p>${this.escapeHtml(note)}</p></div>`)
                .join('');
        } else {
            reviewNotesList.innerHTML = '<p class="empty-state">No review notes yet</p>';
        }

        if (data.avoidNotes && data.avoidNotes.length > 0) {
            avoidNotesList.innerHTML = data.avoidNotes
                .map(note => `<div class="note-item"><p>${this.escapeHtml(note)}</p></div>`)
                .join('');
        } else {
            avoidNotesList.innerHTML = '<p class="empty-state">No avoid notes yet</p>';
        }
    }

    renderDataQuality(data) {
        const container = document.getElementById('dataQualityContainer');
        if (!container) return;

        container.style.display = 'block';

        const metrics = data?.qualityMetrics;
        if (!metrics) return;

        const timestampQuality = document.getElementById('timestampQuality');
        const timestampValue = document.getElementById('timestampValue');
        const contactQuality = document.getElementById('contactQuality');
        const contactValue = document.getElementById('contactValue');
        const commentsQuality = document.getElementById('commentsQuality');
        const commentsValue = document.getElementById('commentsValue');
        const healthQuality = document.getElementById('healthQuality');
        const healthValue = document.getElementById('healthValue');

        if (timestampQuality) timestampQuality.style.width = `${metrics.submissionDatesAccuracy}%`;
        if (timestampValue) timestampValue.textContent = `${metrics.submissionDatesAccuracy}%`;

        if (contactQuality) contactQuality.style.width = `${metrics.contactInfoComplete}%`;
        if (contactValue) contactValue.textContent = `${metrics.contactInfoComplete}%`;

        if (commentsQuality) commentsQuality.style.width = `${metrics.commentsCapture}%`;
        if (commentsValue) commentsValue.textContent = `${metrics.commentsCapture}%`;

        if (healthQuality) healthQuality.style.width = `${metrics.healthNotesCapture}%`;
        if (healthValue) healthValue.textContent = `${metrics.healthNotesCapture}%`;
    }

    showAdminPanel() {
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel) {
            adminPanel.style.display = 'block';
            this.loadPendingUsers();
        }
    }

    hideAdminPanel() {
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel) {
            adminPanel.style.display = 'none';
        }
    }

    async loadPendingUsers() {
        try {
            const response = await this.fetchAPI('/api/admin/pending-users', { method: 'GET' });
            const pendingCount = document.getElementById('pendingCount');
            if (pendingCount) {
                pendingCount.textContent = response.users.length;
            }

            const pendingList = document.getElementById('pendingUsersList');
            if (!pendingList) return;

            if (response.users.length === 0) {
                pendingList.innerHTML = '<p class="empty-state">No pending registrations</p>';
                return;
            }

            let html = '';
            for (const user of response.users) {
                html += `
                    <div class="user-item">
                        <div class="user-info">
                            <strong>${this.escapeHtml(user.firstName)} ${this.escapeHtml(user.lastName)}</strong>
                            <p>${this.escapeHtml(user.email)}</p>
                            <small>Registered: ${new Date(user.createdAt).toLocaleDateString()}</small>
                        </div>
                        <div class="user-actions">
                            <button class="btn-small btn-approve" data-user-id="${user.id}" data-action="approve">✓ Approve</button>
                            <button class="btn-small btn-reject" data-user-id="${user.id}" data-action="reject">✗ Reject</button>
                        </div>
                    </div>
                `;
            }
            pendingList.innerHTML = html;

            // Add event listeners to approval/rejection buttons
            this.attachUserActionListeners();
        } catch (error) {
            console.error('Error loading pending users:', error);
        }
    }

    attachUserActionListeners() {
        const pendingList = document.getElementById('pendingUsersList');
        if (!pendingList) return;

        // Use event delegation to handle approve buttons
        pendingList.addEventListener('click', (event) => {
            const btn = event.target.closest('button[data-action]');
            if (!btn) return;

            const userId = btn.getAttribute('data-user-id');
            const action = btn.getAttribute('data-action');

            if (!userId || !action) return;

            if (action === 'approve') {
                this.approveUser(userId);
            } else if (action === 'reject') {
                this.rejectUser(userId);
            }
        });
    }

    async approveUser(userId) {
        if (!confirm('Approve this user registration?')) return;

        try {
            this.showLoading(true);
            const response = await this.fetchAPI(`/api/admin/approve-user/${userId}`, { method: 'POST' });
            this.showLoading(false);
            alert('User approved and notified via email');
            await this.loadPendingUsers();
        } catch (error) {
            this.showLoading(false);
            alert('Failed to approve user');
            console.error('Approve error:', error);
        }
    }

    async rejectUser(userId) {
        const reason = prompt('Rejection reason (optional):', '');
        if (reason === null) return; // User cancelled

        try {
            this.showLoading(true);
            const response = await this.fetchAPI(`/api/admin/reject-user/${userId}`, {
                method: 'POST',
                body: JSON.stringify({ reason: reason || undefined })
            });
            this.showLoading(false);
            alert('User rejected and notified via email');
            await this.loadPendingUsers();
        } catch (error) {
            this.showLoading(false);
            alert('Failed to reject user');
            console.error('Reject error:', error);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize dashboard when DOM is loaded
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new AnalyticsDashboard();
});
