const canvas = document.getElementById("gameCanvas");
const inputField = document.getElementById("hiddenInput");
const ctx = canvas.getContext("2d");

// Mise à jour taille au chargement
canvas.width = window.innerWidth;
canvas.height = window.innerHeight - 20;

var screen = "menu";
let menuIndex = 0;
let paramIndex = 0;
let inputBuffer = "";
let settings = {
    sticks: 27,
    maxPick: 3,
    mode: 0, // 0: player1-vs-bot, 1: bot-vs-player1, 2: player1-vs-player2
    loseColor: "blue"
};
const colors = ["red", "green", "blue", "orange", "yellow"];
const softColors = {
    red: "rgb(200,80,80)",
    green: "rgb(100,180,100)",
    blue: "rgb(0,100,200)",
    orange: "rgb(240,170,90)",
    yellow: "rgb(230,220,130)"
};
const grays = ["#ddd", "#bbb", "#999", "#bbb"]; // cycle doux et répétitif

let game = null;

CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    this.beginPath();
    this.moveTo(x + r, y);
    this.lineTo(x + w - r, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r);
    this.lineTo(x + w, y + h - r);
    this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.lineTo(x + r, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r);
    this.lineTo(x, y + r);
    this.quadraticCurveTo(x, y, x + r, y);
    this.closePath();
    this.fill();
};

function activateInput() {
    inputField.focus();
    inputField.value = "";
    inputField.oninput = () => {
        const val = inputField.value.replace(/\D/g, ""); // chiffres uniquement
        inputBuffer = val;
        draw();
    };
}

function drawRoundedRect(x, y, w, h, r) {
    ctx.roundRect(x, y, w, h, r);
}

function draw() {
    ctx.fillStyle = "#fafafa"; // fond uni clair
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = "24px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (screen === "menu") drawMenu();
    else if (screen === "params") drawParams();
    else if (screen === "game") drawGame();
    else if (screen === "end") drawEnd();
}

function drawMenu() {
    const centerX = canvas.width / 2;
    const titleY = canvas.height * 0.2;
    const optionStartY = canvas.height * 0.4;
    const optionSpacing = 60;
    const buttonWidth = canvas.width * 0.3;
    const buttonHeight = 40;

    const options = ["1. Jouer", "2. Paramètres"];
    ctx.fillStyle = "#2196f3";
    ctx.font = "bold 40px 'Segoe UI'";
    ctx.fillText("🎮 Jeu des Bâtonnets", centerX, titleY);

    ctx.font = "24px 'Segoe UI'";
    options.forEach((opt, i) => {
        const y = optionStartY + i * optionSpacing;
        ctx.fillStyle = i === menuIndex ? "#1976d2" : "#90caf9";
        drawRoundedRect(centerX - buttonWidth / 2, y - 20, buttonWidth, buttonHeight, 10);
        ctx.fillStyle = i === menuIndex ? "#fff" : "#000";
        ctx.fillText(opt, centerX, y);
    });
}

