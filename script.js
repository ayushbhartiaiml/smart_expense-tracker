/**
 * Smart Expense Tracker - Client-side Application Logic
 * Pure Vanilla JavaScript (No frameworks, No backend)
 */

// ==========================================
// 1. Constants & Configuration
// ==========================================
const STORAGE_KEY = 'smart_expense_tracker_data';
const THEME_STORAGE_KEY = 'smart_expense_tracker_theme';

// Distinct category colors across the spectrum
const CATEGORY_COLORS = {
  Food: '#ef4444',    // Vibrant Coral Red
  Travel: '#0ea5e9',  // Vivid Ocean Sky Blue
  Study: '#10b981',   // Crisp Emerald Green
  Fun: '#f59e0b',     // Bright Amber Gold
  Other: '#8b5cf6'    // Electric Royal Purple
};

const CATEGORY_ICONS = {
  Food: '🍔',
  Travel: '🚌',
  Study: '📚',
  Fun: '🎮',
  Other: '💡'
};

// Curated student-focused saving tips organized by spending category
const TIPS_DATABASE = {
  Food: [
    {
      title: "Batch Cook & Dorm Snacks",
      text: "Buying packaged canteen snacks and delivery meals adds up fast. Keep nuts, fruit, or easy dorm snacks on hand to save up to ₹1,500/month."
    },
    {
      title: "Carry a Refillable Water Bottle",
      text: "Skip buying bottled water and soft drinks on campus. A reusable bottle saves both money and plastic waste every single day."
    },
    {
      title: "Split Shared Meals Promptly",
      text: "When dining out with college friends, calculate and settle UPI payments right away so uncollected group expenses don't drain your account."
    }
  ],
  Travel: [
    {
      title: "Get a Student Transit Pass",
      text: "Check your college administration for student concessions on metro, city buses, or local trains to reduce commute costs by up to 50%."
    },
    {
      title: "Walk or Carpool Short Distances",
      text: "For campus trips under 2 km, walk or ride a bicycle instead of booking auto-rickshaws or cab rides."
    },
    {
      title: "Book Vacation Travel in Advance",
      text: "When travelling home for semester breaks, book train or bus tickets weeks ahead to dodge last-minute surge pricing."
    }
  ],
  Study: [
    {
      title: "Borrow or Buy Pre-Owned Books",
      text: "Check the college library or buy second-hand reference books from senior students at half price, then resell them next semester."
    },
    {
      title: "Claim Student Developer & Software Deals",
      text: "Use your college email ID (.edu or college domain) to get free GitHub Student Developer Pack, Canva Pro, Notion, and discounted laptops."
    },
    {
      title: "Print in Bulk at Campus Copy Centers",
      text: "Avoid last-minute commercial print shops. College department printers or student union shops are usually 60% cheaper."
    }
  ],
  Fun: [
    {
      title: "Enjoy Campus Clubs & Free Events",
      text: "Take advantage of college fests, inter-college tournaments, movie screenings, and campus society events for low-cost entertainment."
    },
    {
      title: "Share Student Streaming Plans",
      text: "Pool together for student tiers on Spotify, Apple Music, or video streaming with roommates instead of paying individual full price."
    },
    {
      title: "Set a Weekly 'Fun Fund' Limit",
      text: "Allocate a fixed weekend entertainment cap on Monday. Once it is spent, stick to budget-friendly hangout options until next week."
    }
  ],
  Other: [
    {
      title: "Practice the 48-Hour Rule",
      text: "Before buying gadgets, clothes, or accessories online, wait 48 hours. Most impulse desires fade away, saving you immediate cash."
    },
    {
      title: "Audit Monthly Subscriptions",
      text: "Check your bank and UPI statements for recurring app fees or gym memberships you no longer use, and cancel them immediately."
    },
    {
      title: "Maintain a ₹500 Emergency Buffer",
      text: "Always keep a small separate cushion in your savings account for unexpected academic printing, lab materials, or urgent health needs."
    }
  ]
};

