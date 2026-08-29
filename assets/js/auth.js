"use strict";

const AUTH_API = "backend/api/auth.php";
const USER_KEY = "usuarioLogado";
const REMEMBERED_USER_KEY = "velasLoginUsuarioLembrado";
const RECENT_REGISTER_KEY = "velasCadastroUsuarioRecente";

let toastTimer;

document.addEventListener("DOMContentLoaded", initializeAuthPage);

async function initializeAuthPage() {
    cleanupLegacyAuthData();
    configurePasswordToggles();
    configureLoginForm();
    configureRegisterForm();
    restoreRememberedUser();
    restoreRecentlyRegisteredUser();
    showRegistrationSuccess();

    await redirectAuthenticatedUser();
}


/* =========================================================
   PHP / API
========================================================= */

async function authRequest(action, data = {}) {
    const isGet = action === "me";

    const response = await fetch(
        `${AUTH_API}?action=${encodeURIComponent(action)}`,
        {
            method: isGet ? "GET" : "POST",
            credentials: "same-origin",
            cache: "no-store",
            headers: {
                "Accept": "application/json",
                ...(isGet
                    ? {}
                    : { "Content-Type": "application/json" })
            },
            body:
                isGet
                    ? undefined
                    : JSON.stringify(data)
        }
    );

    let payload;

    try {
        payload = await response.json();
    } catch {
        throw new Error(
            "O servidor retornou uma resposta inválida."
        );
    }

    if (!response.ok || payload?.ok === false) {
        const error = new Error(
            payload?.message ||
            "Não foi possível concluir a operação."
        );

        error.status = response.status;
        error.payload = payload;

        throw error;
    }

    return payload;
}


async function redirectAuthenticatedUser() {
    try {
        const payload =
            await authRequest("me");

        if (
            payload?.authenticated &&
            payload?.user?.name
        ) {
            sessionStorage.setItem(
                USER_KEY,
                payload.user.name
            );

            window.location.replace(
                "pages/home.html"
            );
        }

    } catch (error) {

        if (error?.status === 401) {
            sessionStorage.removeItem(
                USER_KEY
            );

            return;
        }

        console.warn(
            "[Velas S. Tomé] Não foi possível verificar a sessão:",
            error
        );
    }
}


/* =========================================================
   LOGIN
========================================================= */

function configureLoginForm() {
    const form =
        document.getElementById(
            "loginForm"
        );

    if (!form) return;

    form.addEventListener(
        "submit",
        handleLogin
    );
}


async function handleLogin(event) {
    event.preventDefault();
    clearErrors();

    const userInput =
        document.getElementById(
            "loginUser"
        );

    const passwordInput =
        document.getElementById(
            "loginPassword"
        );

    const user =
        userInput?.value.trim() || "";

    const password =
        passwordInput?.value || "";

    let valid = true;

    if (!user) {
        setError(
            "loginUser",
            "Digite seu usuário."
        );

        valid = false;
    }

    if (!password) {
        setError(
            "loginPassword",
            "Digite sua senha."
        );

        valid = false;
    }

    if (!valid) return;

    const button =
        document.getElementById(
            "loginSubmit"
        );

    setButtonLoading(
        button,
        true,
        "Entrando..."
    );

    setStatus(
        "loginStatus",
        "Verificando seus dados..."
    );

    try {
        const payload =
            await authRequest(
                "login",
                {
                    usuario: user,
                    senha: password
                }
            );

        const userName =
            payload?.user?.name ||
            user;

        sessionStorage.setItem(
            USER_KEY,
            userName
        );

        saveRememberedUser(
            user
        );

        setStatus(
            "loginStatus",
            "Acesso autorizado. Abrindo o sistema..."
        );

        showToast(
            `Bem-vindo, ${userName}.`
        );

        window.setTimeout(
            () => {
                window.location.replace(
                    "pages/home.html"
                );
            },
            380
        );

    } catch (error) {

        setStatus(
            "loginStatus",
            "",
            true
        );

        if (
            error?.status === 401
        ) {
            setError(
                "loginPassword",
                error.message ||
                "Usuário ou senha incorretos."
            );

            passwordInput?.focus();
        } else {
            showToast(
                error.message ||
                "Não foi possível entrar."
            );
        }

        setButtonLoading(
            button,
            false,
            "Entrar"
        );
    }
}


