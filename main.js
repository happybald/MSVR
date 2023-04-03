'use strict';

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.
let sphere;
let userPointCoord;
let userScaleFactor;
let texture, textureCam, video, track, tris;

function deg2rad(angle) {
    return angle * Math.PI / 180;
}


// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iNormalBuffer = gl.createBuffer();
    this.iTextureBuffer = gl.createBuffer();
    this.countT = 0;
    this.count = 0;

    this.BufferData = function (vertices) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

        this.count = vertices.length / 3;
    }

    this.NormalBufferData = function (normals) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STREAM_DRAW);

        this.count = normals.length / 3;
    }

    this.TextureBufferData = function (points) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STREAM_DRAW);

        this.countT = points.length / 2;
    }

    this.Draw = function () {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.vertexAttribPointer(shProgram.iAttribNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribNormal);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuffer);
        gl.vertexAttribPointer(shProgram.iAttribTexture, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribTexture);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.count);
    }

    this.DrawPoint = function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);
        gl.drawArrays(gl.LINE_STRIP, 0, this.count);
    }
    this.DrawTris = function () {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuffer);
        gl.vertexAttribPointer(shProgram.iAttribTexture, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribTexture);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.count);
    }
}


// Constructor
function ShaderProgram(name, program) {

    this.name = name;
    this.prog = program;

    // Location of the attribute variable in the shader program.
    this.iAttribVertex = -1;
    this.iAttribNormal = -1;
    this.iAttribTexture = -1;
    // Location of the uniform specifying a color for the primitive.
    this.iColor = -1;
    // Location of the uniform matrix representing the combined transformation.
    this.iModelViewProjectionMatrix = -1;
    this.iNormalMatrix = -1;
    this.lightPosLoc = -1;

    this.iTMU = -1;

    this.iUserPoint = -1;
    this.iScale = 1.0;
    this.iUP = -1;

    this.Use = function () {
        gl.useProgram(this.prog);
    }
}


