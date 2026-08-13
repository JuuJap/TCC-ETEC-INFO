"use strict";

/* =========================================================
   CONFIGURAÇÕES
========================================================= */

const THEME_KEY = "theme";
const DASHBOARD_KEY = "velasDashboardTemporario";
const USER_KEY = "usuarioLogado";

const REAL_PAGES = {
    clientes: "clientes.html",
    produtos: "produtos.html"
};

let dashboardState;
let toastTimer;


/* =========================================================
   ESTADO INICIAL
========================================================= */

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


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeDashboard
);

function initializeDashboard() {

    const loggedUser =
        sessionStorage.getItem(USER_KEY);

    /* VERIFICA LOGIN */

    if (!loggedUser) {
        window.location.replace("index.html");
        return;
    }

    /* CARREGA ESTADO */

    dashboardState =
        loadDashboardState();

    /* CONFIGURAÇÕES */

    configureUser(loggedUser);

    configureCurrentDate();

    configureTheme();

    configureSidebar();

    /*
        IMPORTANTE:

        A navegação real é configurada ANTES
        dos links demonstrativos.
    */

    configureNavigation();

    configureRealPageGuard();

    configureDemoLinks();

    configureSearch();

    configureQuickActions();

    configureModal();

    configureClearActivities();

    configureLogout();

    /* RENDERIZA */

    renderDashboard();
}


/* =========================================================
   CARREGAR DASHBOARD
========================================================= */

function loadDashboardState() {

    try {

        const storedState =
            sessionStorage.getItem(
                DASHBOARD_KEY
            );

        if (!storedState) {

            const initialState =
                createInitialState();

            saveDashboardState(
                initialState
            );

            return initialState;
        }

        const parsedState =
            JSON.parse(storedState);

        if (
            !parsedState ||
            typeof parsedState !== "object" ||
            parsedState.schemaVersion !== 2 ||
            !Array.isArray(parsedState.activities)
        ) {

            const initialState =
                createInitialState();

            saveDashboardState(
                initialState
            );

            return initialState;
        }

        /*
            Number.isFinite permite manter o valor 0,
            ao contrário de usar apenas "|| 128".
        */

        parsedState.clients =
            normalizeNumber(
                parsedState.clients,
                128
            );

        parsedState.products =
            normalizeNumber(
                parsedState.products,
                42
            );

        parsedState.sales =
            normalizeNumber(
                parsedState.sales,
                67
            );

        parsedState.revenue =
            normalizeNumber(
                parsedState.revenue,
                0
            );

        return parsedState;

    } catch (error) {

        console.warn(
            "Não foi possível carregar o painel:",
            error
        );

        const initialState =
            createInitialState();

        saveDashboardState(
            initialState
        );

        return initialState;
    }
}


function normalizeNumber(
    value,
    fallback
) {

    const number =
        Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;
}


/* =========================================================
   SALVAR DASHBOARD
========================================================= */

