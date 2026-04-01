/**
 * ACADEMIA DE PAGOS - Secure & Cloud Integrated
 * v20260401-1240
 */

// --- STATE ---
let students = JSON.parse(localStorage.getItem('academy_students')) || [];
let payments = JSON.parse(localStorage.getItem('academy_payments')) || [];
let currentRate = parseFloat(localStorage.getItem('academy_rate')) || 40.0;
let supabase = null;
let isConnected = false;
let session = sessionStorage.getItem('academy_session') === 'true';

const cloudConfig = JSON.parse(localStorage.getItem('academy_cloud_config')) || { url: '', key: '' };

// --- LOGGING ---
window.onerror = (msg, url, line) => {
    alert(`Error: ${msg} en la línea ${line}`);
    console.error(`ERROR: ${msg} [${url}:${line}]`);
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("App Inicializada");
    
    // 1. Setup Auth and UI Visibility ASAP
    updateAuthUI();
    
    const toggler = document.getElementById('toggle-p');
    if (toggler) {
        toggler.onclick = () => {
            const pin = document.getElementById('login-password');
            const isPass = pin.type === 'password';
            pin.type = isPass ? 'text' : 'password';
            toggler.className = isPass ? 'fas fa-eye-slash toggle-pass' : 'fas fa-eye toggle-pass';
        };
    }

    const loginBtn = document.getElementById('btn-do-login');
    if (loginBtn) {
        loginBtn.onclick = handleLogin;
    }
    
    const loginPass = document.getElementById('login-password');
    if (loginPass) {
        loginPass.onkeypress = (e) => e.key === 'Enter' && handleLogin();
    }

    // 2. Start core app if session exists
    if (session) {
        startApp();
    }
});

function handleLogin() {
    const pwInput = document.getElementById('login-password');
    if (!pwInput) return;

    const val = pwInput.value.trim().toLowerCase();
    const err = document.getElementById('login-error');
    
    console.log('Intento de login:', val);
    
    // Super-simple check to avoid any script errors
    if (val === 'admin123') {
        session = true;
        sessionStorage.setItem('academy_session', 'true');
        updateAuthUI();
        startApp();
    } else {
        if (err) err.classList.remove('hidden');
        pwInput.value = '';
        setTimeout(() => { if (err) err.classList.add('hidden'); }, 3000);
    }
}

function updateAuthUI() {
    const loginView = document.getElementById('view-login');
    const appContainer = document.getElementById('app-container');
    
    if (session) {
        if (loginView) loginView.classList.add('hidden');
        if (appContainer) appContainer.classList.remove('hidden');
    } else {
        if (loginView) loginView.classList.remove('hidden');
        if (appContainer) appContainer.classList.add('hidden');
    }
}

async function startApp() {
    const rateInput = document.getElementById('global-rate');
    if (rateInput) rateInput.value = currentRate;
    
    initRouting();
    initPopSales();
    
    if (cloudConfig.url && cloudConfig.key) {
        await connectToCloud(cloudConfig.url, cloudConfig.key);
    }
    
    await refreshAllData();
}

async function connectToCloud(url, key) {
    try {
        if (!window.supabase) return false;
        supabase = window.supabase.createClient(url, key);
        const { data, error } = await supabase.from('app_settings').select('value').eq('key', 'usd_rate').single();
        if (error && error.code !== 'PGRST116') throw error;
        
        isConnected = true;
        const statusEl = document.getElementById('cloud-status');
        if (statusEl) {
            statusEl.classList.add('connected');
            statusEl.querySelector('span').innerText = 'Conectado';
        }
        localStorage.setItem('academy_cloud_config', JSON.stringify({ url, key }));
        return true;
    } catch (err) {
        console.warn('Sync error:', err);
        return false;
    }
}

