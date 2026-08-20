"use strict";

const {
    KEYS,
    initAdminPage,
    normalizeText,
    formatNumber,
    formatCurrency,
    formatDateTime,
    setText,
    showToast
} = VST;
const DASHBOARD_KEY = KEYS.DASHBOARD;
let dashboardState;
document.addEventListener("DOMContentLoaded", initializeDashboard);

function createInitialState() {
    const now = Date.now();

    return {
        schemaVersion: 2,
        clients: 128,
        products: 42,
        sales: 67,
        revenue: 12580.90,
        activities: [
            {
                description: "Cliente Ana Souza cadastrado",
                category: "Clientes",
                timestamp: now - 20 * 60 * 1000
            },
            {
                description: "Venda nº 0034 registrada",
                category: "Vendas",
                timestamp: now - 75 * 60 * 1000
            },
            {
                description: "Produto Vela de Lavanda atualizado",
                category: "Produtos",
                timestamp: now - 3 * 60 * 60 * 1000
            }
        ]
    };
}

function initializeDashboard() {
    const loggedUser = initAdminPage();
    if (!loggedUser) return;

    dashboardState = loadDashboardState();
    configureCurrentDate();
    configureSearch();
    configureQuickActions();
    configureClearActivities();

    renderDashboard();
}

function loadDashboardState() {
    try {
        const stored = sessionStorage.getItem(DASHBOARD_KEY);

        if (!stored) {
            const initial = createInitialState();
            saveDashboardState(initial);
            return initial;
        }

        const parsed = JSON.parse(stored);

        if (!parsed || typeof parsed !== "object") {
            throw new Error("Estado inválido.");
        }

        parsed.clients = normalizeNumber(parsed.clients, 128);
        parsed.products = normalizeNumber(parsed.products, 42);
        parsed.sales = normalizeNumber(parsed.sales, 67);
        parsed.revenue = normalizeNumber(parsed.revenue, 12580.90);
        parsed.activities = Array.isArray(parsed.activities) ? parsed.activities : [];

        return parsed;
    } catch (error) {
        console.warn("Não foi possível carregar o painel:", error);
        const initial = createInitialState();
        saveDashboardState(initial);
        return initial;
    }
}

function saveDashboardState(state = dashboardState) {
    sessionStorage.setItem(DASHBOARD_KEY, JSON.stringify(state));
}

function normalizeNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
}
function configureCurrentDate() {
    const date = new Intl.DateTimeFormat("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long"
    }).format(new Date());

    setText("currentDate", date.charAt(0).toUpperCase() + date.slice(1));
}
function configureQuickActions() {
    document.querySelectorAll("[data-action]").forEach(button => {
        button.addEventListener("click", () => {
            const action = button.dataset.action;

            if (action === "client") {
                window.location.href = "clientes.html?novo=1";
                return;
            }

            if (action === "product") {
                window.location.href = "produtos.html?novo=1";
                return;
            }

            if (action === "sale") {
                window.location.href = "vendas.html?novo=1";
                return;
            }

            if (action === "order") {
                window.location.href = "pedidos.html";
            }
        });
    });
}

function configureSearch() {
    document.getElementById("globalSearch")?.addEventListener("input", renderActivities);
}

function renderDashboard() {
    document.querySelector('[data-stat="clients"]')?.replaceChildren(
        document.createTextNode(formatNumber(dashboardState.clients))
    );

    document.querySelector('[data-stat="products"]')?.replaceChildren(
        document.createTextNode(formatNumber(dashboardState.products))
    );

    document.querySelector('[data-stat="sales"]')?.replaceChildren(
        document.createTextNode(formatNumber(dashboardState.sales))
    );

    document.querySelector('[data-stat="revenue"]')?.replaceChildren(
        document.createTextNode(formatCurrency(dashboardState.revenue))
    );

    renderActivities();
}

function renderActivities() {
    const body = document.getElementById("recentActivities");
    const empty = document.getElementById("emptyActivities");
    if (!body) return;

    const term = normalizeText(document.getElementById("globalSearch")?.value || "");

    const activities = dashboardState.activities.filter(activity => {
        const text = normalizeText([
            activity.description,
            activity.category,
            formatDateTime(activity.timestamp)
        ].join(" "));

        return !term || text.includes(term);
    });

    body.innerHTML = "";

    activities.forEach(activity => {
        const row = document.createElement("tr");

        const description = document.createElement("td");
        description.textContent = activity.description;

        const category = document.createElement("td");
        category.textContent = activity.category;

        const date = document.createElement("td");
        date.textContent = formatDateTime(activity.timestamp);

        row.append(description, category, date);
        body.appendChild(row);
    });

    if (empty) empty.hidden = activities.length > 0;
}

function configureClearActivities() {
    document.getElementById("clearActivitiesButton")?.addEventListener("click", () => {
        if (!dashboardState.activities.length) return;

        if (!window.confirm("Deseja limpar as atividades recentes?")) return;

        dashboardState.activities = [];
        saveDashboardState();
        renderActivities();
        showToast("Atividades recentes removidas.");
    });
}