function saveDashboardState(
    state = dashboardState
) {

    try {

        sessionStorage.setItem(
            DASHBOARD_KEY,
            JSON.stringify(state)
        );

    } catch (error) {

        console.error(
            "Não foi possível salvar os dados:",
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

    const userNameElement =
        document.getElementById(
            "userName"
        );

    const welcomeUserElement =
        document.getElementById(
            "welcomeUser"
        );

    const avatarElement =
        document.getElementById(
            "userAvatar"
        );

    if (userNameElement) {
        userNameElement.textContent =
            userName;
    }

    if (welcomeUserElement) {
        welcomeUserElement.textContent =
            userName;
    }

    if (avatarElement) {
        avatarElement.textContent =
            createInitials(userName);
    }
}


function createInitials(name) {

    const words =
        String(name)
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    if (!words.length) {
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
   DATA
========================================================= */

function configureCurrentDate() {

    const currentDate =
        document.getElementById(
            "currentDate"
        );

    if (!currentDate) {
        return;
    }

    const formattedDate =
        new Intl.DateTimeFormat(
            "pt-BR",
            {
                weekday: "long",
                day: "2-digit",
                month: "long"
            }
        ).format(new Date());

    currentDate.textContent =
        formattedDate
            .charAt(0)
            .toUpperCase() +
        formattedDate.slice(1);
}


/* =========================================================
   TEMA CLARO / ESCURO
========================================================= */

function configureTheme() {

    const themeToggle =
        document.getElementById(
            "themeToggle"
        );

    if (!themeToggle) {
        return;
    }

    const savedTheme =
        localStorage.getItem(
            THEME_KEY
        );

    const prefersDark =
        window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches;

    const initialTheme =
        savedTheme === "dark" ||
        savedTheme === "light"
            ? savedTheme
            : prefersDark
                ? "dark"
                : "light";

    applyTheme(initialTheme);

    themeToggle.addEventListener(
        "click",
        () => {

            const isDark =
                document.body
                    .classList
                    .contains(
                        "dark-mode"
                    );

            const newTheme =
                isDark
                    ? "light"
                    : "dark";

            applyTheme(newTheme);

            localStorage.setItem(
                THEME_KEY,
                newTheme
            );
        }
    );
}


function applyTheme(theme) {

    const isDark =
        theme === "dark";

    const themeToggle =
        document.getElementById(
            "themeToggle"
        );

    const themeIcon =
        document.getElementById(
            "themeIcon"
        );

    document.body.classList.toggle(
        "dark-mode",
        isDark
    );

    if (themeIcon) {

        themeIcon.textContent =
            isDark
                ? "☀"
                : "☾";
    }

    if (themeToggle) {

        themeToggle.setAttribute(
            "aria-label",
            isDark
                ? "Ativar tema claro"
                : "Ativar tema escuro"
        );
    }
}


/* SINCRONIZA TEMA ENTRE ABAS */

window.addEventListener(
    "storage",
    event => {

        if (
            event.key === THEME_KEY &&
            (
                event.newValue === "dark" ||
                event.newValue === "light"
            )
        ) {

            applyTheme(
                event.newValue
            );
        }
    }
);


/* =========================================================
   MENU LATERAL
========================================================= */

function configureSidebar() {

    const menuToggle =
        document.getElementById(
            "menuToggle"
        );

    const sidebarOverlay =
        document.getElementById(
            "sidebarOverlay"
        );

    if (menuToggle) {

        menuToggle.addEventListener(
            "click",
            toggleSidebar
        );
    }

    if (sidebarOverlay) {

        sidebarOverlay.addEventListener(
            "click",
            closeSidebar
        );
    }

    document
        .querySelectorAll(".menu-item")
        .forEach(item => {

            item.addEventListener(
                "click",
                () => {

                    if (
                        window.innerWidth <=
                        920
                    ) {

                        closeSidebar();
                    }
                }
            );
        });

    window.addEventListener(
        "resize",
        () => {

            if (
                window.innerWidth >
                920
            ) {

                closeSidebar();
            }
        }
    );
}


function toggleSidebar() {

    const menuToggle =
        document.getElementById(
            "menuToggle"
        );

    const isOpen =
        document.body
            .classList
            .toggle(
                "sidebar-open"
            );

    if (!menuToggle) {
        return;
    }

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

    document.body.classList.remove(
        "sidebar-open"
    );

    const menuToggle =
        document.getElementById(
            "menuToggle"
        );

    if (!menuToggle) {
        return;
    }

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
   NORMALIZA TEXTO
========================================================= */

function normalizeText(text) {

    return String(text ?? "")
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .trim();
}


/* =========================================================
   NAVEGAÇÃO REAL

   CLIENTES E PRODUTOS NÃO SÃO MAIS DEMONSTRATIVOS.
========================================================= */

function configureNavigation() {

    document
        .querySelectorAll(
            ".menu-item"
        )
        .forEach(link => {

            const text =
                normalizeText(
                    link.textContent
                );

            /* CLIENTES */

            if (
                text.includes(
                    "clientes"
                )
            ) {

                link.href =
                    REAL_PAGES.clientes;

                link.removeAttribute(
                    "data-demo-link"
                );

                return;
            }

            /* PRODUTOS */

            if (
                text.includes(
                    "produtos"
                )
            ) {

                link.href =
                    REAL_PAGES.produtos;

                link.removeAttribute(
                    "data-demo-link"
                );
            }
        });
}


/* =========================================================
   PROTEÇÃO EXTRA DA NAVEGAÇÃO

   Mesmo se o HTML estiver antigo, clicar em Clientes
   ou Produtos sempre abrirá a página correta.
========================================================= */

function configureRealPageGuard() {

    document.addEventListener(
        "click",
        event => {

            const link =
                event.target.closest(
                    ".menu-item"
                );

            if (!link) {
                return;
            }

            const pageName =
                normalizeText(
                    link.textContent
                );

            /* CLIENTES */

            if (
                pageName.includes(
                    "clientes"
                )
            ) {

                event.preventDefault();

                event.stopImmediatePropagation();

                window.location.href =
                    REAL_PAGES.clientes;

                return;
            }

            /* PRODUTOS */

            if (
                pageName.includes(
                    "produtos"
                )
            ) {

                event.preventDefault();

                event.stopImmediatePropagation();

                window.location.href =
                    REAL_PAGES.produtos;
            }

        },

        /*
            Captura o clique antes dos listeners antigos.
        */

        true
    );
}


/* =========================================================
   LINKS AINDA DEMONSTRATIVOS

   SOMENTE:
   - Vendas
   - Relatórios
   - Configurações
========================================================= */

function configureDemoLinks() {

    document
        .querySelectorAll(
            "[data-demo-link]"
        )
        .forEach(link => {

            const pageName =
                normalizeText(
                    link.dataset.demoLink
                );

            /*
                PROTEÇÃO EXTRA

                Se Clientes ou Produtos ainda tiverem
                data-demo-link no HTML, removemos.
            */

            if (
                pageName === "clientes"
            ) {

                link.removeAttribute(
                    "data-demo-link"
                );

                link.href =
                    REAL_PAGES.clientes;

                return;
            }

            if (
                pageName === "produtos"
            ) {

                link.removeAttribute(
                    "data-demo-link"
                );

                link.href =
                    REAL_PAGES.produtos;

                return;
            }

            /*
                SOMENTE PÁGINAS FUTURAS
            */

            link.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    const displayName =
                        link.dataset.demoLink ||
                        "Esta página";

                    showToast(
                        `${displayName}: página disponível em uma próxima etapa da demonstração.`
                    );
                }
            );
        });
}


/* =========================================================
   PESQUISA
========================================================= */

function configureSearch() {

    const searchInput =
        document.getElementById(
            "globalSearch"
        );

    if (!searchInput) {
        return;
    }

    searchInput.addEventListener(
        "input",
        () => {

            renderActivities(
                searchInput.value
            );
        }
    );
}


/* =========================================================
   RENDERIZAÇÃO
========================================================= */

function renderDashboard() {

    renderStatistics();

    const searchInput =
        document.getElementById(
            "globalSearch"
        );

    renderActivities(
        searchInput
            ? searchInput.value
            : ""
    );
}


/* =========================================================
   ESTATÍSTICAS
========================================================= */

function renderStatistics() {

    const clients =
        document.querySelector(
            '[data-stat="clients"]'
        );

    const products =
        document.querySelector(
            '[data-stat="products"]'
        );

    const sales =
        document.querySelector(
            '[data-stat="sales"]'
        );

    const revenue =
        document.querySelector(
            '[data-stat="revenue"]'
        );

    if (clients) {

        clients.textContent =
            formatNumber(
                dashboardState.clients
            );
    }

    if (products) {

        products.textContent =
            formatNumber(
                dashboardState.products
            );
    }

    if (sales) {

        sales.textContent =
            formatNumber(
                dashboardState.sales
            );
    }

    if (revenue) {

        revenue.textContent =
            formatCurrency(
                dashboardState.revenue
            );
    }
}


/* =========================================================
   ATIVIDADES
========================================================= */

function renderActivities(
    searchTerm = ""
) {

    const activitiesBody =
        document.getElementById(
            "recentActivities"
        );

    const emptyMessage =
        document.getElementById(
            "emptyActivities"
        );

    if (
        !activitiesBody ||
        !emptyMessage
    ) {

        return;
    }

    const normalizedSearch =
        normalizeText(
            searchTerm
        );

    const filteredActivities =
        dashboardState.activities.filter(
            activity => {

                const activityText =
                    normalizeText(
                        `${activity.description} ${activity.category}`
                    );

                return (
                    !normalizedSearch ||
                    activityText.includes(
                        normalizedSearch
                    )
                );
            }
        );

    activitiesBody.innerHTML =
        "";

    filteredActivities.forEach(
        activity => {

            const row =
                document.createElement(
                    "tr"
                );

            const descriptionCell =
                document.createElement(
                    "td"
                );

            const categoryCell =
                document.createElement(
                    "td"
                );

            const dateCell =
                document.createElement(
                    "td"
                );

            const categoryBadge =
                document.createElement(
                    "span"
                );


            /* DESCRIÇÃO */

            descriptionCell.className =
                "activity-description";

            descriptionCell.textContent =
                activity.description;


            /* CATEGORIA */

            categoryBadge.className =
                "category-badge";

            categoryBadge.textContent =
                activity.category;

            categoryCell.appendChild(
                categoryBadge
            );


            /* DATA */

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

            activitiesBody.appendChild(
                row
            );
        }
    );

    emptyMessage.hidden =
        filteredActivities.length >
        0;
}


/* =========================================================
   FORMATAÇÃO
========================================================= */

function formatNumber(value) {

    return new Intl.NumberFormat(
        "pt-BR"
    ).format(
        Number(value) || 0
    );
}


function formatCurrency(value) {

    return new Intl.NumberFormat(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    ).format(
        Number(value) || 0
    );
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
        ).format(
            activityDate
        );

    if (
        dayDifference === 0
    ) {

        return `Hoje, ${time}`;
    }

    if (
        dayDifference === 1
    ) {

        return `Ontem, ${time}`;
    }

    return new Intl.DateTimeFormat(
        "pt-BR",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    ).format(
        activityDate
    );
}


/* =========================================================
   MODAIS DA HOME

   CLIENTE E PRODUTO AGORA POSSUEM PÁGINAS PRÓPRIAS.

   O MODAL É USADO SOMENTE PARA:
   - Venda
   - Pedido
========================================================= */

const actionConfigurations = {

    sale: {

        title:
            "Registrar venda",

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


    order: {

        title:
            "Registrar pedido",

        description:
            "Adicione um pedido temporário à demonstração.",

        primaryLabel:
            "Cliente ou descrição",

        primaryPlaceholder:
            "Exemplo: Pedido de Maria Souza",

        secondaryLabel:
            "Valor previsto em reais",

        secondaryPlaceholder:
            "Exemplo: 120,00",

        secondaryType:
            "number"
    }

};


/* =========================================================
   AÇÕES RÁPIDAS
========================================================= */

function configureQuickActions() {

    document
        .querySelectorAll(
            "[data-action]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const actionType =
                        button.dataset.action;


                    /* NOVO CLIENTE */

                    if (
                        actionType ===
                        "client"
                    ) {

                        window.location.href =
                            "clientes.html?novo=1";

                        return;
                    }


                    /* NOVO PRODUTO */

                    if (
                        actionType ===
                        "product"
                    ) {

                        window.location.href =
                            "produtos.html?novo=1";

                        return;
                    }


                    /* VENDA / PEDIDO */

                    openActionModal(
                        actionType
                    );
                }
            );
        });
}


