const body = document.body;
const icon = document.querySelector(".icon");

function updateIcon() {
    if (icon) {
        icon.textContent = body.classList.contains("dark-theme") ? "☀️" : "🌙";
    }
}

function toggleTheme() {
    body.classList.toggle("dark-theme");
    localStorage.setItem(
        "theme",
        body.classList.contains("dark-theme") ? "dark" : "light"
    );

    updateIcon();
    icon?.classList.add("rotate");
    setTimeout(() => icon?.classList.remove("rotate"), 300);
}

function toggleMenu() {
    document.querySelector(".header nav")?.classList.toggle("active");
    document.querySelector(".menu-toggle")?.classList.toggle("active");
}

body.classList.toggle("dark-theme", localStorage.getItem("theme") === "dark");
updateIcon();

const CHAVE_PERFIS = "perfisTemporarios";

function obterPerfis() {
    try {
        return JSON.parse(sessionStorage.getItem(CHAVE_PERFIS)) || [];
    } catch {
        return [];
    }
}

function salvarPerfis(perfis) {
    sessionStorage.setItem(CHAVE_PERFIS, JSON.stringify(perfis));
}

function inicializarContaTeste() {
    const perfis = obterPerfis();

    const contaTesteExiste = perfis.some(
        perfil => perfil.usuario.toLowerCase() === "teste"
    );

    if (!contaTesteExiste) {
        perfis.push({
            usuario: "Teste",
            senha: "1234"
        });

        salvarPerfis(perfis);
    }
}

function criarConta() {
    const usuario = document
        .getElementById("cadastro-usuario")
        ?.value.trim();

    const senha = document
        .getElementById("cadastro-senha")
        ?.value;

    const confirmarSenha = document
        .getElementById("confirmar-senha")
        ?.value;

    if (!usuario || !senha || !confirmarSenha) {
        alert("Preencha todos os campos.");
        return;
    }

    if (senha !== confirmarSenha) {
        alert("As senhas não são iguais.");
        return;
    }

    const perfis = obterPerfis();

    const usuarioExiste = perfis.some(
        perfil => perfil.usuario.toLowerCase() === usuario.toLowerCase()
    );

    if (usuarioExiste) {
        alert("Esse nome de usuário já está sendo utilizado.");
        return;
    }

    perfis.push({
        usuario: usuario,
        senha: senha
    });

    salvarPerfis(perfis);

    alert("Conta temporária criada com sucesso!");

    window.location.href = "index.html";
}

function entrar() {
    const usuario = document
        .getElementById("login-usuario")
        ?.value.trim();

    const senha = document
        .getElementById("login-senha")
        ?.value;

    if (!usuario || !senha) {
        alert("Digite o usuário e a senha.");
        return;
    }

    const perfis = obterPerfis();

    const perfilEncontrado = perfis.find(
        perfil =>
            perfil.usuario.toLowerCase() === usuario.toLowerCase() &&
            perfil.senha === senha
    );

    if (!perfilEncontrado) {
        alert("Usuário ou senha incorretos.");
        return;
    }

    sessionStorage.setItem(
        "usuarioLogado",
        perfilEncontrado.usuario
    );

    alert(`Login realizado! Bem-vindo, ${perfilEncontrado.usuario}.`);
    window.location.href = "home.html";

    // Futuramente você pode redirecionar para outra página:
    // window.location.href = "perfil.html";
}

inicializarContaTeste();