import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('App root element was not found.')
}

app.innerHTML = `
  <main class="game-shell">
    <h1>Ping Pong Game</h1>
    <p class="subtitle">Move with ArrowUp / ArrowDown / W / S</p>
    <canvas id="game" width="800" height="480" aria-label="Pong game area"></canvas>
    <p id="status" class="status">First to 7 points wins.</p>
    <button id="restart" class="restart" type="button" hidden>Restart game</button>
  </main>
`

const canvas = document.querySelector<HTMLCanvasElement>('#game')
const statusText = document.querySelector<HTMLParagraphElement>('#status')
const restartButton = document.querySelector<HTMLButtonElement>('#restart')

if (!canvas || !statusText || !restartButton) {
  throw new Error('Game UI failed to initialize.')
}

const ctx = canvas.getContext('2d')

if (!ctx) {
  throw new Error('Canvas 2D context is unavailable.')
}

type Paddle = {
  x: number
  y: number
  width: number
  height: number
  speed: number
}

type Ball = {
  x: number
  y: number
  radius: number
  vx: number
  vy: number
  speed: number
}

const WINNING_SCORE = 7
const PADDLE_MARGIN = 24
const BALL_BASE_SPEED = 340

const player: Paddle = {
  x: PADDLE_MARGIN,
  y: canvas.height / 2 - 45,
  width: 12,
  height: 90,
  speed: 420,
}

const computer: Paddle = {
  x: canvas.width - PADDLE_MARGIN - 12,
  y: canvas.height / 2 - 45,
  width: 12,
  height: 90,
  speed: 320,
}

const ball: Ball = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 8,
  vx: BALL_BASE_SPEED,
  vy: BALL_BASE_SPEED * 0.45,
  speed: BALL_BASE_SPEED,
}

let playerScore = 0
let computerScore = 0
let moveUp = false
let moveDown = false
let gameOver = false
let lastFrameTime = performance.now()
let spinDirection: 1 | -1 = 1
let serveDirection: 1 | -1 = 1

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value))

const resetBall = (direction: 1 | -1): void => {
  ball.x = canvas.width / 2
  ball.y = canvas.height / 2
  ball.speed = BALL_BASE_SPEED
  ball.vx = ball.speed * direction
  ball.vy = ball.speed * 0.45 * spinDirection
  spinDirection = spinDirection === 1 ? -1 : 1
}

const restartGame = (): void => {
  playerScore = 0
  computerScore = 0
  player.y = canvas.height / 2 - player.height / 2
  computer.y = canvas.height / 2 - computer.height / 2
  gameOver = false
  restartButton.hidden = true
  statusText.textContent = 'First to 7 points wins.'
  serveDirection = 1
  resetBall(serveDirection)
}

const handleScore = (scoredByPlayer: boolean): void => {
  if (scoredByPlayer) {
    playerScore += 1
  } else {
    computerScore += 1
  }

  if (playerScore >= WINNING_SCORE || computerScore >= WINNING_SCORE) {
    gameOver = true
    const winner = playerScore > computerScore ? 'You win!' : 'Computer wins!'
    statusText.textContent = `${winner} Press the button or Enter/Space to restart.`
    restartButton.hidden = false
    return
  }

  resetBall(scoredByPlayer ? -1 : 1)
}

const onKeyDown = (event: KeyboardEvent): void => {
  if (event.code === 'ArrowUp' || event.code === 'KeyW') {
    moveUp = true
    event.preventDefault()
    return
  }

  if (event.code === 'ArrowDown' || event.code === 'KeyS') {
    moveDown = true
    event.preventDefault()
    return
  }

  if (gameOver && (event.code === 'Enter' || event.code === 'Space')) {
    restartGame()
    event.preventDefault()
  }
}

const onKeyUp = (event: KeyboardEvent): void => {
  if (event.code === 'ArrowUp' || event.code === 'KeyW') {
    moveUp = false
    return
  }

  if (event.code === 'ArrowDown' || event.code === 'KeyS') {
    moveDown = false
  }
}

