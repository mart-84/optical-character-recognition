const gridH = 11
const gridW = 15;
var vect = [];
var memorized = [];
const socket = io();
var resultat = "";


socket.on("existant", function(caractere) {
    window.alert("Ce caractere est déjà enregistré en tant que : " + caractere);
    resetPage();
});

socket.on("non-existant", function() {
    resetPage();
});

socket.on("caractere", function(caractere) {
    //console.log(caractere);
    resultat = caractere;
    noLoop();
    const reconnaitreBouton = document.getElementById("reconnaitre");
    reconnaitreBouton.onclick = null;
    const resultDiv = document.getElementById("result");
    const resultDisplay = document.getElementById("result-display");
    resultDisplay.innerHTML = "Le caractere est : <span class=\"strong\">" + caractere + "</strong>";
    resultDiv.style.display = "inline-block";
});

function resetPage() {
    const resultDiv = document.getElementById("result");
    resultDiv.style.display = "none";
    const inputLettre = document.getElementById("input-lettre-div");
    inputLettre.style.display = "none";
    const champLettre = document.getElementById("input-lettre");
    champLettre.value = "";
    const reconnaitreBouton = document.getElementById("reconnaitre");
    reconnaitreBouton.onclick = recogChar;
    reset();
    loop();
}

function afficherChamp() {
    const inputLettre = document.getElementById("input-lettre-div");
    inputLettre.style.display = "block";
}

function infirmeResultat() {
    const inputLettre = document.getElementById("input-lettre");
    const content = inputLettre.value;
    if (content.length === 0) {
        window.alert("ERREUR : Mettre au moins une lettre");
    } else {
        const lettre = content.charAt(0);
        socket.emit("infirmation", {char: lettre, vect: vect});
    }
}

function confirmeResultat() {
    socket.emit("confirmation", {char: resultat, vect: vect});
    resetPage();
}

function setup() {
    var cnv = createCanvas(550, 750);
    cnv.parent('canvas');

    vect = [];
    for (let i = 0; i < gridH * gridW; i++) {
        vect.push(0);
    }
    const resetB = document.getElementById("recommencer");
    resetB.onclick = reset;
    const recognizeB = document.getElementById("reconnaitre");
    recognizeB.onclick = recogChar;
}

function draw() {
    background(255);
    for (let i = 0; i <= gridH; i++) {
        line(i * width / gridH, 0, i * width / gridH, height);
    }
    for (let i = 0; i <= gridW; i++) {
        line(0, i * height / gridW, width, i * height / gridW);
    }

    if (mouseIsPressed && mouseButton === LEFT) {
        changePx();
    }

    updatePx();
    render();
}

function changePx() {
    let x = mouseX;
    let y = mouseY;
    if (x <= width && y <= height && x >= 0 && y >= 0) {
        let pxX = int(x / (width / gridH));
        let pxY = int(y / (height / gridW));
        let index = pxX + gridH * pxY;
        if (keyIsPressed === true && keyCode === SHIFT) {
            vect[index] = 0;
        } else {
            vect[index] = 9;
        }
    }
}

function updatePx() {
    for(let i = 0; i < gridH; i++) {
        for(let j = 0; j < gridW; j++) {
            let index = i + gridH * j;
            if (vect[index] != 9) {
                vect[index] = countPxAround(i, j);
            }
        }
    }
}

function countPxAround(x, y) {
    let count = 0;
    for(let i = -1; i < 2; i++) {
        for(let j = -1; j < 2; j++) {
            let index = (x+i) + gridH * (y+j);
            if(vect[index] == 9 && (x+i) >= 0 && (x+i) < gridH) {
            count++;
            }
        }
    }
    return count;
}

function render() {
    for (let i = 0; i < vect.length; i++) {
        if (vect[i] != 0) {
            let x = i % gridH;
            let y = int(i / gridH);
            fill(255 - vect[i] * 28.333333333);
            stroke(0);
            rect(x * width / gridH, y * height / gridW, width / gridH, height / gridW);
        }
    }
}

function keyPressed() {
    if (key == 'r') {
        reset();
    } else if (key == ' ') {
        recogChar();
    }
}

function reset() {
    vect = [];
    for (let i = 0; i < gridH * gridW; i++) {
        vect.push(0);
    }
}

function recogChar() {
    socket.emit("reconnaissance", {vector: vect});
}