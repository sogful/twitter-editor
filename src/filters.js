((editor) => {
  editor.filters = [
    {name: "No Filter", initial: 100, lookup: ""},
    {name: "Radiant", initial: 80, lookup: "exposure"},
    {name: "Positive", initial: 80, lookup: "positive"},
    {name: "Warm", initial: 80, lookup: "warm"},
    {name: "Breeze", initial: 80, lookup: "cool"},
    {name: "Glow", initial: 80, lookup: "balance"},
    {name: "Golden", initial: 80, lookup: "retro"},
    {name: "Fame", initial: 80, lookup: "x-pro"},
    {name: "Stark", initial: 100, lookup: "raven"}
  ];
  editor.filterlutpromises = new Map();
  editor.filteratlas = null;
  editor.filterrenderer = null;
  editor.filterpreviewversion = 0;

  /*//////////////////////////////////////////////////////////////////////*/

  editor.loadfilterlut = (name) => {
    if (editor.filterlutpromises.has(name)) return editor.filterlutpromises.get(name);
    const order = ["exposure", "positive", "warm", "cool", "balance", "retro", "x-pro", "raven"];
    const index = order.indexOf(name);
    if (index < 0) return Promise.reject(new Error("The requested filter lookup is unavailable."));
    if (!editor.filteratlas) {
      editor.filteratlas = new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("The filter lookups could not be loaded."));
        image.src = "./assets/filters/filter_atlas.png";
      });
    }
    const promise = editor.filteratlas.then((image) => {
      const canvas = document.createElement("canvas");
      canvas.width = 16;
      canvas.height = 256;
      canvas.getContext("2d").drawImage(image, index * 16, 0, 16, 256, 0, 0, 16, 256);
      return canvas;
    });
    editor.filterlutpromises.set(name, promise);
    return promise;
  };

  /*//////////////////////////////////////////////////////////////////////*/

  editor.createfilterrenderer = () => {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl", {alpha: true, premultipliedAlpha: false, preserveDrawingBuffer: true});
    if (!gl) return null;
    const vertexsource = "attribute vec2 position; attribute vec2 coordinate; varying vec2 uv; void main() { gl_Position = vec4(position, 0.0, 1.0); uv = coordinate; }";
    const fragmentsource = [
      "precision highp float;",
      "varying vec2 uv;",
      "uniform sampler2D sourceimage;",
      "uniform sampler2D lookuptable;",
      "uniform float amount;",
      "uniform float haslookup;",
      "uniform float enhanced;",
      "vec3 lookupcolor(vec3 point) {",
      "  vec3 scaled = point * 15.0;",
      "  float blue0 = floor(scaled.b);",
      "  float blue1 = blue0 + 1.0;",
      "  float blueamount = scaled.b - blue0;",
      "  vec2 base = scaled.rg + vec2(0.5);",
      "  vec2 coord0 = (base + vec2(0.0, blue0 * 16.0)) / vec2(16.0, 256.0);",
      "  vec2 coord1 = (base + vec2(0.0, blue1 * 16.0)) / vec2(16.0, 256.0);",
      "  return mix(texture2D(lookuptable, coord0).rgb, texture2D(lookuptable, coord1).rgb, blueamount);",
      "}",
      "void main() {",
      "  vec4 original = texture2D(sourceimage, uv);",
      "  vec3 color = original.rgb;",
      "  if (haslookup > 0.5) color = mix(color, lookupcolor(color), amount);",
      "  if (enhanced > 0.5) {",
      "    color *= 1.05;",
      "    color = (color - vec3(0.5)) * 1.08 + vec3(0.5);",
      "    float lightness = dot(color, vec3(0.2126, 0.7152, 0.0722));",
      "    color = mix(vec3(lightness), color, 1.04);",
      "  }",
      "  gl_FragColor = vec4(clamp(color, 0.0, 1.0), original.a);",
      "}"
    ].join("\n");
    const compile = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const message = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(message || "The filter renderer could not be initialized.");
      }
      return shader;
    };
    try {
      const program = gl.createProgram();
      gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexsource));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentsource));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
      gl.useProgram(program);
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1, 0, 1,
        1, -1, 1, 1,
        -1, 1, 0, 0,
        1, 1, 1, 0
      ]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, "position");
      const coordinate = gl.getAttribLocation(program, "coordinate");
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 16, 0);
      gl.enableVertexAttribArray(coordinate);
      gl.vertexAttribPointer(coordinate, 2, gl.FLOAT, false, 16, 8);
      const source = gl.createTexture();
      const lookup = gl.createTexture();
      for (const texture of [source, lookup]) {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      }
      gl.uniform1i(gl.getUniformLocation(program, "sourceimage"), 0);
      gl.uniform1i(gl.getUniformLocation(program, "lookuptable"), 1);
      return {canvas, gl, program, source, lookup};
    } catch {
      return null;
    }
  };

  /*//////////////////////////////////////////////////////////////////////*/

  editor.applyfiltercpu = (target, source, lutcanvas, amount, enhanced, shouldapply) => {
    const width = source.width;
    const height = source.height;
    const context = source.getContext("2d", {willReadFrequently: true});
    const pixels = context.getImageData(0, 0, width, height);
    const output = new ImageData(width, height);
    const lookup = lutcanvas?.getContext("2d", {willReadFrequently: true}).getImageData(0, 0, 16, 256);
    const lookupdata = lookup?.data;
    const sourcepixels = pixels.data;
    const outputpixels = output.data;
    const clamp = (value) => Math.max(0, Math.min(1, value));
    const sample = (red, green, blue) => {
      const redpoint = red * 15;
      const greenpoint = green * 15;
      const bluepoint = blue * 15;
      const red0 = Math.floor(redpoint);
      const green0 = Math.floor(greenpoint);
      const blue0 = Math.floor(bluepoint);
      const redamount = redpoint - red0;
      const greenamount = greenpoint - green0;
      const blueamount = bluepoint - blue0;
      const red1 = Math.min(15, red0 + 1);
      const green1 = Math.min(15, green0 + 1);
      const blue1 = Math.min(15, blue0 + 1);
      const channel = (redindex, greenindex, blueindex, component) =>
        lookupdata[((blueindex * 16 + greenindex) * 16 + redindex) * 4 + component] / 255;
      const plane = (blueindex, component) => {
        const top = channel(red0, green0, blueindex, component) * (1 - redamount) + channel(red1, green0, blueindex, component) * redamount;
        const bottom = channel(red0, green1, blueindex, component) * (1 - redamount) + channel(red1, green1, blueindex, component) * redamount;
        return top * (1 - greenamount) + bottom * greenamount;
      };
      return [0, 1, 2].map((component) =>
        plane(blue0, component) * (1 - blueamount) + plane(blue1, component) * blueamount
      );
    };
    for (let index = 0; index < sourcepixels.length; index += 4) {
      const original = [sourcepixels[index] / 255, sourcepixels[index + 1] / 255, sourcepixels[index + 2] / 255];
      const mapped = lookupdata ? sample(original[0], original[1], original[2]) : original;
      const color = original.map((value, channel) => value + (mapped[channel] - value) * amount);
      if (enhanced) {
        for (let channel = 0; channel < 3; channel++) color[channel] = (color[channel] * 1.05 - 0.5) * 1.08 + 0.5;
        const lightness = color[0] * 0.2126 + color[1] * 0.7152 + color[2] * 0.0722;
        for (let channel = 0; channel < 3; channel++) color[channel] = lightness + (color[channel] - lightness) * 1.04;
      }
      outputpixels[index] = Math.round(clamp(color[0]) * 255);
      outputpixels[index + 1] = Math.round(clamp(color[1]) * 255);
      outputpixels[index + 2] = Math.round(clamp(color[2]) * 255);
      outputpixels[index + 3] = sourcepixels[index + 3];
    }
    if (shouldapply()) target.getContext("2d").putImageData(output, 0, 0);
    return true;
  };

  /*//////////////////////////////////////////////////////////////////////*/

  editor.applyfilter = async (target, name, intensity, enhanced, source = target, shouldapply = () => true) => {
    const preset = editor.filters.find((item) => item.name === name) || editor.filters[0];
    const amount = Math.max(0, Math.min(100, intensity)) / 100;
    const lutcanvas = preset.lookup ? await editor.loadfilterlut(preset.lookup) : null;
    if (!lutcanvas && !enhanced) return false;
    const width = source.width;
    const height = source.height;
    if (!width || !height) return false;
    const renderer = editor.filterrenderer || (editor.filterrenderer = editor.createfilterrenderer());
    const gl = renderer?.gl;
    if (!renderer || width > gl.getParameter(gl.MAX_TEXTURE_SIZE) || height > gl.getParameter(gl.MAX_TEXTURE_SIZE)) {
      return editor.applyfiltercpu(target, source, lutcanvas, amount, enhanced, shouldapply);
    }
    const canvas = renderer.canvas;
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
    gl.useProgram(renderer.program);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, renderer.source);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, renderer.lookup);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, lutcanvas || source);
    gl.uniform1f(gl.getUniformLocation(renderer.program, "amount"), amount);
    gl.uniform1f(gl.getUniformLocation(renderer.program, "haslookup"), lutcanvas ? 1 : 0);
    gl.uniform1f(gl.getUniformLocation(renderer.program, "enhanced"), enhanced ? 1 : 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (shouldapply()) target.getContext("2d").drawImage(canvas, 0, 0, width, height);
    return true;
  };

  editor.cropratio = (name, width, height, rotation) => {
    if (name === "Square") return 1;
    if (name === "Wide") return 1.91;
    return Math.abs(rotation % 180) === 90 ? height / width : width / height;
  };
})(window.photoeditor);
