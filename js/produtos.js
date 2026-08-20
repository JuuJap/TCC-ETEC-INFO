"use strict";

const {
    KEYS,
    initAdminPage,
    normalizeText,
    createId,
    parseDecimalValue,
    formatEditableDecimal,
    formatCurrency,
    formatWeight,
    formatNumber,
    setText,
    escapeHtml,
    showToast
} = VST;
const PRODUCTS_KEY = KEYS.PRODUCTS;
const DASHBOARD_KEY = KEYS.DASHBOARD;

let products = [];
document.addEventListener("DOMContentLoaded", initializeProductsPage);

function initializeProductsPage() {
    const loggedUser = initAdminPage();
    if (!loggedUser) return;

    products = loadProducts();
    configureSearchAndFilter();
    configureProductModal();
    configureProductActions();

    renderProducts();
    openNewProductFromUrl();
}

function createInitialProducts() {
    return [
        {
            id: "demo-product-1",
            unitValue: 25.90,
            unitWeight: 250.5,
            name: "Vela Aromática de Lavanda",
            type: "Aromática",
            color: "Bege",
            characteristic: "Aroma de lavanda",
            createdAt: Date.now() - 86400000 * 2
        },
        {
            id: "demo-product-2",
            unitValue: 29.50,
            unitWeight: 300,
            name: "Vela de Baunilha",
            type: "Aromática",
            color: "Branca",
            characteristic: "Aroma de baunilha",
            createdAt: Date.now() - 86400000 * 5
        },
        {
            id: "demo-product-3",
            unitValue: 34.90,
            unitWeight: 180.75,
            name: "Vela Decorativa Floral",
            type: "Decorativa",
            color: "Rosa",
            characteristic: "Formato floral",
            createdAt: Date.now() - 86400000 * 8
        },
        {
            id: "demo-product-4",
            unitValue: 18.90,
            unitWeight: 220.5,
            name: "Vela Clássica",
            type: "Tradicional",
            color: "Branca",
            characteristic: "Sem aroma",
            createdAt: Date.now() - 86400000 * 12
        }
    ];
}

function loadProducts() {
    try {
        const stored = sessionStorage.getItem(PRODUCTS_KEY);

        if (!stored) {
            const initial = createInitialProducts();
            saveProducts(initial);
            return initial;
        }

        const parsed = JSON.parse(stored);

        if (!Array.isArray(parsed)) {
            return createInitialProducts();
        }

        const demoFallback = {
            "demo-product-1": { unitValue: 25.90, unitWeight: 250.5 },
            "demo-product-2": { unitValue: 29.50, unitWeight: 300 },
            "demo-product-3": { unitValue: 34.90, unitWeight: 180.75 },
            "demo-product-4": { unitValue: 18.90, unitWeight: 220.5 }
        };

        return parsed.map(product => ({
            ...product,
            unitValue:
                Number(product.unitValue) ||
                demoFallback[product.id]?.unitValue ||
                0,
            unitWeight:
                Number(product.unitWeight) ||
                demoFallback[product.id]?.unitWeight ||
                0
        }));
    } catch (error) {
        console.warn("Não foi possível carregar os produtos:", error);
        return createInitialProducts();
    }
}

function saveProducts(list = products) {
    sessionStorage.setItem(PRODUCTS_KEY, JSON.stringify(list));
}
function configureSearchAndFilter() {
    document.getElementById("productSearch")?.addEventListener("input", renderProducts);
    document.getElementById("typeFilter")?.addEventListener("change", renderProducts);
}

function getFilteredProducts() {
    const term = normalizeText(document.getElementById("productSearch")?.value || "");
    const selectedType = document.getElementById("typeFilter")?.value || "all";

    return products.filter(product => {
        const text = normalizeText([
            product.name,
            product.type,
            product.color,
            product.characteristic,
            product.unitValue,
            product.unitWeight
        ].join(" "));

        const typeKey = normalizeText(product.type || "");
        return (!term || text.includes(term)) &&
            (selectedType === "all" || typeKey === selectedType);
    });
}

function renderProducts() {
    renderStatistics();
    renderTypeFilter();
    renderProductsTable();
}