// Realistic student sample data for instant exploration
const SAMPLE_EXPENSES = [
  { id: "sample-1", name: "Campus Canteen Lunch", amount: 140, category: "Food", date: getFormattedDate(0) },
  { id: "sample-2", name: "Metro Card Recharge", amount: 350, category: "Travel", date: getFormattedDate(-1) },
  { id: "sample-3", name: "Data Structures Textbook", amount: 420, category: "Study", date: getFormattedDate(-2) },
  { id: "sample-4", name: "Weekend Movie & Popcorn", amount: 280, category: "Fun", date: getFormattedDate(-3) },
  { id: "sample-5", name: "College Lab Notebooks", amount: 160, category: "Study", date: getFormattedDate(-4) },
  { id: "sample-6", name: "Evening Chai & Samosa", amount: 65, category: "Food", date: getFormattedDate(-5) },
  { id: "sample-7", name: "Hostel Wi-Fi Contribution", amount: 250, category: "Other", date: getFormattedDate(-6) }
];

// Helper to calculate past dates (YYYY-MM-DD)
function getFormattedDate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

// ==========================================
// 2. State Management & Dark Mode Support
// ==========================================
let expenses = [];
let activeCategoryFilter = 'All';

// Initialize Theme (Dark Mode toggle with localStorage persistence)
function initTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme || (systemDark ? 'dark' : 'light');

  applyTheme(initialTheme, false);

  const toggleBtn = document.getElementById('theme-toggle-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(newTheme, true);
      showToast(`Switched to ${newTheme === 'dark' ? 'Dark' : 'Light'} mode`, 'info');
    });
  }

  // Auto-adapt to system preference changes if user hasn't explicitly set a preference
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(THEME_STORAGE_KEY)) {
        applyTheme(e.matches ? 'dark' : 'light', false);
      }
    });
  }
}

// Apply selected theme to DOM and re-draw canvas chart
function applyTheme(theme, save = true) {
  document.documentElement.setAttribute('data-theme', theme);
  if (save) {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }

  const toggleBtn = document.getElementById('theme-toggle-btn');
  if (toggleBtn) {
    const isDark = theme === 'dark';
    toggleBtn.setAttribute('title', isDark ? 'Switch to Light mode' : 'Switch to Dark mode');
    toggleBtn.setAttribute('aria-label', isDark ? 'Switch to Light mode' : 'Switch to Dark mode');
  }

  // Redraw canvas pie chart so slice borders and text adapt to theme
  drawPieChart();
}

// Load initial expenses from localStorage
function loadExpensesFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        expenses = parsed;
        return;
      }
    }
  } catch (err) {
    console.error("Error reading localStorage:", err);
  }
  expenses = [];
}

// Save expenses array to localStorage
function saveExpensesToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  } catch (err) {
    console.error("Error saving to localStorage:", err);
    showToast("Unable to save data. Storage quota may be full.", "danger");
  }
}

// ==========================================
// 3. UI Helper & Formatting Functions
// ==========================================

// Format Indian Rupee currency (e.g. ₹1,250.00 or ₹350)
function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: num % 1 === 0 ? 0 : 2
  }).format(num);
}

// Format date into a human readable friendly format (e.g. "Nov 18, 2026")
function formatDateFriendly(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const dateObj = new Date(year, month, day);
    return dateObj.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  return dateStr;
}

// Show a temporary toast notification
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 3000);
}

// ==========================================
// 4. Core Calculations & KPI Updates
// ==========================================

// Calculates total spent and breakdown per category
function getSpendingMetrics() {
  const categoryTotals = {
    Food: 0,
    Travel: 0,
    Study: 0,
    Fun: 0,
    Other: 0
  };

  let totalSpent = 0;

  for (const exp of expenses) {
    const val = Number(exp.amount) || 0;
    totalSpent += val;
    if (categoryTotals[exp.category] !== undefined) {
      categoryTotals[exp.category] += val;
    } else {
      categoryTotals.Other += val;
    }
  }

  // Determine top category
  let topCategory = null;
  let maxAmount = 0;
  for (const [cat, amt] of Object.entries(categoryTotals)) {
    if (amt > maxAmount) {
      maxAmount = amt;
      topCategory = cat;
    }
  }

  return { totalSpent, categoryTotals, topCategory, count: expenses.length };
}

// Update KPI cards in header
function renderKPIs() {
  const { totalSpent, topCategory, count } = getSpendingMetrics();

  document.getElementById('total-spent').textContent = formatCurrency(totalSpent);
  document.getElementById('total-count').textContent = count;

  const topCategoryEl = document.getElementById('top-category');
  if (topCategory && totalSpent > 0) {
    topCategoryEl.textContent = `${CATEGORY_ICONS[topCategory]} ${topCategory}`;
  } else {
    topCategoryEl.textContent = '-';
  }
}

