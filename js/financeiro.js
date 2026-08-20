"use strict";

const {
    KEYS,
    initAdminPage,
    normalizeText,
    parseDecimalValue,
    formatCurrency,
    formatWeight,
    formatDateTime,
    setText,
    showToast
} = VST;


// CONFIGURAÇÕES
const SALES_KEY = KEYS.SALES;
const ORDERS_KEY = KEYS.ORDERS;
const FINANCE_KEY = KEYS.FINANCE;
const DASHBOARD_KEY = KEYS.DASHBOARD;
let movements = [];
// INICIALIZAÇÃO

document.addEventListener(
    "DOMContentLoaded",
    initializeFinancePage
);

function initializeFinancePage() {

    const loggedUser = initAdminPage();
    if (!loggedUser) return;

    movements =
        loadMovements();

    /*
        Importa para o Controle Geral vendas que
        já tenham sido registradas anteriormente.
    */
    syncExistingSales();
    syncExistingOrders();
    configureSearch();
    configureFinanceForm();

    renderFinance();
}


// CARREGAMENTO

function loadMovements() {

    try {

        const stored =
            sessionStorage.getItem(
                FINANCE_KEY
            );

        if (!stored) {
            return [];
        }

        const parsed =
            JSON.parse(stored);

        if (!Array.isArray(parsed)) {
            throw new Error(
                "Histórico do Controle Geral inválido."
            );
        }

        return parsed.map(movement => ({
            ...movement,
            weight:
                Number(movement.weight) ||
                0
        }));

    } catch (error) {

        console.warn(
            "Não foi possível carregar o histórico do Controle Geral:",
            error
        );

        return [];
    }
}


function saveMovements() {

    try {

        sessionStorage.setItem(
            FINANCE_KEY,
            JSON.stringify(movements)
        );

    } catch (error) {

        console.error(
            "Não foi possível salvar o histórico do Controle Geral:",
            error
        );

        showToast(
            "Não foi possível salvar os dados desta sessão."
        );
    }
}


// SINCRONIZAÇÃO COM VENDAS

function syncExistingSales() {

    try {

        const storedSales =
            sessionStorage.getItem(
                SALES_KEY
            );

        if (!storedSales) {
            return;
        }

        const sales =
            JSON.parse(storedSales);

        if (!Array.isArray(sales)) {
            return;
        }

        let changed = false;

        sales.forEach(sale => {

            const alreadyExists =
                movements.some(
                    movement =>
                        movement.source === "sale" &&
                        movement.sourceId === sale.id
                );

            if (alreadyExists) {
                return;
            }

            const saleValue =
                Number(sale.value);

            if (
                !sale.id ||
                !sale.description ||
                !Number.isFinite(saleValue) ||
                saleValue <= 0
            ) {
                return;
            }

            movements.push({
                id:
                    `finance-sale-${sale.id}`,

                type:
                    "entrada",

                description:
                    sale.description,

                value:
                    saleValue,

                weight:
                    Number(sale.weight) ||
                    0,

                createdAt:
                    Number(sale.createdAt) ||
                    Date.now(),

                source:
                    "sale",

                sourceId:
                    sale.id
            });

            changed = true;
        });

        if (changed) {
            saveMovements();
        }

    } catch (error) {

        console.warn(
            "Não foi possível sincronizar as vendas com o Controle Geral:",
            error
        );
    }
}


// SINCRONIZAÇÃO COM PEDIDOS

function syncExistingOrders() {

    try {

        const storedOrders =
            sessionStorage.getItem(
                ORDERS_KEY
            );

        if (!storedOrders) {
            return;
        }

        const orders =
            JSON.parse(
                storedOrders
            );

        if (!Array.isArray(orders)) {
            return;
        }

        let changed = false;

        orders.forEach(order => {

            if (!order?.id) {
                return;
            }

            const orderValue =
                Number(order.totalValue) ||
                0;

            const orderWeight =
                Number(order.totalWeight) ||
                0;

            const index =
                movements.findIndex(
                    movement =>
                        movement.source === "order" &&
                        movement.sourceId === order.id
                );

            const movement = {
                id:
                    index !== -1
                        ? movements[index].id
                        : `finance-order-${order.id}`,

                type:
                    "entrada",

                description:
                    `Pedido #${String(
                        Number(order.number) || 0
                    ).padStart(4, "0")} - ${
                        order.client || "Cliente"
                    }`,

                value:
                    orderValue,

                weight:
                    orderWeight,

                createdAt:
                    index !== -1
                        ? movements[index].createdAt
                        : Number(order.createdAt) || Date.now(),

                source:
                    "order",

                sourceId:
                    order.id
            };

            if (index !== -1) {

                const previous =
                    movements[index];

                if (
                    Number(previous.value) !== movement.value ||
                    Number(previous.weight || 0) !== movement.weight ||
                    previous.description !== movement.description
                ) {
                    movements[index] = movement;
                    changed = true;
                }

            } else {

                movements.push(
                    movement
                );

                changed = true;
            }
        });

        if (changed) {
            saveMovements();
        }

    } catch (error) {

        console.warn(
            "Não foi possível sincronizar os pedidos com o Controle Geral:",
            error
        );
    }
}


