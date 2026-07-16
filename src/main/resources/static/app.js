// --- API BASE PATHS ---
const API_PATIENTS = '/api/patients';
const API_DOCTORS = '/api/doctors';
const API_APPOINTMENTS = '/api/appointments';
const API_BILLS = '/api/bills';
const API_BEDS = '/api/beds';

// --- APPLICATION STATE ---
let patientsCache = [];
let doctorsCache = [];
let currentFilter = 'ALL';

// --- TAB SWITCH LOADING BAR ---
function showTabLoader() {
    const bar = document.getElementById('tab-loader-bar');
    if (!bar) return;
    // Reset
    bar.classList.remove('done');
    bar.classList.add('loading');
    bar.style.width = '0%';

    // Animate to ~85% quickly, hold, then finish on tab content shown
    const t1 = setTimeout(() => { bar.style.width = '40%'; }, 50);
    const t2 = setTimeout(() => { bar.style.width = '70%'; }, 200);
    const t3 = setTimeout(() => { bar.style.width = '88%'; }, 400);

    // Finish + fade out
    const t4 = setTimeout(() => {
        bar.style.width = '100%';
        bar.classList.add('done');
        setTimeout(() => {
            bar.classList.remove('loading', 'done');
            bar.style.width = '0%';
        }, 500);
    }, 700);
}

// --- INITIALIZE APPLICATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Set Header Date
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', dateOptions);

    // Setup Sidebar Tabs Navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            // Switch Active Tab Class
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Switch Active View
            const tabName = item.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    // Setup Appointment Filter Tabs
    const filterBtns = document.querySelectorAll('.filter-tab-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            loadAppointments();
        });
    });

    // Setup Live Search Handlers
    document.getElementById('global-search').addEventListener('input', handleGlobalSearch);
    document.getElementById('patient-search-input').addEventListener('input', filterPatientsTable);
    document.getElementById('doctor-search-input').addEventListener('input', filterDoctorsGrid);
    document.getElementById('billing-search-input').addEventListener('input', filterBillingTable);
    document.getElementById('appointment-search-input').addEventListener('input', loadAppointments);
    document.getElementById('appointment-date-filter').addEventListener('change', loadAppointments);
    
    // Setup Bed Filter Tabs
    const bedFilterBtns = document.querySelectorAll('#beds-filter-tabs .filter-tab-btn');
    bedFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            bedFilterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentBedFilter = btn.getAttribute('data-filter');
            loadBeds();
        });
    });

    // Setup Bed Live Search
    const bedSearchInput = document.getElementById('bed-search-input');
    if (bedSearchInput) {
        bedSearchInput.addEventListener('input', loadBeds);
    }

    const bedTypeFilter = document.getElementById('bed-type-filter');
    if (bedTypeFilter) {
        bedTypeFilter.addEventListener('change', loadBeds);
    }

    document.getElementById('header-date-picker').addEventListener('change', (e) => {
        const selectedDate = e.target.value;
        if (selectedDate) {
            const appointmentsTabBtn = document.querySelector('.nav-item[data-tab="appointments"]');
            if (appointmentsTabBtn) {
                document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
                appointmentsTabBtn.classList.add('active');
                switchTab('appointments');
            }
            const dateFilterInput = document.getElementById('appointment-date-filter');
            if (dateFilterInput) {
                dateFilterInput.value = selectedDate;
                loadAppointments();
            }
        }
    });

    // Initial Data Fetch & Load
    refreshCaches().then(() => {
        switchTab('dashboard');
    });
});

// --- CACHE MANAGEMENT ---
async function refreshCaches() {
    try {
        const [patientsRes, doctorsRes] = await Promise.all([
            fetch(API_PATIENTS),
            fetch(API_DOCTORS)
        ]);

        if (patientsRes.ok) patientsCache = await patientsRes.json();
        if (doctorsRes.ok) doctorsCache = await doctorsRes.json();

        populateFormDropdowns();
    } catch (error) {
        console.error('Failed to sync cache with server:', error);
        showToast('Error syncing data with backend. Please ensure the server is running.', 'danger');
    }
}

// Populate dropdown lists in modal forms
function populateFormDropdowns() {
    const appPatientSelect = document.getElementById('appointment-patient');
    const appDoctorSelect = document.getElementById('appointment-doctor');
    const billPatientSelect = document.getElementById('billing-patient');
    const assignBedPatientSelect = document.getElementById('assign-bed-patient');
 
    // Save current values if editing
    const currentAppPat = appPatientSelect.value;
    const currentAppDoc = appDoctorSelect.value;
    const currentBillPat = billPatientSelect.value;
    const currentAssignPat = assignBedPatientSelect ? assignBedPatientSelect.value : null;
 
    // Reset dropdowns
    appPatientSelect.innerHTML = '<option value="" disabled selected>Choose Patient</option>';
    billPatientSelect.innerHTML = '<option value="" disabled selected>Choose Patient</option>';
    appDoctorSelect.innerHTML = '<option value="" disabled selected>Choose Doctor</option>';
    if (assignBedPatientSelect) {
        assignBedPatientSelect.innerHTML = '<option value="" disabled selected>Choose Patient</option>';
    }
 
    // Load patients
    patientsCache.forEach(p => {
        const optionHTML = `<option value="${p.id}">${p.name} (ID: ${p.id})</option>`;
        appPatientSelect.insertAdjacentHTML('beforeend', optionHTML);
        billPatientSelect.insertAdjacentHTML('beforeend', optionHTML);
        if (assignBedPatientSelect) {
            assignBedPatientSelect.insertAdjacentHTML('beforeend', optionHTML);
        }
    });

    // Load doctors
    doctorsCache.forEach(d => {
        const optionHTML = `<option value="${d.id}">${d.name} (${d.specialization})</option>`;
        appDoctorSelect.insertAdjacentHTML('beforeend', optionHTML);
    });

    // Restore values if still valid
    if (currentAppPat) appPatientSelect.value = currentAppPat;
    if (currentAppDoc) appDoctorSelect.value = currentAppDoc;
    if (currentBillPat) billPatientSelect.value = currentBillPat;
    if (currentAssignPat && assignBedPatientSelect) assignBedPatientSelect.value = currentAssignPat;
}

// --- TAB SWITCHER ---
function switchTab(tabName) {
    // Show loading bar
    showTabLoader();

    // Update active class on nav-item
    document.querySelectorAll('.nav-item').forEach(nav => {
        if (nav.getAttribute('data-tab') === tabName) {
            nav.classList.add('active');
        } else {
            nav.classList.remove('active');
        }
    });

    // Hide all views
    document.querySelectorAll('.tab-view').forEach(view => {
        view.classList.remove('active', 'tab-fade-in');
    });

    // Show selected view with fade-in
    const activeView = document.getElementById(`${tabName}-view`);
    if (activeView) {
        activeView.classList.add('active');
        // Trigger reflow to restart animation
        void activeView.offsetWidth;
        activeView.classList.add('tab-fade-in');
    }

    // Update Header Text
    const titleMap = {
        'dashboard':    { title: 'Dashboard',             subtitle: "Welcome back, Coordinator. Here is today's overview." },
        'patients':     { title: 'Patient Directory',     subtitle: 'Manage records, update details and add medical histories.' },
        'doctors':      { title: 'Medical Staff',         subtitle: 'View doctor specializations, availabilities, and contact details.' },
        'appointments': { title: 'Appointment Logs',      subtitle: 'Schedule appointments and track patient consultation statuses.' },
        'billing':      { title: 'Billing & Invoicing',   subtitle: 'Generate and review bills, manage invoice payments.' },
        'beds':         { title: 'Room & Bed Management', subtitle: 'Monitor hospital bed occupancies, register new rooms, and manage patient stays.' },
        'staff':        { title: 'Staff Directory',       subtitle: 'Manage hospital staff members, roles, salaries, and shifts.' },
        'lab':          { title: 'Laboratory Portal',     subtitle: 'Schedule lab tests, update patient results, and track diagnostic reports.' },
        'departments':  { title: 'Hospital Departments',  subtitle: 'Overview of medical departments, capacity, and operations.' },
        'calendar':     { title: 'Interactive Schedule',  subtitle: 'Review hospital activities, appointments, and shifts on the calendar.' },
        'feedback':     { title: 'Feedback & Reviews',    subtitle: 'Inspect patient feedback, ratings, and resolution statuses.' },
        'admin':        { title: 'Admin Settings',        subtitle: 'Manage database seeds, view system telemetry, and inspect SQL configurations.' }
    };

    if (titleMap[tabName]) {
        document.getElementById('page-title').textContent = titleMap[tabName].title;
        document.getElementById('page-subtitle').textContent = titleMap[tabName].subtitle;
    }

    // Load specific data
    if (tabName === 'dashboard') {
        loadDashboard();
        setTimeout(renderCharts, 100);
    } else if (tabName === 'patients') {
        loadPatients();
    } else if (tabName === 'doctors') {
        loadDoctors();
    } else if (tabName === 'appointments') {
        loadAppointments();
    } else if (tabName === 'billing') {
        loadBilling();
    } else if (tabName === 'beds') {
        loadBeds();
    } else if (tabName === 'admin') {
        loadAdminStats();
    } else if (tabName === 'staff') {
        document.querySelectorAll('.staff-sub-tab').forEach(b => {
            if (b.getAttribute('data-role') === 'ALL') b.classList.add('active');
            else b.classList.remove('active');
        });
        const staffContainer = document.getElementById('staff-directory-container');
        const attendanceContainer = document.getElementById('staff-attendance-container');
        const btnAddStaff = document.getElementById('btn-add-staff');
        const btnExportStaff = document.getElementById('btn-export-staff-excel');
        const btnAddAttendance = document.getElementById('btn-add-attendance');
        
        if (staffContainer) staffContainer.style.display = 'block';
        if (attendanceContainer) attendanceContainer.style.display = 'none';
        if (btnAddStaff) btnAddStaff.style.display = 'block';
        if (btnExportStaff) btnExportStaff.style.display = 'block';
        if (btnAddAttendance) btnAddAttendance.style.display = 'none';
        loadStaff();
    } else if (tabName === 'lab') {
        loadLabTests();
    } else if (tabName === 'departments') {
        loadDepartments();
    } else if (tabName === 'calendar') {
        renderCalendar();
    } else if (tabName === 'feedback') {
        loadFeedback();
    }
}

