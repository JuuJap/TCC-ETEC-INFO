"use strict";


/* =========================================================
   CONFIGURAÇÕES
========================================================= */

const THEME_KEY = "theme";
const USER_KEY = "usuarioLogado";
const PRODUCTS_KEY = "velasProdutosTemporarios";
const DASHBOARD_KEY = "velasDashboardTemporario";

let products = [];
let toastTimer;


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeProductsPage
);


function initializeProductsPage() {

    const loggedUser =
        sessionStorage.getItem(
            USER_KEY
        );


    if (!loggedUser) {

        window.location.replace(
            "index.html"
        );

        return;
    }


    products =
        loadProducts();


    configureUser(
        loggedUser
    );

    configureTheme();

    configureSidebar();

    configureDemoLinks();

    configureSearchAndFilter();

    configureProductModal();

    configureProductActions();

    configureLogout();


    renderProducts();


    openNewProductFromUrl();
}


/* =========================================================
   PRODUTOS DE EXEMPLO
========================================================= */

function createInitialProducts() {

    const now =
        Date.now();

    const day =
        24 *
        60 *
        60 *
        1000;


    return [

        {
            id: "product-demo-1",

            name:
                "Vela Aromática de Lavanda",

            type:
                "Aromática",

            color:
                "Bege",

            characteristic:
                "Aroma de lavanda",

            createdAt:
                now - 2 * day
        },

        {
            id: "product-demo-2",

            name:
                "Vela de Baunilha",

            type:
                "Aromática",

            color:
                "Branca",

            characteristic:
                "Aroma de baunilha",

            createdAt:
                now - 5 * day
        },

        {
            id: "product-demo-3",

            name:
                "Vela Decorativa Floral",

            type:
                "Decorativa",

            color:
                "Rosa",

            characteristic:
                "Formato floral",

            createdAt:
                now - 9 * day
        },

        {
            id: "product-demo-4",

            name:
                "Vela Clássica",

            type:
                "Tradicional",

            color:
                "Branca",

            characteristic:
                "Sem aroma",

            createdAt:
                now - 15 * day
        }

    ];
}


/* =========================================================
   CARREGAR PRODUTOS
========================================================= */

function loadProducts() {

    try {

        const storedProducts =
            sessionStorage.getItem(
                PRODUCTS_KEY
            );


        if (!storedProducts) {

            const initialProducts =
                createInitialProducts();


            saveProducts(
                initialProducts
            );


            return initialProducts;
        }


        const parsedProducts =
            JSON.parse(
                storedProducts
            );


        if (
            !Array.isArray(
                parsedProducts
            )
        ) {

            throw new Error(
                "Lista de produtos inválida."
            );
        }


        return parsedProducts;

    }

    catch (error) {

        console.warn(
            "Não foi possível carregar os produtos:",
            error
        );


        const initialProducts =
            createInitialProducts();


        saveProducts(
            initialProducts
        );


        return initialProducts;
    }
}


/* =========================================================
   SALVAR PRODUTOS
========================================================= */

