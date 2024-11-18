import { initializeCanvas, canvas, ctx, drawAxes, drawDashedLinesAndLabels } from './canvas.js';

let animationFrameId;
let trajectoryData = []; // Stores trajectory points for redrawing

export function animateProjectile(velocity, angle, gravity, timeOfFlight, maxHeight, range, initialHeight, scale, offsetX, offsetY) {
    const padding = 40;
    const steps = 500;
    let t = 0; // Start time

    // Cancel any existing animation
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }

    function drawFrame() {
        // Clear the canvas and redraw the axes
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawAxes(maxHeight, range, scale, offsetX, offsetY);

        // Draw trajectory up to the current time
        ctx.beginPath();
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 2;

        for (let i = 0; i <= t; i++) {
            const time = (timeOfFlight / steps) * i;
            const x = velocity * Math.cos(angle) * time;
            const y = initialHeight + velocity * Math.sin(angle) * time - 0.5 * gravity * Math.pow(time, 2);

            // Apply scale and offsets
            const canvasX = padding + (x * scale / range) * (canvas.width - 2 * padding) + offsetX;
            const canvasY = canvas.height - padding - ((y * scale + offsetY) / maxHeight) * (canvas.height - 2 * padding);

            if (i === 0) {
                ctx.moveTo(canvasX, canvasY);
            } else {
                ctx.lineTo(canvasX, canvasY);
            }
        }

        ctx.stroke();

        // Draw the current position of the projectile
        const time = (timeOfFlight / steps) * t;
        const x = velocity * Math.cos(angle) * time;
        const y = initialHeight + velocity * Math.sin(angle) * time - 0.5 * gravity * Math.pow(time, 2);

        const canvasX = padding + (x * scale / range) * (canvas.width - 2 * padding) + offsetX;
        const canvasY = canvas.height - padding - ((y * scale + offsetY) / maxHeight) * (canvas.height - 2 * padding);

        ctx.beginPath();
        ctx.arc(canvasX, canvasY, 5, 0, 2 * Math.PI); // Projectile as a small circle
        ctx.fillStyle = "red";
        ctx.fill();

        // Update time for the next frame
        if (t < steps) {
            t++;
            animationFrameId = requestAnimationFrame(drawFrame);
        }
    }

    drawFrame();
}

export function calculateTrajectory(initialVelocity, angle, gravity, initialHeight) {
    const points = [];
    const radianAngle = (angle * Math.PI) / 180; // Convert angle to radians
    const vx = initialVelocity * Math.cos(radianAngle); // Velocity in x direction
    const vy = initialVelocity * Math.sin(radianAngle); // Velocity in y direction
    const timeOfFlight = (vy + Math.sqrt(vy ** 2 + 2 * gravity * initialHeight)) / gravity;

    const step = timeOfFlight / 100; // Divide time into 100 intervals

    for (let t = 0; t <= timeOfFlight; t += step) {
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
    trajectoryData.forEach((point, index) => {
        const x = point.x * scaleX;
        const y = canvas.height - point.y * scaleY; // Flip y-axis for canvas

        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();
}