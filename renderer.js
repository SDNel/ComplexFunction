/**
 * Canvas rendering system for complex function visualization
 */
class ComplexRenderer {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // View parameters
        this.centerX = options.centerX || 0;
        this.centerY = options.centerY || 0;
        this.scale = options.scale || 100; // pixels per unit

        // Grid and circle parameters
        this.gridSpacing = options.gridSpacing || 1;
        this.radialLines = options.radialLines || 12;
        this.concentricCircles = options.concentricCircles || 5;

        // Colors
        this.colors = {
            grid: '#404040',        // Dark grey for grid lines
            radial: '#0066cc',      // Blue for radial lines
            circles: '#006600',     // Dark green for circles
            background: '#ffffff'
        };

        // Animation state
        this.animationTime = 0;
        this.isAnimating = false;

        // Current render state
        this.currentTransformFunction = null;
        this.currentT = 1;

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Mouse interaction for panning and zooming
        let isDragging = false;
        let lastX, lastY;

        this.canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            const rect = this.canvas.getBoundingClientRect();
            lastX = e.clientX - rect.left;
            lastY = e.clientY - rect.top;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const rect = this.canvas.getBoundingClientRect();
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;

            const deltaX = currentX - lastX;
            const deltaY = currentY - lastY;

            this.centerX -= deltaX / this.scale;
            this.centerY += deltaY / this.scale; // Flip Y axis

            lastX = currentX;
            lastY = currentY;

