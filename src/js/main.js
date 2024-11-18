import { resizeCanvas, drawAxes, initializeCanvas } from './canvas.js';
import { setupControls, updateSimulation } from './controls.js';

document.addEventListener("DOMContentLoaded", function () {
    initializeCanvas();
    resizeCanvas();
    setupControls();
    drawAxes();
    updateSimulation(); // Initial drawing
});