function renderStatistics() {
    const types = new Set(products.map(item => normalizeText(item.type)).filter(Boolean));
    const colors = new Set(products.map(item => normalizeText(item.color)).filter(Boolean));

    setText("totalProducts", formatNumber(products.length));
    setText("totalTypes", formatNumber(types.size));
    setText("totalColors", formatNumber(colors.size));
}

function renderTypeFilter() {
    const select = document.getElementById("typeFilter");
    if (!select) return;

    const current = select.value || "all";
    const unique = new Map();

    products.forEach(product => {
        const label = String(product.type || "").trim();
        const key = normalizeText(label);
        if (key && !unique.has(key)) unique.set(key, label);
    });

    select.innerHTML = '<option value="all">Todos</option>';

    [...unique.entries()]
        .sort((a, b) => a[1].localeCompare(b[1], "pt-BR"))
        .forEach(([key, label]) => {
            const option = document.createElement("option");
            option.value = key;
            option.textContent = label;
            select.appendChild(option);
        });

    select.value = [...select.options].some(option => option.value === current)
        ? current
        : "all";
}

function renderProductsTable() {
    const body = document.getElementById("productsTableBody");
    const empty = document.getElementById("productsEmptyState");
    const counter = document.getElementById("resultsCounter");

    if (!body) return;

    const filtered = getFilteredProducts()
        .slice()
        .sort((a, b) => String(a.name).localeCompare(String(b.name), "pt-BR"));

    body.innerHTML = "";

    filtered.forEach(product => body.appendChild(createProductRow(product)));

    if (empty) empty.hidden = filtered.length > 0;
    if (counter) {
        counter.textContent = filtered.length === 1
            ? "1 produto exibido"
            : `${filtered.length} produtos exibidos`;
    }
}

function createProductRow(product) {
    const row = document.createElement("tr");

    row.innerHTML = `
        <td>
            <div class="product-cell">
                <div class="product-avatar">P</div>
                <div class="product-identity">
                    <strong>${escapeHtml(product.name)}</strong>
                    <span>${escapeHtml(createProductCode(product.id))}</span>
                </div>
            </div>
        </td>
        <td>
            <span class="product-type-badge">
                ${escapeHtml(product.type || "Não informado")}
            </span>
        </td>
        <td class="product-color">
            ${escapeHtml(product.color || "Não informado")}
        </td>
        <td class="product-characteristic">
            ${escapeHtml(product.characteristic || "Não informado")}
        </td>
        <td class="product-price">
            ${product.unitValue > 0 ? formatCurrency(product.unitValue) : "Não informado"}
        </td>
        <td class="product-weight">
            ${product.unitWeight > 0 ? formatWeight(product.unitWeight) : "Não informado"}
        </td>
        <td>
            <div class="product-actions">
                <button
                    class="table-action-button"
                    type="button"
                    data-product-action="edit"
                    data-product-id="${escapeHtml(product.id)}"
                >
                    Editar
                </button>
                <button
                    class="table-action-button delete"
                    type="button"
                    data-product-action="delete"
                    data-product-id="${escapeHtml(product.id)}"
                >
                    Excluir
                </button>
            </div>
        </td>
    `;

    return row;
}

function configureProductModal() {
    document.getElementById("newProductButton")?.addEventListener("click", openNewProductModal);
    document.getElementById("productForm")?.addEventListener("submit", handleProductSubmit);

    document.querySelectorAll("[data-close-product-modal]").forEach(button => {
        button.addEventListener("click", closeProductModal);
    });

    document.addEventListener("keydown", event => {
        const modal = document.getElementById("productModal");
        if (event.key === "Escape" && modal && !modal.hidden) {
            closeProductModal();
        }
    });
}

function openNewProductModal() {
    resetProductForm();
    setText("productModalTitle", "Novo produto");
    setText("productModalDescription", "Preencha as informações do produto.");
    openProductModal();
}

function openEditProductModal(id) {
    const product = products.find(item => item.id === id);
    if (!product) return;

    document.getElementById("productId").value = product.id;
    document.getElementById("productName").value = product.name || "";
    document.getElementById("productType").value = product.type || "";
    document.getElementById("productColor").value = product.color || "";
    document.getElementById("productUnitValue").value =
        product.unitValue > 0 ? formatEditableDecimal(product.unitValue, 2) : "";
    document.getElementById("productUnitWeight").value =
        product.unitWeight > 0 ? formatEditableDecimal(product.unitWeight, 3) : "";
    document.getElementById("productCharacteristic").value = product.characteristic || "";

    setText("productModalTitle", "Editar produto");
    setText("productModalDescription", "Atualize as informações do produto.");
    openProductModal();
}

