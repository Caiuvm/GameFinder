
const form = document.getElementById("chat-form");
const input = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");
const messages = document.getElementById("messages");
const welcome = document.getElementById("welcome");


// Adiciona uma mensagem na conversa
function adicionarMensagem(texto, tipo) {

    const message = document.createElement("div");
    message.className = `message ${tipo}-message`;

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = tipo === "user" ? "U" : "G";

    const content = document.createElement("div");
    content.className = "message-content";

    const author = document.createElement("div");
    author.className = "message-author";
    author.textContent = tipo === "user" ? "Você" : "GameFinder";

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    bubble.textContent = texto;

    content.appendChild(author);
    content.appendChild(bubble);

    message.appendChild(avatar);
    message.appendChild(content);

    messages.appendChild(message);

    message.scrollIntoView({
        behavior: "smooth",
        block: "end"
    });

    return message;
}


// Exibe as preferências identificadas
function exibirPreferencias(preferencias, elemento) {

    const box = document.createElement("div");
    box.className = "preferences";

    const titulo = document.createElement("h3");
    titulo.textContent = "Preferências identificadas";

    const tags = document.createElement("div");
    tags.className = "preference-tags";

    const todasPreferencias = [
        ...preferencias.generos,
        ...preferencias.caracteristicas
    ];

    if (todasPreferencias.length === 0) {
        const vazio = document.createElement("span");
        vazio.className = "preference-tag";
        vazio.textContent = "Nenhuma preferência identificada";
        tags.appendChild(vazio);
    }

    todasPreferencias.forEach(preferencia => {

        const tag = document.createElement("span");
        tag.className = "preference-tag";
        tag.textContent = preferencia;

        tags.appendChild(tag);
    });

    box.appendChild(titulo);
    box.appendChild(tags);

    elemento.appendChild(box);
}


// Exibe os jogos recomendados
function exibirJogos(jogos, elemento) {

    const titulo = document.createElement("h3");
    titulo.className = "results-title";
    titulo.textContent = "🎮 Jogos recomendados";

    elemento.appendChild(titulo);

    if (jogos.length === 0) {

        const aviso = document.createElement("p");
        aviso.className = "message-bubble";
        aviso.textContent = "Não encontrei jogos compatíveis no catálogo. Tente descrever suas preferências de outra maneira.";

        elemento.appendChild(aviso);
        return;
    }

    const lista = document.createElement("div");
    lista.className = "games-list";

    jogos.forEach(jogo => {

        const card = document.createElement("article");
        card.className = "game-card";

        const header = document.createElement("div");
        header.className = "game-card-header";

        const nome = document.createElement("h3");
        nome.textContent = jogo.nome;

        const compatibilidade = document.createElement("span");
        compatibilidade.className = "compatibility";
        compatibilidade.textContent = `${jogo.pontuacao}%`;

        header.appendChild(nome);
        header.appendChild(compatibilidade);

        const descricao = document.createElement("p");
        descricao.textContent = jogo.descricao;

        const correspondencias = document.createElement("small");
        correspondencias.textContent =
            "Combina com: " + jogo.correspondencias.join(", ");

        const barra = document.createElement("div");
        barra.className = "progress-bar";

        const preenchimento = document.createElement("div");
        preenchimento.className = "progress-fill";
        preenchimento.style.width = `${jogo.pontuacao}%`;

        barra.appendChild(preenchimento);

        card.appendChild(header);
        card.appendChild(descricao);
        card.appendChild(correspondencias);
        card.appendChild(barra);

        lista.appendChild(card);
    });

    elemento.appendChild(lista);
}


// Indicador de carregamento
function mostrarCarregamento() {

    const loading = document.createElement("div");
    loading.className = "loading";
    loading.textContent = "GameFinder está analisando suas preferências...";

    messages.appendChild(loading);

    loading.scrollIntoView({
        behavior: "smooth",
        block: "end"
    });

    return loading;
}


// Envia mensagem ao servidor Python
async function enviarMensagem(mensagem) {

    adicionarMensagem(mensagem, "user");

    welcome.style.display = "none";

    input.value = "";
    input.disabled = true;
    sendButton.disabled = true;

    const loading = mostrarCarregamento();

    try {

        const resposta = await fetch("/chat", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                mensagem: mensagem
            })

        });

        const dados = await resposta.json();

        loading.remove();

        if (!resposta.ok) {
            throw new Error(dados.erro || "Erro ao processar mensagem.");
        }

        const respostaChat = adicionarMensagem(
            "Encontrei algumas opções que combinam com o que você procura!",
            "assistant"
        );

        const conteudo = respostaChat.querySelector(".message-content");

        exibirPreferencias(dados.preferencias, conteudo);

        exibirJogos(dados.jogos, conteudo);

    } catch (erro) {

        loading.remove();

        adicionarMensagem(
            erro.message || "Ocorreu um erro. Tente novamente.",
            "assistant"
        );

    } finally {

        input.disabled = false;
        sendButton.disabled = false;
        input.focus();

    }
}


// Evento do formulário
form.addEventListener("submit", function(event) {

    event.preventDefault();

    const mensagem = input.value.trim();

    if (!mensagem) {
        return;
    }

    enviarMensagem(mensagem);
});


// Sugestões de mensagens iniciais
document.querySelectorAll(".suggestion").forEach(botao => {

    botao.addEventListener("click", function() {

        const mensagem = this.dataset.message;

        enviarMensagem(mensagem);

    });

});