// ==========================================
// 5. Category Breakdown & Canvas Pie Chart
// ==========================================

// Render category progress bars and amounts
function renderCategoryBreakdown() {
  const container = document.getElementById('category-breakdown-list');
  const { totalSpent, categoryTotals } = getSpendingMetrics();

  container.innerHTML = '';

  const categories = ['Food', 'Travel', 'Study', 'Fun', 'Other'];

  categories.forEach(cat => {
    const amount = categoryTotals[cat] || 0;
    const percentage = totalSpent > 0 ? ((amount / totalSpent) * 100).toFixed(1) : 0;
    const color = CATEGORY_COLORS[cat];
    const icon = CATEGORY_ICONS[cat];

    const row = document.createElement('div');
    row.className = 'cat-row';
    row.innerHTML = `
      <div class="cat-row-header">
        <div class="cat-name-tag">
          <span class="cat-dot" style="background-color: ${color}"></span>
          <span>${icon} ${cat}</span>
        </div>
        <div>
          <span class="cat-amount-info">${formatCurrency(amount)}</span>
          <span class="cat-percent">(${percentage}%)</span>
        </div>
      </div>
      <div class="cat-bar-bg">
        <div class="cat-bar-fill" style="width: ${percentage}%; background-color: ${color};"></div>
      </div>
    `;
    container.appendChild(row);
  });
}

// Draw crisp Donut / Pie Chart on HTML5 Canvas
function drawPieChart() {
  const canvas = document.getElementById('category-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Check current theme for dynamic canvas colors
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const strokeColor = isDark ? '#151e2e' : '#ffffff';
  const centerTextColor = isDark ? '#f8fafc' : '#0f172a';
  const centerSubtextColor = isDark ? '#94a3b8' : '#64748b';
  const emptyRingColor = isDark ? '#243044' : '#e2e8f0';

  // Handle High-DPI screens for retina sharpness
  const dpr = window.devicePixelRatio || 1;
  const displayWidth = 260;
  const displayHeight = 260;

  if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
  }

  ctx.resetTransform();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, displayWidth, displayHeight);

  const centerX = displayWidth / 2;
  const centerY = displayHeight / 2;
  const outerRadius = 100;
  const innerRadius = 60; // Donut hole

  const { totalSpent, categoryTotals } = getSpendingMetrics();

  // If no expenses, draw an elegant empty ring
  if (totalSpent === 0) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
    ctx.arc(centerX, centerY, innerRadius, Math.PI * 2, 0, true);
    ctx.closePath();
    ctx.fillStyle = emptyRingColor;
    ctx.fill();

    // Center text
    ctx.fillStyle = centerSubtextColor;
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('No Expenses', centerX, centerY - 8);
    ctx.font = '500 11px system-ui, sans-serif';
    ctx.fillText('₹0.00', centerX, centerY + 10);
    return;
  }

  // Draw distinct colored donut slices
  let startAngle = -Math.PI / 2; // Start from top (12 o'clock)
  const categories = ['Food', 'Travel', 'Study', 'Fun', 'Other'];

  categories.forEach(cat => {
    const val = categoryTotals[cat] || 0;
    if (val <= 0) return;

    const sliceAngle = (val / totalSpent) * (Math.PI * 2);
    const endAngle = startAngle + sliceAngle;

    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
    ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
    ctx.closePath();

    ctx.fillStyle = CATEGORY_COLORS[cat];
    ctx.fill();

    // Clean slice border separation
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    startAngle = endAngle;
  });

  // Center text (Total Spent)
  ctx.fillStyle = centerTextColor;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(formatCurrency(totalSpent), centerX, centerY - 6);

  ctx.fillStyle = centerSubtextColor;
  ctx.font = '600 10px system-ui, sans-serif';
  ctx.fillText('TOTAL SPENT', centerX, centerY + 14);
}

// ==========================================
// 6. Expense History List Rendering
// ==========================================

