"use strict";

const {
    KEYS,
    initAdminPage,
    normalizeText,
    formatDate,
    formatNumber,
    createInitials,
    showToast,
    confirmAction
} = VST;


// CONFIGURAÇÕES
const CLIENTS_KEY = KEYS.CLIENTS;
const DASHBOARD_KEY = KEYS.DASHBOARD;

let clients = [];
// INICIALIZAÇÃO

document.addEventListener("DOMContentLoaded", initializeClientsPage);

function initializeClientsPage() {
    const loggedUser = initAdminPage();
    if (!loggedUser) return;

    clients = loadClients();
    configureSearchAndFilter();
    configureClientModal();
    configureClientActions();

    renderClients();
    openNewClientFromUrl();
}


// DADOS

function loadClients() {
    try {
        const storedClients = sessionStorage.getItem(CLIENTS_KEY);
        if (!storedClients) return [];

        const parsedClients = JSON.parse(storedClients);
        if (!Array.isArray(parsedClients)) {
            throw new Error("Lista de clientes inválida.");
        }

        return parsedClients.map(client => ({
            ...client,
            address: client.address ?? ""
        }));
    } catch (error) {
        console.warn("Não foi possível carregar os clientes:", error);
        return [];
    }
}

function saveClients(clientList = clients) {
    try {
        sessionStorage.setItem(
            CLIENTS_KEY,
            JSON.stringify(clientList)
        );
    } catch (error) {
        console.error("Não foi possível salvar os clientes:", error);
        showToast("Não foi possível salvar os dados.");
    }
}


// USUÁRIO
// TEMA CLARO E ESCURO
// MENU LATERAL
// PESQUISA E FILTRO

function configureSearchAndFilter() {
    const searchInput = document.getElementById("clientSearch");
    const statusFilter = document.getElementById("statusFilter");

    searchInput.addEventListener("input", renderClients);
    statusFilter.addEventListener("change", renderClients);
}
function getFilteredClients() {
    const searchTerm = normalizeText(
        document.getElementById("clientSearch").value
    );

    const status = document.getElementById("statusFilter").value;

    return clients.filter((client) => {
        const searchableText = normalizeText(
            [
                client.name,
                client.email,
                client.phone,
                client.address,
                client.city
            ].join(" ")
        );

        const matchesSearch =
            searchTerm === "" ||
            searchableText.includes(searchTerm);

        const matchesStatus =
            status === "all" ||
            client.status === status;

        return matchesSearch && matchesStatus;
    });
}


// RENDERIZAÇÃO

function renderClients() {
    renderStatistics();
    renderClientsTable();
}

function renderStatistics() {
    const activeClients = clients.filter(
        (client) => client.status === "active"
    ).length;

    const clientsWithEmail = clients.filter(
        (client) => String(client.email).trim() !== ""
    ).length;

    const now = new Date();

    const newClientsThisMonth = clients.filter((client) => {
        const createdAt = new Date(client.createdAt);

        return (
            createdAt.getMonth() === now.getMonth() &&
            createdAt.getFullYear() === now.getFullYear()
        );
    }).length;

    document.getElementById("totalClients").textContent =
        formatNumber(clients.length);

    document.getElementById("activeClients").textContent =
        formatNumber(activeClients);

    document.getElementById("newClientsThisMonth").textContent =
        formatNumber(newClientsThisMonth);

    document.getElementById("clientsWithEmail").textContent =
        formatNumber(clientsWithEmail);
}

function renderClientsTable() {
    const tableBody = document.getElementById("clientsTableBody");
    const emptyState = document.getElementById("clientsEmptyState");
    const resultsCounter = document.getElementById("resultsCounter");

    const filteredClients = getFilteredClients()
        .slice()
        .sort((a, b) => b.createdAt - a.createdAt);

    tableBody.innerHTML = "";

    filteredClients.forEach((client) => {
        tableBody.appendChild(createClientRow(client));
    });

    emptyState.hidden = filteredClients.length > 0;

    resultsCounter.textContent = formatResultsCounter(
        filteredClients.length
    );
}

function createClientRow(client) {
    const row = document.createElement("tr");

    const clientCell = document.createElement("td");
    const contactCell = document.createElement("td");
    const cityCell = document.createElement("td");
    const statusCell = document.createElement("td");
    const createdAtCell = document.createElement("td");
    const actionsCell = document.createElement("td");

    clientCell.appendChild(createClientIdentity(client));
    contactCell.appendChild(createClientContact(client));

    cityCell.className = "client-city";
    cityCell.textContent = client.city || "Não informado";

    statusCell.appendChild(createStatusBadge(client.status));

    createdAtCell.className = "client-created-at";
    createdAtCell.textContent = formatDate(client.createdAt);

    actionsCell.appendChild(createClientActions(client));

    row.append(
        clientCell,
        contactCell,
        cityCell,
        statusCell,
        createdAtCell,
        actionsCell
    );

    return row;
}