function drawParams() {
    const centerX = canvas.width / 2;
    const titleY = canvas.height * 0.15;
    const startY = canvas.height * 0.25;
    const spacingY = 50;
    const buttonWidth = canvas.width * 0.6;
    const buttonHeight = 40;

    const options = [
        `4. Nombre de bâtonnets : ${settings.sticks}`,
        `5. Max par tour : ${settings.maxPick}`,
        `6. Mode : ${["Joueur1 vs Bot", "Bot vs Joueur1", "Joueur1 vs Joueur2"][settings.mode]}`,
        `7. Couleur perdant : ${settings.loseColor}`,
        "Entrée : Retour au menu"
    ];

    ctx.font = "28px 'Segoe UI'";
    ctx.fillStyle = "#43a047";
    ctx.fillText("⚙️ Paramètres", centerX, titleY);

    ctx.font = "20px 'Segoe UI'";
    options.forEach((opt, i) => {
        const y = startY + i * spacingY;
        ctx.fillStyle = i === paramIndex ? "#2e7d32" : "#a5d6a7";
        drawRoundedRect(centerX - buttonWidth / 2, y - 20, buttonWidth, buttonHeight, 10);
        ctx.fillStyle = "#000";
        ctx.fillText(opt, centerX, y);
    });

    if (paramIndex <= 1 && inputBuffer) {
        ctx.fillStyle = "#000";
        ctx.fillText(`Saisie : ${inputBuffer}`, centerX, startY + options.length * spacingY);
    }
}

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const centerX = canvas.width / 2;

    ctx.fillStyle = "#212121";
    ctx.font = "22px 'Segoe UI'";
    ctx.textAlign = "center";
    ctx.fillText(`Bâtonnets restants : ${game.n}`, centerX, canvas.height * 0.07);

    const marginX = 50;
    const maxPerRow = Math.floor((canvas.width - marginX * 2) / 35);
    const spacingX = (canvas.width - marginX * 2) / maxPerRow;
    const spacingY = 70;
    const startY = canvas.height * 0.1;

    const m = settings.maxPick;
    const losingColor = softColors[settings.loseColor] || "#f88";

    for (let i = 0; i < settings.sticks; i++) {
        const col = i % maxPerRow;
        const row = Math.floor(i / maxPerRow);
        const x = marginX + col * spacingX;
        const y = startY + row * spacingY;

        const isTaken = i >= game.n;

        let color;
        if (isTaken) {
            color = "#eee"; // gris clair
        } else if ((i + 1) % (m + 1) === 1) {
            color = losingColor;
        } else {
            const grayIndex = i % grays.length;
            color = grays[grayIndex];
        }

        ctx.fillStyle = color;
        drawRoundedRect(x, y, 6, 40, 3);
    }

    ctx.fillStyle = "#000";
    ctx.font = "22px 'Segoe UI'";
    const promptY = canvas.height * 0.8;

    if (game.awaitingInput) {
        ctx.fillText("Combien en prendre ? " + inputBuffer, centerX, promptY);
    } else if (game.botTurn) {
        ctx.fillText("🤖 Bot réfléchit...", centerX, promptY);
    }
}

function drawEnd() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.font = "bold 36px 'Segoe UI'";
    ctx.fillStyle = settings.loseColor;
    ctx.fillText(`${game.loser} a Gagné ! 😀`, centerX, centerY - 20);

    ctx.font = "22px 'Segoe UI'";
    ctx.fillStyle = "#333";
    ctx.fillText("Appuyez sur Entrée pour retourner au menu.", centerX, centerY + 30);
}

function startGame() {
    game = {
        n: parseInt(settings.sticks),
        turn: settings.mode === 1 ? 1 : 0,
        awaitingInput: true,
        botTurn: false,
        loser: null
    };
    screen = "game";
    draw();
    if (isBotTurn()) botPlay();
}

function isBotTurn() {
    return (settings.mode === 0 && game.turn % 2 === 1) || (settings.mode === 1 && game.turn % 2 === 0);
}

function botPlay() {
    game.awaitingInput = false;
    game.botTurn = true;
    draw();
    setTimeout(() => {
        let pick;
        const m = parseInt(settings.maxPick);
        if (game.n === 1) pick = 1;
        else if (game.n % (m + 1) === 1) pick = Math.floor(Math.random() * m) + 1;
        else pick = (game.n - 1) % (m + 1) || 1;
        applyMove(pick);
    }, 1000);
}

function applyMove(pick) {
    pick = parseInt(pick);
    if (isNaN(pick) || pick < 1 || pick > Math.min(settings.maxPick, game.n)) return;

    game.n -= pick;
    if (game.n <= 0) {
        game.over = true;
        const currentTurn = game.turn;
        game.loser = currentTurn % 2 === 0 ? (settings.mode === "player1-vs-player2" ? "Joueur 1" : "Bot") : "Joueur 2";
        screen = "end";
    } else {
        game.turn++;
        game.awaitingInput = true;
        if (isBotTurn()) botPlay();
    }
    inputBuffer = "";
    inputField.value = "";

    game.botTurn = false;
    draw();
}

