const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- 1. GAME STATE VARIABLES ---
let gameRunning = false;
let isPaused = false;
let score = 0;
let highScore = localStorage.getItem("bunnyHighScore") || 0;
let animationId;
let frame = 0;

const GROUND_Y = 220;

// --- 2. AUDIO ENGINE ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function initAudio() {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playSound(type) {
    if (!audioCtx || audioCtx.state === 'suspended') return;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'jump') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.03, audioCtx.currentTime); 
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08); 
    } 
    else if (type === 'collect') {
        // --- UPDATED SOUND: Crunchy Carrot Crunch ---
        osc.type = 'triangle'; 
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    }
    else if (type === 'gameover') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(50, audioCtx.currentTime + 0.5);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
    }
}

// --- 3. PLAYER SETTINGS ---
let player = { x: 50, y: GROUND_Y, width: 40, height: 40, dy: 0, jumpPower: -10, doubleJumpPower: -12, gravity: 0.6, grounded: true, jumpCount: 0 };
let obstacles = [];
let carrots = []; // Renamed for clarity

// --- 4. MAIN GAME LOOP ---
function updateGame() {
    if (!gameRunning || isPaused) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    player.dy += player.gravity; 
    player.y += player.dy;

    if (player.y > GROUND_Y) { 
        player.y = GROUND_Y; player.dy = 0; player.grounded = true; player.jumpCount = 0; 
    }
    
    if (frame % 90 === 0) {
        if (Math.random() < 0.3) {
            obstacles.push({ x: canvas.width, y: GROUND_Y + 10, width: 20, height: 30 });
        } else {
            carrots.push({ x: canvas.width, y: [GROUND_Y + 10, 140, 60][Math.floor(Math.random()*3)], width: 30, height: 30 });
        }
    }

    ctx.font = "40px Arial"; 
    ctx.fillText("🐰", player.x, player.y + 40);
    
    ctx.font = "30px Arial";
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= 5;
        ctx.fillText("🌵", obstacles[i].x, obstacles[i].y + 30);
        if (checkCollision(player, obstacles[i])) gameOver();
        if (obstacles[i] && obstacles[i].x < -50) obstacles.splice(i, 1);
    }

    for (let i = carrots.length - 1; i >= 0; i--) {
        carrots[i].x -= 5; 
        ctx.fillText("🥕", carrots[i].x, carrots[i].y + 30); // --- UPDATED EMOJI ---
        if (checkCollision(player, carrots[i])) {
            carrots.splice(i, 1); 
            score++; 
            playSound('collect');
            document.getElementById("scoreDisplay").innerText = "Carrots: " + score;
        }
        if (carrots[i] && carrots[i].x < -50) carrots.splice(i, 1);
    }

    frame++; 
    animationId = requestAnimationFrame(updateGame);
}

function checkCollision(p, obj) {
    return (p.x < obj.x + obj.width && p.x + p.width > obj.x && p.y < obj.y + obj.height && p.y + p.height > obj.y);
}

function jump() {
    if (!gameRunning || isPaused) return;
    if (player.grounded) { 
        player.dy = player.jumpPower; player.grounded = false; player.jumpCount = 1; playSound('jump');
    } else if (player.jumpCount === 1) { 
        player.dy = player.doubleJumpPower; player.jumpCount = 2; playSound('jump');
    }
}

function startGame() {
    initAudio();
    if (gameRunning && !isPaused) return;
    document.getElementById("gameOverOverlay").style.display = "none";
    player.y = GROUND_Y; obstacles = []; carrots = []; score = 0; frame = 0; gameRunning = true;
    document.getElementById("scoreDisplay").innerText = "Carrots: 0";
    updateGame();
}

function hideOverlayAndStart() { startGame(); }

function pauseGame() {
    isPaused = !isPaused;
    if (isPaused) {
        ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(0,0,canvas.width, canvas.height);
        ctx.fillStyle = "white"; ctx.fillText("PAUSED", canvas.width/2 - 50, canvas.height/2);
    } else { updateGame(); }
}

function gameOver() {
    playSound('gameover');
    gameRunning = false;
    cancelAnimationFrame(animationId);
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("bunnyHighScore", highScore);
    }
    const overlay = document.getElementById("gameOverOverlay");
    document.getElementById("finalScoreText").innerText = "Carrots Eaten: " + score;
    document.getElementById("highScoreText").innerText = "Your High Score: " + highScore;
    overlay.style.display = "flex";
}

document.addEventListener("keydown", (e) => { if (e.code === "Space") { e.preventDefault(); jump(); } });
canvas.addEventListener("touchstart", (e) => { e.preventDefault(); jump(); });