/* =========================================================
   MODAL
========================================================= */

function configureModal() {

    const modal =
        document.getElementById(
            "actionModal"
        );

    const actionForm =
        document.getElementById(
            "actionForm"
        );

    if (!modal) {
        return;
    }

    document
        .querySelectorAll(
            "[data-close-modal]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                closeActionModal
            );
        });

    if (actionForm) {

        actionForm.addEventListener(
            "submit",
            handleActionFormSubmit
        );
    }

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                !modal.hidden
            ) {

                closeActionModal();
            }
        }
    );
}


/* =========================================================
   ABRIR MODAL
========================================================= */

function openActionModal(
    actionType
) {

    const configuration =
        actionConfigurations[
            actionType
        ];

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


    if (
        !modal ||
        !actionTypeInput ||
        !primaryField ||
        !secondaryField
    ) {

        showToast(
            "O formulário não pôde ser aberto."
        );

        return;
    }


    /* TEXTOS */

    actionTypeInput.value =
        actionType;


    if (modalTitle) {

        modalTitle.textContent =
            configuration.title;
    }


    if (modalDescription) {

        modalDescription.textContent =
            configuration.description;
    }


    if (primaryLabel) {

        primaryLabel.textContent =
            configuration.primaryLabel;
    }


    if (secondaryLabel) {

        secondaryLabel.textContent =
            configuration.secondaryLabel;
    }


    /* CAMPOS */

    primaryField.placeholder =
        configuration.primaryPlaceholder;


    secondaryField.placeholder =
        configuration.secondaryPlaceholder;


    secondaryField.type =
        configuration.secondaryType;


    secondaryField.removeAttribute(
        "min"
    );


    secondaryField.removeAttribute(
        "step"
    );


    if (
        actionType === "sale" ||
        actionType === "order"
    ) {

        secondaryField.min =
            "0";

        secondaryField.step =
            "0.01";
    }


    primaryField.value =
        "";

    secondaryField.value =
        "";


    /* ABRE */

    modal.hidden =
        false;


    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "modal-open"
    );


    window.setTimeout(
        () => {

            primaryField.focus();

        },
        50
    );
}