async function refreshAllData() {
    if (isConnected) {
        const { data: sData } = await supabase.from('students').select('*').order('name');
        if (sData) students = sData;
        const { data: pData } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
        if (pData) {
            payments = pData.map(p => ({
                id: p.id,
                studentName: p.student_name,
                service: p.service,
                amount: p.amount,
                currency: p.currency,
                eqUSD: p.eq_usd,
                method: p.method,
                date: new Date(p.date).toLocaleDateString('es-VE'),
                timestamp: new Date(p.created_at).getTime()
            }));
        }
    }
    saveToLocal();
    updateDashboardStats();
    renderStudentsTable();
    populateStudentDropdown();
}

function initRouting() {
    const triggers = document.querySelectorAll('#main-nav li');
    triggers.forEach(item => {
        item.onclick = (e) => {
            const pageId = item.getAttribute('data-page');
            showPage(pageId);
            document.querySelectorAll('#main-nav li').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        };
    });
}

function showPage(pageId) {
    const allSections = document.querySelectorAll('.page-section');
    allSections.forEach(p => p.classList.remove('active'));
    
    const target = document.getElementById(pageId);
    if (target) {
        target.classList.add('active');
        if (pageId === 'dashboard') updateDashboardStats();
        if (pageId === 'students') renderStudentsTable();
        if (pageId === 'payments') populateStudentDropdown();
    }
}

// Global button listeners (safer)
document.addEventListener('click', (e) => {
    if (e.target.id === 'open-sync-settings' || e.target.closest('#open-sync-settings')) {
        const modal = document.getElementById('sync-modal');
        if (modal) {
            document.getElementById('supabase-url').value = cloudConfig.url || '';
            document.getElementById('supabase-key').value = cloudConfig.key || '';
            modal.classList.add('active');
        }
    }
    if (e.target.id === 'close-sync-modal' || e.target.classList.contains('close-modal')) {
        const modal = e.target.closest('.modal');
        if (modal) modal.classList.remove('active');
    }
    if (e.target.id === 'add-student-btn-top') {
        const form = document.getElementById('student-form');
        const modal = document.getElementById('student-modal');
        if (form && modal) {
            form.reset();
            document.getElementById('student-id').value = '';
            modal.classList.add('active');
        }
    }
});

// Sync Form
const syncF = document.getElementById('sync-form');
if (syncF) {
    syncF.onsubmit = async (e) => {
        e.preventDefault();
        const url = document.getElementById('supabase-url').value;
        const key = document.getElementById('supabase-key').value;
        if (await connectToCloud(url, key)) {
            await refreshAllData();
            document.getElementById('sync-modal').classList.remove('active');
        } else {
            alert('Fallo al conectar con Supabase.');
        }
    };
}

// Student Form
const stForm = document.getElementById('student-form');
if (stForm) {
    stForm.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('student-id').value || crypto.randomUUID();
        const name = document.getElementById('student-name').value;
        const category = document.getElementById('student-category').value;
        const days = Array.from(document.querySelectorAll('input[name="days"]:checked')).map(cb => cb.value);
        const sData = { id, name, category, days, active: true };
        if (isConnected) await supabase.from('students').upsert({ id, name, category, days, active: true });
        const idx = students.findIndex(s => s.id === id);
        if (idx > -1) students[idx] = sData; else students.push(sData);
        saveToLocal();
        renderStudentsTable();
        document.getElementById('student-modal').classList.remove('active');
    };
}

function renderStudentsTable() {
    const tbody = document.getElementById('students-table-body');
    if (!tbody) return;
    tbody.innerHTML = students.map(s => `<tr><td><strong>${s.name}</strong></td><td>${s.category}</td><td><span class="status-badge ${s.active ? 'status-paid' : 'status-pending'}">${s.active ? 'Activo' : 'Inactivo'}</span></td><td><button class="btn-small" onclick="editStudent('${s.id}')"><i class="fas fa-edit"></i></button></td></tr>`).join('');
}
window.editStudent = (id) => {
    const s = students.find(st => st.id === id); if (!s) return;
    document.getElementById('student-id').value = s.id; document.getElementById('student-name').value = s.name; document.getElementById('student-category').value = s.category; document.getElementById('student-modal').classList.add('active');
};