// --- DASHBOARD LOADER ---
async function loadDashboard() {
    await refreshCaches();
    
    // Fetch appointments & bills
    let appointments = [];
    let bills = [];
    try {
        const [appRes, billRes] = await Promise.all([
            fetch(API_APPOINTMENTS),
            fetch(API_BILLS)
        ]);
        if (appRes.ok) appointments = await appRes.json();
        if (billRes.ok) bills = await billRes.json();
    } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
    }

    // Set stat counters
    document.getElementById('stat-patients-count').textContent = patientsCache.length;
    document.getElementById('stat-doctors-count').textContent = doctorsCache.length;
    
    // Count active appointments (e.g. status is SCHEDULED)
    const activeApps = appointments.filter(a => a.status === 'SCHEDULED');
    document.getElementById('stat-appointments-count').textContent = activeApps.length;

    // Total Billings & breakdown
    let totalBillings = 0;
    let paidCount = 0;
    let pendingCount = 0;
    
    bills.forEach(b => {
        totalBillings += b.amount;
        if (b.status === 'PAID') paidCount++;
        else if (b.status === 'UNPAID') pendingCount++;
    });

    document.getElementById('stat-billing-total').textContent = `RS ${totalBillings.toFixed(2)}`;
    document.getElementById('paid-invoices-count').textContent = paidCount;
    document.getElementById('pending-invoices-count').textContent = pendingCount;

    // Render Recent Appointments Table (Limit to 5)
    const recentTbody = document.getElementById('recent-appointments-tbody');
    recentTbody.innerHTML = '';
    
    const sortedApps = appointments.sort((a,b) => new Date(b.appointmentDate) - new Date(a.appointmentDate)).slice(0, 5);
    
    if (sortedApps.length === 0) {
        recentTbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No appointments recorded.</td></tr>`;
        return;
    }

    sortedApps.forEach(app => {
        const badgeClass = app.status === 'SCHEDULED' ? 'badge-warning' : (app.status === 'COMPLETED' ? 'badge-success' : 'badge-danger');
        const formattedDate = formatDateTime(app.appointmentDate);
        
        const tr = `
            <tr>
                <td><strong>${app.patient ? app.patient.name : 'Unknown'}</strong></td>
                <td>${app.doctor ? app.doctor.name : 'Unknown'}</td>
                <td>${formattedDate}</td>
                <td><span class="badge ${badgeClass}">${app.status}</span></td>
                <td><span class="text-muted">${app.symptoms || 'None'}</span></td>
            </tr>
        `;
        recentTbody.insertAdjacentHTML('beforeend', tr);
    });
}

// --- PATIENT MODULE ---
async function loadPatients() {
    const tbody = document.getElementById('patients-tbody');
    tbody.innerHTML = '<tr><td colspan="8" class="text-center">Loading patient data...</td></tr>';

    try {
        const res = await fetch(API_PATIENTS);
        if (!res.ok) throw new Error('API Error');
        const patients = await res.json();
        patientsCache = patients; // Sync cache
        renderPatientsTable(patients);
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Error fetching patient records.</td></tr>';
    }
}

function renderPatientsTable(patients) {
    const tbody = document.getElementById('patients-tbody');
    tbody.innerHTML = '';

    if (patients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No patients registered.</td></tr>';
        return;
    }

    patients.forEach(p => {
        const tr = `
            <tr>
                <td>#${p.id}</td>
                <td><strong>${p.name}</strong></td>
                <td>${p.age} / ${p.gender}</td>
                <td>${p.contactNumber}</td>
                <td>${p.email || '<span class="text-muted">N/A</span>'}</td>
                <td>${p.address}</td>
                <td><span class="text-muted">${p.medicalHistory || 'None'}</span></td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn-icon btn-icon-edit" onclick="editPatient(${p.id})" title="Edit Patient Details">
                            <i class="ri-edit-line"></i>
                        </button>
                        <button class="btn-icon btn-icon-delete" onclick="deletePatient(${p.id})" title="Delete Patient Record">
                            <i class="ri-delete-bin-line"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', tr);
    });
}

function filterPatientsTable() {
    const query = document.getElementById('patient-search-input').value.toLowerCase();
    const filtered = patientsCache.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.id.toString().includes(query) ||
        p.address.toLowerCase().includes(query) ||
        (p.medicalHistory && p.medicalHistory.toLowerCase().includes(query))
    );
    renderPatientsTable(filtered);
}

async function savePatient(e) {
    e.preventDefault();

    const id = document.getElementById('patient-id').value;
    const patientData = {
        name: document.getElementById('patient-name').value,
        age: parseInt(document.getElementById('patient-age').value),
        gender: document.getElementById('patient-gender').value,
        contactNumber: document.getElementById('patient-contact').value,
        email: document.getElementById('patient-email').value,
        address: document.getElementById('patient-address').value,
        medicalHistory: document.getElementById('patient-history').value
    };

    const isEdit = !!id;
    const url = isEdit ? `${API_PATIENTS}/${id}` : API_PATIENTS;
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patientData)
        });

        if (res.ok) {
            const actionText = isEdit ? 'updated' : 'registered';
            showToast(`Patient successfully ${actionText}!`, 'success');
            if (window.addNotification) window.addNotification('success', 'ri-user-heart-line', `Patient ${patientData.name} was ${actionText}`);
            closeModal('patient-modal');
            await refreshCaches();
            loadPatients();
        } else {
            throw new Error('Failed to save');
        }
    } catch (err) {
        showToast('Error occurred while registering patient. Check details and try again.', 'danger');
    }
}

async function editPatient(id) {
    const patient = patientsCache.find(p => p.id === id);
    if (!patient) return;

    document.getElementById('patient-id').value = patient.id;
    document.getElementById('patient-name').value = patient.name;
    document.getElementById('patient-age').value = patient.age;
    document.getElementById('patient-gender').value = patient.gender;
    document.getElementById('patient-contact').value = patient.contactNumber;
    document.getElementById('patient-email').value = patient.email || '';
    document.getElementById('patient-address').value = patient.address;
    document.getElementById('patient-history').value = patient.medicalHistory || '';

    document.getElementById('patient-modal-title').textContent = 'Update Patient Details';
    openModal('patient-modal');
}

async function deletePatient(id) {
    if (!confirm('Are you sure you want to delete this patient? All associated records may be affected.')) return;

    try {
        const res = await fetch(`${API_PATIENTS}/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Patient record deleted successfully.', 'success');
            if (window.addNotification) window.addNotification('danger', 'ri-user-unfollow-line', `A patient record was deleted`);
            await refreshCaches();
            loadPatients();
        } else {
            throw new Error('Failed delete');
        }
    } catch (err) {
        showToast('Error deleting patient. They might have active appointments.', 'danger');
    }
}

// --- DOCTOR MODULE ---
async function loadDoctors() {
    const grid = document.getElementById('doctors-grid-container');
    grid.innerHTML = '<p class="text-center" style="grid-column: 1/-1;">Loading medical staff list...</p>';

    try {
        const res = await fetch(API_DOCTORS);
        if (!res.ok) throw new Error('API Error');
        const doctors = await res.json();
        doctorsCache = doctors; // Sync cache
        renderDoctorsGrid(doctors);
    } catch (err) {
        grid.innerHTML = '<p class="text-center text-danger" style="grid-column: 1/-1;">Error loading medical staff records.</p>';
    }
}

function renderDoctorsGrid(doctors) {
    const grid = document.getElementById('doctors-grid-container');
    grid.innerHTML = '';

    if (doctors.length === 0) {
        grid.innerHTML = '<p class="text-center text-muted" style="grid-column: 1/-1;">No doctors added.</p>';
        return;
    }

    doctors.forEach(d => {
        let photoUrl = '';
        if (d.photoBase64) {
            photoUrl = d.photoBase64;
        } else {
            const nameLower = d.name.toLowerCase();
            if (nameLower.includes('sarah')) {
                photoUrl = 'dr-sarah.png';
            } else if (nameLower.includes('robert')) {
                photoUrl = 'dr-robert.png';
            } else if (nameLower.includes('emily')) {
                photoUrl = 'dr-emily.png';
            } else if (nameLower.includes('james')) {
                photoUrl = 'dr-james.png';
            }
        }

        const card = `
            <div class="doctor-card" data-id="${d.id}">
                <div class="doctor-card-header" style="border-bottom: 1px solid var(--border-color);">
                    ${photoUrl ? `<div class="doctor-photo-frame" style="width: 120px; height: 145px; border-radius: var(--radius-md); overflow: hidden; border: 2.5px solid rgba(255, 255, 255, 0.15); margin: 0 auto 0.75rem; box-shadow: var(--shadow-sm);"><img src="${photoUrl}" alt="${d.name}" style="width: 100%; height: 100%; object-fit: cover;"></div>` : `<div class="doctor-photo-frame" style="width: 120px; height: 145px; border-radius: var(--radius-md); overflow: hidden; border: 2.5px solid rgba(255, 255, 255, 0.15); margin: 0 auto 0.75rem; box-shadow: var(--shadow-sm); display: flex; align-items: center; justify-content: center; background-color: rgba(0,0,0,0.05);"><i class="ri-user-line" style="font-size: 4rem; color: var(--text-muted);"></i></div>`}
                    <h4>${d.name}</h4>
                    <span>${d.specialization}</span>
                </div>
                <div class="doctor-card-body">
                    <div class="doctor-info-item">
                        <i class="ri-heart-2-line"></i>
                        <span>Department: <strong>${d.department}</strong></span>
                    </div>
                    <div class="doctor-info-item">
                        <i class="ri-phone-line"></i>
                        <span>${d.contactNumber}</span>
                    </div>
                    <div class="doctor-info-item">
                        <i class="ri-mail-line"></i>
                        <span>${d.email}</span>
                    </div>
                    <div class="doctor-info-item">
                        <i class="ri-time-line"></i>
                        <span>${d.availability}</span>
                    </div>
                    
                    <div class="doctor-card-actions">
                        <button class="btn btn-outline btn-sm" onclick="editDoctor(${d.id})">
                            <i class="ri-edit-line"></i> Edit
                        </button>
                        <button class="btn-icon btn-icon-delete" onclick="deleteDoctor(${d.id})" title="Delete Staff Record">
                            <i class="ri-delete-bin-line"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        grid.insertAdjacentHTML('beforeend', card);
    });
}

function filterDoctorsGrid() {
    const query = document.getElementById('doctor-search-input').value.toLowerCase();
    const filtered = doctorsCache.filter(d => 
        d.name.toLowerCase().includes(query) ||
        d.specialization.toLowerCase().includes(query) ||
        d.department.toLowerCase().includes(query)
    );
    renderDoctorsGrid(filtered);
}

async function saveDoctor(e) {
    e.preventDefault();

    const id = document.getElementById('doctor-id').value;
    const fileInput = document.getElementById('doctor-photo');
    let photoBase64 = null;
    if (fileInput.files.length > 0) {
        photoBase64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(fileInput.files[0]);
        });
    }

    const doctorData = {
        name: document.getElementById('doctor-name').value,
        specialization: document.getElementById('doctor-specialization').value,
        department: document.getElementById('doctor-department').value,
        contactNumber: document.getElementById('doctor-contact').value,
        email: document.getElementById('doctor-email').value,
        availability: document.getElementById('doctor-availability').value,
        gender: document.getElementById('doctor-gender').value
    };

    if (photoBase64) {
        doctorData.photoBase64 = photoBase64;
    }

    const isEdit = !!id;
    const url = isEdit ? `${API_DOCTORS}/${id}` : API_DOCTORS;
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(doctorData)
        });

        if (res.ok) {
            const actionText = isEdit ? 'updated' : 'added';
            showToast(`Doctor profile ${actionText} successfully!`, 'success');
            if (window.addNotification) {
                window.addNotification('success', 'ri-user-add-line', `Doctor ${doctorData.name} was ${actionText}`);
            }
            closeModal('doctor-modal');
            await refreshCaches();
            loadDoctors();
        } else {
            throw new Error('Failed to save');
        }
    } catch (err) {
        showToast('Error saving doctor profile. Please verify data.', 'danger');
    }
}

async function editDoctor(id) {
    const doctor = doctorsCache.find(d => d.id === id);
    if (!doctor) return;

    document.getElementById('doctor-id').value = doctor.id;
    document.getElementById('doctor-name').value = doctor.name;
    document.getElementById('doctor-specialization').value = doctor.specialization;
    document.getElementById('doctor-department').value = doctor.department;
    document.getElementById('doctor-contact').value = doctor.contactNumber;
    document.getElementById('doctor-email').value = doctor.email;
    document.getElementById('doctor-availability').value = doctor.availability;
    document.getElementById('doctor-gender').value = doctor.gender || 'male';
    document.getElementById('doctor-photo').value = ''; // Reset file input when editing

    document.getElementById('doctor-modal-title').textContent = 'Update Doctor Profile';
    openModal('doctor-modal');
}

