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
    {name: "Stark", initial: 80, lookup: "raven"}
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
    if (name === "raven") {
      const promise = new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("The filter lookups could not be loaded."));
        image.src = "./assets/images/filters/filter_raven.png";
      });
      editor.filterlutpromises.set(name, promise);
      return promise;
    }
    if (!editor.filteratlas) {
      editor.filteratlas = new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("The filter lookups could not be loaded."));
        image.src = "./assets/images/filters/filter_atlas.png";
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
      "uniform float duallookup;",
      "uniform float enhanced;",
      "uniform float exposure;",
      "uniform float contrast;",
      "uniform float saturation;",
      "vec3 lookupcolor(vec3 point, float offset) {",
      "  vec3 scaled = point * 15.0;",
      "  float blue0 = floor(scaled.b);",
      "  float blue1 = blue0 + 1.0;",
      "  float blueamount = scaled.b - blue0;",
      "  vec2 base = scaled.rg + vec2(0.5);",
      "  float tablewidth = duallookup > 0.5 ? 32.0 : 16.0;",
      "  vec2 coord0 = (base + vec2(offset, blue0 * 16.0)) / vec2(tablewidth, 256.0);",
      "  vec2 coord1 = (base + vec2(offset, blue1 * 16.0)) / vec2(tablewidth, 256.0);",
      "  return mix(texture2D(lookuptable, coord0).rgb, texture2D(lookuptable, coord1).rgb, blueamount);",
      "}",
      "float skinmask(vec3 color) {",
      "  vec3 rgb = color * 255.0;",
      "  float cb = 128.0 - 0.168736 * rgb.r - 0.331264 * rgb.g + 0.5 * rgb.b;",
      "  float cr = 128.0 + 0.5 * rgb.r - 0.418688 * rgb.g - 0.081312 * rgb.b;",
      "  float light = dot(color, vec3(0.2126, 0.7152, 0.0722));",
      "  return (1.0 - smoothstep(15.0, 34.0, abs(cb - 105.0))) * (1.0 - smoothstep(13.0, 31.0, abs(cr - 153.0))) * smoothstep(0.08, 0.24, light);",
      "}",
      "void main() {",
      "  vec4 original = texture2D(sourceimage, uv);",
      "  vec3 color = original.rgb;",
      "  if (haslookup > 0.5) {",
      "    vec3 mapped = lookupcolor(color, 0.0);",
      "    if (duallookup > 0.5) mapped = mix(mapped, lookupcolor(color, 16.0), 1.0 - skinmask(color));",
      "    color = mix(color, mapped, amount);",
      "  }",
      "  if (enhanced > 0.5) {",
      "    color = (color - vec3(0.5)) * contrast + vec3(0.5 + exposure);",
      "    float lightness = dot(color, vec3(0.2126, 0.7152, 0.0722));",
      "    color = mix(vec3(lightness), color, saturation);",
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

  editor.measureenhancement = (source) => {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext("2d", {willReadFrequently: true});
    context.drawImage(source, 0, 0, 32, 32);
    const pixels = context.getImageData(0, 0, 32, 32).data;
    let light = 0;
    let lightsquared = 0;
    let color = 0;
    let count = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      const red = pixels[index] / 255;
      const green = pixels[index + 1] / 255;
      const blue = pixels[index + 2] / 255;
      const value = red * 0.2126 + green * 0.7152 + blue * 0.0722;
      light += value;
      lightsquared += value * value;
      color += Math.max(red, green, blue) - Math.min(red, green, blue);
      count++;
    }
    const average = light / count;
    const deviation = Math.sqrt(Math.max(0, lightsquared / count - average * average));
    const colorrange = color / count;
    return {
      exposure: Math.max(-0.06, Math.min(0.06, (0.48 - average) * 0.24)),
      contrast: 1 + Math.max(0, Math.min(0.1, (0.24 - deviation) * 0.55)),
      saturation: 1.02 + Math.max(0, Math.min(0.04, (0.12 - colorrange) * 0.2))
    };
  };

  editor.applyfiltercpu = (target, source, lutcanvas, amount, enhanced, shouldapply, enhancement) => {
    const width = source.width;
    const height = source.height;
    const context = source.getContext("2d", {willReadFrequently: true});
    const pixels = context.getImageData(0, 0, width, height);
    const output = new ImageData(width, height);
    const lookuptablewidth = lutcanvas?.width || 16;
    const lookup = lutcanvas?.getContext("2d", {willReadFrequently: true}).getImageData(0, 0, lookuptablewidth, 256);
    const lookupdata = lookup?.data;
    const sourcepixels = pixels.data;
    const outputpixels = output.data;
    const clamp = (value) => Math.max(0, Math.min(1, value));
    const sample = (red, green, blue, offset = 0) => {
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
        lookupdata[((blueindex * 16 + greenindex) * lookuptablewidth + offset + redindex) * 4 + component] / 255;
      const plane = (blueindex, component) => {
        const top = channel(red0, green0, blueindex, component) * (1 - redamount) + channel(red1, green0, blueindex, component) * redamount;
        const bottom = channel(red0, green1, blueindex, component) * (1 - redamount) + channel(red1, green1, blueindex, component) * redamount;
        return top * (1 - greenamount) + bottom * greenamount;
      };
      return [0, 1, 2].map((component) =>
        plane(blue0, component) * (1 - blueamount) + plane(blue1, component) * blueamount
      );
    };
    const skinmask = (color) => {
      const red = color[0] * 255;
      const green = color[1] * 255;
      const blue = color[2] * 255;
      const cb = 128 - 0.168736 * red - 0.331264 * green + 0.5 * blue;
      const cr = 128 + 0.5 * red - 0.418688 * green - 0.081312 * blue;
      const light = color[0] * 0.2126 + color[1] * 0.7152 + color[2] * 0.0722;
      const soft = (value, start, end) => {
        const point = Math.max(0, Math.min(1, (value - start) / (end - start)));
        return point * point * (3 - 2 * point);
      };
      return (1 - soft(Math.abs(cb - 105), 15, 34)) * (1 - soft(Math.abs(cr - 153), 13, 31)) * soft(light, 0.08, 0.24);
    };
    for (let index = 0; index < sourcepixels.length; index += 4) {
      const original = [sourcepixels[index] / 255, sourcepixels[index + 1] / 255, sourcepixels[index + 2] / 255];
      let mapped = original;
      if (lookupdata) {
        mapped = sample(original[0], original[1], original[2]);
        if (lookuptablewidth === 32) {
          const outside = sample(original[0], original[1], original[2], 16);
          const mask = skinmask(original);
          mapped = mapped.map((value, channel) => value * mask + outside[channel] * (1 - mask));
        }
      }
      const color = original.map((value, channel) => value + (mapped[channel] - value) * amount);
      if (enhanced) {
        for (let channel = 0; channel < 3; channel++) color[channel] = (color[channel] - 0.5) * enhancement.contrast + 0.5 + enhancement.exposure;
        const lightness = color[0] * 0.2126 + color[1] * 0.7152 + color[2] * 0.0722;
        for (let channel = 0; channel < 3; channel++) color[channel] = lightness + (color[channel] - lightness) * enhancement.saturation;
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
    const enhancement = enhanced ? editor.measureenhancement(source) : null;
    const renderer = editor.filterrenderer || (editor.filterrenderer = editor.createfilterrenderer());
    const gl = renderer?.gl;
    if (!renderer || width > gl.getParameter(gl.MAX_TEXTURE_SIZE) || height > gl.getParameter(gl.MAX_TEXTURE_SIZE)) {
      return editor.applyfiltercpu(target, source, lutcanvas, amount, enhanced, shouldapply, enhancement);
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
    gl.uniform1f(gl.getUniformLocation(renderer.program, "duallookup"), lutcanvas?.width === 32 ? 1 : 0);
    gl.uniform1f(gl.getUniformLocation(renderer.program, "enhanced"), enhanced ? 1 : 0);
    gl.uniform1f(gl.getUniformLocation(renderer.program, "exposure"), enhancement?.exposure || 0);
    gl.uniform1f(gl.getUniformLocation(renderer.program, "contrast"), enhancement?.contrast || 1);
    gl.uniform1f(gl.getUniformLocation(renderer.program, "saturation"), enhancement?.saturation || 1);
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
