// title.js
console.log("title.js: Script begin loading");

const titleImage = new Image();
titleImage.src = 'title.png';
const title1Image = new Image();
title1Image.src = 'title1.png';

let currentScreen = 'title';
let keyPressed = false;

console.log("title.js: Images defined");

function handleTitleKey(event) {
    if (!keyPressed) {
        keyPressed = true;
        if (currentScreen === 'title') {
            currentScreen = 'title1';
            console.log("title.js: Transition to title1");
        } else if (currentScreen === 'title1') {
            currentScreen = 'game';
            window.gameStarted = true; // Set global flag
            window.startGame();
            document.removeEventListener('keydown', handleTitleKey);
            console.log("title.js: Game started");
        }
    }
}

document.addEventListener('keydown', handleTitleKey);
document.addEventListener('keyup', () => { keyPressed = false; });

function renderTitle(ctx, canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (currentScreen === 'title' && titleImage.complete) {
        ctx.drawImage(titleImage, 0, 0, canvas.width, canvas.height);
    } else if (currentScreen === 'title1' && title1Image.complete) {
        ctx.drawImage(title1Image, 0, 0, canvas.width, canvas.height);
    }
}

console.log("title.js: Functions defined");

window.renderTitle = renderTitle;
window.isTitleScreen = () => currentScreen !== 'game';

console.log("title.js loaded");