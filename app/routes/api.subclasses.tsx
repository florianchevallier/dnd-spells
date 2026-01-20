import type { Route } from "./+types/api.subclasses";
import type { getSubclassesByClassId } from "~/db/queries/characters.server";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const classId = url.searchParams.get("classId");

  if (!classId) {
    return Response.json({ subclasses: [] });
  }

  const subclasses = await getSubclassesByClassId(Number(classId));
  return Response.json({ subclasses });
}
