const seedEntries = [
  { id: 1, name: "Monthly paycheck", type: "income", amount: 4200, frequency: "monthly", start: "2026-10-01" },
  { id: 2, name: "Apartment rent", type: "expense", amount: 1450, frequency: "monthly", start: "2026-10-02" },
  { id: 3, name: "Groceries", type: "expense", amount: 86.42, frequency: "weekly", start: "2026-10-05" },
  { id: 4, name: "Subway pass", type: "expense", amount: 127, frequency: "monthly", start: "2026-10-06" },
  { id: 5, name: "Freelance tools", type: "expense", amount: 49, frequency: "monthly", start: "2026-10-08" },
];

const historyEntries = [
  { name: "Citibank", values: [["402", "0"], ["402", "0"], ["402", "0"]] },
  { name: "Chase checking now", values: [["Syc tax-1520", "0"], ["Crg tax-400", "0"], ["", "0"]] },
  { name: "BB apartment", values: [["1900", "0"], ["1900", "0"], ["1900", "0"]] },
  { name: "Marlin Clay Rent", values: [["1900", "0"], ["1900", "0"], ["1900", "0"]] },
  { name: "Tatyana job", values: [["2840", "0"], ["2840", "0"], ["2840", "0"]] },
  { name: "Dmitriy job", values: [["3101", "0"], ["3101", "0"], ["3101", "0"]] },
  { name: "Mama", values: [["870", "0"], ["870", "0"], ["870", "0"]] },
  { name: "House NY", values: [["-3196", "0"], ["-3196", "0"], ["-3196", "0"]] },
  { name: "Lucas Clay Rent", values: [["-788", "0"], ["-788", "0"], ["-788", "0"]] },
  { name: "NTL GRID Gas Bkln", values: [["-150*", "0"], ["-150*", "0"], ["-150*", "0"]] },
  { name: "Chase Tatyana", values: [["-100*", "0"], ["-100*", "0"], ["-100*", "0"]] },
  { name: "Chase Dima", values: [["-725", "0"], ["-725", "0"], ["-725", "0"]] },
  { name: "Basement rent", values: [["1400", "0"], ["1400", "0"], ["1400", "0"]] },
  { name: "Verizon", values: [["-75", "0"], ["-75", "0"], ["-75", "0"]] },
  { name: "9 Eagle FL Cooper mgtg", values: [["-1222", "0"], ["-1222", "0"], ["-1222", "0"]] },
  { name: "Water 1,4,7,10", values: [["-185*", "-"], ["", "0"], ["", "0"]] },
  { name: "PC Rent", values: [["4339", "0"], ["4339", "0"], ["4339", "0"]] },
  { name: "Duplex FL Truist mtgt", values: [["-1134", "0"], ["-1134", "0"], ["-1134", "0"]] },
  { name: "Conedison Bkln", values: [["-172", "0"], ["-172", "0"], ["-172", "0"]] },
  { name: "3100 Owners", values: [["-728", "0"], ["-728", "0"], ["-728", "0"]] },
  { name: "Infiniti", values: [["-570", "0"], ["-570", "0"], ["-570", "0"]] },
  { name: "TMobile", values: [["", "0"], ["-224", "0"], ["", "0"]] },
];

