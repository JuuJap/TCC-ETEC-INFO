"use strict";

const {
    KEYS,
    initAdminPage,
    normalizeText,
    parseDecimalValue,
    formatCurrency,
    formatDateTime,
    showToast
} = VST;


// CONFIGURAÇÕES
const SALES_KEY = KEYS.SALES;

const DASHBOARD_KEY = KEYS.DASHBOARD;

const FINANCE_KEY = KEYS.FINANCE;
let sales = [];
// INICIALIZAÇÃO

document.addEventListener(
    "DOMContentLoaded",
    initializeSalesPage
);


function initializeSalesPage() {

    const loggedUser = initAdminPage();
    if (!loggedUser) return;


    /* CARREGA VENDAS */

    sales =
        loadSales();


    /* CONFIGURAÇÕES */

    configureSearch();

    configureSaleForm();


    /* RENDERIZA */

    renderSales();


    /* UTILIZADO PELA AÇÃO RÁPIDA */

    focusSaleFromUrl();
}


// CARREGAR VENDAS

function loadSales() {

    try {

        const storedSales =
            sessionStorage.getItem(
                SALES_KEY
            );


        if (!storedSales) {

            return [];
        }


        const parsedSales =
            JSON.parse(
                storedSales
            );


        if (
            !Array.isArray(
                parsedSales
            )
        ) {

            throw new Error(
                "Histórico de vendas inválido."
            );
        }


        return parsedSales;

    }

    catch (error) {

        console.warn(
            "Não foi possível carregar as vendas:",
            error
        );


        return [];
    }
}


// SALVAR VENDAS

function saveSales() {

    try {

        sessionStorage.setItem(
            SALES_KEY,
            JSON.stringify(
                sales
            )
        );

    }

    catch (error) {

        console.error(
            "Não foi possível salvar as vendas:",
            error
        );


        showToast(
            "Não foi possível salvar os dados."
        );
    }
}


// USUÁRIO
// INICIAIS
// TEMA
// APLICAR TEMA
// SINCRONIZAR TEMA

// MENU LATERAL
// NORMALIZAR TEXTO
// NAVEGAÇÃO
// PROTEÇÃO EXTRA DOS LINKS REAIS
// LINKS FUTUROS
// PESQUISA

function configureSearch() {

    const searchInput =
        document.getElementById(
            "saleSearch"
        );


    if (!searchInput) {

        return;
    }


    searchInput.addEventListener(
        "input",
        renderSales
    );
}


// FORMULÁRIO

function configureSaleForm() {

    const saleForm =
        document.getElementById(
            "saleForm"
        );


    if (!saleForm) {

        return;
    }


    saleForm.addEventListener(
        "submit",
        registerSale
    );
}


// REGISTRAR VENDA

function registerSale(event) {

    event.preventDefault();


    const descriptionInput =
        document.getElementById(
            "saleDescription"
        );


    const valueInput =
        document.getElementById(
            "saleValue"
        );


    if (
        !descriptionInput ||
        !valueInput
    ) {

        return;
    }


    const description =
        descriptionInput
            .value
            .trim();


    const value =
        parseDecimalValue(
            valueInput.value
        );


    if (!description) {

        showToast(
            "Informe o cliente ou a descrição da venda."
        );


        descriptionInput.focus();


        return;
    }


    if (
        !Number.isFinite(
            value
        ) ||
        value <= 0
    ) {

        showToast(
            "Informe um valor válido para a venda."
        );


        valueInput.focus();


        return;
    }


    const newSale = {

        id:
            generateSaleId(),

        description,

        value,

        createdAt:
            Date.now()

    };


    sales.unshift(
        newSale
    );


    saveSales();


    updateDashboardForSale(
        newSale
    );


    registerSaleInFinance(
        newSale
    );


    descriptionInput.value =
        "";

    valueInput.value =
        "";


    const searchInput =
        document.getElementById(
            "saleSearch"
        );


    if (searchInput) {

        searchInput.value =
            "";
    }


    renderSales();


    descriptionInput.focus();


    showToast(
        "Venda registrada com sucesso."
    );
}


// GERAR ID

function generateSaleId() {

    if (
        typeof crypto !==
            "undefined" &&

        typeof crypto.randomUUID ===
            "function"
    ) {

        return crypto.randomUUID();
    }


    return (
        `sale-${Date.now()}-${
            Math.random()
                .toString(16)
                .slice(2)
        }`
    );
}


// CONVERTER VALOR
// FILTRAR VENDAS

