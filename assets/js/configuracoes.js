"use strict";

const {
    KEYS,
    initAdminPage,
    normalizeText,
    readSessionArray,
    setText,
    showToast,
    confirmAction
} = VST;

const DEFAULT_COMPANY_SETTINGS = Object.freeze({
    name: "Velas S. Tomé",
    phone: "",
    address: "",
    cnpj: ""
});

const MAINTENANCE_API = "../backend/api/maintenance.php";
const AUTH_API = "../backend/api/auth.php";
const SETTINGS_FLASH_KEY = "velasSettingsFlash";

document.addEventListener(
    "DOMContentLoaded",
    initializeSettingsPage
);

function initializeSettingsPage() {
    if (!initAdminPage()) return;

    configureAppearanceSettings();
    configureCompanySettings();
    configurePasswordSettings();
    configureSystemCounters();
    configureDataManagement();
    configureSettingsSearch();
    showPendingFlashMessage();
}


/* =========================================================
   APARÊNCIA
========================================================= */

function configureAppearanceSettings() {
    const savedTheme =
        localStorage.getItem(KEYS.THEME);

    const selectedTheme =
        ["light", "dark", "system"].includes(savedTheme)
            ? savedTheme
            : "dark";

    const selectedInput =
        document.querySelector(
            `input[name="appearanceTheme"][value="${selectedTheme}"]`
        );

    if (selectedInput) {
        selectedInput.checked = true;
    }

    document
        .querySelectorAll(
            'input[name="appearanceTheme"]'
        )
        .forEach(input => {
            input.addEventListener(
                "change",
                () => applyAppearanceSetting(input.value)
            );
        });
}

function applyAppearanceSetting(theme) {
    const preference =
        ["light", "dark", "system"].includes(theme)
            ? theme
            : "dark";

    localStorage.setItem(
        KEYS.THEME,
        preference
    );

    const resolvedTheme =
        preference === "system"
            ? (
                window.matchMedia(
                    "(prefers-color-scheme: dark)"
                ).matches
                    ? "dark"
                    : "light"
            )
            : preference;

    VST.applyTheme?.(
        resolvedTheme
    );

    const messages = {
        light: "Tema claro ativado.",
        dark: "Tema escuro ativado.",
        system: "Tema automático ativado."
    };

    showToast(
        messages[preference]
    );
}


/* =========================================================
   DADOS DA EMPRESA
========================================================= */

function configureCompanySettings() {
    loadCompanySettings();

    document
        .getElementById(
            "companySettingsForm"
        )
        ?.addEventListener(
            "submit",
            saveCompanySettings
        );
}

function loadCompanySettings() {
    let settings =
        DEFAULT_COMPANY_SETTINGS;

    try {
        const stored =
            JSON.parse(
                localStorage.getItem(
                    KEYS.COMPANY
                ) || "null"
            );

        if (
            stored &&
            typeof stored === "object"
        ) {
            settings = {
                ...DEFAULT_COMPANY_SETTINGS,
                ...stored
            };
        }
    } catch {
        settings =
            DEFAULT_COMPANY_SETTINGS;
    }

    document.getElementById(
        "companyName"
    ).value =
        settings.name || "";

    document.getElementById(
        "companyPhone"
    ).value =
        settings.phone || "";

    document.getElementById(
        "companyAddress"
    ).value =
        settings.address || "";

    document.getElementById(
        "companyCnpj"
    ).value =
        settings.cnpj || "";
}

async function saveCompanySettings(event) {
    event.preventDefault();

    const submitButton =
        event.currentTarget.querySelector(
            'button[type="submit"]'
        );

    const settings = {
        name:
            document
                .getElementById(
                    "companyName"
                )
                ?.value
                .trim() ||
            "Velas S. Tomé",

        phone:
            document
                .getElementById(
                    "companyPhone"
                )
                ?.value
                .trim() ||
            "",

        address:
            document
                .getElementById(
                    "companyAddress"
                )
                ?.value
                .trim() ||
            "",

        cnpj:
            document
                .getElementById(
                    "companyCnpj"
                )
                ?.value
                .trim() ||
            ""
    };

    setButtonBusy(
        submitButton,
        true,
        "Salvando..."
    );

    try {
        if (!window.VST_DB?.sync) {
            throw new Error(
                "A sincronização com o banco não está disponível."
            );
        }

        await window.VST_DB.sync(
            KEYS.COMPANY,
            settings
        );

        setText(
            "sidebarCompanyName",
            settings.name
        );

        showToast(
            "Dados da empresa salvos no banco de dados."
        );

    } catch (error) {
        console.error(
            "Não foi possível salvar as configurações da empresa:",
            error
        );

        showToast(
            error.message ||
            "Não foi possível salvar os dados da empresa."
        );

    } finally {
        setButtonBusy(
            submitButton,
            false,
            "Salvar alterações"
        );
    }
}