async function deleteDoctor(id) {
    if (!confirm('Are you sure you want to remove this doctor from records?')) return;

    try {
        const res = await fetch(`${API_DOCTORS}/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Doctor deleted successfully.', 'success');
            if (window.addNotification) {
                window.addNotification('danger', 'ri-user-unfollow-line', `A doctor profile was deleted`);
            }
            await refreshCaches();
            loadDoctors();
        } else {
            throw new Error('Failed delete');
        }
    } catch (err) {
        showToast('Failed to delete doctor. They may have outstanding appointments.', 'danger');
    }
}

// --- APPOINTMENT MODULE ---
async function loadAppointments() {
    const tbody = document.getElementById('appointments-tbody');
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">Loading appointments list...</td></tr>';

    try {
        const res = await fetch(API_APPOINTMENTS);
        if (!res.ok) throw new Error('API error');
        let appointments = await res.json();

        // Apply tab filters (ALL, SCHEDULED, COMPLETED, CANCELLED)
        if (currentFilter !== 'ALL') {
            appointments = appointments.filter(a => a.status === currentFilter);
        }

        // Apply text search filter
        const searchQuery = document.getElementById('appointment-search-input').value.toLowerCase().trim();
        if (searchQuery) {
            appointments = appointments.filter(a => {
                const patientName = a.patient ? a.patient.name.toLowerCase() : '';
                const doctorName = a.doctor ? a.doctor.name.toLowerCase() : '';
                const symptoms = a.symptoms ? a.symptoms.toLowerCase() : '';
                return patientName.includes(searchQuery) || doctorName.includes(searchQuery) || symptoms.includes(searchQuery);
            });
        }

        // Apply date filter
        const dateQuery = document.getElementById('appointment-date-filter').value;
        if (dateQuery) {
            appointments = appointments.filter(a => {
                if (!a.appointmentDate) return false;
                return a.appointmentDate.startsWith(dateQuery);
            });
        }

        renderAppointmentsTable(appointments);
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error loading appointments database.</td></tr>';
    }
}

function clearAppointmentFilters() {
    document.getElementById('appointment-search-input').value = '';
    document.getElementById('appointment-date-filter').value = '';
    loadAppointments();
}

function triggerHeaderDatePicker() {
    const picker = document.getElementById('header-date-picker');
    if (picker) {
        if (typeof picker.showPicker === 'function') {
            picker.showPicker();
        } else {
            picker.click();
        }
    }
}

function renderAppointmentsTable(appointments) {
    const tbody = document.getElementById('appointments-tbody');
    tbody.innerHTML = '';

    if (appointments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No appointments found matching this status.</td></tr>';
        return;
    }

    // Sort by date descending
    appointments.sort((a,b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));

    appointments.forEach(app => {
        const formattedDate = formatDateTime(app.appointmentDate);
        const badgeClass = app.status === 'SCHEDULED' ? 'badge-warning' : (app.status === 'COMPLETED' ? 'badge-success' : 'badge-danger');
        
        let actionButtons = '';
        if (app.status === 'SCHEDULED') {
            actionButtons = `
                <button class="btn-icon btn-icon-success" onclick="updateAppointmentStatus(${app.id}, 'COMPLETED')" title="Mark as Completed">
                    <i class="ri-checkbox-circle-line"></i>
                </button>
                <button class="btn-icon btn-icon-delete" onclick="updateAppointmentStatus(${app.id}, 'CANCELLED')" title="Cancel Appointment">
                    <i class="ri-close-circle-line"></i>
                </button>
            `;
        } else {
            actionButtons = `
                <button class="btn-icon btn-icon-delete" onclick="deleteAppointment(${app.id})" title="Delete Log Entry">
                    <i class="ri-delete-bin-line"></i>
                </button>
            `;
        }

        const tr = `
            <tr>
                <td>#${app.id}</td>
                <td><strong>${app.patient ? app.patient.name : 'Unknown'}</strong></td>
                <td>${app.doctor ? app.doctor.name : 'Unknown'}</td>
                <td>${formattedDate}</td>
                <td>${app.symptoms}</td>
                <td><span class="badge ${badgeClass}">${app.status}</span></td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        ${actionButtons}
                    </div>
                </td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', tr);
    });
}

async function saveAppointment(e) {
    e.preventDefault();

    const patientId = document.getElementById('appointment-patient').value;
    const doctorId = document.getElementById('appointment-doctor').value;
    const dateVal = document.getElementById('appointment-datetime').value;
    const symptomsVal = document.getElementById('appointment-symptoms').value;

    if (!patientId || !doctorId || !dateVal) {
        showToast('Please fill out all required fields.', 'warning');
        return;
    }

    const appData = {
        patient: { id: parseInt(patientId) },
        doctor: { id: parseInt(doctorId) },
        appointmentDate: dateVal.length === 16 ? dateVal + ':00' : dateVal,
        status: 'SCHEDULED',
        symptoms: symptomsVal
    };

    try {
        const res = await fetch(API_APPOINTMENTS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appData)
        });

        if (res.ok) {
            showToast('Consultation appointment booked successfully!', 'success');
            if (window.addNotification) window.addNotification('success', 'ri-calendar-check-line', `New appointment booked`);
            closeModal('appointment-modal');
            loadAppointments();
        } else {
            throw new Error('Failed save');
        }
    } catch (err) {
        showToast('Failed to schedule appointment. Please check details.', 'danger');
    }
}

async function updateAppointmentStatus(id, newStatus) {
    try {
        // Fetch current appointment object
        const getRes = await fetch(`${API_APPOINTMENTS}/${id}`);
        if (!getRes.ok) throw new Error('Fetch failed');
        const appointment = await getRes.json();

        // Update status field
        appointment.status = newStatus;

        // PUT request back to API
        const putRes = await fetch(`${API_APPOINTMENTS}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appointment)
        });

        if (putRes.ok) {
            showToast(`Appointment status updated to ${newStatus}.`, 'success');
            if (window.addNotification) window.addNotification('warning', 'ri-calendar-event-line', `Appointment status changed to ${newStatus}`);
            loadAppointments();
        } else {
            throw new Error('Update failed');
        }
    } catch (err) {
        showToast('Failed to update status.', 'danger');
    }
}

async function deleteAppointment(id) {
    if (!confirm('Are you sure you want to permanently delete this appointment log?')) return;

    try {
        const res = await fetch(`${API_APPOINTMENTS}/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Appointment entry deleted.', 'success');
            if (window.addNotification) window.addNotification('danger', 'ri-calendar-close-line', `Appointment deleted`);
            loadAppointments();
        } else {
            throw new Error();
        }
    } catch (err) {
        showToast('Failed to delete appointment log.', 'danger');
    }
}

// --- BILLING MODULE ---
async function loadBilling() {
    const tbody = document.getElementById('billing-tbody');
    tbody.innerHTML = '<tr><td colspan="10" class="text-center">Loading invoices database...</td></tr>';

    try {
        const res = await fetch(API_BILLS);
        if (!res.ok) throw new Error('API error');
        const bills = await res.json();
        renderBillingTable(bills);
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="10" class="text-center text-danger">Error loading invoices database.</td></tr>';
    }
}

function renderBillingTable(bills) {
    const tbody = document.getElementById('billing-tbody');
    tbody.innerHTML = '';

    if (bills.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="text-center text-muted">No invoices generated.</td></tr>';
        return;
    }

    // Sort billingDate descending
    bills.sort((a,b) => new Date(b.billingDate) - new Date(a.billingDate));

    bills.forEach(bill => {
        const formattedDate = formatDate(bill.billingDate);
        const isPaid = bill.status === 'PAID';
        const badgeClass = isPaid ? 'badge-success' : 'badge-warning';

        // Payment info render
        let paymentInfo = '<span class="text-muted">Pending Payment</span>';
        if (isPaid) {
            paymentInfo = `
                <div style="font-size: 0.8rem; line-height: 1.3;">
                    <span>Method: <strong>${bill.paymentMethod || 'N/A'}</strong></span><br/>
                    <span>Ref: <strong style="font-family: monospace;">${bill.transactionId || 'N/A'}</strong></span><br/>
                    <span>Date: <strong>${bill.paymentDate || 'N/A'}</strong></span>
                </div>
            `;
        }

        // Action Buttons
        let actionButtons = '';
        if (!isPaid) {
            actionButtons = `
                <button class="btn btn-primary btn-sm" onclick="openPayInvoiceModal(${bill.id})" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">
                    <i class="ri-wallet-3-line"></i> Pay Now
                </button>
            `;
        } else {
            actionButtons = `
                <button class="btn btn-outline btn-sm" onclick="printInvoiceReceipt(${bill.id})" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; border-color: var(--primary); color: var(--primary);">
                    <i class="ri-download-cloud-line"></i> Receipt
                </button>
            `;
        }

        const tr = `
            <tr data-patient-name="${bill.patient ? bill.patient.name.toLowerCase() : ''}">
                <td>#INV-${bill.id}</td>
                <td><strong>${bill.patient ? bill.patient.name : 'Unknown'}</strong></td>
                <td>${formattedDate}</td>
                <td>${bill.services}</td>
                <td>RS ${(bill.amount || 0).toFixed(2)}</td>
                <td>RS ${(bill.gstAmount || 0).toFixed(2)}</td>
                <td><strong>RS ${(bill.totalAmount || 0).toFixed(2)}</strong></td>
                <td><span class="badge ${badgeClass}">${bill.status}</span></td>
                <td>${paymentInfo}</td>
                <td>
                    <div style="display: flex; gap: 0.35rem; align-items: center;">
                        ${actionButtons}
                        <button class="btn-icon btn-icon-delete" onclick="deleteBill(${bill.id})" title="Delete Invoice" style="padding: 0.25rem;">
                            <i class="ri-delete-bin-line"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', tr);
    });
}

function filterBillingTable() {
    const query = document.getElementById('billing-search-input').value.toLowerCase();
    const rows = document.querySelectorAll('#billing-tbody tr');
    
    rows.forEach(row => {
        const patientName = row.getAttribute('data-patient-name') || '';
        if (patientName.includes(query)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

async function saveBill(e) {
    e.preventDefault();

    const patientId = document.getElementById('billing-patient').value;
    const amountVal = document.getElementById('billing-amount').value;
    const servicesVal = document.getElementById('billing-services').value;
    const statusVal = document.getElementById('billing-status').value;

    if (!patientId || !amountVal || !servicesVal) {
        showToast('Please fill out all required invoice fields.', 'warning');
        return;
    }

    // Today's date formatted to YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    const billData = {
        patient: { id: parseInt(patientId) },
        amount: parseFloat(amountVal),
        services: servicesVal,
        status: statusVal,
        billingDate: today
    };

    if (statusVal === 'PAID') {
        billData.paymentMethod = 'CASH';
        billData.transactionId = 'CSH-' + Math.floor(100000 + Math.random() * 900000);
        billData.paymentDate = today;
    }

    try {
        const res = await fetch(API_BILLS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(billData)
        });

        if (res.ok) {
            showToast('Billing invoice created!', 'success');
            if (window.addNotification) window.addNotification('success', 'ri-file-list-3-line', `New invoice created`);
            closeModal('billing-modal');
            loadBilling();
        } else {
            throw new Error();
        }
    } catch (err) {
        showToast('Failed to create invoice.', 'danger');
    }
}

function calculateFormGst() {
    const amountVal = parseFloat(document.getElementById('billing-amount').value) || 0;
    const gst = amountVal * 0.18;
    const total = amountVal + gst;

    document.getElementById('billing-gst-preview').value = `RS ${gst.toFixed(2)}`;
    document.getElementById('billing-total-preview').value = `RS ${total.toFixed(2)}`;
}

function togglePaymentFields() {
    const method = document.getElementById('payment-method-select').value;
    document.getElementById('payment-upi-view').style.display = method === 'UPI' ? 'flex' : 'none';
    document.getElementById('payment-card-view').style.display = method === 'CARD' ? 'flex' : 'none';
    document.getElementById('payment-cash-view').style.display = method === 'CASH' ? 'flex' : 'none';

    // Adjust required attributes
    document.getElementById('upi-txn-id').required = method === 'UPI';
    document.getElementById('card-number').required = method === 'CARD';
    document.getElementById('card-expiry').required = method === 'CARD';
    document.getElementById('card-cvv').required = method === 'CARD';
    document.getElementById('cash-receipt-no').required = method === 'CASH';
}

async function openPayInvoiceModal(billId) {
    try {
        const res = await fetch(`${API_BILLS}/${billId}`);
        if (!res.ok) throw new Error();
        const bill = await res.json();

        document.getElementById('pay-bill-id').value = bill.id;
        document.getElementById('pay-invoice-amount').textContent = `RS ${bill.totalAmount.toFixed(2)}`;
        document.getElementById('pay-invoice-gst-breakdown').textContent = `(Base: RS ${bill.amount.toFixed(2)} + GST: RS ${bill.gstAmount.toFixed(2)})`;
        
        // Reset form fields
        document.getElementById('payment-method-select').value = 'UPI';
        document.getElementById('upi-txn-id').value = '';
        document.getElementById('card-number').value = '';
        document.getElementById('card-expiry').value = '';
        document.getElementById('card-cvv').value = '';
        document.getElementById('cash-receipt-no').value = '';
        
        // Dynamically prefill amount in UPI QR code
        try {
            const amount = bill.totalAmount.toFixed(2);
            const upiLink = `upi://pay?pa=8767323603@ibl&pn=Thakre%20Hospital&am=${amount}&cu=INR`;
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}`;
            const upiQrImg = document.querySelector('#pay-invoice-modal #upi-qrcode img');
            if (upiQrImg) {
                upiQrImg.src = qrUrl;
            }
        } catch (qrErr) {
            console.error('Error generating dynamic QR code:', qrErr);
        }
        
        togglePaymentFields();
        openModal('pay-invoice-modal');
    } catch (err) {
        showToast('Failed to load invoice payment details.', 'danger');
    }
}

async function submitInvoicePayment(e) {
    e.preventDefault();
    const billId = document.getElementById('pay-bill-id').value;
    const method = document.getElementById('payment-method-select').value;
    
    let txnId = '';
    if (method === 'UPI') txnId = document.getElementById('upi-txn-id').value.trim();
    else if (method === 'CARD') txnId = 'CRD-' + Math.floor(100000 + Math.random() * 900000);
    else if (method === 'CASH') txnId = document.getElementById('cash-receipt-no').value.trim();

    try {
        // Fetch invoice first
        const getRes = await fetch(`${API_BILLS}/${billId}`);
        if (!getRes.ok) throw new Error();
        const bill = await getRes.json();

        bill.status = 'PAID';
        bill.paymentMethod = method;
        bill.transactionId = txnId;
        bill.paymentDate = new Date().toISOString().split('T')[0];

        const putRes = await fetch(`${API_BILLS}/${billId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bill)
        });

        if (putRes.ok) {
            showToast('Payment processed successfully! Receipt generated.', 'success');
            if (window.addNotification) window.addNotification('success', 'ri-money-dollar-circle-line', `Payment received`);
            closeModal('pay-invoice-modal');
            loadBilling();
            if (typeof loadAdminStats === 'function') loadAdminStats();
        } else {
            throw new Error();
        }
    } catch (err) {
        showToast('Failed to complete payment transaction.', 'danger');
    }
}

