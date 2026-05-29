async function test() {
  try {
    const res = await fetch("http://localhost:3000/api/feed?niche=motivation&source=instagram&sort=score&limit=100")
    console.log("Status:", res.status)
    const data = await res.json()
    console.log("Full data:", JSON.stringify(data, null, 2))
  } catch (e) {
    console.error("Test failed:", e)
  }
}

test()