/* =========================================================
   CONTA E SEGURANÇA
========================================================= */

function configurePasswordSettings() {
    document
        .getElementById(
            "passwordSettingsForm"
        )
        ?.addEventListener(
            "submit",
            changePassword
        );
}

async function changePassword(event) {
    event.preventDefault();

    const currentPassword =
        document
            .getElementById(
                "currentPassword"
            )
            ?.value || "";

    const newPassword =
        document
            .getElementById(
                "newPassword"
            )
            ?.value || "";

    const confirmation =
        document
            .getElementById(
                "confirmNewPassword"
            )
            ?.value || "";

    if (!currentPassword) {
        showToast(
            "Informe sua senha atual."
        );
        return;
    }

    if (newPassword.length < 8) {
        showToast(
            "A nova senha deve ter pelo menos 8 caracteres."
        );
        return;
    }

    if (newPassword !== confirmation) {
        showToast(
            "A confirmação da nova senha não coincide."
        );
        return;
    }

    if (newPassword === currentPassword) {
        showToast(
            "Escolha uma senha diferente da atual."
        );
        return;
    }

    const button =
        document.getElementById(
            "changePasswordButton"
        );

    setButtonBusy(
        button,
        true,
        "Alterando..."
    );

    try {
        const payload =
            await postJson(
                `${AUTH_API}?action=change-password`,
                {
                    senha_atual:
                        currentPassword,
                    nova_senha:
                        newPassword
                }
            );

        event.currentTarget.reset();

        showToast(
            payload.message ||
            "Senha alterada com sucesso."
        );

    } catch (error) {
        showToast(
            error.message ||
            "Não foi possível alterar a senha."
        );

    } finally {
        setButtonBusy(
            button,
            false,
            "Alterar senha"
        );
    }
}


/* =========================================================
   CONTADORES
========================================================= */

function configureSystemCounters() {
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

    setText(
        "settingsClientsCount",
        clients.length
    );

    setText(
        "settingsProductsCount",
        products.length
    );

    setText(
        "settingsSalesCount",
        sales.length
    );

    setText(
        "settingsOrdersCount",
        orders.length
    );
}


/* =========================================================
   GERENCIAMENTO DOS DADOS
========================================================= */

function configureDataManagement() {
    document
        .getElementById(
            "restoreDemoButton"
        )
        ?.addEventListener(
            "click",
            restoreDemoData
        );

    document
        .getElementById(
            "clearSystemDataButton"
        )
        ?.addEventListener(
            "click",
            clearSystemData
        );
}

async function restoreDemoData() {
    const confirmed =
        await confirmAction({
            title:
                "Restaurar dados de exemplo?",
            message:
                "Os dados operacionais atuais serão substituídos pelos dados de apresentação.",
            details:
                "Clientes, produtos, vendas, pedidos, movimentações e atividades serão recriados. Sua conta e os dados da empresa serão preservados.",
            confirmLabel:
                "Restaurar dados",
            cancelLabel:
                "Cancelar",
            tone:
                "warning"
        });

    if (!confirmed) return;

    const button =
        document.getElementById(
            "restoreDemoButton"
        );

    setButtonBusy(
        button,
        true,
        "Restaurando..."
    );

    try {
        const payload =
            await postJson(
                MAINTENANCE_API,
                { action: "restore_demo" }
            );

        sessionStorage.setItem(
            SETTINGS_FLASH_KEY,
            payload.message ||
            "Dados de exemplo restaurados com sucesso."
        );

        window.location.reload();

    } catch (error) {
        showToast(
            error.message ||
            "Não foi possível restaurar os dados de exemplo."
        );

        setButtonBusy(
            button,
            false,
            "Restaurar dados de exemplo"
        );
    }
}