async function printInvoiceReceipt(billId) {
    try {
        const res = await fetch(`${API_BILLS}/${billId}`);
        if (!res.ok) throw new Error();
        const bill = await res.json();

        const printContainer = document.getElementById('receipt-print-template');
        printContainer.innerHTML = `
            <div class="invoice-print-header">
                <div class="invoice-print-logo">
                    <i class="ri-heart-pulse-fill"></i>
                    <div class="invoice-print-logo-text">
                        <h1>THAKRE HOSPITAL</h1>
                        <span>Multispeciality & MedCare</span>
                    </div>
                </div>
                <div class="invoice-print-title">
                    <h2>OFFICIAL RECEIPT</h2>
                    <p style="margin:0;font-size:0.85rem;color:#64748b;">Invoice ID: #${bill.id}</p>
                </div>
            </div>

            <div class="invoice-print-details-grid">
                <div class="invoice-print-block">
                    <h3>Hospital Details</h3>
                    <p><strong>Thakre Multispeciality Hospital</strong></p>
                    <p>Nagpur, Maharashtra, India</p>
                    <p>Phone: +91 712 000 0000</p>
                    <p>Email: billing@thakrehospital.in</p>
                </div>
                <div class="invoice-print-block">
                    <h3>Invoice Details</h3>
                    <p><strong>Patient Name:</strong> ${bill.patient.name}</p>
                    <p><strong>Patient ID:</strong> ${bill.patient.id}</p>
                    <p><strong>Billing Date:</strong> ${bill.billingDate}</p>
                    <p><strong>Payment Status:</strong> ${bill.status}</p>
                </div>
            </div>

            <table class="invoice-print-table">
                <thead>
                    <tr>
                        <th style="width: 70%;">Services Rendered / Description</th>
                        <th style="width: 30%; text-align: right;">Amount (RS)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>${bill.services}</td>
                        <td style="text-align: right;">RS ${bill.amount.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>

            <div class="invoice-print-summary">
                <table class="invoice-print-summary-table">
                    <tr>
                        <td>Base Amount:</td>
                        <td><strong>RS ${bill.amount.toFixed(2)}</strong></td>
                    </tr>
                    <tr>
                        <td>GST (18%):</td>
                        <td><strong>RS ${bill.gstAmount.toFixed(2)}</strong></td>
                    </tr>
                    <tr class="total-row">
                        <td>Grand Total:</td>
                        <td>RS ${bill.totalAmount.toFixed(2)}</td>
                    </tr>
                </table>
            </div>

            ${bill.status === 'PAID' ? `
            <div style="border: 1px solid #10b981; background-color: #ecfdf5; border-radius: 8px; padding: 1rem; margin-bottom: 3rem; color: #065f46;">
                <h4 style="margin: 0 0 0.5rem 0; font-size: 0.95rem;"><i class="ri-checkbox-circle-fill"></i> Transaction Verified</h4>
                <p style="margin: 0.25rem 0; font-size: 0.85rem;"><strong>Payment Method:</strong> ${bill.paymentMethod}</p>
                <p style="margin: 0.25rem 0; font-size: 0.85rem;"><strong>Transaction Reference ID:</strong> ${bill.transactionId}</p>
                <p style="margin: 0.25rem 0; font-size: 0.85rem;"><strong>Payment Date:</strong> ${bill.paymentDate}</p>
            </div>
            ` : ''}

            <div style="display: flex; justify-content: space-between; margin-top: 4rem;">
                <div style="text-align: center; width: 200px;">
                    <div style="border-bottom: 1px solid #000; height: 40px;"></div>
                    <p style="font-size: 0.8rem; margin-top: 0.5rem;">Patient / Depositor Signature</p>
                </div>
                <div style="text-align: center; width: 200px;">
                    <div style="border-bottom: 1px solid #000; height: 40px; display: flex; align-items: flex-end; justify-content: center; font-family: 'Outfit'; font-weight: 700; color: #0d9488; font-size: 0.9rem;">Thakre Accounts</div>
                    <p style="font-size: 0.8rem; margin-top: 0.5rem;">Authorized Signatory</p>
                </div>
            </div>

            <div class="invoice-print-footer" style="margin-top: 3rem;">
                <p>This is a computer-generated transaction invoice and receipt. No physical signature is mandatory.</p>
                <p>Thank you for choosing Thakre Multispeciality Hospital.</p>
            </div>
        `;

        // Trigger print
        window.print();
    } catch (err) {
        showToast('Failed to load print receipt templates.', 'danger');
    }
}

async function deleteBill(id) {
    if (!confirm('Are you sure you want to permanently delete this invoice record?')) return;

    try {
        const res = await fetch(`${API_BILLS}/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Invoice deleted.', 'success');
            if (window.addNotification) window.addNotification('danger', 'ri-delete-bin-line', `Invoice deleted`);
            loadBilling();
        } else {
            throw new Error();
        }
    } catch (err) {
        showToast('Failed to delete invoice.', 'danger');
    }
}

// --- BEDS MODULE ---
let currentBedFilter = 'ALL';

async function loadBeds() {
    const container = document.getElementById('beds-grid-container');
    container.innerHTML = '<div class="text-center" style="grid-column: 1/-1; padding: 3rem;">Loading room beds status...</div>';

    try {
        const res = await fetch(API_BEDS);
        if (!res.ok) throw new Error();
        let beds = await res.json();

        // Apply tab status filter
        if (currentBedFilter !== 'ALL') {
            beds = beds.filter(b => b.status === currentBedFilter);
        }

        // Apply search query filter
        const searchQuery = document.getElementById('bed-search-input').value.toLowerCase().trim();
        if (searchQuery) {
            beds = beds.filter(b => b.bedNumber.toLowerCase().includes(searchQuery) || b.roomType.toLowerCase().includes(searchQuery));
        }

        // Apply room type filter
        const roomTypeFilter = document.getElementById('bed-type-filter').value;
        if (roomTypeFilter !== 'ALL') {
            beds = beds.filter(b => b.roomType === roomTypeFilter);
        }

        renderBedsGrid(beds);
    } catch (err) {
        container.innerHTML = '<div class="text-center text-danger" style="grid-column: 1/-1; padding: 3rem;">Failed to load beds database.</div>';
    }
}

function renderBedsGrid(beds) {
    const container = document.getElementById('beds-grid-container');
    container.innerHTML = '';

    if (beds.length === 0) {
        container.innerHTML = '<div class="text-center text-muted" style="grid-column: 1/-1; padding: 3rem;">No rooms or beds registered.</div>';
        return;
    }

    // Sort beds by bedNumber
    beds.sort((a, b) => a.bedNumber.localeCompare(b.bedNumber));

    beds.forEach(bed => {
        const statusClass = bed.status.toLowerCase();
        let statusLabel = bed.status;
        if (bed.status === 'AVAILABLE') statusLabel = 'Available';
        if (bed.status === 'OCCUPIED') statusLabel = 'Occupied';
        if (bed.status === 'MAINTENANCE') statusLabel = 'Maintenance';

        let actionButtons = '';
        let patientHTML = '';

        if (bed.status === 'AVAILABLE') {
            actionButtons = `
                <button class="btn btn-outline btn-sm" onclick="openAssignBedModal(${bed.id}, '${bed.bedNumber}')" style="color: var(--primary); border-color: var(--primary);">
                    <i class="ri-user-add-line"></i> Assign Patient
                </button>
            `;
            patientHTML = `
                <div class="bed-patient-info" style="border: none; padding: 0;">
                    <p style="color: var(--success); font-weight: 700;"><i class="ri-checkbox-circle-fill"></i> Ready for Check-in</p>
                </div>
            `;
        } else if (bed.status === 'OCCUPIED') {
            actionButtons = `
                <button class="btn btn-primary btn-sm" onclick="openDischargeBedModal(${bed.id}, '${bed.patient ? bed.patient.name : 'Unknown'}')">
                    <i class="ri-logout-box-r-line"></i> Discharge & Bill
                </button>
            `;
            patientHTML = `
                <div class="bed-patient-info">
                    <h5>Occupant Patient</h5>
                    <p>${bed.patient ? bed.patient.name : 'Unknown Patient'} (ID: ${bed.patient ? bed.patient.id : 'N/A'})</p>
                    <span style="font-size: 0.8rem; color: var(--text-muted);"><i class="ri-phone-fill"></i> ${bed.patient ? bed.patient.contactNumber : 'N/A'}</span>
                </div>
            `;
        } else if (bed.status === 'MAINTENANCE') {
            actionButtons = `
                <button class="btn btn-outline btn-sm" onclick="setBedAvailable(${bed.id})" style="color: var(--success); border-color: var(--success);">
                    <i class="ri-check-line"></i> Complete Maintenance
                </button>
            `;
            patientHTML = `
                <div class="bed-patient-info" style="border: none; padding: 0;">
                    <p style="color: var(--warning); font-weight: 700;"><i class="ri-tools-fill"></i> Sanitizing & Servicing</p>
                </div>
            `;
        }

        const card = `
            <div class="bed-card">
                <div class="bed-card-header ${statusClass}">
                    <h4>Bed ${bed.bedNumber}</h4>
                    <span>${statusLabel}</span>
                </div>
                <div class="bed-card-body">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span class="badge" style="background-color: var(--bg-main); color: var(--secondary);">${bed.roomType}</span>
                        <div class="bed-price-tag">RS ${bed.pricePerDay.toFixed(0)}/day</div>
                    </div>
                    ${patientHTML}
                    <div class="bed-card-actions">
                        ${actionButtons}
                        <button class="btn-icon btn-icon-edit" onclick="openEditBedModal(${bed.id})" title="Edit Bed Settings">
                            <i class="ri-edit-line"></i>
                        </button>
                        <button class="btn-icon btn-icon-delete" onclick="deleteBed(${bed.id})" title="Delete Bed">
                            <i class="ri-delete-bin-line"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', card);
    });
}

