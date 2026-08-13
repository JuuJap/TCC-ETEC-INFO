"use strict";


/* =========================================================
   CONFIGURAÇÕES
========================================================= */

const THEME_KEY =
    "theme";

const USER_KEY =
    "usuarioLogado";

const CLIENTS_KEY =
    "velasClientesTemporarios";

const DASHBOARD_KEY =
    "velasDashboardTemporario";


const REAL_PAGES = {

    home:
        "home.html",

    clientes:
        "clientes.html",

    produtos:
        "produtos.html"

};


let clients = [];

let toastTimer;


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeClientsPage
);


function initializeClientsPage() {

    const loggedUser =
        sessionStorage.getItem(
            USER_KEY
        );


    /* VERIFICA LOGIN */

    if (!loggedUser) {

        window.location.replace(
            "index.html"
        );

        return;
    }


    /* CARREGA CLIENTES */

    clients =
        loadClients();


    /* CONFIGURAÇÕES */

    configureUser(
        loggedUser
    );

    configureTheme();

    configureSidebar();

    /*
        Corrige Clientes e Produtos antes
        dos links demonstrativos.
    */

    configureNavigation();

    configureRealNavigation();

    configureDemoLinks();

    configureSearchAndFilter();

    configureClientModal();

    configureClientActions();

    configureLogout();


    /* MOSTRA CLIENTES */

    renderClients();


    /* ?novo=1 */

    openNewClientFromUrl();
}


/* =========================================================
   CLIENTES INICIAIS
========================================================= */

function createInitialClients() {

    const now =
        Date.now();


    const day =
        24 *
        60 *
        60 *
        1000;


    return [

        {
            id:
                "demo-1",

            name:
                "Ana Souza",

            email:
                "ana.souza@email.com",

            phone:
                "(11) 99912-4580",

            city:
                "São Paulo",

            status:
                "active",

            createdAt:
                now -
                2 *
                day
        },

        {
            id:
                "demo-2",

            name:
                "Carlos Mendes",

            email:
                "carlos.mendes@email.com",

            phone:
                "(11) 98845-1022",

            city:
                "Guarulhos",

            status:
                "active",

            createdAt:
                now -
                6 *
                day
        },

        {
            id:
                "demo-3",

            name:
                "Fernanda Lima",

            email:
                "fernanda.lima@email.com",

            phone:
                "(11) 97734-8621",

            city:
                "São Bernardo do Campo",

            status:
                "active",

            createdAt:
                now -
                12 *
                day
        },

        {
            id:
                "demo-4",

            name:
                "Marcos Oliveira",

            email:
                "",

            phone:
                "(11) 96620-3175",

            city:
                "Santo André",

            status:
                "inactive",

            createdAt:
                now -
                38 *
                day
        },

        {
            id:
                "demo-5",

            name:
                "Juliana Costa",

            email:
                "juliana.costa@email.com",

            phone:
                "",

            city:
                "São Paulo",

            status:
                "active",

            createdAt:
                now -
                52 *
                day
        }

    ];
}


/* =========================================================
   CARREGAR CLIENTES
========================================================= */

function loadClients() {

    try {

        const storedClients =
            sessionStorage.getItem(
                CLIENTS_KEY
            );


        if (!storedClients) {

            const initialClients =
                createInitialClients();


            saveClients(
                initialClients
            );


            return initialClients;
        }


        const parsedClients =
            JSON.parse(
                storedClients
            );


        if (
            !Array.isArray(
                parsedClients
            )
        ) {

            throw new Error(
                "Lista de clientes inválida."
            );
        }


        return parsedClients;

    }

    catch (error) {

        console.warn(
            "Não foi possível carregar os clientes:",
            error
        );


        const initialClients =
            createInitialClients();


        saveClients(
            initialClients
        );


        return initialClients;
    }
}


/* =========================================================
   SALVAR CLIENTES
========================================================= */

