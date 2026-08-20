"use strict";

const {
    KEYS,
    initAdminPage,
    normalizeText,
    readSessionArray,
    setText,
    showToast
} = VST;

const DEFAULT_COMPANY_SETTINGS = Object.freeze({
    name: "Velas S. Tomé",
    phone: "",
    address: "",
    cnpj: ""
});

document.addEventListener(
    "DOMContentLoaded",
    initializeSettingsPage
);

function initializeSettingsPage() {
    if (!initAdminPage()) return;

    configureAppearanceSettings();
    configureCompanySettings();
    configureSystemCounters();
    configureFutureActions();
    configureSettingsSearch();
}


/* =========================================================
   APARÊNCIA
========================================================= */

function configureAppearanceSettings() {
    const savedTheme =
        localStorage.getItem(KEYS.THEME);

    const selectedTheme =
        ["light", "dark"].includes(savedTheme)
            ? savedTheme
            : "system";

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
    if (theme === "system") {
        localStorage.removeItem(KEYS.THEME);

        VST.applyTheme?.(
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches
                ? "dark"
                : "light"
        );

        showToast(
            "Tema automático ativado."
        );

        return;
    }

    localStorage.setItem(
        KEYS.THEME,
        theme
    );

    VST.applyTheme?.(
        theme
    );

    showToast(
        theme === "dark"
            ? "Tema escuro ativado."
            : "Tema claro ativado."
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

function saveCompanySettings(event) {
    event.preventDefault();

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

    localStorage.setItem(
        KEYS.COMPANY,
        JSON.stringify(
            settings
        )
    );

    showToast(
        "Dados da empresa salvos neste navegador."
    );
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
   FUNÇÕES FUTURAS
========================================================= */

function configureFutureActions() {
    document
        .querySelectorAll(
            ".future-action"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    showToast(
                        `A opção de ${button.dataset.futureAction} está preparada para uma futura integração.`
                    );

                }
            );

        });
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
            visibleSections >
            0;
    }
}
