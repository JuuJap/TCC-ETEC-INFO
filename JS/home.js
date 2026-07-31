"use strict";

/* =========================================================
   CONFIGURAÇÕES
========================================================= */

const THEME_KEY = "theme";
const DASHBOARD_KEY = "velasDashboardTemporario";
const USER_KEY = "usuarioLogado";

let dashboardState;
let toastTimer;


/* =========================================================
   DADOS INICIAIS DE DEMONSTRAÇÃO
========================================================= */

function createInitialState() {
    const now = Date.now();

    return {
        clients: 128,
        products: 42,
        sales: 67,
        revenue: 12580.90,
        lowStock: 6,

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
            },
            {
                description: "Fornecedor Aroma Brasil cadastrado",
                category: "Fornecedores",
                timestamp: now - 26 * 60 * 60 * 1000
            }
        ]
    };
}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

document.addEventListener("DOMContentLoaded", initializeDashboard);

function initializeDashboard() {
    const loggedUser = sessionStorage.getItem(USER_KEY);

    if (!loggedUser) {
        window.location.replace("index.html");
        return;
    }

    dashboardState = loadDashboardState();

    configureUser(loggedUser);
    configureCurrentDate();
    configureTheme();
    configureSidebar();
    configureSearch();
    configureDemoLinks();
    configureQuickActions();
    configureModal();
    configureLogout();
    configureClearActivities();

    renderDashboard();
}


/* =========================================================
   CARREGAMENTO DOS DADOS
========================================================= */

function loadDashboardState() {
    try {
        const storedState = sessionStorage.getItem(DASHBOARD_KEY);

        if (!storedState) {
            const initialState = createInitialState();

            saveDashboardState(initialState);

            return initialState;
        }

        const parsedState = JSON.parse(storedState);

        if (
            typeof parsedState !== "object" ||
            parsedState === null ||
            !Array.isArray(parsedState.activities)
        ) {
            throw new Error("Estado inválido.");
        }

        return parsedState;
    } catch (error) {
        console.warn(
            "Não foi possível carregar o painel temporário:",
            error
        );

        const initialState = createInitialState();

        saveDashboardState(initialState);

        return initialState;
    }
}

function saveDashboardState(state = dashboardState) {
    try {
        sessionStorage.setItem(
            DASHBOARD_KEY,
            JSON.stringify(state)
        );
    } catch (error) {
        console.error(
            "Não foi possível salvar os dados temporários:",
            error
        );

        showToast(
            "Não foi possível salvar os dados desta sessão."
        );
    }
}


/* =========================================================
   USUÁRIO
========================================================= */

function configureUser(userName) {
    const userNameElement = document.getElementById("userName");
    const welcomeUserElement =
        document.getElementById("welcomeUser");

    const avatarElement =
        document.getElementById("userAvatar");

    userNameElement.textContent = userName;
    welcomeUserElement.textContent = userName;

    avatarElement.textContent = createInitials(userName);
}

function createInitials(name) {
    const words = name
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (words.length === 0) {
        return "US";
    }

    if (words.length === 1) {
        return words[0]
            .slice(0, 2)
            .toUpperCase();
    }

    return (
        words[0][0] +
        words[words.length - 1][0]
    ).toUpperCase();
}


/* =========================================================
   DATA ATUAL
========================================================= */

function configureCurrentDate() {
    const currentDateElement =
        document.getElementById("currentDate");

    const formattedDate =
        new Intl.DateTimeFormat("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "long"
        }).format(new Date());

    currentDateElement.textContent =
        capitalizeFirstLetter(formattedDate);
}

function capitalizeFirstLetter(text) {
    if (!text) {
        return "";
    }

    return text.charAt(0).toUpperCase() + text.slice(1);
}


/* =========================================================
   TEMA CLARO E ESCURO
========================================================= */

