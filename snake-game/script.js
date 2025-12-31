function drawSnakePart(part, index) {
    const isHead = index === 0;
    
    // 1. Draw the Body Part
    ctx.fillStyle = isHead ? "#2ecc71" : "#27ae60";
    ctx.beginPath();
    // Head is slightly rounder (10px) than the body (6px)
    ctx.roundRect(part.x + 1, part.y + 1, box - 2, box - 2, isHead ? 10 : 6);
    ctx.fill();

    // 2. Draw the Eyes (Only on the head)
    if (isHead) {
        ctx.fillStyle = "white";
        let eyeSize = 3;
        let offset = 5; // Distance from the edge

        // Position eyes based on direction
        if (direction === "UP" || direction === "DOWN") {
            // Horizontal eyes for vertical movement
            ctx.beginPath();
            ctx.arc(part.x + 7, part.y + 10, eyeSize, 0, Math.PI * 2); // Left eye
            ctx.arc(part.x + 13, part.y + 10, eyeSize, 0, Math.PI * 2); // Right eye
            ctx.fill();
            
            // Add tiny black pupils
            ctx.fillStyle = "black";
            ctx.beginPath();
            ctx.arc(part.x + 7, direction === "UP" ? part.y + 8 : part.y + 12, 1.5, 0, Math.PI * 2);
            ctx.arc(part.x + 13, direction === "UP" ? part.y + 8 : part.y + 12, 1.5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Vertical eyes for horizontal movement
            ctx.beginPath();
            ctx.arc(part.x + 10, part.y + 7, eyeSize, 0, Math.PI * 2); // Top eye
            ctx.arc(part.x + 10, part.y + 13, eyeSize, 0, Math.PI * 2); // Bottom eye
            ctx.fill();

            // Add tiny black pupils
            ctx.fillStyle = "black";
            ctx.beginPath();
            ctx.arc(direction === "LEFT" ? part.x + 8 : part.x + 12, part.y + 7, 1.5, 0, Math.PI * 2);
            ctx.arc(direction === "LEFT" ? part.x + 8 : part.x + 12, part.y + 13, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
