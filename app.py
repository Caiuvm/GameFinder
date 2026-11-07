
from flask import Flask, render_template, request, jsonify

from main import identificar_preferencias, recomendar_jogos

app = Flask(__name__)


@app.route("/")
def inicio():
    return render_template("index.html")


@app.route("/chat", methods=["POST"])
def chat():
    dados = request.get_json(silent=True) or {}

    mensagem = dados.get("mensagem", "").strip()

    if not mensagem:
        return jsonify({
            "erro": "Digite uma mensagem antes de enviar."
        }), 400

    try:
        preferencias = identificar_preferencias(mensagem)
        jogos = recomendar_jogos(preferencias)

        return jsonify({
            "preferencias": preferencias.model_dump(),
            "jogos": jogos
        })

    except Exception as erro:
        print(f"Erro no processamento: {erro}")

        return jsonify({
            "erro": "Não consegui consultar a inteligência artificial agora. Tente novamente em alguns instantes."
        }), 503


if __name__ == "__main__":
    app.run(debug=True)
