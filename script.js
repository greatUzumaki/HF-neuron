let gridSize = 10; // Размер сетки
const squareSize = 45; // клетка
let inputVector = gridSize * gridSize;
let isDrawing = false;
const weights = [];
let userImageState = [];
let all_Images = [];
let result = [];
const E = 0.05; // Коэф для переобучения;

for (let i = 0; i < inputVector; i++) {
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

// Сетка
const drawGrid = (ctx) => {
  ctx.beginPath();
  ctx.fillStyle = 'white';
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'black';
  for (let row = 0; row < gridSize; row++) {
    for (let column = 0; column < gridSize; column++) {
      const x = column * squareSize;
      const y = row * squareSize;
      ctx.rect(x, y, squareSize, squareSize);
      ctx.fill();
      ctx.stroke();
    }
  }
  ctx.closePath();
};

// Рисуем образ сети
const drawImageFromArray = (data, ctx) => {
  const twoDimData = [];
  while (data.length) twoDimData.push(data.splice(0, gridSize));

  drawGrid(ctx);
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      if (twoDimData[i][j] === 1) {
        ctx.fillStyle = 'black';
        ctx.fillRect(j * squareSize, i * squareSize, squareSize, squareSize);
      }
    }
  }

  // Просчёт ошибки
  let all_errors = [];
  let flatRecog = twoDimData.flat();
  for (let index = 0; index < all_Images.length; index++) {
    let currImage = all_Images[index];
    let error = 0;
    for (let i = 0; i < flatRecog.length; i++) {
      if (flatRecog[i] !== currImage[i]) error++;
    }
    error = error / flatRecog.length;
    all_errors.push(error);
  }

  let error_index = all_errors.indexOf(Math.min(...all_errors));
  console.log(
    `На ${(1 - all_errors[error_index]) * 100}% это образ ${error_index + 1}`
  );
  console.log(all_errors);
};

// Ивенты мыши
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

// Сброс картинки
const clearCurrentImage = () => {
  drawGrid(userContext);
  drawGrid(netContext);
  userImageState = new Array(gridSize * gridSize).fill(-1);
};

// Запомнить образ
const memorizeImage = () => {
  for (let i = 0; i < inputVector; i++) {
    for (let j = 0; j < inputVector; j++) {
      if (i === j) weights[i][j] = 0;
      else {
        weights[i][j] += userImageState[i] * userImageState[j];
      }
    }
  }

  all_Images.push(userImageState);
};

// Переобучить
const reTrain = () => {
  for (let i = 0; i < inputVector; i++) {
    for (let j = 0; j < inputVector; j++) {
      if (i === j) weights[i][j] = 0;
      else {
        weights[i][j] -= E * (result[i] * result[j]);
      }
    }
  }
};

// Распознать
const recognizeImage = () => {
  let prevNetState;
  const currNetState = [...userImageState];
  let counter = 0;
  do {
    counter += 1;
    prevNetState = [...currNetState];
    for (let i = 0; i < inputVector; i++) {
      let sum = 0;
      for (let j = 0; j < inputVector; j++) {
        sum += weights[i][j] * prevNetState[j];
      }
      currNetState[i] = sum >= 0 ? 1 : -1;
    }
    if (counter === 999) {
      console.log('Не могу вспомнить');
      return;
    }
  } while (!_.isEqual(currNetState, prevNetState));

  console.log(`Попыток распознать: ${counter}`);
  result = currNetState.slice();

  drawImageFromArray(currNetState, netContext);
};

// Кнопки
const resetButton = document.getElementById('resetButton');
const memoryButton = document.getElementById('memoryButton');
const recognizeButton = document.getElementById('recognizeButton');
const retrainButton = document.getElementById('retrainButton');

userCanvas.addEventListener('mousedown', (e) => handleMouseDown(e));
userCanvas.addEventListener('mousemove', (e) => handleMouseMove(e));
userCanvas.addEventListener('mouseup', () => stopDrawing());
userCanvas.addEventListener('mouseleave', () => stopDrawing());

resetButton.addEventListener('click', () => clearCurrentImage());
memoryButton.addEventListener('click', () => memorizeImage());
recognizeButton.addEventListener('click', () => recognizeImage());
retrainButton.addEventListener('click', () => reTrain());

// Инит сетки
drawGrid(userContext);
drawGrid(netContext);
