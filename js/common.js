"use strict";

const VST = (() => {
    const KEYS = Object.freeze({
        THEME: "theme",
        USER: "usuarioLogado",
        CLIENTS: "velasClientesTemporarios",
        PRODUCTS: "velasProdutosTemporarios",
        SALES: "velasVendasTemporarias",
        ORDERS: "velasPedidosTemporarios",
        FINANCE: "velasFinanceiroTemporario",
        DASHBOARD: "velasDashboardTemporario",
        COMPANY: "velasEmpresaConfiguracoes"
    });

    let toastTimer;
    const $ = id => document.getElementById(id);

    function setText(id, value) {
        const element = $(id);
        if (element) element.textContent = value;
    }

    function createInitials(name) {
        const words = String(name ?? "").trim().split(/\s+/).filter(Boolean);
        if (!words.length) return "US";
        if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
        return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
    }

    function configureUser(userName) {
        setText("userName", userName);
        setText("welcomeUser", userName);
        setText("userAvatar", createInitials(userName));
    }

    function applyTheme(theme) {
        const isDark = theme === "dark";
        document.body.classList.toggle("dark-mode", isDark);
        setText("themeIcon", isDark ? "☀" : "☾");
        $("themeToggle")?.setAttribute(
            "aria-label",
            isDark ? "Ativar tema claro" : "Ativar tema escuro"
        );
    }

    function configureTheme() {
        const button = $("themeToggle");
        if (!button) return;

        const saved = localStorage.getItem(KEYS.THEME);
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const initial = ["dark", "light"].includes(saved)
            ? saved
            : prefersDark ? "dark" : "light";

        applyTheme(initial);

        button.addEventListener("click", () => {
            const next = document.body.classList.contains("dark-mode")
                ? "light"
                : "dark";

            applyTheme(next);
            localStorage.setItem(KEYS.THEME, next);
        });
    }

    window.addEventListener("storage", event => {
        if (event.key !== KEYS.THEME) return;

        if (["dark", "light"].includes(event.newValue)) {
            applyTheme(event.newValue);
            return;
        }

        if (event.newValue === null) {
            applyTheme(
                window.matchMedia("(prefers-color-scheme: dark)").matches
                    ? "dark"
                    : "light"
            );
        }
    });

    function toggleSidebar() {
        const isOpen = document.body.classList.toggle("sidebar-open");
        const button = $("menuToggle");
        button?.setAttribute("aria-expanded", String(isOpen));
        button?.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
    }

    function closeSidebar() {
        document.body.classList.remove("sidebar-open");
        $("menuToggle")?.setAttribute("aria-expanded", "false");
        $("menuToggle")?.setAttribute("aria-label", "Abrir menu");
    }

    function configureSidebar() {
        $("menuToggle")?.addEventListener("click", toggleSidebar);
        $("sidebarOverlay")?.addEventListener("click", closeSidebar);

        document.querySelectorAll(".menu-item").forEach(link => {
            link.addEventListener("click", () => {
                if (window.innerWidth <= 920) closeSidebar();
            });
        });

        window.addEventListener("resize", () => {
            if (window.innerWidth > 920) closeSidebar();
        });
    }

    function configureDemoLinks() {
        document.querySelectorAll("[data-demo-link]").forEach(link => {
            link.addEventListener("click", event => {
                event.preventDefault();
                showToast(
                    `${link.dataset.demoLink}: página disponível em uma próxima etapa da demonstração.`
                );
            });
        });
    }

    function configureLogout() {
        $("logoutButton")?.addEventListener("click", () => {
            if (!window.confirm("Deseja sair da sua conta?")) return;
            sessionStorage.removeItem(KEYS.USER);
            window.location.replace("index.html");
        });
    }

    function initAdminPage() {
        const userName = sessionStorage.getItem(KEYS.USER);

        if (!userName) {
            window.location.replace("index.html");
            return null;
        }

        configureUser(userName);
        configureTheme();
        configureSidebar();
        configureDemoLinks();
        configureLogout();
        return userName;
    }

    function normalizeText(text) {
        return String(text ?? "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();
    }

    function parseDecimalValue(value) {
        const text = String(value ?? "").trim();
        if (!text) return 0;

        const normalized = text.includes(",")
            ? text.replace(/\./g, "").replace(",", ".")
            : text;

        const number = Number.parseFloat(normalized);
        return Number.isFinite(number) ? number : 0;
    }

    function formatEditableDecimal(value, maximumFractionDigits = 3) {
        return new Intl.NumberFormat("pt-BR", {
            useGrouping: false,
            minimumFractionDigits: 0,
            maximumFractionDigits
        }).format(Number(value) || 0);
    }

    function formatCurrency(value) {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL"
        }).format(Number(value) || 0);
    }

    function formatWeight(value) {
        return `${new Intl.NumberFormat("pt-BR", {
            maximumFractionDigits: 3
        }).format(Number(value) || 0)} g`;
    }

    function formatNumber(value) {
        return new Intl.NumberFormat("pt-BR").format(Number(value) || 0);
    }

    function formatDate(timestamp) {
        return new Intl.DateTimeFormat("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }).format(new Date(timestamp));
    }

    function formatDateTime(timestamp) {
        const date = new Date(timestamp);
        if (Number.isNaN(date.getTime())) return "Data inválida";

        return new Intl.DateTimeFormat("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }).format(date);
    }

    function createId(prefix = "") {
        const id =
            typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

        return prefix ? `${prefix}-${id}` : id;
    }

    function escapeHtml(value) {
        const element = document.createElement("div");
        element.textContent = String(value ?? "");
        return element.innerHTML;
    }

    function escapeAttribute(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    function readSessionArray(key) {
        try {
            const value = JSON.parse(sessionStorage.getItem(key) || "[]");
            return Array.isArray(value) ? value : [];
        } catch {
            return [];
        }
    }

    function showToast(message) {
        const toast = $("toast");
        const messageElement = $("toastMessage");
        if (!toast || !messageElement) return;

        messageElement.textContent = message;
        toast.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
    }

    class AppSidebar extends HTMLElement {
        connectedCallback() {
            this.style.display = "contents";
            const active = this.getAttribute("active") || "";

            const items = [
                ["inicio", "home.html", "⌂", "Início"],
                ["clientes", "clientes.html", "◉", "Clientes"],
                ["produtos", "produtos.html", "▦", "Produtos"],
                ["vendas", "vendas.html", "$", "Vendas"],
                ["pedidos", "pedidos.html", "▤", "Pedidos"],
                ["controle", "financeiro.html", "R$", "Controle Geral"],
                ["configuracoes", "configuracoes.html", "⚙", "Configurações"]
            ];

            const links = items.map(([key, href, icon, label]) => `
                <a href="${href}" class="menu-item${active === key ? " active" : ""}">
                    <span class="menu-icon" aria-hidden="true">${icon}</span>
                    <span>${label}</span>
                </a>
            `).join("");

            this.innerHTML = `
                <aside class="sidebar" id="sidebar" aria-label="Menu principal">
                    <div class="brand">
                        <img class="brand-logo" src="img/Logo1.png" alt="Logo da Velas S. Tomé">
                        <div class="brand-text">
                            <strong>Velas S. Tomé</strong>
                            <span>Gestão empresarial</span>
                        </div>
                    </div>

                    <nav class="sidebar-nav">
                        ${links}
                    </nav>

                    <div class="sidebar-footer">
                        <button class="logout-button" id="logoutButton" type="button">
                            <span aria-hidden="true">↪</span>
                            <span>Sair da conta</span>
                        </button>
                    </div>
                </aside>

                <button
                    class="sidebar-overlay"
                    id="sidebarOverlay"
                    type="button"
                    aria-label="Fechar menu"
                ></button>
            `;
        }
    }

    class AppTopbar extends HTMLElement {
        connectedCallback() {
            this.style.display = "contents";
            const searchId = this.getAttribute("search-id") || "globalSearch";
            const searchClass = this.getAttribute("search-class") || "";
            const placeholder = escapeAttribute(this.getAttribute("placeholder") || "Buscar...");
            const searchLabel = escapeAttribute(this.getAttribute("search-label") || "Buscar");

            this.innerHTML = `
                <header class="topbar">
                    <button
                        class="icon-button menu-toggle"
                        id="menuToggle"
                        type="button"
                        aria-label="Abrir menu"
                        aria-expanded="false"
                    >☰</button>

                    <div class="search-box${searchClass ? ` ${searchClass}` : ""}">
                        <span class="search-icon" aria-hidden="true">⌕</span>
                        <input
                            id="${escapeAttribute(searchId)}"
                            type="search"
                            placeholder="${placeholder}"
                            autocomplete="off"
                            aria-label="${searchLabel}"
                        >
                    </div>

                    <div class="topbar-actions">
                        <button
                            class="icon-button theme-toggle"
                            id="themeToggle"
                            type="button"
                            aria-label="Ativar tema escuro"
                        ><span id="themeIcon">☾</span></button>

                        <div class="user-summary">
                            <div class="user-avatar" id="userAvatar">US</div>
                            <div class="user-text">
                                <strong id="userName">Usuário</strong>
                                <span>Conta temporária</span>
                            </div>
                        </div>
                    </div>
                </header>
            `;
        }
    }

    class AppToast extends HTMLElement {
        connectedCallback() {
            this.style.display = "contents";
            this.innerHTML = `
                <div class="toast" id="toast" role="status" aria-live="polite">
                    <span class="toast-icon" aria-hidden="true">✓</span>
                    <span id="toastMessage">Operação realizada.</span>
                </div>
            `;
        }
    }

    if (!customElements.get("app-sidebar")) customElements.define("app-sidebar", AppSidebar);
    if (!customElements.get("app-topbar")) customElements.define("app-topbar", AppTopbar);
    if (!customElements.get("app-toast")) customElements.define("app-toast", AppToast);

    return {
        KEYS,
        initAdminPage,
        applyTheme,
        normalizeText,
        parseDecimalValue,
        formatEditableDecimal,
        formatCurrency,
        formatWeight,
        formatNumber,
        formatDate,
        formatDateTime,
        createId,
        escapeHtml,
        readSessionArray,
        setText,
        showToast
    };
})();

window.VST = VST;