function getFilteredSales() {

    const searchInput =
        document.getElementById(
            "saleSearch"
        );


    const searchTerm =
        normalizeText(

            searchInput
                ? searchInput.value
                : ""

        );


    if (!searchTerm) {

        return sales;
    }


    return sales.filter(
        sale => {

            const searchableText =
                normalizeText(
                    [
                        sale.description,
                        formatCurrency(
                            sale.value
                        ),
                        formatDateTime(
                            sale.createdAt
                        )
                    ].join(" ")
                );


            return searchableText.includes(
                searchTerm
            );
        }
    );
}


// RENDERIZAÇÃO

function renderSales() {

    const tableBody =
        document.getElementById(
            "salesTableBody"
        );


    const emptyState =
        document.getElementById(
            "salesEmptyState"
        );


    const salesCounter =
        document.getElementById(
            "salesCounter"
        );


    if (!tableBody) {

        return;
    }


    const filteredSales =
        getFilteredSales()
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


    filteredSales.forEach(
        sale => {

            tableBody.appendChild(
                createSaleRow(
                    sale
                )
            );
        }
    );


    if (emptyState) {

        emptyState.hidden =
            filteredSales.length >
            0;
    }


    if (salesCounter) {

        salesCounter.textContent =
            formatSalesCounter(
                filteredSales.length
            );
    }
}


// LINHA DA VENDA

function createSaleRow(sale) {

    const row =
        document.createElement(
            "tr"
        );


    const descriptionCell =
        document.createElement(
            "td"
        );


    const valueCell =
        document.createElement(
            "td"
        );


    const dateCell =
        document.createElement(
            "td"
        );


    descriptionCell.className =
        "sale-description";


    descriptionCell.textContent =
        sale.description;


    valueCell.className =
        "sale-value";


    valueCell.textContent =
        formatCurrency(
            sale.value
        );


    dateCell.className =
        "sale-date";


    dateCell.textContent =
        formatDateTime(
            sale.createdAt
        );


    row.append(
        descriptionCell,
        valueCell,
        dateCell
    );


    return row;
}


// FORMATAR DINHEIRO
// DATA E HORA
// CONTADOR

function formatSalesCounter(total) {

    if (total === 1) {

        return "1 venda registrada";
    }


    return (
        `${total} vendas registradas`
    );
}


// INTEGRAÇÃO COM A HOME

function updateDashboardForSale(sale) {

    try {

        let dashboard;


        const storedDashboard =
            sessionStorage.getItem(
                DASHBOARD_KEY
            );


        if (storedDashboard) {

            dashboard =
                JSON.parse(
                    storedDashboard
                );

        } else {

            dashboard = {

                schemaVersion: 2,

                clients:
                    128,

                products:
                    42,

                sales:
                    67,

                revenue:
                    12580.90,

                activities:
                    []

            };
        }


        if (
            !dashboard ||
            typeof dashboard !==
                "object"
        ) {

            return;
        }


        dashboard.sales =
            (
                Number(
                    dashboard.sales
                ) || 0
            ) + 1;


        dashboard.revenue =
            (
                Number(
                    dashboard.revenue
                ) || 0
            ) +
            sale.value;


        if (
            !Array.isArray(
                dashboard.activities
            )
        ) {

            dashboard.activities =
                [];
        }


        dashboard.activities.unshift({

            description:
                `Venda registrada: ${sale.description}`,

            category:
                "Vendas",

            timestamp:
                sale.createdAt

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
            "Não foi possível sincronizar a venda com a Home:",
            error
        );
    }
}


// INTEGRAÇÃO COM O CONTROLE GERAL

function registerSaleInFinance(sale) {

    try {

        const storedFinance =
            sessionStorage.getItem(
                FINANCE_KEY
            );

        let financeMovements =
            storedFinance
                ? JSON.parse(
                    storedFinance
                )
                : [];

        if (
            !Array.isArray(
                financeMovements
            )
        ) {
            financeMovements =
                [];
        }

        const alreadyExists =
            financeMovements.some(
                movement =>
                    movement.source ===
                        "sale" &&
                    movement.sourceId ===
                        sale.id
            );

        if (alreadyExists) {
            return;
        }

        financeMovements.unshift({

            id:
                `finance-sale-${sale.id}`,

            type:
                "entrada",

            description:
                sale.description,

            value:
                Number(
                    sale.value
                ) || 0,

            createdAt:
                sale.createdAt,

            source:
                "sale",

            sourceId:
                sale.id

        });

        sessionStorage.setItem(
            FINANCE_KEY,
            JSON.stringify(
                financeMovements
            )
        );

    } catch (error) {

        console.warn(
            "Não foi possível sincronizar a venda com o Financeiro:",
            error
        );
    }
}


// ?novo=1

function focusSaleFromUrl() {

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


    const descriptionInput =
        document.getElementById(
            "saleDescription"
        );


    if (descriptionInput) {

        window.setTimeout(
            () => {

                descriptionInput.focus();

            },
            50
        );
    }


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


// LOGOUT
// NOTIFICAÇÃO
