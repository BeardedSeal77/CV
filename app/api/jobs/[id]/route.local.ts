import { type IdContext, respond } from "@/lib/jobhunt/http"
import { getOpportunity, updateListing } from "@/lib/jobhunt/store"

export async function GET(_request: Request, { params }: IdContext) {
  const { id } = await params
  return respond(() => getOpportunity(id))
}

/** Body: listing fields to change */
export async function PATCH(request: Request, { params }: IdContext) {
  const { id } = await params
  return respond(async () => updateListing(id, await request.json()))
}
