"use strict";

const {
    KEYS,
    initAdminPage,
    normalizeText,
    formatNumber,
    formatDateTime,
    readSessionArray,
    showToast,
    confirmAction
} = VST;

const DASHBOARD_KEY = KEYS.DASHBOARD;

let dashboardState;

document.addEventListener(
    "DOMContentLoaded",
    initializeDashboard
);


function initializeDashboard() {
    const loggedUser =
        initAdminPage();

    if (!loggedUser) return;

    dashboardState =
        loadDashboardState();

    refreshDashboardFromRealData();

    configureCurrentDate();
    configureSearch();
    configureQuickActions();
    configureClearActivities();

    renderDashboard();
}


/* =========================================================
   DADOS REAIS
========================================================= */

function createEmptyState() {
    return {
        schemaVersion: 4,
        clients: 0,
        products: 0,
        sales: 0,
        orders: 0,
        revenue: 0,
        activities: []
    };
}


function loadDashboardState() {
    try {
        const stored =
            sessionStorage.getItem(
                DASHBOARD_KEY
            );

        if (!stored) {
            return createEmptyState();
        }

        const parsed =
            JSON.parse(stored);

        if (
            !parsed ||
            typeof parsed !== "object"
        ) {
            return createEmptyState();
        }

        return {
            ...createEmptyState(),
            ...parsed,
            activities:
                Array.isArray(
                    parsed.activities
                )
                    ? parsed.activities
                    : []
        };

    } catch (error) {

        console.warn(
            "Não foi possível carregar o painel:",
            error
        );

        return createEmptyState();
    }
}


function refreshDashboardFromRealData() {
    const clients =
        readSessionArray(
            KEYS.CLIENTS
        );

    const products =
        readSessionArray(
            KEYS.PRODUCTS
        );

    const sales =
        readSessionArray(
            KEYS.SALES
        );

    const orders =
        readSessionArray(
            KEYS.ORDERS
        );

    dashboardState.clients =
        clients.length;

    dashboardState.products =
        products.length;

    dashboardState.sales =
        sales.length;

    dashboardState.orders =
        orders.length;

    dashboardState.revenue =
        sales.reduce(
            (total, sale) =>
                total +
                (Number(sale.value) || 0),
            0
        );

    dashboardState.schemaVersion =
        4;

    dashboardState.metrics =
        buildRealMetrics({
            clients,
            products,
            sales,
            orders
        });
}


function buildRealMetrics(data) {
    const currentMonth = {};
    const previousMonth = {};

    for (
        const [key, records]
        of Object.entries(data)
    ) {
        currentMonth[key] =
            records.filter(
                record =>
                    isInMonth(
                        recordDate(record),
                        0
                    )
            ).length;

        previousMonth[key] =
            records.filter(
                record =>
                    isInMonth(
                        recordDate(record),
                        -1
                    )
            ).length;
    }

    const growth = {
        clients:
            calculateGrowth(
                currentMonth.clients,
                previousMonth.clients
            ),

        products:
            calculateGrowth(
                currentMonth.products,
                previousMonth.products
            ),

        sales:
            calculateGrowth(
                currentMonth.sales,
                previousMonth.sales
            )
    };

    const monthlyTotal =
        Object.values(
            currentMonth
        ).reduce(
            (total, value) =>
                total + value,
            0
        );

    const distribution = {};

    for (
        const key
        of [
            "sales",
            "clients",
            "orders",
            "products"
        ]
    ) {
        distribution[key] =
            monthlyTotal > 0
                ? Math.round(
                    (
                        currentMonth[key] /
                        monthlyTotal
                    ) *
                    100
                )
                : 0;
    }

    return {
        currentMonth,
        previousMonth,
        growth,
        distribution
    };
}


function recordDate(record) {
    const timestamp =
        Number(
            record?.createdAt
        );

    if (
        Number.isFinite(timestamp) &&
        timestamp > 0
    ) {
        return new Date(
            timestamp
        );
    }

    const orderDate =
        record?.date;

    if (
        typeof orderDate === "string" &&
        orderDate
    ) {
        const parsed =
            new Date(
                `${orderDate}T12:00:00`
            );

        if (
            !Number.isNaN(
                parsed.getTime()
            )
        ) {
            return parsed;
        }
    }

    return null;
}


function isInMonth(date, offset) {
    if (
        !(date instanceof Date) ||
        Number.isNaN(
            date.getTime()
        )
    ) {
        return false;
    }

    const target =
        new Date();

    target.setDate(1);
    target.setMonth(
        target.getMonth() +
        offset
    );

    return (
        date.getMonth() ===
            target.getMonth() &&
        date.getFullYear() ===
            target.getFullYear()
    );
}


function calculateGrowth(
    current,
    previous
) {
    const currentValue =
        Number(current) || 0;

    const previousValue =
        Number(previous) || 0;

    if (
        currentValue === 0 &&
        previousValue === 0
    ) {
        return 0;
    }

    if (
        previousValue === 0
    ) {
        return 100;
    }

    return Math.round(
        (
            (
                currentValue -
                previousValue
            ) /
            previousValue
        ) *
        100
    );
}


/* =========================================================
   INTERFACE
========================================================= */

function configureCurrentDate() {
    const date =
        new Intl.DateTimeFormat(
            "pt-BR",
            {
                weekday: "long",
                day: "2-digit",
                month: "long"
            }
        ).format(
            new Date()
        );

    VST.setText(
        "currentDate",
        date.charAt(0).toUpperCase() +
        date.slice(1)
    );
}


