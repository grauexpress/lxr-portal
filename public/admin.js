
const API = "http://127.0.0.1:3000";

const login = document.getElementById("adminLogin");
const dashboard = document.getElementById("adminDashboard");
const loginForm = document.getElementById("adminLoginForm");
const password = document.getElementById("adminPassword");
const loginError = document.getElementById("adminLoginError");
const recordsTable = document.getElementById("adminRecords");
const searchInput = document.getElementById("adminSearch");

function showDashboard() {
  login.classList.add("hidden");
  dashboard.classList.remove("hidden");
  loadRegistrations();
}

function showLogin() {
  dashboard.classList.add("hidden");
  login.classList.remove("hidden");
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function formatDate(date) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleString("pt-BR");
}

async function loadRegistrations(search = "") {
  recordsTable.innerHTML = `
    <tr><td colspan="4">Carregando cadastros...</td></tr>
  `;

  try {
    const response = await fetch(
      `${API}/api/admin/registrations?search=${encodeURIComponent(search)}`,
      { credentials: "include" }
    );

    if (response.status === 401) {
      showLogin();
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erro ao carregar cadastros.");
    }

    const records = data.records || [];

    document.getElementById("totalCadastros").textContent =
      data.total ?? records.length;

    document.getElementById("totalContatos").textContent =
      data.total ?? records.length;

    if (records.length === 0) {
      recordsTable.innerHTML = `
        <tr><td colspan="4">Nenhum cadastro encontrado.</td></tr>
      `;
      return;
    }

    recordsTable.innerHTML = records.map(record => `
      <tr>
        <td>${escapeHTML(record.surname)}</td>
        <td>${escapeHTML(record.email)}</td>
        <td>${escapeHTML(record.phone)}</td>
        <td>${escapeHTML(formatDate(record.createdAt))}</td>
      </tr>
    `).join("");

  } catch (error) {
    recordsTable.innerHTML = `
      <tr><td colspan="4">${escapeHTML(error.message)}</td></tr>
    `;
  }
}

async function checkSession() {
  try {
    const response = await fetch(`${API}/api/admin/me`, {
      credentials: "include"
    });

    if (response.ok) {
      showDashboard();
    } else {
      showLogin();
    }
  } catch {
    showLogin();
    loginError.textContent = "Não foi possível conectar ao servidor.";
  }
}

loginForm.addEventListener("submit", async event => {
  event.preventDefault();
  loginError.textContent = "";

  try {
    const response = await fetch(`${API}/api/admin/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: password.value })
    });

    const data = await response.json();

    if (!response.ok) {
      loginError.textContent = data.error || "Não foi possível entrar.";
      return;
    }

    password.value = "";
    showDashboard();

  } catch {
    loginError.textContent = "Servidor indisponível.";
  }
});

document.getElementById("adminLogout").addEventListener("click", async () => {
  try {
    const response = await fetch(`${API}/api/admin/logout`, {
      method: "POST",
      credentials: "include"
    });

    if (!response.ok) {
      alert("Não foi possível encerrar a sessão.");
      return;
    }

    showLogin();

  } catch {
    alert("Erro ao conectar ao servidor.");
  }
});

if (searchInput) {
  searchInput.addEventListener("input", () => {
    loadRegistrations(searchInput.value.trim());
  });
}

checkSession();