/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
function draw() {
    let D = document;
    let spans = D.getElementsByClassName("slider-value");

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* Set the values of the projection transformation */
    let projection = m4.perspective(Math.PI / 32, 1, 8, 12);
    // let projection = m4.orthographic(-10, 10, -10, 10, -10, 10);
    let conv, // convergence
        eyes, // eye separation
        ratio, // aspect ratio
        fov; // field of view
    conv = 2000.0;
    conv = D.getElementById("conv").value;
    spans[3].innerHTML = conv;
    eyes = 70.0;
    eyes = D.getElementById("eyes").value;
    spans[0].innerHTML = eyes;
    ratio = 1.0;
    fov = Math.PI / 4;
    fov = D.getElementById("fov").value;
    spans[1].innerHTML = fov;
    let top, bottom, left, right, near, far;
    near = 5.0;
    near = D.getElementById("near").value - 0.0;
    spans[2].innerHTML = near;
    far = 2000.0;

    top = near * Math.tan(fov / 2.0);
    bottom = -top;

    let a = ratio * Math.tan(fov / 2.0) * conv;

    let b = a - eyes / 2;
    let c = a + eyes / 2;

    left = -b * near / conv;
    right = c * near / conv;

    // console.log(left, right, bottom, top, near, far);

    let projectionLeft = m4.orthographic(left, right, bottom, top, near, far);

    left = -c * near / conv;
    right = b * near / conv;

    let projectionRight = m4.orthographic(left, right, bottom, top, near, far);
    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.0);
    let translateToPointZero = m4.translation(0, 0, -10);
    let translateToLeft = m4.translation(-0.03, 0, -10);
    let translateToRight = m4.translation(0.03, 0, -10);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView);
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0);
    let matAccumLeft = m4.multiply(translateToLeft, matAccum0);
    let matAccumRight = m4.multiply(translateToRight, matAccum0);

    /* Multiply the projection matrix times the modelview matrix to give the
       combined transformation matrix, and send that to the shader program. */
    let modelViewProjection = m4.multiply(projection, matAccum1);

    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);

    let modelviewInv = new Float32Array(16);
    let normalmatrix = new Float32Array(16);
    mat4Invert(modelViewProjection, modelviewInv);
    mat4Transpose(modelviewInv, normalmatrix);

    gl.uniformMatrix4fv(shProgram.iNormalMatrix, false, normalmatrix);

    /* Draw the six faces of a cube, with different colors. */
    gl.uniform4fv(shProgram.iColor, [0.2, 0.8, 0, 1]);
    gl.uniform3fv(shProgram.lightPosLoc, [20 * Math.cos(Date.now() * 0.005), 1, 20 * Math.sin(Date.now() * 0.005)]);
    gl.uniform1i(shProgram.iTMU, 0);
    gl.enable(gl.TEXTURE_2D);
    gl.uniform1f(shProgram.iScale, -1.0)
    let matStill = m4.multiply(rotateToPointZero, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    let matAccumStill = m4.multiply(translateToPointZero, matStill);
    let translateWebCam = m4.translation(-0.5, -0.5, 0);
    let matAccumStill1 = m4.multiply(translateWebCam, matAccumStill);
    modelViewProjection = m4.multiply(projection, matAccumStill1);
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);
    gl.bindTexture(gl.TEXTURE_2D, textureCam);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        video
    );
    tris.DrawTris();

    gl.uniform1f(shProgram.iScale, 1.0)
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniformMatrix4fv(shProgram.iModelViewMatrix, false, matAccumRight);
    gl.uniformMatrix4fv(shProgram.iProjectionMatrix, false, projectionRight);
    gl.colorMask(true, false, false, false);
    surface.Draw();

    gl.clear(gl.DEPTH_BUFFER_BIT);

    gl.uniformMatrix4fv(shProgram.iModelViewMatrix, false, matAccumLeft);
    gl.uniformMatrix4fv(shProgram.iProjectionMatrix, false, projectionLeft);
    gl.colorMask(false, true, true, false);
    gl.uniform4fv(shProgram.iColor, [0.5, 0.3, 1.0, 1]);
    surface.Draw();

    gl.colorMask(true, true, true, true);
    // gl.uniform1f(shProgram.iScale, -1.0)
    // let a = 2 - 1;
    // let c = -2 * Math.PI * a / Math.tan(-0.5);
    // let b = 3 * c / 4;
    // let trS = cojugation(map(userPointCoord.x, 0, 1, 0, b), map(userPointCoord.y, 0, 1, 0, Math.PI * 2), a, c)
    // gl.uniform3fv(shProgram.iUP, [trS.x, trS.y, trS.z]);
    // sphere.DrawPoint();
    window.requestAnimationFrame(draw)
}

function dot(a, b) {
    let c = [(a[1] * b[2] - a[2] * b[1]), (a[0] * b[2] - b[0] * a[2]), (a[0] * b[1] - a[1] * b[0])]
    return c
}
function normalize(a) {
    let d = Math.sqrt(a[0] ** 2 + a[1] ** 2 + a[2] ** 2)
    let n = [a[0] / d, a[1] / d, a[2] / d]
    return n;
}

