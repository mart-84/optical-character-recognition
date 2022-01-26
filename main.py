import os
from flask import Flask, render_template
from flask_socketio import SocketIO, emit
import math, datetime, logging
import pymongo


def create_app(name):
    app = Flask(name)
    app.debug = True
    log = logging.getLogger('werkzeug')
    log.setLevel(logging.ERROR)
    app.config["SECRET_KEY"] = "12345"
    socketio.init_app(app)
    print(f"[{datetime.datetime. now()}] : Démarrage de l'application web...")
    return app


def get_database():
    db_token = os.environ['TOKEN_DB']
    client = pymongo.MongoClient(
        f"mongodb+srv://ocr_server:{db_token}@ocr-data.vgvmc.mongodb.net/OCR_data?retryWrites=true&w=majority"
    )
    db = client.OCR_data
    collection = db["OCR_data"]
    return collection


socketio = SocketIO(debug=False)
app = create_app("OCR")
db = get_database()


@app.route("/")
def home():
    return render_template("home.html")


@socketio.on("reconnaissance")
def reconnaitreChar(data):
    #print(data)
    vect = data["vector"]
    caractere = ""

    correct_char = db.find_one({"vect": vect})
    if correct_char:
        caractere = correct_char["char"]
    else:
        memorized_data = [e for e in db.find({})]
        minimum = distanceEuclidienne(vect, memorized_data[0]["vect"])
        caractere = memorized_data[0]["char"]

        for i in range(1, len(memorized_data)):
            j = distanceEuclidienne(vect, memorized_data[i]["vect"])
            if j < minimum:
                minimum = j
                caractere = memorized_data[i]["char"]

    print("-------------------------")
    print("L'algorithme reconnait le caractère : " + caractere)
    emit("caractere", caractere)


def distanceEuclidienne(vectA, vectB):
    distance = 0
    for i in range(len(vectA)):
        distance += (vectA[i] - vectB[i])**2
    distance = math.sqrt(distance)
    return distance


@socketio.on("confirmation")
def confirmationResultat(data):
    
    print("Le caractère reconnut est le bon")
    if not db.find_one({"vect": data["vect"]}):
        db.insert_one(data)
        print("Il est ajouté à la db")


@socketio.on("infirmation")
def infirmationResultat(data):
    print("Le caractère reconnut n'est pas le bon, c'est en réalité : " + data["char"])
    existant = db.find_one({"vect": data["vect"]})
    if existant:
        print("Le caractère " + existant["char"] + " est déjà défini avec le même vecteur dans la db")
        emit("existant", existant["char"])
    else:
        db.insert_one(data)
        print("Il est ajouté dans la db")
        emit("non-existant")


if __name__ == "__main__":
    socketio.run(app, host='0.0.0.0')
