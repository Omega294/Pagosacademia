/**
 * ACADEMIA DE PAGOS - Cloud Integrated
 */

// --- STATE ---
let students = JSON.parse(localStorage.getItem('academy_students')) || [];
let payments = JSON.parse(localStorage.getItem('academy_payments')) || [];
let currentRate = parseFloat(localStorage.getItem('academy_rate')) || 40.0;
let supabase = null;
let isConnected = false;

// --- CLOUD CONFIG ---
const cloudConfig = JSON.parse(localStorage.getItem('academy_cloud_config')) || { url: '', key: '' };

// --- DOM ELEMENTS ---
const pages = document.querySelectorAll('.page-section');
const navItems = document.querySelectorAll('.sidebar-nav li');
const globalRateInput = document.getElementById('global-rate');
const cloudStatus = document.getElementById('cloud-status');
const syncModal = document.getElementById('sync-modal');
const syncForm = document.getElementById('sync-form');

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    globalRateInput.value = currentRate;
    initRouting();
    initPopSales();
    
    // Connect to Supabase if config exists
    if (cloudConfig.url && cloudConfig.key) {
        await connectToCloud(cloudConfig.url, cloudConfig.key);
    }
    
    await refreshAllData();
});

async function connectToCloud(url, key) {
    try {
        supabase = window.supabase.createClient(url, key);
        // Test connection
        const { error } = await supabase.from('app_settings').select('value').eq('key', 'usd_rate').single();
        if (error && error.code !== 'PGRST116') throw error;
        
        isConnected = true;
        cloudStatus.classList.add('connected');
        cloudStatus.querySelector('span').innerText = 'Conectado';
        localStorage.setItem('academy_cloud_config', JSON.stringify({ url, key }));
        return true;
    } catch (err) {
        console.error('Error de conexión:', err);
        cloudStatus.classList.remove('connected');
        cloudStatus.querySelector('span').innerText = 'Error';
        return false;
    }
}

async function refreshAllData() {
    if (isConnected) {
        // Fetch from Supabase
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

        const { data: rData } = await supabase.from('app_settings').select('value').eq('key', 'usd_rate').single();
        if (rData) {
            currentRate = parseFloat(rData.value);
            globalRateInput.value = currentRate;
        }
    }
    
    saveToLocal();
    updateDashboardStats();
    renderStudentsTable();
    populateStudentDropdown();
}

// --- ROUTING ---
function initRouting() {
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const pageId = item.getAttribute('data-page');
            showPage(pageId);
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });
}

function showPage(pageId) {
    pages.forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    if (pageId === 'dashboard') updateDashboardStats();
    if (pageId === 'students') renderStudentsTable();
    if (pageId === 'payments') populateStudentDropdown();
}

// --- SETTINGS & SYNC ---
document.getElementById('open-sync-settings').onclick = () => {
    document.getElementById('supabase-url').value = cloudConfig.url;
    document.getElementById('supabase-key').value = cloudConfig.key;
    syncModal.classList.add('active');
};

document.getElementById('close-sync-modal').onclick = () => syncModal.classList.remove('active');

syncForm.onsubmit = async (e) => {
    e.preventDefault();
    const url = document.getElementById('supabase-url').value;
    const key = document.getElementById('supabase-key').value;
    
    const success = await connectToCloud(url, key);
    if (success) {
        alert('Conectado exitosamente');
        await syncLocalToCloud(); // Push existing local data if cloud is empty
        await refreshAllData();
        syncModal.classList.remove('active');
    } else {
        alert('No se pudo conectar. Verifique sus credenciales.');
    }
};

async function syncLocalToCloud() {
    if (!isConnected) return;
    // Push students
    for (const s of students) {
        await supabase.from('students').upsert({
            id: s.id.length > 20 ? s.id : undefined, // Simple check if it's already a UUID
            name: s.name,
            category: s.category,
            days: s.days,
            active: s.active
        });
    }
    // Push payments
    for (const p of payments) {
        await supabase.from('payments').upsert({
            student_name: p.studentName,
            service: p.service,
            amount: p.amount,
            currency: p.currency,
            eq_usd: p.eqUSD,
            method: p.method
            // date will default to today or could be parsed
        });
    }
}

// --- STUDENT MANAGEMENT ---
const studentForm = document.getElementById('student-form');
const studentModal = document.getElementById('student-modal');

document.getElementById('add-student-btn-top').onclick = () => {
    studentForm.reset();
    document.getElementById('student-id').value = '';
    studentModal.classList.add('active');
};

document.querySelector('.close-modal').onclick = () => studentModal.classList.remove('active');

studentForm.onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('student-id').value || crypto.randomUUID();
    const name = document.getElementById('student-name').value;
    const category = document.getElementById('student-category').value;
    const days = Array.from(document.querySelectorAll('input[name="days"]:checked')).map(cb => cb.value);

    const studentData = { id, name, category, days, active: true };

    if (isConnected) {
        await supabase.from('students').upsert({ id, name, category, days, active: true });
    }

    const idx = students.findIndex(s => s.id === id);
    if (idx > -1) students[idx] = studentData;
    else students.push(studentData);

    saveToLocal();
    renderStudentsTable();
    studentModal.classList.remove('active');
};

function renderStudentsTable() {
    const tbody = document.getElementById('students-table-body');
    tbody.innerHTML = students.map(s => `
        <tr>
            <td><strong>${s.name}</strong></td>
            <td>${s.category}</td>
            <td><span class="status-badge ${s.active ? 'status-paid' : 'status-pending'}">${s.active ? 'Activo' : 'Inactivo'}</span></td>
            <td>
                <button class="btn-small" onclick="editStudent('${s.id}')"><i class="fas fa-edit"></i></button>
            </td>
        </tr>
    `).join('');
}

