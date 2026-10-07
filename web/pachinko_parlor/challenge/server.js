const crypto = require("crypto")
const path = require("path")
const express = require("express")
const session = require("express-session")
const PgSession = require("connect-pg-simple")(session)
const { Pool } = require("pg")

const port = Number(process.env.PORT)
const flag = process.env.FLAG
const sessionSecret = process.env.SESSION_SECRET
const dbUrl = process.env.DATABASE_URL

if (!port || !flag || !sessionSecret || !dbUrl) {
  throw new Error("One of the env vars is unset")
}

const pool = new Pool({ connectionString: dbUrl, max: 20 })

const minBet = 10
const maxBet = 100
const maxBalls = 20
const winPercent = 50
const winWeights = { 1: 600, 2: 280, 5: 90, 10: 22, 25: 6, 50: 2 }
const halfBoard = [50, 0, 25, 10, 0, 5, 2, 0, 1]
const slots = [...halfBoard, "flag", ...[...halfBoard].reverse()]

const app = express()
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))
app.use(express.static(path.join(__dirname, "public")))
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(
  session({
    store: new PgSession({ pool, createTableIfMissing: true }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 99999999999,
    },
  }),
)

function randomIntFromInterval(min, max) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min)
}

const errorHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next)

app.use(
  errorHandler(async (req, res, next) => {
    res.locals.user = null
    if (req.session.userId) {
      const { rows } = await pool.query(
        "select id, username, role, dollars, credits from users where id = $1",
        [req.session.userId],
      )
      res.locals.user = rows[0] || null
    }
    next()
  }),
)

function requireLogin(req, res, next) {
  if (res.locals.user) return next()
  if (req.is("json")) {
    return res.status(401).json({ error: "Not logged in" })
  }
  res.redirect("/")
}

// xdddddd this is gonna ruin so many peoples days
function requireAdult(req, res, next) {
  if (res.locals.user.role === "over_18") return next()
  res.status(403).json({
    error:
      "You must be over 18 to use this website. Please change your age in settings",
  })
}

app.get("/", (req, res) => {
  if (res.locals.user) return res.redirect("/pachinko")
  res.render("index")
})

app.get("/signup", (req, res) => {
  res.render("signup", { error: null })
})

app.post(
  "/signup",
  errorHandler(async (req, res) => {
    const renderError = (status, error) =>
      res.status(status).render("signup", { error })

    const { username, password } = req.body

    if (
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 128
    ) {
      return renderError(400, "Password must be 8 to 128 characters")
    }

    let userId
    try {
      const { rows } = await pool.query(
        "insert into users (username, password, role) values ($1, $2, 'over_18') returning id",
        [username, password],
      )
      userId = rows[0].id
    } catch (err) {
      if (err.detail.includes("already exists")) {
        return renderError(400, "Username has been taken")
      }

      throw err
    }

    req.session.userId = userId
    res.redirect("/welcome")
  }),
)

app.get("/welcome", requireLogin, (req, res) => {
  res.render("welcome")
})

app.get(
  "/set_age_to_underage",
  requireLogin,
  errorHandler(async (req, res) => {
    await pool.query("update users set role = 'underage' where id = $1", [
      res.locals.user.id,
    ])
    res.json({ ok: true })
  }),
)

app.get("/login", (req, res) => {
  if (res.locals.user) return res.redirect("/pachinko")
  res.render("login", { error: null })
})

app.post(
  "/login",
  errorHandler(async (req, res) => {
    const renderError = (status, error) =>
      res.status(status).render("login", { error })

    const { username, password } = req.body
    if (!username || !password) {
      return renderError(400, "Username and password are required")
    }
    const { rows } = await pool.query(
      "select id, password from users where username = $1",
      [username],
    )
    if (!rows[0] || password !== rows[0].password) {
      return renderError(401, "Wrong username or password")
    }
    req.session.userId = rows[0].id
    res.redirect("/pachinko")
  }),
)

app.post("/logout", (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err)
    res.clearCookie("connect.sid")
    res.redirect("/")
  })
})

app.get("/settings", requireLogin, (req, res) => {
  res.render("settings")
})

app.get("/pachinko", requireLogin, (req, res) => {
  res.render("pachinko", { slots, minBet, maxBet, maxBalls })
})

function pickMultiplier() {
  if (randomIntFromInterval(0, 100) >= winPercent) return 0
  let roll = randomIntFromInterval(0, 999)
  for (const [mult, weight] of Object.entries(winWeights)) {
    if (roll < weight) return Number(mult)
    roll -= weight
  }
}

function dropBall(bet) {
  const mult = pickMultiplier()
  const candidates = slots.flatMap((value, i) => (value === mult ? [i] : []))
  const slot = candidates[randomIntFromInterval(0, candidates.length - 1)]
  return { slot, mult, delta: bet * mult - bet }
}

