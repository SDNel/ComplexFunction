/**
 * Main application controller for Complex Function Visualizer
 */
class ComplexFunctionApp {
    constructor() {
        this.parser = new FunctionParser();
        this.currentFunction = null;
        this.currentParameters = {};
        this.animationId = null;
        this.animationTime = 0;
        this.animationSpeed = 1;
        this.isPlaying = false;

        // Initialize renderers
        this.domainRenderer = new ComplexRenderer('domain-canvas', {
            centerX: 0,
            centerY: 0,
            scale: 60
        });

        this.rangeRenderer = new ComplexRenderer('range-canvas', {
            centerX: 0,
            centerY: 0,
            scale: 60
        });

        this.setupEventHandlers();
        this.parseDefaultFunction();
    }

    setupEventHandlers() {
        // Function input
        const functionInput = document.getElementById('function-input');
        const parseButton = document.getElementById('parse-function');

        parseButton.addEventListener('click', () => {
            this.parseFunction(functionInput.value);
        });

        functionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.parseFunction(functionInput.value);
            }
        });

        // Mode controls
        const modeInputs = document.querySelectorAll('input[name="mode"]');
        modeInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.handleModeChange(input.value);
            });
        });

        // Animation controls
        const speedControl = document.getElementById('speed');
        const playPauseButton = document.getElementById('play-pause');
        const resetButton = document.getElementById('reset');

        speedControl.addEventListener('input', (e) => {
            this.animationSpeed = parseFloat(e.target.value);
        });

        playPauseButton.addEventListener('click', () => {
            this.toggleAnimation();
        });

        resetButton.addEventListener('click', () => {
            this.resetAnimation();
        });

        // Export controls
        document.getElementById('export-svg').addEventListener('click', () => {
            this.exportSVG();
        });

        document.getElementById('export-png').addEventListener('click', () => {
            this.exportPNG();
        });
    }

    parseFunction(expression) {
        try {
            const result = this.parser.parse(expression);
            this.currentFunction = result.function;
            this.currentParameters = this.parser.getDefaultParameters();

            this.createParameterSliders(result.parameters);
            this.updateVisualization();

            console.log('Function parsed successfully:', expression);
        } catch (error) {
            alert(`Error parsing function: ${error.message}`);
            console.error('Parse error:', error);
        }
    }

    parseDefaultFunction() {
        const defaultExpression = document.getElementById('function-input').value;
        this.parseFunction(defaultExpression);
    }

    createParameterSliders(parameters) {
        const container = document.getElementById('parameter-sliders');
        container.innerHTML = '';

        if (parameters.length === 0) {
            container.innerHTML = '<p>No parameters detected</p>';
            return;
        }

        parameters.forEach(param => {
            const sliderDiv = document.createElement('div');
            sliderDiv.className = 'parameter-slider';

            const label = document.createElement('label');
            label.textContent = param;

            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = '-5';
            slider.max = '5';
            slider.step = '0.1';
            slider.value = this.currentParameters[param] || 1;
            slider.id = `param-${param}`;

            const valueDisplay = document.createElement('div');
            valueDisplay.className = 'parameter-value';
            valueDisplay.textContent = slider.value;

            slider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.currentParameters[param] = value;
                valueDisplay.textContent = value.toFixed(1);
                this.updateVisualization();
            });

            sliderDiv.appendChild(label);
            sliderDiv.appendChild(slider);
            sliderDiv.appendChild(valueDisplay);
            container.appendChild(sliderDiv);
        });

        // Show parameters panel
        document.getElementById('parameters-panel').style.display = 'block';
    }

    handleModeChange(mode) {
        const animationControls = document.getElementById('animation-controls');

        if (mode === 'parametric') {
            animationControls.style.display = 'flex';
            this.resetAnimation();
        } else {
            animationControls.style.display = 'none';
            this.stopAnimation();
            this.updateVisualization();
        }
    }

    updateVisualization() {
        if (!this.currentFunction) return;

        const mode = document.querySelector('input[name="mode"]:checked').value;

        // Always render the domain
        this.domainRenderer.render();

        // Render the range based on mode
        if (mode === 'immediate') {
            this.rangeRenderer.render(this.currentFunction);
        } else {
            // Parametric mode - render with current animation time
            const t = this.getAnimationParameter();
            this.rangeRenderer.render(this.currentFunction, t);
        }
    }

    getAnimationParameter() {
        // Convert animation time to parameter t (0 to 1)
        return Math.min(this.animationTime / 5, 1); // 5-second cycle
    }

    toggleAnimation() {
        const button = document.getElementById('play-pause');

        if (this.isPlaying) {
            this.stopAnimation();
            button.textContent = 'Play';
        } else {
            this.startAnimation();
            button.textContent = 'Pause';
        }
    }

    startAnimation() {
        this.isPlaying = true;
        this.animate();
    }

    stopAnimation() {
        this.isPlaying = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    resetAnimation() {
        this.stopAnimation();
        this.animationTime = 0;
        document.getElementById('play-pause').textContent = 'Play';
        this.updateVisualization();
    }

    animate() {
        if (!this.isPlaying) return;

        this.animationTime += 0.016 * this.animationSpeed; // ~60fps

        // Loop animation
        if (this.animationTime > 5) {
            this.animationTime = 0;
        }

        this.updateVisualization();
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    exportSVG() {
        try {
            // Export both canvases
            const domainSVG = this.domainRenderer.exportAsSVG();
            const rangeSVG = this.rangeRenderer.exportAsSVG();

            // Create combined SVG
            const combinedSVG = `
                <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600" viewBox="0 0 1200 600">
                    <g id="domain">${domainSVG}</g>
                    <g id="range" transform="translate(600, 0)">${rangeSVG}</g>
                </svg>
            `;

            this.downloadFile(combinedSVG, 'complex-function-visualization.svg', 'image/svg+xml');
        } catch (error) {
            alert('Error exporting SVG: ' + error.message);
        }
    }

    exportPNG() {
        try {
            // Create a temporary canvas to combine both views
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 1200;
            tempCanvas.height = 600;
            const ctx = tempCanvas.getContext('2d');

            // Fill background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, 1200, 600);

            // Draw domain canvas
            ctx.drawImage(this.domainRenderer.canvas, 0, 0);

            // Draw range canvas
            ctx.drawImage(this.rangeRenderer.canvas, 600, 0);

            // Add labels
            ctx.fillStyle = '#000000';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Domain (Complex Plane)', 300, 30);
            ctx.fillText('Range (Transformed)', 900, 30);

            const dataURL = tempCanvas.toDataURL('image/png');
            this.downloadFile(dataURL, 'complex-function-visualization.png', 'image/png', true);
        } catch (error) {
            alert('Error exporting PNG: ' + error.message);
        }
    }

    downloadFile(content, filename, mimeType, isDataURL = false) {
        const link = document.createElement('a');

        if (isDataURL) {
            link.href = content;
        } else {
            const blob = new Blob([content], { type: mimeType });
            link.href = URL.createObjectURL(blob);
        }

        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (!isDataURL) {
            URL.revokeObjectURL(link.href);
        }
    }
}

// Predefined function examples
const FunctionExamples = {
    'Square': 'z^2',
    'Cube': 'z^3',
    'Reciprocal': '1/z',
    'Square Root': 'sqrt(z)',
    'Exponential': 'exp(z)',
    'Sine': 'sin(z)',
    'Cosine': 'cos(z)',
    'Möbius Transform': '(a*z + b)/(c*z + d)',
    'Polynomial': 'a*z^n + b*z + c',
    'Riemann Zeta': 'z^s',
    'Joukowsky': 'z + 1/z',
    'Complex Log': 'log(z)',
    'Power Function': 'z^n'
};

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Make classes globally available
    window.Complex = Complex;
    window.ComplexFunctions = ComplexFunctions;
    window.ComplexRenderer = ComplexRenderer;
    window.FunctionParser = FunctionParser;

    // Initialize the app
    const app = new ComplexFunctionApp();
    window.app = app; // For debugging

    // Add function examples to the interface (optional)
    const functionInput = document.getElementById('function-input');

    // Add double-click to show examples
    functionInput.addEventListener('dblclick', () => {
        const examples = Object.entries(FunctionExamples)
            .map(([name, expr]) => `${name}: ${expr}`)
            .join('\n');

        alert('Function Examples:\n\n' + examples + '\n\nDouble-click again to dismiss.');
    });

    console.log('Complex Function Visualizer initialized');
    console.log('Available examples:', FunctionExamples);
});