window.addEventListener('keydown', onKeyDown)
window.addEventListener('keyup', onKeyUp)
restartButton.addEventListener('click', restartGame)

const updatePaddles = (deltaSeconds: number): void => {
  const verticalMovement =
    (moveDown ? player.speed * deltaSeconds : 0) -
    (moveUp ? player.speed * deltaSeconds : 0)

  player.y = clamp(player.y + verticalMovement, 0, canvas.height - player.height)

  const computerCenter = computer.y + computer.height / 2
  const difference = ball.y - computerCenter
  const adjustment = clamp(
    difference,
    -computer.speed * deltaSeconds,
    computer.speed * deltaSeconds,
  )

  computer.y = clamp(computer.y + adjustment, 0, canvas.height - computer.height)
}

const collideBallWithPaddle = (paddle: Paddle): void => {
  const isInsideX =
    ball.x + ball.radius >= paddle.x && ball.x - ball.radius <= paddle.x + paddle.width
  const isInsideY =
    ball.y + ball.radius >= paddle.y && ball.y - ball.radius <= paddle.y + paddle.height

  if (!isInsideX || !isInsideY) {
    return
  }

  const movingTowardPaddle =
    (paddle === player && ball.vx < 0) || (paddle === computer && ball.vx > 0)

  if (!movingTowardPaddle) {
    return
  }

  const hitPosition =
    ((ball.y - (paddle.y + paddle.height / 2)) / (paddle.height / 2)) * 0.85

  ball.vx = -ball.vx
  ball.vy = ball.speed * hitPosition
  ball.speed += 12

  const direction = ball.vx > 0 ? 1 : -1
  ball.vx = direction * Math.max(ball.speed, Math.abs(ball.vx))

  if (paddle === player) {
    ball.x = player.x + player.width + ball.radius
  } else {
    ball.x = computer.x - ball.radius
  }
}

const updateBall = (deltaSeconds: number): void => {
  ball.x += ball.vx * deltaSeconds
  ball.y += ball.vy * deltaSeconds

  if (ball.y - ball.radius <= 0) {
    ball.y = ball.radius
    ball.vy = Math.abs(ball.vy)
  } else if (ball.y + ball.radius >= canvas.height) {
    ball.y = canvas.height - ball.radius
    ball.vy = -Math.abs(ball.vy)
  }

  collideBallWithPaddle(player)
  collideBallWithPaddle(computer)

  if (ball.x + ball.radius < 0) {
    handleScore(false)
  } else if (ball.x - ball.radius > canvas.width) {
    handleScore(true)
  }
}

const drawCourt = (): void => {
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.strokeStyle = '#1e293b'
  ctx.setLineDash([8, 12])
  ctx.beginPath()
  ctx.moveTo(canvas.width / 2, 0)
  ctx.lineTo(canvas.width / 2, canvas.height)
  ctx.stroke()
  ctx.setLineDash([])
}

const drawPaddle = (paddle: Paddle): void => {
  ctx.fillStyle = '#e2e8f0'
  ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height)
}

const drawBall = (): void => {
  ctx.fillStyle = '#facc15'
  ctx.beginPath()
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)
  ctx.fill()
}

const drawScore = (): void => {
  ctx.fillStyle = '#93c5fd'
  ctx.font = '36px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(String(playerScore), canvas.width * 0.25, 52)
  ctx.fillText(String(computerScore), canvas.width * 0.75, 52)
}

const tick = (timestamp: number): void => {
  const deltaSeconds = Math.min((timestamp - lastFrameTime) / 1000, 0.033)
  lastFrameTime = timestamp

  if (!gameOver) {
    updatePaddles(deltaSeconds)
    updateBall(deltaSeconds)
  }

  drawCourt()
  drawPaddle(player)
  drawPaddle(computer)
  drawBall()
  drawScore()

  requestAnimationFrame(tick)
}

resetBall(serveDirection)
requestAnimationFrame(tick)
