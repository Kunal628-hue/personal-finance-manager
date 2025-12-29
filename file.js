// ===== Application State =====
let transactions = [];
let currentFilter = 'all';
let currentPage = 'dashboard';
let currentUser = null;

// ===== DOM Elements =====
let form;
let transactionList;
let allTransactionList;
let balanceEl;
let totalIncomeEl;
let totalExpenseEl;
let savingsEl;
let savingsWalletEl;
let themeToggle;
let addTransactionBtn;
let addTransactionBtn2;
let closeModal;
let modal;
let searchInput;
let transactionSearch;
let monthlyChart = null;
let categoryChart = null;

// ===== Authentication =====
function checkAuthentication() {
    // Wait for auth.js to load
    if (typeof window.auth === 'undefined') {
        setTimeout(checkAuthentication, 100);
        return;
    }
    
    if (!window.auth.isLoggedIn()) {
        window.location.href = 'login.html';
        return false;
    }
    
    currentUser = window.auth.getCurrentUser();
    updateUserProfile();
    return true;
}

function updateUserProfile() {
    if (!currentUser) return;
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === currentUser);
    
    if (user) {
        const userNameEl = document.querySelector('.user-info h4');
        if (userNameEl) {
            userNameEl.textContent = user.name || 'User';
        }
    }
}

function logout() {
    if (window.auth) {
        window.auth.clearCurrentUser();
    }
    window.location.href = 'login.html';
}

// Get user-specific storage key
function getUserStorageKey(key) {
    return currentUser ? `${key}_${currentUser}` : key;
}

// ===== Savings Wallet Management =====
function getSavingsWallet() {
    const storageKey = getUserStorageKey('savingsWallet');
    const stored = localStorage.getItem(storageKey);
    return stored ? parseFloat(stored) : 0;
}

function saveSavingsWallet(amount) {
    const storageKey = getUserStorageKey('savingsWallet');
    localStorage.setItem(storageKey, amount.toString());
}

function addToSavingsWallet(amount) {
    const current = getSavingsWallet();
    const newAmount = current + amount;
    saveSavingsWallet(newAmount);
    return newAmount;
}

function deductFromSavingsWallet(amount) {
    const current = getSavingsWallet();
    const newAmount = Math.max(0, current - amount);
    saveSavingsWallet(newAmount);
    return newAmount;
}

// ===== Theme Management =====
const THEME_KEY = 'preferred-theme';
const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    
    if (themeToggle) {
    const moonIcon = themeToggle.querySelector('.fa-moon');
    const sunIcon = themeToggle.querySelector('.fa-sun');
    
        if (moonIcon && sunIcon) {
    if (newTheme === 'dark') {
        moonIcon.style.display = 'none';
        sunIcon.style.display = 'block';
    } else {
        moonIcon.style.display = 'block';
        sunIcon.style.display = 'none';
            }
        }
    }
    
    updateChartThemes();
}

function updateChartThemes() {
    if (!monthlyChart && !categoryChart) return;
    
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#e5e7eb' : '#1f2937';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    if (monthlyChart) {
        monthlyChart.options.scales.x.ticks.color = textColor;
        monthlyChart.options.scales.y.ticks.color = textColor;
        monthlyChart.options.scales.x.grid.color = gridColor;
        monthlyChart.options.scales.y.grid.color = gridColor;
        monthlyChart.update();
    }
    
    if (categoryChart) {
        categoryChart.options.plugins.legend.labels.color = textColor;
        categoryChart.update();
    }
}

function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const prefersDark = prefersDarkScheme.matches;
    
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (prefersDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    
    if (!themeToggle) return;
    
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const moonIcon = themeToggle.querySelector('.fa-moon');
    const sunIcon = themeToggle.querySelector('.fa-sun');
    
    if (moonIcon && sunIcon) {
    if (currentTheme === 'dark') {
        moonIcon.style.display = 'none';
        sunIcon.style.display = 'block';
    } else {
        moonIcon.style.display = 'block';
        sunIcon.style.display = 'none';
    }
}
}

// ===== Date Management =====
function updateCurrentDate() {
    const dateEl = document.getElementById('currentDate');
    if (dateEl) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        dateEl.textContent = new Date().toLocaleDateString('en-US', options);
    }
}

// ===== Transaction Management =====
function loadTransactions() {
    const storageKey = getUserStorageKey('transactions');
    const stored = localStorage.getItem(storageKey);
    transactions = stored ? JSON.parse(stored) : [];
    // Initialize with sample data if empty
    if (transactions.length === 0) {
        initializeSampleData();
    }
}