async function clearSystemData() {
    const confirmed =
        await confirmAction({
            title:
                "Limpar dados do sistema?",
            message:
                "Clientes, produtos, vendas, pedidos, movimentações e atividades serão apagados.",
            details:
                "Sua conta, o tema e os dados da empresa serão preservados. Esta ação não pode ser desfeita.",
            confirmLabel:
                "Continuar",
            cancelLabel:
                "Cancelar",
            tone:
                "danger"
        });

    if (!confirmed) return;

    const secondConfirmation =
        await confirmAction({
            kicker:
                "Última confirmação",
            title:
                "Excluir todos os dados operacionais?",
            message:
                "Confirme somente se deseja realmente apagar os registros atuais do sistema.",
            details:
                "Depois de concluir a exclusão, os dados não poderão ser recuperados por esta tela.",
            confirmLabel:
                "Excluir dados",
            cancelLabel:
                "Voltar",
            tone:
                "danger"
        });

    if (!secondConfirmation) return;

    const button =
        document.getElementById(
            "clearSystemDataButton"
        );

    setButtonBusy(
        button,
        true,
        "Limpando..."
    );

    try {
        const payload =
            await postJson(
                MAINTENANCE_API,
                { action: "clear" }
            );

        sessionStorage.setItem(
            SETTINGS_FLASH_KEY,
            payload.message ||
            "Dados do sistema removidos com sucesso."
        );

        window.location.reload();

    } catch (error) {
        showToast(
            error.message ||
            "Não foi possível limpar os dados do sistema."
        );

        setButtonBusy(
            button,
            false,
            "Limpar dados do sistema"
        );
    }
}

function showPendingFlashMessage() {
    const message =
        sessionStorage.getItem(
            SETTINGS_FLASH_KEY
        );

    if (!message) return;

    sessionStorage.removeItem(
        SETTINGS_FLASH_KEY
    );

    window.setTimeout(
        () => showToast(message),
        120
    );
}


/* =========================================================
   BUSCA
========================================================= */

function configureSettingsSearch() {
    document
        .getElementById(
            "settingsSearch"
        )
        ?.addEventListener(
            "input",
            filterSettingsSections
        );
}

function filterSettingsSections() {
    const search =
        normalizeText(
            document
                .getElementById(
                    "settingsSearch"
                )
                ?.value ||
            ""
        );

    const sections = [
        ...document.querySelectorAll(
            ".settings-section"
        )
    ];

    let visibleSections = 0;

    sections.forEach(section => {
        const searchableText =
            normalizeText(
                [
                    section.dataset.settingsSearch,
                    section.textContent
                ].join(" ")
            );

        const visible =
            !search ||
            searchableText.includes(
                search
            );

        section.hidden =
            !visible;

        if (visible) {
            visibleSections += 1;
        }
    });

    const empty =
        document.getElementById(
            "settingsEmptySearch"
        );

    if (empty) {
        empty.hidden =
            visibleSections > 0;
    }
}


/* =========================================================
   HTTP / UI
========================================================= */

async function postJson(url, data) {
    const response =
        await fetch(
            url,
            {
                method: "POST",
                credentials: "same-origin",
                cache: "no-store",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            }
        );

    let payload;

    try {
        payload =
            await response.json();
    } catch {
        throw new Error(
            "O servidor retornou uma resposta inválida."
        );
    }

    if (response.status === 401) {
        sessionStorage.removeItem(KEYS.USER);
        window.location.replace("../index.html");
        throw new Error(
            payload?.message ||
            "Sua sessão expirou. Faça login novamente."
        );
    }

    if (
        !response.ok ||
        payload?.ok === false
    ) {
        throw new Error(
            payload?.message ||
            "Não foi possível concluir a operação."
        );
    }

    return payload;
}

function setButtonBusy(
    button,
    busy,
    label
) {
    if (!button) return;

    button.disabled =
        busy;

    button.setAttribute(
        "aria-busy",
        String(busy)
    );

    if (label) {
        button.textContent =
            label;
    }
}