function saveClients(
    clientList = clients
) {

    try {

        sessionStorage.setItem(
            CLIENTS_KEY,
            JSON.stringify(
                clientList
            )
        );

    }

    catch (error) {

        console.error(
            "Não foi possível salvar os clientes:",
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

function configureUser(
    userName
) {

    const userNameElement =
        document.getElementById(
            "userName"
        );


    const userAvatarElement =
        document.getElementById(
            "userAvatar"
        );


    if (userNameElement) {

        userNameElement.textContent =
            userName;
    }


    if (userAvatarElement) {

        userAvatarElement.textContent =
            createInitials(
                userName
            );
    }
}


/* =========================================================
   INICIAIS
========================================================= */

function createInitials(name) {

    const words =
        String(name ?? "")
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (!words.length) {

        return "US";
    }


    if (words.length === 1) {

        return words[0]
            .slice(
                0,
                2
            )
            .toUpperCase();
    }


    return (

        words[0][0] +

        words[
            words.length -
            1
        ][0]

    ).toUpperCase();
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


    applyTheme(
        initialTheme
    );


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


            applyTheme(
                newTheme
            );


            localStorage.setItem(
                THEME_KEY,
                newTheme
            );
        }
    );
}


/* =========================================================
   APLICAR TEMA
========================================================= */

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


    document.body
        .classList
        .toggle(
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


/* =========================================================
   SINCRONIZA TEMA ENTRE ABAS
========================================================= */

window.addEventListener(
    "storage",
    event => {

        if (
            event.key ===
                THEME_KEY &&

            (
                event.newValue ===
                    "dark" ||

                event.newValue ===
                    "light"
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
        .querySelectorAll(
            ".menu-item"
        )
        .forEach(
            menuItem => {

                menuItem.addEventListener(
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
            }
        );


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
        String(
            isOpen
        )
    );


    menuToggle.setAttribute(
        "aria-label",

        isOpen
            ? "Fechar menu"
            : "Abrir menu"
    );
}


function closeSidebar() {

    document.body
        .classList
        .remove(
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
   NORMALIZAR TEXTO
========================================================= */

function normalizeText(text) {

    return String(
        text ?? ""
    )
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
========================================================= */

function configureNavigation() {

    document
        .querySelectorAll(
            ".menu-item"
        )
        .forEach(
            link => {

                const text =
                    normalizeText(
                        link.textContent
                    );


                /* INÍCIO */

                if (
                    text === "inicio"
                ) {

                    link.href =
                        REAL_PAGES.home;


                    link.removeAttribute(
                        "data-demo-link"
                    );


                    return;
                }


                /* CLIENTES */

                if (
                    text === "clientes"
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
                    text === "produtos"
                ) {

                    link.href =
                        REAL_PAGES.produtos;


                    link.removeAttribute(
                        "data-demo-link"
                    );
                }
            }
        );
}


/* =========================================================
   PROTEÇÃO EXTRA DE NAVEGAÇÃO

   Mesmo que algum HTML antigo possua
   data-demo-link em Clientes ou Produtos,
   este listener garante o redirecionamento.
========================================================= */

function configureRealNavigation() {

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


            /* INÍCIO */

            if (
                pageName ===
                "inicio"
            ) {

                event.preventDefault();

                event.stopImmediatePropagation();


                window.location.href =
                    REAL_PAGES.home;


                return;
            }


            /* CLIENTES */

            if (
                pageName ===
                "clientes"
            ) {

                event.preventDefault();

                event.stopImmediatePropagation();


                window.location.href =
                    REAL_PAGES.clientes;


                return;
            }


            /* PRODUTOS */

            if (
                pageName ===
                "produtos"
            ) {

                event.preventDefault();

                event.stopImmediatePropagation();


                window.location.href =
                    REAL_PAGES.produtos;
            }

        },

        /*
            Captura o clique antes dos
            outros listeners.
        */

        true
    );
}


/* =========================================================
   LINKS DEMONSTRATIVOS

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
        .forEach(
            link => {

                const pageName =
                    normalizeText(
                        link.dataset.demoLink ||
                        ""
                    );


                /*
                    Caso um HTML antigo ainda
                    tenha Clientes ou Produtos
                    como demo, corrigimos aqui.
                */

                if (
                    pageName ===
                    "clientes"
                ) {

                    link.removeAttribute(
                        "data-demo-link"
                    );


                    link.href =
                        REAL_PAGES.clientes;


                    return;
                }


                if (
                    pageName ===
                    "produtos"
                ) {

                    link.removeAttribute(
                        "data-demo-link"
                    );


                    link.href =
                        REAL_PAGES.produtos;


                    return;
                }


                /* PÁGINAS AINDA FUTURAS */

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
            }
        );
}


/* =========================================================
   PESQUISA E FILTRO
========================================================= */

function configureSearchAndFilter() {

    const searchInput =
        document.getElementById(
            "clientSearch"
        );


    const statusFilter =
        document.getElementById(
            "statusFilter"
        );


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            renderClients
        );
    }


    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            renderClients
        );
    }
}