function renderExpenseList() {
  const container = document.getElementById('expense-list');
  if (!container) return;

  // Filter based on selected dropdown
  const filtered = expenses.filter(exp => {
    if (activeCategoryFilter === 'All') return true;
    return exp.category === activeCategoryFilter;
  });

  // Empty state when no expenses match
  if (filtered.length === 0) {
    if (expenses.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <h4>No expenses logged yet!</h4>
          <p>Add your first expense using the form on the left, or click <strong>"Sample Data"</strong> at the top to explore.</p>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="empty-state">
          <h4>No ${activeCategoryFilter} expenses found</h4>
          <p>You haven't logged any expenses in this category yet. Select <strong>"All Categories"</strong> to view other expenses.</p>
        </div>
      `;
    }
    return;
  }

  // Sort descending by date, then newly added
  const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));

  container.innerHTML = '';
  sorted.forEach(exp => {
    const item = document.createElement('div');
    item.className = 'expense-item';
    item.dataset.id = exp.id;

    const icon = CATEGORY_ICONS[exp.category] || '💡';

    item.innerHTML = `
      <div class="expense-main">
        <div class="expense-cat-badge cat-${exp.category}" title="${exp.category}">
          ${icon}
        </div>
        <div class="expense-text">
          <span class="expense-title" title="${escapeHtml(exp.name)}">${escapeHtml(exp.name)}</span>
          <span class="expense-meta">
            <span>${exp.category}</span>
            <span>&bull;</span>
            <span>${formatDateFriendly(exp.date)}</span>
          </span>
        </div>
      </div>
      <div class="expense-actions">
        <span class="expense-price">${formatCurrency(exp.amount)}</span>
        <button class="btn-delete" title="Delete expense" aria-label="Delete ${escapeHtml(exp.name)}" onclick="deleteExpense('${exp.id}')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    `;

    container.appendChild(item);
  });
}

// XSS Protection helper
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ==========================================
// 7. Form Handling & Expense Operations
// ==========================================

// Handle adding an expense
function handleExpenseSubmit(e) {
  e.preventDefault();

  const nameInput = document.getElementById('expense-name');
  const amountInput = document.getElementById('expense-amount');
  const categorySelect = document.getElementById('expense-category');
  const dateInput = document.getElementById('expense-date');

  const name = nameInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const category = categorySelect.value;
  const date = dateInput.value;

  // Validation
  let isValid = true;

  // Validate Name
  const nameGroup = nameInput.closest('.form-group');
  if (!name) {
    nameGroup.classList.add('has-error');
    isValid = false;
  } else {
    nameGroup.classList.remove('has-error');
  }

  // Validate Amount
  const amountGroup = amountInput.closest('.form-group');
  if (isNaN(amount) || amount <= 0) {
    amountGroup.classList.add('has-error');
    isValid = false;
  } else {
    amountGroup.classList.remove('has-error');
  }

  // Validate Date
  const dateGroup = dateInput.closest('.form-group');
  if (!date) {
    dateGroup.classList.add('has-error');
    isValid = false;
  } else {
    dateGroup.classList.remove('has-error');
  }

  if (!isValid) return;

  // Create new expense object
  const newExpense = {
    id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
    name: name,
    amount: Math.round(amount * 100) / 100,
    category: category,
    date: date
  };

  expenses.unshift(newExpense);
  saveExpensesToStorage();

  // Reset form inputs
  nameInput.value = '';
  amountInput.value = '';
  dateInput.value = getFormattedDate(0);
  nameInput.focus();

  // Re-render views
  refreshAllViews();
  showToast(`Added "${name}" (${formatCurrency(newExpense.amount)})`, 'success');
}

// Delete an expense by ID
function deleteExpense(id) {
  const index = expenses.findIndex(exp => exp.id === id);
  if (index !== -1) {
    const deletedName = expenses[index].name;
    expenses.splice(index, 1);
    saveExpensesToStorage();
    refreshAllViews();
    showToast(`Deleted "${deletedName}"`, 'danger');
  }
}
// Expose deleteExpense to global scope for inline button onclick attributes
window.deleteExpense = deleteExpense;

// ==========================================
// 8. Smart Saving Tips Generator
// ==========================================