function saveTransactions() {
    const storageKey = getUserStorageKey('transactions');
    localStorage.setItem(storageKey, JSON.stringify(transactions));
}

function initializeSampleData() {
    const today = new Date();
    const sampleTransactions = [
        {
            id: Date.now() - 86400000 * 5,
            desc: 'Salary',
            amount: 50000,
            type: 'income',
            category: 'Salary',
            date: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
        },
        {
            id: Date.now() - 86400000 * 4,
            desc: 'Grocery Shopping',
            amount: 2500,
            type: 'expense',
            category: 'Food',
            date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 4).toISOString().split('T')[0]
        },
        {
            id: Date.now() - 86400000 * 3,
            desc: 'Uber Ride',
            amount: 350,
            type: 'expense',
            category: 'Transportation',
            date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3).toISOString().split('T')[0]
        },
        {
            id: Date.now() - 86400000 * 2,
            desc: 'Netflix Subscription',
            amount: 499,
            type: 'expense',
            category: 'Entertainment',
            date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2).toISOString().split('T')[0]
        },
        {
            id: Date.now() - 86400000,
            desc: 'Freelance Project',
            amount: 15000,
            type: 'income',
            category: 'Freelance',
            date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1).toISOString().split('T')[0]
        }
    ];
    transactions = sampleTransactions;
    saveTransactions();
}

function addTransaction(transaction) {
    transaction.id = Date.now();
    
    // Check if "Save to Wallet" is checked
    const saveToWallet = document.getElementById('saveToWallet')?.checked || false;
    
    if (saveToWallet) {
        // Mark transaction as savings transfer
        transaction.isSavings = true;
        transaction.desc = transaction.desc + ' (Saved to Wallet)';
        transaction.type = 'expense'; // Treat as expense to deduct from balance
        transaction.category = 'Savings';
        
        // Add to savings wallet
        addToSavingsWallet(transaction.amount);
    }
    
    transactions.push(transaction);
    saveTransactions();
    render();
    updateCharts();
    closeTransactionModal();
}

function deleteTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    
    if (transaction && transaction.isSavings) {
        // If deleting a savings transaction, also deduct from savings wallet
        deductFromSavingsWallet(transaction.amount);
    }
    
    transactions = transactions.filter(t => t.id !== id);
    saveTransactions();
    render();
    updateCharts();
}

function getFilteredTransactions() {
    let filtered = [...transactions];
    
    // Apply type filter
    if (currentFilter !== 'all') {
        filtered = filtered.filter(t => {
            // For savings transactions, show them when filtering expenses
            if (t.isSavings && currentFilter === 'expense') {
                return true;
            }
            return t.type === currentFilter;
        });
    }
    
    // Apply search filter
    const searchTerm = (searchInput?.value || transactionSearch?.value || '').toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(t => 
            t.desc.toLowerCase().includes(searchTerm) ||
            t.category.toLowerCase().includes(searchTerm)
        );
    }
    
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// ===== Formatting Functions =====
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    }).format(amount);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-IN', options);
}

// ===== UI Rendering =====
function render() {
    renderSummary();
    renderTransactions();
    renderAllTransactions();
    renderBudget();
    renderReports();
}

function renderSummary() {
    const totals = transactions.reduce((acc, t) => {
        if (t.type === 'income') {
            acc.income += t.amount;
        } else if (t.type === 'expense') {
            acc.expenses += t.amount;
        }
        return acc;
    }, { income: 0, expenses: 0 });
    
    const balance = totals.income - totals.expenses;
    const savingsWallet = getSavingsWallet();
    const savingsGoal = totals.income * 0.3; // 30% savings goal
    const savingsPercentage = savingsGoal > 0 ? Math.min(100, (savingsWallet / savingsGoal) * 100) : 0;
    
    if (balanceEl) balanceEl.textContent = formatCurrency(balance);
    if (totalIncomeEl) totalIncomeEl.textContent = formatCurrency(totals.income);
    if (totalExpenseEl) totalExpenseEl.textContent = formatCurrency(totals.expenses);
    if (savingsWalletEl) savingsWalletEl.textContent = formatCurrency(savingsWallet);
    
    const savingsProgress = document.getElementById('savingsProgress');
    const savingsMeta = document.getElementById('savingsMeta');
    if (savingsProgress) {
        savingsProgress.style.width = `${savingsPercentage}%`;
    }
    if (savingsMeta) {
        savingsMeta.textContent = `Total saved: ${formatCurrency(savingsWallet)}`;
    }
}