/* =========================================================
   CLIENTES FILTRADOS
========================================================= */

function getFilteredClients() {

    const searchInput =
        document.getElementById(
            "clientSearch"
        );


    const statusFilter =
        document.getElementById(
            "statusFilter"
        );


    const searchTerm =
        normalizeText(

            searchInput
                ? searchInput.value
                : ""

        );


    const status =
        statusFilter
            ? statusFilter.value
            : "all";


    return clients.filter(
        client => {

            const searchableText =
                normalizeText(
                    [
                        client.name,
                        client.email,
                        client.phone,
                        client.city
                    ].join(" ")
                );


            const matchesSearch =
                !searchTerm ||

                searchableText.includes(
                    searchTerm
                );


            const matchesStatus =
                status ===
                    "all" ||

                client.status ===
                    status;


            return (
                matchesSearch &&
                matchesStatus
            );
        }
    );
}


/* =========================================================
   RENDERIZAÇÃO
========================================================= */

function renderClients() {

    renderStatistics();

    renderClientsTable();
}


/* =========================================================
   ESTATÍSTICAS
========================================================= */

function renderStatistics() {

    const activeClients =
        clients.filter(
            client =>
                client.status ===
                "active"
        ).length;


    const clientsWithEmail =
        clients.filter(
            client =>

                String(
                    client.email ??
                    ""
                ).trim() !==
                ""

        ).length;


    const now =
        new Date();


    const newClientsThisMonth =
        clients.filter(
            client => {

                const createdAt =
                    new Date(
                        client.createdAt
                    );


                return (

                    createdAt.getMonth() ===
                        now.getMonth() &&

                    createdAt.getFullYear() ===
                        now.getFullYear()

                );
            }
        ).length;


    setText(
        "totalClients",
        formatNumber(
            clients.length
        )
    );


    setText(
        "activeClients",
        formatNumber(
            activeClients
        )
    );


    setText(
        "newClientsThisMonth",
        formatNumber(
            newClientsThisMonth
        )
    );


    setText(
        "clientsWithEmail",
        formatNumber(
            clientsWithEmail
        )
    );
}


/* =========================================================
   ALTERAR TEXTO
========================================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;
    }
}


/* =========================================================
   TABELA
========================================================= */

