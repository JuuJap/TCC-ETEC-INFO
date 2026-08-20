"use strict";

const {
    KEYS,
    initAdminPage,
    normalizeText,
    parseDecimalValue,
    formatEditableDecimal,
    formatCurrency,
    formatWeight,
    formatDate,
    createId,
    setText,
    escapeHtml,
    showToast,
    readSessionArray
} = VST;
const CLIENTS_KEY = KEYS.CLIENTS;
const PRODUCTS_KEY = KEYS.PRODUCTS;
const ORDERS_KEY = KEYS.ORDERS;
const FINANCE_KEY = KEYS.FINANCE;
const DASHBOARD_KEY = KEYS.DASHBOARD;
let orders = [];
let draftItems = [];
let editingItemIndex = null;
let editingOrderId = null;
document.addEventListener("DOMContentLoaded", initializeOrdersPage);

function initializeOrdersPage() {
    const loggedUser = initAdminPage();
    if (!loggedUser) return;

    orders = loadOrders();
    configureClients();
    configureProducts();
    configureDate();
    configureItemCalculations();
    configureItemForm();
    configureOrderFields();
    configureOrderActions();
    configureHistory();
    configureModal();
    configureSearch();

    renderAll();
}

// PEDIDOS / NUMERAÇÃO

function loadOrders() {
    try {
        const stored = sessionStorage.getItem(ORDERS_KEY);
        if (!stored) return [];

        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.warn("Não foi possível carregar os pedidos:", error);
        return [];
    }
}

