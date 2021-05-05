let resolution = 64;
let iterations = 4;
let scale = 10;

function IX(x, y) {
  const index = int(x) + int(y) * resolution;
  return index;
}


class Fluid {
  constructor(dt, diffusion, viscosity) {
    this.size = resolution;
    this.dt   = dt;
    this.diffusion = diffusion;
    this.viscosity = viscosity; 

    this.density0 = new Array(resolution * resolution).fill(0);
    this.density  = new Array(resolution * resolution).fill(0);

    this.vx = new Array(resolution * resolution).fill(0);
    this.vy = new Array(resolution * resolution).fill(0);

    this.vx0 = new Array(resolution * resolution).fill(0);
    this.vy0 = new Array(resolution * resolution).fill(0);

  }

  step() {
    let viscosity = this.viscosity;
    let diffusion = this.diffusion;
    let dt  = this.dt;
    let Vx  = this.vx;
    let Vy  = this.vy;
    let Vx0 = this.vx0;
    let Vy0 = this.vy0;
    let density0 = this.density0;
    let density  = this.density;

    // Diffuse all velocity components.
    diffuse(REVERSE_X, Vx0, Vx, viscosity, dt);
    diffuse(REVERSE_Y, Vy0, Vy, viscosity, dt);

    // Fix up velocities so they keep things incompressible.
    project(Vx0, Vy0, Vx, Vy);

    // Move the velocities around according to the velocities of the fluid.
    advect(REVERSE_X, Vx, Vx0, Vx0, Vy0, dt);
    advect(REVERSE_Y, Vy, Vy0, Vx0, Vy0, dt);

    // Fix up the velocities again
    project(Vx, Vy, Vx0, Vy0);

    // Diffuse the dye.
    diffuse(REVERSE_NONE, density0, density, diffusion, dt);

    // Move the dye around according to the velocities.
    advect(REVERSE_NONE, density, density0, Vx, Vy, dt);
  }

  addDensity(x, y, amount) {
    this.density[IX(x, y)] += amount;
  }

  addVelocity(x, y, amountX, amountY) {
    this.vx[IX(x, y)] += amountX;
    this.vy[IX(x, y)] += amountY;
  }

  renderDensity() {
    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        let x = i * scale;
        let y = j * scale;
        let d = this.density[IX(i, j)];
        fill(255, d);
        noStroke();
        rect(x, y, scale, scale);
      }
    }
  }
}



let fluid;
let scaleSlider;


function changeScale() {
  scale = scaleSlider.value();

  // Base resolution on the smaller dimension.
  if (windowWidth > windowHeight) {
    resolution = Math.floor(windowHeight / scale);
  } else {
    resolution = Math.floor(windowHeight / scale);
  }

  let size = scale * resolution;
  resizeCanvas(size, size);

  // Just to improve performance.
  if (scale <= 9) {
    iterations = Math.max(scale - 5, 1);
  } else {
    iterations = 4;
  }

  fluid = new Fluid(0.1, 0, 0.0000001);
}

function mouseDragged() {
  const x = mouseX/scale;
  const y = mouseY/scale;

  const movementX = mouseX - pmouseX;
  const movementY = mouseY - pmouseY;

  fluid.addDensity(x, y, 1000);
  fluid.addVelocity(x, y, movementX, movementY);
}


function setup() {
    scaleSlider = createSlider(1, 20, 10, 1);
    scaleSlider.position(20, 40);
    scaleSlider.input(changeScale);

    scale = scaleSlider.value();

    fill(255);
    text('Scale: ' + scaleSlider.value(), 20, height + 20);

    frameRate(22);
    changeScale();
}


function draw() {
  background(0);
  fill(255);
  text('Scale: ' + scaleSlider.value(), 20, 20);
  fluid.step();
  fluid.renderDensity();
}