function renderClientsTable() {

    const tableBody =
        document.getElementById(
            "clientsTableBody"
        );


    const emptyState =
        document.getElementById(
            "clientsEmptyState"
        );


    const resultsCounter =
        document.getElementById(
            "resultsCounter"
        );


    if (!tableBody) {

        return;
    }


    const filteredClients =
        getFilteredClients()
            .slice()
            .sort(
                (a, b) =>

                    Number(
                        b.createdAt
                    ) -

                    Number(
                        a.createdAt
                    )
            );


    tableBody.innerHTML =
        "";


    filteredClients.forEach(
        client => {

            tableBody.appendChild(
                createClientRow(
                    client
                )
            );
        }
    );


    if (emptyState) {

        emptyState.hidden =
            filteredClients.length >
            0;
    }


    if (resultsCounter) {

        resultsCounter.textContent =
            formatResultsCounter(
                filteredClients.length
            );
    }
}


/* =========================================================
   LINHA DO CLIENTE
========================================================= */

function createClientRow(
    client
) {

    const row =
        document.createElement(
            "tr"
        );


    const clientCell =
        document.createElement(
            "td"
        );


    const contactCell =
        document.createElement(
            "td"
        );


    const cityCell =
        document.createElement(
            "td"
        );


    const statusCell =
        document.createElement(
            "td"
        );


    const createdAtCell =
        document.createElement(
            "td"
        );


    const actionsCell =
        document.createElement(
            "td"
        );


    /* CLIENTE */

    clientCell.appendChild(
        createClientIdentity(
            client
        )
    );


    /* CONTATO */

    contactCell.appendChild(
        createClientContact(
            client
        )
    );


    /* CIDADE */

    cityCell.className =
        "client-city";


    cityCell.textContent =
        client.city ||
        "Não informado";


    /* STATUS */

    statusCell.appendChild(
        createStatusBadge(
            client.status
        )
    );


    /* DATA */

    createdAtCell.className =
        "client-created-at";


    createdAtCell.textContent =
        formatDate(
            client.createdAt
        );


    /* AÇÕES */

    actionsCell.appendChild(
        createClientActions(
            client
        )
    );


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


/* =========================================================
   IDENTIDADE DO CLIENTE
========================================================= */

function createClientIdentity(
    client
) {

    const wrapper =
        document.createElement(
            "div"
        );


    const avatar =
        document.createElement(
            "div"
        );


    const identity =
        document.createElement(
            "div"
        );


    const name =
        document.createElement(
            "strong"
        );


    const code =
        document.createElement(
            "span"
        );


    wrapper.className =
        "client-cell";


    avatar.className =
        "client-avatar";


    identity.className =
        "client-identity";


    avatar.textContent =
        createInitials(
            client.name
        );


    name.textContent =
        client.name;


    code.textContent =
        createClientCode(
            client.id
        );


    identity.append(
        name,
        code
    );


    wrapper.append(
        avatar,
        identity
    );


    return wrapper;
}


/* =========================================================
   CONTATO
========================================================= */

function createClientContact(
    client
) {

    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "contact-cell";


    /* E-MAIL */

    if (client.email) {

        const email =
            document.createElement(
                "a"
            );


        email.href =
            `mailto:${client.email}`;


        email.textContent =
            client.email;


        wrapper.appendChild(
            email
        );
    }


    /* TELEFONE */

    if (client.phone) {

        const phone =
            document.createElement(
                "span"
            );


        phone.textContent =
            client.phone;


        wrapper.appendChild(
            phone
        );
    }


    /* SEM CONTATO */

    if (
        !client.email &&
        !client.phone
    ) {

        const empty =
            document.createElement(
                "span"
            );


        empty.textContent =
            "Não informado";


        wrapper.appendChild(
            empty
        );
    }


    return wrapper;
}


/* =========================================================
   STATUS
========================================================= */

function createStatusBadge(
    status
) {

    const badge =
        document.createElement(
            "span"
        );


    const isActive =
        status ===
        "active";


    badge.className =
        `status-badge ${
            isActive
                ? "active"
                : "inactive"
        }`;


    badge.textContent =
        isActive
            ? "Ativo"
            : "Inativo";


    return badge;
}


/* =========================================================
   AÇÕES DA TABELA
========================================================= */

function createClientActions(
    client
) {

    const wrapper =
        document.createElement(
            "div"
        );


    const editButton =
        document.createElement(
            "button"
        );


    const deleteButton =
        document.createElement(
            "button"
        );


    wrapper.className =
        "client-actions";


    /* EDITAR */

    editButton.className =
        "table-action-button";


    editButton.type =
        "button";


    editButton.textContent =
        "Editar";


    editButton.dataset.clientAction =
        "edit";


    editButton.dataset.clientId =
        client.id;


    editButton.setAttribute(
        "aria-label",
        `Editar ${client.name}`
    );


    /* EXCLUIR */

    deleteButton.className =
        "table-action-button delete";


    deleteButton.type =
        "button";


    deleteButton.textContent =
        "Excluir";


    deleteButton.dataset.clientAction =
        "delete";


    deleteButton.dataset.clientId =
        client.id;


    deleteButton.setAttribute(
        "aria-label",
        `Excluir ${client.name}`
    );


    wrapper.append(
        editButton,
        deleteButton
    );


    return wrapper;
}


/* =========================================================
   CÓDIGO DO CLIENTE
========================================================= */

function createClientCode(id) {

    const cleanId =
        String(id)
            .replace(
                /[^a-zA-Z0-9]/g,
                ""
            )
            .slice(-6)
            .toUpperCase();


    return (
        `Cliente #${
            cleanId ||
            "000001"
        }`
    );
}


/* =========================================================
   DATA
========================================================= */

function formatDate(timestamp) {

    const date =
        new Date(
            timestamp
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "Não informado";
    }


    return new Intl.DateTimeFormat(
        "pt-BR",
        {
            day:
                "2-digit",

            month:
                "2-digit",

            year:
                "numeric"
        }
    ).format(
        date
    );
}


/* =========================================================
   NÚMEROS
========================================================= */

function formatNumber(value) {

    return new Intl.NumberFormat(
        "pt-BR"
    ).format(
        Number(value) || 0
    );
}


/* =========================================================
   CONTADOR
========================================================= */

function formatResultsCounter(total) {

    if (total === 1) {

        return "1 cliente exibido";
    }


    return `${total} clientes exibidos`;
}


/* =========================================================
   MODAL
========================================================= */

function configureClientModal() {

    const newClientButton =
        document.getElementById(
            "newClientButton"
        );


    const clientForm =
        document.getElementById(
            "clientForm"
        );


    if (newClientButton) {

        newClientButton.addEventListener(
            "click",
            openNewClientModal
        );
    }


    if (clientForm) {

        clientForm.addEventListener(
            "submit",
            handleClientFormSubmit
        );
    }


    document
        .querySelectorAll(
            "[data-close-client-modal]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    closeClientModal
                );
            }
        );


    document.addEventListener(
        "keydown",
        event => {

            const modal =
                document.getElementById(
                    "clientModal"
                );


            if (
                modal &&
                event.key ===
                    "Escape" &&
                !modal.hidden
            ) {

                closeClientModal();
            }
        }
    );
}