window.editStudent = (id) => {
    const s = students.find(st => st.id === id);
    if (!s) return;
    document.getElementById('student-id').value = s.id;
    document.getElementById('student-name').value = s.name;
    document.getElementById('student-category').value = s.category;
    studentModal.classList.add('active');
};

// --- PAYMENTS ---
const paymentForm = document.getElementById('payment-form');
const payAmountInput = document.getElementById('pay-amount');
const payCurrencySelect = document.getElementById('pay-currency');

function populateStudentDropdown() {
    const select = document.getElementById('pay-student-id');
    select.innerHTML = '<option value="">Seleccione...</option>' + 
        students.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
}

[payAmountInput, payCurrencySelect].forEach(el => el.oninput = updatePaymentSummary);

function updatePaymentSummary() {
    const amount = parseFloat(payAmountInput.value) || 0;
    const usd = (payCurrencySelect.value === 'USD') ? amount : amount / currentRate;
    const bs = (payCurrencySelect.value === 'BS') ? amount : amount * currentRate;
    document.getElementById('summary-usd').innerText = `$ ${usd.toFixed(2)}`;
    document.getElementById('summary-bs').innerText = `${bs.toFixed(2)} BS`;
}

paymentForm.onsubmit = async (e) => {
    e.preventDefault();
    const sId = document.getElementById('pay-student-id').value;
    const student = students.find(s => s.id === sId);
    const service = document.getElementById('pay-service-type').value;
    const amount = parseFloat(payAmountInput.value);
    const currency = payCurrencySelect.value;
    const method = document.getElementById('pay-method').value;
    const eqUSD = (currency === 'USD') ? amount : amount / currentRate;

    const pData = {
        student_id: sId,
        student_name: student ? student.name : 'Desconocido',
        service,
        amount,
        currency,
        eq_usd: eqUSD,
        method
    };

    if (isConnected) {
        await supabase.from('payments').insert([pData]);
    }

    payments.unshift({
        id: Date.now().toString(),
        studentName: pData.student_name,
        service, amount, currency, eqUSD, method,
        date: new Date().toLocaleDateString('es-VE'),
        timestamp: Date.now()
    });

    saveToLocal();
    paymentForm.reset();
    updatePaymentSummary();
    showPage('dashboard');
    alert('Pago registrado');
};

// --- POP SALES ---
function initPopSales() {
    document.querySelectorAll('.buy-pop').forEach(btn => {
        btn.onclick = async () => {
            const item = btn.dataset.item;
            const price = parseFloat(btn.dataset.price);
            const pData = {
                student_name: 'Venta Directa',
                service: `POP: ${item}`,
                amount: price,
                currency: 'USD',
                eq_usd: price,
                method: 'Efectivo'
            };

            if (isConnected) await supabase.from('payments').insert([pData]);

            payments.unshift({
                id: Date.now().toString(),
                studentName: 'Venta Directa',
                service: pData.service,
                amount: price,
                currency: 'USD',
                eqUSD: price,
                method: 'Efectivo',
                date: new Date().toLocaleDateString('es-VE'),
                timestamp: Date.now()
            });

            saveToLocal();
            updateDashboardStats();
            alert(`Venta de ${item} registrada.`);
        };
    });
}

// --- STATS ---
function updateDashboardStats() {
    const totalUSD = payments.reduce((acc, p) => acc + p.eqUSD, 0);
    const totalBS = totalUSD * currentRate;
    const popSales = payments.filter(p => p.service.includes('POP')).reduce((acc, p) => acc + p.eqUSD, 0);

    document.getElementById('stat-total-income').innerText = `$ ${totalUSD.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
    document.getElementById('stat-total-income-bs').innerText = `${totalBS.toLocaleString('es-VE', {minimumFractionDigits: 2})} BS`;
    document.getElementById('stat-active-students').innerText = students.filter(s => s.active).length;
    document.getElementById('stat-pop-sales').innerText = `$ ${popSales.toFixed(2)}`;
    
    const day = new Date().getDay();
    document.querySelectorAll('.day-dot').forEach((dot, idx) => {
        if ((idx === 0 && day === 1) || (idx === 1 && day === 2)) {
            dot.style.boxShadow = "0 0 20px 5px currentColor";
            dot.style.transform = "scale(1.3)";
        } else {
            dot.style.boxShadow = "none";
            dot.style.transform = "scale(1)";
        }
    });

    renderRecentPayments();
}

function renderRecentPayments() {
    const tbody = document.getElementById('recent-payments-body');
    const recent = payments.slice(0, 8);
    tbody.innerHTML = recent.length ? recent.map(p => `
        <tr>
            <td>${p.studentName}</td>
            <td>${p.service}</td>
            <td><strong>${p.amount} ${p.currency}</strong></td>
            <td>${p.date}</td>
            <td><span class="status-badge status-paid">Listo</span></td>
        </tr>
    `).join('') : '<tr><td colspan="5">Sin datos</td></tr>';
}

function saveToLocal() {
    localStorage.setItem('academy_students', JSON.stringify(students));
    localStorage.setItem('academy_payments', JSON.stringify(payments));
    localStorage.setItem('academy_rate', currentRate);
}

globalRateInput.onchange = async (e) => {
    currentRate = parseFloat(e.target.value) || 1.0;
    saveToLocal();
    if (isConnected) {
        await supabase.from('app_settings').upsert({ key: 'usd_rate', value: currentRate.toString() });
    }
    updateDashboardStats();
};