/* =========================================================
   CADASTRO
========================================================= */

function configureRegisterForm() {
    const form =
        document.getElementById(
            "registerForm"
        );

    if (!form) return;

    form.addEventListener(
        "submit",
        handleRegister
    );
}


async function handleRegister(event) {
    event.preventDefault();
    clearErrors();

    const user =
        document
            .getElementById(
                "registerUser"
            )
            ?.value
            .trim() || "";

    const password =
        document
            .getElementById(
                "registerPassword"
            )
            ?.value || "";

    const confirmPassword =
        document
            .getElementById(
                "registerConfirm"
            )
            ?.value || "";

    let valid = true;

    if (!user) {
        setError(
            "registerUser",
            "Escolha um nome de usuário."
        );

        valid = false;
    } else if (user.length < 3) {
        setError(
            "registerUser",
            "O usuário deve ter pelo menos 3 caracteres."
        );

        valid = false;
    }

    if (!password) {
        setError(
            "registerPassword",
            "Crie uma senha."
        );

        valid = false;
    } else if (password.length < 8) {
        setError(
            "registerPassword",
            "A senha deve ter pelo menos 8 caracteres."
        );

        valid = false;
    }

    if (!confirmPassword) {
        setError(
            "registerConfirm",
            "Confirme sua senha."
        );

        valid = false;
    } else if (
        password !==
        confirmPassword
    ) {
        setError(
            "registerConfirm",
            "As senhas não coincidem."
        );

        valid = false;
    }

    if (!valid) return;

    const button =
        document.getElementById(
            "registerSubmit"
        );

    setButtonLoading(
        button,
        true,
        "Criando conta..."
    );

    setStatus(
        "registerStatus",
        "Salvando sua conta no banco de dados..."
    );

    try {
        const payload =
            await authRequest(
                "register",
                {
                    usuario: user,
                    senha: password
                }
            );

        sessionStorage.setItem(
            RECENT_REGISTER_KEY,
            user
        );

        setStatus(
            "registerStatus",
            "Conta criada. Redirecionando para o login..."
        );

        showToast(
            payload?.message ||
            "Conta criada com sucesso."
        );

        window.setTimeout(
            () => {
                window.location.replace(
                    "index.html?cadastro=ok"
                );
            },
            700
        );

    } catch (error) {

        setStatus(
            "registerStatus",
            "",
            true
        );

        if (error?.status === 409) {
            setError(
                "registerUser",
                error.message ||
                "Esse usuário já está cadastrado."
            );

            document
                .getElementById(
                    "registerUser"
                )
                ?.focus();
        } else {
            showToast(
                error.message ||
                "Não foi possível criar a conta."
            );
        }

        setButtonLoading(
            button,
            false,
            "Criar conta"
        );
    }
}


/* =========================================================
   SENHA / LEMBRAR USUÁRIO
========================================================= */

function configurePasswordToggles() {
    document
        .querySelectorAll(
            "[data-toggle-password]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const input =
                        document.getElementById(
                            button.dataset.togglePassword
                        );

                    if (!input) return;

                    const show =
                        input.type ===
                        "password";

                    input.type =
                        show
                            ? "text"
                            : "password";

                    button.setAttribute(
                        "aria-label",
                        show
                            ? "Ocultar senha"
                            : "Mostrar senha"
                    );

                    button.classList.toggle(
                        "active",
                        show
                    );
                }
            );
        });
}