function renderTransactions() {
    if (!transactionList) return;
    
    const filtered = getFilteredTransactions().slice(0, 5); // Show only 5 recent
    
    if (filtered.length === 0) {
        transactionList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <p>No transactions found</p>
            </div>
        `;
        return;
    }
    
    transactionList.innerHTML = filtered.map(t => {
        const isSavingsTransfer = t.isSavings && t.desc.includes('Saved to Wallet');
        const displayType = isSavingsTransfer ? 'savings' : t.type;
        const icon = isSavingsTransfer ? '<i class="fas fa-piggy-bank" style="margin-right: 0.25rem;"></i>' : '';
        
        return `
        <li class="transaction-item ${displayType}" data-id="${t.id}">
            <div class="transaction-info">
                <div class="transaction-title">${icon}${t.desc}</div>
                <div class="transaction-details">
                    <span class="transaction-category">${t.category}</span>
                    <span class="transaction-date">${formatDate(t.date)}</span>
                    </div>
                </div>
            <div class="transaction-amount">
                ${t.type === 'expense' ? '-' : '+'}${formatCurrency(t.amount)}
                <button onclick="deleteTransaction(${t.id})" class="btn-icon" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </li>
    `}).join('');
}

function renderAllTransactions() {
    if (!allTransactionList) return;
    
    const filtered = getFilteredTransactions();
    
    if (filtered.length === 0) {
        allTransactionList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <p>No transactions found</p>
            </div>
        `;
        return;
    }
    
    allTransactionList.innerHTML = filtered.map(t => {
        const isSavingsTransfer = t.isSavings && t.desc.includes('Saved to Wallet');
        const displayType = isSavingsTransfer ? 'savings' : t.type;
        const icon = isSavingsTransfer ? '<i class="fas fa-piggy-bank" style="margin-right: 0.25rem;"></i>' : '';
        
        return `
        <li class="transaction-item ${displayType}" data-id="${t.id}">
                    <div class="transaction-info">
                <div class="transaction-title">${icon}${t.desc}</div>
                        <div class="transaction-details">
                    <span class="transaction-category">${t.category}</span>
                    <span class="transaction-date">${formatDate(t.date)}</span>
                        </div>
                    </div>
                    <div class="transaction-amount">
                ${t.type === 'expense' ? '-' : '+'}${formatCurrency(t.amount)}
                <button onclick="deleteTransaction(${t.id})" class="btn-icon" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </li>
    `}).join('');
}

