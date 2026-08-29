"use strict";

(() => {
    const API = "../backend/api/sync.php";
    const AUTH_API = "../backend/api/auth.php";

    const SESSION_KEYS = new Set([
        "velasClientesTemporarios",
        "velasProdutosTemporarios",
        "velasVendasTemporarias",
        "velasPedidosTemporarios",
        "velasFinanceiroTemporario",
        "velasDashboardTemporario"
    ]);

    const COMPANY_KEY = "velasEmpresaConfiguracoes";
    const USER_KEY = "usuarioLogado";

    const originalSetItem = Storage.prototype.setItem;
    const originalRemoveItem = Storage.prototype.removeItem;
    const originalAddEventListener = EventTarget.prototype.addEventListener;

    let hydrating = true;
    const timers = new Map();

    function rawSet(storage, key, value) {
        originalSetItem.call(storage, key, value);
    }

    function rawRemove(storage, key) {
        originalRemoveItem.call(storage, key);
    }

    async function request(url, options = {}) {
        const response = await fetch(url, {
            credentials: "same-origin",
            cache: "no-store",
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        });

        let payload = null;
        try {
            payload = await response.json();
        } catch {
            payload = { ok: false, message: "Resposta inválida do servidor." };
        }

        if (!response.ok) {
            const error = new Error(payload?.message || "Erro de comunicação com o servidor.");
            error.status = response.status;
            throw error;
        }
        return payload;
    }

    function scheduleSync(key, data) {
        if (hydrating) return;

        clearTimeout(timers.get(key));
        timers.set(key, setTimeout(async () => {
            try {
                await request(API, {
                    method: "POST",
                    keepalive: true,
                    body: JSON.stringify({ key, data })
                });
            } catch (error) {
                console.error(`[Velas S. Tomé] Falha ao sincronizar ${key}:`, error);
                if (error?.status === 401) {
                    rawRemove(sessionStorage, USER_KEY);
                    window.location.replace("../index.html");
                }
            }
        }, 80));
    }

    Storage.prototype.setItem = function (key, value) {
        originalSetItem.call(this, key, value);

        if (hydrating) return;

        if (this === sessionStorage && SESSION_KEYS.has(key)) {
            try {
                scheduleSync(key, JSON.parse(value));
            } catch (error) {
                console.warn(`Não foi possível interpretar ${key} para sincronização.`, error);
            }
            return;
        }

        if (this === localStorage && key === COMPANY_KEY) {
            try {
                scheduleSync(key, JSON.parse(value));
            } catch (error) {
                console.warn("Não foi possível interpretar as configurações da empresa.", error);
            }
        }
    };

    Storage.prototype.removeItem = function (key) {
        originalRemoveItem.call(this, key);

        if (hydrating) return;
        if (this === sessionStorage && SESSION_KEYS.has(key)) {
            scheduleSync(key, key === "velasDashboardTemporario" ? {} : []);
        }
        if (this === localStorage && key === COMPANY_KEY) {
            scheduleSync(key, {});
        }
    };


    async function syncNow(key, data) {
        const payload = await request(API, {
            method: "POST",
            body: JSON.stringify({ key, data })
        });

        if (SESSION_KEYS.has(key)) {
            rawSet(sessionStorage, key, JSON.stringify(data));
        } else if (key === COMPANY_KEY) {
            rawSet(localStorage, key, JSON.stringify(data));
        }

        return payload;
    }

    async function bootstrap() {
        try {
            const payload = await request(API);
            const data = payload?.data || {};

            for (const key of SESSION_KEYS) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    rawSet(sessionStorage, key, JSON.stringify(data[key]));
                }
            }

            if (Object.prototype.hasOwnProperty.call(data, COMPANY_KEY)) {
                rawSet(localStorage, COMPANY_KEY, JSON.stringify(data[COMPANY_KEY]));
            }

            const userName = payload?.user?.name || "";
            if (userName) rawSet(sessionStorage, USER_KEY, userName);

            return payload;
        } catch (error) {
            console.error("[Velas S. Tomé] Não foi possível carregar o banco:", error);
            if (error?.status === 401) {
                rawRemove(sessionStorage, USER_KEY);
                window.location.replace("../index.html");
            }
            throw error;
        } finally {
            hydrating = false;
        }
    }

    const ready = bootstrap();
    window.VST_DB_READY = ready;
    window.VST_DB = Object.freeze({
        ready,
        sync: syncNow
    });

    // Os scripts atuais registram suas inicializações em DOMContentLoaded.
    // Este wrapper garante que elas rodem somente depois da carga do MySQL.
    EventTarget.prototype.addEventListener = function (type, listener, options) {
        if (this === document && type === "DOMContentLoaded" && typeof listener === "function") {
            const wrapped = function (event) {
                ready
                    .then(() => listener.call(this, event))
                    .catch(() => {});
            };
            return originalAddEventListener.call(this, type, wrapped, options);
        }
        return originalAddEventListener.call(this, type, listener, options);
    };
})();