function configureTheme() {
    const themeToggle =
        document.getElementById("themeToggle");

    const savedTheme =
        localStorage.getItem(THEME_KEY);

    const shouldUseDarkTheme =
        savedTheme === "dark" ||
        (
            !savedTheme &&
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches
        );

    applyTheme(
        shouldUseDarkTheme ? "dark" : "light"
    );

    themeToggle.addEventListener("click", () => {
        const isDarkMode =
            document.body.classList.contains("dark-mode");

        const newTheme =
            isDarkMode ? "light" : "dark";

        applyTheme(newTheme);

        localStorage.setItem(
            THEME_KEY,
            newTheme
        );
    });
}

function applyTheme(theme) {
    const themeToggle =
        document.getElementById("themeToggle");

    const themeIcon =
        document.getElementById("themeIcon");

    const isDark = theme === "dark";

    document.body.classList.toggle(
        "dark-mode",
        isDark
    );

    themeIcon.textContent =
        isDark ? "☀" : "☾";

    themeToggle.setAttribute(
        "aria-label",
        isDark
            ? "Ativar tema claro"
            : "Ativar tema escuro"
    );
}


/* =========================================================
   MENU LATERAL
========================================================= */

function configureSidebar() {
    const menuToggle =
        document.getElementById("menuToggle");

    const sidebarOverlay =
        document.getElementById("sidebarOverlay");

    menuToggle.addEventListener(
        "click",
        toggleSidebar
    );

    sidebarOverlay.addEventListener(
        "click",
        closeSidebar
    );

    document
        .querySelectorAll(".menu-item")
        .forEach((menuItem) => {
            menuItem.addEventListener(
                "click",
                closeSidebar
            );
        });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 920) {
            closeSidebar();
        }
    });
}

function toggleSidebar() {
    const menuToggle =
        document.getElementById("menuToggle");

    const isOpen =
        document.body.classList.toggle(
            "sidebar-open"
        );

    menuToggle.setAttribute(
        "aria-expanded",
        String(isOpen)
    );

    menuToggle.setAttribute(
        "aria-label",
        isOpen
            ? "Fechar menu"
            : "Abrir menu"
    );
}

function closeSidebar() {
    const menuToggle =
        document.getElementById("menuToggle");

    document.body.classList.remove(
        "sidebar-open"
    );

    menuToggle.setAttribute(
        "aria-expanded",
        "false"
    );

    menuToggle.setAttribute(
        "aria-label",
        "Abrir menu"
    );
}


/* =========================================================
   LINKS DEMONSTRATIVOS
========================================================= */

function configureDemoLinks() {
    const demoLinks =
        document.querySelectorAll(
            "[data-demo-link]"
        );

    demoLinks.forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();

            const pageName =
                link.dataset.demoLink;

            showToast(
                `${pageName}: página disponível em uma próxima etapa da demonstração.`
            );
        });
    });
}


/* =========================================================
   PESQUISA
========================================================= */

function configureSearch() {
    const searchInput =
        document.getElementById("globalSearch");

    searchInput.addEventListener(
        "input",
        () => {
            renderActivities(
                searchInput.value
            );

            filterStockItems(
                searchInput.value
            );
        }
    );
}

