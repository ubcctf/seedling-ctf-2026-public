const msg = document.getElementById("shop-msg")

async function post(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({ error: "Request failed" }))
  if (!res.ok) throw new Error(data.error || "Request failed")
  return data
}

function showBalance(data) {
  document.getElementById("nav-credits").textContent = data.credits
  document.getElementById("nav-dollars").textContent = "$" + data.dollars
}

document.getElementById("to-dollars").addEventListener("submit", async (e) => {
  e.preventDefault()
  const credits = Number(document.getElementById("credits-in").value)
  try {
    showBalance(
      await post("/convert", { credits: -credits, money: credits / rate }),
    )
    msg.textContent = `Converted ${credits} credits to $${credits / rate}.`
  } catch (err) {
    msg.textContent = err.message
  }
})

document.getElementById("to-credits").addEventListener("submit", async (e) => {
  e.preventDefault()
  const dollars = Number(document.getElementById("dollars-in").value)
  try {
    showBalance(
      await post("/convert", { credits: dollars * rate, money: -dollars }),
    )
    msg.textContent = `Converted $${dollars} to ${dollars * rate} credits.`
  } catch (err) {
    msg.textContent = err.message
  }
})

document.querySelectorAll(".buy").forEach((btn) => {
  btn.addEventListener("click", async () => {
    try {
      const data = await post("/shop/buy", { item_id: Number(btn.dataset.id) })
      if (data.redirect) return (location.href = data.redirect)
      location.reload()
    } catch (err) {
      msg.textContent = err.message
    }
  })
})
