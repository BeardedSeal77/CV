import { respond } from "@/lib/jobhunt/http"
import { jobStats } from "@/lib/jobhunt/stats"
import { addOpportunity, listOpportunities } from "@/lib/jobhunt/store"

export async function GET() {
  return respond(async () => {
    const opportunities = await listOpportunities()
    return { opportunities, stats: jobStats(opportunities) }
  })
}

export async function POST(request: Request) {
  return respond(async () => addOpportunity(await request.json()))
}