function openAssignBedModal(bedId, bedNumber) {
    document.getElementById('assign-bed-id').value = bedId;
    document.getElementById('assign-bed-display-number').value = bedNumber;
    document.getElementById('assign-bed-patient').selectedIndex = 0;
    openModal('assign-bed-modal');
}

async function saveBedAssignment(e) {
    e.preventDefault();
    const bedId = document.getElementById('assign-bed-id').value;
    const patientId = document.getElementById('assign-bed-patient').value;

    if (!patientId) {
        showToast('Please select a patient to assign.', 'warning');
        return;
    }

    try {
        const res = await fetch(`${API_BEDS}/${bedId}/assign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ patientId: parseInt(patientId) })
        });

        if (res.ok) {
            showToast('Patient checked in and bed assigned successfully!', 'success');
            if (window.addNotification) window.addNotification('success', 'ri-hotel-bed-line', `Bed assigned to patient`);
            closeModal('assign-bed-modal');
            loadBeds();
        } else {
            throw new Error();
        }
    } catch (err) {
        showToast('Failed to assign bed.', 'danger');
    }
}

function openDischargeBedModal(bedId, patientName) {
    document.getElementById('discharge-bed-id').value = bedId;
    document.getElementById('discharge-bed-patient-name').value = patientName;
    document.getElementById('discharge-bed-days').value = 1;
    openModal('discharge-bed-modal');
}

async function saveBedDischarge(e) {
    e.preventDefault();
    const bedId = document.getElementById('discharge-bed-id').value;
    const days = document.getElementById('discharge-bed-days').value;

    if (!days || parseInt(days) <= 0) {
        showToast('Please enter a valid number of stay days.', 'warning');
        return;
    }

    try {
        const res = await fetch(`${API_BEDS}/${bedId}/discharge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ days: parseInt(days) })
        });

        if (res.ok) {
            const data = await res.json();
            showToast(`Patient discharged! Generated Bed Charge Invoice for RS ${data.totalAmount.toFixed(2)}.`, 'success');
            if (window.addNotification) window.addNotification('success', 'ri-walk-line', `Patient discharged from bed`);
            closeModal('discharge-bed-modal');
            loadBeds();
        } else {
            throw new Error();
        }
    } catch (err) {
        showToast('Failed to complete discharge operation.', 'danger');
    }
}

async function setBedAvailable(id) {
    try {
        // Fetch current bed
        const getRes = await fetch(`${API_BEDS}/${id}`);
        if (!getRes.ok) throw new Error();
        const bed = await getRes.json();

        bed.status = 'AVAILABLE';
        bed.patient = null;

        const putRes = await fetch(`${API_BEDS}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bed)
        });

        if (putRes.ok) {
            showToast('Bed set to Available status.', 'success');
            loadBeds();
        } else {
            throw new Error();
        }
    } catch (err) {
        showToast('Failed to update bed status.', 'danger');
    }
}

async function deleteBed(id) {
    if (!confirm('Are you sure you want to delete this room/bed configuration from the registry?')) return;

    try {
        const res = await fetch(`${API_BEDS}/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Room/Bed deleted successfully.', 'success');
            if (window.addNotification) window.addNotification('danger', 'ri-delete-bin-line', `Room/bed deleted`);
            loadBeds();
        } else {
            throw new Error();
        }
    } catch (err) {
        showToast('Failed to delete bed.', 'danger');
    }
}

async function saveBed(e) {
    e.preventDefault();

    const id = document.getElementById('bed-id').value;
    const number = document.getElementById('bed-number').value.trim();
    const type = document.getElementById('bed-room-type').value;
    const price = document.getElementById('bed-price').value;
    const status = document.getElementById('bed-status').value;

    if (!number || !price) {
        showToast('Please fill all required room/bed fields.', 'warning');
        return;
    }

    const bedData = {
        bedNumber: number,
        roomType: type,
        pricePerDay: parseFloat(price),
        status: status
    };

    const isEdit = id !== '';
    const url = isEdit ? `${API_BEDS}/${id}` : API_BEDS;
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bedData)
        });

        if (res.ok) {
            showToast(isEdit ? 'Room/Bed configurations updated!' : 'New Bed registered in ward.', 'success');
            if (window.addNotification) window.addNotification('success', 'ri-hotel-bed-fill', isEdit ? `Bed configuration updated` : `New bed registered`);
            closeModal('bed-modal');
            loadBeds();
        } else {
            throw new Error();
        }
    } catch (err) {
        showToast('Failed to save bed settings.', 'danger');
    }
}

async function openEditBedModal(id) {
    try {
        const res = await fetch(`${API_BEDS}/${id}`);
        if (!res.ok) throw new Error();
        const bed = await res.json();

        document.getElementById('bed-id').value = bed.id;
        document.getElementById('bed-number').value = bed.bedNumber;
        document.getElementById('bed-room-type').value = bed.roomType;
        document.getElementById('bed-price').value = bed.pricePerDay;
        document.getElementById('bed-status').value = bed.status === 'OCCUPIED' ? 'AVAILABLE' : bed.status;

        document.getElementById('bed-modal-title').textContent = 'Modify Room/Bed Settings';
        openModal('bed-modal');
    } catch (err) {
        showToast('Error loading bed details.', 'danger');
    }
}

// --- ADMIN PANEL FUNCTIONS ---
const API_ADMIN_STATS = '/api/admin/stats';
const API_ADMIN_RESET = '/api/admin/reset';
const API_ADMIN_CLEAR = '/api/admin/clear';

async function loadAdminStats() {
    try {
        const res = await fetch(API_ADMIN_STATS);
        if (!res.ok) throw new Error();
        const stats = await res.json();

        document.getElementById('admin-db-type').textContent = stats.dbType || 'H2 SQL';
        document.getElementById('admin-db-status').textContent = stats.status || 'Connected';
        document.getElementById('admin-stats-patients').textContent = stats.patientsCount;
        document.getElementById('admin-stats-doctors').textContent = stats.doctorsCount;
        document.getElementById('admin-stats-appointments').textContent = stats.appointmentsCount;
        document.getElementById('admin-stats-bills').textContent = stats.billsCount;
        document.getElementById('admin-stats-beds').textContent = stats.bedsCount || 0;
    } catch (err) {
        showToast('Failed to load database diagnostics.', 'danger');
    }
}

async function resetDatabaseSeed() {
    if (!confirm('Are you sure you want to RESET the database? All current edits will be overwritten with initial seed data.')) return;

    try {
        const res = await fetch(API_ADMIN_RESET, { method: 'POST' });
        if (res.ok) {
            showToast('Database reset to seed data successfully!', 'success');
            await refreshCaches();
            loadAdminStats();
        } else {
            throw new Error();
        }
    } catch (err) {
        showToast('Error resetting database.', 'danger');
    }
}

async function clearDatabaseData() {
    if (!confirm('WARNING: Are you sure you want to CLEAR ALL database records? This action is permanent.')) return;

    try {
        const res = await fetch(API_ADMIN_CLEAR, { method: 'POST' });
        if (res.ok) {
            showToast('All database records cleared.', 'warning');
            await refreshCaches();
            loadAdminStats();
        } else {
            throw new Error();
        }
    } catch (err) {
        showToast('Failed to clear database.', 'danger');
    }
}

// --- GLOBAL SEARCH ---
function handleGlobalSearch() {
    const query = document.getElementById('global-search').value.toLowerCase().trim();
    if (!query) return;

    // We search the currently loaded view elements
    const activeTab = document.querySelector('.nav-item.active').getAttribute('data-tab');

    if (activeTab === 'patients') {
        document.getElementById('patient-search-input').value = query;
        filterPatientsTable();
    } else if (activeTab === 'doctors') {
        document.getElementById('doctor-search-input').value = query;
        filterDoctorsGrid();
    } else if (activeTab === 'billing') {
        document.getElementById('billing-search-input').value = query;
        filterBillingTable();
    } else if (activeTab === 'dashboard') {
        // Search patient name matches in recent appointments
        const rows = document.querySelectorAll('#recent-appointments-tbody tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(query) ? '' : 'none';
        });
    }
}

// --- UTILITIES ---

// Format LocalDateTime (e.g. 2026-07-02T10:00:00) to human readable (July 2, 2026, 10:00 AM)
function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return '';
    const date = new Date(dateTimeStr);
    
    // Format Date part
    const datePart = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    // Format Time part
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;
    const timePart = hours + ':' + minutes + ' ' + ampm;

    return `${datePart} - ${timePart}`;
}

// Format LocalDate (e.g. 2026-07-02) to human readable (July 2, 2026)
function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00'); // Prevent timezone shift issues
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Modal open/close actions
window.openModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    // If it's the Patient or Doctor modal, reset its title & fields (just in case they were in Edit mode)
    if (modalId === 'patient-modal') {
        document.getElementById('patient-form').reset();
        document.getElementById('patient-id').value = '';
        document.getElementById('patient-modal-title').textContent = 'Register New Patient';
    } else if (modalId === 'doctor-modal') {
        document.getElementById('doctor-form').reset();
        document.getElementById('doctor-id').value = '';
        document.getElementById('doctor-modal-title').textContent = 'Add New Doctor';
    } else if (modalId === 'appointment-modal') {
        document.getElementById('appointment-form').reset();
    } else if (modalId === 'billing-modal') {
        document.getElementById('billing-form').reset();
    }
    
    modal.classList.add('active');
};

window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
};

