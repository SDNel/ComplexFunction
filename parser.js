/**
 * Mathematical expression parser for complex functions
 */
class FunctionParser {
    constructor() {
        this.parameters = new Map();
        this.tokens = [];
        this.position = 0;
    }

    // Parse a mathematical expression and return a function
    parse(expression) {
        this.parameters.clear();
        this.tokens = this.tokenize(expression);
        this.position = 0;

        try {
            const ast = this.parseExpression();
            const func = this.compileFunction(ast);
            return {
                function: func,
                parameters: Array.from(this.parameters.keys()),
                expression: expression
            };
        } catch (error) {
            throw new Error(`Parse error: ${error.message}`);
        }
    }

    // Tokenize the input expression
    tokenize(expression) {
        const tokens = [];
        let i = 0;

        while (i < expression.length) {
            const char = expression[i];

            // Skip whitespace but don't remove it completely - use it as implicit multiplication cue
            if (/\s/.test(char)) {
                i++;
                continue;
            }

            if (/[0-9]/.test(char)) {
                // Number
                let num = '';
                while (i < expression.length && /[0-9.]/.test(expression[i])) {
                    num += expression[i];
                    i++;
                }
                tokens.push({ type: 'number', value: parseFloat(num) });
            } else if (/[a-zA-Z]/.test(char)) {
                // Identifier (function or variable) - but be careful about single letters
                let id = '';

                // For mathematical expressions, prefer single-letter variables
                // Check if this could be a known function first
                let possibleFunction = '';
                let tempI = i;
                while (tempI < expression.length && /[a-zA-Z]/.test(expression[tempI])) {
                    possibleFunction += expression[tempI];
                    tempI++;
                }

                const knownFunctions = ['sin', 'cos', 'exp', 'log', 'sqrt', 'abs', 'arg', 'real', 'imag', 'conj'];

                if (knownFunctions.includes(possibleFunction)) {
                    // It's a known function, take the whole thing
                    id = possibleFunction;
                    i = tempI;
                } else {
                    // Take only single letter for mathematical variables
                    id = char;
                    i++;
                }

                tokens.push({ type: 'identifier', value: id });
            } else if (char === '+') {
                tokens.push({ type: 'operator', value: '+' });
                i++;
            } else if (char === '-') {
                tokens.push({ type: 'operator', value: '-' });
                i++;
            } else if (char === '*') {
                tokens.push({ type: 'operator', value: '*' });
                i++;
            } else if (char === '/') {
                tokens.push({ type: 'operator', value: '/' });
                i++;
            } else if (char === '^') {
                tokens.push({ type: 'operator', value: '^' });
                i++;
            } else if (char === '(') {
                tokens.push({ type: 'lparen', value: '(' });
                i++;
            } else if (char === ')') {
                tokens.push({ type: 'rparen', value: ')' });
                i++;
            } else if (char === ',') {
                tokens.push({ type: 'comma', value: ',' });
                i++;
            } else {
                throw new Error(`Unexpected character: ${char}`);
            }
        }

        // Insert implicit multiplication tokens
        return this.insertImplicitMultiplication(tokens);
    }

    // Insert implicit multiplication where needed
    insertImplicitMultiplication(tokens) {
        const result = [];

        for (let i = 0; i < tokens.length; i++) {
            const current = tokens[i];
            const next = tokens[i + 1];

            result.push(current);

            if (next && this.shouldInsertMultiplication(current, next)) {
                result.push({ type: 'operator', value: '*' });
            }
        }

        return result;
    }