function CreateSurfaceData() {
    let vertexList = [];
    let i = 0;
    let j = 0;
    let a = 2 - 1
    let c = -2 * Math.PI * a / Math.tan(-0.5);
    // console.log(c)
    let b = 3 * c / 4
    // console.log(b)
    while (i < b) {
        while (j < Math.PI * 2) {
            let v1 = cojugation(i, j, a, c)
            let v2 = cojugation(i + 0.2, j, a, c)
            let v3 = cojugation(i, j + 0.2, a, c)
            let v4 = cojugation(i + 0.2, j + 0.2, a, c)
            vertexList.push(v1.x, v1.y, v1.z);
            vertexList.push(v2.x, v2.y, v2.z);
            vertexList.push(v3.x, v3.y, v3.z);
            vertexList.push(v2.x, v2.y, v2.z);
            vertexList.push(v4.x, v4.y, v4.z);
            vertexList.push(v3.x, v3.y, v3.z);
            j += 0.2
        }
        j = 0;
        i += 0.2
    }
    return vertexList;
}
function CreateNormData() {
    let normsList = [];
    let i = 0;
    let j = 0;
    let a = 2 - 1
    let c = -2 * Math.PI * a / Math.tan(-0.5);
    let b = 3 * c / 4
    while (i < b) {
        while (j < Math.PI * 2) {
            let v1 = cojugation(i, j, a, c)
            let v2 = cojugation(i + 0.2, j, a, c)
            let v3 = cojugation(i, j + 0.2, a, c)
            let v4 = cojugation(i + 0.2, j + 0.2, a, c)
            let v21 = { x: v2.x - v1.x, y: v2.y - v1.y, z: v2.z - v1.z }
            let v31 = { x: v3.x - v1.x, y: v3.y - v1.y, z: v3.z - v1.z }
            let n1 = vec3Cross(v21, v31);
            vec3Normalize(n1);
            normsList.push(n1.x, n1.y, n1.z);
            normsList.push(n1.x, n1.y, n1.z);
            normsList.push(n1.x, n1.y, n1.z);
            let v42 = { x: v4.x - v2.x, y: v4.y - v2.y, z: v4.z - v2.z };
            let v32 = { x: v3.x - v2.x, y: v3.y - v2.y, z: v3.z - v2.z };
            let n2 = vec3Cross(v42, v32);
            vec3Normalize(n2);
            normsList.push(n2.x, n2.y, n2.z);
            normsList.push(n2.x, n2.y, n2.z);
            normsList.push(n2.x, n2.y, n2.z);
            j += 0.2
        }
        j = 0;
        i += 0.2
    }
    return normsList;
}

function CreateTextureData() {
    let texCoordList = [];
    let i = 0;
    let j = 0;
    let a = 2 - 1
    let c = -2 * Math.PI * a / Math.tan(-0.5);
    let b = 3 * c / 4
    while (i < b) {
        while (j < Math.PI * 2) {
            let u = map(i, 0, b, 0, 1);
            let v = map(j, 0, Math.PI * 2, 0, 1);
            texCoordList.push(u, v);
            u = map(i + 0.2, 0, b, 0, 1);
            texCoordList.push(u, v);
            u = map(i, 0, b, 0, 1);
            v = map(j + 0.2, 0, Math.PI * 2, 0, 1);
            texCoordList.push(u, v);
            u = map(i + 0.2, 0, b, 0, 1);
            v = map(j, 0, Math.PI * 2, 0, 1);
            texCoordList.push(u, v);
            u = map(i + 0.2, 0, Math.PI, 0, 1);
            v = map(j + 0.2, 0, Math.PI * 2, 0, 1);
            texCoordList.push(u, v);
            u = map(i, 0, b, 0, 1);
            v = map(j + 0.2, 0, Math.PI * 2, 0, 1);
            texCoordList.push(u, v);
            j += 0.2;
        }
        j = 0
        i += 0.2;
    }
    return texCoordList;
}

function CreateSphereSurface(r = 0.1) {
    let vertexList = [];
    let lon = -Math.PI;
    let lat = -Math.PI * 0.5;
    while (lon < Math.PI) {
        while (lat < Math.PI * 0.5) {
            let v1 = sphereSurfaceData(r, lon, lat);
            vertexList.push(v1.x, v1.y, v1.z);
            lat += 0.05;
        }
        lat = -Math.PI * 0.5
        lon += 0.05;
    }
    return vertexList;
}

function sphereSurfaceData(r, u, v) {
    let x = r * Math.sin(u) * Math.cos(v);
    let y = r * Math.sin(u) * Math.sin(v);
    let z = r * Math.cos(u);
    return { x: x, y: y, z: z };
}


function cojugation(z, b, a, c) {

    let r = a * (1 - Math.cos(Math.PI * 2 * z / c)) + 1;
    let t = 0.25 * Math.PI;
    let x = 0.2 * r * Math.cos(b);
    let y = 0.2 * r * Math.sin(b)
    let z1 = 0.2 * z
    return { x: x, y: y, z: z1 }
}

function map(val, f1, t1, f2, t2) {
    let m;
    m = (val - f1) * (t2 - f2) / (t1 - f1) + f2
    return Math.min(Math.max(m, f2), t2);
}

