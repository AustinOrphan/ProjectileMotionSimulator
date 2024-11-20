import { initializeCanvas, canvas, ctx, drawAxes, drawDashedLinesAndLabels, aspectRatio } from './canvas.js';

let animationFrameId;
let trajectoryData = []; // Stores trajectory points for redrawing
const padding = 40;
const steps = 300;

export function animateProjectile(velocity, angle, gravity, timeOfFlight, maxHeight, range, initialHeight, scale, offsetX, offsetY, speedFactor) {
    let t = 0; // Start time

    // Cancel any existing animation
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }

    function drawFrame() {
        // Clear the canvas and redraw the axes
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.setLineDash([]); // Reset dashed lines

        drawAxes(maxHeight, range, scale, offsetX, offsetY);

        // Calculate visible range based on scaling
        let { visibleRangeX, visibleRangeY } = getScaledVisibleRanges(range, scale, maxHeight);

        // Draw trajectory up to the current time
        ctx.beginPath();
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 2;

        const stepSize = 1;//Math.max(1, Math.floor(t / 100)); // Adjust step size for optimization
        for (let i = 0; i <= t; i += stepSize) {
            
            const time = (timeOfFlight / steps) * i;
            const { x, y } = getProjectileCoordinates(time, velocity, angle, initialHeight, gravity);

            // Convert x and y to canvas coordinates
            const { canvasX, canvasY } = calculateCanvasCoordinates(x, offsetX, visibleRangeX, y, offsetY, visibleRangeY);

            if (isPointWithinCanvas(canvasX, canvasY)) {
                // Draw line to the next point unless it's the last point (avoids a weird blue circle around the red projectile)
                if (i < t) {
                    ctx.lineTo(canvasX, canvasY);
                }
                // Draw projectile at the current position unless it's the last frame
                else if (t !== steps){
                    ctx.beginPath();
                    ctx.arc(canvasX, canvasY, 5, 0, 2 * Math.PI); // Projectile as a small circle
                    ctx.fillStyle = "red";
                    ctx.fill();
                }
            // Move to the next point if it's outside the canvas
            } else {
                ctx.moveTo(canvasX, canvasY);
            }
            // Draw blue line at second to last frame to avoid a weird blue circle around the red projectile and aliasing
            if (i === t - 1){
                ctx.stroke();
            }
        }
        
        // Update time for the next frame
        if (t < steps) {
            t += speedFactor;
            animationFrameId = requestAnimationFrame(drawFrame);
        }
    }

    drawFrame();
}

function getProjectileCoordinates(time, velocity, angle, initialHeight, gravity) {
    const x = velocity * Math.cos(angle) * time;
    const y = initialHeight + velocity * Math.sin(angle) * time - 0.5 * gravity * Math.pow(time, 2);
    return { x, y };
}

function getScaledVisibleRanges(range, scale, maxHeight) {
    let visibleRangeX = range / scale; // Scaled range for x-axis
    let visibleRangeY = maxHeight / scale; // Scaled range for y-axis

    if (visibleRangeX < visibleRangeY) {
        visibleRangeX = visibleRangeY * aspectRatio;
    } else {
        visibleRangeY = visibleRangeX / aspectRatio;
    }
    return { visibleRangeX, visibleRangeY };
}

function calculateCanvasCoordinates(x, offsetX, visibleRangeX, y, offsetY, visibleRangeY) {
    const canvasX = padding + ((x - offsetX) / visibleRangeX) * (canvas.width - 2 * padding);
    const canvasY = canvas.height - padding - ((y + offsetY) / visibleRangeY) * (canvas.height - 2 * padding);
    return { canvasX, canvasY };
}

function isPointWithinCanvas(xCoord, yCoord) {
    const isWithinCanvasX = xCoord > padding && xCoord < canvas.width - padding;
    const isWithinCanvasY = yCoord > padding && yCoord < canvas.height - padding;
    return isWithinCanvasX && isWithinCanvasY;
}

export function calculateTrajectory(initialVelocity, angle, gravity, initialHeight) {
    const points = [];
    const radianAngle = (angle * Math.PI) / 180; // Convert angle to radians
    const vx = initialVelocity * Math.cos(radianAngle); // Velocity in x direction
    const vy = initialVelocity * Math.sin(radianAngle); // Velocity in y direction
    const timeOfFlight = (vy + Math.sqrt(vy ** 2 + 2 * gravity * initialHeight)) / gravity;

    for (let t = 0; t <= timeOfFlight; t ++) {
        const x = vx * t;
        const y = initialHeight + vy * t - 0.5 * gravity * t ** 2;
        points.push({ x, y });
    }

    trajectoryData = points; // Store trajectory points for redrawing
    drawTrajectory(); // Draw trajectory on canvas

    return points; // Return the points array
}

function drawTrajectory() {
    const initialCanvasWidth = canvas.width;
    const initialCanvasHeight = canvas.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

    if (trajectoryData.length === 0) return; // No trajectory data to draw

    const scaleX = canvas.width / initialCanvasWidth;
    const scaleY = canvas.height / initialCanvasHeight;

    ctx.beginPath();
    ctx.strokeStyle = "blue";
    trajectoryData.forEach((point) => {
        const x = point.x * scaleX;
        const y = canvas.height - point.y * scaleY; // Flip y-axis for canvas

        ctx.moveTo(x, y);
    });
    ctx.stroke();
}