    // Determine if implicit multiplication should be inserted
    shouldInsertMultiplication(current, next) {
        // Number followed by identifier: 2z -> 2*z
        if (current.type === 'number' && next.type === 'identifier') {
            return true;
        }

        // Identifier followed by number: z2 -> z*2 (but be careful with function names)
        if (current.type === 'identifier' && next.type === 'number') {
            // Don't insert if current looks like a function name that might take arguments
            const knownFunctions = ['sin', 'cos', 'exp', 'log', 'sqrt', 'abs', 'arg', 'real', 'imag', 'conj'];
            if (!knownFunctions.includes(current.value)) {
                return true;
            }
        }

        // Identifier followed by identifier: az -> a*z
        if (current.type === 'identifier' && next.type === 'identifier') {
            // Special case: don't split known function names
            const combined = current.value + next.value;
            const knownFunctions = ['sin', 'cos', 'exp', 'log', 'sqrt', 'abs', 'arg', 'real', 'imag', 'conj'];
            if (!knownFunctions.includes(combined)) {
                return true;
            }
        }

        // Number/identifier followed by opening parenthesis: 2(x) -> 2*(x), a(x) -> a*(x)
        if ((current.type === 'number' || current.type === 'identifier') && next.type === 'lparen') {
            // Don't insert if current is a known function name
            if (current.type === 'identifier') {
                const knownFunctions = ['sin', 'cos', 'exp', 'log', 'sqrt', 'abs', 'arg', 'real', 'imag', 'conj'];
                if (knownFunctions.includes(current.value)) {
                    return false;
                }
            }
            return true;
        }

        // Closing parenthesis followed by number/identifier: (x)2 -> (x)*2, (x)y -> (x)*y
        if (current.type === 'rparen' && (next.type === 'number' || next.type === 'identifier')) {
            return true;
        }

        // Closing parenthesis followed by opening parenthesis: (x)(y) -> (x)*(y)
        if (current.type === 'rparen' && next.type === 'lparen') {
            return true;
        }

        return false;
    }

    // Parse expression with operator precedence
    parseExpression() {
        return this.parseAddSub();
    }

    parseAddSub() {
        let left = this.parseMulDiv();

        while (this.position < this.tokens.length &&
               this.tokens[this.position].type === 'operator' &&
               (this.tokens[this.position].value === '+' || this.tokens[this.position].value === '-')) {
            const operator = this.tokens[this.position].value;
            this.position++;
            const right = this.parseMulDiv();
            left = { type: 'binary', operator, left, right };
        }

        return left;
    }

    parseMulDiv() {
        let left = this.parsePower();

        while (this.position < this.tokens.length &&
               this.tokens[this.position].type === 'operator' &&
               (this.tokens[this.position].value === '*' || this.tokens[this.position].value === '/')) {
            const operator = this.tokens[this.position].value;
            this.position++;
            const right = this.parsePower();
            left = { type: 'binary', operator, left, right };
        }

        return left;
    }

    parsePower() {
        let left = this.parseUnary();

        if (this.position < this.tokens.length &&
            this.tokens[this.position].type === 'operator' &&
            this.tokens[this.position].value === '^') {
            const operator = this.tokens[this.position].value;
            this.position++;
            const right = this.parsePower(); // Right associative
            left = { type: 'binary', operator, left, right };
        }

        return left;
    }

    parseUnary() {
        if (this.position < this.tokens.length &&
            this.tokens[this.position].type === 'operator' &&
            this.tokens[this.position].value === '-') {
            this.position++;
            const operand = this.parseUnary();
            return { type: 'unary', operator: '-', operand };
        }

        return this.parsePrimary();
    }

    parsePrimary() {
        if (this.position >= this.tokens.length) {
            throw new Error('Unexpected end of expression');
        }

        const token = this.tokens[this.position];

        if (token.type === 'number') {
            this.position++;
            return { type: 'number', value: token.value };
        }

        if (token.type === 'identifier') {
            const name = token.value;
            this.position++;

            // Check if it's a function call
            if (this.position < this.tokens.length && this.tokens[this.position].type === 'lparen') {
                this.position++; // consume '('
                const args = [];

                if (this.position < this.tokens.length && this.tokens[this.position].type !== 'rparen') {
                    args.push(this.parseExpression());

                    while (this.position < this.tokens.length && this.tokens[this.position].type === 'comma') {
                        this.position++; // consume ','
                        args.push(this.parseExpression());
                    }
                }

                if (this.position >= this.tokens.length || this.tokens[this.position].type !== 'rparen') {
                    throw new Error('Expected closing parenthesis');
                }
                this.position++; // consume ')'

                return { type: 'function', name, args };
            }

            // Variable or parameter
            if (name === 'z') {
                return { type: 'variable', name: 'z' };
            } else if (name === 'i') {
                return { type: 'number', value: new Complex(0, 1) };
            } else {
                // Assume it's a parameter
                this.parameters.set(name, 1); // Default value
                return { type: 'parameter', name };
            }
        }

        if (token.type === 'lparen') {
            this.position++; // consume '('
            const expr = this.parseExpression();

            if (this.position >= this.tokens.length || this.tokens[this.position].type !== 'rparen') {
                throw new Error('Expected closing parenthesis');
            }
            this.position++; // consume ')'

            return expr;
        }

        throw new Error(`Unexpected token: ${token.value}`);
    }

