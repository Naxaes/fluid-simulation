const REVERSE_NONE = 0;
const REVERSE_X    = 1;
const REVERSE_Y    = 2;

/**
    Function of diffuse
    - b : int
    - x : float[]
    - x0 : float[]
    - diff : float
    - dt : float
*/
function diffuse(reverse, x, x0, diff, dt) {
  let a = dt * diff * (resolution - 2) * (resolution - 2);
  solve_linear(x, x0, a, 1 + 4 * a);
  set_bounds(reverse, x);
}


/**
    Function of project : This operation runs through all the cells and fixes them up so everything is in equilibrium.
    - velocX : float[]
    - velocY : float[]
    = p : float[]
    - div : float[]
*/
function project(velocX, velocY, p, div) {
  for (let j = 1; j < resolution - 1; j++) {
    for (let i = 1; i < resolution - 1; i++) {
  	  const index   = IX(i, j);

    	const right   = velocX[IX(i + 1, j)];
    	const left    = velocX[IX(i - 1, j)];
    	const below   = velocY[IX(i, j + 1)];
    	const above   = velocY[IX(i, j - 1)];

    	const deltaX = right - left;
    	const deltaY = below - above;

      div[index] = (deltaX + deltaY) / (-2.0 * resolution);
    }
  }
  set_bounds(REVERSE_NONE, div);

  p.fill(0);
  solve_linear(p, div, 1, 6);
  set_bounds(REVERSE_NONE, p);
 
  for (let j = 1; j < resolution - 1; j++) {
    for (let i = 1; i < resolution - 1; i++) {
    	const index   = IX(i, j);

    	const right   = p[IX(i + 1, j)];
    	const left    = p[IX(i - 1, j)];
    	const below   = p[IX(i, j + 1)];
    	const above   = p[IX(i, j - 1)];

      velocX[index] -= 0.5 * (right - left)  * resolution;
      velocY[index] -= 0.5 * (below - above) * resolution;
    }
  }

  set_bounds(REVERSE_X, velocX);
  set_bounds(REVERSE_Y, velocY);
}

/**
    Function of advect: responsible for actually moving things around
    - b : int
    - d : float[]
    - d0 : float[]
    - velocX : float[]
    - velocY : float[]
    - velocZ : float[]
    - dt : float[]
*/
function advect(reverse, d, d0, velocX, velocY, dt) {
  let i0, i1, j0, j1;

  let dtx = dt * (resolution - 2);
  let dty = dt * (resolution - 2);

  let s0, s1, t0, t1;
  let tmp1, tmp2, tmp3, x, y;

  let Nfloat = resolution - 2;
  let ifloat, jfloat;
  let i, j, k;

  for (j = 1, jfloat = 1; j < resolution - 1; j++, jfloat++) {
    for (i = 1, ifloat = 1; i < resolution - 1; i++, ifloat++) {
      tmp1 = dtx * velocX[IX(i, j)];
      tmp2 = dty * velocY[IX(i, j)];
      x = ifloat - tmp1;
      y = jfloat - tmp2;

      if (x < 0.5) x = 0.5;
      if (x > Nfloat + 0.5) x = Nfloat + 0.5;
      i0 = Math.floor(x);
      i1 = i0 + 1.0;
      if (y < 0.5) y = 0.5;
      if (y > Nfloat + 0.5) y = Nfloat + 0.5;
      j0 = Math.floor(y);
      j1 = j0 + 1.0;

      s1 = x - i0;
      s0 = 1.0 - s1;
      t1 = y - j0;
      t0 = 1.0 - t1;

      let i0i = parseInt(i0);
      let i1i = parseInt(i1);
      let j0i = parseInt(j0);
      let j1i = parseInt(j1);

      d[IX(i, j)] =
        s0 * (t0 * d0[IX(i0i, j0i)] + t1 * d0[IX(i0i, j1i)]) +
        s1 * (t0 * d0[IX(i1i, j0i)] + t1 * d0[IX(i1i, j1i)]);
    }
  }

  set_bounds(reverse, d);
}


/**
    Function of dealing with situation with boundary cells.
    - b : int
    - x : float[]
*/
function set_bounds(reverse, x) {
	// Reverse velocity at the walls.

	// Reverse top and bottom.
  for (let i = 1; i < resolution - 1; i++) {
  	const topWall = IX(i, 0);
  	const topCell = x[IX(i, 1)];

  	const bottomWall = IX(i, resolution - 1);
  	const bottomCell = x[IX(i, resolution - 2)];

    x[topWall]    = reverse == REVERSE_Y ? -topCell    : topCell;
    x[bottomWall] = reverse == REVERSE_Y ? -bottomCell : bottomCell;
  }

	// Reverse left and right.
  for (let j = 1; j < resolution - 1; j++) {
  	const leftWall = IX(0, j);
  	const leftCell = x[IX(1, j)];

  	const rightWall = IX(resolution - 1, j);
  	const rightCell = x[IX(resolution - 2, j)];

    x[leftWall]  = reverse == REVERSE_X ? -leftCell  : leftCell;
    x[rightWall] = reverse == REVERSE_X ? -rightCell : rightCell;
  }

	// Reverse corners.
  const topLeftCorner     = IX(0,     0);
  const bottomLeftCorner  = IX(0,     resolution - 1);
  const topRightCorner    = IX(resolution - 1, 0);
  const bottomRightCorner = IX(resolution - 1, resolution - 1);

  x[topLeftCorner]     = 0.5 * (x[IX(1, 0)] + x[IX(0, 1)]);
  x[bottomLeftCorner]  = 0.5 * (x[IX(1, resolution - 1)] + x[IX(0, resolution - 2)]);
  x[topRightCorner]    = 0.5 * (x[IX(resolution - 2, 0)] + x[IX(resolution - 1, 1)]);
  x[bottomRightCorner] = 0.5 * (x[IX(resolution - 2, resolution - 1)] + x[IX(resolution - 1, resolution - 2)]);
}


/**
    Function of solving linear differential equation
    - b : int
    - x : float[]
    - x0 : float[]
    - a : float
    - c : float
*/
function solve_linear(x, x0, a, c) {
  for (let t = 0; t < iterations; t++) {
    for (let j = 1; j < resolution - 1; j++) {
      for (let i = 1; i < resolution - 1; i++) {
      	let index   = IX(i, j);

      	let right   = x[IX(i + 1, j)];
      	let left    = x[IX(i - 1, j)];
      	let below   = x[IX(i, j + 1)];
      	let above   = x[IX(i, j - 1)];

        x[index] = (x0[index] + a * (right + left + below + above)) / c;
      }
    }
  }
}