function generateSmartTips() {
  const container = document.getElementById('tips-container');
  const { totalSpent, categoryTotals } = getSpendingMetrics();

  if (expenses.length === 0 || totalSpent === 0) {
    container.innerHTML = `
      <div class="tips-placeholder">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p>You haven't logged any expenses yet! Add a few expenses first so we can analyze where your money goes.</p>
      </div>
    `;
    return;
  }

  // Rank categories by total spending
  const sortedCategories = Object.entries(categoryTotals)
    .filter(([_, amt]) => amt > 0)
    .sort((a, b) => b[1] - a[1]);

  const topCat = sortedCategories[0][0];
  const secondCat = sortedCategories.length > 1 ? sortedCategories[1][0] : null;

  // Pick 3 tips based on top categories
  let selectedTips = [];
  const primaryTips = TIPS_DATABASE[topCat] || [];

  if (secondCat && TIPS_DATABASE[secondCat]) {
    // 2 tips from highest, 1 from second highest
    selectedTips = [
      { category: topCat, ...primaryTips[0] },
      { category: topCat, ...primaryTips[1] },
      { category: secondCat, ...TIPS_DATABASE[secondCat][0] }
    ];
  } else {
    // All 3 tips from the top category
    selectedTips = primaryTips.slice(0, 3).map(tip => ({ category: topCat, ...tip }));
  }

  // Render the 3 tips
  const tipsHtml = `
    <div class="tips-content">
      <div class="tips-banner">
        <span class="tips-banner-text">Based on your spending:</span>
        <span class="tips-badge">${CATEGORY_ICONS[topCat]} Highest in ${topCat}</span>
      </div>
      ${selectedTips.map((tip, idx) => `
        <div class="tip-card">
          <div class="tip-icon">${CATEGORY_ICONS[tip.category] || '💡'}</div>
          <div class="tip-body">
            <div class="tip-title">${idx + 1}. ${escapeHtml(tip.title)}</div>
            <p class="tip-text">${escapeHtml(tip.text)}</p>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  container.innerHTML = tipsHtml;
  showToast(`Tips generated for your ${topCat} spending!`, 'info');
}

// ==========================================
// 9. Quick Actions: Sample Data & Reset
// ==========================================

function loadSampleData() {
  expenses = JSON.parse(JSON.stringify(SAMPLE_EXPENSES));
  saveExpensesToStorage();
  refreshAllViews();
  generateSmartTips();
  showToast("Loaded student sample expenses!", "info");
}

function clearAllData() {
  if (expenses.length === 0) {
    showToast("No expenses to reset.", "info");
    return;
  }

  if (confirm("Are you sure you want to delete all saved expenses? This cannot be undone.")) {
    expenses = [];
    saveExpensesToStorage();
    refreshAllViews();

    // Reset tips container to initial state
    document.getElementById('tips-container').innerHTML = `
      <div class="tips-placeholder">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
        </svg>
        <p>Click <strong>"Get Saving Tips"</strong> to analyze your student spending habits and receive personalized money-saving advice.</p>
      </div>
    `;

    showToast("All data cleared.", "danger");
  }
}

// Refresh all UI widgets synchronously
function refreshAllViews() {
  renderKPIs();
  renderCategoryBreakdown();
  drawPieChart();
  renderExpenseList();
}

// ==========================================
// 10. Initialization & Event Listeners
// ==========================================

function initApp() {
  // Initialize theme support
  initTheme();

  // Set default date input to today
  const dateInput = document.getElementById('expense-date');
  if (dateInput) {
    dateInput.value = getFormattedDate(0);
  }

  // Load existing data from browser storage
  loadExpensesFromStorage();

  // Attach Form Submit Listener
  const form = document.getElementById('expense-form');
  if (form) {
    form.addEventListener('submit', handleExpenseSubmit);
  }

  // Attach Tips Button Listener
  const tipsBtn = document.getElementById('get-tips-btn');
  if (tipsBtn) {
    tipsBtn.addEventListener('click', generateSmartTips);
  }

  // Attach Category Filter Listener
  const filterSelect = document.getElementById('filter-category');
  if (filterSelect) {
    filterSelect.addEventListener('change', (e) => {
      activeCategoryFilter = e.target.value;
      renderExpenseList();
    });
  }

  // Attach Sample Data Button Listener
  const sampleBtn = document.getElementById('load-sample-btn');
  if (sampleBtn) {
    sampleBtn.addEventListener('click', loadSampleData);
  }

  // Attach Clear All Button Listener
  const clearBtn = document.getElementById('clear-all-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', clearAllData);
  }

  // Re-draw chart on window resize for optimal responsiveness
  window.addEventListener('resize', drawPieChart);

  // Initial render
  refreshAllViews();
}

// Run app once DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