function openProductModal() {
    const modal = document.getElementById("productModal");
    if (!modal) return;

    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    setTimeout(() => document.getElementById("productName")?.focus(), 40);
}

function closeProductModal() {
    const modal = document.getElementById("productModal");
    if (!modal) return;

    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
}

function resetProductForm() {
    document.getElementById("productForm")?.reset();
    const id = document.getElementById("productId");
    if (id) id.value = "";
}

function handleProductSubmit(event) {
    event.preventDefault();

    const id = document.getElementById("productId")?.value || "";
    const name = document.getElementById("productName")?.value.trim() || "";
    const type = document.getElementById("productType")?.value.trim() || "";
    const color = document.getElementById("productColor")?.value.trim() || "";
    const unitValueInput =
        document.getElementById("productUnitValue")?.value.trim() || "";

    const unitValue =
        unitValueInput
            ? parseDecimalValue(unitValueInput)
            : 0;
    const unitWeight = parseDecimalValue(
        document.getElementById("productUnitWeight")?.value
    );
    const characteristic =
        document.getElementById("productCharacteristic")?.value.trim() || "";

    if (!name) {
        showToast("Digite o nome do produto.");
        return;
    }

    if (unitValueInput && unitValue <= 0) {
        showToast("Informe um valor unitário válido ou deixe o campo vazio.");
        return;
    }

    if (unitWeight <= 0) {
        showToast("Informe um peso unitário válido.");
        return;
    }

    if (id) {
        const index = products.findIndex(product => product.id === id);
        if (index === -1) return;

        products[index] = {
            ...products[index],
            name,
            type,
            color,
            unitValue,
            unitWeight,
            characteristic
        };

        updateDashboardForProductChange(0, `Produto ${name} atualizado`);
        showToast("Produto atualizado.");
    } else {
        const newProduct = {
            id: createId(),
            name,
            type,
            color,
            unitValue,
            unitWeight,
            characteristic,
            createdAt: Date.now()
        };

        products.unshift(newProduct);
        updateDashboardForProductChange(1, `Produto ${name} cadastrado`);
        showToast("Produto cadastrado temporariamente.");
    }

    saveProducts();
    renderProducts();
    closeProductModal();
}

function configureProductActions() {
    document.getElementById("productsTableBody")?.addEventListener("click", event => {
        const button = event.target.closest("[data-product-action]");
        if (!button) return;

        if (button.dataset.productAction === "edit") {
            openEditProductModal(button.dataset.productId);
        }

        if (button.dataset.productAction === "delete") {
            deleteProduct(button.dataset.productId);
        }
    });
}

function deleteProduct(id) {
    const product = products.find(item => item.id === id);
    if (!product) return;

    if (!window.confirm(`Deseja excluir ${product.name}?`)) return;

    products = products.filter(item => item.id !== id);
    saveProducts();
    updateDashboardForProductChange(-1, `Produto ${product.name} removido`);
    renderProducts();
    showToast("Produto removido.");
}

function updateDashboardForProductChange(countChange, description) {
    try {
        const stored = sessionStorage.getItem(DASHBOARD_KEY);
        if (!stored) return;

        const dashboard = JSON.parse(stored);
        dashboard.products = Math.max(0, (Number(dashboard.products) || 0) + countChange);

        if (!Array.isArray(dashboard.activities)) dashboard.activities = [];

        dashboard.activities.unshift({
            description,
            category: "Produtos",
            timestamp: Date.now()
        });

        dashboard.activities = dashboard.activities.slice(0, 20);

        sessionStorage.setItem(DASHBOARD_KEY, JSON.stringify(dashboard));
    } catch (error) {
        console.warn("Não foi possível sincronizar o produto com a Home:", error);
    }
}

function openNewProductFromUrl() {
    const url = new URL(window.location.href);

    if (url.searchParams.get("novo") !== "1") return;

    openNewProductModal();
    url.searchParams.delete("novo");

    window.history.replaceState(
        {},
        "",
        url.pathname + url.search + url.hash
    );
}
function createProductCode(id) {
    const clean = String(id || "").replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();
    return `Produto #${clean || "000001"}`;
}
