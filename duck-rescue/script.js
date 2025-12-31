document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 400; canvas.height = 400;

    let mamaDuck = { x: 200, y: 200, baseSpeed: 3, boostSpeed: 7 };
    let ducklings = [], history = [], lostDuckling = { x: 100, y: 100 };
    let nest = { x: 340, y: 60, size: 40 };
    let score = 0, highScore = localStorage.getItem("duckRescueHighScore") || 0;
    let lives = 5, deadDucklings = 0, isPaused = true, gameActive = false;
    let boostStamina = 100, isBoosting = false;
    let pikeFish = { x: -50, y: 150, speed: 2.2 }, crocodile = { x: 500, y: 300, speed: -1.2 };
    let joystick = { active: false, baseX: 0, baseY: 0, stickX: 0, stickY: 0, radius: 40 };
    let lastTapTime = 0, keys = {};

    updateUI();

    // FIXED START FUNCTION (Attached to window)
    window.startGame = function() {
        score = 0; lives = 5; deadDucklings = 0; ducklings = []; history = [];
        mamaDuck.x = 200; mamaDuck.y = 200; crocodile.x = 500;
        gameActive = true; isPaused = false;
        document.getElementById("statusOverlay").style.display = "none";
        document.getElementById("finalDeathText").style.display = "none";
        spawnBaby(); updateUI(); loop();
    };

    window.togglePause = function() {
        if (!gameActive) return;
        isPaused = !isPaused;
        const overlay = document.getElementById("statusOverlay");
        overlay.style.display = isPaused ? "flex" : "none";
        if (isPaused) {
            document.getElementById("statusTitle").innerText = "PAUSED";
            const btn = document.querySelector(".start-btn");
            btn.innerText = "RESUME";
            btn.onclick = window.togglePause;
        } else { loop(); }
    };

    function spawnBaby() {
        lostDuckling.x = 40 + Math.random() * 320;
        lostDuckling.y = 40 + Math.random() * 320;
    }

    function loseLife() {
        lives--; updateUI();
        if (lives <= 0) gameOver();
        else { mamaDuck.x = 200; mamaDuck.y = 200; crocodile.x = 500; keys = {}; joystick.active = false; }
    }

    function gameOver() {
        gameActive = false; isPaused = true;
        if (score > highScore) { highScore = score; localStorage.setItem("duckRescueHighScore", highScore); }
        const overlay = document.getElementById("statusOverlay");
        overlay.style.display = "flex";
        document.getElementById("statusTitle").innerText = "GAME OVER";
        document.getElementById("highScoreText").innerText = "High Score: " + highScore;
        const dText = document.getElementById("finalDeathText");
        dText.innerText = "Ducklings Lost: " + deadDucklings; dText.style.display = "block";
        const btn = document.querySelector(".start-btn");
        btn.innerText = "TRY AGAIN"; btn.onclick = window.startGame;
    }

    function updateUI() {
        document.getElementById("scoreDisplay").innerText = score;
        document.getElementById("highScoreDisplay").innerText = highScore;
        document.getElementById("deathDisplay").innerText = deadDucklings;
        let hearts = ""; for(let i=0; i<lives; i++) hearts += "❤";
        document.getElementById("livesDisplay").innerText = hearts;
    }

    function update() {
        if (isPaused || !gameActive) return;
        let speed = (isBoosting && boostStamina > 0) ? mamaDuck.boostSpeed : mamaDuck.baseSpeed;
        if (isBoosting) boostStamina -= 1.5; else if (boostStamina < 100) boostStamina += 0.5;
        document.getElementById("boostBar").style.width = boostStamina + "%";

        if (keys["ArrowUp"] || keys["KeyW"]) mamaDuck.y -= speed;
        if (keys["ArrowDown"] || keys["KeyS"]) mamaDuck.y += speed;
        if (keys["ArrowLeft"] || keys["KeyA"]) mamaDuck.x -= speed;
        if (keys["ArrowRight"] || keys["KeyD"]) mamaDuck.x += speed;

        mamaDuck.x = Math.max(20, Math.min(380, mamaDuck.x));
        mamaDuck.y = Math.max(20, Math.min(380, mamaDuck.y));
        history.unshift({x: mamaDuck.x, y: mamaDuck.y}); if (history.length > 200) history.pop();

        pikeFish.x += pikeFish.speed; if (pikeFish.x > 450) { pikeFish.x = -50; pikeFish.y = 50 + Math.random() * 300; }
        crocodile.x += crocodile.speed; if (crocodile.x < -100) { crocodile.x = 500; crocodile.y = 50 + Math.random() * 300; }

        if (Math.hypot(mamaDuck.x - crocodile.x, mamaDuck.y - crocodile.y) < 30) { loseLife(); return; }

        ducklings.forEach((d, i) => {
            let idx = (i + 1) * 15;
            if (history[idx]) {
                if (Math.hypot(history[idx].x - crocodile.x, history[idx].y - crocodile.y) < 25) {
                    deadDucklings += (ducklings.length - i); updateUI();
                    ducklings = ducklings.slice(0, i);
                } else if (Math.hypot(history[idx].x - pikeFish.x, history[idx].y - pikeFish.y) < 20) {
                    ducklings = ducklings.slice(0, i);
                }
            }
        });

        if (Math.hypot(mamaDuck.x - lostDuckling.x, mamaDuck.y - lostDuckling.y) < 30) { ducklings.push({}); spawnBaby(); }
        if (Math.hypot(mamaDuck.x - nest.x, mamaDuck.y - nest.y) < nest.size && ducklings.length > 0) { score += ducklings.length; ducklings = []; updateUI(); }
    }

    function draw() {
        ctx.clearRect(0, 0, 400, 400); ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.font = "45px serif"; ctx.fillText("🪺", nest.x, nest.y);
        ctx.font = "30px serif"; ctx.fillText("🐟", pikeFish.x, pikeFish.y);
        ctx.font = "45px serif"; ctx.fillText("🐊", crocodile.x, crocodile.y);
        ctx.save(); ctx.translate(mamaDuck.x, mamaDuck.y);
        if (keys["ArrowLeft"] || keys["KeyA"]) ctx.scale(-1, 1);
        if (isBoosting) { ctx.shadowBlur = 15; ctx.shadowColor = "white"; }
        ctx.font = "40px serif"; ctx.fillText("🦢", 0, 0); ctx.restore();
        ducklings.forEach((d, i) => {
            let idx = (i + 1) * 15;
            if (history[idx]) {
                let bob = Math.sin(Date.now() * 0.01 + i) * 3;
                ctx.font = "20px serif"; ctx.fillText("🐥", history[idx].x, history[idx].y + bob);
            }
        });
        ctx.font = "24px serif"; ctx.fillText("🐣", lostDuckling.x, lostDuckling.y);
    }

    function loop() { if (!isPaused && gameActive) { update(); draw(); } requestAnimationFrame(loop); }
});