            this.render(this.currentTransformFunction, this.currentT);
            this.updateInfo();
        });

        this.canvas.addEventListener('mouseup', () => {
            isDragging = false;
        });

        this.canvas.addEventListener('mouseleave', () => {
            isDragging = false;
        });

        // Zoom with mouse wheel
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();

            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Convert mouse position to complex coordinates
            const complexX = (mouseX - this.width / 2) / this.scale + this.centerX;
            const complexY = -(mouseY - this.height / 2) / this.scale + this.centerY;

            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            const oldScale = this.scale;
            this.scale *= zoomFactor;

            // Adjust center to zoom towards mouse position
            this.centerX = complexX - (mouseX - this.width / 2) / this.scale;
            this.centerY = complexY + (mouseY - this.height / 2) / this.scale;

            this.render(this.currentTransformFunction, this.currentT);
            this.updateInfo();
        });
    }

    // Convert complex coordinates to canvas coordinates
    complexToCanvas(z) {
        const x = (z.real - this.centerX) * this.scale + this.width / 2;
        const y = -(z.imag - this.centerY) * this.scale + this.height / 2;
        return { x, y };
    }

    // Convert canvas coordinates to complex coordinates
    canvasToComplex(x, y) {
        const real = (x - this.width / 2) / this.scale + this.centerX;
        const imag = -((y - this.height / 2) / this.scale - this.centerY);
        return new Complex(real, imag);
    }

    clear() {
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawGrid() {
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([]);

        // Determine grid spacing based on scale
        let spacing = this.gridSpacing;
        while (spacing * this.scale < 20) spacing *= 2;
        while (spacing * this.scale > 100) spacing /= 2;

        // Vertical lines
        const startX = Math.floor((this.centerX - this.width / (2 * this.scale)) / spacing) * spacing;
        const endX = Math.ceil((this.centerX + this.width / (2 * this.scale)) / spacing) * spacing;

        for (let x = startX; x <= endX; x += spacing) {
            const canvasX = (x - this.centerX) * this.scale + this.width / 2;
            if (canvasX >= 0 && canvasX <= this.width) {
                this.ctx.beginPath();
                this.ctx.moveTo(canvasX, 0);
                this.ctx.lineTo(canvasX, this.height);
                this.ctx.stroke();
            }
        }

        // Horizontal lines
        const startY = Math.floor((this.centerY - this.height / (2 * this.scale)) / spacing) * spacing;
        const endY = Math.ceil((this.centerY + this.height / (2 * this.scale)) / spacing) * spacing;

        for (let y = startY; y <= endY; y += spacing) {
            const canvasY = -(y - this.centerY) * this.scale + this.height / 2;
            if (canvasY >= 0 && canvasY <= this.height) {
                this.ctx.beginPath();
                this.ctx.moveTo(0, canvasY);
                this.ctx.lineTo(this.width, canvasY);
                this.ctx.stroke();
            }
        }
    }

    drawRadialLines() {
        this.ctx.strokeStyle = this.colors.radial;
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([]);

        const center = this.complexToCanvas(new Complex(0, 0));
        const maxRadius = Math.max(this.width, this.height);

        for (let i = 0; i < this.radialLines; i++) {
            const angle = (2 * Math.PI * i) / this.radialLines;
            const endX = center.x + maxRadius * Math.cos(angle);
            const endY = center.y + maxRadius * Math.sin(angle);

            this.ctx.beginPath();
            this.ctx.moveTo(center.x, center.y);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
        }
    }

    drawConcentricCircles() {
        this.ctx.strokeStyle = this.colors.circles;
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([]);

        const center = this.complexToCanvas(new Complex(0, 0));

        // Determine circle spacing based on scale
        let spacing = 1;
        while (spacing * this.scale < 30) spacing *= 2;
        while (spacing * this.scale > 120) spacing /= 2;

        for (let i = 1; i <= this.concentricCircles; i++) {
            const radius = i * spacing * this.scale;
            if (radius > 5) { // Only draw circles that are visible
                this.ctx.beginPath();
                this.ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
                this.ctx.stroke();
            }
        }
    }

    // Draw transformed grid elements
    drawTransformedGrid(transformFunction, t = 1) {
        if (!transformFunction) return;

        this.ctx.lineWidth = 1;

        // Transform grid lines
        this.ctx.strokeStyle = this.colors.grid;
        this.drawTransformedGridLines(transformFunction, t);

        // Transform radial lines
        this.ctx.strokeStyle = this.colors.radial;
        this.drawTransformedRadialLines(transformFunction, t);

        // Transform concentric circles
        this.ctx.strokeStyle = this.colors.circles;
        this.drawTransformedCircles(transformFunction, t);
    }

    drawTransformedGridLines(transformFunction, t) {
        const spacing = 0.5;
        const range = 5;
        const steps = 50;

        // Vertical lines (constant real part)
        for (let real = -range; real <= range; real += spacing) {
            this.ctx.beginPath();
            let isFirst = true;

            for (let i = 0; i <= steps; i++) {
                const imag = -range + (2 * range * i) / steps;
                const z = new Complex(real, imag);
                const transformed = this.interpolateTransform(z, transformFunction, t);
                const canvas = this.complexToCanvas(transformed);

                if (isFirst) {
                    this.ctx.moveTo(canvas.x, canvas.y);
                    isFirst = false;
                } else {
                    this.ctx.lineTo(canvas.x, canvas.y);
                }
            }
            this.ctx.stroke();
        }

        // Horizontal lines (constant imaginary part)
        for (let imag = -range; imag <= range; imag += spacing) {
            this.ctx.beginPath();
            let isFirst = true;

            for (let i = 0; i <= steps; i++) {
                const real = -range + (2 * range * i) / steps;
                const z = new Complex(real, imag);
                const transformed = this.interpolateTransform(z, transformFunction, t);
                const canvas = this.complexToCanvas(transformed);

                if (isFirst) {
                    this.ctx.moveTo(canvas.x, canvas.y);
                    isFirst = false;
                } else {
                    this.ctx.lineTo(canvas.x, canvas.y);
                }
            }
            this.ctx.stroke();
        }
    }

    drawTransformedRadialLines(transformFunction, t) {
        const maxRadius = 5;
        const steps = 100;

        for (let i = 0; i < this.radialLines; i++) {
            const angle = (2 * Math.PI * i) / this.radialLines;

            this.ctx.beginPath();
            let isFirst = true;

            for (let j = 0; j <= steps; j++) {
                const r = (maxRadius * j) / steps;
                const z = Complex.fromPolar(r, angle);
                const transformed = this.interpolateTransform(z, transformFunction, t);
                const canvas = this.complexToCanvas(transformed);

                if (isFirst) {
                    this.ctx.moveTo(canvas.x, canvas.y);
                    isFirst = false;
                } else {
                    this.ctx.lineTo(canvas.x, canvas.y);
                }
            }
            this.ctx.stroke();
        }
    }

    drawTransformedCircles(transformFunction, t) {
        const maxRadius = 5;
        const steps = 100;

        for (let i = 1; i <= this.concentricCircles; i++) {
            const radius = i;
            if (radius > maxRadius) continue;

            this.ctx.beginPath();
            let isFirst = true;

            for (let j = 0; j <= steps; j++) {
                const angle = (2 * Math.PI * j) / steps;
                const z = Complex.fromPolar(radius, angle);
                const transformed = this.interpolateTransform(z, transformFunction, t);
                const canvas = this.complexToCanvas(transformed);

                if (isFirst) {
                    this.ctx.moveTo(canvas.x, canvas.y);
                    isFirst = false;
                } else {
                    this.ctx.lineTo(canvas.x, canvas.y);
                }
            }
            this.ctx.closePath();
            this.ctx.stroke();
        }
    }

    // Interpolate between identity and transformation for animation
    interpolateTransform(z, transformFunction, t) {
        if (t >= 1) {
            return transformFunction(z);
        }

        const identity = z;
        const transformed = transformFunction(z);

        // Linear interpolation
        const real = identity.real + t * (transformed.real - identity.real);
        const imag = identity.imag + t * (transformed.imag - identity.imag);

        return new Complex(real, imag);
    }

    render(transformFunction = null, t = 1) {
        // Store current render state for mouse interactions
        this.currentTransformFunction = transformFunction;
        this.currentT = t;

        this.clear();

        if (transformFunction) {
            this.drawTransformedGrid(transformFunction, t);
        } else {
            this.drawGrid();
            this.drawRadialLines();
            this.drawConcentricCircles();
        }
    }

    updateInfo() {
        const centerInfo = document.getElementById(this.canvas.id.includes('domain') ? 'domain-center' : 'range-center');
        const scaleInfo = document.getElementById(this.canvas.id.includes('domain') ? 'domain-scale' : 'range-scale');

        if (centerInfo) {
            centerInfo.textContent = `Center: (${this.centerX.toFixed(2)}, ${this.centerY.toFixed(2)})`;
        }
        if (scaleInfo) {
            scaleInfo.textContent = `Scale: ${(1/this.scale * 100).toFixed(1)}`;
        }
    }

    // Export functionality
    exportAsSVG(transformFunction = null, t = 1) {
        // Create SVG element
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', this.width);
        svg.setAttribute('height', this.height);
        svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

        // Add background
        const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bg.setAttribute('width', this.width);
        bg.setAttribute('height', this.height);
        bg.setAttribute('fill', this.colors.background);
        svg.appendChild(bg);

        // Render content to SVG
        if (transformFunction) {
            this.renderGridToSVG(svg, transformFunction, t);
        } else {
            this.renderGridToSVG(svg);
        }

        const svgString = new XMLSerializer().serializeToString(svg);
        return svgString;
    }

    renderGridToSVG(svg, transformFunction = null, t = 1) {
        // Helper to create SVG path
        const createPath = (d, stroke, strokeWidth = 1) => {
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', d);
            path.setAttribute('stroke', stroke);
            path.setAttribute('stroke-width', strokeWidth);
            path.setAttribute('fill', 'none');
            return path;
        };

        if (transformFunction) {
            // Render transformed grid
            this.renderTransformedGridToSVG(svg, transformFunction, t, createPath);
        } else {
            // Render regular grid
            this.renderRegularGridToSVG(svg, createPath);
        }
    }

    renderRegularGridToSVG(svg, createPath) {
        // Grid lines
        let spacing = this.gridSpacing;
        while (spacing * this.scale < 20) spacing *= 2;
        while (spacing * this.scale > 100) spacing /= 2;

        let gridPath = '';

        // Vertical lines
        const startX = Math.floor((this.centerX - this.width / (2 * this.scale)) / spacing) * spacing;
        const endX = Math.ceil((this.centerX + this.width / (2 * this.scale)) / spacing) * spacing;

        for (let x = startX; x <= endX; x += spacing) {
            const canvasX = (x - this.centerX) * this.scale + this.width / 2;
            if (canvasX >= 0 && canvasX <= this.width) {
                gridPath += `M ${canvasX} 0 L ${canvasX} ${this.height} `;
            }
        }

        // Horizontal lines
        const startY = Math.floor((this.centerY - this.height / (2 * this.scale)) / spacing) * spacing;
        const endY = Math.ceil((this.centerY + this.height / (2 * this.scale)) / spacing) * spacing;

        for (let y = startY; y <= endY; y += spacing) {
            const canvasY = -(y - this.centerY) * this.scale + this.height / 2;
            if (canvasY >= 0 && canvasY <= this.height) {
                gridPath += `M 0 ${canvasY} L ${this.width} ${canvasY} `;
            }
        }

        if (gridPath) {
            svg.appendChild(createPath(gridPath, this.colors.grid));
        }

        // Radial lines
        const center = this.complexToCanvas(new Complex(0, 0));
        const maxRadius = Math.max(this.width, this.height);
        let radialPath = '';

        for (let i = 0; i < this.radialLines; i++) {
            const angle = (2 * Math.PI * i) / this.radialLines;
            const endX = center.x + maxRadius * Math.cos(angle);
            const endY = center.y + maxRadius * Math.sin(angle);
            radialPath += `M ${center.x} ${center.y} L ${endX} ${endY} `;
        }

        if (radialPath) {
            svg.appendChild(createPath(radialPath, this.colors.radial));
        }

        // Concentric circles
        let circleSpacing = 1;
        while (circleSpacing * this.scale < 30) circleSpacing *= 2;
        while (circleSpacing * this.scale > 120) circleSpacing /= 2;

        for (let i = 1; i <= this.concentricCircles; i++) {
            const radius = i * circleSpacing * this.scale;
            if (radius > 5) {
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', center.x);
                circle.setAttribute('cy', center.y);
                circle.setAttribute('r', radius);
                circle.setAttribute('stroke', this.colors.circles);
                circle.setAttribute('stroke-width', 1);
                circle.setAttribute('fill', 'none');
                svg.appendChild(circle);
            }
        }
    }

    renderTransformedGridToSVG(svg, transformFunction, t, createPath) {
        const spacing = 0.5;
        const range = 5;
        const steps = 50;

        // Transform grid lines
        let gridPath = '';

        // Vertical lines
        for (let real = -range; real <= range; real += spacing) {
            let pathData = '';
            for (let i = 0; i <= steps; i++) {
                const imag = -range + (2 * range * i) / steps;
                const z = new Complex(real, imag);
                const transformed = this.interpolateTransform(z, transformFunction, t);
                const canvas = this.complexToCanvas(transformed);

                if (i === 0) {
                    pathData += `M ${canvas.x} ${canvas.y} `;
                } else {
                    pathData += `L ${canvas.x} ${canvas.y} `;
                }
            }
            gridPath += pathData;
        }

        // Horizontal lines
        for (let imag = -range; imag <= range; imag += spacing) {
            let pathData = '';
            for (let i = 0; i <= steps; i++) {
                const real = -range + (2 * range * i) / steps;
                const z = new Complex(real, imag);
                const transformed = this.interpolateTransform(z, transformFunction, t);
                const canvas = this.complexToCanvas(transformed);

                if (i === 0) {
                    pathData += `M ${canvas.x} ${canvas.y} `;
                } else {
                    pathData += `L ${canvas.x} ${canvas.y} `;
                }
            }
            gridPath += pathData;
        }

        if (gridPath) {
            svg.appendChild(createPath(gridPath, this.colors.grid));
        }

        // Transform radial lines
        let radialPath = '';
        const maxRadius = 5;
        const radialSteps = 100;

        for (let i = 0; i < this.radialLines; i++) {
            const angle = (2 * Math.PI * i) / this.radialLines;
            let pathData = '';

            for (let j = 0; j <= radialSteps; j++) {
                const r = (maxRadius * j) / radialSteps;
                const z = Complex.fromPolar(r, angle);
                const transformed = this.interpolateTransform(z, transformFunction, t);
                const canvas = this.complexToCanvas(transformed);

                if (j === 0) {
                    pathData += `M ${canvas.x} ${canvas.y} `;
                } else {
                    pathData += `L ${canvas.x} ${canvas.y} `;
                }
            }
            radialPath += pathData;
        }

        if (radialPath) {
            svg.appendChild(createPath(radialPath, this.colors.radial));
        }

        // Transform concentric circles
        let circlesPath = '';
        const circleSteps = 100;

        for (let i = 1; i <= this.concentricCircles; i++) {
            const radius = i;
            if (radius > maxRadius) continue;

            let pathData = '';
            for (let j = 0; j <= circleSteps; j++) {
                const angle = (2 * Math.PI * j) / circleSteps;
                const z = Complex.fromPolar(radius, angle);
                const transformed = this.interpolateTransform(z, transformFunction, t);
                const canvas = this.complexToCanvas(transformed);

                if (j === 0) {
                    pathData += `M ${canvas.x} ${canvas.y} `;
                } else {
                    pathData += `L ${canvas.x} ${canvas.y} `;
                }
            }
            pathData += 'Z '; // Close path
            circlesPath += pathData;
        }

        if (circlesPath) {
            svg.appendChild(createPath(circlesPath, this.colors.circles));
        }
    }

    exportAsPNG() {
        return this.canvas.toDataURL('image/png');
    }
}