function normalizeText(text) {
    return String(text)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function filterStockItems(searchTerm) {
    const normalizedSearch =
        normalizeText(searchTerm);

    const stockItems =
        document.querySelectorAll(".stock-item");

    stockItems.forEach((item) => {
        const searchText =
            normalizeText(
                item.dataset.searchText
            );

        item.hidden =
            normalizedSearch !== "" &&
            !searchText.includes(
                normalizedSearch
            );
    });
}


/* =========================================================
   RENDERIZAÇÃO
========================================================= */

function renderDashboard() {
    renderStatistics();
    renderActivities();
}

function renderStatistics() {
    const clientsElement =
        document.querySelector(
            '[data-stat="clients"]'
        );

    const productsElement =
        document.querySelector(
            '[data-stat="products"]'
        );

    const salesElement =
        document.querySelector(
            '[data-stat="sales"]'
        );

    const revenueElement =
        document.querySelector(
            '[data-stat="revenue"]'
        );

    const lowStockElements =
        document.querySelectorAll(
            '[data-stat="lowStock"]'
        );

    clientsElement.textContent =
        formatNumber(dashboardState.clients);

    productsElement.textContent =
        formatNumber(dashboardState.products);

    salesElement.textContent =
        formatNumber(dashboardState.sales);

    revenueElement.textContent =
        formatCurrency(dashboardState.revenue);

    lowStockElements.forEach((element) => {
        element.textContent =
            formatNumber(
                dashboardState.lowStock
            );
    });
}

function renderActivities(searchTerm = "") {
    const activitiesBody =
        document.getElementById(
            "recentActivities"
        );

    const emptyMessage =
        document.getElementById(
            "emptyActivities"
        );

    const normalizedSearch =
        normalizeText(searchTerm);

    const filteredActivities =
        dashboardState.activities.filter(
            (activity) => {
                const activityText =
                    normalizeText(
                        `${activity.description} ${activity.category}`
                    );

                return (
                    normalizedSearch === "" ||
                    activityText.includes(
                        normalizedSearch
                    )
                );
            }
        );

    activitiesBody.innerHTML = "";

    filteredActivities.forEach(
        (activity) => {
            const row =
                document.createElement("tr");

            const descriptionCell =
                document.createElement("td");

            const categoryCell =
                document.createElement("td");

            const dateCell =
                document.createElement("td");

            const categoryBadge =
                document.createElement("span");

            descriptionCell.className =
                "activity-description";

            descriptionCell.textContent =
                activity.description;

            categoryBadge.className =
                "category-badge";

            categoryBadge.textContent =
                activity.category;

            categoryCell.appendChild(
                categoryBadge
            );

            dateCell.className =
                "activity-date";

            dateCell.textContent =
                formatActivityDate(
                    activity.timestamp
                );

            row.append(
                descriptionCell,
                categoryCell,
                dateCell
            );

            activitiesBody.appendChild(row);
        }
    );

    emptyMessage.hidden =
        filteredActivities.length > 0;
}

function formatNumber(value) {
    return new Intl.NumberFormat(
        "pt-BR"
    ).format(value);
}

function formatCurrency(value) {
    return new Intl.NumberFormat(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    ).format(value);
}

function formatActivityDate(timestamp) {
    const activityDate =
        new Date(timestamp);

    const now =
        new Date();

    const todayStart =
        new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );

    const activityStart =
        new Date(
            activityDate.getFullYear(),
            activityDate.getMonth(),
            activityDate.getDate()
        );

    const dayDifference =
        Math.round(
            (
                todayStart -
                activityStart
            ) /
            86400000
        );

    const time =
        new Intl.DateTimeFormat(
            "pt-BR",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        ).format(activityDate);

    if (dayDifference === 0) {
        return `Hoje, ${time}`;
    }

    if (dayDifference === 1) {
        return `Ontem, ${time}`;
    }

    return new Intl.DateTimeFormat(
        "pt-BR",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    ).format(activityDate);
}


/* =========================================================
   AÇÕES RÁPIDAS E MODAL
========================================================= */

const actionConfigurations = {
    client: {
        title: "Cadastrar cliente",

        description:
            "Adicione um cliente temporário à demonstração.",

        primaryLabel:
            "Nome do cliente",

        primaryPlaceholder:
            "Exemplo: Maria da Silva",

        secondaryLabel:
            "Telefone ou e-mail",

        secondaryPlaceholder:
            "Campo opcional",

        secondaryType:
            "text"
    },

    product: {
        title: "Cadastrar produto",

        description:
            "Adicione um produto temporário ao catálogo.",

        primaryLabel:
            "Nome do produto",

        primaryPlaceholder:
            "Exemplo: Vela de Morango",

        secondaryLabel:
            "Quantidade inicial",

        secondaryPlaceholder:
            "Exemplo: 10",

        secondaryType:
            "number"
    },

    sale: {
        title: "Registrar venda",

        description:
            "Registre uma venda demonstrativa.",

        primaryLabel:
            "Cliente ou descrição",

        primaryPlaceholder:
            "Exemplo: Venda para Ana Souza",

        secondaryLabel:
            "Valor da venda em reais",

        secondaryPlaceholder:
            "Exemplo: 89,90",

        secondaryType:
            "number"
    },

    supplier: {
        title: "Cadastrar fornecedor",

        description:
            "Adicione um fornecedor temporário.",

        primaryLabel:
            "Nome do fornecedor",

        primaryPlaceholder:
            "Exemplo: Essências Brasil",

        secondaryLabel:
            "Telefone ou e-mail",

        secondaryPlaceholder:
            "Campo opcional",

        secondaryType:
            "text"
    }
};