const storageKey = "ledger-table-entries-v2";
const state = { entries: JSON.parse(localStorage.getItem(storageKey) || "null") || seedEntries, filter: "all", query: "" };
const $ = (selector) => document.querySelector(selector);
const money = (amount) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
const formatDate = (date) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${date}T12:00:00`));
const frequencyLabel = { "one-time": "One time", daily: "Daily", weekly: "Weekly", biweekly: "Every 2 weeks", monthly: "Monthly", yearly: "Yearly" };

function save() { localStorage.setItem(storageKey, JSON.stringify(state.entries)); }
function escapeHTML(value) { return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character])); }

function render() {
  const income = state.entries.filter((entry) => entry.type === "income");
  const expenses = state.entries.filter((entry) => entry.type === "expense");
  const incomeTotal = income.reduce((total, entry) => total + entry.amount, 0);
  const expenseTotal = expenses.reduce((total, entry) => total + entry.amount, 0);
  $("#incomeTotal").textContent = money(incomeTotal);
  $("#expenseTotal").textContent = money(expenseTotal);
  $("#balanceTotal").textContent = money(incomeTotal - expenseTotal);
  $("#incomeCount").textContent = `${income.length} item${income.length === 1 ? "" : "s"}`;
  $("#expenseCount").textContent = `${expenses.length} item${expenses.length === 1 ? "" : "s"}`;
  $("#allCount").textContent = state.entries.length;
  $("#incomeTabCount").textContent = income.length;
  $("#expenseTabCount").textContent = expenses.length;
  renderTable();
}

function renderTable() {
  const tbody = $("#entriesTable");
  const matching = state.entries.filter((entry) => {
    const typeMatches = state.filter === "all" || entry.type === state.filter;
    const queryMatches = `${entry.name} ${entry.frequency}`.toLowerCase().includes(state.query.toLowerCase());
    return typeMatches && queryMatches;
  }).sort((a, b) => new Date(a.start) - new Date(b.start));
  $("#emptyState").hidden = matching.length > 0;
  tbody.innerHTML = matching.map((entry) => `<tr>
    <td><div class="entry-name"><span class="entry-mark ${entry.type}">${entry.type === "income" ? "↗" : "↘"}</span>${escapeHTML(entry.name)}</div></td>
    <td><span class="type-pill ${entry.type}">${entry.type === "income" ? "Income" : "Expense"}</span></td>
    <td class="amount ${entry.type}">${entry.type === "income" ? "+" : "−"}${money(entry.amount)}</td>
    <td><span class="frequency-pill">${frequencyLabel[entry.frequency]}</span></td>
    <td class="start-date">${formatDate(entry.start)}</td>
    <td><button class="delete-button" data-delete="${entry.id}" type="button" aria-label="Delete ${escapeHTML(entry.name)}">×</button></td>
  </tr>`).join("");
  tbody.querySelectorAll("[data-delete]").forEach((button) => button.addEventListener("click", () => {
    state.entries = state.entries.filter((entry) => entry.id !== Number(button.dataset.delete));
    save(); render(); showToast("Row removed");
  }));
}

function renderHistory() {
  $("#historyTable").innerHTML = historyEntries.map((entry) => `<tr><td>${escapeHTML(entry.name)}</td>${entry.values.flat().map((value, index) => `<td class="${index % 2 === 0 ? "history-main" : "history-secondary"}">${escapeHTML(value)}</td>`).join("")}</tr>`).join("");
}

function showToast(message) { const toast = $("#toast"); toast.textContent = message; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 2200); }

$("#entryForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  state.entries.push({ id: Date.now(), name: form.get("name").trim(), type: form.get("type"), amount: Number(form.get("amount")), frequency: form.get("frequency"), start: form.get("start") });
  save(); render(); event.target.reset(); $("#startInput").value = new Date().toISOString().slice(0, 10); $("#nameInput").focus(); showToast("Added to your table");
});
document.querySelectorAll(".filter-tab").forEach((tab) => tab.addEventListener("click", () => { state.filter = tab.dataset.filter; document.querySelectorAll(".filter-tab").forEach((item) => item.classList.toggle("active", item === tab)); renderTable(); }));
$("#searchInput").addEventListener("input", (event) => { state.query = event.target.value; renderTable(); });
$("#todayLabel").textContent = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date());
document.querySelectorAll(".view-tab").forEach((tab) => tab.addEventListener("click", () => {
  document.querySelectorAll(".view-tab").forEach((item) => item.classList.toggle("active", item === tab));
  document.querySelectorAll(".view-panel").forEach((panel) => { panel.hidden = panel.id !== tab.dataset.view; });
}));
renderHistory();
render();
