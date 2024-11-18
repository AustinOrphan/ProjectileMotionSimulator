import { resizeCanvas, drawAxes, drawDashedLinesAndLabels, canvas, ctx } from './canvas.js';
import { animateProjectile, calculateTrajectory } from './simulation.js';

let scale = 1; // Initial zoom level
let offsetX = 0; // Horizontal pan offset
let offsetY = 0; // Vertical pan offset

export function setupControls() {
    const gravitySelect = document.getElementById("gravitySelect");
    const customGravityInput = document.getElementById("customGravity");

    gravitySelect.addEventListener("change", function () {
        customGravityInput.style.display = gravitySelect.value === "0" ? "inline" : "none";
    });

    const inputs = document.querySelectorAll("#velocity, #angle, #height, #gravitySelect, #customGravity");
    inputs.forEach((input) => {
        input.addEventListener("input", updateSimulation);
    });

    window.addEventListener("resize", resizeCanvas);

    canvas.addEventListener("wheel", (event) => {
        event.preventDefault();
        const zoomFactor = 0.1;
        scale += event.deltaY < 0 ? zoomFactor : -zoomFactor; // Zoom in/out
        scale = Math.min(Math.max(scale, 0.5), 2); // Limit zoom level
        updateSimulation();
    });

    let isPanning = false;
    let startX, startY;

    canvas.addEventListener("mousedown", (event) => {
        isPanning = true;
        startX = event.offsetX;
        startY = event.offsetY;
    });

    canvas.addEventListener("mousemove", (event) => {
        if (isPanning) {
            const dx = (event.offsetX - startX) / scale; // Adjust by zoom level
            const dy = (event.offsetY - startY) / scale;

            offsetX -= dx; // Subtract to move in opposite direction
            offsetY -= dy;

            startX = event.offsetX;
            startY = event.offsetY;

            updateSimulation(); // Update the canvas with new offsets
        }
    });

    canvas.addEventListener("mouseup", () => {
        isPanning = false;
    });

    canvas.addEventListener("mouseleave", () => {
        isPanning = false;
    });
}

export function updateSimulation() {
    const velocity = parseFloat(document.getElementById("velocity").value);
    const angle = parseFloat(document.getElementById("angle").value);
    let gravity = parseFloat(document.getElementById("gravitySelect").value);
    if (gravity === 0) {
        gravity = parseFloat(document.getElementById("customGravity").value);
    }
    const initialHeight = parseFloat(document.getElementById("height").value);

    if (isNaN(velocity) || isNaN(angle) || isNaN(gravity) || isNaN(initialHeight) || velocity <= 0 || gravity <= 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawAxes(0, 0); // Keep the grid visible
        return;
    }

    const angleRadians = (angle * Math.PI) / 180;
    const timeOfFlight =
        (velocity * Math.sin(angleRadians) +
            Math.sqrt(
                Math.pow(velocity * Math.sin(angleRadians), 2) +
                2 * gravity * initialHeight
            )) /
        gravity;
    const maxHeight =
        initialHeight +
        Math.pow(velocity * Math.sin(angleRadians), 2) / (2 * gravity);
    const range = velocity * Math.cos(angleRadians) * timeOfFlight;
    const xAtMaxHeight = velocity * Math.cos(angleRadians) * (velocity * Math.sin(angleRadians) / gravity);

    const trajectoryPoints = calculateTrajectory(velocity, angleRadians, gravity, initialHeight);
    drawAxes(maxHeight, range, scale, offsetX, offsetY);
    animateProjectile(velocity, angleRadians, gravity, timeOfFlight, maxHeight, range, initialHeight, scale, offsetX, offsetY);
    drawDashedLinesAndLabels(maxHeight, range, xAtMaxHeight, scale, offsetX, offsetY);
}