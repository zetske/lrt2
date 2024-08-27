import { useEffect, useRef } from "react";

const WebGLCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext("webgl");

    if (!gl) {
      console.error("WebGL not supported");
      return;
    }

    // Vertex shader source code
    const vertexShaderSource = `
        attribute vec2 a_position;
        void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
        }
      `;

    // Fragment shader source code
    const fragmentShaderSource = `
        #ifdef GL_ES
        precision mediump float;
        #endif
  
        uniform vec2 u_resolution;
        uniform float u_time;
  
        float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }
  
        float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
  
            return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
                       mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
                       u.y);
        }
  
        float sdf_circle(vec2 p, vec2 c, float r) {
            return length(p - c) - r;
        }
  
        float oscillate(float time, float minVal, float maxVal) {
            float sineWave = sin(time);
            float normalizedSine = (sineWave + 1.0) / 2.0;
            return mix(minVal, maxVal, normalizedSine);
        }
  
        void main() {
            vec2 st = gl_FragCoord.xy / u_resolution.xy * 2.0 - 1.0;
            st.x *= u_resolution.x / u_resolution.y;
            st = abs(st);
            float time = u_time / 2.0;
            vec3 finalColor = vec3(1.0);
  
            for (int i = 1; i <= 8; i++) {
                vec2 pos = vec2(0.0, 0.0);
                float r = float(i) / 10.0;
                float noiseFactor = noise(st * oscillate(time / 5.0, 0.0, 10.0) + time / 1.5) * 0.2;
                float obj = sdf_circle(st, pos, r + noiseFactor);
                float glow = 0.01 / max(abs(obj), 0.01);
  
                if (obj < 0.0) {
                    float intensity = noise(st + time) * 0.1 + 0.4;
                    float greyValue = float(i) / 8.0 * intensity * glow;
                    finalColor -= vec3(greyValue, greyValue, greyValue);
                }
            }
  
            finalColor = clamp(finalColor, 0.0, 1.0);
            gl_FragColor = vec4(finalColor, 1.0);
        }
      `;

    // Function to compile shader
    const compileShader = (gl, shaderSource, shaderType) => {
      const shader = gl.createShader(shaderType);
      gl.shaderSource(shader, shaderSource);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile failed:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }

      return shader;
    };

    // Function to create program
    const createProgram = (gl, vertexShader, fragmentShader) => {
      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Program link failed:", gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
      }

      return program;
    };

    // Compile shaders
    const vertexShader = compileShader(
      gl,
      vertexShaderSource,
      gl.VERTEX_SHADER
    );
    const fragmentShader = compileShader(
      gl,
      fragmentShaderSource,
      gl.FRAGMENT_SHADER
    );
    const program = createProgram(gl, vertexShader, fragmentShader);

    if (!program) return;

    // Look up attribute and uniform locations
    const positionLocation = gl.getAttribLocation(program, "a_position");
    const resolutionUniformLocation = gl.getUniformLocation(
      program,
      "u_resolution"
    );
    const timeUniformLocation = gl.getUniformLocation(program, "u_time");

    // Create buffer for positions
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    // Animation loop
    let startTime = null;
    const render = (time) => {
      if (!startTime) startTime = time;
      const elapsed = (time - startTime) / 1000.0;

      // Set viewport and clear the canvas
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Use program and set uniforms
      gl.useProgram(program);
      gl.uniform2f(
        resolutionUniformLocation,
        gl.canvas.width,
        gl.canvas.height
      );
      gl.uniform1f(timeUniformLocation, elapsed);

      // Enable attribute and bind buffer
      gl.enableVertexAttribArray(positionLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      // Draw the rectangle
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      // Loop
      requestAnimationFrame(render);
    };

    requestAnimationFrame(render);

    return () => {
      // Clean up resources on component unmount
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteProgram(program);
      gl.deleteBuffer(positionBuffer);
    };
  }, []);

  return <canvas ref={canvasRef} width={900} height={700}></canvas>;
};

export default WebGLCanvas;