function saveProducts(
    productList = products
) {

    try {

        sessionStorage.setItem(
            PRODUCTS_KEY,
            JSON.stringify(
                productList
            )
        );

    }

    catch (error) {

        console.error(
            "Não foi possível salvar os produtos:",
            error
        );


        showToast(
            "Não foi possível salvar os dados."
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


    const avatarElement =
        document.getElementById(
            "userAvatar"
        );


    if (userNameElement) {

        userNameElement.textContent =
            userName;
    }


    if (avatarElement) {

        avatarElement.textContent =
            createInitials(
                userName
            );
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
        words[
            words.length - 1
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
   SINCRONIZAÇÃO DO TEMA
========================================================= */

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
        .querySelectorAll(
            ".menu-item"
        )
        .forEach(
            item => {

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
   LINKS DEMONSTRATIVOS
========================================================= */

function configureDemoLinks() {

    document
        .querySelectorAll(
            "[data-demo-link]"
        )
        .forEach(
            link => {

                link.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();


                        showToast(
                            `${link.dataset.demoLink}: página disponível em uma próxima etapa da demonstração.`
                        );
                    }
                );
            }
        );
}


/* =========================================================
   PESQUISA
========================================================= */

function configureSearchAndFilter() {

    const searchInput =
        document.getElementById(
            "productSearch"
        );


    const typeFilter =
        document.getElementById(
            "typeFilter"
        );


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            renderProducts
        );
    }


    if (typeFilter) {

        typeFilter.addEventListener(
            "change",
            renderProducts
        );
    }
}


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
   FILTRO DE TIPO
========================================================= */

function updateTypeFilter() {

    const typeFilter =
        document.getElementById(
            "typeFilter"
        );


    if (!typeFilter) {

        return;
    }


    const currentValue =
        typeFilter.value;


    const uniqueTypes =
        [
            ...new Set(

                products
                    .map(
                        product =>
                            String(
                                product.type ||
                                ""
                            ).trim()
                    )
                    .filter(Boolean)
            )
        ]
            .sort(
                (a, b) =>
                    a.localeCompare(
                        b,
                        "pt-BR"
                    )
            );


    typeFilter.innerHTML =
        "";


    const allOption =
        document.createElement(
            "option"
        );


    allOption.value =
        "all";


    allOption.textContent =
        "Todos";


    typeFilter.appendChild(
        allOption
    );


    uniqueTypes.forEach(
        type => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                type;


            option.textContent =
                type;


            typeFilter.appendChild(
                option
            );
        }
    );


    const optionStillExists =
        Array
            .from(
                typeFilter.options
            )
            .some(
                option =>
                    option.value ===
                    currentValue
            );


    typeFilter.value =
        optionStillExists
            ? currentValue
            : "all";
}


/* =========================================================
   FILTRAR PRODUTOS
========================================================= */

function getFilteredProducts() {

    const searchInput =
        document.getElementById(
            "productSearch"
        );


    const typeFilter =
        document.getElementById(
            "typeFilter"
        );


    const searchTerm =
        normalizeText(
            searchInput
                ? searchInput.value
                : ""
        );


    const selectedType =
        typeFilter
            ? typeFilter.value
            : "all";


    return products.filter(
        product => {

            const searchableText =
                normalizeText(
                    [
                        product.name,
                        product.type,
                        product.color,
                        product.characteristic
                    ].join(" ")
                );


            const matchesSearch =
                !searchTerm ||
                searchableText.includes(
                    searchTerm
                );


            const matchesType =
                selectedType === "all" ||
                product.type ===
                    selectedType;


            return (
                matchesSearch &&
                matchesType
            );
        }
    );
}


/* =========================================================
   RENDERIZAÇÃO
========================================================= */

function renderProducts() {

    updateTypeFilter();

    renderStatistics();

    renderProductsTable();
}


/* =========================================================
   ESTATÍSTICAS
========================================================= */

function renderStatistics() {

    const types =
        new Set(

            products
                .map(
                    product =>
                        normalizeText(
                            product.type
                        )
                )
                .filter(Boolean)
        );


    const colors =
        new Set(

            products
                .map(
                    product =>
                        normalizeText(
                            product.color
                        )
                )
                .filter(Boolean)
        );


    setText(
        "totalProducts",
        formatNumber(
            products.length
        )
    );


    setText(
        "totalTypes",
        formatNumber(
            types.size
        )
    );


    setText(
        "totalColors",
        formatNumber(
            colors.size
        )
    );
}


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

function renderProductsTable() {

    const tableBody =
        document.getElementById(
            "productsTableBody"
        );


    const emptyState =
        document.getElementById(
            "productsEmptyState"
        );


    const resultsCounter =
        document.getElementById(
            "resultsCounter"
        );


    if (!tableBody) {

        return;
    }


    const filteredProducts =
        getFilteredProducts()
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


    filteredProducts.forEach(
        product => {

            tableBody.appendChild(
                createProductRow(
                    product
                )
            );
        }
    );


    if (emptyState) {

        emptyState.hidden =
            filteredProducts.length >
            0;
    }


    if (resultsCounter) {

        resultsCounter.textContent =
            formatResultsCounter(
                filteredProducts.length
            );
    }
}


/* =========================================================
   LINHA DO PRODUTO
========================================================= */

function createProductRow(
    product
) {

    const row =
        document.createElement(
            "tr"
        );


    const productCell =
        document.createElement(
            "td"
        );


    const typeCell =
        document.createElement(
            "td"
        );


    const colorCell =
        document.createElement(
            "td"
        );


    const characteristicCell =
        document.createElement(
            "td"
        );


    const actionsCell =
        document.createElement(
            "td"
        );


    /* PRODUTO */

    productCell.appendChild(
        createProductIdentity(
            product
        )
    );


    /* TIPO */

    const typeBadge =
        document.createElement(
            "span"
        );


    typeBadge.className =
        "product-type-badge";


    typeBadge.textContent =
        product.type ||
        "Não informado";


    typeCell.appendChild(
        typeBadge
    );


    /* COR */

    colorCell.className =
        "product-color";


    colorCell.textContent =
        product.color ||
        "Não informado";


    /* CARACTERÍSTICA */

    characteristicCell.className =
        "product-characteristic";


    characteristicCell.textContent =
        product.characteristic ||
        "Não informado";


    /* AÇÕES */

    actionsCell.appendChild(
        createProductActions(
            product
        )
    );


    row.append(
        productCell,
        typeCell,
        colorCell,
        characteristicCell,
        actionsCell
    );


    return row;
}


/* =========================================================
   IDENTIDADE DO PRODUTO
========================================================= */

function createProductIdentity(
    product
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
        "product-cell";


    avatar.className =
        "product-avatar";


    identity.className =
        "product-identity";


    avatar.textContent =
        createInitials(
            product.name
        );


    name.textContent =
        product.name;


    code.textContent =
        createProductCode(
            product.id
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
   AÇÕES
========================================================= */

function createProductActions(
    product
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
        "product-actions";


    /* EDITAR */

    editButton.className =
        "table-action-button";


    editButton.type =
        "button";


    editButton.textContent =
        "Editar";


    editButton.dataset.productAction =
        "edit";


    editButton.dataset.productId =
        product.id;


    /* EXCLUIR */

    deleteButton.className =
        "table-action-button delete";


    deleteButton.type =
        "button";


    deleteButton.textContent =
        "Excluir";


    deleteButton.dataset.productAction =
        "delete";


    deleteButton.dataset.productId =
        product.id;


    wrapper.append(
        editButton,
        deleteButton
    );


    return wrapper;
}


/* =========================================================
   CÓDIGO
========================================================= */

function createProductCode(id) {

    const cleanId =
        String(id)
            .replace(
                /[^a-zA-Z0-9]/g,
                ""
            )
            .slice(-6)
            .toUpperCase();


    return (
        `Produto #${
            cleanId ||
            "000001"
        }`
    );
}


/* =========================================================
   FORMATAÇÃO
========================================================= */

function formatNumber(value) {

    return new Intl.NumberFormat(
        "pt-BR"
    ).format(
        value
    );
}


function formatResultsCounter(
    total
) {

    if (total === 1) {

        return "1 produto exibido";
    }


    return (
        `${total} produtos exibidos`
    );
}


/* =========================================================
   MODAL
========================================================= */

function configureProductModal() {

    const newProductButton =
        document.getElementById(
            "newProductButton"
        );


    const productForm =
        document.getElementById(
            "productForm"
        );


    if (newProductButton) {

        newProductButton.addEventListener(
            "click",
            openNewProductModal
        );
    }


    if (productForm) {

        productForm.addEventListener(
            "submit",
            handleProductFormSubmit
        );
    }


    document
        .querySelectorAll(
            "[data-close-product-modal]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    closeProductModal
                );
            }
        );


    document.addEventListener(
        "keydown",
        event => {

            const modal =
                document.getElementById(
                    "productModal"
                );


            if (
                modal &&
                event.key === "Escape" &&
                !modal.hidden
            ) {

                closeProductModal();
            }
        }
    );
}


/* =========================================================
   NOVO PRODUTO
========================================================= */

function openNewProductModal() {

    resetProductForm();


    setText(
        "productModalTitle",
        "Novo produto"
    );


    setText(
        "productModalDescription",
        "Preencha as informações do produto."
    );


    openProductModal();
}


/* =========================================================
   EDITAR PRODUTO
========================================================= */

function openEditProductModal(
    productId
) {

    const product =
        products.find(
            item =>
                item.id ===
                productId
        );


    if (!product) {

        showToast(
            "Produto não encontrado."
        );

        return;
    }


    document.getElementById(
        "productId"
    ).value =
        product.id;


    document.getElementById(
        "productName"
    ).value =
        product.name;


    document.getElementById(
        "productType"
    ).value =
        product.type || "";


    document.getElementById(
        "productColor"
    ).value =
        product.color || "";


    document.getElementById(
        "productCharacteristic"
    ).value =
        product.characteristic ||
        "";


    setText(
        "productModalTitle",
        "Editar produto"
    );


    setText(
        "productModalDescription",
        "Atualize as informações do produto."
    );


    openProductModal();
}


/* =========================================================
   ABRIR MODAL
========================================================= */

function openProductModal() {

    const modal =
        document.getElementById(
            "productModal"
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
                    "productName"
                )
                ?.focus();

        },
        50
    );
}


