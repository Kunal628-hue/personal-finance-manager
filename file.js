// ===== Application State =====
let transactions = [];
let budgetLimits = {};
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
let reportHistoryChart = null;
let reportCategoryChart = null;

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

    if (reportHistoryChart) {
        reportHistoryChart.options.scales.x.ticks.color = textColor;
        reportHistoryChart.options.scales.y.ticks.color = textColor;
        reportHistoryChart.options.scales.y.grid.color = gridColor;
        reportHistoryChart.update();
    }

    if (reportCategoryChart) {
        reportCategoryChart.options.plugins.legend.labels.color = textColor;
        reportCategoryChart.update();
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

// ===== Budget Management =====
function loadBudgetLimits() {
    const storageKey = getUserStorageKey('budgetLimits');
    const stored = localStorage.getItem(storageKey);

    // Default budgets if not set
    const defaultBudgets = {
        'Food': 15000,
        'Shopping': 20000,
        'Transportation': 5000,
        'Bills': 10000,
        'Entertainment': 8000,
        'Healthcare': 5000,
        'Salary': 0, // Income categories usually don't have expense budgets, but keeping for completeness if needed
        'Freelance': 0,
        'Investment': 10000,
        'Other': 5000
    };

    budgetLimits = stored ? JSON.parse(stored) : defaultBudgets;
}

function saveBudgetLimits() {
    const storageKey = getUserStorageKey('budgetLimits');
    localStorage.setItem(storageKey, JSON.stringify(budgetLimits));
}

function openBudgetModal() {
    const modal = document.getElementById('budgetModal');
    const container = document.getElementById('budgetInputsContainer');

    if (modal && container) {
        // Generate inputs for each category
        const categories = [
            'Food', 'Shopping', 'Transportation', 'Bills',
            'Entertainment', 'Healthcare', 'Investment', 'Other'
        ];

        container.innerHTML = categories.map(cat => `
            <div class="form-group">
                <label for="budget_${cat}">${cat} Budget (₹)</label>
                <input type="number" id="budget_${cat}" name="${cat}" 
                    value="${budgetLimits[cat] || 0}" min="0" step="100">
            </div>
        `).join('');

        modal.classList.add('active');
    }
}

function closeBudgetModal() {
    const modal = document.getElementById('budgetModal');
    if (modal) modal.classList.remove('active');
}

function handleBudgetSubmit(e) {
    if (e) e.preventDefault();

    const container = document.getElementById('budgetInputsContainer');
    if (!container) return;

    const inputs = container.querySelectorAll('input');
    inputs.forEach(input => {
        const category = input.name;
        const value = parseFloat(input.value) || 0;
        budgetLimits[category] = value;
    });

    saveBudgetLimits();
    renderBudget();
    closeBudgetModal();
}

// ===== Data Management =====
function resetData() {
    if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
        // Clear all local storage related to app
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.includes('transactions') || key.includes('budgetLimits') || key.includes('savingsWallet') || key.includes('theme')) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key));

        // Reload page to reset state
        window.location.reload();
    }
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
            const cat = t.category;
            categoryExpenses[cat] = (categoryExpenses[cat] || 0) + t.amount;
        });

    // Use dynamic budgetLimits
    // Filter out categories with 0 budget unless there is spending
    const activeCategories = Object.keys(budgetLimits).filter(cat =>
        budgetLimits[cat] > 0 || (categoryExpenses[cat] && categoryExpenses[cat] > 0)
    );

    if (activeCategories.length === 0) {
        budgetCategories.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-chart-pie"></i>
                <p>No budget categories set</p>
                <button class="btn btn-primary btn-sm" onclick="openBudgetModal()" style="margin-top: 1rem;">
                    Set Budgets
                </button>
            </div>
        `;
        return;
    }

    budgetCategories.innerHTML = activeCategories.map(category => {
        const spent = categoryExpenses[category] || 0;
        const limit = budgetLimits[category] || 0;

        let percentage = limit > 0 ? (spent / limit) * 100 : (spent > 0 ? 100 : 0);
        percentage = Math.min(100, percentage);

        // Colors based on percentage
        let color = '#10b981'; // Green
        if (percentage > 80) color = '#f59e0b'; // Orange
        if (percentage >= 100) color = '#ef4444'; // Red

        // If limit is 0 but spent > 0, show red
        if (limit === 0 && spent > 0) color = '#ef4444';

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

// ===== Report Management =====
function getReportPeriodDates(period) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let startDate, endDate;

    switch (period) {
        case 'thisMonth':
            startDate = new Date(currentYear, currentMonth, 1);
            endDate = new Date(currentYear, currentMonth + 1, 0);
            break;
        case 'lastMonth':
            startDate = new Date(currentYear, currentMonth - 1, 1);
            endDate = new Date(currentYear, currentMonth, 0);
            break;
        case 'thisYear':
            startDate = new Date(currentYear, 0, 1);
            endDate = new Date(currentYear, 11, 31);
            break;
        case 'lastYear':
            startDate = new Date(currentYear - 1, 0, 1);
            endDate = new Date(currentYear - 1, 11, 31);
            break;
        case 'all':
            startDate = new Date(0); // Beginning of time
            endDate = new Date(8640000000000000); // End of time
            break;
        default:
            startDate = new Date(currentYear, currentMonth, 1);
            endDate = new Date(currentYear, currentMonth + 1, 0);
    }

    // Set end of day for endDate
    if (endDate) endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
}

function renderReports() {
    const reportPeriod = document.getElementById('reportPeriod');
    const selectedPeriod = reportPeriod ? reportPeriod.value : 'thisMonth';
    const { startDate, endDate } = getReportPeriodDates(selectedPeriod);

    // Filter transactions for the report
    const reportTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= startDate && tDate <= endDate;
    });

    // Calculate totals
    const totals = reportTransactions.reduce((acc, t) => {
        if (t.type === 'income') {
            acc.income += t.amount;
        } else if (t.type === 'expense') {
            acc.expenses += t.amount;
        }
        return acc;
    }, { income: 0, expenses: 0 });

    const savings = totals.income - totals.expenses;

    // Update Text
    const reportIncome = document.getElementById('reportIncome');
    const reportExpense = document.getElementById('reportExpense');
    const reportSavings = document.getElementById('reportSavings');

    if (reportIncome) reportIncome.textContent = formatCurrency(totals.income);
    if (reportExpense) reportExpense.textContent = formatCurrency(totals.expenses);
    if (reportSavings) reportSavings.textContent = formatCurrency(savings);

    // Update Charts
    updateReportCharts(reportTransactions, selectedPeriod);
}

function initReportCharts() {
    const historyCtx = document.getElementById('reportHistoryChart');
    const categoryCtx = document.getElementById('reportCategoryChart');

    if (!historyCtx || !categoryCtx) return;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#e5e7eb' : '#1f2937';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    // History Chart (Bar)
    reportHistoryChart = new Chart(historyCtx, {
        type: 'bar',
        data: {
            labels: ['Income', 'Expenses'],
            datasets: [{
                label: 'Amount',
                data: [0, 0],
                backgroundColor: ['#10B981', '#EF4444'],
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return formatCurrency(context.raw);
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: textColor },
                    grid: { display: false }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: textColor,
                        callback: function (value) { return '₹' + value.toLocaleString(); }
                    },
                    grid: { color: gridColor }
                }
            }
        }
    });

    // Category Chart (Doughnut)
    reportCategoryChart = new Chart(categoryCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
                    '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: textColor, usePointStyle: true }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percent = Math.round((value / total) * 100);
                            return `${context.label}: ${formatCurrency(value)} (${percent}%)`;
                        }
                    }
                }
            }
        }
    });
}

function updateReportCharts(transactions, period) {
    if (!reportHistoryChart || !reportCategoryChart) {
        initReportCharts();
        if (!reportHistoryChart || !reportCategoryChart) return;
    }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#e5e7eb' : '#1f2937';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    // Update Theme
    reportHistoryChart.options.scales.x.ticks.color = textColor;
    reportHistoryChart.options.scales.y.ticks.color = textColor;
    reportHistoryChart.options.scales.y.grid.color = gridColor;
    reportCategoryChart.options.plugins.legend.labels.color = textColor;

    // 1. Update Income vs Expense Chart
    const totals = transactions.reduce((acc, t) => {
        if (t.type === 'income') acc.income += t.amount;
        else if (t.type === 'expense') acc.expenses += t.amount;
        return acc;
    }, { income: 0, expenses: 0 });

    reportHistoryChart.data.datasets[0].data = [totals.income, totals.expenses];
    reportHistoryChart.update();

    // 2. Update Category Chart
    const categoryData = {};
    transactions.forEach(t => {
        if (t.type === 'expense') {
            const cat = t.category || 'Uncategorized';
            categoryData[cat] = (categoryData[cat] || 0) + t.amount;
        }
    });

    reportCategoryChart.data.labels = Object.keys(categoryData);
    reportCategoryChart.data.datasets[0].data = Object.values(categoryData);
    reportCategoryChart.update();
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
                        label: function (context) {
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
                        callback: function (value) {
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
                        label: function (context) {
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
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        if (sidebar) sidebar.classList.remove('active');
        if (sidebarOverlay) sidebarOverlay.classList.remove('active');
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
    loadBudgetLimits(); // Load budgets

    // Initialize charts
    setTimeout(() => {
        initCharts();
    }, 100);

    // Set up event listeners
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Budget Listeners
    const createBudgetBtn = document.getElementById('createBudgetBtn');
    const closeBudgetModalBtn = document.getElementById('closeBudgetModal');
    const budgetForm = document.getElementById('budgetForm');
    const budgetModal = document.getElementById('budgetModal');

    if (createBudgetBtn) createBudgetBtn.addEventListener('click', openBudgetModal);
    if (closeBudgetModalBtn) closeBudgetModalBtn.addEventListener('click', closeBudgetModal);
    if (budgetForm) budgetForm.addEventListener('submit', handleBudgetSubmit);
    if (budgetModal) {
        budgetModal.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) closeBudgetModal();
        });
    }

    // Reset Data Listener
    const resetDataBtn = document.getElementById('resetDataBtn');
    if (resetDataBtn) resetDataBtn.addEventListener('click', resetData);

    // ===== Calculator Logic =====
    const calcToggle = document.getElementById('calcToggle');
    const calculatorModal = document.getElementById('calculatorModal');
    const closeCalcModal = document.getElementById('closeCalcModal');
    const calcDisplay = document.getElementById('calcDisplay');
    const calcButtons = document.querySelectorAll('.btn-calc');

    if (calcToggle) {
        calcToggle.addEventListener('click', () => {
            if (calculatorModal) {
                calculatorModal.classList.add('active');
                if (calcDisplay) calcDisplay.value = '0';
            }
        });
    }

    if (closeCalcModal) {
        closeCalcModal.addEventListener('click', () => {
            if (calculatorModal) calculatorModal.classList.remove('active');
        });
    }

    // Calculator button handlers
    let currentInput = '0';
    let previousInput = '';
    let operation = null;
    let shouldResetScreen = false;
    let calculationDone = false;

    // Helper to format number for display (optional, can be enhanced)
    function updateDisplay() {
        if (calcDisplay) {
            calcDisplay.value = currentInput;
        }
    }

    calcButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (!calcDisplay) return;

            const action = button.dataset.action;
            const num = button.dataset.num;

            // Handle Number Input
            if (num !== undefined) {
                if (currentInput === 'Error') {
                    currentInput = '0';
                    shouldResetScreen = false;
                }

                if (calculationDone && !operation) {
                    // Start fresh if typing number after calculation without operator
                    currentInput = num === '.' ? '0.' : num;
                    calculationDone = false;
                } else if (currentInput === '0' || shouldResetScreen) {
                    currentInput = num === '.' ? '0.' : num;
                    shouldResetScreen = false;
                } else {
                    if (num === '.' && currentInput.includes('.')) return; // Prevent multiple decimals
                    currentInput += num;
                }
                updateDisplay();
                return;
            }

            // Handle All Clear
            if (action === 'all-clear') {
                currentInput = '0';
                previousInput = '';
                operation = null;
                shouldResetScreen = false;
                calculationDone = false;
                updateDisplay();
                return;
            }

            // Handle Delete
            if (action === 'delete') {
                if (currentInput === 'Error') {
                    currentInput = '0';
                } else {
                    currentInput = currentInput.toString().slice(0, -1);
                    if (currentInput === '' || currentInput === '-') currentInput = '0';
                }
                updateDisplay();
                return;
            }

            // Handle Operators
            if (['add', 'subtract', 'multiply', 'divide', '%'].includes(action)) {
                if (operation !== null && !shouldResetScreen) {
                    evaluate();
                }
                previousInput = currentInput;
                operation = action;
                shouldResetScreen = true;
                calculationDone = false;
                return;
            }

            // Handle Equals
            if (action === 'calculate') {
                if (operation === null) return;
                evaluate();
                operation = null;
                shouldResetScreen = true;
                calculationDone = true;
                previousInput = ''; // Clear previous input after calculation
            }
        });
    });

    function evaluate() {
        let computation;
        const prev = parseFloat(previousInput);
        const current = parseFloat(currentInput);

        if (isNaN(prev) || isNaN(current)) return;

        switch (operation) {
            case 'add':
                computation = prev + current;
                break;
            case 'subtract':
                computation = prev - current;
                break;
            case 'multiply':
                computation = prev * current;
                break;
            case 'divide':
                if (current === 0) {
                    currentInput = 'Error';
                    updateDisplay();
                    shouldResetScreen = true;
                    operation = null;
                    return;
                }
                computation = prev / current;
                break;
            case '%':
                computation = prev % current;
                break;
            default:
                return;
        }

        // Round to avoid floating point errors (e.g. 0.1 + 0.2)
        computation = Math.round(computation * 100000000) / 100000000;

        currentInput = computation.toString();
        updateDisplay();
    }

    // Close modal when clicking outside
    if (calculatorModal) {
        calculatorModal.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                calculatorModal.classList.remove('active');
            }
        });
    }

    // ===== Export to CSV Logic =====
    const exportBtn = document.getElementById('exportBtn');

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            if (!transactions || transactions.length === 0) {
                alert('No transactions to export');
                return;
            }

            // Define CSV headers
            const headers = ['Date', 'Description', 'Type', 'Category', 'Amount'];

            // Format data rows
            const rows = transactions.map(t => [
                t.date,
                `"${t.desc.replace(/"/g, '""')}"`, // Escape quotes
                t.type,
                t.category,
                t.amount
            ]);

            // Combine headers and rows
            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.join(','))
            ].join('\n');

            // Create download link
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', 'transactions_export.csv');
            link.style.visibility = 'hidden';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
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
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    function toggleSidebar() {
        if (sidebar) sidebar.classList.toggle('active');
        if (sidebarOverlay) sidebarOverlay.classList.toggle('active');
    }

    function closeSidebar() {
        if (sidebar) sidebar.classList.remove('active');
        if (sidebarOverlay) sidebarOverlay.classList.remove('active');
    }

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', toggleSidebar);
    }

    if (menuToggle) {
        menuToggle.addEventListener('click', closeSidebar);
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Report Listeners
    const reportPeriodSelect = document.getElementById('reportPeriod');
    if (reportPeriodSelect) {
        reportPeriodSelect.addEventListener('change', () => {
            renderReports();
        });
    }

    const exportReportBtn = document.getElementById('exportReportBtn');
    if (exportReportBtn) {
        exportReportBtn.addEventListener('click', () => {
            const reportPeriod = document.getElementById('reportPeriod');
            const selectedPeriod = reportPeriod ? reportPeriod.value : 'thisMonth';
            const { startDate, endDate } = getReportPeriodDates(selectedPeriod);

            // Filter transactions for the report
            const reportTransactions = transactions.filter(t => {
                const tDate = new Date(t.date);
                return tDate >= startDate && tDate <= endDate;
            });

            if (!reportTransactions || reportTransactions.length === 0) {
                alert('No transactions to export for this period');
                return;
            }

            const headers = ['Date', 'Description', 'Type', 'Category', 'Amount'];
            const rows = reportTransactions.map(t => [
                t.date,
                `"${t.desc.replace(/"/g, '""')}"`,
                t.type,
                t.category,
                t.amount
            ]);

            const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `report_${selectedPeriod}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
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