document.addEventListener("keydown", (e) => {
    if (screen === "menu") {
        if (e.key === "ArrowUp") menuIndex = (menuIndex + 1) % 2;
        if (e.key === "ArrowDown") menuIndex = (menuIndex + 1) % 2;
        if (e.key === "Enter") {
            if (menuIndex === 0) startGame();
            else if (menuIndex === 1) screen = "params";
        }
    } else if (screen === "params") {
        if (e.key === "ArrowUp") paramIndex = (paramIndex + 4) % 5;
        if (e.key === "ArrowDown") paramIndex = (paramIndex + 1) % 5;
        if (e.key >= "0" && e.key <= "9" && paramIndex <= 1) inputBuffer += e.key;
        if (e.key === "Backspace") inputBuffer = inputBuffer.slice(0, -1);
        if (e.key === "Enter") {
            if (paramIndex === 0 && inputBuffer) settings.sticks = parseInt(inputBuffer);
            if (paramIndex === 1 && inputBuffer) settings.maxPick = parseInt(inputBuffer);
            if (paramIndex === 2) settings.mode = (settings.mode + 1) % 3;
            if (paramIndex === 3) {
                const current = colors.indexOf(settings.loseColor);
                settings.loseColor = colors[(current + 1) % colors.length];
            }
            if (paramIndex === 4) screen = "menu";
            inputBuffer = "";
        }
    } else if (screen === "game" && game.awaitingInput) {
        if (e.key >= "0" && e.key <= "9") inputBuffer += e.key;
        if (e.key === "Backspace") inputBuffer = inputBuffer.slice(0, -1);
        if (e.key === "Enter" && inputBuffer) applyMove(parseInt(inputBuffer));
    } else if (screen === "end" && e.key === "Enter") {
        screen = "menu";
    }
    draw();
});

canvas.addEventListener("click", (e) => {
    const x = e.clientX;
    const y = e.clientY;

    const centerX = canvas.width / 2;

    if (screen === "menu") {
        const optionStartY = canvas.height * 0.4;
        const optionSpacing = 60;
        const buttonWidth = canvas.width * 0.3;
        const buttonHeight = 40;

        for (let i = 0; i < 2; i++) {
            const btnY = optionStartY + i * optionSpacing - 20;
            const btnX = centerX - buttonWidth / 2;
            if (x >= btnX && x <= btnX + buttonWidth && y >= btnY && y <= btnY + buttonHeight) {
                menuIndex = i;
                if (i === 0) startGame();
                else if (i === 1) screen = "params";
                draw();
            }
        }
    } else if (screen === "params") {
        const startY = canvas.height * 0.25;
        const spacingY = 50;
        const buttonWidth = canvas.width * 0.6;
        const buttonHeight = 40;

        for (let i = 0; i < 5; i++) {
            const btnY = startY + i * spacingY - 20;
            const btnX = centerX - buttonWidth / 2;
            if (x >= btnX && x <= btnX + buttonWidth && y >= btnY && y <= btnY + buttonHeight) {
                paramIndex = i;
                inputBuffer = "";

                if (i === 0 || i === 1) {
                    activateInput();
                } else if (i === 2) {
                    settings.mode = (settings.mode + 1) % 3;
                } else if (i === 3) {
                    const idx = colors.indexOf(settings.loseColor);
                    settings.loseColor = colors[(idx + 1) % colors.length];
                } else if (i === 4) {
                    screen = "menu";
                }
                draw();
            }
        }
    } else if (screen === "game" && game.awaitingInput) {
        activateInput(); // pour clavier mobile
    } else if (screen === "end") {
        screen = "menu";
        draw();
    }
});

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 20;
    draw(); // Redessine l'écran actif
});

draw();