/* =========================================================
   NOVO CLIENTE
========================================================= */

function openNewClientModal() {

    resetClientForm();


    setText(
        "clientModalTitle",
        "Novo cliente"
    );


    setText(
        "clientModalDescription",
        "Preencha os dados básicos do cliente."
    );


    openClientModal();
}


/* =========================================================
   EDITAR CLIENTE
========================================================= */

function openEditClientModal(
    clientId
) {

    const client =
        clients.find(
            item =>
                item.id ===
                clientId
        );


    if (!client) {

        showToast(
            "Cliente não encontrado."
        );


        return;
    }


    const clientIdInput =
        document.getElementById(
            "clientId"
        );


    const clientNameInput =
        document.getElementById(
            "clientName"
        );


    const clientEmailInput =
        document.getElementById(
            "clientEmail"
        );


    const clientPhoneInput =
        document.getElementById(
            "clientPhone"
        );


    const clientCityInput =
        document.getElementById(
            "clientCity"
        );


    const clientStatusInput =
        document.getElementById(
            "clientStatus"
        );


    if (clientIdInput) {

        clientIdInput.value =
            client.id;
    }


    if (clientNameInput) {

        clientNameInput.value =
            client.name;
    }


    if (clientEmailInput) {

        clientEmailInput.value =
            client.email ||
            "";
    }


    if (clientPhoneInput) {

        clientPhoneInput.value =
            client.phone ||
            "";
    }


    if (clientCityInput) {

        clientCityInput.value =
            client.city ||
            "";
    }


    if (clientStatusInput) {

        clientStatusInput.value =
            client.status ||
            "active";
    }


    setText(
        "clientModalTitle",
        "Editar cliente"
    );


    setText(
        "clientModalDescription",
        "Atualize as informações do cadastro temporário."
    );


    openClientModal();
}