function configureQuickActions() {
    const quickActionButtons =
        document.querySelectorAll(
            "[data-action]"
        );

    quickActionButtons.forEach(
        (button) => {
            button.addEventListener(
                "click",
                () => {
                    openActionModal(
                        button.dataset.action
                    );
                }
            );
        }
    );
}

function configureModal() {
    const modal =
        document.getElementById(
            "actionModal"
        );

    const closeButtons =
        document.querySelectorAll(
            "[data-close-modal]"
        );

    const actionForm =
        document.getElementById(
            "actionForm"
        );

    closeButtons.forEach((button) => {
        button.addEventListener(
            "click",
            closeActionModal
        );
    });

    actionForm.addEventListener(
        "submit",
        handleActionFormSubmit
    );

    document.addEventListener(
        "keydown",
        (event) => {
            if (
                event.key === "Escape" &&
                !modal.hidden
            ) {
                closeActionModal();
            }
        }
    );
}

function openActionModal(actionType) {
    const configuration =
        actionConfigurations[actionType];

    if (!configuration) {
        showToast(
            "Esta ação não está disponível."
        );

        return;
    }

    const modal =
        document.getElementById(
            "actionModal"
        );

    const actionTypeInput =
        document.getElementById(
            "actionType"
        );

    const modalTitle =
        document.getElementById(
            "modalTitle"
        );

    const modalDescription =
        document.getElementById(
            "modalDescription"
        );

    const primaryLabel =
        document.getElementById(
            "primaryLabel"
        );

    const primaryField =
        document.getElementById(
            "primaryField"
        );

    const secondaryLabel =
        document.getElementById(
            "secondaryLabel"
        );

    const secondaryField =
        document.getElementById(
            "secondaryField"
        );

    actionTypeInput.value =
        actionType;

    modalTitle.textContent =
        configuration.title;

    modalDescription.textContent =
        configuration.description;

    primaryLabel.textContent =
        configuration.primaryLabel;

    primaryField.placeholder =
        configuration.primaryPlaceholder;

    secondaryLabel.textContent =
        configuration.secondaryLabel;

    secondaryField.placeholder =
        configuration.secondaryPlaceholder;

    secondaryField.type =
        configuration.secondaryType;

    secondaryField.removeAttribute("min");
    secondaryField.removeAttribute("step");

    if (
        actionType === "product" ||
        actionType === "sale"
    ) {
        secondaryField.min = "0";
    }

    if (actionType === "sale") {
        secondaryField.step = "0.01";
    }

    if (actionType === "product") {
        secondaryField.step = "1";
    }

    primaryField.value = "";
    secondaryField.value = "";

    modal.hidden = false;

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add(
        "modal-open"
    );

    window.setTimeout(
        () => primaryField.focus(),
        50
    );
}

function closeActionModal() {
    const modal =
        document.getElementById(
            "actionModal"
        );

    modal.hidden = true;

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.classList.remove(
        "modal-open"
    );
}