function saveOrders() {
    sessionStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

function getNextOrderNumber() {
    if (!orders.length) return 1;

    const numbers = orders.map(order => Number(order.number) || 0);
    return Math.max(...numbers) + 1;
}

function getCurrentOrderNumber() {
    if (editingOrderId) {
        const order = orders.find(item => item.id === editingOrderId);
        if (order) return Number(order.number);
    }

    return getNextOrderNumber();
}

function formatOrderNumber(number) {
    return String(Number(number) || 0).padStart(4, "0");
}

// CLIENTES / PRODUTOS

function configureClients() {
    const datalist = document.getElementById("clientOptions");
    if (!datalist) return;

    const clients = readSessionArray(CLIENTS_KEY);
    datalist.innerHTML = "";

    clients.forEach(client => {
        if (!client?.name) return;

        const option = document.createElement("option");
        option.value = client.name;
        if (client.city) option.label = client.city;
        datalist.appendChild(option);
    });
}

function configureProducts() {
    const datalist = document.getElementById("productOptions");
    if (!datalist) return;

    const products = readSessionArray(PRODUCTS_KEY);
    datalist.innerHTML = "";

    products.forEach(product => {
        if (!product?.name) return;

        const option = document.createElement("option");
        option.value = product.name;
        if (product.type) option.label = product.type;
        datalist.appendChild(option);
    });
}
// DATA / CAMPOS DO PEDIDO

function configureDate() {
    const input = document.getElementById("orderDate");
    if (input) input.value = formatDate(Date.now());
}

function configureOrderFields() {
    const clientInput = document.getElementById("orderClient");
    const addressInput = document.getElementById("orderAddress");
    const productInput = document.getElementById("itemDescription");

    clientInput?.addEventListener("input", () => {
        fillClientDataFromSelection();
        renderTicket();
    });

    clientInput?.addEventListener("change", () => {
        fillClientDataFromSelection();
        renderTicket();
    });

    addressInput?.addEventListener("input", renderTicket);

    productInput?.addEventListener("input", fillProductDataFromSelection);
    productInput?.addEventListener("change", fillProductDataFromSelection);
}

function fillClientDataFromSelection() {
    const clientInput = document.getElementById("orderClient");
    const addressInput = document.getElementById("orderAddress");

    if (!clientInput || !addressInput) return;

    const selectedName = normalizeText(clientInput.value);

    if (!selectedName) return;

    const clients = readSessionArray(CLIENTS_KEY);
    const client = clients.find(item =>
        normalizeText(item?.name) === selectedName
    );

    if (!client) return;

    const addressParts = [
        String(client.address || "").trim(),
        String(client.city || "").trim()
    ].filter(Boolean);

    if (addressParts.length) {
        addressInput.value = addressParts.join(" - ");
    }
}

function fillProductDataFromSelection() {
    const descriptionInput = document.getElementById("itemDescription");
    const valueInput = document.getElementById("itemUnitValue");
    const weightInput = document.getElementById("itemUnitWeight");

    if (!descriptionInput || !valueInput || !weightInput) return;

    const selectedName = normalizeText(descriptionInput.value);

    if (!selectedName) return;

    const products = readSessionArray(PRODUCTS_KEY);
    const product = products.find(item =>
        normalizeText(item?.name) === selectedName
    );

    if (!product) return;

    const unitValue = Number(product.unitValue) || 0;
    const unitWeight = Number(product.unitWeight) || 0;

    valueInput.value =
        unitValue > 0
            ? formatEditableDecimal(unitValue, 2)
            : "";

    weightInput.value =
        unitWeight > 0
            ? formatEditableDecimal(unitWeight, 3)
            : "";

    renderItemCalculation();
}

// ITEM / CÁLCULOS

function configureItemForm() {
    document.getElementById("orderItemForm")?.addEventListener("submit", handleItemSubmit);
    document.getElementById("cancelItemEditButton")?.addEventListener("click", resetItemForm);
}

function configureItemCalculations() {
    ["itemQuantity", "itemUnitValue", "itemUnitWeight"].forEach(id => {
        document.getElementById(id)?.addEventListener("input", renderItemCalculation);
    });

    renderItemCalculation();
}

function renderItemCalculation() {
    const quantity = getQuantity();
    const unitValue = parseDecimalValue(document.getElementById("itemUnitValue")?.value);
    const unitWeight = parseDecimalValue(
        document.getElementById("itemUnitWeight")?.value
    );

    setText("itemTotalPreview", formatCurrency(quantity * unitValue));
    setText("itemWeightPreview", formatWeight(quantity * unitWeight));
}

function getQuantity() {
    return Math.max(1, Math.floor(Number(document.getElementById("itemQuantity")?.value) || 1));
}

function handleItemSubmit(event) {
    event.preventDefault();

    const description = document.getElementById("itemDescription")?.value.trim() || "";
    const quantity = getQuantity();
    const unitValue = parseDecimalValue(document.getElementById("itemUnitValue")?.value);
    const unitWeight = parseDecimalValue(
        document.getElementById("itemUnitWeight")?.value
    );

    if (!description) {
        showToast("Informe o produto ou descrição.");
        return;
    }

    if (unitValue <= 0) {
        showToast("Informe um valor unitário válido.");
        return;
    }

    if (unitWeight <= 0) {
        showToast("Informe o peso unitário.");
        return;
    }

    const item = {
        id: createId("item"),
        description,
        quantity,
        unitValue,
        unitWeight,
        totalValue: quantity * unitValue,
        totalWeight: quantity * unitWeight
    };

    if (editingItemIndex !== null) {
        item.id = draftItems[editingItemIndex].id;
        draftItems[editingItemIndex] = item;
        showToast("Item atualizado.");
    } else {
        draftItems.push(item);
        showToast("Item adicionado ao pedido.");
    }

    resetItemForm();
    renderDraftItems();
    renderTicket();
}

function editDraftItem(index) {
    const item = draftItems[index];
    if (!item) return;

    editingItemIndex = index;

    document.getElementById("itemDescription").value = item.description;
    document.getElementById("itemQuantity").value = item.quantity;
    document.getElementById("itemUnitValue").value = String(item.unitValue).replace(".", ",");
    document.getElementById("itemUnitWeight").value =
        formatEditableDecimal(item.unitWeight, 3);

    const addButton = document.getElementById("addItemButton");
    if (addButton) addButton.textContent = "Salvar alteração";

    const cancel = document.getElementById("cancelItemEditButton");
    if (cancel) cancel.hidden = false;

    renderItemCalculation();
    document.getElementById("itemDescription")?.focus();
}

function removeDraftItem(index) {
    if (!draftItems[index]) return;

    draftItems.splice(index, 1);

    if (editingItemIndex === index) resetItemForm();
    if (editingItemIndex !== null && editingItemIndex > index) editingItemIndex -= 1;

    renderDraftItems();
    renderTicket();
    showToast("Item removido.");
}

function resetItemForm() {
    editingItemIndex = null;
    document.getElementById("orderItemForm")?.reset();

    const quantity = document.getElementById("itemQuantity");
    if (quantity) quantity.value = 1;

    const button = document.getElementById("addItemButton");
    if (button) button.innerHTML = '<span aria-hidden="true">+</span> Adicionar item';

    const cancel = document.getElementById("cancelItemEditButton");
    if (cancel) cancel.hidden = true;

    renderItemCalculation();
}

function renderDraftItems() {
    const body = document.getElementById("draftItemsBody");
    const empty = document.getElementById("draftItemsEmpty");

    if (!body) return;
    body.innerHTML = "";

    draftItems.forEach((item, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.quantity}</td>
            <td class="order-item-description">${escapeHtml(item.description)}</td>
            <td class="order-value">${formatCurrency(item.unitValue)}</td>
            <td class="order-value">${formatCurrency(item.totalValue)}</td>
            <td class="order-weight">${formatWeight(item.totalWeight)}</td>
            <td>
                <div class="order-actions">
                    <button class="order-action-button" type="button" data-edit-item="${index}">Editar</button>
                    <button class="order-action-button delete" type="button" data-remove-item="${index}">Remover</button>
                </div>
            </td>
        `;
        body.appendChild(row);
    });

    if (empty) empty.hidden = draftItems.length > 0;
}

document.addEventListener("click", event => {
    const editButton = event.target.closest("[data-edit-item]");
    if (editButton) {
        editDraftItem(Number(editButton.dataset.editItem));
        return;
    }

    const removeButton = event.target.closest("[data-remove-item]");
    if (removeButton) {
        removeDraftItem(Number(removeButton.dataset.removeItem));
    }
});

// TALÃO DIGITAL

function renderTicket() {
    const orderNumber = formatOrderNumber(getCurrentOrderNumber());
    const client = document.getElementById("orderClient")?.value.trim() || "Não informado";
    const address = document.getElementById("orderAddress")?.value.trim() || "Não informado";
    const date = document.getElementById("orderDate")?.value || "--";

    setText("nextOrderNumber", `#${orderNumber}`);
    setText("ticketOrderNumber", orderNumber);
    setText("ticketClient", client);
    setText("ticketAddress", address);
    setText("ticketDate", date);

    const body = document.getElementById("ticketItemsBody");
    if (!body) return;

    body.innerHTML = "";

    if (!draftItems.length) {
        body.innerHTML = '<tr class="ticket-empty-row"><td colspan="5">Nenhum item adicionado.</td></tr>';
    } else {
        draftItems.forEach(item => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${item.quantity}</td>
                <td>${escapeHtml(item.description)}</td>
                <td>${formatCurrency(item.unitValue)}</td>
                <td>${formatCurrency(item.totalValue)}</td>
                <td>${formatWeight(item.totalWeight)}</td>
            `;
            body.appendChild(row);
        });
    }

    const totals = calculateDraftTotals();
    setText("ticketTotalValue", formatCurrency(totals.value));
    setText("ticketTotalWeight", formatWeight(totals.weight));
}

function calculateDraftTotals() {
    return draftItems.reduce(
        (total, item) => {
            total.value += Number(item.totalValue) || 0;
            total.weight += Number(item.totalWeight) || 0;
            return total;
        },
        { value: 0, weight: 0 }
    );
}

// SALVAR / BAIXAR / IMPRIMIR

function configureOrderActions() {
    document.getElementById("saveOrderButton")?.addEventListener("click", saveCurrentOrder);
    document.getElementById("downloadOrderButton")?.addEventListener("click", downloadCurrentOrder);
    document.getElementById("printOrderButton")?.addEventListener("click", printCurrentOrder);
}

function buildCurrentOrder() {
    const client = document.getElementById("orderClient")?.value.trim() || "";
    const address = document.getElementById("orderAddress")?.value.trim() || "";

    if (!client) {
        showToast("Informe o cliente.");
        return null;
    }

    if (!address) {
        showToast("Informe o endereço ou local de entrega.");
        return null;
    }

    if (!draftItems.length) {
        showToast("Adicione pelo menos um item ao pedido.");
        return null;
    }

    const totals = calculateDraftTotals();
    const existingOrder = editingOrderId
        ? orders.find(order => order.id === editingOrderId)
        : null;

    return {
        id: existingOrder?.id || createId("order"),
        number: existingOrder?.number || getNextOrderNumber(),
        client,
        address,
        date: document.getElementById("orderDate")?.value || formatDate(Date.now()),
        items: draftItems.map(item => ({ ...item })),
        totalValue: totals.value,
        totalWeight: totals.weight,
        createdAt: existingOrder?.createdAt || Date.now(),
        updatedAt: Date.now()
    };
}

function saveCurrentOrder() {
    const order = buildCurrentOrder();
    if (!order) return;

    const existingIndex = orders.findIndex(item => item.id === order.id);
    const isEditing = existingIndex !== -1;

    if (isEditing) {
        orders[existingIndex] = order;
    } else {
        orders.unshift(order);
    }

    saveOrders();
    syncOrderWithFinance(order);
    addDashboardActivity(order, isEditing ? "atualizado" : "registrado");

    showToast(isEditing ? "Pedido atualizado com sucesso." : "Pedido salvo com sucesso.");

    clearOrder();
    renderAll();
}

async function downloadCurrentOrder() {
    const order = buildCurrentOrder();
    if (!order) return;

    const content = generateOrderText(order);
    const fileName = generateOrderFileName(order);

    if (typeof window.showSaveFilePicker === "function") {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: fileName,
                types: [
                    {
                        description: "Arquivo de texto",
                        accept: { "text/plain": [".txt"] }
                    }
                ]
            });

            const writable = await handle.createWritable();
            await writable.write(content);
            await writable.close();

            showToast("Pedido salvo no computador.");
            return;
        } catch (error) {
            if (error.name === "AbortError") return;
            console.warn("Salvamento direto indisponível:", error);
        }
    }

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("Pedido baixado.");
}

function generateOrderFileName(order) {
    const client = removeAccents(order.client)
        .replace(/[\/\\:*?"<>|]/g, "")
        .trim()
        .replace(/\s+/g, "_");

    return `${client}_Pedido_${formatOrderNumber(order.number)}.txt`;
}

function generateOrderText(order) {
    const separator = "-".repeat(82);
    const rows = order.items.map(item => [
        padText(item.quantity, 5),
        padText(item.description, 30),
        padText(formatCurrency(item.unitValue), 13),
        padText(formatCurrency(item.totalValue), 13),
        padText(formatWeight(item.totalWeight), 10)
    ].join(" | "));

    return `VELAS S. TOMÉ
PEDIDO Nº ${formatOrderNumber(order.number)}

Cliente: ${order.client}
Endereço: ${order.address}
Data: ${order.date}

Qtd.  | Descrição                      | Unitário      | Total         | Peso
${separator}
${rows.join("\n")}
${separator}

Peso total: ${formatWeight(order.totalWeight)}
Valor total: ${formatCurrency(order.totalValue)}`;
}

function printCurrentOrder() {
    const order = buildCurrentOrder();
    if (!order) return;

    renderTicket();
    window.print();
}

// CONTROLE GERAL

function syncOrderWithFinance(order) {
    const movements = loadFinanceMovements();
    const index = movements.findIndex(
        movement => movement.source === "order" && movement.sourceId === order.id
    );

    const movement = {
        id: index !== -1 ? movements[index].id : createId("finance-order"),
        type: "entrada",
        description: `Pedido #${formatOrderNumber(order.number)} - ${order.client}`,
        value: order.totalValue,
        weight: order.totalWeight,
        createdAt: index !== -1 ? movements[index].createdAt : Date.now(),
        source: "order",
        sourceId: order.id
    };

    if (index !== -1) {
        movements[index] = movement;
    } else {
        movements.unshift(movement);
    }

    saveFinanceMovements(movements);
}

function removeOrderFromFinance(orderId) {
    const movements = loadFinanceMovements().filter(
        movement => !(movement.source === "order" && movement.sourceId === orderId)
    );

    saveFinanceMovements(movements);
}

function loadFinanceMovements() {
    try {
        const stored = sessionStorage.getItem(FINANCE_KEY);
        if (!stored) return [];

        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveFinanceMovements(movements) {
    sessionStorage.setItem(FINANCE_KEY, JSON.stringify(movements));
}

// ATIVIDADES DA HOME

function addDashboardActivity(order, action) {
    try {
        const stored = sessionStorage.getItem(DASHBOARD_KEY);
        if (!stored) return;

        const dashboard = JSON.parse(stored);
        if (!dashboard || typeof dashboard !== "object") return;

        if (!Array.isArray(dashboard.activities)) dashboard.activities = [];

        dashboard.activities.unshift({
            description: `Pedido #${formatOrderNumber(order.number)} ${action}: ${order.client}`,
            category: "Pedidos",
            timestamp: Date.now()
        });

        dashboard.activities = dashboard.activities.slice(0, 20);
        sessionStorage.setItem(DASHBOARD_KEY, JSON.stringify(dashboard));
    } catch (error) {
        console.warn("Não foi possível atualizar as atividades:", error);
    }
}

// HISTÓRICO

function configureHistory() {
    document.getElementById("ordersHistoryBody")?.addEventListener("click", handleHistoryClick);
}

function configureSearch() {
    document.getElementById("orderSearch")?.addEventListener("input", renderHistory);
}

function getFilteredOrders() {
    const term = normalizeText(document.getElementById("orderSearch")?.value || "");
    if (!term) return orders;

    return orders.filter(order => {
        const itemDescriptions = (order.items || []).map(item => item.description).join(" ");
        const text = normalizeText([
            order.number,
            order.client,
            order.address,
            order.date,
            itemDescriptions,
            formatCurrency(order.totalValue)
        ].join(" "));

        return text.includes(term);
    });
}

function renderHistory() {
    const body = document.getElementById("ordersHistoryBody");
    const empty = document.getElementById("ordersHistoryEmpty");
    const counter = document.getElementById("ordersCounter");

    if (!body) return;

    const filtered = getFilteredOrders()
        .slice()
        .sort((a, b) => Number(b.createdAt) - Number(a.createdAt));

    body.innerHTML = "";

    filtered.forEach(order => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td class="order-number-cell">#${formatOrderNumber(order.number)}</td>
            <td class="order-client-cell">${escapeHtml(order.client)}</td>
            <td>${Array.isArray(order.items) ? order.items.length : 0}</td>
            <td class="order-value">${formatCurrency(order.totalValue)}</td>
            <td>${escapeHtml(order.date)}</td>
            <td>
                <div class="order-actions">
                    <button class="order-action-button" type="button" data-order-action="view" data-order-id="${order.id}">Ver</button>
                    <button class="order-action-button" type="button" data-order-action="edit" data-order-id="${order.id}">Editar</button>
                    <button class="order-action-button delete" type="button" data-order-action="delete" data-order-id="${order.id}">Excluir</button>
                </div>
            </td>
        `;
        body.appendChild(row);
    });

    if (empty) empty.hidden = filtered.length > 0;

    if (counter) {
        counter.textContent = filtered.length === 1
            ? "1 pedido registrado"
            : `${filtered.length} pedidos registrados`;
    }
}

function handleHistoryClick(event) {
    const button = event.target.closest("[data-order-action]");
    if (!button) return;

    const id = button.dataset.orderId;
    const action = button.dataset.orderAction;

    if (action === "view") {
        viewOrder(id);
        return;
    }

    if (action === "edit") {
        editOrder(id);
        return;
    }

    if (action === "delete") deleteOrder(id);
}

function editOrder(id) {
    const order = orders.find(item => item.id === id);
    if (!order) return;

    editingOrderId = order.id;
    draftItems = (order.items || []).map(item => ({ ...item }));

    document.getElementById("orderClient").value = order.client;
    document.getElementById("orderAddress").value = order.address;
    document.getElementById("orderDate").value = order.date;

    renderDraftItems();
    renderTicket();

    document.querySelector(".order-data-panel")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    showToast(`Editando pedido #${formatOrderNumber(order.number)}.`);
}

function deleteOrder(id) {
    const order = orders.find(item => item.id === id);
    if (!order) return;

    const confirmDelete = window.confirm(
        `Deseja excluir o pedido #${formatOrderNumber(order.number)} de ${order.client}?`
    );

    if (!confirmDelete) return;

    orders = orders.filter(item => item.id !== id);
    saveOrders();
    removeOrderFromFinance(id);

    if (editingOrderId === id) clearOrder();

    renderAll();
    showToast("Pedido excluído.");
}

function viewOrder(id) {
    const order = orders.find(item => item.id === id);
    if (!order) return;

    setText("viewOrderTitle", `Pedido #${formatOrderNumber(order.number)}`);

    const content = document.getElementById("viewOrderContent");
    if (!content) return;

    content.innerHTML = `
        <div class="saved-order-view">
            <div class="saved-order-info">
                <p><strong>Cliente:</strong> ${escapeHtml(order.client)}</p>
                <p><strong>Endereço:</strong> ${escapeHtml(order.address)}</p>
                <p><strong>Data:</strong> ${escapeHtml(order.date)}</p>
            </div>

            <table class="saved-order-items">
                <thead>
                    <tr>
                        <th>Qtd.</th>
                        <th>Descrição</th>
                        <th>Unitário</th>
                        <th>Total</th>
                        <th>Peso</th>
                    </tr>
                </thead>
                <tbody>
                    ${(order.items || []).map(item => `
                        <tr>
                            <td>${item.quantity}</td>
                            <td>${escapeHtml(item.description)}</td>
                            <td>${formatCurrency(item.unitValue)}</td>
                            <td>${formatCurrency(item.totalValue)}</td>
                            <td>${formatWeight(item.totalWeight)}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>

            <div class="saved-order-total">
                <div>
                    <span>Peso total</span>
                    <strong>${formatWeight(order.totalWeight)}</strong>
                </div>
                <div>
                    <span>Valor total</span>
                    <strong>${formatCurrency(order.totalValue)}</strong>
                </div>
            </div>
        </div>
    `;

    openViewModal();
}

// MODAL

function configureModal() {
    document.getElementById("closeViewOrderButton")?.addEventListener("click", closeViewModal);
    document.getElementById("viewOrderBackdrop")?.addEventListener("click", closeViewModal);

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") closeViewModal();
    });
}

function openViewModal() {
    const modal = document.getElementById("viewOrderModal");
    if (!modal) return;

    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
}

function closeViewModal() {
    const modal = document.getElementById("viewOrderModal");
    if (!modal) return;

    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
}

// LIMPEZA / RENDER

function clearOrder() {
    editingOrderId = null;
    draftItems = [];

    const client = document.getElementById("orderClient");
    const address = document.getElementById("orderAddress");

    if (client) client.value = "";
    if (address) address.value = "";

    configureDate();
    resetItemForm();
}

function renderAll() {
    renderDraftItems();
    renderTicket();
    renderHistory();
}

// TEMA / USUÁRIO / MENU
// UTILIDADES
function removeAccents(text) {
    return String(text ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function padText(value, size) {
    const text = String(value);
    if (text.length > size) return text.slice(0, Math.max(0, size - 3)) + "...";
    return text.padEnd(size, " ");
}