// Custom animated toast alerts
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    
    // Determine icon based on toast type
    const iconClass = type === 'success' ? 'ri-checkbox-circle-fill' : 
                      (type === 'warning' ? 'ri-alert-fill' : 'ri-error-warning-fill');

    const toastHTML = `
        <div class="toast toast-${type}">
            <div class="toast-icon"><i class="${iconClass}"></i></div>
            <div class="toast-message">${message}</div>
            <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', toastHTML);
    const toastElement = container.lastElementChild;

    // Auto dismiss after 4 seconds
    setTimeout(() => {
        toastElement.style.opacity = '0';
        toastElement.style.transform = 'translateY(10px)';
        setTimeout(() => toastElement.remove(), 300);
    }, 4000);
}

// Attach interactive functions to window scope for inline HTML onclick handlers
window.deletePatient = deletePatient;
window.editPatient = editPatient;
window.deleteDoctor = deleteDoctor;
window.editDoctor = editDoctor;
window.deleteAppointment = deleteAppointment;
window.updateAppointmentStatus = updateAppointmentStatus;
window.deleteBill = deleteBill;
window.resetDatabaseSeed = resetDatabaseSeed;
window.clearDatabaseData = clearDatabaseData;
window.clearAppointmentFilters = clearAppointmentFilters;
window.triggerHeaderDatePicker = triggerHeaderDatePicker;
window.loadBeds = loadBeds;
window.openAssignBedModal = openAssignBedModal;
window.saveBedAssignment = saveBedAssignment;
window.openDischargeBedModal = openDischargeBedModal;
window.saveBedDischarge = saveBedDischarge;
window.setBedAvailable = setBedAvailable;
window.deleteBed = deleteBed;
window.saveBed = saveBed;
window.openEditBedModal = openEditBedModal;
window.calculateFormGst = calculateFormGst;
window.togglePaymentFields = togglePaymentFields;
window.openPayInvoiceModal = openPayInvoiceModal;
window.submitInvoicePayment = submitInvoicePayment;
window.printInvoiceReceipt = printInvoiceReceipt;


// ----------------------------------------------------------
// NEW FEATURES JS (PHASES 2-4)
// ----------------------------------------------------------

const API_STAFF = '/api/staff';
const API_LAB = '/api/labtests';
const API_DEPT = '/api/departments';
const API_FEEDBACK = '/api/feedback';
const API_ATTENDANCE = '/api/attendance';

// 1. Dark Mode
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.innerHTML = savedTheme === 'dark' ? '<i class="ri-sun-line"></i>' : '<i class="ri-moon-line"></i>';
    
    themeToggle.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const newTheme = isDark ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeToggle.innerHTML = newTheme === 'dark' ? '<i class="ri-sun-line"></i>' : '<i class="ri-moon-line"></i>';
    });
}

// 2. Notification Bell
const notifBell = document.getElementById('notif-bell');
const notifPanel = document.getElementById('notif-panel');
if (notifBell) {
    notifBell.addEventListener('click', (e) => {
        e.stopPropagation();
        notifPanel.classList.toggle('open');
        document.getElementById('global-search-results').classList.remove('open');
    });
    document.addEventListener('click', () => notifPanel.classList.remove('open'));
    notifPanel.addEventListener('click', e => e.stopPropagation());
    
    // Notifications System
    window.appNotifications = [
        { type: 'success', icon: 'ri-check-double-line', text: 'New appointment booked for Dr. Jenkins', time: '5 mins ago' },
        { type: 'warning', icon: 'ri-flask-line', text: 'Lab results ready for John Doe', time: '1 hour ago' },
        { type: 'danger', icon: 'ri-hotel-bed-line', text: 'ICU Bed 201 occupied', time: '2 hours ago' }
    ];
    
    window.renderNotifications = () => {
        const unreadCount = window.appNotifications.filter(n => !n.read).length;
        document.getElementById('notif-count').textContent = unreadCount;
        document.getElementById('notif-count').style.display = unreadCount > 0 ? 'flex' : 'none';
        document.getElementById('notif-list').innerHTML = window.appNotifications.map(n => `
            <div class="notif-item ${n.read ? '' : 'unread'}">
                <div class="notif-icon ${n.type}"><i class="${n.icon}"></i></div>
                <div class="notif-content"><p>${n.text}</p><span>${n.time}</span></div>
            </div>
        `).join('');
    };

    window.addNotification = (type, icon, text) => {
        window.appNotifications.unshift({ type, icon, text, time: 'Just now', read: false });
        if (window.appNotifications.length > 10) window.appNotifications.pop(); // Keep max 10
        window.renderNotifications();
    };

    window.renderNotifications();
}
window.markAllNotifRead = () => {
    window.appNotifications.forEach(n => n.read = true);
    window.renderNotifications();
};

// 3. Global Search
const globalSearch = document.getElementById('global-search');
const searchResults = document.getElementById('global-search-results');
if (globalSearch) {
    globalSearch.addEventListener('input', async (e) => {
        const query = e.target.value.trim().toLowerCase();
        if (query.length < 2) { searchResults.classList.remove('open'); return; }
        
        let resultsHtml = '';
        try {
            // Search Patients
            const pRes = await fetch(API_PATIENTS); const patients = await pRes.json();
            const filteredP = patients.filter(p => p.name.toLowerCase().includes(query) || p.contactNumber.includes(query));
            if (filteredP.length) {
                resultsHtml += '<div class="search-result-category">Patients</div>';
                resultsHtml += filteredP.map(p => `<div class="search-result-item" onclick="showView('patients')"><i class="ri-user-line"></i> ${p.name} (${p.contactNumber})</div>`).join('');
            }
            
            // Search Doctors
            const dRes = await fetch(API_DOCTORS); const doctors = await dRes.json();
            const filteredD = doctors.filter(d => d.name.toLowerCase().includes(query) || d.specialization.toLowerCase().includes(query));
            if (filteredD.length) {
                resultsHtml += '<div class="search-result-category">Doctors</div>';
                resultsHtml += filteredD.map(d => `<div class="search-result-item" onclick="showView('doctors')"><i class="ri-nurse-line"></i> ${d.name} (${d.specialization})</div>`).join('');
            }
            
            if (!resultsHtml) resultsHtml = '<div class="search-result-item">No results found</div>';
            searchResults.innerHTML = resultsHtml;
            searchResults.classList.add('open');
            notifPanel.classList.remove('open');
        } catch(e) {}
    });
    document.addEventListener('click', () => searchResults.classList.remove('open'));
    searchResults.addEventListener('click', e => e.stopPropagation());
    globalSearch.addEventListener('click', e => { e.stopPropagation(); if(globalSearch.value.trim().length >= 2) searchResults.classList.add('open'); });
}

// 4. Staff Management
async function loadStaff(roleFilter = 'ALL') {
    try {
        let url = API_STAFF;
        if (roleFilter !== 'ALL') url += `?role=${roleFilter}`;
        const res = await fetch(url);
        const staff = await res.json();
        
        const tbody = document.getElementById('staff-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        
        staff.forEach(s => {
            const roleClass = s.role === 'NURSE' ? 'nurse' : s.role === 'RECEPTIONIST' ? 'receptionist' : 'admin';
            const shiftClass = s.shift === 'MORNING' ? 'morning' : s.shift === 'EVENING' ? 'evening' : 'night';
            const statusClass = s.status === 'ACTIVE' ? 'badge-success' : s.status === 'ON_LEAVE' ? 'badge-warning' : 'badge-danger';
            
            tbody.innerHTML += `
                <tr>
                    <td style="font-weight:600">${s.name}</td>
                    <td><span class="role-badge ${roleClass}">${s.role}</span></td>
                    <td>${s.department}</td>
                    <td>${s.phone || '-'}</td>
                    <td><span class="shift-badge ${shiftClass}"><i class="ri-time-line"></i> ${s.shift}</span></td>
                    <td class="salary-highlight">RS ${s.salary || 0}</td>
                    <td><span class="badge ${statusClass}">${s.status}</span></td>
                    <td>
                        <button class="btn-icon" title="Edit" onclick="editStaff(${s.id})"><i class="ri-edit-line"></i></button>
                        <button class="btn-icon text-danger" title="Delete" onclick="deleteStaff(${s.id})"><i class="ri-delete-bin-line"></i></button>
                    </td>
                </tr>
            `;
        });
    } catch (err) { console.error('Failed to load staff'); }
}
document.querySelectorAll('.staff-sub-tab').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.staff-sub-tab').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const role = e.target.getAttribute('data-role');
        
        const staffContainer = document.getElementById('staff-directory-container');
        const attendanceContainer = document.getElementById('staff-attendance-container');
        const btnAddStaff = document.getElementById('btn-add-staff');
        const btnExportStaff = document.getElementById('btn-export-staff-excel');
        const btnAddAttendance = document.getElementById('btn-add-attendance');
        
        if (role === 'ATTENDANCE') {
            if (staffContainer) staffContainer.style.display = 'none';
            if (attendanceContainer) attendanceContainer.style.display = 'block';
            if (btnAddStaff) btnAddStaff.style.display = 'none';
            if (btnExportStaff) btnExportStaff.style.display = 'none';
            if (btnAddAttendance) btnAddAttendance.style.display = 'block';
            loadAttendance();
        } else {
            if (staffContainer) staffContainer.style.display = 'block';
            if (attendanceContainer) attendanceContainer.style.display = 'none';
            if (btnAddStaff) btnAddStaff.style.display = 'block';
            if (btnExportStaff) btnExportStaff.style.display = 'block';
            if (btnAddAttendance) btnAddAttendance.style.display = 'none';
            loadStaff(role);
        }
    });
});

// --- ATTENDANCE MANAGEMENT ---
async function loadAttendance() {
    try {
        const res = await fetch(API_ATTENDANCE);
        if (!res.ok) throw new Error();
        const attendance = await res.json();
        const tbody = document.getElementById('attendance-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        
        attendance.forEach(a => {
            const statusClass = a.status === 'PRESENT' ? 'badge-success' : a.status === 'LEAVE' ? 'badge-warning' : a.status === 'HALF_DAY' ? 'badge-info' : 'badge-danger';
            const checkIn = a.checkIn || '-';
            const checkOut = a.checkOut || '-';
            const notes = a.notes || '-';
            const name = a.staff ? a.staff.name : 'Unknown';
            const role = a.staff ? a.staff.role : '-';
            
            tbody.innerHTML += `
                <tr>
                    <td style="font-weight:600">${a.date}</td>
                    <td style="font-weight:600">${name}</td>
                    <td><span class="role-badge ${role.toLowerCase()}">${role}</span></td>
                    <td><i class="ri-time-line"></i> ${checkIn}</td>
                    <td><i class="ri-time-line"></i> ${checkOut}</td>
                    <td><span class="badge ${statusClass}">${a.status}</span></td>
                    <td>${notes}</td>
                    <td>
                        <button class="btn-icon" title="Edit" onclick="editAttendance(${a.id})"><i class="ri-edit-line"></i></button>
                        <button class="btn-icon text-danger" title="Delete" onclick="deleteAttendance(${a.id})"><i class="ri-delete-bin-line"></i></button>
                    </td>
                </tr>
            `;
        });
    } catch(err) {
        console.error('Failed to load attendance:', err);
    }
}

window.openAttendanceModal = async () => {
    document.getElementById('attendance-form').reset();
    document.getElementById('attendance-id').value = '';
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('attendance-date').value = today;

    try {
        const res = await fetch(API_STAFF);
        const staff = await res.json();
        const select = document.getElementById('attendance-staff');
        select.innerHTML = '<option value="" disabled selected>Select Staff</option>' + 
            staff.map(s => `<option value="${s.id}">${s.name} (${s.role})</option>`).join('');
    } catch(err) {
        console.error('Failed to load staff for dropdown:', err);
    }

    document.getElementById('attendance-modal-title').innerText = 'Mark Attendance';
    openModal('attendance-modal');
};

window.saveAttendance = async (e) => {
    e.preventDefault();
    const id = document.getElementById('attendance-id').value;
    const checkIn = document.getElementById('attendance-check-in').value || null;
    const checkOut = document.getElementById('attendance-check-out').value || null;
    const status = document.getElementById('attendance-status').value;
    const notes = document.getElementById('attendance-notes').value;
    const staffId = document.getElementById('attendance-staff').value;
    
    const attendance = {
        staff: { id: parseInt(staffId) },
        date: document.getElementById('attendance-date').value,
        checkIn: checkIn,
        checkOut: checkOut,
        status: status,
        notes: notes
    };

    try {
        const url = id ? `${API_ATTENDANCE}/${id}` : API_ATTENDANCE;
        const res = await fetch(url, {
            method: id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(attendance)
        });
        if (res.ok) {
            showToast('Attendance recorded successfully', 'success');
            closeModal('attendance-modal');
            loadAttendance();
        } else {
            showToast('Failed to record attendance', 'danger');
        }
    } catch(err) {
        showToast('Error recording attendance', 'danger');
    }
};

window.editAttendance = async (id) => {
    try {
        const res = await fetch(`${API_ATTENDANCE}/${id}`);
        if (!res.ok) throw new Error();
        const a = await res.json();

        const staffRes = await fetch(API_STAFF);
        const staff = await staffRes.json();
        const select = document.getElementById('attendance-staff');
        select.innerHTML = staff.map(s => `<option value="${s.id}">${s.name} (${s.role})</option>`).join('');

        document.getElementById('attendance-id').value = a.id;
        document.getElementById('attendance-staff').value = a.staff ? a.staff.id : '';
        document.getElementById('attendance-date').value = a.date;
        document.getElementById('attendance-check-in').value = a.checkIn || '';
        document.getElementById('attendance-check-out').value = a.checkOut || '';
        document.getElementById('attendance-status').value = a.status;
        document.getElementById('attendance-notes').value = a.notes || '';

        document.getElementById('attendance-modal-title').innerText = 'Edit Attendance Record';
        openModal('attendance-modal');
    } catch (err) {
        showToast('Failed to load attendance record for editing', 'danger');
    }
};

window.deleteAttendance = async (id) => {
    if (!confirm('Are you sure you want to delete this attendance record?')) return;
    try {
        const res = await fetch(`${API_ATTENDANCE}/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Attendance record deleted', 'success');
            loadAttendance();
        } else {
            showToast('Failed to delete attendance record', 'danger');
        }
    } catch(err) {
        showToast('Error deleting attendance record', 'danger');
    }
};