function vec3Cross(a, b) {
    let x = a.y * b.z - b.y * a.z;
    let y = a.z * b.x - b.z * a.x;
    let z = a.x * b.y - b.x * a.y;
    return { x: x, y: y, z: z }
}

function vec3Normalize(a) {
    var mag = Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
    a[0] /= mag; a[1] /= mag; a[2] /= mag;
}

/* Initialize the WebGL context. Called from init() */
function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iAttribNormal = gl.getAttribLocation(prog, "normal");
    shProgram.iAttribTexture = gl.getAttribLocation(prog, "texture");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iNormalMatrix = gl.getUniformLocation(prog, "NormalMatrix");
    shProgram.iModelViewMatrix = gl.getUniformLocation(prog, "ModelViewMatrix");
    shProgram.iProjectionMatrix = gl.getUniformLocation(prog, "ProjectionMatrix");
    shProgram.iColor = gl.getUniformLocation(prog, "color");
    shProgram.lightPosLoc = gl.getUniformLocation(prog, "lightPosition");
    shProgram.iTMU = gl.getUniformLocation(prog, 'tmu');
    shProgram.iUserPoint = gl.getUniformLocation(prog, 'userPoint');
    shProgram.iScale = gl.getUniformLocation(prog, 'scl');
    shProgram.iUP = gl.getUniformLocation(prog, 'translateUP');

    surface = new Model('Surface');
    surface.BufferData(CreateSurfaceData());
    surface.NormalBufferData(CreateNormData());
    LoadTexture();
    surface.TextureBufferData(CreateTextureData());
    sphere = new Model('Sphere');
    sphere.BufferData(CreateSphereSurface())


    tris = new Model('WebCam');
    tris.BufferData([0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0]);
    tris.TextureBufferData([1, 1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 1]);
    gl.enable(gl.DEPTH_TEST);
}


/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type Error is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 * The second and third parameters are strings that contain the
 * source code for the vertex shader and for the fragment shader.
 */
function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vShader);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
    }
    let fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}


/**
 * initialization function that will be called when the page has loaded
 */
