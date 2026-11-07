
import os
import json
import unicodedata

from pathlib import Path
from dotenv import load_dotenv
from google import genai
from pydantic import BaseModel


# ==========================================
# CONFIGURAÇÃO INICIAL
# ==========================================

BASE_DIR = Path(__file__).resolve().parent

load_dotenv(BASE_DIR / ".env")

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError(
        "Chave GEMINI_API_KEY não encontrada no arquivo .env"
    )

client = genai.Client(api_key=api_key)


# ==========================================
# ESTRUTURA DAS PREFERÊNCIAS
# ==========================================

class Preferencias(BaseModel):
    generos: list[str]
    caracteristicas: list[str]


# ==========================================
# IDENTIFICAÇÃO DE PREFERÊNCIAS COM GEMINI
# ==========================================

def identificar_preferencias(mensagem):

    prompt = f"""
    Você é um assistente especializado em identificar
    preferências de jogos de videogame.

    Analise a mensagem do usuário e identifique:

    1. Os gêneros de jogos mencionados.
    2. As características de jogos mencionadas.

    Utilize somente os seguintes termos:

    Gêneros:
    - sobrevivência
    - aventura
    - exploração
    - RPG

    Características:
    - mundo aberto
    - exploração espacial
    - coleta de recursos
    - construção
    - multiplayer
    - exploração submarina
    - história
    - combate

    Regras:
    - Utilize os termos exatamente como estão escritos.
    - Não invente preferências.
    - Não inclua características que o usuário não mencionou.
    - Se nenhuma preferência for identificada, retorne listas vazias.

    Mensagem do usuário:
    {mensagem}
    """

    resposta = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents=prompt,
        config={
            "response_mime_type": "application/json",
            "response_json_schema": Preferencias.model_json_schema()
        }
    )

    return Preferencias.model_validate_json(resposta.text)


# ==========================================
# NORMALIZAÇÃO DE TEXTO
# ==========================================

def normalizar(texto):

    texto = texto.lower().strip()

    texto = unicodedata.normalize("NFD", texto)

    texto = "".join(
        caractere
        for caractere in texto
        if unicodedata.category(caractere) != "Mn"
    )

    return texto


# ==========================================
# RECOMENDAÇÃO DE JOGOS
# ==========================================

def recomendar_jogos(preferencias):

    caminho_catalogo = BASE_DIR / "games.json"

    with open(caminho_catalogo, "r", encoding="utf-8") as arquivo:
        jogos = json.load(arquivo)

    preferencias_usuario = (
        preferencias.generos +
        preferencias.caracteristicas
    )

    resultados = []

    for jogo in jogos:

        generos = jogo["generos"]
        caracteristicas = jogo["caracteristicas"]

        termos_jogo = generos + caracteristicas

        correspondencias = []

        for preferencia in preferencias_usuario:

            for termo in termos_jogo:

                if normalizar(preferencia) == normalizar(termo):

                    correspondencias.append(preferencia)
                    break

        if preferencias_usuario:

            pontuacao = (
                len(correspondencias) /
                len(preferencias_usuario)
            ) * 100

        else:
            pontuacao = 0

        if correspondencias:

            resultados.append({
                "nome": jogo["nome"],
                "descricao": jogo["descricao"],
                "correspondencias": correspondencias,
                "pontuacao": round(pontuacao)
            })

    # Ordena os jogos do maior para o menor percentual
    resultados.sort(
        key=lambda jogo: jogo["pontuacao"],
        reverse=True
    )

    return resultados


# ==========================================
# EXECUÇÃO DO PROGRAMA
# ==========================================

if __name__ == "__main__":

    mensagem = input(
        "Olá! Que tipo de jogo você procura? "
    )

    try:

        # Identifica as preferências do usuário
        preferencias = identificar_preferencias(mensagem)

        print("\nPreferências identificadas:")
        print(preferencias.model_dump_json(indent=4))

        # Busca os jogos compatíveis
        jogos_recomendados = recomendar_jogos(preferencias)

        print("\n========== JOGOS RECOMENDADOS ==========")

        if not jogos_recomendados:

            print("Nenhum jogo compatível foi encontrado.")

        else:

            for jogo in jogos_recomendados:

                print(f"\nJogo: {jogo['nome']}")

                print(
                    f"Compatibilidade: {jogo['pontuacao']}%"
                )

                print(
                    f"Descrição: {jogo['descricao']}"
                )

                print(
                    "Preferências encontradas: "
                    + ", ".join(jogo["correspondencias"])
                )

        print("\n========================================")

    except Exception as erro:

        print(f"\nErro ao executar o GameFinder: {erro}")
