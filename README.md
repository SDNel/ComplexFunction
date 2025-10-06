# Complex Function Visualizer

A sophisticated web application for visualizing the action of complex functions on the complex plane.

## Features

### Dual Window Interface
- **Domain Window**: Shows the complex plane with grid lines (dark grey), radial lines (blue), and concentric circles (dark green)
- **Range Window**: Displays the transformed complex plane showing how the function maps the domain elements

### Function Input & Parsing
- Accepts standard mathematical notation: `z^2`, `(a*z + b)/(c*z + d)`, `sin(z)`, etc.
- Automatic parameter detection with dynamic slider generation
- Real-time parameter adjustment with immediate visual feedback

### Visualization Modes
1. **Immediate Mode**: Instantly shows the complete transformation
2. **Parametric Mode**: Animated transformation that unfolds over time with adjustable speed

### Interactive Controls
- **Mouse Controls**: Pan and zoom in both windows using mouse drag and scroll wheel
- **Parameter Sliders**: Dynamically generated based on detected function parameters
- **Animation Controls**: Play/pause, speed adjustment, and reset for parametric mode

### Export Functionality
- **SVG Export**: Publication-quality vector graphics
- **PNG Export**: High-resolution raster images suitable for presentations

## Supported Functions

### Basic Operations
- Polynomials: `z^n`, `a*z^2 + b*z + c`
- Power functions: `z^n` where n can be complex
- Reciprocal: `1/z`

### Transcendental Functions
- Exponential: `exp(z)`, `exp(a*z)`
- Trigonometric: `sin(z)`, `cos(z)`
- Logarithm: `log(z)`
- Square root: `sqrt(z)`

### Special Functions
- **Möbius Transformations**: `(a*z + b)/(c*z + d)`
- **Joukowsky Transform**: `z + 1/z`
- **Complex argument**: `arg(z)`
- **Absolute value**: `abs(z)`

### Function Examples
Try these examples by typing them into the function input:

```
z^2                    # Simple quadratic
z^3                    # Cubic function
1/z                    # Reciprocal/inversion
sqrt(z)                # Square root
exp(z)                 # Complex exponential
sin(z)                 # Complex sine
(z + 1/z)/2           # Real part of Joukowsky
(a*z + b)/(c*z + d)   # Möbius transformation
z^n                    # Variable power (n becomes slider)
a*z^2 + b*z + c       # General quadratic with parameters
```

## Usage Instructions

1. **Open the Application**: Load `index.html` in a modern web browser
2. **Enter a Function**: Type a mathematical expression in the function input field
3. **Adjust Parameters**: Use the automatically generated sliders to modify function parameters
4. **Choose Visualization Mode**:
   - Select "Immediate" for instant transformation view
   - Select "Parametric" for animated transformation
5. **Interact with Views**:
   - Drag to pan the view
   - Scroll to zoom in/out
   - View coordinates and scale in the info display
6. **Export Results**: Use the export buttons to save publication-quality images

## Technical Details

### Architecture
- **Complex Number System**: Full complex arithmetic with support for all standard operations
- **Expression Parser**: Recursive descent parser with operator precedence
- **Rendering Engine**: HTML5 Canvas with efficient grid and curve rendering
- **Animation System**: RequestAnimationFrame-based smooth animations

### Browser Compatibility
- Modern browsers with HTML5 Canvas support
- Chrome, Firefox, Safari, Edge (latest versions)
- Responsive design works on tablets and desktops

### Performance
- Optimized rendering with adaptive grid spacing
- Efficient complex number calculations
- Smooth 60fps animations in parametric mode

## Mathematical Background

The visualizer helps understand complex function behavior by showing how they transform geometric objects:

- **Grid Lines**: Show how the function affects the rectangular coordinate system
- **Radial Lines**: Reveal rotational and scaling properties
- **Concentric Circles**: Display how the function maps circles to other curves

This approach provides intuitive understanding of:
- Conformal mappings and angle preservation
- Singularities and branch cuts
- Function composition and iteration
- Parameter effects on transformation behavior

## Development

The application is built with vanilla JavaScript and consists of:

- `index.html`: Main application structure
- `styles.css`: Responsive styling and layout
- `complex.js`: Complex number arithmetic library
- `parser.js`: Mathematical expression parser
- `renderer.js`: Canvas rendering system
- `app.js`: Main application controller

No external dependencies required - runs entirely in the browser.