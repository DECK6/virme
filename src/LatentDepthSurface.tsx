import { useEffect, useRef } from 'react'

const vertexShader = `#version 300 es
precision highp float;
in vec2 a_position;
uniform sampler2D u_image;
uniform vec2 u_texel;
uniform float u_aspect;
uniform float u_textureAspect;
uniform float u_depth;
uniform float u_time;
out vec2 v_uv;

vec2 coverUv(vec2 uv) {
  if (u_aspect > u_textureAspect) {
    uv.y = .5 + (uv.y - .5) * (u_textureAspect / u_aspect);
  } else {
    uv.x = .5 + (uv.x - .5) * (u_aspect / u_textureAspect);
  }
  return uv;
}

float luminanceAt(vec2 uv) {
  vec3 color = texture(u_image, clamp(uv, vec2(0.), vec2(1.))).rgb;
  return dot(color, vec3(.2126, .7152, .0722));
}

void main() {
  v_uv = coverUv(a_position);
  float center = luminanceAt(v_uv);
  float horizontal = abs(luminanceAt(v_uv + vec2(u_texel.x * 3., 0.)) - luminanceAt(v_uv - vec2(u_texel.x * 3., 0.)));
  float vertical = abs(luminanceAt(v_uv + vec2(0., u_texel.y * 3.)) - luminanceAt(v_uv - vec2(0., u_texel.y * 3.)));
  float structure = (center - .5) * .62 + (horizontal + vertical) * 1.45;
  float breath = .92 + .08 * sin(u_time * .34);
  float z = structure * u_depth * breath;

  vec3 point = vec3(
    (a_position.x * 2. - 1.) * u_aspect * 1.13,
    (1. - a_position.y * 2.) * 1.13,
    z
  );
  float tiltX = .028 * sin(u_time * .17);
  float tiltY = .042 * cos(u_time * .13);
  point = vec3(point.x * cos(tiltY) + point.z * sin(tiltY), point.y, -point.x * sin(tiltY) + point.z * cos(tiltY));
  point = vec3(point.x, point.y * cos(tiltX) - point.z * sin(tiltX), point.y * sin(tiltX) + point.z * cos(tiltX));
  float camera = 2.65;
  gl_Position = vec4(point.x * camera / u_aspect, point.y * camera, point.z, camera - point.z);
}
`

const fragmentShader = `#version 300 es
precision highp float;
uniform sampler2D u_image;
uniform vec2 u_texel;
in vec2 v_uv;
out vec4 outputColor;
void main() {
  vec3 color = texture(u_image, clamp(v_uv, vec2(0.), vec2(1.))).rgb;
  vec3 neighbors = (
    texture(u_image, clamp(v_uv + vec2(u_texel.x, 0.), vec2(0.), vec2(1.))).rgb +
    texture(u_image, clamp(v_uv - vec2(u_texel.x, 0.), vec2(0.), vec2(1.))).rgb +
    texture(u_image, clamp(v_uv + vec2(0., u_texel.y), vec2(0.), vec2(1.))).rgb +
    texture(u_image, clamp(v_uv - vec2(0., u_texel.y), vec2(0.), vec2(1.))).rgb
  ) * .25;
  outputColor = vec4(clamp(color + (color - neighbors) * .36, 0., 1.), 1.);
}
`

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) throw new Error('Unable to create shader')
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? 'Shader compilation failed')
  return shader
}

function makeProgram(gl: WebGL2RenderingContext) {
  const program = gl.createProgram()
  if (!program) throw new Error('Unable to create WebGL program')
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vertexShader))
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragmentShader))
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? 'Program linking failed')
  return program
}

function makeMesh(columns = 192, rows = 144) {
  const points = new Float32Array((columns + 1) * (rows + 1) * 2)
  let point = 0
  for (let row = 0; row <= rows; row += 1) {
    for (let column = 0; column <= columns; column += 1) {
      points[point++] = column / columns
      points[point++] = row / rows
    }
  }
  const indices = new Uint32Array(columns * rows * 6)
  let index = 0
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const topLeft = row * (columns + 1) + column
      const bottomLeft = topLeft + columns + 1
      indices[index++] = topLeft
      indices[index++] = bottomLeft
      indices[index++] = topLeft + 1
      indices[index++] = topLeft + 1
      indices[index++] = bottomLeft
      indices[index++] = bottomLeft + 1
    }
  }
  return { points, indices }
}

export function LatentDepthSurface({ src, depth, intensity }: { src: string; depth: number; intensity: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const gl = canvas?.getContext('webgl2', { alpha: false, antialias: true })
    if (!canvas || !gl) return
    const program = makeProgram(gl)
    const mesh = makeMesh()
    const vertexBuffer = gl.createBuffer()
    const indexBuffer = gl.createBuffer()
    const texture = gl.createTexture()
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, mesh.points, gl.STATIC_DRAW)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW)
    const position = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.useProgram(program)
    gl.uniform1i(gl.getUniformLocation(program, 'u_image'), 0)

    let textureAspect = 1
    let loaded = false
    const image = new Image()
    image.onload = () => {
      textureAspect = image.naturalWidth / image.naturalHeight
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image)
      loaded = true
    }
    image.src = src

    const resize = () => {
      const bounds = canvas.getBoundingClientRect()
      const ratio = Math.min(devicePixelRatio || 1, 2)
      canvas.width = Math.max(1, Math.round(bounds.width * ratio))
      canvas.height = Math.max(1, Math.round(bounds.height * ratio))
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    let animation = 0
    const started = performance.now()
    const draw = (now: number) => {
      gl.clearColor(.012, .02, .032, 1)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      if (loaded) {
        gl.enable(gl.DEPTH_TEST)
        gl.useProgram(program)
        gl.uniform2f(gl.getUniformLocation(program, 'u_texel'), 1 / image.naturalWidth, 1 / image.naturalHeight)
        gl.uniform1f(gl.getUniformLocation(program, 'u_aspect'), canvas.width / canvas.height)
        gl.uniform1f(gl.getUniformLocation(program, 'u_textureAspect'), textureAspect)
        gl.uniform1f(gl.getUniformLocation(program, 'u_depth'), (.18 + depth * .42) * (.72 + intensity * .28))
        gl.uniform1f(gl.getUniformLocation(program, 'u_time'), (now - started) / 1000)
        gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_INT, 0)
      }
      animation = requestAnimationFrame(draw)
    }
    animation = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(animation)
      observer.disconnect()
      gl.deleteTexture(texture)
      gl.deleteBuffer(vertexBuffer)
      gl.deleteBuffer(indexBuffer)
      gl.deleteProgram(program)
    }
  }, [src, depth, intensity])

  return (
    <canvas
      ref={canvasRef}
      className="latent-depth-surface"
      data-testid="latent-depth-surface"
      data-source="generated-frame"
      data-geometry="continuous-mesh"
      data-voxel="false"
      aria-hidden="true"
    />
  )
}