/* =========================================================
   FECHAR MODAL
========================================================= */

function closeProductModal() {

    const modal =
        document.getElementById(
            "productModal"
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

function resetProductForm() {

    const form =
        document.getElementById(
            "productForm"
        );


    if (form) {

        form.reset();
    }


    const productId =
        document.getElementById(
            "productId"
        );


    if (productId) {

        productId.value =
            "";
    }
}


/* =========================================================
   SALVAR FORMULÁRIO
========================================================= */

function handleProductFormSubmit(
    event
) {

    event.preventDefault();


    const productId =
        document
            .getElementById(
                "productId"
            )
            ?.value ||
        "";


    const name =
        document
            .getElementById(
                "productName"
            )
            ?.value
            .trim() ||
        "";


    const type =
        document
            .getElementById(
                "productType"
            )
            ?.value
            .trim() ||
        "";


    const color =
        document
            .getElementById(
                "productColor"
            )
            ?.value
            .trim() ||
        "";


    const characteristic =
        document
            .getElementById(
                "productCharacteristic"
            )
            ?.value
            .trim() ||
        "";


    if (!name) {

        showToast(
            "Digite o nome do produto."
        );

        return;
    }


    if (productId) {

        updateProduct({

            id:
                productId,

            name,

            type,

            color,

            characteristic

        });

    }

    else {

        addProduct({

            name,

            type,

            color,

            characteristic

        });
    }


    saveProducts();


    renderProducts();


    closeProductModal();
}


/* =========================================================
   ADICIONAR PRODUTO
========================================================= */

function addProduct(
    productData
) {

    const newProduct = {

        id:
            generateProductId(),

        ...productData,

        createdAt:
            Date.now()

    };


    products.unshift(
        newProduct
    );


    updateDashboardForProductChange(
        1,
        `Produto ${newProduct.name} cadastrado`
    );


    showToast(
        "Produto cadastrado temporariamente."
    );
}


/* =========================================================
   ATUALIZAR PRODUTO
========================================================= */

function updateProduct(
    productData
) {

    const index =
        products.findIndex(
            product =>
                product.id ===
                productData.id
        );


    if (index === -1) {

        showToast(
            "Produto não encontrado."
        );

        return;
    }


    products[index] = {

        ...products[index],

        ...productData

    };


    updateDashboardForProductChange(
        0,
        `Produto ${productData.name} atualizado`
    );


    showToast(
        "Cadastro do produto atualizado."
    );
}


/* =========================================================
   ID
========================================================= */

function generateProductId() {

    if (
        typeof crypto !==
            "undefined" &&
        typeof crypto.randomUUID ===
            "function"
    ) {

        return crypto.randomUUID();
    }


    return (
        `product-${Date.now()}-${
            Math.random()
                .toString(16)
                .slice(2)
        }`
    );
}


/* =========================================================
   ABRIR NOVO PRODUTO PELA HOME
========================================================= */

function openNewProductFromUrl() {

    const url =
        new URL(
            window.location.href
        );


    if (
        url.searchParams.get(
            "novo"
        ) !== "1"
    ) {

        return;
    }


    openNewProductModal();


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
   EDITAR / EXCLUIR
========================================================= */

function configureProductActions() {

    const tableBody =
        document.getElementById(
            "productsTableBody"
        );


    if (!tableBody) {

        return;
    }


    tableBody.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-product-action]"
                );


            if (!button) {

                return;
            }


            const productId =
                button.dataset.productId;


            const action =
                button.dataset.productAction;


            if (
                action === "edit"
            ) {

                openEditProductModal(
                    productId
                );
            }


            if (
                action === "delete"
            ) {

                deleteProduct(
                    productId
                );
            }
        }
    );
}


/* =========================================================
   EXCLUIR
========================================================= */

function deleteProduct(
    productId
) {

    const product =
        products.find(
            item =>
                item.id ===
                productId
        );


    if (!product) {

        showToast(
            "Produto não encontrado."
        );

        return;
    }


    const shouldDelete =
        window.confirm(
            `Deseja excluir o produto ${product.name}?`
        );


    if (!shouldDelete) {

        return;
    }


    products =
        products.filter(
            item =>
                item.id !==
                productId
        );


    saveProducts();


    updateDashboardForProductChange(
        -1,
        `Produto ${product.name} removido`
    );


    renderProducts();


    showToast(
        "Produto removido da demonstração."
    );
}


/* =========================================================
   INTEGRAÇÃO COM A HOME
========================================================= */

function updateDashboardForProductChange(
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


        const currentProducts =
            Number(
                dashboard.products
            ) || 0;


        dashboard.products =
            Math.max(
                0,
                currentProducts +
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
                "Produtos",

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
            "Não foi possível sincronizar o produto com a Home:",
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