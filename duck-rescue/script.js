document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 400;
    canvas.height = 400;

    let mamaDuck = { x: 200, y: 200, baseSpeed: 3, boostSpeed: 7 };
    let ducklings = [];
    let lostDuckling = { x: 100, y: 100 };
    let history = []; 
    let nest = { x: 340, y: 60, size: 40 };
    let score = 0;
    let highScore = localStorage.getItem("duckRescueHighScore") || 0;
    let isPaused = true; 
    let boostStamina = 100;
    let isBoosting = false;

    let pikeFish = { x: -50, y: 150, speed: 2.2 };
    let crocodile = { x: 500, y: 300, speed: -1.0 };

    // Joystick & Input State
    let joystick = { active: false, baseX: 0, baseY: 0, stickX: 0, stickY: 0, radius: 40 };
    let lastTapTime = 0;
    let keys = {};

    document.getElementById("highScoreDisplay").innerText = highScore;

    // PC Controls
    window.addEventListener("keydown", (e) => { 
        keys[e.code] = true; 
        if(e.code === "Space") isBoosting = true;
    });
    window.addEventListener("keyup", (e) => { 
        keys[e.code] = false; 
        if(e.code === "Space") isBoosting = false;
    });

    // Mobile Joystick & Double Tap Logic
    canvas.addEventListener("touchstart", (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const tx = (touch.clientX - rect.left) * (canvas.width / rect.width);
        const ty = (touch.clientY - rect.top) * (canvas.height / rect.height);

        const currentTime = Date.now();
        if (currentTime - lastTapTime < 300) { isBoosting = true; }
        lastTapTime = currentTime;

        joystick.active = true;
        joystick.baseX = tx; joystick.baseY = ty;
        joystick.stickX = tx; joystick.stickY = ty;
    }, {passive: false});

    canvas.addEventListener("touchmove", (e) => {
        e.preventDefault();
        if (!joystick.active) return;
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const tx = (touch.clientX - rect.left) * (canvas.width / rect.width);
        const ty = (touch.clientY - rect.top) * (canvas.height / rect.height);

        const dist = Math.hypot(tx - joystick.baseX, ty - joystick.baseY);
        const angle = Math.atan2(ty - joystick.baseY, tx - joystick.baseX);
        const moveDist = Math.min(dist, joystick.radius);

        joystick.stickX = joystick.baseX + Math.cos(angle) * moveDist;
        joystick.stickY = joystick.baseY + Math.sin(angle) * moveDist;

        const threshold = 10;
        keys["ArrowLeft"] = (tx < joystick.baseX - threshold);
        keys["ArrowRight"] = (tx > joystick.baseX + threshold);
        keys["ArrowUp"] = (ty < joystick.baseY - threshold);
        keys["ArrowDown"] = (ty > joystick.baseY + threshold);
    }, {passive: false});

    canvas.addEventListener("touchend", () => { 
        joystick.active = false; isBoosting = false; keys = {}; 
    });

    window.togglePause = function() {
        isPaused = !isPaused;
        const overlay = document.getElementById("statusOverlay");
        if (overlay) {
            overlay.style.display = isPaused ? "flex" : "none";
            document.getElementById("highScoreText").innerText = "Best Rescue: " + highScore;
        }
    };

    function spawnBaby() {
        lostDuckling.x = 40 + Math.random() * 320;
        lostDuckling.y = 40 + Math.random() * 320;
    }

    function update() {
        if (isPaused) return;

        let currentSpeed = (isBoosting && boostStamina > 0) ? mamaDuck.boostSpeed : mamaDuck.baseSpeed;
        if (isBoosting && boostStamina > 0) { boostStamina -= 1.5; } 
        else { isBoosting = false; if (boostStamina < 100) boostStamina += 0.5; }
        document.getElementById("boostBar").style.width = boostStamina + "%";

        if (keys["ArrowUp"] || keys["KeyW"]) mamaDuck.y -= currentSpeed;
        if (keys["ArrowDown"] || keys["KeyS"]) mamaDuck.y += currentSpeed;
        if (keys["ArrowLeft"] || keys["KeyA"]) mamaDuck.x -= currentSpeed;
        if (keys["ArrowRight"] || keys["KeyD"]) mamaDuck.x += currentSpeed;

        mamaDuck.x = Math.max(20, Math.min(380, mamaDuck.x));
        mamaDuck.y = Math.max(20, Math.min(380, mamaDuck.y));

        history.unshift({x: mamaDuck.x, y: mamaDuck.y});
        if (history.length > 200) history.pop();

        pikeFish.x += pikeFish.speed;
        if (pikeFish.x > 450) { pikeFish.x = -50; pikeFish.y = 50 + Math.random() * 300; }
        crocodile.x += crocodile.speed;
        if (crocodile.x < -100) { crocodile.x = 500; crocodile.y = 50 + Math.random() * 300; }

        if (Math.hypot(mamaDuck.x - lostDuckling.x, mamaDuck.y - lostDuckling.y) < 25) {
            ducklings.push({}); spawnBaby();
            document.getElementById("trailDisplay").innerText = ducklings.length;
        }

        if (Math.hypot(mamaDuck.x - nest.x, mamaDuck.y - nest.y) < nest.size && ducklings.length > 0) {
            score += ducklings.length; ducklings = [];
            document.getElementById("scoreDisplay").innerText = score;
            document.getElementById("trailDisplay").innerText = "0";
            if (score > highScore) {
                highScore = score; localStorage.setItem("duckRescueHighScore", highScore);
                document.getElementById("highScoreDisplay").innerText = highScore;
            }
        }

        ducklings.forEach((d, i) => {
            let idx = (i + 1) * 15;
            if (history[idx] && Math.hypot(history[idx].x - pikeFish.x, history[idx].y - pikeFish.y) < 20) {
                ducklings = ducklings.slice(0, i);
                document.getElementById("trailDisplay").innerText = ducklings.length;
            }
        });
    }

    function draw() {
        ctx.clearRect(0, 0, 400, 400);
        ctx.font = "45px serif"; ctx.textAlign = "center";
        ctx.fillText("🪺", nest.x, nest.y + 15); 
        ctx.font = "30px serif"; ctx.fillText("🐟", pikeFish.x, pikeFish.y); 
        ctx.font = "45px serif"; ctx.fillText("🐊", crocodile.x, crocodile.y); 

        ctx.save();
        ctx.translate(mamaDuck.x, mamaDuck.y);
        if (keys["ArrowLeft"] || keys["KeyA"]) ctx.scale(-1, 1);
        if (isBoosting) { ctx.shadowBlur = 15; ctx.shadowColor = "white"; }
        ctx.font = "40px serif"; ctx.fillText("🦢", 0, 15);
        ctx.restore();

        ducklings.forEach((d, i) => {
            let idx = (i + 1) * 15;
            if (history[idx]) {
                let bob = Math.sin(Date.now() * 0.01 + i) * 3;
                ctx.font = "20px serif"; ctx.fillText("🐥", history[idx].x, history[idx].y + 7 + bob);
            }
        });
        ctx.font = "24px serif"; ctx.fillText("🐣", lostDuckling.x, lostDuckling.y + 10); 

        if (joystick.active) {
            ctx.beginPath(); ctx.arc(joystick.baseX, joystick.baseY, joystick.radius, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255, 255, 255, 0.2)"; ctx.fill();
            ctx.beginPath(); ctx.arc(joystick.stickX, joystick.stickY, 20, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255, 255, 255, 0.5)"; ctx.fill();
        }
    }

    function loop() { update(); draw(); requestAnimationFrame(loop); }
    spawnBaby(); loop();
});