    // Compile AST to JavaScript function
    compileFunction(ast) {
        const code = this.generateCode(ast);

        // Create function with parameters
        const paramNames = Array.from(this.parameters.keys());
        const funcStr = `
            return function(z, params = {}) {
                const Complex = window.Complex;
                const ComplexFunctions = window.ComplexFunctions;

                try {
                    return ${code};
                } catch (error) {
                    return new Complex(NaN, NaN);
                }
            };
        `;

        return new Function(funcStr)();
    }

    generateCode(node) {
        switch (node.type) {
            case 'number':
                if (node.value instanceof Complex) {
                    return `new Complex(${node.value.real}, ${node.value.imag})`;
                }
                return `new Complex(${node.value}, 0)`;

            case 'variable':
                return 'z';

            case 'parameter':
                return `params.${node.name} || new Complex(1, 0)`;

            case 'binary':
                const left = this.generateCode(node.left);
                const right = this.generateCode(node.right);

                switch (node.operator) {
                    case '+':
                        return `(${left}).add(${right})`;
                    case '-':
                        return `(${left}).subtract(${right})`;
                    case '*':
                        return `(${left}).multiply(${right})`;
                    case '/':
                        return `(${left}).divide(${right})`;
                    case '^':
                        return `(${left}).power(${right})`;
                    default:
                        throw new Error(`Unknown operator: ${node.operator}`);
                }

            case 'unary':
                const operand = this.generateCode(node.operand);
                switch (node.operator) {
                    case '-':
                        return `new Complex(0, 0).subtract(${operand})`;
                    default:
                        throw new Error(`Unknown unary operator: ${node.operator}`);
                }

            case 'function':
                const args = node.args.map(arg => this.generateCode(arg));

                // Built-in functions
                switch (node.name) {
                    case 'sin':
                        return `(${args[0]}).sin()`;
                    case 'cos':
                        return `(${args[0]}).cos()`;
                    case 'exp':
                        return `(${args[0]}).exp()`;
                    case 'log':
                        return `(${args[0]}).log()`;
                    case 'sqrt':
                        return `(${args[0]}).sqrt()`;
                    case 'abs':
                        return `ComplexFunctions.abs(${args[0]})`;
                    case 'arg':
                        return `ComplexFunctions.arg(${args[0]})`;
                    case 'real':
                        return `ComplexFunctions.real(${args[0]})`;
                    case 'imag':
                        return `ComplexFunctions.imag(${args[0]})`;
                    case 'conj':
                        return `ComplexFunctions.conj(${args[0]})`;
                    default:
                        throw new Error(`Unknown function: ${node.name}`);
                }

            default:
                throw new Error(`Unknown node type: ${node.type}`);
        }
    }

    // Get default parameter values
    getDefaultParameters() {
        const defaults = {};

        // Special defaults for Möbius transformation parameters
        const mobiusDefaults = {
            'a': new Complex(2, 0),  // Re(a) = 2, Im(a) = 0
            'b': new Complex(1, 0),  // Re(b) = 1, Im(b) = 0
            'c': new Complex(1, 0),  // Re(c) = 1, Im(c) = 0
            'd': new Complex(1, 0)   // Re(d) = 1, Im(d) = 0
        };

        for (const [name, value] of this.parameters) {
            if (mobiusDefaults.hasOwnProperty(name)) {
                defaults[name] = mobiusDefaults[name];
            } else {
                defaults[name] = new Complex(value, 0);
            }
        }
        return defaults;
    }

    // Parse common function templates
    static parseTemplate(template) {
        const templates = {
            'mobius': {
                expression: '(a*z + b)/(c*z + d)',
                defaultParams: { a: 1, b: 0, c: 0, d: 1 }
            },
            'polynomial': {
                expression: 'a*z^n + b',
                defaultParams: { a: 1, b: 0, n: 2 }
            },
            'exponential': {
                expression: 'exp(a*z)',
                defaultParams: { a: 1 }
            },
            'power': {
                expression: 'z^n',
                defaultParams: { n: 2 }
            }
        };

        return templates[template] || null;
    }
}

// Make available globally
window.FunctionParser = FunctionParser;