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
    let activeConfirmDialog = null;

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


    function configureCompanyIdentity() {
        let companyName = "Velas S. Tomé";

        try {
            const settings = JSON.parse(
                localStorage.getItem(KEYS.COMPANY) || "null"
            );

            if (settings?.name) {
                companyName = String(settings.name).trim() || companyName;
            }
        } catch {
            // Mantém o nome padrão se os dados locais estiverem inválidos.
        }

        setText("sidebarCompanyName", companyName);
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

    function resolveTheme(themePreference) {
        if (themePreference === "system") {
            return window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light";
        }

        if (themePreference === "light") {
            return "light";
        }

        // Primeiro acesso e preferência "dark" iniciam no tema escuro.
        return "dark";
    }

    function configureTheme() {
        const saved = localStorage.getItem(KEYS.THEME);
        const preference = ["light", "dark", "system"].includes(saved)
            ? saved
            : "dark";

        applyTheme(resolveTheme(preference));
    }

    window.addEventListener("storage", event => {
        if (event.key !== KEYS.THEME) return;

        const preference = ["light", "dark", "system"].includes(event.newValue)
            ? event.newValue
            : "dark";

        applyTheme(resolveTheme(preference));
    });

    window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener?.("change", () => {
            if (localStorage.getItem(KEYS.THEME) === "system") {
                applyTheme(resolveTheme("system"));
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


    function configureLogout() {
        $("logoutButton")?.addEventListener(
            "click",
            async () => {
                const confirmed =
                    await confirmAction({
                        title: "Sair da conta?",
                        message:
                            "Sua sessão atual será encerrada.",
                        details:
                            "Você poderá entrar novamente usando seu usuário e senha.",
                        confirmLabel: "Sair",
                        cancelLabel: "Continuar no sistema",
                        tone: "warning"
                    });

                if (!confirmed) {
                    return;
                }

                try {
                    await fetch(
                        "../backend/api/auth.php?action=logout",
                        {
                            method: "POST",
                            credentials: "same-origin",
                            cache: "no-store",
                            headers: {
                                "Content-Type":
                                    "application/json",
                                "Accept":
                                    "application/json"
                            },
                            body: "{}"
                        }
                    );
                } catch (error) {
                    console.warn(
                        "[Velas S. Tomé] Não foi possível confirmar o logout no servidor:",
                        error
                    );
                } finally {
                    sessionStorage.removeItem(
                        KEYS.USER
                    );

                    window.location.replace(
                        "../index.html"
                    );
                }
            }
        );
    }

    function initAdminPage() {
        const userName = sessionStorage.getItem(KEYS.USER);

        if (!userName) {
            window.location.replace("../index.html");
            return null;
        }

        configureUser(userName);
        configureCompanyIdentity();
        configureTheme();
        configureSidebar();
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

    function ensureConfirmDialog() {
        let dialog =
            document.getElementById(
                "systemConfirmDialog"
            );

        if (dialog) {
            return dialog;
        }

        dialog =
            document.createElement(
                "div"
            );

        dialog.id =
            "systemConfirmDialog";

        dialog.className =
            "system-confirm-dialog";

        dialog.hidden =
            true;

        dialog.setAttribute(
            "aria-hidden",
            "true"
        );

        dialog.innerHTML = `
            <button
                class="system-confirm-backdrop"
                type="button"
                data-system-confirm-cancel
                aria-label="Cancelar e fechar"
            ></button>

            <section
                class="system-confirm-card"
                role="dialog"
                aria-modal="true"
                aria-labelledby="systemConfirmTitle"
                aria-describedby="systemConfirmMessage systemConfirmDetails"
            >
                <div class="system-confirm-icon" aria-hidden="true">
                    <span id="systemConfirmIcon">?</span>
                </div>

                <div class="system-confirm-copy">
                    <span
                        class="system-confirm-kicker"
                        id="systemConfirmKicker"
                    >
                        Confirmação
                    </span>

                    <h2 id="systemConfirmTitle">
                        Confirmar ação
                    </h2>

                    <p id="systemConfirmMessage"></p>

                    <p
                        class="system-confirm-details"
                        id="systemConfirmDetails"
                    ></p>
                </div>

                <div class="system-confirm-actions">
                    <button
                        class="secondary-button system-confirm-cancel"
                        type="button"
                        data-system-confirm-cancel
                    >
                        Cancelar
                    </button>

                    <button
                        class="primary-button system-confirm-accept"
                        type="button"
                        id="systemConfirmAccept"
                    >
                        Confirmar
                    </button>
                </div>
            </section>
        `;

        document.body.appendChild(
            dialog
        );

        return dialog;
    }


    function confirmAction(options = {}) {
        const dialog =
            ensureConfirmDialog();

        const card =
            dialog.querySelector(
                ".system-confirm-card"
            );

        const kicker =
            document.getElementById(
                "systemConfirmKicker"
            );

        const title =
            document.getElementById(
                "systemConfirmTitle"
            );

        const message =
            document.getElementById(
                "systemConfirmMessage"
            );

        const details =
            document.getElementById(
                "systemConfirmDetails"
            );

        const icon =
            document.getElementById(
                "systemConfirmIcon"
            );

        const acceptButton =
            document.getElementById(
                "systemConfirmAccept"
            );

        const cancelButtons = [
            ...dialog.querySelectorAll(
                "[data-system-confirm-cancel]"
            )
        ];

        const tone =
            ["default", "warning", "danger"]
                .includes(
                    options.tone
                )
                ? options.tone
                : "default";

        const toneConfig = {
            default: {
                kicker:
                    "Confirmação",
                icon:
                    "?"
            },

            warning: {
                kicker:
                    "Atenção",
                icon:
                    "!"
            },

            danger: {
                kicker:
                    "Ação irreversível",
                icon:
                    "!"
            }
        };

        const previousFocus =
            document.activeElement;

        if (
            activeConfirmDialog?.close
        ) {
            activeConfirmDialog.close(
                false
            );
        }

        card.dataset.tone =
            tone;

        kicker.textContent =
            options.kicker ||
            toneConfig[tone].kicker;

        icon.textContent =
            options.icon ||
            toneConfig[tone].icon;

        title.textContent =
            options.title ||
            "Confirmar ação";

        message.textContent =
            options.message ||
            "";

        message.hidden =
            !message.textContent;

        details.textContent =
            options.details ||
            "";

        details.hidden =
            !details.textContent;

        acceptButton.textContent =
            options.confirmLabel ||
            "Confirmar";

        const cancelButton =
            dialog.querySelector(
                ".system-confirm-cancel"
            );

        if (cancelButton) {
            cancelButton.textContent =
                options.cancelLabel ||
                "Cancelar";
        }

        return new Promise(resolve => {
            let finished =
                false;

            const close =
                result => {
                    if (finished) {
                        return;
                    }

                    finished =
                        true;

                    dialog.hidden =
                        true;

                    dialog.setAttribute(
                        "aria-hidden",
                        "true"
                    );

                    document.body.classList.remove(
                        "system-dialog-open"
                    );

                    document.removeEventListener(
                        "keydown",
                        handleKeydown,
                        true
                    );

                    acceptButton.removeEventListener(
                        "click",
                        handleAccept
                    );

                    cancelButtons.forEach(
                        button =>
                            button.removeEventListener(
                                "click",
                                handleCancel
                            )
                    );

                    if (
                        activeConfirmDialog?.close ===
                        close
                    ) {
                        activeConfirmDialog =
                            null;
                    }

                    if (
                        previousFocus &&
                        typeof previousFocus.focus ===
                            "function"
                    ) {
                        window.setTimeout(
                            () => {
                                try {
                                    previousFocus.focus();
                                } catch {
                                    // Elemento anterior pode ter sido removido.
                                }
                            },
                            0
                        );
                    }

                    resolve(
                        Boolean(result)
                    );
                };

            const handleAccept =
                () => close(true);

            const handleCancel =
                () => close(false);

            const handleKeydown =
                event => {
                    if (
                        event.key ===
                        "Escape"
                    ) {
                        event.preventDefault();
                        close(false);
                        return;
                    }

                    if (
                        event.key !==
                        "Tab"
                    ) {
                        return;
                    }

                    const focusable = [
                        ...dialog.querySelectorAll(
                            "button:not([disabled])"
                        )
                    ].filter(
                        element =>
                            element.offsetParent !==
                            null
                    );

                    if (
                        focusable.length ===
                        0
                    ) {
                        return;
                    }

                    const first =
                        focusable[0];

                    const last =
                        focusable[
                            focusable.length -
                            1
                        ];

                    if (
                        event.shiftKey &&
                        document.activeElement ===
                            first
                    ) {
                        event.preventDefault();
                        last.focus();
                    } else if (
                        !event.shiftKey &&
                        document.activeElement ===
                            last
                    ) {
                        event.preventDefault();
                        first.focus();
                    }
                };

            activeConfirmDialog = {
                close
            };

            dialog.hidden =
                false;

            dialog.setAttribute(
                "aria-hidden",
                "false"
            );

            document.body.classList.add(
                "system-dialog-open"
            );

            acceptButton.addEventListener(
                "click",
                handleAccept
            );

            cancelButtons.forEach(
                button =>
                    button.addEventListener(
                        "click",
                        handleCancel
                    )
            );

            document.addEventListener(
                "keydown",
                handleKeydown,
                true
            );

            window.requestAnimationFrame(
                () => {
                    cancelButton?.focus();
                }
            );
        });
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

            let companyName = "Velas S. Tomé";

            try {
                const companySettings = JSON.parse(
                    localStorage.getItem(KEYS.COMPANY) || "null"
                );

                if (companySettings?.name) {
                    companyName = String(companySettings.name).trim() || companyName;
                }
            } catch {
                // Mantém o nome padrão se a configuração local estiver inválida.
            }

            this.innerHTML = `
                <aside class="sidebar" id="sidebar" aria-label="Menu principal">
                    <div class="brand">
                        <img class="brand-logo" src="../assets/img/Logo1.png" alt="Logo da Velas S. Tomé">
                        <div class="brand-text">
                            <strong id="sidebarCompanyName">${escapeHtml(companyName)}</strong>
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
                        <div class="user-summary">
                            <div class="user-avatar" id="userAvatar">US</div>
                            <div class="user-text">
                                <strong id="userName">Usuário</strong>
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
        createInitials,
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
        showToast,
        confirmAction
    };
})();

window.VST = VST;