// Payments
const payForm = document.getElementById('payment-form');
if (payForm) {
    payForm.onsubmit = async (e) => {
        e.preventDefault();
        const sId = document.getElementById('pay-student-id').value;
        const student = students.find(s => s.id === sId);
        const service = document.getElementById('pay-service-type').value;
        const amount = parseFloat(document.getElementById('pay-amount').value);
        const currency = document.getElementById('pay-currency').value;
        const method = document.getElementById('pay-method').value;
        const eqUSD = (currency === 'USD') ? amount : amount / currentRate;
        const pData = { student_id: sId, student_name: student ? student.name : 'Desconocido', service, amount, currency, eq_usd: eqUSD, method };
        if (isConnected) await supabase.from('payments').insert([pData]);
        payments.unshift({ id: Date.now().toString(), studentName: pData.student_name, service, amount, currency, eqUSD, method, date: new Date().toLocaleDateString('es-VE'), timestamp: Date.now() });
        saveToLocal(); payForm.reset(); updatePageSummary(); showPage('dashboard'); alert('Pago registrado');
    };
}

function populateStudentDropdown() { 
    const select = document.getElementById('pay-student-id'); 
    if (!select) return;
    select.innerHTML = '<option value="">Seleccione...</option>' + students.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
}

function updatePageSummary() {
    const amount = parseFloat(document.getElementById('pay-amount').value) || 0;
    const usd = (document.getElementById('pay-currency').value === 'USD') ? amount : amount / currentRate;
    const bs = usd * currentRate;
    document.getElementById('summary-usd').innerText = `$ ${usd.toFixed(2)}`;
    document.getElementById('summary-bs').innerText = `${bs.toFixed(2)} BS`;
}

// Shortcuts for POP
function initPopSales() {
    document.querySelectorAll('.buy-pop').forEach(btn => {
        btn.onclick = async () => {
            const item = btn.dataset.item; const price = parseFloat(btn.dataset.price);
            const pData = { student_name: 'Venta Directa', service: `POP: ${item}`, amount: price, currency: 'USD', eq_usd: price, method: 'Efectivo' };
            if (isConnected) await supabase.from('payments').insert([pData]);
            payments.unshift({ id: Date.now().toString(), studentName: 'Venta Directa', service: pData.service, amount: price, currency: 'USD', eqUSD: price, method: 'Efectivo', date: new Date().toLocaleDateString('es-VE'), timestamp: Date.now() });
            saveToLocal(); updateDashboardStats(); alert(`Venta de ${item} registrada.`);
        };
    });
}

function updateDashboardStats() {
    const totalUSD = payments.reduce((acc, p) => acc + (p.eqUSD || 0), 0);
    const popS = payments.filter(p => p.service.includes('POP')).reduce((acc, p) => acc + (p.eqUSD || 0), 0);
    if (document.getElementById('stat-total-income')) document.getElementById('stat-total-income').innerText = `$ ${totalUSD.toFixed(2)}`;
    if (document.getElementById('stat-total-income-bs')) document.getElementById('stat-total-income-bs').innerText = `${(totalUSD * currentRate).toFixed(2)} BS`;
    if (document.getElementById('stat-active-students')) document.getElementById('stat-active-students').innerText = students.length;
    if (document.getElementById('stat-pop-sales')) document.getElementById('stat-pop-sales').innerText = `$ ${popS.toFixed(2)}`;
    renderRecentPayments();
}

function renderRecentPayments() {
    const tbody = document.getElementById('recent-payments-body');
    if (!tbody) return;
    const recent = payments.slice(0, 8);
    tbody.innerHTML = recent.map(p => `<tr><td>${p.studentName}</td><td>${p.service}</td><td><strong>${p.amount} ${p.currency}</strong></td><td>${p.date}</td><td><span class="status-badge status-paid">Listo</span></td></tr>`).join('');
}

function saveToLocal() { localStorage.setItem('academy_students', JSON.stringify(students)); localStorage.setItem('academy_payments', JSON.stringify(payments)); localStorage.setItem('academy_rate', currentRate); }

document.body.onchange = (e) => {
    if (e.target.id === 'global-rate') {
        currentRate = parseFloat(e.target.value) || 40.0;
        saveToLocal();
        updateDashboardStats();
    }
};