// USUÁRIO
// TEMA
// MENU LATERAL
// NAVEGAÇÃO
// FORMULÁRIO

function configureFinanceForm() {

    const form =
        document.getElementById(
            "financeForm"
        );

    if (!form) {
        return;
    }

    form.addEventListener(
        "submit",
        registerMovement
    );
}


function registerMovement(event) {

    event.preventDefault();

    const typeInput =
        document.getElementById(
            "movementType"
        );

    const descriptionInput =
        document.getElementById(
            "movementDescription"
        );

    const valueInput =
        document.getElementById(
            "movementValue"
        );

    const weightInput =
        document.getElementById(
            "movementWeight"
        );

    if (
        !typeInput ||
        !descriptionInput ||
        !valueInput ||
        !weightInput
    ) {
        return;
    }

    const type =
        typeInput.value;

    const description =
        descriptionInput
            .value
            .trim();

    const value =
        parseDecimalValue(
            valueInput.value
        );

    const weight =
        parseDecimalValue(
            weightInput.value
        );

    if (
        type !== "entrada" &&
        type !== "saida"
    ) {

        showToast(
            "Selecione um tipo de movimentação válido."
        );

        return;
    }

    if (!description) {

        showToast(
            "Informe a descrição da movimentação."
        );

        descriptionInput.focus();

        return;
    }

    if (
        !Number.isFinite(value) ||
        value <= 0
    ) {

        showToast(
            "Informe um valor válido."
        );

        valueInput.focus();

        return;
    }

    if (
        !Number.isFinite(weight) ||
        weight < 0
    ) {

        showToast(
            "Informe um peso válido."
        );

        weightInput.focus();

        return;
    }

    const movement = {

        id:
            generateMovementId(),

        type,

        description,

        value,

        weight,

        createdAt:
            Date.now(),

        source:
            "manual"
    };

    movements.unshift(
        movement
    );

    saveMovements();

    addDashboardActivity(
        movement
    );

    descriptionInput.value =
        "";

    valueInput.value =
        "";

    weightInput.value =
        "";

    typeInput.value =
        "entrada";

    const searchInput =
        document.getElementById(
            "financeSearch"
        );

    if (searchInput) {
        searchInput.value =
            "";
    }

    renderFinance();

    descriptionInput.focus();

    showToast(
        "Movimentação registrada com sucesso."
    );
}


function generateMovementId() {

    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID ===
            "function"
    ) {
        return crypto.randomUUID();
    }

    return (
        `finance-${Date.now()}-${
            Math.random()
                .toString(16)
                .slice(2)
        }`
    );
}


// ATIVIDADE NA HOME

function addDashboardActivity(
    movement
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

        if (
            !Array.isArray(
                dashboard.activities
            )
        ) {
            dashboard.activities =
                [];
        }

        const typeLabel =
            movement.type === "entrada"
                ? "Entrada"
                : "Saída";

        dashboard.activities.unshift({
            description:
                `${typeLabel} geral: ${movement.description}`,

            category:
                "Controle Geral",

            timestamp:
                movement.createdAt
        });

        dashboard.activities =
            dashboard.activities
                .slice(0, 20);

        sessionStorage.setItem(
            DASHBOARD_KEY,
            JSON.stringify(dashboard)
        );

    } catch (error) {

        console.warn(
            "Não foi possível adicionar a atividade do Controle Geral à Home:",
            error
        );
    }
}


// PESQUISA

function configureSearch() {

    const searchInput =
        document.getElementById(
            "financeSearch"
        );

    if (!searchInput) {
        return;
    }

    searchInput.addEventListener(
        "input",
        renderHistory
    );
}


