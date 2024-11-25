import { initializeCanvas, canvas, ctx, drawAxes, drawDashedLinesAndLabels } from './canvas.js';
import { calculateVisibleRange, calculateCanvasCoordinates } from './scaling.js';
import { CANVAS_PADDING, NUM_SIMULATION_STEPS, FRAME_TIME_MS } from './constants.js';

let animationFrameId;
let trajectoryData = []; // Stores trajectory points for redrawing

export function animateProjectile(velocity, angle, gravity, timeOfFlight, maxHeight, range, initialHeight, scale, offsetX, offsetY, speedFactor) {
    let t = 0; // Start time
    const stepDuration = FRAME_TIME_MS / speedFactor;

    // Cancel any existing animation
    if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    function drawFrame() {
        // Clear the canvas and redraw the axes
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.setLineDash([]); // Reset dashed lines

        drawAxes(maxHeight, range, scale, offsetX, offsetY);
        drawDashedLinesAndLabels(maxHeight, range, velocity * Math.cos(angle) * (velocity * Math.sin(angle) / gravity));

        // Draw trajectory up to the current time
        ctx.beginPath();
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 2;

        const stepSize = 1; // Adjust step size for optimization
        for (let i = 0; i <= t; i += stepSize) {
            const time = (timeOfFlight / NUM_SIMULATION_STEPS) * i;
            const { x, y } = getProjectileCoordinates(time, velocity, angle, initialHeight, gravity);

            // Convert x and y to canvas coordinates
            const { canvasX, canvasY } = calculateCanvasCoordinates(x, y);

            if (isPointWithinCanvas(canvasX, canvasY)) {
                // Draw line to the next point unless it's the last point (avoids a weird blue circle around the red projectile)
                if (i < t) {
                    ctx.lineTo(canvasX, canvasY);
                }
                // Draw projectile at the current position unless it's the last frame
                else if (t !== NUM_SIMULATION_STEPS) {
                    ctx.beginPath();
                    ctx.arc(canvasX, canvasY, 5, 0, 2 * Math.PI); // Projectile as a small circle
                    ctx.fillStyle = "red";
                    ctx.fill();
                } else {
                    drawDashedLinesAndLabels(maxHeight, range, velocity * Math.cos(angle) * (velocity * Math.sin(angle) / gravity));
                }
            } else {
                // Move to the next point if it's outside the canvas
                ctx.moveTo(canvasX, canvasY);
            }

            // Draw blue line at second to last frame to avoid a weird blue circle around the red projectile and aliasing
            if (i === t - 1) {
                ctx.stroke();
            }
        }

        // Update time for the next frame
        if (t < NUM_SIMULATION_STEPS) {
            t += 10 * speedFactor;
            animationFrameId = window.requestAnimationFrame(drawFrame);
        }
    }

    drawFrame();
}

function getProjectileCoordinates(time, velocity, angle, initialHeight, gravity) {
    const x = velocity * Math.cos(angle) * time;
    const y = initialHeight + velocity * Math.sin(angle) * time - 0.5 * gravity * Math.pow(time, 2);
    return { x, y };
}

function isPointWithinCanvas(xCoord, yCoord) {
    const isWithinCanvasX = xCoord > CANVAS_PADDING && xCoord < canvas.width - CANVAS_PADDING;
    const isWithinCanvasY = yCoord > CANVAS_PADDING && yCoord < canvas.height - CANVAS_PADDING;
    return isWithinCanvasX && isWithinCanvasY;
}

export function calculateTrajectory(initialVelocity, angle, gravity, initialHeight) {
    const points = [];
    const radianAngle = (angle * Math.PI) / 180; // Convert angle to radians
    const vx = initialVelocity * Math.cos(radianAngle); // Velocity in x direction
    const vy = initialVelocity * Math.sin(radianAngle); // Velocity in y direction
    const timeOfFlight = (vy + Math.sqrt(vy ** 2 + 2 * gravity * initialHeight)) / gravity;

    for (let t = 0; t <= timeOfFlight; t++) {
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