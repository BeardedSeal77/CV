import { type IdContext, respond } from "@/lib/jobhunt/http"
import { logEvent } from "@/lib/jobhunt/store"

/** Body: { date?, status?, note?, link? } */
export async function POST(request: Request, { params }: IdContext) {
  const { id } = await params
  return respond(async () => logEvent(id, await request.json()))
}
