/**
 * Complex number arithmetic utilities
 */
class Complex {
    constructor(real = 0, imag = 0) {
        this.real = real;
        this.imag = imag;
    }

    static fromPolar(r, theta) {
        return new Complex(r * Math.cos(theta), r * Math.sin(theta));
    }

    // Basic arithmetic
    add(other) {
        if (typeof other === 'number') {
            return new Complex(this.real + other, this.imag);
        }
        return new Complex(this.real + other.real, this.imag + other.imag);
    }

    subtract(other) {
        if (typeof other === 'number') {
            return new Complex(this.real - other, this.imag);
        }
        return new Complex(this.real - other.real, this.imag - other.imag);
    }

    multiply(other) {
        if (typeof other === 'number') {
            return new Complex(this.real * other, this.imag * other);
        }
        return new Complex(
            this.real * other.real - this.imag * other.imag,
            this.real * other.imag + this.imag * other.real
        );
    }

    divide(other) {
        if (typeof other === 'number') {
            return new Complex(this.real / other, this.imag / other);
        }
        const denominator = other.real * other.real + other.imag * other.imag;
        return new Complex(
            (this.real * other.real + this.imag * other.imag) / denominator,
            (this.imag * other.real - this.real * other.imag) / denominator
        );
    }

    // Properties
    magnitude() {
        return Math.sqrt(this.real * this.real + this.imag * this.imag);
    }

    argument() {
        return Math.atan2(this.imag, this.real);
    }

    conjugate() {
        return new Complex(this.real, -this.imag);
    }

    // Powers and functions
    power(n) {
        if (typeof n === 'number' && Number.isInteger(n)) {
            if (n === 0) return new Complex(1, 0);
            if (n === 1) return new Complex(this.real, this.imag);
            if (n === -1) return new Complex(1, 0).divide(this);

            let result = new Complex(1, 0);
            let base = new Complex(this.real, this.imag);
            let exp = Math.abs(n);

            while (exp > 0) {
                if (exp % 2 === 1) {
                    result = result.multiply(base);
                }
                base = base.multiply(base);
                exp = Math.floor(exp / 2);
            }

            return n < 0 ? new Complex(1, 0).divide(result) : result;
        } else {
            // General complex power using z^w = exp(w * log(z))
            const logZ = this.log();
            const wLogZ = typeof n === 'number' ? logZ.multiply(n) : logZ.multiply(n);
            return wLogZ.exp();
        }
    }

    log() {
        return new Complex(Math.log(this.magnitude()), this.argument());
    }

    exp() {
        const expReal = Math.exp(this.real);
        return new Complex(expReal * Math.cos(this.imag), expReal * Math.sin(this.imag));
    }

    sin() {
        // sin(z) = (e^(iz) - e^(-iz)) / (2i)
        const iz = new Complex(-this.imag, this.real);
        const negIz = new Complex(this.imag, -this.real);
        const eIz = iz.exp();
        const eNegIz = negIz.exp();
        return eIz.subtract(eNegIz).divide(new Complex(0, 2));
    }

    cos() {
        // cos(z) = (e^(iz) + e^(-iz)) / 2
        const iz = new Complex(-this.imag, this.real);
        const negIz = new Complex(this.imag, -this.real);
        const eIz = iz.exp();
        const eNegIz = negIz.exp();
        return eIz.add(eNegIz).divide(2);
    }

    sqrt() {
        const r = this.magnitude();
        const theta = this.argument();
        const sqrtR = Math.sqrt(r);
        return Complex.fromPolar(sqrtR, theta / 2);
    }

    // String representation
    toString() {
        if (Math.abs(this.imag) < 1e-10) {
            return this.real.toFixed(3);
        }
        if (Math.abs(this.real) < 1e-10) {
            return `${this.imag.toFixed(3)}i`;
        }
        const imagSign = this.imag >= 0 ? '+' : '';
        return `${this.real.toFixed(3)}${imagSign}${this.imag.toFixed(3)}i`;
    }

    clone() {
        return new Complex(this.real, this.imag);
    }
}

// Common complex functions
const ComplexFunctions = {
    // Möbius transformation: (az + b) / (cz + d)
    mobius: (z, a, b, c, d) => {
        const numerator = z.multiply(a).add(b);
        const denominator = z.multiply(c).add(d);
        return numerator.divide(denominator);
    },

    // Identity
    identity: (z) => z.clone(),

    // Polynomial
    polynomial: (z, coefficients) => {
        let result = new Complex(0, 0);
        for (let i = 0; i < coefficients.length; i++) {
            const term = z.power(i).multiply(coefficients[i]);
            result = result.add(term);
        }
        return result;
    },

    // Reciprocal
    reciprocal: (z) => new Complex(1, 0).divide(z),

    // Argument function
    arg: (z) => new Complex(z.argument(), 0),

    // Absolute value
    abs: (z) => new Complex(z.magnitude(), 0),

    // Real part
    real: (z) => new Complex(z.real, 0),

    // Imaginary part
    imag: (z) => new Complex(z.imag, 0),

    // Conjugate
    conj: (z) => z.conjugate()
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Complex, ComplexFunctions };
}