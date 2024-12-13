import { canvas, clearCanvas, drawAxes, resizeCanvas } from './canvas.js';
import { calculateCanvasCoordinates } from './scaling.js';
import { animateProjectile, calculateTrajectory, togglePlayPause, isPaused } from './simulation.js';
import { DEG_TO_RAD } from './constants.js';

export let scale = 1;
export let offsetX = 0;
export let offsetY = 0;
let animationFrameId;
export let trajectoryData = [];

const GRAVITY_SELECT_ID = "gravitySelect";
const CUSTOM_GRAVITY_ID = "customGravity";
const ANGLE_ID = "angle";
const ANGLE_INPUT_ID = "angleInput";
const SPEED_CONTROL_ID = "speedControl";
const SPEED_CONTROL_INPUT_ID = "speedControlInput";
const VELOCITY_ID = "velocity";
const HEIGHT_ID = "height";
const SIMULATION_TIME_SLIDER_ID = "simulationTimeSlider";
const SIMULATION_TIME_ID = "simulationTime";
const PLAY_PAUSE_BUTTON_ID = "playPauseButton";
let gravitySelect;
let customGravityInput;
let angleInput;
let angleTextInput;
let speedControl;
let speedControlInput;
let velocityInput;
let heightInput;
let simulationTimeSlider;
let simulationTimeInput;
let playPauseButton;

export function setupControls() {
    gravitySelect = document.getElementById(GRAVITY_SELECT_ID);
    customGravityInput = document.getElementById(CUSTOM_GRAVITY_ID);
    angleInput = document.getElementById(ANGLE_ID);
    angleTextInput = document.getElementById(ANGLE_INPUT_ID);
    speedControl = document.getElementById(SPEED_CONTROL_ID);
    speedControlInput = document.getElementById(SPEED_CONTROL_INPUT_ID);
    velocityInput = document.getElementById(VELOCITY_ID);
    heightInput = document.getElementById(HEIGHT_ID);
    simulationTimeSlider = document.getElementById(SIMULATION_TIME_SLIDER_ID);
    simulationTimeInput = document.getElementById(SIMULATION_TIME_ID);
    playPauseButton = document.getElementById(PLAY_PAUSE_BUTTON_ID);

    gravitySelect.addEventListener("change", () => {
        customGravityInput.style.display = gravitySelect.value === "0" ? "inline" : "none";
    });

    const inputs = document.querySelectorAll(`#${VELOCITY_ID}, #${ANGLE_ID}, #${HEIGHT_ID}, #${GRAVITY_SELECT_ID}, #${CUSTOM_GRAVITY_ID}, #${SPEED_CONTROL_ID}, #${SPEED_CONTROL_INPUT_ID}, #${ANGLE_INPUT_ID}, #${SIMULATION_TIME_ID}, #${SIMULATION_TIME_SLIDER_ID}`);
    inputs.forEach((input) => {
        input.addEventListener("input", () => {
            let minVal = 0;
            let maxVal = -1;
            switch (input.id) {
                case "angleInput":
                    minVal = 0.1;
                    let angleValue = parseFloat(angleTextInput.value);
                    if (angleValue > 90) {
                        angleTextInput.value = 90;
                    }
                    angleInput.value = angleTextInput.value;
                    break;
                case "angle":
                    minVal = 0.1;
                    angleTextInput.value = angleInput.value;
                    break;
                case "speedControlInput":
                    minVal = 0.1;
                    let speedControlValue = parseFloat(speedControlInput.value);
                    if (speedControlValue > 10) {
                        speedControlValue = '10';
                    }
                    else if (speedControlValue < 0.1) {
                        speedControlValue = '0.1';
                    }
                    speedControlInput.value = speedControlValue;
                    speedControl.value = speedControlValue;
                    break;
                case "speedControl":
                    minVal = 0.1;
                    speedControlInput.value = speedControl.value;
                    break;
                case "height":
                    minVal = 0;
                    break;
                case "customGravity":
                    minVal = 0.1;
                    break;
                case "velocity":
                    minVal = 0.1;
                    break;
                case "simulationTime":
                    minVal = 0;
                    maxVal = simulationTimeSlider.max;
                    simulationTimeSlider.value = simulationTimeInput.value;
                    break;
                case "simulationTimeSlider":
                    minVal = 0;
                    simulationTimeInput.value = simulationTimeSlider.value;
                    break;
            }

            if (input.value !== "") {
                if (minVal > parseFloat(input.value)) {
                    input.value = minVal;
                }
                else if (maxVal !== -1 && maxVal < parseFloat(input.value)) {
                    input.value = maxVal;
                }
                pauseSimulationAndRedraw();
            }
        });
    });

    simulationTimeSlider.addEventListener("input", () => {
        const simulationTime = parseFloat(simulationTimeSlider.value);
        simulationTimeInput.value = simulationTime;
        pauseSimulationAndRedraw();
    });

    simulationTimeInput.addEventListener("input", () => {
        const simulationTime = parseFloat(simulationTimeInput.value);
        simulationTimeSlider.value = simulationTime;
        pauseSimulationAndRedraw();
    });

    window.addEventListener("resize", resizeCanvas);

    canvas.addEventListener("wheel", (event) => {
        event.preventDefault();
        const zoomFactor = 0.1;
        scale += event.deltaY < 0 ? zoomFactor : -zoomFactor; // Zoom in/out
        scale = Math.min(Math.max(scale, 0.5), 2); // Limit zoom level
        pauseSimulationAndRedraw();
    });

    let isPanning = false;
    let startX, startY;

    canvas.addEventListener("mousedown", (event) => {
        isPanning = true;
        startX = event.offsetX;
        startY = event.offsetY;
    });

    canvas.addEventListener("mouseup", () => {
        isPanning = false;
    });

    canvas.addEventListener("mousemove", (event) => {
        if (isPanning) {
            const { canvasX: startCanvasX, canvasY: startCanvasY } = calculateCanvasCoordinates(startX, startY);
            const { canvasX: currentCanvasX, canvasY: currentCanvasY } = calculateCanvasCoordinates(event.offsetX, event.offsetY);

            const dx = (currentCanvasX - startCanvasX) / scale; // Adjust by zoom level
            const dy = (currentCanvasY - startCanvasY) / scale;

            offsetX -= dx; // Subtract to move in opposite direction
            offsetY += dy; // Add to move in correct direction

            // Ensure new offsets do not go below 0
            if (offsetX < 0) offsetX = 0;
            if (offsetY > 0) offsetY = 0;

            startX = event.offsetX;
            startY = event.offsetY;

            pauseSimulationAndRedraw(); // Redraw the canvas with updated offsets
        }
    });

    canvas.addEventListener("mouseleave", () => {
        isPanning = false;
    });

    document.getElementById("resetPanButton").addEventListener("click", resetPan);
    document.getElementById("resetZoomButton").addEventListener("click", resetZoom);
    
    playPauseButton.addEventListener("click", () => {
        togglePlayPause();
        playPauseButton.textContent = isPaused ? "Play" : "Pause";
    });
}

