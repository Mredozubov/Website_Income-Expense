const seedTransactions = [
  { id: 1, type: "income", description: "Monthly paycheck", category: "Salary", amount: 4200, date: "2026-10-01" },
  { id: 2, type: "expense", description: "Apartment rent", category: "Housing", amount: 1450, date: "2026-10-02" },
  { id: 3, type: "expense", description: "Groceries", category: "Food & dining", amount: 86.42, date: "2026-10-05" },
  { id: 4, type: "expense", description: "Subway pass", category: "Transport", amount: 127, date: "2026-10-06" },
  { id: 5, type: "expense", description: "Freelance tools", category: "Other", amount: 49, date: "2026-10-08" },
];

const state = { transactions: JSON.parse(localStorage.getItem("ledger-transactions-v1") || "null") || seedTransactions, filter: "all", query: "" };
const $ = (selector) => document.querySelector(selector);
const money = (amount, compact = false) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: compact ? 0 : 2 }).format(amount);
const dateFormat = (date) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(`${date}T12:00:00`));

function save() { localStorage.setItem("ledger-transactions-v1", JSON.stringify(state.transactions)); }

function render() {
  const income = state.transactions.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
  const expenses = state.transactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
  const incomeItems = state.transactions.filter((item) => item.type === "income");
  const expenseItems = state.transactions.filter((item) => item.type === "expense");
  $("#balanceAmount").textContent = money(income - expenses);
  $("#incomeAmount").textContent = money(income);
  $("#expenseAmount").textContent = money(expenses);
  $("#incomeCount").textContent = `${incomeItems.length} transaction${incomeItems.length === 1 ? "" : "s"}`;
  $("#expenseCount").textContent = `${expenseItems.length} transaction${expenseItems.length === 1 ? "" : "s"}`;
  $("#allCount").textContent = state.transactions.length;
  $("#incomeTabCount").textContent = incomeItems.length;
  $("#expenseTabCount").textContent = expenseItems.length;
  $("#donutTotal").textContent = money(expenses, true);
  renderTransactions();
  renderCategories(expenses);
}

function renderTransactions() {
  const list = $("#transactionList");
  const filtered = state.transactions.filter((item) => {
    const matchesType = state.filter === "all" || item.type === state.filter;
    const matchesQuery = `${item.description} ${item.category}`.toLowerCase().includes(state.query.toLowerCase());
    return matchesType && matchesQuery;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));
  if (!filtered.length) {
    list.innerHTML = '<div class="empty-state"><div><strong>No transactions found</strong>Add one to start seeing your activity here.</div></div>';
    return;
  }
  list.innerHTML = filtered.map((item) => `<div class="transaction-row">
    <div class="transaction-icon ${item.type}">${item.type === "income" ? "↗" : categoryIcon(item.category)}</div>
    <div><div class="transaction-name">${escapeHTML(item.description)}</div><span class="transaction-category">${escapeHTML(item.category)}</span></div>
    <span class="transaction-date">${dateFormat(item.date)}</span>
    <div class="transaction-amount ${item.type === "income" ? "amount-income" : "amount-expense"}">${item.type === "income" ? "+" : "−"}${money(item.amount)}</div>
    <button class="delete-button" type="button" data-delete="${item.id}" aria-label="Delete ${escapeHTML(item.description)}">×</button>
  </div>`).join("");
  list.querySelectorAll("[data-delete]").forEach((button) => button.addEventListener("click", () => {
    state.transactions = state.transactions.filter((item) => item.id !== Number(button.dataset.delete));
    save(); render(); showToast("Transaction removed");
  }));
}

function categoryIcon(category) { return { "Food & dining": "⌁", Housing: "⌂", Transport: "↝", Shopping: "□", Health: "+", Entertainment: "♪", Other: "•" }[category] || "•"; }
function escapeHTML(value) { return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character])); }

function renderCategories(total) {
  const colors = ["#4daf7f", "#86d2a5", "#c2ead3", "#ff8d72", "#f3c27b", "#a8b6ef"];
  const categories = Object.entries(state.transactions.filter((item) => item.type === "expense").reduce((result, item) => { result[item.category] = (result[item.category] || 0) + item.amount; return result; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const chart = $("#donutChart");
  if (!categories.length) { chart.style.background = "#e8eee9"; $("#categoryList").innerHTML = '<div class="empty-state">No expense categories yet.</div>'; return; }
  let cursor = 0;
  const stops = categories.map(([, amount], index) => { const start = cursor; cursor += (amount / total) * 100; return `${colors[index]} ${start}% ${cursor}%`; });
  chart.style.background = `conic-gradient(${stops.join(", ")})`;
  $("#categoryList").innerHTML = categories.map(([name, amount], index) => `<div class="category-row"><i class="category-dot" style="background:${colors[index]}"></i><span>${escapeHTML(name)}</span><span>${Math.round((amount / total) * 100)}%</span><strong>${money(amount)}</strong></div>`).join("");
}

function showToast(message) { const toast = $("#toast"); toast.textContent = message; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 2200); }
const dialog = $("#transactionDialog");
$("#openTransactionModal").addEventListener("click", () => { $("#dateInput").value = new Date().toISOString().slice(0, 10); dialog.showModal(); });
$("#cancelDialog").addEventListener("click", () => dialog.close());
$("#transactionForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  state.transactions.push({ id: Date.now(), type: form.get("type"), description: form.get("description").trim(), category: form.get("category"), amount: Number(form.get("amount")), date: form.get("date") });
  save(); render(); event.target.reset(); dialog.close(); showToast("Transaction saved");
});
document.querySelectorAll(".filter-tab").forEach((tab) => tab.addEventListener("click", () => { state.filter = tab.dataset.filter; document.querySelectorAll(".filter-tab").forEach((item) => item.classList.toggle("active", item === tab)); renderTransactions(); }));
$("#searchInput").addEventListener("input", (event) => { state.query = event.target.value; renderTransactions(); });
$("#monthPicker").addEventListener("click", () => showToast("Showing October 2026"));
render();
