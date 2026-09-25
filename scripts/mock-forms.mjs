// Local stand-in for the Apps Script web app, for testing the forms without a Sheet.
// Mirrors Code.gs: same spam checks, same tabs, and the same 302 → JSON hop that
// Apps Script does. Rows are kept in memory and listed at GET /rows.
//
//   node scripts/mock-forms.mjs            # listens on :8788
//   VITE_FORMS_ENDPOINT=http://localhost:8788/exec pnpm dev
import { createServer } from "node:http"

const PORT = Number(process.env.PORT || 8788)
const tabs = { beta: [], sample_letter: [] }
const replies = new Map()
let n = 0

const cors = { "Access-Control-Allow-Origin": "*" }

function handle(body) {
  let data
  try {
    data = JSON.parse(body)
  } catch {
    return { ok: false, error: "bad_json" }
  }
  if (data.website) return { ok: false, error: "rejected" }
  if (!data.startedAt || Date.now() - Number(data.startedAt) < 3000) return { ok: false, error: "too_fast" }
  if (!tabs[data.form]) return { ok: false, error: "unknown_form" }
  tabs[data.form].push({ timestamp: new Date().toISOString(), ...data })
  return { ok: true }
}

createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  if (req.method === "POST" && url.pathname === "/exec") {
    let body = ""
    req.on("data", (c) => (body += c))
    req.on("end", () => {
      const id = String(++n)
      replies.set(id, handle(body))
      console.log(req.headers["content-type"], "→", replies.get(id))
      res.writeHead(302, { ...cors, Location: `/echo?id=${id}` }).end()
    })
    return
  }
  if (url.pathname === "/echo") {
    res.writeHead(200, { ...cors, "Content-Type": "application/json" })
    return res.end(JSON.stringify(replies.get(url.searchParams.get("id")) ?? { ok: false, error: "gone" }))
  }
  if (url.pathname === "/rows") {
    res.writeHead(200, { ...cors, "Content-Type": "application/json" })
    return res.end(JSON.stringify(tabs, null, 2))
  }
  res.writeHead(404, cors).end()
}).listen(PORT, () => console.log(`mock forms endpoint on http://localhost:${PORT}/exec`))