function saveRememberedUser(user) {
    const remember =
        document.getElementById(
            "rememberUser"
        )?.checked;

    if (remember) {
        localStorage.setItem(
            REMEMBERED_USER_KEY,
            user
        );

        return;
    }

    localStorage.removeItem(
        REMEMBERED_USER_KEY
    );
}


function restoreRememberedUser() {
    const userInput =
        document.getElementById(
            "loginUser"
        );

    const remember =
        document.getElementById(
            "rememberUser"
        );

    if (
        !userInput ||
        !remember
    ) {
        return;
    }

    const user =
        localStorage.getItem(
            REMEMBERED_USER_KEY
        );

    if (!user) return;

    userInput.value =
        user;

    remember.checked =
        true;
}


function restoreRecentlyRegisteredUser() {
    const input =
        document.getElementById(
            "loginUser"
        );

    if (!input) return;

    const recent =
        sessionStorage.getItem(
            RECENT_REGISTER_KEY
        );

    if (!recent) return;

    input.value =
        recent;

    sessionStorage.removeItem(
        RECENT_REGISTER_KEY
    );
}


/* =========================================================
   INTERFACE
========================================================= */

function showRegistrationSuccess() {
    const params =
        new URLSearchParams(
            window.location.search
        );

    if (
        params.get(
            "cadastro"
        ) !== "ok"
    ) {
        return;
    }

    showToast(
        "Conta criada com sucesso. Agora faça seu login."
    );

    window.history.replaceState(
        {},
        document.title,
        window.location.pathname
    );
}


function setButtonLoading(
    button,
    loading,
    label
) {
    if (!button) return;

    button.disabled =
        loading;

    button.classList.toggle(
        "is-loading",
        loading
    );

    button.setAttribute(
        "aria-busy",
        String(loading)
    );

    const labelElement =
        button.querySelector(
            ".button-label"
        );

    if (labelElement) {
        labelElement.textContent =
            label;
    }
}


function setStatus(
    id,
    message,
    hide = false
) {
    const element =
        document.getElementById(
            id
        );

    if (!element) return;

    element.textContent =
        message;

    element.hidden =
        hide ||
        !message;
}


function setError(
    inputId,
    message
) {
    const input =
        document.getElementById(
            inputId
        );

    const error =
        document.querySelector(
            `[data-error-for="${inputId}"]`
        );

    input
        ?.closest(
            ".input-wrap"
        )
        ?.classList.add(
            "has-error"
        );

    input?.setAttribute(
        "aria-invalid",
        "true"
    );

    if (error) {
        error.textContent =
            message;
    }
}


function clearErrors() {
    document
        .querySelectorAll(
            ".field-error"
        )
        .forEach(error => {
            error.textContent =
                "";
        });

    document
        .querySelectorAll(
            ".input-wrap"
        )
        .forEach(wrapper => {
            wrapper.classList.remove(
                "has-error"
            );
        });

    document
        .querySelectorAll(
            "input[aria-invalid]"
        )
        .forEach(input => {
            input.removeAttribute(
                "aria-invalid"
            );
        });
}


function showToast(message) {
    const toast =
        document.getElementById(
            "toast"
        );

    const messageElement =
        document.getElementById(
            "toastMessage"
        );

    if (
        !toast ||
        !messageElement
    ) {
        return;
    }

    messageElement.textContent =
        message;

    toast.classList.add(
        "show"
    );

    clearTimeout(
        toastTimer
    );

    toastTimer =
        window.setTimeout(
            () => {
                toast.classList.remove(
                    "show"
                );
            },
            3600
        );
}


/* =========================================================
   LIMPEZA DE DADOS DA INTERFACE ANTIGA
========================================================= */

function cleanupLegacyAuthData() {
    // Chaves usadas por versões front-end/demos antigas do login.
    sessionStorage.removeItem(
        "perfisTemporarios"
    );

    localStorage.removeItem(
        "vst-demo-remembered-user"
    );
}