function createClientIdentity(client) {
    const wrapper = document.createElement("div");
    const avatar = document.createElement("div");
    const identity = document.createElement("div");
    const name = document.createElement("strong");
    const code = document.createElement("span");

    wrapper.className = "client-cell";
    avatar.className = "client-avatar";
    identity.className = "client-identity";

    avatar.textContent = createInitials(client.name);
    name.textContent = client.name;
    code.textContent = createClientCode(client.id);

    identity.append(name, code);
    wrapper.append(avatar, identity);

    return wrapper;
}

function createClientContact(client) {
    const wrapper = document.createElement("div");
    wrapper.className = "contact-cell";

    if (client.email) {
        const email = document.createElement("a");
        email.href = `mailto:${client.email}`;
        email.textContent = client.email;
        wrapper.appendChild(email);
    }

    if (client.phone) {
        const phone = document.createElement("span");
        phone.textContent = client.phone;
        wrapper.appendChild(phone);
    }

    if (!client.email && !client.phone) {
        const empty = document.createElement("span");
        empty.textContent = "Não informado";
        wrapper.appendChild(empty);
    }

    return wrapper;
}

function createStatusBadge(status) {
    const badge = document.createElement("span");
    const isActive = status === "active";

    badge.className = `status-badge ${isActive ? "active" : "inactive"}`;
    badge.textContent = isActive ? "Ativo" : "Inativo";

    return badge;
}

function createClientActions(client) {
    const wrapper = document.createElement("div");
    const editButton = document.createElement("button");
    const deleteButton = document.createElement("button");

    wrapper.className = "client-actions";

    editButton.className = "table-action-button";
    editButton.type = "button";
    editButton.textContent = "Editar";
    editButton.dataset.clientAction = "edit";
    editButton.dataset.clientId = client.id;
    editButton.setAttribute("aria-label", `Editar ${client.name}`);

    deleteButton.className = "table-action-button delete";
    deleteButton.type = "button";
    deleteButton.textContent = "Excluir";
    deleteButton.dataset.clientAction = "delete";
    deleteButton.dataset.clientId = client.id;
    deleteButton.setAttribute("aria-label", `Excluir ${client.name}`);

    wrapper.append(editButton, deleteButton);

    return wrapper;
}

function createClientCode(id) {
    const cleanId = String(id)
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(-6)
        .toUpperCase();

    return `Cliente #${cleanId || "000001"}`;
}
function formatResultsCounter(total) {
    if (total === 1) {
        return "1 cliente exibido";
    }

    return `${total} clientes exibidos`;
}


// MODAL DE CLIENTE

function configureClientModal() {
    const newClientButton = document.getElementById("newClientButton");
    const clientForm = document.getElementById("clientForm");

    newClientButton.addEventListener("click", openNewClientModal);
    clientForm.addEventListener("submit", handleClientFormSubmit);

    document
        .querySelectorAll("[data-close-client-modal]")
        .forEach((button) => {
            button.addEventListener("click", closeClientModal);
        });

    document.addEventListener("keydown", (event) => {
        const modal = document.getElementById("clientModal");

        if (event.key === "Escape" && !modal.hidden) {
            closeClientModal();
        }
    });
}

function openNewClientModal() {
    resetClientForm();

    document.getElementById("clientModalTitle").textContent = "Novo cliente";
    document.getElementById("clientModalDescription").textContent =
        "Preencha os dados básicos do cliente.";

    openClientModal();
}

function openEditClientModal(clientId) {
    const client = clients.find((item) => item.id === clientId);

    if (!client) {
        showToast("Cliente não encontrado.");
        return;
    }

    document.getElementById("clientId").value = client.id;
    document.getElementById("clientName").value = client.name;
    document.getElementById("clientEmail").value = client.email || "";
    document.getElementById("clientPhone").value = client.phone || "";
    document.getElementById("clientAddress").value = client.address || "";
    document.getElementById("clientCity").value = client.city || "";
    document.getElementById("clientStatus").value = client.status;

    document.getElementById("clientModalTitle").textContent = "Editar cliente";
    document.getElementById("clientModalDescription").textContent =
        "Atualize as informações do cliente.";

    openClientModal();
}

