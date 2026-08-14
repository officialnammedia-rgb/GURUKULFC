/* --------------------------------------------------------------------------
   Neural Noise WebGL Background Shader Module
   Interactive mouse & scroll-driven WebGL neural network background
   -------------------------------------------------------------------------- */

const vertShaderSource = `
precision mediump float;
varying vec2 vUv;
attribute vec2 a_position;

void main() {
    vUv = .5 * (a_position + 1.);
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const fragShaderSource = `
precision mediump float;

varying vec2 vUv;
uniform float u_time;
uniform float u_ratio;
uniform vec2 u_pointer_position;
uniform float u_scroll_progress;

vec2 rotate(vec2 uv, float th) {
    return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
}

float neuro_shape(vec2 uv, float t, float p) {
    vec2 sine_acc = vec2(0.);
    vec2 res = vec2(0.);
    float scale = 8.;

    for (int j = 0; j < ITERATIONS; j++) {
        uv = rotate(uv, 1.);
        sine_acc = rotate(sine_acc, 1.);
        vec2 layer = uv * scale + float(j) + sine_acc - t;
        sine_acc += sin(layer) + 2.4 * p;
        res += (.5 + .5 * cos(layer)) / scale;
        scale *= (1.2);
    }
    return res.x + res.y;
}

void main() {
    vec2 uv = .5 * vUv;
    uv.x *= u_ratio;

    vec2 pointer = vUv - u_pointer_position;
    pointer.x *= u_ratio;
    float p = clamp(length(pointer), 0., 1.);
    p = .5 * pow(1. - p, 2.);

    float t = .001 * u_time;
    vec3 color = vec3(0.);

    float noise = neuro_shape(uv, t, p);

    noise = 1.2 * pow(noise, 3.);
    noise += pow(noise, 10.);
    noise = max(.0, noise - .5);
    noise *= (1. - length(vUv - .5));

    // Blue/indigo color palette matching exact reference shader
    color = vec3(0.1, 0.2, 0.8); // Base blue color
    color += vec3(0.0, 0.1, 0.4) * sin(3.0 * u_scroll_progress + 1.5); // Indigo variation

    color = color * noise;

    gl_FragColor = vec4(color, noise);
}
`;

export function initNeuralNoise() {
  const canvasEl = document.querySelector("canvas#neuro");
  if (!canvasEl) return;

  const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;
  // Skip WebGL entirely on mobile — canvas is hidden via CSS, no GPU waste
  if (isMobile) return;
  // Cap DPR at 1 on mobile for massive GPU savings
  const devicePixelRatio = isMobile ? 1 : Math.min(window.devicePixelRatio, 2);
  const pointer = {
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.5,
    tX: window.innerWidth * 0.5,
    tY: window.innerHeight * 0.5,
  };

  let uniforms = {};
  let gl = null;
  let animFrameId = null;
  let isVisible = true;
  // Throttle to ~30fps on mobile
  const frameBudget = isMobile ? 33.3 : 0;
  let lastFrameTime = 0;

  try {
    gl = initShader();
  } catch (err) {
    console.warn("Neural Noise WebGL initialization skipped:", err);
    return;
  }

  if (!gl) return;

  setupEvents();
  resizeCanvas();

  // Debounce resize for perf
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resizeCanvas, 150);
  });

  // Pause rendering when tab is hidden
  document.addEventListener('visibilitychange', () => {
    isVisible = !document.hidden;
    if (isVisible && !animFrameId) {
      lastFrameTime = 0;
      animFrameId = requestAnimationFrame(render);
    }
  });

  animFrameId = requestAnimationFrame(render);

  function initShader() {
    const webgl = canvasEl.getContext("webgl", { alpha: true, antialias: false, powerPreference: 'low-power' }) || canvasEl.getContext("experimental-webgl", { alpha: true, antialias: false, powerPreference: 'low-power' });
    if (!webgl) return null;

    // Inject iteration count based on device capability
    const iterations = isMobile ? 8 : 15;
    const fragSource = fragShaderSource.replace('ITERATIONS', String(iterations));

    function createShader(glCtx, sourceCode, type) {
      const shader = glCtx.createShader(type);
      glCtx.shaderSource(shader, sourceCode);
      glCtx.compileShader(shader);

      if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
        console.error("Shader Compile Error:", glCtx.getShaderInfoLog(shader));
        glCtx.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertexShader = createShader(webgl, vertShaderSource, webgl.VERTEX_SHADER);
    const fragmentShader = createShader(webgl, fragSource, webgl.FRAGMENT_SHADER);

    if (!vertexShader || !fragmentShader) return null;

    const program = webgl.createProgram();
    webgl.attachShader(program, vertexShader);
    webgl.attachShader(program, fragmentShader);
    webgl.linkProgram(program);

    if (!webgl.getProgramParameter(program, webgl.LINK_STATUS)) {
      console.error("Shader Program Link Error:", webgl.getProgramInfoLog(program));
      return null;
    }

    webgl.useProgram(program);

    // Collect uniforms
    const uniformCount = webgl.getProgramParameter(program, webgl.ACTIVE_UNIFORMS);
    for (let i = 0; i < uniformCount; i++) {
      const uniformName = webgl.getActiveUniform(program, i).name;
      uniforms[uniformName] = webgl.getUniformLocation(program, uniformName);
    }

    const vertices = new Float32Array([-1., -1., 1., -1., -1., 1., 1., 1.]);
    const vertexBuffer = webgl.createBuffer();
    webgl.bindBuffer(webgl.ARRAY_BUFFER, vertexBuffer);
    webgl.bufferData(webgl.ARRAY_BUFFER, vertices, webgl.STATIC_DRAW);

    const positionLocation = webgl.getAttribLocation(program, "a_position");
    webgl.enableVertexAttribArray(positionLocation);
    webgl.bindBuffer(webgl.ARRAY_BUFFER, vertexBuffer);
    webgl.vertexAttribPointer(positionLocation, 2, webgl.FLOAT, false, 0, 0);

    return webgl;
  }

  function render(timestamp) {
    if (!gl || !isVisible) {
      animFrameId = null;
      return;
    }

    // Throttle on mobile
    if (frameBudget > 0 && timestamp - lastFrameTime < frameBudget) {
      animFrameId = requestAnimationFrame(render);
      return;
    }
    lastFrameTime = timestamp;

    pointer.x += (pointer.tX - pointer.x) * 0.2;
    pointer.y += (pointer.tY - pointer.y) * 0.2;

    const scrollProgress = window.pageYOffset / (2 * window.innerHeight);

    gl.uniform1f(uniforms.u_time, timestamp);
    gl.uniform2f(uniforms.u_pointer_position, pointer.x / window.innerWidth, 1 - pointer.y / window.innerHeight);
    gl.uniform1f(uniforms.u_scroll_progress, scrollProgress);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    animFrameId = requestAnimationFrame(render);
  }

  function resizeCanvas() {
    if (!gl) return;
    canvasEl.width = window.innerWidth * devicePixelRatio;
    canvasEl.height = window.innerHeight * devicePixelRatio;
    gl.uniform1f(uniforms.u_ratio, canvasEl.width / canvasEl.height);
    gl.viewport(0, 0, canvasEl.width, canvasEl.height);
  }

  function setupEvents() {
    window.addEventListener("pointermove", e => {
      updateMousePosition(e.clientX, e.clientY);
    }, { passive: true });
    window.addEventListener("touchmove", e => {
      if (e.targetTouches && e.targetTouches[0]) {
        updateMousePosition(e.targetTouches[0].clientX, e.targetTouches[0].clientY);
      }
    }, { passive: true });
    window.addEventListener("click", e => {
      updateMousePosition(e.clientX, e.clientY);
    });

    function updateMousePosition(eX, eY) {
      pointer.tX = eX;
      pointer.tY = eY;
    }
  }
}
