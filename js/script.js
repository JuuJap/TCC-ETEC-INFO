"use strict";

const PROFILE_KEY = "perfisTemporarios";
const USER_KEY = "usuarioLogado";
const THEME_KEY = "theme";
const body = document.body;
const themeIcon = document.querySelector(".icon");

function updateThemeIcon() {
    if (themeIcon) {
        themeIcon.textContent = body.classList.contains("dark-theme") ? "☀️" : "🌙";
    }
}

function toggleTheme() {
    body.classList.toggle("dark-theme");
    localStorage.setItem(THEME_KEY, body.classList.contains("dark-theme") ? "dark" : "light");
    updateThemeIcon();
    themeIcon?.classList.add("rotate");
    setTimeout(() => themeIcon?.classList.remove("rotate"), 300);
}

function toggleMenu() {
    document.querySelector(".header nav")?.classList.toggle("active");
    document.querySelector(".menu-toggle")?.classList.toggle("active");
}

function getProfiles() {
    try {
        const profiles = JSON.parse(sessionStorage.getItem(PROFILE_KEY) || "[]");
        return Array.isArray(profiles) ? profiles : [];
    } catch {
        return [];
    }
}

function saveProfiles(profiles) {
    sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profiles));
}

function initializeDemoAccount() {
    const profiles = getProfiles();
    const exists = profiles.some(profile => profile.usuario.toLowerCase() === "teste");
    if (!exists) {
        profiles.push({ usuario: "Teste", senha: "1234" });
        saveProfiles(profiles);
    }
}

function criarConta() {
    const usuario = document.getElementById("cadastro-usuario")?.value.trim();
    const senha = document.getElementById("cadastro-senha")?.value;
    const confirmarSenha = document.getElementById("confirmar-senha")?.value;

    if (!usuario || !senha || !confirmarSenha) {
        alert("Preencha todos os campos.");
        return;
    }
    if (senha !== confirmarSenha) {
        alert("As senhas não são iguais.");
        return;
    }

    const profiles = getProfiles();
    const exists = profiles.some(profile => profile.usuario.toLowerCase() === usuario.toLowerCase());
    if (exists) {
        alert("Esse nome de usuário já está sendo utilizado.");
        return;
    }

    profiles.push({ usuario, senha });
    saveProfiles(profiles);
    alert("Conta temporária criada com sucesso!");
    window.location.href = "index.html";
}

function entrar() {
    const usuario = document.getElementById("login-usuario")?.value.trim();
    const senha = document.getElementById("login-senha")?.value;

    if (!usuario || !senha) {
        alert("Digite o usuário e a senha.");
        return;
    }

    const profile = getProfiles().find(item =>
        item.usuario.toLowerCase() === usuario.toLowerCase() && item.senha === senha
    );

    if (!profile) {
        alert("Usuário ou senha incorretos.");
        return;
    }

    sessionStorage.setItem(USER_KEY, profile.usuario);
    alert(`Login realizado! Bem-vindo, ${profile.usuario}.`);
    window.location.href = "home.html";
}

body.classList.toggle("dark-theme", localStorage.getItem(THEME_KEY) === "dark");
updateThemeIcon();
initializeDemoAccount();
