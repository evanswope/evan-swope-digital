/**
 * Spectral Light Leaks Experiment Card (experiments.html)
 * Interactive WebGL2 optical sandbox with CIE 1931 wavelength mixing,
 * 4 intersection physics modes, 3 render textures, live pause, and 1080p .JPG export.
 */
(() => {
  'use strict';

  const TARGET_PINK_SRGB = [255 / 255, 126 / 255, 179 / 255]; // #ff7eb3

  function srgbToLinear(c) {
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }

  function linearToSrgb(c) {
    const clamped = Math.max(0, Math.min(1, c));
    return clamped <= 0.0031308
      ? 12.92 * clamped
      : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
  }

  function rgbToHex(rgb) {
    return '#' + rgb
      .map(v => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0'))
      .join('');
  }

  const TARGET_PINK_LIN = TARGET_PINK_SRGB.map(srgbToLinear);

  // Wyman, Sloan & Shirley (2013) analytic CIE 1931 XYZ color matching fit
  function cieXYZ(wl) {
    const t1 = (wl - 442.0) * (wl < 442.0 ? 0.0624 : 0.0374);
    const t2 = (wl - 599.8) * (wl < 599.8 ? 0.0264 : 0.0323);
    const t3 = (wl - 501.1) * (wl < 501.1 ? 0.0490 : 0.0382);
    const x =
      0.362 * Math.exp(-0.5 * t1 * t1) +
      1.056 * Math.exp(-0.5 * t2 * t2) -
      0.065 * Math.exp(-0.5 * t3 * t3);

    const u1 = (wl - 568.8) * (wl < 568.8 ? 0.0213 : 0.0247);
    const u2 = (wl - 530.9) * (wl < 530.9 ? 0.0613 : 0.0322);
    const y =
      0.821 * Math.exp(-0.5 * u1 * u1) +
      0.286 * Math.exp(-0.5 * u2 * u2);

    const v1 = (wl - 437.0) * (wl < 437.0 ? 0.0845 : 0.0278);
    const v2 = (wl - 459.0) * (wl < 459.0 ? 0.0385 : 0.0725);
    const z =
      1.217 * Math.exp(-0.5 * v1 * v1) +
      0.681 * Math.exp(-0.5 * v2 * v2);

    return [x, y, z];
  }

  function wavelengthBandLinearRGB(centerNm, sigmaNm) {
    let X = 0, Y = 0, Z = 0;
    const samples = 19;
    const halfSpan = Math.max(sigmaNm, 2) * 2.5;
    for (let i = 0; i < samples; i++) {
      const t = (i / (samples - 1)) * 2 - 1;
      const wl = centerNm + t * halfSpan;
      const w = Math.exp(-0.5 * Math.pow((wl - centerNm) / Math.max(sigmaNm, 1), 2));
      const [x, y, z] = cieXYZ(wl);
      X += x * w; Y += y * w; Z += z * w;
    }
    const r = Math.max(0,  3.2406 * X - 1.5372 * Y - 0.4986 * Z);
    const g = Math.max(0, -0.9689 * X + 1.8758 * Y + 0.0415 * Z);
    const b = Math.max(0,  0.0557 * X - 0.2040 * Y + 1.0570 * Z);
    const m = Math.max(r, g, b, 1e-6);
    return [r / m, g / m, b / m];
  }

  function solveWeights(c1, c2, target) {
    const a11 = c1[0]*c1[0] + c1[1]*c1[1] + c1[2]*c1[2];
    const a22 = c2[0]*c2[0] + c2[1]*c2[1] + c2[2]*c2[2];
    const a12 = c1[0]*c2[0] + c1[1]*c2[1] + c1[2]*c2[2];
    const b1 = c1[0]*target[0] + c1[1]*target[1] + c1[2]*target[2];
    const b2 = c2[0]*target[0] + c2[1]*target[1] + c2[2]*target[2];
    const det = a11 * a22 - a12 * a12;
    let w1 = 0.45, w2 = 1.0;
    if (det > 1e-8) {
      w1 = Math.max(0.05, (b1 * a22 - b2 * a12) / det);
      w2 = Math.max(0.05, (a11 * b2 - a12 * b1) / det);
    }
    return { w1, w2 };
  }

  function findBestPartnerWavelength(wl1, sigma) {
    const c1 = wavelengthBandLinearRGB(wl1, sigma);
    let best = null;
    for (let wl2 = 390; wl2 <= 690; wl2 += 1) {
      if (Math.abs(wl2 - wl1) < 35) continue;
      const c2 = wavelengthBandLinearRGB(wl2, sigma);
      const { w1, w2 } = solveWeights(c1, c2, TARGET_PINK_LIN);
      const sum = [w1*c1[0] + w2*c2[0], w1*c1[1] + w2*c2[1], w1*c1[2] + w2*c2[2]];
      const err = Math.hypot(sum[0] - TARGET_PINK_LIN[0], sum[1] - TARGET_PINK_LIN[1], sum[2] - TARGET_PINK_LIN[2]);
      if (!best || err < best.err) {
        best = { wl2, err, w1, w2 };
      }
    }
    return best;
  }

  function initLightLeakExperiment() {
    const canvas = document.getElementById('ll-canvas');
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      powerPreference: 'default',
    });

    if (!gl) {
      const stage = canvas.parentElement;
      if (stage) {
        stage.innerHTML = '<p style="padding:2rem;color:#ff7eb3;text-align:center;font-family:Space Mono,monospace;font-size:0.85rem;">WebGL2 is required to run this optical shader experiment.</p>';
      }
      return;
    }

    const vsSource = `#version 300 es
      in vec2 a_pos;
      void main() {
        gl_Position = vec4(a_pos, 0.0, 1.0);
      }
    `;

    const fsSource = `#version 300 es
      precision highp float;
      out vec4 fragColor;

      uniform vec2  u_resolution;
      uniform float u_time;
      uniform vec2  u_mouse;
      uniform vec3  u_bgLinear;

      uniform vec3  u_c1Low;
      uniform vec3  u_c1Mid;
      uniform vec3  u_c1High;
      uniform float u_w1;

      uniform vec3  u_c2Low;
      uniform vec3  u_c2Mid;
      uniform vec3  u_c2High;
      uniform float u_w2;

      uniform float u_stretch;
      uniform float u_warp;
      uniform float u_dispersion;
      uniform float u_cross;       // 0 = unified refractive fringe, 1 = independent crossing beams
      uniform float u_exposure;
      uniform float u_pixelSize;
      uniform int   u_mixMode;     // 0=Additive, 1=Thin-Film Interference, 2=Overburn Screen, 3=Dichroic Gel
      uniform int   u_style;       // 0=Film Haze, 1=Bayer Risograph, 2=Iso-Contours
      uniform vec2  u_seeds;

      vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float snoise(vec3 v) {
        const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i  = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod(i, 289.0);
        vec4 p = permute(permute(permute(
                  i.z + vec4(0.0, i1.z, i2.z, 1.0))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 1.0 / 7.0;
        vec3 ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        vec4 x = x_ * ns.x + ns.yyyy;
        vec4 y = y_ * ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0) * 2.0 + 1.0;
        vec4 s1 = floor(b1) * 2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
      }

      float fbm(vec3 p) {
        float val = 0.0;
        float amp = 0.54;
        for (int i = 0; i < 3; i++) {
          val += amp * snoise(p);
          p = p * 2.03 + vec3(13.1, 7.7, 5.3);
          amp *= 0.48;
        }
        return val;
      }

      mat2 rot2(float a) {
        float c = cos(a), s = sin(a);
        return mat2(c, -s, s, c);
      }

      float singleSmear(vec2 uvAspect, vec2 anchor, float angle, float seed, float time) {
        vec2 p = uvAspect - anchor;
        p = rot2(angle) * p;
        p.y += 0.14 * sin(p.x * 1.45 + seed + time * 0.16);

        vec2 q = vec2(p.x / u_stretch, p.y * 1.15);
        float w1 = fbm(vec3(q * 1.15 + seed, time * 0.25));
        float w2 = fbm(vec3(q * 1.35 + vec2(w1 * 0.85, -w1 * 0.55) + seed * 1.7, time * 0.20 + 4.1));
        vec2 warped = q + u_warp * vec2(w1 * 0.48 + w2 * 0.28, w2 * 0.22);

        float dist = length(warped * vec2(0.82, 1.48));
        float halo = exp(-dist * 1.95);
        float core = exp(-abs(warped.y) * 4.8) * exp(-abs(warped.x) * 0.95);
        float streak = smoothstep(-0.35, 0.85, fbm(vec3(warped * vec2(0.95, 2.9) + seed, time * 0.17)));
        return clamp((0.58 * halo + 0.62 * core) * mix(0.55, 1.15, streak), 0.0, 1.25);
      }

      // Continuous transition between unified refractive fringe (u_cross=0) and X-crossing beams (u_cross=1)
      float layerField(vec2 uvAspect, float time, float layerSign, vec2 mouse) {
        float shear = mix(0.065, 0.24, u_cross);
        float angleSpread = mix(0.03, 0.52, u_cross);

        vec2 anchorA = vec2(
          sin(time * 0.18 + 0.3 + layerSign * u_cross * 0.7) * mix(0.24, 0.32, u_cross) + mouse.x * (0.14 + layerSign * 0.04),
          cos(time * 0.15 - 0.4 - layerSign * u_cross * 0.6) * mix(0.16, 0.22, u_cross) + mouse.y * (0.12 - layerSign * 0.04)
        );
        float angleA = 0.46 + 0.20 * sin(time * 0.12) + layerSign * angleSpread + mouse.x * 0.08;
        vec2 shearVecA = rot2(angleA) * vec2(0.35, 1.0) * (layerSign * shear);

        vec2 anchorB = vec2(
          -0.25 + cos(time * 0.14 + 1.4 - layerSign * u_cross * 0.5) * 0.24 - mouse.x * 0.06,
           0.18 + sin(time * 0.16 + 0.7 + layerSign * u_cross * 0.5) * 0.18 - mouse.y * 0.06
        );
        float angleB = -0.36 + 0.20 * cos(time * 0.10 + 1.0) - layerSign * angleSpread * 0.85 - mouse.y * 0.08;
        vec2 shearVecB = rot2(angleB) * vec2(-0.30, 1.0) * (layerSign * shear);

        float tPhase = time + layerSign * mix(0.16, 1.2, u_cross);
        float seedA = u_seeds.x + max(0.0, layerSign) * u_cross * 1.4;
        float seedB = u_seeds.y + max(0.0, -layerSign) * u_cross * 1.4;

        float a = singleSmear(uvAspect + shearVecA, anchorA, angleA, seedA, tPhase);
        float b = singleSmear(uvAspect + shearVecB, anchorB, angleB, seedB, tPhase + 7.5) * 0.85;
        return 1.0 - (1.0 - min(a, 1.0)) * (1.0 - min(b, 1.0));
      }

      float bayer2(ivec2 p) {
        int idx = ((p.y & 1) << 1) | (p.x & 1);
        if (idx == 0) return 0.0;
        if (idx == 1) return 2.0;
        if (idx == 2) return 3.0;
        return 1.0;
      }

      float bayer8(ivec2 cell) {
        float v = 16.0 * bayer2(cell & 1)
                +  4.0 * bayer2((cell >> 1) & 1)
                +        bayer2((cell >> 2) & 1);
        return (v + 0.5) / 64.0;
      }

      float hash12(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * 0.1031);
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
      }

      vec3 linearToSrgb(vec3 c) {
        vec3 lo = 12.92 * c;
        vec3 hi = 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055;
        return mix(lo, hi, step(vec3(0.0031308), c));
      }

      // Computes resulting linear light from two fields according to selected optical Mix Mode
      vec3 mixOpticalFields(vec3 rgb1, vec3 rgb2, float f1, float f2) {
        if (u_mixMode == 0) {
          // 0: Additive Light (calibrated layers sum to target pink)
          return rgb1 + rgb2;
        } else if (u_mixMode == 1) {
          // 1: Thin-Film Interference (soap-bubble / iridescent phase fringes at overlap)
          float overlap = sqrt(max(f1 * f2, 0.0));
          float phase = 9.5 * (f1 - f2) + 6.0 * overlap;
          vec3 irid = 0.5 + 0.5 * cos(phase + vec3(0.0, 2.094, 4.188));
          vec3 baseSum = rgb1 + rgb2;
          return mix(baseSum, baseSum * (0.45 + 1.35 * irid), smoothstep(0.05, 0.55, overlap));
        } else if (u_mixMode == 2) {
          // 2: Overburn Screen (incandescent Kodak film core burn)
          vec3 s1 = min(rgb1 * 1.15, vec3(1.0));
          vec3 s2 = min(rgb2 * 1.15, vec3(1.0));
          vec3 screened = 1.0 - (1.0 - s1) * (1.0 - s2);
          float hot = smoothstep(0.55, 1.15, f1 * f2);
          return screened + hot * vec3(0.28, 0.22, 0.26);
        } else {
          // 3: Dichroic Gel (subtractive filter multiplication inside overlap)
          vec3 gel1 = mix(vec3(1.0), clamp(u_c1Mid * 1.15, 0.05, 1.0), clamp(f1 * 1.1, 0.0, 1.0));
          vec3 gel2 = mix(vec3(1.0), clamp(u_c2Mid * 1.15, 0.05, 1.0), clamp(f2 * 1.1, 0.0, 1.0));
          float lumEnv = max(f1, f2);
          float both = smoothstep(0.05, 0.65, f1 * f2);
          vec3 subtractive = gel1 * gel2 * lumEnv * 1.25;
          return mix(rgb1 + rgb2, subtractive, both);
        }
      }

      void main() {
        vec2 coord = gl_FragCoord.xy;
        float cellSize = (u_style == 1) ? max(u_pixelSize, 1.0) : 1.0;
        vec2 cellCoord = floor(coord / cellSize);
        vec2 uv = ((cellCoord + 0.5) * cellSize) / u_resolution;

        float aspect = u_resolution.x / max(u_resolution.y, 1.0);
        vec2 uvAspect = (uv - 0.5) * vec2(aspect, 1.0);
        float t = u_time;

        vec2 microDir = vec2(0.35, 1.0) * u_dispersion;
        float f1Low  = layerField(uvAspect - microDir, t, -1.0, u_mouse);
        float f1Mid  = layerField(uvAspect,            t, -1.0, u_mouse);
        float f1High = layerField(uvAspect + microDir, t, -1.0, u_mouse);

        float f2Low  = layerField(uvAspect - microDir, t,  1.0, u_mouse);
        float f2Mid  = layerField(uvAspect,            t,  1.0, u_mouse);
        float f2High = layerField(uvAspect + microDir, t,  1.0, u_mouse);

        vec3 rgb1 = ((f1Low * u_c1Low + f1Mid * u_c1Mid + f1High * u_c1High) / 3.0) * u_w1;
        vec3 rgb2 = ((f2Low * u_c2Low + f2Mid * u_c2Mid + f2High * u_c2High) / 3.0) * u_w2;

        vec3 mixed = mixOpticalFields(rgb1, rgb2, f1Mid, f2Mid) * u_exposure;
        vec3 linearColor;

        if (u_style == 1) {
          // 1: 8x8 Bayer Risograph stipple per RGB channel -> crisp pixel palette
          float thresh = bayer8(ivec2(cellCoord));
          vec3 srgbMixed = linearToSrgb(mixed);
          vec3 quantSrgb = step(vec3(thresh), max(vec3(0.0), (srgbMixed - 0.03) / 0.97));
          vec3 bgSrgb = linearToSrgb(u_bgLinear);
          vec3 finalSrgb = max(bgSrgb, quantSrgb * 0.92);
          fragColor = vec4(finalSrgb, 1.0);
          return;
        } else if (u_style == 2) {
          // 2: Stepped Topographic Iso-Contours
          float lum = max(mixed.r, max(mixed.g, mixed.b));
          float bands = 8.0;
          float stepped = floor(lum * bands) / bands;
          float frac = fract(lum * bands);
          float rim = smoothstep(0.90, 0.99, frac) * step(0.04, lum);
          vec3 normColor = (lum > 1e-4) ? (mixed / lum) : vec3(0.0);
          linearColor = u_bgLinear + normColor * (stepped + rim * 0.25);
        } else {
          // 0: 35mm Film Haze
          float peak = max(mixed.r, max(mixed.g, mixed.b));
          linearColor = u_bgLinear + mixed / (1.0 + peak * 0.14);
        }

        vec3 srgbColor = linearToSrgb(linearColor);
        if (u_style == 0) {
          float g = hash12(coord + fract(t * 17.3) * 100.0) - 0.5;
          srgbColor = clamp(srgbColor + g * 0.015, 0.0, 1.0);
        }
        fragColor = vec4(srgbColor, 1.0);
      }
    `;

    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(s));
      }
      return s;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vsSource));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fsSource));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(prog));
    }
    gl.useProgram(prog);

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const locPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(locPos);
    gl.vertexAttribPointer(locPos, 2, gl.FLOAT, false, 0, 0);

    const u = {};
    [
      'u_resolution', 'u_time', 'u_mouse', 'u_bgLinear',
      'u_c1Low', 'u_c1Mid', 'u_c1High', 'u_w1',
      'u_c2Low', 'u_c2Mid', 'u_c2High', 'u_w2',
      'u_stretch', 'u_warp', 'u_dispersion', 'u_cross',
      'u_exposure', 'u_pixelSize', 'u_mixMode', 'u_style', 'u_seeds'
    ].forEach(name => { u[name] = gl.getUniformLocation(prog, name); });

    gl.uniform3fv(u.u_bgLinear, [10/255, 10/255, 12/255].map(srgbToLinear));

    const state = {
      wl1: 479,
      wl2: 611,
      bw: 24,
      stretch: 5.4,
      warp: 1.85,
      disp: 0.042,
      cross: 0.25,
      exposure: 0.85,
      speed: 0.28,
      mixMode: 0,
      style: 0,
      pixelSize: 3,
      balancePink: true,
      paused: false,
      seedA: 3.1,
      seedB: 9.7,
    };

    const presets = {
      brandPink:  { wl1: 479, wl2: 611, bw: 24, stretch: 5.4, warp: 1.85, disp: 0.042, cross: 0.25, exposure: 0.85, mixMode: 0, style: 0, balancePink: true },
      thinFilm:   { wl1: 445, wl2: 585, bw: 18, stretch: 4.8, warp: 2.10, disp: 0.055, cross: 0.65, exposure: 0.92, mixMode: 1, style: 0, balancePink: false },
      risograph:  { wl1: 479, wl2: 611, bw: 24, stretch: 5.8, warp: 1.95, disp: 0.040, cross: 0.35, exposure: 0.88, mixMode: 0, style: 1, balancePink: true },
      emeraldGel: { wl1: 488, wl2: 595, bw: 26, stretch: 4.2, warp: 1.65, disp: 0.032, cross: 0.78, exposure: 0.95, mixMode: 3, style: 0, balancePink: false },
      isoPrism:   { wl1: 460, wl2: 625, bw: 14, stretch: 5.0, warp: 2.00, disp: 0.068, cross: 0.55, exposure: 0.90, mixMode: 2, style: 2, balancePink: false },
    };

    const el = id => document.getElementById(id);

    function updateSwatches(c1Mid, c2Mid, w1, w2) {
      const hex1 = rgbToHex(c1Mid.map(linearToSrgb));
      const hex2 = rgbToHex(c2Mid.map(linearToSrgb));

      let mixLin;
      if (state.mixMode === 0) {
        mixLin = [w1*c1Mid[0] + w2*c2Mid[0], w1*c1Mid[1] + w2*c2Mid[1], w1*c1Mid[2] + w2*c2Mid[2]];
      } else if (state.mixMode === 1) {
        const base = [w1*c1Mid[0] + w2*c2Mid[0], w1*c1Mid[1] + w2*c2Mid[1], w1*c1Mid[2] + w2*c2Mid[2]];
        mixLin = [base[0] * 0.95, base[1] * 1.15, base[2] * 1.15];
      } else if (state.mixMode === 2) {
        mixLin = [0,1,2].map(i => 1 - (1 - Math.min(1, w1*c1Mid[i])) * (1 - Math.min(1, w2*c2Mid[i])));
      } else {
        mixLin = [0,1,2].map(i => Math.min(1, c1Mid[i] * 1.15) * Math.min(1, c2Mid[i] * 1.15));
      }
      const hexMix = rgbToHex(mixLin.map(linearToSrgb));

      if (el('ll-swatch-1')) el('ll-swatch-1').style.background = hex1;
      if (el('ll-hex-1')) el('ll-hex-1').textContent = `${state.wl1}nm`;
      if (el('ll-swatch-2')) el('ll-swatch-2').style.background = hex2;
      if (el('ll-hex-2')) el('ll-hex-2').textContent = `${state.wl2}nm`;
      if (el('ll-swatch-mix')) el('ll-swatch-mix').style.background = hexMix;
      if (el('ll-hex-mix')) el('ll-hex-mix').textContent = hexMix.toUpperCase();
    }

    function updateSpectralUniforms() {
      const spread = Math.max(4, state.bw * 0.75);
      const c1Low  = wavelengthBandLinearRGB(state.wl1 - spread, state.bw);
      const c1Mid  = wavelengthBandLinearRGB(state.wl1, state.bw);
      const c1High = wavelengthBandLinearRGB(state.wl1 + spread, state.bw);

      const c2Low  = wavelengthBandLinearRGB(state.wl2 - spread, state.bw);
      const c2Mid  = wavelengthBandLinearRGB(state.wl2, state.bw);
      const c2High = wavelengthBandLinearRGB(state.wl2 + spread, state.bw);

      let w1 = 0.75, w2 = 0.75;
      if (state.balancePink) {
        const solved = solveWeights(c1Mid, c2Mid, TARGET_PINK_LIN);
        w1 = solved.w1;
        w2 = solved.w2;
      }

      gl.uniform3fv(u.u_c1Low, c1Low);
      gl.uniform3fv(u.u_c1Mid, c1Mid);
      gl.uniform3fv(u.u_c1High, c1High);
      gl.uniform1f(u.u_w1, w1);

      gl.uniform3fv(u.u_c2Low, c2Low);
      gl.uniform3fv(u.u_c2Mid, c2Mid);
      gl.uniform3fv(u.u_c2High, c2High);
      gl.uniform1f(u.u_w2, w2);

      updateSwatches(c1Mid, c2Mid, w1, w2);
    }

    function syncOpticUniforms() {
      gl.uniform1f(u.u_stretch, state.stretch);
      gl.uniform1f(u.u_warp, state.warp);
      gl.uniform1f(u.u_dispersion, state.disp);
      gl.uniform1f(u.u_cross, state.cross);
      gl.uniform1f(u.u_exposure, state.exposure);
      gl.uniform1f(u.u_pixelSize, state.pixelSize);
      gl.uniform1i(u.u_mixMode, state.mixMode);
      gl.uniform1i(u.u_style, state.style);
      gl.uniform2f(u.u_seeds, state.seedA, state.seedB);
    }

    function bindRange(inputId, valId, key, fmt) {
      const input = el(inputId);
      const label = el(valId);
      if (!input) return;
      input.addEventListener('input', () => {
        state[key] = parseFloat(input.value);
        if (label) label.textContent = fmt(state[key]);
        if (key === 'wl1' || key === 'wl2') {
          state.balancePink = (state.wl1 === 479 && state.wl2 === 611);
        }
        if (key === 'wl1' || key === 'wl2' || key === 'bw') {
          updateSpectralUniforms();
        } else {
          syncOpticUniforms();
        }
        document.querySelectorAll('.ll-preset-btn').forEach(b => b.classList.remove('active'));
        if (state.paused) drawOnce();
      });
    }

    bindRange('ll-wl1', 'll-val-wl1', 'wl1', v => `${v} nm`);
    bindRange('ll-wl2', 'll-val-wl2', 'wl2', v => `${v} nm`);
    bindRange('ll-bw', 'll-val-bw', 'bw', v => `${v} nm`);
    bindRange('ll-cross', 'll-val-cross', 'cross', v => v.toFixed(2));
    bindRange('ll-stretch', 'll-val-stretch', 'stretch', v => `${v.toFixed(1)}×`);
    bindRange('ll-warp', 'll-val-warp', 'warp', v => v.toFixed(2));
    bindRange('ll-disp', 'll-val-disp', 'disp', v => v.toFixed(3));
    bindRange('ll-exposure', 'll-val-exposure', 'exposure', v => v.toFixed(2));
    bindRange('ll-speed', 'll-val-speed', 'speed', v => `${v.toFixed(2)}×`);

    if (el('ll-mix-mode')) {
      el('ll-mix-mode').addEventListener('change', (e) => {
        state.mixMode = parseInt(e.target.value, 10);
        syncOpticUniforms();
        updateSpectralUniforms();
        document.querySelectorAll('.ll-preset-btn').forEach(b => b.classList.remove('active'));
        if (state.paused) drawOnce();
      });
    }

    if (el('ll-style')) {
      el('ll-style').addEventListener('change', (e) => {
        state.style = parseInt(e.target.value, 10);
        resize();
        syncOpticUniforms();
        document.querySelectorAll('.ll-preset-btn').forEach(b => b.classList.remove('active'));
        if (state.paused) drawOnce();
      });
    }

    document.querySelectorAll('.ll-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = presets[btn.dataset.llPreset];
        if (!p) return;
        Object.assign(state, p);

        el('ll-wl1').value = state.wl1; el('ll-val-wl1').textContent = `${state.wl1} nm`;
        el('ll-wl2').value = state.wl2; el('ll-val-wl2').textContent = `${state.wl2} nm`;
        el('ll-bw').value = state.bw; el('ll-val-bw').textContent = `${state.bw} nm`;
        el('ll-cross').value = state.cross; el('ll-val-cross').textContent = state.cross.toFixed(2);
        el('ll-stretch').value = state.stretch; el('ll-val-stretch').textContent = `${state.stretch.toFixed(1)}×`;
        el('ll-warp').value = state.warp; el('ll-val-warp').textContent = state.warp.toFixed(2);
        el('ll-disp').value = state.disp; el('ll-val-disp').textContent = state.disp.toFixed(3);
        el('ll-exposure').value = state.exposure; el('ll-val-exposure').textContent = state.exposure.toFixed(2);
        el('ll-mix-mode').value = String(state.mixMode);
        el('ll-style').value = String(state.style);

        document.querySelectorAll('.ll-preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        resize();
        updateSpectralUniforms();
        syncOpticUniforms();
        if (state.paused) drawOnce();
      });
    });

    function togglePause() {
      state.paused = !state.paused;
      const btn = el('btn-ll-pause');
      const badge = el('ll-paused-badge');
      if (btn) {
        btn.innerHTML = state.paused
          ? '<i class="fa-solid fa-play"></i> RESUME'
          : '<i class="fa-solid fa-pause"></i> PAUSE';
      }
      if (badge) badge.hidden = !state.paused;
      if (!state.paused && isRunning) {
        lastTs = performance.now();
        scheduleFrame();
      }
    }

    if (el('btn-ll-pause')) el('btn-ll-pause').addEventListener('click', togglePause);
    canvas.addEventListener('dblclick', togglePause);

    if (el('btn-ll-mutate')) {
      el('btn-ll-mutate').addEventListener('click', () => {
        state.seedA = +(Math.random() * 25 + 1).toFixed(2);
        state.seedB = +(Math.random() * 25 + 1).toFixed(2);
        simTime += 4.3;
        syncOpticUniforms();
        drawOnce();
      });
    }

    // Export high-resolution 1920x1080 .JPG of the exact current frame
    if (el('btn-ll-export')) {
      el('btn-ll-export').addEventListener('click', () => {
        const exportBtn = el('btn-ll-export');
        const prevW = canvas.width;
        const prevH = canvas.height;
        const exportW = 1920;
        const exportH = 1080;
        const scaledPixel = Math.max(2, Math.round(state.pixelSize * (exportW / Math.max(canvas.clientWidth, 600))));

        canvas.width = exportW;
        canvas.height = exportH;
        gl.viewport(0, 0, exportW, exportH);
        gl.uniform2f(u.u_resolution, exportW, exportH);
        gl.uniform1f(u.u_pixelSize, scaledPixel);
        drawOnce();

        canvas.toBlob((blob) => {
          // Restore preview dimensions immediately
          canvas.width = prevW;
          canvas.height = prevH;
          gl.viewport(0, 0, prevW, prevH);
          gl.uniform2f(u.u_resolution, prevW, prevH);
          gl.uniform1f(u.u_pixelSize, state.pixelSize);
          drawOnce();

          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `evanswope-colliderscope-${state.wl1}nm-${state.wl2}nm.jpg`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1000);

          if (exportBtn) {
            const orig = exportBtn.innerHTML;
            exportBtn.innerHTML = '<i class="fa-solid fa-check"></i> SAVED!';
            setTimeout(() => { exportBtn.innerHTML = orig; }, 1400);
          }
        }, 'image/jpeg', 0.94);
      });
    }

    // Pointer steering on the viewport canvas
    const targetMouse = [0, 0];
    const smoothMouse = [0, 0];
    canvas.addEventListener('pointermove', (e) => {
      const rect = canvas.getBoundingClientRect();
      targetMouse[0] = ((e.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
      targetMouse[1] = -(((e.clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1);
      if (state.paused) {
        smoothMouse[0] = targetMouse[0];
        smoothMouse[1] = targetMouse[1];
        drawOnce();
      }
    }, { passive: true });

    canvas.addEventListener('pointerleave', () => {
      targetMouse[0] = 0;
      targetMouse[1] = 0;
    }, { passive: true });

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(320, Math.floor(rect.width || 780));
      const h = Math.max(180, Math.floor(rect.height || 438));
      const scale = state.style === 1 ? 1.0 : 0.75;
      canvas.width = Math.floor(w * scale);
      canvas.height = Math.floor(h * scale);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(u.u_resolution, canvas.width, canvas.height);
    }

    window.addEventListener('resize', () => {
      if (isRunning) {
        resize();
        drawOnce();
      }
    }, { passive: true });

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let simTime = 6.5;
    let lastTs = performance.now();
    let rafId = 0;
    let isRunning = false;

    function drawOnce() {
      gl.uniform1f(u.u_time, simTime);
      gl.uniform2f(u.u_mouse, smoothMouse[0], smoothMouse[1]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    function tick(now) {
      if (!isRunning || state.paused) return;
      const dt = Math.min(0.05, (now - lastTs) / 1000);
      lastTs = now;

      if (!reducedMotion) {
        simTime += dt * state.speed;
      }
      smoothMouse[0] += (targetMouse[0] - smoothMouse[0]) * 0.06;
      smoothMouse[1] += (targetMouse[1] - smoothMouse[1]) * 0.06;

      drawOnce();
      if (!reducedMotion) {
        rafId = requestAnimationFrame(tick);
      }
    }

    function scheduleFrame() {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(tick);
    }

    resize();
    updateSpectralUniforms();
    syncOpticUniforms();
    drawOnce();

    window.lightLeakExpInstance = {
      start() {
        if (isRunning) return;
        isRunning = true;
        resize();
        lastTs = performance.now();
        drawOnce();
        if (!state.paused && !reducedMotion) {
          scheduleFrame();
        }
      },
      stop() {
        isRunning = false;
        cancelAnimationFrame(rafId);
      }
    };

    if (['#light-leaks', '#light-leak', '#leaks'].includes(window.location.hash.toLowerCase())) {
      window.lightLeakExpInstance.start();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLightLeakExperiment);
  } else {
    initLightLeakExperiment();
  }
})();