function configureQuickActions() {
    document
        .querySelectorAll(
            "[data-action]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const pages = {
                        client:
                            "clientes.html?novo=1",

                        product:
                            "produtos.html?novo=1",

                        sale:
                            "vendas.html?novo=1",

                        order:
                            "pedidos.html"
                    };

                    const target =
                        pages[
                            button.dataset.action
                        ];

                    if (target) {
                        window.location.href =
                            target;
                    }
                }
            );
        });
}


function configureSearch() {
    document
        .getElementById(
            "globalSearch"
        )
        ?.addEventListener(
            "input",
            renderActivities
        );
}


function renderDashboard() {
    setStat(
        "clients",
        dashboardState.clients
    );

    setStat(
        "products",
        dashboardState.products
    );

    setStat(
        "sales",
        dashboardState.sales
    );

    renderGrowthBadges();
    renderMonthlyPerformance();
    renderActivities();
}


function setStat(
    name,
    value
) {
    document
        .querySelector(
            `[data-stat="${name}"]`
        )
        ?.replaceChildren(
            document.createTextNode(
                formatNumber(
                    value
                )
            )
        );
}


function renderGrowthBadges() {
    const growth =
        dashboardState.metrics?.growth ||
        {};

    for (
        const key
        of [
            "clients",
            "products",
            "sales"
        ]
    ) {
        const element =
            document.querySelector(
                `[data-change="${key}"]`
            );

        if (!element) continue;

        const value =
            Number(
                growth[key]
            ) || 0;

        element.textContent =
            `${value > 0 ? "+" : ""}${value}%`;

        element.classList.remove(
            "positive",
            "negative",
            "neutral"
        );

        element.classList.add(
            value > 0
                ? "positive"
                : value < 0
                    ? "negative"
                    : "neutral"
        );

        const labelMap = {
            clients:
                "clientes",
            products:
                "produtos",
            sales:
                "vendas"
        };

        element.title =
            `Variação de ${labelMap[key]} neste mês em relação ao mês anterior`;
    }
}


function renderMonthlyPerformance() {
    const distribution =
        dashboardState.metrics?.distribution ||
        {};

    for (
        const key
        of [
            "sales",
            "clients",
            "orders",
            "products"
        ]
    ) {
        const value =
            Math.max(
                0,
                Math.min(
                    100,
                    Number(
                        distribution[key]
                    ) || 0
                )
            );

        const label =
            document.querySelector(
                `[data-performance-value="${key}"]`
            );

        const bar =
            document.querySelector(
                `[data-performance-bar="${key}"]`
            );

        if (label) {
            label.textContent =
                `${value}%`;
        }

        if (bar) {
            bar.style.setProperty(
                "--progress",
                `${value}%`
            );
        }
    }
}


/* =========================================================
   ATIVIDADES
========================================================= */

function renderActivities() {
    const body =
        document.getElementById(
            "recentActivities"
        );

    const empty =
        document.getElementById(
            "emptyActivities"
        );

    if (!body) return;

    const term =
        normalizeText(
            document
                .getElementById(
                    "globalSearch"
                )
                ?.value ||
            ""
        );

    const activities =
        (
            dashboardState.activities ||
            []
        ).filter(activity => {

            const timestamp =
                Number(
                    activity.timestamp
                );

            const dateText =
                Number.isFinite(
                    timestamp
                )
                    ? formatDateTime(
                        timestamp
                    )
                    : "";

            const text =
                normalizeText(
                    [
                        activity.description,
                        activity.category,
                        dateText
                    ].join(" ")
                );

            return (
                !term ||
                text.includes(
                    term
                )
            );
        });

    body.innerHTML =
        "";

    activities.forEach(
        activity => {

            const row =
                document.createElement(
                    "tr"
                );

            const description =
                document.createElement(
                    "td"
                );

            const category =
                document.createElement(
                    "td"
                );

            const date =
                document.createElement(
                    "td"
                );

            description.textContent =
                activity.description ||
                "";

            category.textContent =
                activity.category ||
                "";

            const timestamp =
                Number(
                    activity.timestamp
                );

            date.textContent =
                Number.isFinite(
                    timestamp
                )
                    ? formatDateTime(
                        timestamp
                    )
                    : "—";

            row.append(
                description,
                category,
                date
            );

            body.appendChild(
                row
            );
        }
    );

    if (empty) {
        empty.hidden =
            activities.length >
            0;
    }
}


function configureClearActivities() {
    document
        .getElementById(
            "clearActivitiesButton"
        )
        ?.addEventListener(
            "click",
            async () => {

                if (
                    !dashboardState
                        .activities
                        .length
                ) {
                    return;
                }

                const confirmed =
                    await confirmAction({
                        title:
                            "Limpar atividades recentes?",
                        message:
                            "As atividades exibidas na Home serão removidas do histórico atual.",
                        confirmLabel:
                            "Limpar atividades",
                        cancelLabel:
                            "Cancelar",
                        tone:
                            "warning"
                    });

                if (!confirmed) {
                    return;
                }

                dashboardState.activities =
                    [];

                saveDashboardActivities();
                renderActivities();

                showToast(
                    "Atividades recentes removidas."
                );
            }
        );
}


function saveDashboardActivities() {
    sessionStorage.setItem(
        DASHBOARD_KEY,
        JSON.stringify({
            schemaVersion: 4,
            clients:
                dashboardState.clients,
            products:
                dashboardState.products,
            sales:
                dashboardState.sales,
            orders:
                dashboardState.orders,
            revenue:
                dashboardState.revenue,
            activities:
                dashboardState.activities
        })
    );
}