function init() {
    userPointCoord = { x: 0.5, y: 0.5 }
    userScaleFactor = 1.0;
    let canvas;
    try {
        let resolution = Math.min(window.innerHeight, window.innerWidth);
        canvas = document.querySelector('canvas');
        gl = canvas.getContext("webgl");
        canvas.width = resolution;
        canvas.height = resolution;
        gl.viewport(0, 0, resolution, resolution);
        video = document.createElement('video');
        video.setAttribute('autoplay', true);
        window.vid = video;
        getWebcam();
        textureCam = CreateWebCamTexture();
        if (!gl) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.querySelector('"canvas-holder"').innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        initGL();  // initialize the WebGL graphics context
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    spaceball = new TrackballRotator(canvas, draw, 0);

    // window.requestAnimationFrame(draw_);
    draw()
}

function mat4Transpose(a, transposed) {
    var t = 0;
    for (var i = 0; i < 4; ++i) {
        for (var j = 0; j < 4; ++j) {
            transposed[t++] = a[j * 4 + i];
        }
    }
}

function mat4Invert(m, inverse) {
    var inv = new Float32Array(16);
    inv[0] = m[5] * m[10] * m[15] - m[5] * m[11] * m[14] - m[9] * m[6] * m[15] +
        m[9] * m[7] * m[14] + m[13] * m[6] * m[11] - m[13] * m[7] * m[10];
    inv[4] = -m[4] * m[10] * m[15] + m[4] * m[11] * m[14] + m[8] * m[6] * m[15] -
        m[8] * m[7] * m[14] - m[12] * m[6] * m[11] + m[12] * m[7] * m[10];
    inv[8] = m[4] * m[9] * m[15] - m[4] * m[11] * m[13] - m[8] * m[5] * m[15] +
        m[8] * m[7] * m[13] + m[12] * m[5] * m[11] - m[12] * m[7] * m[9];
    inv[12] = -m[4] * m[9] * m[14] + m[4] * m[10] * m[13] + m[8] * m[5] * m[14] -
        m[8] * m[6] * m[13] - m[12] * m[5] * m[10] + m[12] * m[6] * m[9];
    inv[1] = -m[1] * m[10] * m[15] + m[1] * m[11] * m[14] + m[9] * m[2] * m[15] -
        m[9] * m[3] * m[14] - m[13] * m[2] * m[11] + m[13] * m[3] * m[10];
    inv[5] = m[0] * m[10] * m[15] - m[0] * m[11] * m[14] - m[8] * m[2] * m[15] +
        m[8] * m[3] * m[14] + m[12] * m[2] * m[11] - m[12] * m[3] * m[10];
    inv[9] = -m[0] * m[9] * m[15] + m[0] * m[11] * m[13] + m[8] * m[1] * m[15] -
        m[8] * m[3] * m[13] - m[12] * m[1] * m[11] + m[12] * m[3] * m[9];
    inv[13] = m[0] * m[9] * m[14] - m[0] * m[10] * m[13] - m[8] * m[1] * m[14] +
        m[8] * m[2] * m[13] + m[12] * m[1] * m[10] - m[12] * m[2] * m[9];
    inv[2] = m[1] * m[6] * m[15] - m[1] * m[7] * m[14] - m[5] * m[2] * m[15] +
        m[5] * m[3] * m[14] + m[13] * m[2] * m[7] - m[13] * m[3] * m[6];
    inv[6] = -m[0] * m[6] * m[15] + m[0] * m[7] * m[14] + m[4] * m[2] * m[15] -
        m[4] * m[3] * m[14] - m[12] * m[2] * m[7] + m[12] * m[3] * m[6];
    inv[10] = m[0] * m[5] * m[15] - m[0] * m[7] * m[13] - m[4] * m[1] * m[15] +
        m[4] * m[3] * m[13] + m[12] * m[1] * m[7] - m[12] * m[3] * m[5];
    inv[14] = -m[0] * m[5] * m[14] + m[0] * m[6] * m[13] + m[4] * m[1] * m[14] -
        m[4] * m[2] * m[13] - m[12] * m[1] * m[6] + m[12] * m[2] * m[5];
    inv[3] = -m[1] * m[6] * m[11] + m[1] * m[7] * m[10] + m[5] * m[2] * m[11] -
        m[5] * m[3] * m[10] - m[9] * m[2] * m[7] + m[9] * m[3] * m[6];
    inv[7] = m[0] * m[6] * m[11] - m[0] * m[7] * m[10] - m[4] * m[2] * m[11] +
        m[4] * m[3] * m[10] + m[8] * m[2] * m[7] - m[8] * m[3] * m[6];
    inv[11] = -m[0] * m[5] * m[11] + m[0] * m[7] * m[9] + m[4] * m[1] * m[11] -
        m[4] * m[3] * m[9] - m[8] * m[1] * m[7] + m[8] * m[3] * m[5];
    inv[15] = m[0] * m[5] * m[10] - m[0] * m[6] * m[9] - m[4] * m[1] * m[10] +
        m[4] * m[2] * m[9] + m[8] * m[1] * m[6] - m[8] * m[2] * m[5];

    var det = m[0] * inv[0] + m[1] * inv[4] + m[2] * inv[8] + m[3] * inv[12];
    if (det == 0) return false;
    det = 1.0 / det;
    for (var i = 0; i < 16; i++) inverse[i] = inv[i] * det;
    return true;
}

function LoadTexture() {
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 512, 512, 0, );

    const image = new Image();
    image.crossOrigin = 'anonymus';
    image.src = "https://raw.githubusercontent.com/IGSystemI/VGGI/CGW/txtr.png";
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            image
        );
        draw()
    }
}

function getWebcam() {
    navigator.getUserMedia({ video: true, audio: false }, function (stream) {
        video.srcObject = stream;
        track = stream.getTracks()[0];
    }, function (e) {
        console.error('Rejected!', e);
    });
}

function CreateWebCamTexture() {
    let textureID = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textureID);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return textureID;
}