function getFilteredMovements() {

    const searchInput =
        document.getElementById(
            "financeSearch"
        );

    const searchTerm =
        normalizeText(
            searchInput
                ? searchInput.value
                : ""
        );

    if (!searchTerm) {
        return movements;
    }

    return movements.filter(
        movement => {

            const searchableText =
                normalizeText(
                    [
                        movement.description,
                        movement.type,
                        movement.type === "entrada"
                            ? "entrada"
                            : "saida saída",
                        formatCurrency(
                            movement.value
                        ),
                        formatWeight(
                            movement.weight
                        ),
                        formatDateTime(
                            movement.createdAt
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

function renderFinance() {

    renderSummary();
    renderHistory();
}


function renderSummary() {

    const totalIncome =
        movements
            .filter(
                movement =>
                    movement.type ===
                    "entrada"
            )
            .reduce(
                (total, movement) =>
                    total +
                    Number(
                        movement.value ||
                        0
                    ),
                0
            );

    const totalExpenses =
        movements
            .filter(
                movement =>
                    movement.type ===
                    "saida"
            )
            .reduce(
                (total, movement) =>
                    total +
                    Number(
                        movement.value ||
                        0
                    ),
                0
            );

    const balance =
        totalIncome -
        totalExpenses;

    const totalWeight =
        movements.reduce(
            (total, movement) =>
                total +
                Number(
                    movement.weight ||
                    0
                ),
            0
        );

    setText(
        "totalIncome",
        formatCurrency(
            totalIncome
        )
    );

    setText(
        "totalExpenses",
        formatCurrency(
            totalExpenses
        )
    );

    setText(
        "currentBalance",
        formatCurrency(
            balance
        )
    );

    setText(
        "totalWeight",
        formatWeight(
            totalWeight
        )
    );
}


function renderHistory() {

    const tableBody =
        document.getElementById(
            "financeTableBody"
        );

    const emptyState =
        document.getElementById(
            "financeEmptyState"
        );

    const counter =
        document.getElementById(
            "financeCounter"
        );

    if (!tableBody) {
        return;
    }

    const filtered =
        getFilteredMovements()
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

    filtered.forEach(
        movement => {

            tableBody.appendChild(
                createMovementRow(
                    movement
                )
            );
        }
    );

    if (emptyState) {
        emptyState.hidden =
            filtered.length > 0;
    }

    if (counter) {
        counter.textContent =
            formatMovementCounter(
                filtered.length
            );
    }
}


function createMovementRow(
    movement
) {

    const row =
        document.createElement(
            "tr"
        );

    const descriptionCell =
        document.createElement(
            "td"
        );

    const typeCell =
        document.createElement(
            "td"
        );

    const valueCell =
        document.createElement(
            "td"
        );

    const weightCell =
        document.createElement(
            "td"
        );

    const dateCell =
        document.createElement(
            "td"
        );

    descriptionCell.className =
        "finance-description";

    descriptionCell.textContent =
        movement.description;

    typeCell.className =
        "finance-type";

    const typeBadge =
        document.createElement(
            "span"
        );

    const isIncome =
        movement.type ===
        "entrada";

    typeBadge.className =
        `finance-type-badge ${
            isIncome
                ? "income"
                : "expense"
        }`;

    typeBadge.textContent =
        isIncome
            ? "Entrada"
            : "Saída";

    typeCell.appendChild(
        typeBadge
    );

    valueCell.className =
        `finance-value ${
            isIncome
                ? "income"
                : "expense"
        }`;

    valueCell.textContent =
        `${
            isIncome
                ? "+"
                : "−"
        } ${formatCurrency(
            movement.value
        )}`;

    weightCell.className =
        "finance-weight";

    weightCell.textContent =
        Number(movement.weight) > 0
            ? formatWeight(
                movement.weight
            )
            : "—";

    dateCell.className =
        "finance-date";

    dateCell.textContent =
        formatDateTime(
            movement.createdAt
        );

    row.append(
        descriptionCell,
        typeCell,
        valueCell,
        weightCell,
        dateCell
    );

    return row;
}


// UTILIDADES
function formatMovementCounter(total) {

    if (total === 1) {
        return "1 movimentação registrada";
    }

    return (
        `${total} movimentações registradas`
    );
}


// LOGOUT
// NOTIFICAÇÃO