/* =========================================================
   ABRIR MODAL
========================================================= */

function openClientModal() {

    const modal =
        document.getElementById(
            "clientModal"
        );


    if (!modal) {

        return;
    }


    modal.hidden =
        false;


    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body
        .classList
        .add(
            "modal-open"
        );


    window.setTimeout(
        () => {

            document
                .getElementById(
                    "clientName"
                )
                ?.focus();

        },
        50
    );
}


/* =========================================================
   FECHAR MODAL
========================================================= */

function closeClientModal() {

    const modal =
        document.getElementById(
            "clientModal"
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


    document.body
        .classList
        .remove(
            "modal-open"
        );
}


/* =========================================================
   LIMPAR FORMULÁRIO
========================================================= */

function resetClientForm() {

    const form =
        document.getElementById(
            "clientForm"
        );


    if (form) {

        form.reset();
    }


    const clientId =
        document.getElementById(
            "clientId"
        );


    const clientStatus =
        document.getElementById(
            "clientStatus"
        );


    if (clientId) {

        clientId.value =
            "";
    }


    if (clientStatus) {

        clientStatus.value =
            "active";
    }
}


/* =========================================================
   SALVAR FORMULÁRIO
========================================================= */

function handleClientFormSubmit(event) {

    event.preventDefault();


    const clientId =
        document
            .getElementById(
                "clientId"
            )
            ?.value ||
        "";


    const name =
        document
            .getElementById(
                "clientName"
            )
            ?.value
            .trim() ||
        "";


    const email =
        document
            .getElementById(
                "clientEmail"
            )
            ?.value
            .trim() ||
        "";


    const phone =
        document
            .getElementById(
                "clientPhone"
            )
            ?.value
            .trim() ||
        "";


    const city =
        document
            .getElementById(
                "clientCity"
            )
            ?.value
            .trim() ||
        "";


    const status =
        document
            .getElementById(
                "clientStatus"
            )
            ?.value ||
        "active";


    /* NOME OBRIGATÓRIO */

    if (!name) {

        showToast(
            "Digite o nome do cliente."
        );


        return;
    }


    /* EDITAR */

    if (clientId) {

        updateClient({

            id:
                clientId,

            name,

            email,

            phone,

            city,

            status

        });

    }

    /* NOVO */

    else {

        addClient({

            name,

            email,

            phone,

            city,

            status

        });
    }


    saveClients();


    renderClients();


    closeClientModal();
}


/* =========================================================
   ADICIONAR CLIENTE
========================================================= */

function addClient(clientData) {

    const newClient = {

        id:
            generateClientId(),

        ...clientData,

        createdAt:
            Date.now()

    };


    clients.unshift(
        newClient
    );


    updateDashboardForClientChange(
        1,
        `Cliente ${newClient.name} cadastrado`
    );


    showToast(
        "Cliente cadastrado temporariamente."
    );
}


/* =========================================================
   ATUALIZAR CLIENTE
========================================================= */

function updateClient(clientData) {

    const index =
        clients.findIndex(
            client =>
                client.id ===
                clientData.id
        );


    if (index === -1) {

        showToast(
            "Cliente não encontrado."
        );


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


    showToast(
        "Cadastro do cliente atualizado."
    );
}


/* =========================================================
   GERAR ID
========================================================= */

function generateClientId() {

    if (
        typeof crypto !==
            "undefined" &&

        typeof crypto.randomUUID ===
            "function"
    ) {

        return crypto.randomUUID();
    }


    return (
        `client-${Date.now()}-${
            Math.random()
                .toString(16)
                .slice(2)
        }`
    );
}


/* =========================================================
   ?novo=1

   UTILIZADO PELO BOTÃO "NOVO CLIENTE"
   DA HOME
========================================================= */

function openNewClientFromUrl() {

    const url =
        new URL(
            window.location.href
        );


    if (
        url.searchParams.get(
            "novo"
        ) !==
        "1"
    ) {

        return;
    }


    openNewClientModal();


    url.searchParams.delete(
        "novo"
    );


    window.history.replaceState(
        {},
        "",
        url.pathname +
        url.search +
        url.hash
    );
}


/* =========================================================
   CLIQUES EDITAR / EXCLUIR
========================================================= */

function configureClientActions() {

    const tableBody =
        document.getElementById(
            "clientsTableBody"
        );


    if (!tableBody) {

        return;
    }


    tableBody.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-client-action]"
                );


            if (!button) {

                return;
            }


            const clientId =
                button.dataset.clientId;


            const action =
                button.dataset.clientAction;


            /* EDITAR */

            if (
                action ===
                "edit"
            ) {

                openEditClientModal(
                    clientId
                );


                return;
            }


            /* EXCLUIR */

            if (
                action ===
                "delete"
            ) {

                deleteClient(
                    clientId
                );
            }
        }
    );
}


