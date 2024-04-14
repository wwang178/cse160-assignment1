// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    uniform float u_Size;
    void main() {
        gl_Position = a_Position;
        gl_PointSize = u_Size;
    }`;

// Fragment shader program
var FSHADER_SOURCE = `
    precision mediump float;
    uniform vec4 u_FragColor;
    void main() {
        gl_FragColor = u_FragColor;
    }`;

let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;

function setupWebGL() {
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.enable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // // Get the storage location of a_Position
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }

    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }

    u_Size = gl.getUniformLocation(gl.program, 'u_Size');
    if (!u_Size) {
        console.log('Failed to get the storage location of u_Size');
        return;
    }
}

// Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// Global UI elements
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 5;
let g_selectedType = POINT;
let g_selectedCircleSegments = 5;

let mouseX = 0;
let mouseY = 0;

function addActionsForHtmlUI() {
    // Buttons
    document.getElementById('green').onclick = function () { g_selectedColor = [0.0, 1.0, 0.0, 1.0] }
    document.getElementById('red').onclick = function () { g_selectedColor = [1.0, 0.0, 0.0, 1.0] }
    document.getElementById('clearButton').onclick = function () { g_shapesList = []; renderAllShapes(); }

    document.getElementById('pointButton').onclick = function () { g_selectedType = POINT; }
    document.getElementById('triButton').onclick = function () { g_selectedType = TRIANGLE; }
    document.getElementById('circleButton').onclick = function () { g_selectedType = CIRCLE; }

    // Color Sliders
    document.getElementById('redSlide').addEventListener('mouseup', function () { g_selectedColor[0] = this.value / 100 })
    document.getElementById('greenSlide').addEventListener('mouseup', function () { g_selectedColor[1] = this.value / 100 })
    document.getElementById('blueSlide').addEventListener('mouseup', function () { g_selectedColor[2] = this.value / 100 })
    document.getElementById('alphaSlide').addEventListener('mouseup', function () { g_selectedColor[3] = this.value / 100 })

    // Size Sliders
    document.getElementById('sizeSlide').addEventListener('mouseup', function () { g_selectedSize = this.value })
    document.getElementById('circleSegmentsSlide').addEventListener('mouseup', function () { g_selectedCircleSegments = this.value })

    // Undo
    document.getElementById('undoButton').onclick = function () { g_shapesList.pop(); renderAllShapes(); }

    document.getElementById('drawPictureButton').onclick = function () { drawPicture(); renderAllShapes(); }
}

function main() {

    setupWebGL();
    connectVariablesToGLSL();
    addActionsForHtmlUI();

    // Register function (event handler) to be called on a mouse press
    canvas.onmousedown = click;
    canvas.onmousemove = function (ev) { mouseX = ev.clientX; mouseY = ev.clientY; if (ev.buttons == 1) { click(ev); } };

    // Preview shape
    document.addEventListener('keydown', function (ev) { if (ev.shiftKey) { ev.clientX = mouseX; ev.clientY = mouseY; onShiftKey(ev); } });
    document.addEventListener('keyup', function (ev) { if (ev.key == 'Shift') { g_previewShape = null; renderAllShapes(); } });

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);
}

var g_shapesList = [];
var g_previewShape;

function click(ev) {
    let [x, y] = convertCoordinatesEventToGL(ev);

    let point;
    if (g_selectedType == POINT) {
        point = new Point();
    }
    else if (g_selectedType == TRIANGLE) {
        point = new Triangle();
    }
    else {
        point = new Circle();
        point.segments = g_selectedCircleSegments;
    }
    point.position = [x, y];
    point.color = g_selectedColor.slice();
    point.size = g_selectedSize;
    g_shapesList.push(point);

    renderAllShapes();
}

function onShiftKey(ev) {
    let [x, y] = convertCoordinatesEventToGL(ev);

    let point;
    if (g_selectedType == POINT) {
        point = new Point();
    }
    else if (g_selectedType == TRIANGLE) {
        point = new Triangle();
    }
    else {
        point = new Circle();
        point.segments = g_selectedCircleSegments;
    }
    point.position = [x, y];
    point.color = g_selectedColor.slice();
    point.size = g_selectedSize;
    g_previewShape = point;

    renderAllShapes();
}

function convertCoordinatesEventToGL(ev) {
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
    y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

    return ([x, y]);
}

function renderAllShapes() {
    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    var len = g_shapesList.length;
    for (var i = 0; i < len; i++) {
        g_shapesList[i].render();
    }
    if (g_previewShape != null)
        g_previewShape.render();
}

function drawPicture() {
    var mainColor = [1.0, 0.0, 0.0, 1.0];
    var eyeColor = [0.32, 0.32, 0.32, 1.0];
    var pictureX = 22;
    var pictureY = 12;
    // it probably would have made more sense to put these coordinates in a different file and load them

    // left arm
    var t1 = new Triangle(); t1.color = mainColor; t1.customVertices = triangleGridToGL([0.0, 9.0, 1.0, 12.0, 2.0, 8.0], pictureX, pictureY); g_shapesList.push(t1);
    var t2 = new Triangle(); t2.color = mainColor; t2.customVertices = triangleGridToGL([1.0, 12.0, 3.0, 10.0, 2.0, 8.0], pictureX, pictureY); g_shapesList.push(t2);
    var t3 = new Triangle(); t3.color = mainColor; t3.customVertices = triangleGridToGL([2.0, 8.0, 3.0, 10.0, 4.0, 8.0], pictureX, pictureY); g_shapesList.push(t3);
    var t4 = new Triangle(); t4.color = mainColor; t4.customVertices = triangleGridToGL([3.0, 10.0, 5.0, 12.0, 4.0, 8.0], pictureX, pictureY); g_shapesList.push(t4);
    var t5 = new Triangle(); t5.color = mainColor; t5.customVertices = triangleGridToGL([4.0, 8.0, 5.0, 12.0, 6.0, 9.0], pictureX, pictureY); g_shapesList.push(t5);
    var t6 = new Triangle(); t6.color = mainColor; t6.customVertices = triangleGridToGL([2.0, 7.0, 2.0, 8.0, 4.0, 7.0], pictureX, pictureY); g_shapesList.push(t6);
    var t7 = new Triangle(); t7.color = mainColor; t7.customVertices = triangleGridToGL([2.0, 8.0, 4.0, 8.0, 4.0, 7.0], pictureX, pictureY); g_shapesList.push(t7);
    var t8 = new Triangle(); t8.color = mainColor; t8.customVertices = triangleGridToGL([4.0, 7.0, 4.0, 8.0, 6.0, 7.0], pictureX, pictureY); g_shapesList.push(t8);
    var t9 = new Triangle(); t9.color = mainColor; t9.customVertices = triangleGridToGL([2.0, 7.0, 6.0, 7.0, 6.0, 5.0], pictureX, pictureY); g_shapesList.push(t9);

    // right arm
    var t10 = new Triangle(); t10.color = mainColor; t10.customVertices = triangleGridToGL([16.0, 9.0, 17.0, 12.0, 18.0, 8.0], pictureX, pictureY); g_shapesList.push(t10);
    var t11 = new Triangle(); t11.color = mainColor; t11.customVertices = triangleGridToGL([17.0, 12.0, 19.0, 10.0, 18.0, 8.0], pictureX, pictureY); g_shapesList.push(t11);
    var t12 = new Triangle(); t12.color = mainColor; t12.customVertices = triangleGridToGL([18.0, 8.0, 19.0, 10.0, 20.0, 8.0], pictureX, pictureY); g_shapesList.push(t12);
    var t13 = new Triangle(); t13.color = mainColor; t13.customVertices = triangleGridToGL([19.0, 10.0, 21.0, 12.0, 20.0, 8.0], pictureX, pictureY); g_shapesList.push(t13);
    var t14 = new Triangle(); t14.color = mainColor; t14.customVertices = triangleGridToGL([20.0, 8.0, 21.0, 12.0, 22.0, 9.0], pictureX, pictureY); g_shapesList.push(t14);
    var t15 = new Triangle(); t15.color = mainColor; t15.customVertices = triangleGridToGL([16.0, 7.0, 18.0, 8.0, 18.0, 7.0], pictureX, pictureY); g_shapesList.push(t15);
    var t16 = new Triangle(); t16.color = mainColor; t16.customVertices = triangleGridToGL([18.0, 7.0, 18.0, 8.0, 20.0, 8.0], pictureX, pictureY); g_shapesList.push(t16);
    var t17 = new Triangle(); t17.color = mainColor; t17.customVertices = triangleGridToGL([18.0, 7.0, 20.0, 8.0, 20.0, 7.0], pictureX, pictureY); g_shapesList.push(t17);
    var t18 = new Triangle(); t18.color = mainColor; t18.customVertices = triangleGridToGL([16.0, 5.0, 16.0, 7.0, 20.0, 7.0], pictureX, pictureY); g_shapesList.push(t18);

    // body
    var t19 = new Triangle(); t19.color = mainColor; t19.customVertices = triangleGridToGL([6.0, 2.0, 6.0, 8.0, 16.0, 2.0], pictureX, pictureY); g_shapesList.push(t19);
    var t20 = new Triangle(); t20.color = mainColor; t20.customVertices = triangleGridToGL([6.0, 8.0, 16.0, 8.0, 16.0, 2.0], pictureX, pictureY); g_shapesList.push(t20);

    // eyes (they are grey since if they were black they would blend in to the background)
    var t21 = new Triangle(); t21.color = eyeColor; t21.customVertices = triangleGridToGL([8.0, 8.0, 8.0, 10.0, 9.0, 8.0], pictureX, pictureY); g_shapesList.push(t21);
    var t22 = new Triangle(); t22.color = eyeColor; t22.customVertices = triangleGridToGL([8.0, 10.0, 9.0, 10.0, 9.0, 8.0], pictureX, pictureY); g_shapesList.push(t22);
    var t23 = new Triangle(); t23.color = eyeColor; t23.customVertices = triangleGridToGL([13.0, 8.0, 13.0, 10.0, 14.0, 8.0], pictureX, pictureY); g_shapesList.push(t23);
    var t24 = new Triangle(); t24.color = eyeColor; t24.customVertices = triangleGridToGL([13.0, 10.0, 14.0, 10.0, 14.0, 8.0], pictureX, pictureY); g_shapesList.push(t24);

    // left upper leg
    var t25 = new Triangle(); t25.color = mainColor; t25.customVertices = triangleGridToGL([2.0, 0.0, 2.0, 2.0, 4.0, 4.0], pictureX, pictureY); g_shapesList.push(t25);
    var t26 = new Triangle(); t26.color = mainColor; t26.customVertices = triangleGridToGL([2.0, 0.0, 4.0, 4.0, 4.0, 2.0], pictureX, pictureY); g_shapesList.push(t26);
    var t27 = new Triangle(); t27.color = mainColor; t27.customVertices = triangleGridToGL([4.0, 2.0, 4.0, 4.0, 6.0, 5.0], pictureX, pictureY); g_shapesList.push(t27);
    var t28 = new Triangle(); t28.color = mainColor; t28.customVertices = triangleGridToGL([4.0, 2.0, 6.0, 5.0, 6.0, 3.0], pictureX, pictureY); g_shapesList.push(t28);

    // left lower leg
    var t29 = new Triangle(); t29.color = mainColor; t29.customVertices = triangleGridToGL([3.0, 0.0, 4.0, 1.0, 6.0, 1.0], pictureX, pictureY); g_shapesList.push(t29);
    var t30 = new Triangle(); t30.color = mainColor; t30.customVertices = triangleGridToGL([3.0, 0.0, 6.0, 1.0, 5.0, 0.0], pictureX, pictureY); g_shapesList.push(t30);
    var t31 = new Triangle(); t31.color = mainColor; t31.customVertices = triangleGridToGL([4.0, 1.0, 6.0, 2.0, 6.0, 1.0], pictureX, pictureY); g_shapesList.push(t31);
    var t32 = new Triangle(); t32.color = mainColor; t32.customVertices = triangleGridToGL([6.0, 1.0, 6.0, 2.0, 8.0, 2.0], pictureX, pictureY); g_shapesList.push(t32);

    // right upper leg
    var t33 = new Triangle(); t33.color = mainColor; t33.customVertices = triangleGridToGL([16.0, 3.0, 16.0, 5.0, 18.0, 2.0], pictureX, pictureY); g_shapesList.push(t33);
    var t34 = new Triangle(); t34.color = mainColor; t34.customVertices = triangleGridToGL([16.0, 5.0, 18.0, 4.0, 18.0, 2.0], pictureX, pictureY); g_shapesList.push(t34);
    var t35 = new Triangle(); t35.color = mainColor; t35.customVertices = triangleGridToGL([18.0, 2.0, 18.0, 4.0, 20.0, 0.0], pictureX, pictureY); g_shapesList.push(t35);
    var t36 = new Triangle(); t36.color = mainColor; t36.customVertices = triangleGridToGL([18.0, 4.0, 20.0, 2.0, 20.0, 0.0], pictureX, pictureY); g_shapesList.push(t36);

    // right lower leg
    var t37 = new Triangle(); t37.color = mainColor; t37.customVertices = triangleGridToGL([14.0, 2.0, 16.0, 2.0, 16.0, 1.0], pictureX, pictureY); g_shapesList.push(t37);
    var t38 = new Triangle(); t38.color = mainColor; t38.customVertices = triangleGridToGL([16.0, 1.0, 16.0, 2.0, 18.0, 1.0], pictureX, pictureY); g_shapesList.push(t38);
    var t39 = new Triangle(); t39.color = mainColor; t39.customVertices = triangleGridToGL([16.0, 1.0, 19.0, 0.0, 17.0, 0.0], pictureX, pictureY); g_shapesList.push(t39);
    var t40 = new Triangle(); t40.color = mainColor; t40.customVertices = triangleGridToGL([16.0, 1.0, 18.0, 1.0, 19.0, 0.0], pictureX, pictureY); g_shapesList.push(t40);
}

function triangleGridToGL(triangleCoords, gridX, gridY) {
    var p1 = gridToGL([triangleCoords[0], triangleCoords[1]], gridX, gridY);
    var p2 = gridToGL([triangleCoords[2], triangleCoords[3]], gridX, gridY);
    var p3 = gridToGL([triangleCoords[4], triangleCoords[5]], gridX, gridY);
    return [p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]]
}

function gridToGL(gridCoords, gridX, gridY) {
    var largerGridAxis;
    if (gridX > gridY)
        largerGridAxis = gridX;
    else
        largerGridAxis = gridY;
    var x = (gridCoords[0] / largerGridAxis) * 2 - 1
    var y = (gridCoords[1] / largerGridAxis) * 2 - 1

    return ([x, y]);
}
