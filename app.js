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
            this.createComplexParameterSlider(container, param);
        });

        // Show parameters panel
        document.getElementById('parameters-panel').style.display = 'block';
    }

    createComplexParameterSlider(container, param) {
        const parameterDiv = document.createElement('div');
        parameterDiv.className = 'complex-parameter';

        const title = document.createElement('h4');
        title.textContent = param;
        title.style.marginBottom = '10px';
        title.style.color = '#2c3e50';
        parameterDiv.appendChild(title);

        // Initialize parameter as complex number if not already set
        if (!this.currentParameters[param] || typeof this.currentParameters[param] === 'number') {
            this.currentParameters[param] = new Complex(this.currentParameters[param] || 1, 0);
        }

        // Real part slider
        const realDiv = document.createElement('div');
        realDiv.className = 'parameter-slider';

        const realLabel = document.createElement('label');
        realLabel.textContent = `Re(${param})`;
        realLabel.style.fontSize = '14px';

        const realSlider = document.createElement('input');
        realSlider.type = 'range';
        realSlider.min = '-5';
        realSlider.max = '5';
        realSlider.step = '0.1';
        realSlider.value = this.currentParameters[param].real;
        realSlider.id = `param-${param}-real`;

        const realDisplay = document.createElement('div');
        realDisplay.className = 'parameter-value';
        realDisplay.textContent = this.currentParameters[param].real.toFixed(1);

        realSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.currentParameters[param].real = value;
            realDisplay.textContent = value.toFixed(1);
            this.updateComplexParameterDisplay(param);
            this.updateVisualization();
        });

        realDiv.appendChild(realLabel);
        realDiv.appendChild(realSlider);
        realDiv.appendChild(realDisplay);

        // Imaginary part slider
        const imagDiv = document.createElement('div');
        imagDiv.className = 'parameter-slider';

        const imagLabel = document.createElement('label');
        imagLabel.textContent = `Im(${param})`;
        imagLabel.style.fontSize = '14px';

        const imagSlider = document.createElement('input');
        imagSlider.type = 'range';
        imagSlider.min = '-5';
        imagSlider.max = '5';
        imagSlider.step = '0.1';
        imagSlider.value = this.currentParameters[param].imag;
        imagSlider.id = `param-${param}-imag`;

        const imagDisplay = document.createElement('div');
        imagDisplay.className = 'parameter-value';
        imagDisplay.textContent = this.currentParameters[param].imag.toFixed(1);

        imagSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.currentParameters[param].imag = value;
            imagDisplay.textContent = value.toFixed(1);
            this.updateComplexParameterDisplay(param);
            this.updateVisualization();
        });

        imagDiv.appendChild(imagLabel);
        imagDiv.appendChild(imagSlider);
        imagDiv.appendChild(imagDisplay);

        // Combined display
        const complexDisplay = document.createElement('div');
        complexDisplay.className = 'complex-parameter-display';
        complexDisplay.id = `complex-display-${param}`;
        complexDisplay.style.textAlign = 'center';
        complexDisplay.style.marginTop = '5px';
        complexDisplay.style.padding = '5px';
        complexDisplay.style.backgroundColor = '#f0f0f0';
        complexDisplay.style.borderRadius = '3px';
        complexDisplay.style.fontFamily = 'monospace';
        complexDisplay.style.fontSize = '12px';

        this.updateComplexParameterDisplay(param, complexDisplay);

        parameterDiv.appendChild(realDiv);
        parameterDiv.appendChild(imagDiv);
        parameterDiv.appendChild(complexDisplay);

        // Add separator
        const separator = document.createElement('hr');
        separator.style.margin = '15px 0';
        separator.style.border = '1px solid #eee';
        parameterDiv.appendChild(separator);

        container.appendChild(parameterDiv);
    }

    updateComplexParameterDisplay(param, displayElement = null) {
        if (!displayElement) {
            displayElement = document.getElementById(`complex-display-${param}`);
        }

        if (displayElement && this.currentParameters[param]) {
            const complex = this.currentParameters[param];
            displayElement.textContent = `${param} = ${complex.toString()}`;
        }
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

        // Create wrapper function that includes current parameters
        const transformWithParams = (z) => {
            return this.currentFunction(z, this.currentParameters);
        };

        // Render the range based on mode
        if (mode === 'immediate') {
            this.rangeRenderer.render(transformWithParams);
        } else {
            // Parametric mode - render with current animation time
            const t = this.getAnimationParameter();
            this.rangeRenderer.render(transformWithParams, t);
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
            const mode = document.querySelector('input[name="mode"]:checked').value;
            let t = 1;
            if (mode === 'parametric') {
                t = this.getAnimationParameter();
            }

            // Export both canvases with current state
            const domainSVG = this.domainRenderer.exportAsSVG();

            // Create wrapper function that includes current parameters
            const transformWithParams = (z) => {
                return this.currentFunction(z, this.currentParameters);
            };

            const rangeSVG = this.rangeRenderer.exportAsSVG(transformWithParams, t);

            // Create combined SVG with proper structure
            const combinedSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600" viewBox="0 0 1200 600">
    <rect width="1200" height="600" fill="#f8f9fa"/>
    <g id="domain">
        ${domainSVG.replace('<?xml version="1.0" encoding="UTF-8"?>', '').replace(/<svg[^>]*>/, '').replace('</svg>', '')}
    </g>
    <g id="range" transform="translate(600, 0)">
        ${rangeSVG.replace('<?xml version="1.0" encoding="UTF-8"?>', '').replace(/<svg[^>]*>/, '').replace('</svg>', '')}
    </g>
    <text x="300" y="30" text-anchor="middle" font-family="Arial" font-size="16" fill="#2c3e50">Domain (Complex Plane)</text>
    <text x="900" y="30" text-anchor="middle" font-family="Arial" font-size="16" fill="#2c3e50">Range (Transformed)</text>
</svg>`;

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