window.openStaffModal = () => { document.getElementById('staff-form').reset(); document.getElementById('staff-id').value = ''; document.getElementById('staff-modal-title').innerText = 'Add Staff Member'; openModal('staff-modal'); };
window.saveStaff = async (e) => {
    e.preventDefault();
    const id = document.getElementById('staff-id').value;
    const staff = {
        name: document.getElementById('staff-name').value,
        role: document.getElementById('staff-role').value,
        department: document.getElementById('staff-department').value,
        phone: document.getElementById('staff-phone').value,
        email: document.getElementById('staff-email').value,
        salary: parseFloat(document.getElementById('staff-salary').value),
        shift: document.getElementById('staff-shift').value,
        status: document.getElementById('staff-status').value
    };
    try {
        const res = await fetch(id ? `${API_STAFF}/${id}` : API_STAFF, {
            method: id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(staff)
        });
        if (res.ok) { 
            showToast('Staff saved successfully', 'success'); 
            if (window.addNotification) window.addNotification('success', 'ri-team-line', `Staff ${id ? 'updated' : 'added'}`);
            closeModal('staff-modal'); 
            loadStaff(document.querySelector('.staff-sub-tab.active').getAttribute('data-role')); 
        }
    } catch(err) { showToast('Failed to save staff', 'danger'); }
};
window.deleteStaff = async (id) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    await fetch(`${API_STAFF}/${id}`, { method: 'DELETE' });
    showToast('Staff deleted', 'success'); 
    if (window.addNotification) window.addNotification('danger', 'ri-user-unfollow-line', `Staff member deleted`);
    loadStaff();
};
window.editStaff = async (id) => {
    const res = await fetch(`${API_STAFF}/${id}`); const s = await res.json();
    document.getElementById('staff-id').value = s.id;
    document.getElementById('staff-name').value = s.name;
    document.getElementById('staff-role').value = s.role;
    document.getElementById('staff-department').value = s.department;
    document.getElementById('staff-phone').value = s.phone;
    document.getElementById('staff-email').value = s.email;
    document.getElementById('staff-salary').value = s.salary;
    document.getElementById('staff-shift').value = s.shift;
    document.getElementById('staff-status').value = s.status;
    document.getElementById('staff-modal-title').innerText = 'Edit Staff Member';
    openModal('staff-modal');
};

// 5. Lab Management
async function loadLabTests() {
    try {
        const res = await fetch(API_LAB); const tests = await res.json();
        const tbody = document.getElementById('lab-tbody'); if (!tbody) return;
        tbody.innerHTML = '';
        
        let booked = 0, collected = 0, progress = 0, completed = 0;
        
        tests.forEach(t => {
            if (t.status === 'BOOKED') booked++; else if (t.status === 'SAMPLE_COLLECTED') collected++;
            else if (t.status === 'IN_PROGRESS') progress++; else completed++;
            
            const badgeClass = t.status.toLowerCase();
            const dateStr = t.bookingDate || '-';
            const downloadBtn = t.status === 'COMPLETED' ? `<button class="btn-icon text-success" title="Download Report" onclick="downloadLabReport(${t.id})"><i class="ri-download-2-line"></i></button>` : '';
            tbody.innerHTML += `
                <tr>
                    <td style="font-family:monospace;font-weight:600">#LT-${t.id}</td>
                    <td>${t.patient ? t.patient.name : 'Unknown'}</td>
                    <td style="font-weight:600">${t.testName}</td>
                    <td><span class="test-type-chip">${t.testType}</span></td>
                    <td><span class="lab-status-badge ${badgeClass}">${t.status.replace('_',' ')}</span></td>
                    <td>${dateStr}</td>
                    <td>
                        ${downloadBtn}
                        <button class="btn-icon" title="Edit" onclick="editLabTest(${t.id})"><i class="ri-edit-line"></i></button>
                        <button class="btn-icon text-danger" title="Delete" onclick="deleteLabTest(${t.id})"><i class="ri-delete-bin-line"></i></button>
                    </td>
                </tr>
            `;
        });
        
        document.getElementById('lab-stat-booked').innerText = booked;
        document.getElementById('lab-stat-samples').innerText = collected;
        document.getElementById('lab-stat-progress').innerText = progress;
        document.getElementById('lab-stat-completed').innerText = completed;
    } catch (err) {}
}