/* =========================================================
   FECHAR MODAL
========================================================= */

function closeActionModal() {

    const modal =
        document.getElementById(
            "actionModal"
        );

    if (!modal) {
        return;
    }

    modal.hidden =
        true;

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.classList.remove(
        "modal-open"
    );
}


/* =========================================================
   SALVAR VENDA / PEDIDO
========================================================= */

function handleActionFormSubmit(
    event
) {

    event.preventDefault();


    const actionType =
        document
            .getElementById(
                "actionType"
            )
            ?.value ||
        "";


    const primaryValue =
        document
            .getElementById(
                "primaryField"
            )
            ?.value
            .trim() ||
        "";


    const secondaryValue =
        document
            .getElementById(
                "secondaryField"
            )
            ?.value
            .trim() ||
        "";


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


    const searchInput =
        document.getElementById(
            "globalSearch"
        );


    if (searchInput) {

        searchInput.value =
            "";
    }


    renderDashboard();

    closeActionModal();


    showToast(
        "Registro temporário salvo com sucesso."
    );
}


/* =========================================================
   CRIAR ATIVIDADE
========================================================= */

function createActivityFromAction(
    actionType,
    primaryValue,
    secondaryValue
) {

    const timestamp =
        Date.now();


    switch (actionType) {


        /* VENDA */

        case "sale":

            dashboardState.sales +=
                1;


            dashboardState.revenue +=
                parseDecimalValue(
                    secondaryValue
                );


            return {

                description:
                    `Venda registrada: ${primaryValue}`,

                category:
                    "Vendas",

                timestamp
            };


        /* PEDIDO */

        case "order":

            return {

                description:
                    `Pedido registrado: ${primaryValue}`,

                category:
                    "Pedidos",

                timestamp
            };


        default:

            return null;
    }
}