function pauseSimulationAndRedraw() {
    if (!isPaused) {
        togglePlayPause();
    }
    playPauseButton.textContent = isPaused ? "Play" : "Pause";
    cancelExistingAnimation();
    updateSimulation();
}

export function updateSimulation() {
    const { velocity, angle, gravity, initialHeight, speedFactor } = getSimulationParameters();

    if (isInvalidSimulationParameters(velocity, angle, gravity, initialHeight)) {
        clearCanvasAndDrawAxes();
        return;
    }

    cancelExistingAnimation();

    const { angleRadians, timeOfFlight, maxHeight, range, xAtMaxHeight } = calculateSimulationValues(velocity, angle, gravity, initialHeight);

    // Calculate trajectory data once and store it in the global variable
    trajectoryData = calculateTrajectory(velocity, angleRadians, gravity, initialHeight);

    clearCanvasAndDrawAxes();
    const startTime = parseFloat(simulationTimeInput.value);
    animationFrameId = animateProjectile(velocity, angleRadians, gravity, timeOfFlight, maxHeight, range, initialHeight, scale, offsetX, offsetY, speedFactor, startTime);
}

export function getSimulationParameters() {
    const velocity = parseFloat(velocityInput.value);
    const angle = parseFloat(angleInput.value);
    let gravity = parseFloat(gravitySelect.value);
    if (gravity === 0) {
        gravity = parseFloat(customGravityInput.value);
    }
    const initialHeight = parseFloat(heightInput.value);
    const speedFactor = parseFloat(speedControl.value);

    return { velocity, angle, gravity, initialHeight, speedFactor };
}

function isInvalidSimulationParameters(velocity, angle, gravity, initialHeight) {
    return isNaN(velocity) || isNaN(angle) || isNaN(gravity) || isNaN(initialHeight) || velocity <= 0 || gravity <= 0;
}

function clearCanvasAndDrawAxes() {
    clearCanvas();
    drawAxes(0, 0); // Keep the grid visible
}

function cancelExistingAnimation() {
    if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

export function calculateSimulationValues(velocity, angle, gravity, initialHeight) {
    const angleRadians = angle * DEG_TO_RAD;
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

    return { angleRadians, timeOfFlight, maxHeight, range, xAtMaxHeight };
}

function resetPan() {
    offsetX = 0;
    offsetY = 0;
    pauseSimulationAndRedraw();
}

function resetZoom() {
    scale = 1;
    pauseSimulationAndRedraw();
}