window.openLabModal = async () => {
    document.getElementById('lab-form').reset(); document.getElementById('lab-id').value = '';
    const pRes = await fetch(API_PATIENTS); const patients = await pRes.json();
    const select = document.getElementById('lab-patient');
    select.innerHTML = '<option value="" disabled selected>Select Patient</option>' + patients.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    document.getElementById('lab-modal-title').innerText = 'Book Lab Test';
    openModal('lab-modal');
};
window.saveLabTest = async (e) => {
    e.preventDefault();
    const id = document.getElementById('lab-id').value;
    const test = {
        patient: { id: document.getElementById('lab-patient').value },
        testName: document.getElementById('lab-test-name').value,
        testType: document.getElementById('lab-test-type').value,
        status: document.getElementById('lab-status').value,
        cost: parseFloat(document.getElementById('lab-cost').value),
        result: document.getElementById('lab-result').value
    };
    try {
        const res = await fetch(id ? `${API_LAB}/${id}` : API_LAB, { method: id ? 'PUT':'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(test) });
        if (res.ok) { 
            showToast('Lab test saved', 'success'); 
            if (window.addNotification) window.addNotification('success', 'ri-microscope-line', `Lab test ${id ? 'updated' : 'booked'}`);
            closeModal('lab-modal'); 
            loadLabTests(); 
        }
    } catch(err) {}
};
window.deleteLabTest = async (id) => {
    if (!confirm('Delete lab test?')) return;
    await fetch(`${API_LAB}/${id}`, { method: 'DELETE' }); 
    showToast('Deleted', 'success'); 
    if (window.addNotification) window.addNotification('danger', 'ri-delete-bin-line', `Lab test deleted`);
    loadLabTests();
};
window.editLabTest = async (id) => {
    const res = await fetch(`${API_LAB}/${id}`); const t = await res.json();
    const pRes = await fetch(API_PATIENTS); const patients = await pRes.json();
    document.getElementById('lab-patient').innerHTML = patients.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    
    document.getElementById('lab-id').value = t.id;
    document.getElementById('lab-patient').value = t.patient ? t.patient.id : '';
    document.getElementById('lab-test-name').value = t.testName;
    document.getElementById('lab-test-type').value = t.testType;
    document.getElementById('lab-status').value = t.status;
    document.getElementById('lab-cost').value = t.cost;
    document.getElementById('lab-result').value = t.result || '';
    document.getElementById('lab-modal-title').innerText = 'Edit Lab Test';
    openModal('lab-modal');
};

// 6. Department Management
async function loadDepartments() {
    try {
        const res = await fetch(API_DEPT); const depts = await res.json();
        const grid = document.getElementById('dept-grid'); if (!grid) return;
        grid.innerHTML = depts.map(d => `
            <div class="dept-card">
                <div class="dept-card-header">
                    <div class="dept-icon"><i class="ri-building-line"></i></div>
                    <div>
                        <h4>${d.name}</h4>
                        <div class="dept-head">Head: ${d.head || '-'}</div>
                    </div>
                </div>
                <div class="dept-meta">
                    <div class="dept-meta-item"><i class="ri-map-pin-line"></i> ${d.location || '-'}</div>
                    <div class="dept-meta-item"><i class="ri-team-line"></i> ${d.totalStaff || 0} Staff</div>
                </div>
                <div class="dept-actions">
                    <button class="btn btn-outline" style="flex:1" onclick="editDepartment(${d.id})">Edit</button>
                    <button class="btn-icon text-danger" onclick="deleteDepartment(${d.id})"><i class="ri-delete-bin-line"></i></button>
                </div>
            </div>
        `).join('');
    } catch(err) {}
}
window.openDeptModal = () => { document.getElementById('dept-form').reset(); document.getElementById('dept-id').value = ''; document.getElementById('dept-modal-title').innerText = 'Add Department'; openModal('dept-modal'); };
window.saveDepartment = async (e) => {
    e.preventDefault();
    const id = document.getElementById('dept-id').value;
    const dept = {
        name: document.getElementById('dept-name').value,
        head: document.getElementById('dept-head').value,
        location: document.getElementById('dept-location').value,
        phone: document.getElementById('dept-phone').value,
        status: document.getElementById('dept-status').value,
        description: document.getElementById('dept-desc').value
    };
    try {
        const res = await fetch(id ? `${API_DEPT}/${id}` : API_DEPT, { method: id ? 'PUT':'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(dept) });
        if (res.ok) { 
            showToast('Department saved', 'success'); 
            if (window.addNotification) window.addNotification('success', 'ri-building-line', `Department ${id ? 'updated' : 'added'}`);
            closeModal('dept-modal'); 
            loadDepartments(); 
        }
    } catch(err) {}
};
window.deleteDepartment = async (id) => {
    if (!confirm('Delete department?')) return;
    await fetch(`${API_DEPT}/${id}`, { method: 'DELETE' }); 
    showToast('Deleted', 'success'); 
    if (window.addNotification) window.addNotification('danger', 'ri-delete-bin-line', `Department deleted`);
    loadDepartments();
};
window.editDepartment = async (id) => {
    const res = await fetch(`${API_DEPT}/${id}`); const d = await res.json();
    document.getElementById('dept-id').value = d.id;
    document.getElementById('dept-name').value = d.name;
    document.getElementById('dept-head').value = d.head;
    document.getElementById('dept-location').value = d.location;
    document.getElementById('dept-phone').value = d.phone;
    document.getElementById('dept-status').value = d.status;
    document.getElementById('dept-desc').value = d.description || '';
    document.getElementById('dept-modal-title').innerText = 'Edit Department';
    openModal('dept-modal');
};

// 7. Feedback Management
async function loadFeedback() {
    try {
        const res = await fetch(API_FEEDBACK); const feedback = await res.json();
        const tbody = document.getElementById('feedback-tbody'); if (!tbody) return;
        tbody.innerHTML = feedback.map(f => {
            const stars = Array(5).fill('<i class="ri-star-line" style="color:#e2e8f0"></i>');
            for(let i=0; i<f.rating; i++) stars[i] = '<i class="ri-star-fill"></i>';
            return `
                <tr>
                    <td>${new Date(f.submittedAt).toLocaleDateString()}</td>
                    <td style="font-weight:600">${f.name}</td>
                    <td><span class="feedback-cat-badge">${f.category}</span></td>
                    <td class="feedback-stars">${stars.join('')}</td>
                    <td style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${f.message}">${f.message}</td>
                    <td><span class="badge ${f.resolved ? 'badge-success' : 'badge-warning'}">${f.resolved ? 'Resolved' : 'Pending'}</span></td>
                    <td>
                        ${!f.resolved ? `<button class="btn btn-outline" style="padding:0.25rem 0.5rem;font-size:0.7rem" onclick="resolveFeedback(${f.id})">Mark Resolved</button>` : ''}
                    </td>
                </tr>
            `;
        }).join('');
    } catch(err) {}
}
window.resolveFeedback = async (id) => {
    await fetch(`${API_FEEDBACK}/${id}/resolve`, { method: 'PUT' }); 
    showToast('Feedback resolved', 'success'); 
    if (window.addNotification) window.addNotification('success', 'ri-chat-check-line', `Feedback marked as resolved`);
    loadFeedback();
};

// 8. Calendar Setup
let currentCalDate = new Date();
window.changeCalendarMonth = (offset) => {
    if (offset === 0) currentCalDate = new Date();
    else currentCalDate.setMonth(currentCalDate.getMonth() + offset);
    renderCalendar();
};
async function renderCalendar() {
    const grid = document.getElementById('calendar-days');
    const monthYearStr = document.getElementById('cal-month-year');
    if (!grid || !monthYearStr) return;
    
    monthYearStr.textContent = currentCalDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    const year = currentCalDate.getFullYear(); const month = currentCalDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let html = '';
    for (let i = 0; i < firstDay; i++) html += '<div class="cal-day other-month"></div>';
    
    // Fetch appointments to display
    let appsMap = {};
    try {
        const res = await fetch(API_APPOINTMENTS); const apps = await res.json();
        apps.forEach(a => {
            const d = new Date(a.appointmentDate).getDate();
            const m = new Date(a.appointmentDate).getMonth();
            const y = new Date(a.appointmentDate).getFullYear();
            if (m === month && y === year) {
                if(!appsMap[d]) appsMap[d] = [];
                appsMap[d].push(a);
            }
        });
    } catch(e) {}
    
    const today = new Date();
    for (let d = 1; d <= daysInMonth; d++) {
        const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
        let eventsHtml = '';
        if (appsMap[d]) {
            eventsHtml = appsMap[d].slice(0,3).map(a => `<div class="cal-event ${a.status.toLowerCase()}">${new Date(a.appointmentDate).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})} - ${a.patient?a.patient.name:'Patient'}</div>`).join('');
            if (appsMap[d].length > 3) eventsHtml += `<div class="cal-event" style="background:none;color:var(--text-muted)">+${appsMap[d].length - 3} more</div>`;
        }
        html += `<div class="cal-day ${isToday ? 'today' : ''}"><div class="cal-day-num">${d}</div>${eventsHtml}</div>`;
    }
    grid.innerHTML = html;
}

// 9. Dashboard Charts (Chart.js)
let revenueChartInstance = null;
async function renderCharts() {
    const dashView = document.getElementById('dashboard-view');
    if (!dashView || !dashView.classList.contains('active')) return;
    
    // Inject Canvas if not exists
    if (!document.getElementById('revenue-chart')) {
        const statsGrid = document.querySelector('.stats-grid');
        statsGrid.insertAdjacentHTML('afterend', `
            <div class="charts-grid">
                <div class="chart-card">
                    <div class="chart-card-header"><h4>Revenue Trend (Last 7 Days)</h4></div>
                    <canvas id="revenue-chart" height="150"></canvas>
                </div>
                <div class="chart-card">
                    <div class="chart-card-header"><h4>Department Overview</h4></div>
                    <canvas id="dept-chart" height="150"></canvas>
                </div>
            </div>
        `);
    }
    
    if (typeof Chart === 'undefined') return; // CDN not loaded yet
    
    try {
        const [billsRes, deptsRes] = await Promise.all([fetch(API_BILLS), fetch(API_DEPT)]);
        const bills = await billsRes.json(); const depts = await deptsRes.json();
        
        // Prepare Revenue Data
        const last7Days = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return d.toISOString().split('T')[0]; }).reverse();
        const revData = last7Days.map(date => {
            return bills.filter(b => b.billingDate === date).reduce((sum, b) => sum + (b.totalAmount || 0), 0);
        });
        
        if (revenueChartInstance) revenueChartInstance.destroy();
        const ctxRev = document.getElementById('revenue-chart').getContext('2d');
        revenueChartInstance = new Chart(ctxRev, {
            type: 'line',
            data: { labels: last7Days, datasets: [{ label: 'Revenue (RS)', data: revData, borderColor: '#0d9488', backgroundColor: 'rgba(13, 148, 136, 0.1)', fill: true, tension: 0.4 }] },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
        });
        
        // Prepare Dept Data
        const deptLabels = depts.map(d => d.name);
        const deptStaff = depts.map(d => d.totalStaff || 0);
        new Chart(document.getElementById('dept-chart').getContext('2d'), {
            type: 'doughnut',
            data: { labels: deptLabels, datasets: [{ data: deptStaff, backgroundColor: ['#0d9488', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'] }] },
            options: { responsive: true, plugins: { legend: { position: 'right' } } }
        });
    } catch(err) {}
}

// 10. Export Functions
window.exportLabTestsPDF = () => {
    if (typeof window.jspdf === 'undefined') return showToast('PDF library loading...', 'warning');
    const { jsPDF } = window.jspdf; const doc = new jsPDF();
    doc.setFontSize(18); doc.text("Laboratory Tests Report", 14, 20);
    doc.setFontSize(11); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    // Simple table grabber
    const rows = []; document.querySelectorAll('#lab-tbody tr').forEach(tr => {
        const row = []; tr.querySelectorAll('td').forEach((td, i) => { if(i < 6) row.push(td.innerText); }); rows.push(row.join(' | '));
    });
    let y = 45; rows.forEach(r => { doc.text(r, 14, y); y += 10; });
    doc.save('Lab_Tests_Report.pdf'); showToast('PDF Downloaded', 'success');
};
window.exportLabTestsExcel = () => {
    if (typeof XLSX === 'undefined') return showToast('Excel library loading...', 'warning');
    const table = document.querySelector('#lab-view table');
    const wb = XLSX.utils.table_to_book(table, { sheet: "Lab Tests" });
    XLSX.writeFile(wb, 'Lab_Tests.xlsx'); showToast('Excel Downloaded', 'success');
};
window.exportStaffExcel = () => {
    if (typeof XLSX === 'undefined') return showToast('Excel library loading...', 'warning');
    const table = document.querySelector('#staff-view table');
    const wb = XLSX.utils.table_to_book(table, { sheet: "Staff" });
    XLSX.writeFile(wb, 'Staff_Directory.xlsx'); showToast('Excel Downloaded', 'success');
};

// ShowView alias for backward compatibility and search integrations
window.showView = function(viewId) {
    switchTab(viewId);
};

// Initial load overrides
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (document.getElementById('dashboard-view').classList.contains('active')) {
            renderCharts();
        }
    }, 500);
});

async function downloadLabReport(id) {
    try {
        const res = await fetch(`${API_LAB}/${id}`);
        if (!res.ok) throw new Error();
        const test = await res.json();
        
        const printContainer = document.getElementById('receipt-print-template');
        printContainer.innerHTML = `
            <div class="invoice-print-header">
                <div class="invoice-print-logo">
                    <i class="ri-heart-pulse-fill"></i>
                    <div class="invoice-print-logo-text">
                        <h1>THAKRE HOSPITAL</h1>
                        <span>Multispeciality & Diagnostic Lab</span>
                    </div>
                </div>
                <div class="invoice-print-title">
                    <h2>DIAGNOSTIC REPORT</h2>
                    <p style="margin:0;font-size:0.85rem;color:#64748b;">Report ID: #LT-${test.id}</p>
                </div>
            </div>

            <div class="invoice-print-details-grid">
                <div class="invoice-print-block">
                    <h3>Lab Details</h3>
                    <p><strong>Thakre Diagnostic Laboratory</strong></p>
                    <p>Nagpur, Maharashtra, India</p>
                    <p>Phone: +91 712 000 0000</p>
                    <p>Email: lab@thakrehospital.in</p>
                </div>
                <div class="invoice-print-block">
                    <h3>Patient & Test Details</h3>
                    <p><strong>Patient Name:</strong> ${test.patient ? test.patient.name : 'Unknown'}</p>
                    <p><strong>Patient ID:</strong> ${test.patient ? test.patient.id : '-'}</p>
                    <p><strong>Test Name:</strong> ${test.testName}</p>
                    <p><strong>Test Category:</strong> ${test.testType}</p>
                    <p><strong>Booking Date:</strong> ${test.bookingDate || '-'}</p>
                    <p><strong>Sample Date:</strong> ${test.sampleDate || '-'}</p>
                    <p><strong>Report Date:</strong> ${test.reportDate || '-'}</p>
                </div>
            </div>

            <table class="invoice-print-table" style="margin-top: 2rem;">
                <thead>
                    <tr>
                        <th style="width: 40%;">Investigation</th>
                        <th style="width: 40%;">Observed Value / Result</th>
                        <th style="width: 20%; text-align: right;">Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="font-weight: 600;">${test.testName}</td>
                        <td style="font-weight: 700; color: #1e3a8a; font-family: monospace; font-size: 1.1rem;">
                            ${test.result || 'Pending Result Details'}
                        </td>
                        <td style="text-align: right; font-weight: 600;">
                            <span style="color: #059669;">${test.status}</span>
                        </td>
                    </tr>
                </tbody>
            </table>

            ${test.notes ? `
            <div style="border: 1px solid #e2e8f0; background-color: #f8fafc; border-radius: 8px; padding: 1rem; margin-top: 2rem; color: #334155;">
                <h4 style="margin: 0 0 0.5rem 0; font-size: 0.9rem; font-weight: 700; text-transform: uppercase; color: #475569;">Pathologist / Lab Notes</h4>
                <p style="margin: 0; font-size: 0.85rem; line-height: 1.5;">${test.notes}</p>
            </div>
            ` : ''}

            <div style="display: flex; justify-content: space-between; margin-top: 6rem;">
                <div style="text-align: center; width: 200px;">
                    <div style="border-bottom: 1px solid #000; height: 40px; display: flex; align-items: flex-end; justify-content: center; font-family: 'Outfit'; font-weight: 700; color: #0d9488; font-size: 0.9rem;">Verified</div>
                    <p style="font-size: 0.8rem; margin-top: 0.5rem;">Lab Technician</p>
                </div>
                <div style="text-align: center; width: 200px;">
                    <div style="border-bottom: 1px solid #000; height: 40px; display: flex; align-items: flex-end; justify-content: center; font-family: 'Outfit'; font-weight: 700; color: #0d9488; font-size: 0.9rem;">Dr. Amit Shah</div>
                    <p style="font-size: 0.8rem; margin-top: 0.5rem;">Chief Pathologist (MD)</p>
                </div>
            </div>

            <div class="invoice-print-footer" style="margin-top: 4rem;">
                <p>This is a certified electronic diagnostic report generated from Thakre Multispeciality MedCare system.</p>
                <p>Please consult your doctor for clinical correlation.</p>
            </div>
        `;
        
        window.print();
    } catch(err) {
        showToast('Failed to load print template for lab report', 'danger');
    }
}
window.downloadLabReport = downloadLabReport;

// End of Additions