/* =========================================================
   EXCLUIR CLIENTE
========================================================= */

function deleteClient(clientId) {

    const client =
        clients.find(
            item =>
                item.id ===
                clientId
        );


    if (!client) {

        showToast(
            "Cliente não encontrado."
        );


        return;
    }


    const shouldDelete =
        window.confirm(
            `Deseja excluir o cadastro de ${client.name}?`
        );


    if (!shouldDelete) {

        return;
    }


    clients =
        clients.filter(
            item =>
                item.id !==
                clientId
        );


    saveClients();


    updateDashboardForClientChange(
        -1,
        `Cliente ${client.name} removido`
    );


    renderClients();


    showToast(
        "Cliente removido da demonstração."
    );
}


/* =========================================================
   INTEGRAÇÃO COM A HOME
========================================================= */

function updateDashboardForClientChange(
    countChange,
    description
) {

    try {

        const storedDashboard =
            sessionStorage.getItem(
                DASHBOARD_KEY
            );


        if (!storedDashboard) {

            return;
        }


        const dashboard =
            JSON.parse(
                storedDashboard
            );


        if (
            !dashboard ||
            typeof dashboard !==
                "object"
        ) {

            return;
        }


        const currentClients =
            Number(
                dashboard.clients
            ) || 0;


        dashboard.clients =
            Math.max(
                0,
                currentClients +
                countChange
            );


        if (
            !Array.isArray(
                dashboard.activities
            )
        ) {

            dashboard.activities =
                [];
        }


        dashboard.activities.unshift({

            description,

            category:
                "Clientes",

            timestamp:
                Date.now()

        });


        dashboard.activities =
            dashboard.activities
                .slice(
                    0,
                    20
                );


        sessionStorage.setItem(
            DASHBOARD_KEY,
            JSON.stringify(
                dashboard
            )
        );

    }

    catch (error) {

        console.warn(
            "Não foi possível sincronizar o cliente com a Home:",
            error
        );
    }
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

        console.log(
            message
        );


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