/* =========================================================
   CONVERTER VALORES
========================================================= */

function parseDecimalValue(value) {

    const raw =
        String(value)
            .trim();


    if (!raw) {

        return 0;
    }


    /*
        Aceita:

        89.90
        89,90
        1.250,90
    */

    const normalized =
        raw.includes(",")

            ? raw
                .replace(
                    /\./g,
                    ""
                )
                .replace(
                    ",",
                    "."
                )

            : raw;


    const parsedValue =
        Number.parseFloat(
            normalized
        );


    return Number.isFinite(
        parsedValue
    )
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

    if (!clearButton) {
        return;
    }

    clearButton.addEventListener(
        "click",
        () => {

            const confirmed =
                window.confirm(
                    "Deseja limpar as atividades temporárias?"
                );

            if (!confirmed) {
                return;
            }

            dashboardState.activities =
                [];

            saveDashboardState();


            const searchInput =
                document.getElementById(
                    "globalSearch"
                );


            renderActivities(
                searchInput
                    ? searchInput.value
                    : ""
            );


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

    if (!logoutButton) {
        return;
    }

    logoutButton.addEventListener(
        "click",
        () => {

            const confirmed =
                window.confirm(
                    "Deseja sair da sua conta?"
                );

            if (!confirmed) {
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
        document.getElementById(
            "toast"
        );

    const toastMessage =
        document.getElementById(
            "toastMessage"
        );

    if (
        !toast ||
        !toastMessage
    ) {

        console.log(message);

        return;
    }

    toastMessage.textContent =
        message;

    toast.classList.add(
        "show"
    );

    window.clearTimeout(
        toastTimer
    );

    toastTimer =
        window.setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            3200
        );
}