function openClientModal() {
    const modal = document.getElementById("clientModal");

    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    window.setTimeout(
        () => document.getElementById("clientName").focus(),
        50
    );
}

function closeClientModal() {
    const modal = document.getElementById("clientModal");

    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
}

function resetClientForm() {
    document.getElementById("clientForm").reset();
    document.getElementById("clientId").value = "";
    document.getElementById("clientStatus").value = "active";
}

function handleClientFormSubmit(event) {
    event.preventDefault();

    const clientId = document.getElementById("clientId").value;
    const name = document.getElementById("clientName").value.trim();
    const email = document.getElementById("clientEmail").value.trim();
    const phone = document.getElementById("clientPhone").value.trim();
    const address = document.getElementById("clientAddress").value.trim();
    const city = document.getElementById("clientCity").value.trim();
    const status = document.getElementById("clientStatus").value;

    if (!name) {
        showToast("Digite o nome do cliente.");
        return;
    }

    if (clientId) {
        updateClient({
            id: clientId,
            name,
            email,
            phone,
            address,
            city,
            status
        });
    } else {
        addClient({
            name,
            email,
            phone,
            address,
            city,
            status
        });
    }

    saveClients();
    renderClients();
    closeClientModal();
}

function addClient(clientData) {
    const newClient = {
        id: generateClientId(),
        ...clientData,
        createdAt: Date.now()
    };

    clients.unshift(newClient);

    updateDashboardForClientChange(
        1,
        `Cliente ${newClient.name} cadastrado`
    );

    showToast("Cliente cadastrado com sucesso.");
}

function updateClient(clientData) {
    const index = clients.findIndex(
        (client) => client.id === clientData.id
    );

    if (index === -1) {
        showToast("Cliente não encontrado.");
        return;
    }

    clients[index] = {
        ...clients[index],
        ...clientData
    };

    updateDashboardForClientChange(
        0,
        `Cliente ${clientData.name} atualizado`
    );

    showToast("Cadastro do cliente atualizado.");
}

function generateClientId() {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    return `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function openNewClientFromUrl() {
    const url = new URL(window.location.href);

    if (url.searchParams.get("novo") !== "1") {
        return;
    }

    openNewClientModal();

    url.searchParams.delete("novo");
    window.history.replaceState({}, "", url);
}


// EDITAR E EXCLUIR

function configureClientActions() {
    document
        .getElementById("clientsTableBody")
        .addEventListener("click", (event) => {
            const button = event.target.closest("[data-client-action]");

            if (!button) {
                return;
            }

            const clientId = button.dataset.clientId;
            const action = button.dataset.clientAction;

            if (action === "edit") {
                openEditClientModal(clientId);
            }

            if (action === "delete") {
                deleteClient(clientId);
            }
        });
}

async function deleteClient(clientId) {
    const client = clients.find((item) => item.id === clientId);

    if (!client) {
        showToast("Cliente não encontrado.");
        return;
    }

    const shouldDelete =
        await confirmAction({
            title:
                "Excluir cliente?",
            message:
                `O cadastro de ${client.name} será removido do sistema.`,
            details:
                "Essa ação não poderá ser desfeita.",
            confirmLabel:
                "Excluir cliente",
            cancelLabel:
                "Cancelar",
            tone:
                "danger"
        });

    if (!shouldDelete) {
        return;
    }

    clients = clients.filter((item) => item.id !== clientId);

    saveClients();

    updateDashboardForClientChange(
        -1,
        `Cliente ${client.name} removido`
    );

    renderClients();
    showToast("Cliente removido com sucesso.");
}


// INTEGRAÇÃO COM A HOME

function updateDashboardForClientChange(countChange, description) {
    try {
        const storedDashboard = sessionStorage.getItem(DASHBOARD_KEY);

        if (!storedDashboard) {
            return;
        }

        const dashboard = JSON.parse(storedDashboard);

        if (!dashboard || typeof dashboard !== "object") {
            return;
        }

        const currentClients = Number(dashboard.clients) || 0;

        dashboard.clients = Math.max(
            0,
            currentClients + countChange
        );

        if (!Array.isArray(dashboard.activities)) {
            dashboard.activities = [];
        }

        dashboard.activities.unshift({
            description,
            category: "Clientes",
            timestamp: Date.now()
        });

        dashboard.activities = dashboard.activities.slice(0, 20);

        sessionStorage.setItem(
            DASHBOARD_KEY,
            JSON.stringify(dashboard)
        );
    } catch (error) {
        console.warn("Não foi possível sincronizar o cliente com a Home:", error);
    }
}


// LOGOUT
// NOTIFICAÇÃO
