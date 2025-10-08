/**
 * Triangle class for conformal transformation demonstration
 * Handles triangle geometry, angle calculations, and rendering
 */
class Triangle {
    constructor() {
        this.center = new Complex(0, 0);
        this.size = 0.5;
        this.angleA = 60; // degrees
        this.angleB = 60; // degrees
        this.angleC = 60; // degrees (calculated)
        this.visible = true;
        this.showAngles = true;

        // Colors for angle visualization
        this.colors = {
            A: '#ff0000', // red
            B: '#0066ff', // blue
            C: '#00aa00', // green
            triangle: '#333333',
            angleArc: '#666666'
        };

        this.calculateVertices();
    }

    /**
     * Set triangle from preset types
     */
    setPreset(type) {
        switch(type) {
            case 'equilateral':
                this.setAngles(60, 60);
                break;
            case 'right':
                this.setAngles(90, 45);
                break;
            case 'isosceles':
                this.setAngles(70, 55);
                break;
            case 'acute':
                this.setAngles(80, 60);
                break;
            case 'obtuse':
                this.setAngles(120, 30);
                break;
        }
    }

    /**
     * Set angles A and B, automatically calculate C
     */
    setAngles(angleA, angleB) {
        this.angleA = Math.max(5, Math.min(170, angleA));
        this.angleB = Math.max(5, Math.min(170, angleB));
        this.angleC = 180 - this.angleA - this.angleB;

        // Ensure valid triangle
        if (this.angleC < 5) {
            this.angleC = 5;
            this.angleB = 175 - this.angleA;
        }

        this.calculateVertices();
    }

    /**
     * Calculate triangle vertices based on angles and size
     */
    calculateVertices() {
        // Place vertex A at origin relative to center
        // Vertex B along positive x-axis
        // Vertex C positioned to create specified angles

        const sideLength = this.size;

        // Convert angles to radians
        const radA = this.angleA * Math.PI / 180;
        const radB = this.angleB * Math.PI / 180;
        const radC = this.angleC * Math.PI / 180;

        // Use law of sines to calculate side lengths
        // a/sin(A) = b/sin(B) = c/sin(C)
        const sideA = sideLength; // side opposite to angle A (BC)
        const sideB = sideA * Math.sin(radB) / Math.sin(radA); // side opposite to angle B (AC)
        const sideC = sideA * Math.sin(radC) / Math.sin(radA); // side opposite to angle C (AB)

        // Position vertices
        // A at origin (relative to center)
        this.vertexA = new Complex(0, 0);

        // B along x-axis
        this.vertexB = new Complex(sideC, 0);

        // C using angle A from vertex A
        this.vertexC = new Complex(
            sideB * Math.cos(radA),
            sideB * Math.sin(radA)
        );

        // Center the triangle around the centroid
        const centroid = this.vertexA.add(this.vertexB).add(this.vertexC).divide(3);
        this.vertexA = this.vertexA.subtract(centroid);
        this.vertexB = this.vertexB.subtract(centroid);
        this.vertexC = this.vertexC.subtract(centroid);
    }

    /**
     * Get world coordinates of vertices
     */
    getWorldVertices() {
        return {
            A: this.vertexA.add(this.center),
            B: this.vertexB.add(this.center),
            C: this.vertexC.add(this.center)
        };
    }

    /**
     * Transform triangle vertices using a complex function
     */
    getTransformedVertices(transformFunction) {
        const world = this.getWorldVertices();
        try {
            return {
                A: transformFunction(world.A),
                B: transformFunction(world.B),
                C: transformFunction(world.C)
            };
        } catch (error) {
            console.warn('Triangle transformation error:', error);
            return {
                A: new Complex(NaN, NaN),
                B: new Complex(NaN, NaN),
                C: new Complex(NaN, NaN)
            };
        }
    }

    /**
     * Calculate angle at each vertex given three points
     */
    static calculateAngle(center, point1, point2) {
        const v1 = point1.subtract(center);
        const v2 = point2.subtract(center);

        // Calculate angle using dot product and cross product
        const dot = v1.real * v2.real + v1.imag * v2.imag;
        const cross = v1.real * v2.imag - v1.imag * v2.real;

        let angle = Math.atan2(cross, dot) * 180 / Math.PI;
        if (angle < 0) angle += 360;
        if (angle > 180) angle = 360 - angle;

        return angle;
    }

    /**
     * Get measured angles from transformed vertices
     */
    getMeasuredAngles(vertices) {
        if (!vertices || !vertices.A || !vertices.B || !vertices.C) {
            return { A: NaN, B: NaN, C: NaN };
        }

        // Check for NaN vertices
        if (!isFinite(vertices.A.real) || !isFinite(vertices.A.imag) ||
            !isFinite(vertices.B.real) || !isFinite(vertices.B.imag) ||
            !isFinite(vertices.C.real) || !isFinite(vertices.C.imag)) {
            return { A: NaN, B: NaN, C: NaN };
        }

        return {
            A: Triangle.calculateAngle(vertices.A, vertices.B, vertices.C),
            B: Triangle.calculateAngle(vertices.B, vertices.A, vertices.C),
            C: Triangle.calculateAngle(vertices.C, vertices.A, vertices.B)
        };
    }

    /**
     * Set center position
     */
    setCenter(center) {
        this.center = center;
    }

    /**
     * Set size
     */
    setSize(size) {
        this.size = Math.max(0.1, Math.min(2.0, size));
        this.calculateVertices();
    }

    /**
     * Set visibility
     */
    setVisible(visible) {
        this.visible = visible;
    }

    /**
     * Set angle display
     */
    setShowAngles(show) {
        this.showAngles = show;
    }
}