let gridSize = 10; // Размер сетки
const squareSize = 45; // клетка
let inputVector = gridSize * gridSize;
let isDrawing = false;
const weights = [];
let userImageState = [];
for (let i = 0; i < inputVector; i += 1) {
  weights[i] = new Array(inputVector).fill(0);
  userImageState[i] = -1;
}

const userCanvas = document.getElementById('userCanvas');
const userContext = userCanvas.getContext('2d');
const netCanvas = document.getElementById('netCanvas');
const netContext = netCanvas.getContext('2d');

const calcIndex = (x, y, size) => x + y * size;

const isValidIndex = (index, len) => index < len && index >= 0;

const getNewSquareCoords = (canvas, clientX, clientY, size) => {
  const rect = canvas.getBoundingClientRect();
  const x = Math.ceil((clientX - rect.left) / size) - 1;
  const y = Math.ceil((clientY - rect.top) / size) - 1;
  return { x, y };
};

const drawGrid = (ctx) => {
  ctx.beginPath();
  ctx.fillStyle = 'white';
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'black';
  for (let row = 0; row < gridSize; row += 1) {
    for (let column = 0; column < gridSize; column += 1) {
      const x = column * squareSize;
      const y = row * squareSize;
      ctx.rect(x, y, squareSize, squareSize);
      ctx.fill();
      ctx.stroke();
    }
  }
  ctx.closePath();
};

const drawImageFromArray = (data, ctx) => {
  const twoDimData = [];
  while (data.length) twoDimData.push(data.splice(0, gridSize));

  drawGrid(ctx);
  for (let i = 0; i < gridSize; i += 1) {
    for (let j = 0; j < gridSize; j += 1) {
      if (twoDimData[i][j] === 1) {
        ctx.fillStyle = 'black';
        ctx.fillRect(j * squareSize, i * squareSize, squareSize, squareSize);
      }
    }
  }
};

const handleMouseDown = (e) => {
  userContext.fillStyle = 'black';
  userContext.fillRect(
    Math.floor(e.offsetX / squareSize) * squareSize,
    Math.floor(e.offsetY / squareSize) * squareSize,
    squareSize,
    squareSize
  );

  const { clientX, clientY } = e;
  const coords = getNewSquareCoords(userCanvas, clientX, clientY, squareSize);
  const index = calcIndex(coords.x, coords.y, gridSize);

  if (isValidIndex(index, inputVector) && userImageState[index] !== 1) {
    userImageState[index] = 1;
  }

  isDrawing = true;
};

const handleMouseMove = (e) => {
  if (!isDrawing) return;

  userContext.fillStyle = 'black';
  userContext.fillRect(
    Math.floor(e.offsetX / squareSize) * squareSize,
    Math.floor(e.offsetY / squareSize) * squareSize,
    squareSize,
    squareSize
  );

  const { clientX, clientY } = e;
  const coords = getNewSquareCoords(userCanvas, clientX, clientY, squareSize);
  const index = calcIndex(coords.x, coords.y, gridSize);

  if (isValidIndex(index, inputVector) && userImageState[index] !== 1) {
    userImageState[index] = 1;
  }
};

const stopDrawing = () => {
  isDrawing = false;
};

const clearCurrentImage = () => {
  drawGrid(userContext);
  drawGrid(netContext);
  userImageState = new Array(gridSize * gridSize).fill(-1);
};

const memorizeImage = () => {
  for (let i = 0; i < inputVector; i += 1) {
    for (let j = 0; j < inputVector; j += 1) {
      if (i === j) weights[i][j] = 0;
      else {
        weights[i][j] += userImageState[i] * userImageState[j];
      }
    }
  }
  console.log(userImageState);
};

const recognizeSignal = () => {
  let oldImage = [...userImageState];
  let prevNetState;
  const currNetState = [...userImageState];
  let counter = 0;
  do {
    counter += 1;
    prevNetState = [...currNetState];
    for (let i = 0; i < inputVector; i += 1) {
      let sum = 0;
      for (let j = 0; j < inputVector; j += 1) {
        sum += weights[i][j] * prevNetState[j];
      }
      currNetState[i] = sum >= 0 ? 1 : -1;
    }
    if (counter === 999) {
      console.log('Не могу вспомнить образ');
      return;
    }
  } while (!_.isEqual(currNetState, prevNetState));

  error = currNetState.map((x, i) => x - oldImage[i]);
  error = error.filter((x) => x == 0).length / error.length;

  console.log(error);

  drawImageFromArray(currNetState, netContext);
};

const resetButton = document.getElementById('resetButton');
const memoryButton = document.getElementById('memoryButton');
const recognizeButton = document.getElementById('recognizeButton');

userCanvas.addEventListener('mousedown', (e) => handleMouseDown(e));
userCanvas.addEventListener('mousemove', (e) => handleMouseMove(e));
userCanvas.addEventListener('mouseup', () => stopDrawing());
userCanvas.addEventListener('mouseleave', () => stopDrawing());

resetButton.addEventListener('click', () => clearCurrentImage());
memoryButton.addEventListener('click', () => memorizeImage());
recognizeButton.addEventListener('click', () => recognizeSignal());

drawGrid(userContext);
drawGrid(netContext);
