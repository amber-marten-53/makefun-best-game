// Input handler for Starfall Arena
export class InputHandler {
  constructor(canvas) {
    this.keys = {};
    this.mouse = { x: 512, y: 384, down: false };
    this.canvas = canvas;

    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      this.mouse.x = (e.clientX - rect.left) * scaleX;
      this.mouse.y = (e.clientY - rect.top) * scaleY;
    });

    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.mouse.down = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.mouse.down = false;
      }
    });

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  isDown(code) {
    return !!this.keys[code];
  }

  getXaxis() {
    let dx = 0;
    if (this.isDown('KeyA') || this.isDown('ArrowLeft')) dx -= 1;
    if (this.isDown('KeyD') || this.isDown('ArrowRight')) dx += 1;
    return dx;
  }

  getYaxis() {
    let dy = 0;
    if (this.isDown('KeyW') || this.isDown('ArrowUp')) dy -= 1;
    if (this.isDown('KeyS') || this.isDown('ArrowDown')) dy += 1;
    return dy;
  }
}