app.post(
  "/pachinko/play",
  requireLogin,
  requireAdult,
  errorHandler(async (req, res) => {
    const { bet, balls } = req.body || {}
    if (!Number.isInteger(bet) || bet < minBet || bet > maxBet) {
      return res.status(400).json({
        error: `Bet must be a integer from ${minBet} to ${maxBet}.`,
      })
    }
    if (!Number.isInteger(balls) || balls < 1 || balls > maxBalls) {
      return res
        .status(400)
        .json({ error: `You can drop 1 to ${maxBalls} balls at once.` })
    }

    const results = Array.from({ length: balls }, () => dropBall(bet))
    const delta = results.reduce((sum, r) => sum + r.delta, 0)

    const { rows } = await pool.query(
      "update users set credits = credits + $2 where id = $1 and credits >= $3 returning credits",
      [res.locals.user.id, delta, bet * balls],
    )
    if (!rows[0]) return res.status(400).json({ error: "Not enough credits" })
    res.json({ results, delta, credits: rows[0].credits })
  }),
)

app.get(
  "/shop",
  requireLogin,
  errorHandler(async (req, res) => {
    if (res.locals.user.role !== "over_18") {
      return res.redirect("/pachinko?age_gate=1")
    }

    const { rows: items } = await pool.query(
      `select s.id, s.item_name, s.item_image_url, s.price, (o.user_id is not null) as owned
       from shop_items s
              left join owns o on o.shop_item_id = s.id and o.user_id = $1
       order by s.price`,
      [res.locals.user.id],
    )
    res.render("shop", {
      items,
      rate: 100,
      minCredits: 1000,
    })
  }),
)

app.post(
  "/convert",
  requireLogin,
  requireAdult,
  errorHandler(async (req, res) => {
    const body = req.body || {}
    const { credits, money } = body
    const userId = res.locals.user.id

    if (money === undefined) {
      return res.status(400).json({ error: "Money is required" })
    }

    if (!Number.isInteger(money)) {
      return res.status(400).json({ error: "Money must be of integer type" })
    }

    if (Math.abs(money) >= 2147483647) {
      return res.status(400).json({ error: "Money is too large" })
    }

    try {
      // I was gonna do this in some clever way but gave up. Gotta make sure this is closed source now
      if (credits === undefined) {
        const { rows } = await pool.query(
          "update users set dollars = dollars + $2 where id = $1 returning dollars, credits",
          [userId, money],
        )
        return res.json(rows[0])
      }

      if (!Number.isInteger(credits)) {
        return res.status(400).json({ error: "Credits must of integer type" })
      }

      if (Math.abs(credits) < 1000) {
        return res.status(400).json({
          error: "You must exchange at least 1000 credits at a time.",
        })
      }

      if (credits !== -money * 100) {
        return res.status(400).json({
          error: "The exchange rate is 100 credits per dollar.",
        })
      }

      const { rows } = await pool.query(
        `update users
         set credits = credits + $2,
             dollars = dollars + $3
         where id = $1
           and credits + $2 >= 0
           and dollars + $3 >= 0 returning dollars, credits`,
        [userId, credits, money],
      )

      if (!rows[0]) {
        return res.status(400).json({ error: "Insufficient balance" })
      }

      res.json(rows[0])
    } catch (err) {
      throw err
    }
  }),
)

app.post(
  "/shop/buy",
  requireLogin,
  requireAdult,
  errorHandler(async (req, res) => {
    const itemId = req.body && req.body.item_id
    if (!Number.isInteger(itemId)) {
      return res.status(400).json({ error: "Item ID must be of integer type" })
    }

    const { rows: items } = await pool.query(
      "select item_name, price from shop_items where id = $1",
      [itemId],
    )
    if (!items[0]) return res.status(404).json({ error: "No such item" })

    const inserted = await pool.query(
      "insert into owns (shop_item_id, user_id) values ($1, $2) on conflict do nothing returning user_id",
      [itemId, res.locals.user.id],
    )
    if (!inserted.rows[0]) {
      return res.status(400).json({ error: "You already own this" })
    }

    const paid = await pool.query(
      "update users set dollars = dollars - $2 where id = $1 and dollars >= $2 returning dollars, credits",
      [res.locals.user.id, items[0].price],
    )
    if (!paid.rows[0]) {
      await pool.query(
        "delete from owns where shop_item_id = $1 and user_id = $2",
        [itemId, res.locals.user.id],
      )
      return res.status(400).json({ error: "Not enough dollars" })
    }
    res.json({
      ...paid.rows[0],
      redirect: items[0].item_name === "flag" ? "/win" : null,
    })
  }),
)

app.get(
  "/win",
  requireLogin,
  errorHandler(async (req, res) => {
    const { rows } = await pool.query(
      `select 1
       from owns o
              join shop_items s on s.id = o.shop_item_id
       where o.user_id = $1
         and s.item_name = 'flag'`,
      [res.locals.user.id],
    )
    if (!rows[0]) return res.redirect("/shop")
    res.render("win", { flag })
  }),
)

app.use((req, res) => res.status(404).send("Not found"))
app.use((err, req, res, next) => {
  res.status(500).send("Internal server error")
})

app.listen(port, () => console.log(`listening on :${port}`))