function renderBudget() {
    const budgetCategories = document.getElementById('budgetCategories');
    if (!budgetCategories) return;
    
    // Calculate expenses by category for current month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const categoryExpenses = {};
    transactions
        .filter(t => {
            const tDate = new Date(t.date);
            return t.type === 'expense' && 
                   tDate.getMonth() === currentMonth && 
                   tDate.getFullYear() === currentYear;
        })
        .forEach(t => {
            categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + t.amount;
        });
    
    // Budget limits (example)
    const budgetLimits = {
        'Shopping': 20000,
        'Food': 15000,
        'Transportation': 5000,
        'Entertainment': 8000,
        'Bills': 10000,
        'Healthcare': 5000
    };
    
    const categories = Object.keys(budgetLimits);
    
    if (categories.length === 0) {
        budgetCategories.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-chart-pie"></i>
                <p>No budget categories set</p>
            </div>
        `;
        return;
    }
    
    budgetCategories.innerHTML = categories.map(category => {
        const spent = categoryExpenses[category] || 0;
        const limit = budgetLimits[category];
        const percentage = Math.min(100, (spent / limit) * 100);
        const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
        const color = colors[categories.indexOf(category) % colors.length];
        
        return `
            <div class="budget-category">
                <div class="category-info">
                    <span class="category-name">${category}</span>
                    <span class="category-amount">${formatCurrency(spent)} / ${formatCurrency(limit)}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress" style="width: ${percentage}%; background: ${color};"></div>
                </div>
            </div>
        `;
    }).join('');
}

function renderReports() {
    const reportIncome = document.getElementById('reportIncome');
    const reportExpense = document.getElementById('reportExpense');
    const reportSavings = document.getElementById('reportSavings');
    
    const totals = transactions.reduce((acc, t) => {
        if (t.type === 'income') {
            acc.income += t.amount;
        } else {
            acc.expenses += t.amount;
        }
        return acc;
    }, { income: 0, expenses: 0 });
    
    const savings = totals.income - totals.expenses;
    
    if (reportIncome) reportIncome.textContent = formatCurrency(totals.income);
    if (reportExpense) reportExpense.textContent = formatCurrency(totals.expenses);
    if (reportSavings) reportSavings.textContent = formatCurrency(savings);
}

// ===== Chart Management =====
function initCharts() {
    const monthlyCtx = document.getElementById('monthlyChart');
    const categoryCtx = document.getElementById('categoryChart');
    
    if (!monthlyCtx || !categoryCtx) return;
    
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#e5e7eb' : '#1f2937';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    // Monthly chart
    monthlyChart = new Chart(monthlyCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Income',
                    backgroundColor: '#10B981',
                    data: [],
                    borderRadius: 4
                },
                {
                    label: 'Expenses',
                    backgroundColor: '#EF4444',
                    data: [],
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 16,
                        color: textColor
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: textColor
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: gridColor
                    },
                    ticks: {
                        color: textColor,
                        callback: function(value) {
                            return '₹' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
    
    // Category chart
    categoryChart = new Chart(categoryCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
                    '#EC4899', '#06B6D4', '#F97316', '#8B5CF6', '#EC4899'
                ],
                borderWidth: 0,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        usePointStyle: true,
                        padding: 16,
                        boxWidth: 8,
                        color: textColor
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
    
    updateCharts();
}

function updateCharts() {
    if (!monthlyChart || !categoryChart) return;
    
    // Update monthly chart
    const months = [];
    const monthlyIncome = [];
    const monthlyExpenses = [];
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Get period selector value
    const monthlyPeriodEl = document.getElementById('monthlyPeriod');
    const periodMonths = monthlyPeriodEl ? parseInt(monthlyPeriodEl.value) || 6 : 6;
    
    for (let i = periodMonths - 1; i >= 0; i--) {
        const targetDate = new Date(currentYear, currentMonth - i, 1);
        const monthYear = targetDate.toLocaleString('default', { month: 'short', year: '2-digit' });
        months.push(monthYear);
        
        const firstDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
        const lastDay = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
        lastDay.setHours(23, 59, 59, 999);
        
        let income = 0;
        let expenses = 0;
        
        transactions.forEach(t => {
            if (!t.date) return;
            const transactionDate = new Date(t.date);
            transactionDate.setHours(12, 0, 0, 0);
            
            if (transactionDate >= firstDay && transactionDate <= lastDay) {
                const amount = parseFloat(t.amount) || 0;
                if (t.type === 'income') {
                    income += amount;
                } else if (t.type === 'expense') {
                    expenses += amount;
                }
            }
        });
        
        monthlyIncome.push(income);
        monthlyExpenses.push(expenses);
    }
    
        monthlyChart.data.labels = months;
        monthlyChart.data.datasets[0].data = monthlyIncome;
        monthlyChart.data.datasets[1].data = monthlyExpenses;
        monthlyChart.update();
    
    // Update category chart
    const categoryPeriodEl = document.getElementById('categoryPeriod');
    const periodType = categoryPeriodEl ? categoryPeriodEl.value || 'month' : 'month';
    
    const categoryData = {};
    const nowDate = new Date();
    const filterYear = nowDate.getFullYear();
    const filterMonth = nowDate.getMonth();
    
    transactions
        .filter(t => {
            if (t.type !== 'expense') return false;
            
            if (periodType === 'year') {
                const tDate = new Date(t.date);
                return tDate.getFullYear() === filterYear;
            } else {
                // month
                const tDate = new Date(t.date);
                return tDate.getMonth() === filterMonth && tDate.getFullYear() === filterYear;
            }
        })
        .forEach(t => {
            const category = t.category || 'Uncategorized';
            categoryData[category] = (categoryData[category] || 0) + (parseFloat(t.amount) || 0);
        });
    
    const categories = Object.keys(categoryData);
    const amounts = Object.values(categoryData);
    
        categoryChart.data.labels = categories;
        categoryChart.data.datasets[0].data = amounts;
        categoryChart.update();
    }

// ===== Modal Management =====
function openTransactionModal() {
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        const dateInput = document.getElementById('date');
        if (dateInput) {
            dateInput.valueAsDate = new Date();
        }
    }
}

function closeTransactionModal() {
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        if (form) form.reset();
    }
}

// ===== Navigation =====
function navigateToPage(page) {
    currentPage = page;
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === page) {
            item.classList.add('active');
        }
    });
    
    // Show/hide pages
    document.querySelectorAll('.page').forEach(p => {
        p.classList.add('hidden');
    });
    
    const targetPage = document.getElementById(`${page}-page`);
    if (targetPage) {
        targetPage.classList.remove('hidden');
    }
    
    // Update page title
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = page.charAt(0).toUpperCase() + page.slice(1);
    }
    
    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.remove('active');
    }
}

// ===== Search Functionality =====
function handleSearch(event) {
    // Just re-render using the centralized filtering logic in getFilteredTransactions
    // which already reads the current value of searchInput/transactionSearch.
    render();
}

function handleTransactionSearch(event) {
    // Same behavior for the transactions-page search bar
    render();
}

// ===== Event Handlers =====
function handleFormSubmit(e) {
    e.preventDefault();
    
    const transaction = {
        desc: document.getElementById('desc').value.trim(),
        amount: parseFloat(document.getElementById('amount').value),
        type: document.getElementById('type').value,
        category: document.getElementById('category').value,
        date: document.getElementById('date').value
    };
    
    if (!transaction.desc || isNaN(transaction.amount) || transaction.amount <= 0) {
        alert('Please enter a valid description and amount');
        return;
    }
    
    const saveToWallet = document.getElementById('saveToWallet')?.checked || false;
    
    // Validation: Can't save to wallet if balance is insufficient
    if (saveToWallet) {
        const currentBalance = transactions.reduce((acc, t) => {
            if (t.type === 'income') acc += t.amount;
            else if (t.type === 'expense') acc -= t.amount;
            return acc;
        }, 0);
        
        if (currentBalance < transaction.amount) {
            alert('Insufficient balance to save to wallet. Your current balance is ' + formatCurrency(currentBalance));
            return;
        }
    }
    
    addTransaction(transaction);
    
    // Reset checkbox
    const saveToWalletCheckbox = document.getElementById('saveToWallet');
    if (saveToWalletCheckbox) {
        saveToWalletCheckbox.checked = false;
    }
}

function handleFilterChange(filter) {
    currentFilter = filter;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        }
    });
    render();
}

// ===== Initialize Application =====
function initApp() {
    // Check authentication first
    if (!checkAuthentication()) {
        return;
    }
    
    // Get DOM elements
    form = document.getElementById('transactionForm');
    transactionList = document.getElementById('transactionList');
    allTransactionList = document.getElementById('allTransactionList');
    balanceEl = document.getElementById('balance');
    totalIncomeEl = document.getElementById('totalIncome');
    totalExpenseEl = document.getElementById('totalExpense');
    savingsEl = document.getElementById('savings');
    savingsWalletEl = document.getElementById('savingsWallet');
    themeToggle = document.getElementById('themeToggle');
    addTransactionBtn = document.getElementById('addTransactionBtn');
    addTransactionBtn2 = document.getElementById('addTransactionBtn2');
    closeModal = document.getElementById('closeModal');
    modal = document.getElementById('addTransactionModal');
    searchInput = document.getElementById('searchInput');
    transactionSearch = document.getElementById('transactionSearch');
    
    // Initialize theme
    initTheme();
    
    // Load data
    loadTransactions();
    
    // Initialize charts
    setTimeout(() => {
        initCharts();
    }, 100);
    
    // Set up event listeners
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    
    if (addTransactionBtn) {
        addTransactionBtn.addEventListener('click', openTransactionModal);
    }
    
    if (addTransactionBtn2) {
        addTransactionBtn2.addEventListener('click', openTransactionModal);
    }
    
    if (closeModal) {
        closeModal.addEventListener('click', closeTransactionModal);
    }
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                closeTransactionModal();
            }
        });
    }
    
    // Filter buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            handleFilterChange(btn.dataset.filter);
        });
    });
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navigateToPage(item.dataset.page);
        });
    });
    
    // Search
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    if (transactionSearch) {
        transactionSearch.addEventListener('input', handleTransactionSearch);
    }
    
    // Chart period selectors
    const monthlyPeriod = document.getElementById('monthlyPeriod');
    if (monthlyPeriod) {
        monthlyPeriod.addEventListener('change', () => {
            updateCharts();
        });
    }
    
    const categoryPeriod = document.getElementById('categoryPeriod');
    if (categoryPeriod) {
        categoryPeriod.addEventListener('change', () => {
            updateCharts();
        });
    }
    
    // Mobile menu
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            if (sidebar) sidebar.classList.toggle('active');
        });
    }
    
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            if (sidebar) sidebar.classList.remove('active');
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Update date
    updateCurrentDate();
    
    // Initial render
    render();
    
    console.log('Application initialized successfully');
}

// Listen for system theme changes
prefersDarkScheme.addEventListener('change', (e) => {
    if (!localStorage.getItem(THEME_KEY)) {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        updateChartThemes();
    }
});

// Start the application
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Make deleteTransaction available globally
window.deleteTransaction = deleteTransaction;
