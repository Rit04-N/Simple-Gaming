const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let gameRunning = false, isPaused = false, score = 0, animationId;
const GROUND_Y = 220;

let player = { 
    x: 50, y: GROUND_Y, width: 40, height: 40, 
    dy: 0, jumpPower: -10, doubleJumpPower: -12, 
    gravity: 0.6, grounded: true, jumpCount: 0 
};

let obstacles = [], hearts = [], frame = 0;

function updateGame() {
    if (!gameRunning || isPaused) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Physics
    player.dy += player.gravity; 
    player.y += player.dy;

    if (player.y > GROUND_Y) { 
        player.y = GROUND_Y; 
        player.dy = 0; 
        player.grounded = true; 
        player.jumpCount = 0; 
    }
    
    // Spawn Objects
    if (frame % 90 === 0) {
        if (Math.random() < 0.3) {
            obstacles.push({ x: canvas.width, y: GROUND_Y + 10, width: 20, height: 30 });
        } else {
            hearts.push({ x: canvas.width, y: [GROUND_Y + 10, 140, 60][Math.floor(Math.random()*3)], width: 30, height: 30 });
        }
    }

    // Draw Player (Bunny)
    ctx.font = "40px Arial"; 
    ctx.fillText("🐰", player.x, player.y + 40);
    
    // Collision Logic
    function isColliding(p, r) {
        let padding = 10; 
        return (p.x + padding < r.x + r.width - padding &&
                p.x + p.width - padding > r.x + padding &&
                p.y + padding < r.y + r.height - padding &&
                p.y + p.height - padding > r.y + padding);
    }

    // Handle Obstacles (Cacti)
    ctx.font = "30px Arial";
    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        obs.x -= 5;
        ctx.fillText("🌵", obs.x, obs.y + 30);
        if (isColliding(player, obs)) gameOver();
        if (obs.x + obs.width < 0) obstacles.splice(i, 1);
    }

    // Handle Hearts
    for (let i = hearts.length - 1; i >= 0; i--) {
        let h = hearts[i];
        h.x -= 5; 
        ctx.fillText("💖", h.x, h.y + 30);
        if (isColliding(player, h)) {
            hearts.splice(i, 1); 
            score++; 
            document.getElementById("scoreDisplay").innerText = "Hearts: " + score;
        } else if (h.x + h.width < 0) {
            hearts.splice(i, 1); 
        }
    }

    frame++; 
    animationId = requestAnimationFrame(updateGame);
}

function jump() {
    if (!gameRunning || isPaused) return;
    if (player.grounded) { 
        player.dy = player.jumpPower; 
        player.grounded = false; 
        player.jumpCount = 1; 
    } else if (player.jumpCount === 1) { 
        player.dy = player.doubleJumpPower; 
        player.jumpCount = 2; 
    }
}

function startGame() {
    if (gameRunning && !isPaused) return;
    if (isPaused) { isPaused = false; updateGame(); return; }
    player.y = GROUND_Y; obstacles = []; hearts = []; score = 0; frame = 0;
    gameRunning = true; 
    document.getElementById("scoreDisplay").innerText = "Hearts: 0";
    updateGame();
}

function pauseGame() {
    isPaused = !isPaused;
    if (!isPaused) updateGame();
}

function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    alert("Game Over! You collected " + score + " hearts.");
}

// Controls
document.addEventListener("keydown", (e) => { if (e.code === "Space") jump(); });
canvas.addEventListener("touchstart", (e) => { e.preventDefault(); jump(); });
