const canvas = document.getElementById("board")
const ctx = canvas.getContext("2d")
const dropBtn = document.getElementById("drop")
const betInput = document.getElementById("bet")
const ballsInput = document.getElementById("balls")
const resultEl = document.getElementById("result")

const rows = slots.length - 1
const gap = 30
const rowH = 22
const boardTop = 20
const cx = canvas.width / 2
const pegR = 3
const ballR = 6
const slotTop = boardTop + rows * rowH + 10
const slotBottom = canvas.height - 6
const segMs = 110
const staggerMs = 140
const slotColors = {
  0: "#eee",
  1: "#e6f4e0",
  2: "#cfe9c8",
  5: "#b3dca6",
  10: "#ffe0a3",
  25: "#ffc078",
  50: "#ff8f66",
  flag: "#ffd700",
}

const pegX = (row, col) => cx + (col - row / 2) * gap
const pegY = (row) => boardTop + row * rowH
const slotX = (i) => cx + (i - rows / 2) * gap
const slotLabel = (value) =>
  value === "flag" ? "FLAG" : value === 0 ? "LOSE" : value + "x"

function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.textAlign = "center"
  ctx.font = "bold 9px sans-serif"
  slots.forEach((value, i) => {
    const x = slotX(i) - gap / 2
    ctx.fillStyle = slotColors[value]
    ctx.fillRect(x, slotTop, gap, slotBottom - slotTop)
    ctx.strokeStyle = "#999"
    ctx.strokeRect(x, slotTop, gap, slotBottom - slotTop)
    ctx.fillStyle = "#333"
    ctx.fillText(slotLabel(value), slotX(i), slotBottom - 8)
  })
  ctx.fillStyle = "#555"
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c <= r; c++) {
      ctx.beginPath()
      ctx.arc(pegX(r, c), pegY(r), pegR, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function drawBall(x, y) {
  ctx.fillStyle = "#c33"
  ctx.beginPath()
  ctx.arc(x, y, ballR, 0, Math.PI * 2)
  ctx.fill()
}

function pathTo(slot) {
  const moves = Array.from({ length: rows }, (_, i) => (i < slot ? 1 : 0))
  for (let i = moves.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[moves[i], moves[j]] = [moves[j], moves[i]]
  }
  const points = [{ x: cx, y: 0 }]
  let col = 0
  for (let r = 0; r < rows; r++) {
    points.push({ x: pegX(r, col), y: pegY(r) - pegR - ballR })
    col += moves[r]
  }
  points.push({ x: slotX(slot), y: slotTop + ballR + 4 })
  return points
}

function ballPosition(points, elapsed) {
  const t = elapsed / segMs
  const seg = Math.floor(t)
  if (seg >= points.length - 1) return null
  const a = points[seg]
  const b = points[seg + 1]
  const f = t - seg
  const hop = seg === 0 ? 0 : 10 * Math.sin(Math.PI * f)
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f * f - hop }
}

function animate(slots) {
  const balls = slots.map((slot, i) => ({
    slot,
    points: pathTo(slot),
    delay: i * staggerMs,
  }))
  const landedY = (count) => slotBottom - 22 - count * (ballR * 2 - 2)
  return new Promise((resolve) => {
    const start = performance.now()

    function frame(now) {
      drawBoard()
      const landed = {}
      let moving = false
      for (const ball of balls) {
        const elapsed = now - start - ball.delay
        if (elapsed < 0) {
          moving = true
          continue
        }
        const pos = ballPosition(ball.points, elapsed)
        if (pos) {
          moving = true
          drawBall(pos.x, pos.y)
        } else {
          const count = (landed[ball.slot] = (landed[ball.slot] || 0) + 1) - 1
          drawBall(slotX(ball.slot), Math.max(slotTop + ballR, landedY(count)))
        }
      }
      if (moving) requestAnimationFrame(frame)
      else resolve()
    }

    requestAnimationFrame(frame)
  })
}

function summarize(data) {
  const hits = {}
  for (const r of data.results) hits[r.mult] = (hits[r.mult] || 0) + 1
  const parts = Object.keys(hits)
    .sort((a, b) => b - a)
    .map((m) => `${slotLabel(Number(m))}${hits[m]}`)
  const net = data.delta >= 0 ? `won ${data.delta}` : `lost ${-data.delta}`
  return `You ${net} credits.`
}

dropBtn.addEventListener("click", async () => {
  if (underage) return ageGateAlert()
  dropBtn.disabled = true
  resultEl.textContent = ""
  try {
    const res = await fetch("/pachinko/play", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bet: Number(betInput.value),
        balls: Number(ballsInput.value),
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      resultEl.textContent = data.error || "Something went wrong"
      return
    }
    await animate(data.results.map((r) => r.slot))
    resultEl.textContent = summarize(data)
    document.getElementById("nav-credits").textContent = data.credits
  } catch {
    resultEl.textContent = "Something went wrong"
  } finally {
    dropBtn.disabled = false
  }
})

drawBoard()