function handleActionFormSubmit(event) {
    event.preventDefault();

    const actionType =
        document
            .getElementById("actionType")
            .value;

    const primaryValue =
        document
            .getElementById("primaryField")
            .value
            .trim();

    const secondaryValue =
        document
            .getElementById("secondaryField")
            .value
            .trim();

    if (!primaryValue) {
        showToast(
            "Preencha o campo principal."
        );

        return;
    }

    const activity =
        createActivityFromAction(
            actionType,
            primaryValue,
            secondaryValue
        );

    if (!activity) {
        showToast(
            "Não foi possível realizar esta ação."
        );

        return;
    }

    dashboardState.activities.unshift(
        activity
    );

    dashboardState.activities =
        dashboardState.activities.slice(
            0,
            20
        );

    saveDashboardState();
    renderDashboard();
    closeActionModal();

    document.getElementById(
        "globalSearch"
    ).value = "";

    filterStockItems("");

    showToast(
        "Registro temporário salvo com sucesso."
    );
}

function createActivityFromAction(
    actionType,
    primaryValue,
    secondaryValue
) {
    const timestamp = Date.now();

    switch (actionType) {
        case "client":
            dashboardState.clients += 1;

            return {
                description:
                    `Cliente ${primaryValue} cadastrado`,
                category: "Clientes",
                timestamp
            };

        case "product": {
            dashboardState.products += 1;

            const quantity =
                parseIntegerValue(
                    secondaryValue
                );

            if (
                quantity > 0 &&
                quantity <= 5
            ) {
                dashboardState.lowStock += 1;
            }

            return {
                description:
                    `Produto ${primaryValue} cadastrado`,
                category: "Produtos",
                timestamp
            };
        }

        case "sale": {
            dashboardState.sales += 1;

            const saleValue =
                parseDecimalValue(
                    secondaryValue
                );

            dashboardState.revenue +=
                saleValue;

            return {
                description:
                    `Venda registrada: ${primaryValue}`,
                category: "Vendas",
                timestamp
            };
        }

        case "supplier":
            return {
                description:
                    `Fornecedor ${primaryValue} cadastrado`,
                category: "Fornecedores",
                timestamp
            };

        default:
            return null;
    }
}

function parseIntegerValue(value) {
    const parsedValue =
        Number.parseInt(value, 10);

    return Number.isFinite(parsedValue)
        ? parsedValue
        : 0;
}

function parseDecimalValue(value) {
    const normalizedValue =
        String(value)
            .replace(/\./g, "")
            .replace(",", ".");

    const parsedValue =
        Number.parseFloat(
            normalizedValue
        );

    return Number.isFinite(parsedValue)
        ? parsedValue
        : 0;
}


/* =========================================================
   LIMPAR ATIVIDADES
========================================================= */

function configureClearActivities() {
    const clearButton =
        document.getElementById(
            "clearActivitiesButton"
        );

    clearButton.addEventListener(
        "click",
        () => {
            const shouldClear =
                window.confirm(
                    "Deseja limpar as atividades temporárias?"
                );

            if (!shouldClear) {
                return;
            }

            dashboardState.activities = [];

            saveDashboardState();
            renderActivities();

            showToast(
                "Atividades temporárias removidas."
            );
        }
    );
}


/* =========================================================
   LOGOUT
========================================================= */

function configureLogout() {
    const logoutButton =
        document.getElementById(
            "logoutButton"
        );

    logoutButton.addEventListener(
        "click",
        () => {
            const shouldLogout =
                window.confirm(
                    "Deseja sair da sua conta?"
                );

            if (!shouldLogout) {
                return;
            }

            sessionStorage.removeItem(
                USER_KEY
            );

            window.location.replace(
                "index.html"
            );
        }
    );
}


/* =========================================================
   NOTIFICAÇÃO
========================================================= */

function showToast(message) {
    const toast =
        document.getElementById("toast");

    const toastMessage =
        document.getElementById(
            "toastMessage"
        );

    toastMessage.textContent = message;

    toast.classList.add("show");

    window.clearTimeout(toastTimer);

    toastTimer = window.setTimeout(
        () => {
            toast.classList.remove("show");
        },
        3200
    );
}