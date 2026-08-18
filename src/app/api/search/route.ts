import { NextResponse } from "next/server";
import { searchVinyls } from "@/lib/discogs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") ?? "";
  const genre = searchParams.get("genre") ?? undefined;
  const style = searchParams.get("style") ?? undefined;
  const year = searchParams.get("year") ?? undefined;
  const sort = searchParams.get("sort") as
    | "year"
    | "title"
    | "artist"
    | "format"
    | "label"
    | "catno"
    | "genre"
    | "style"
    | "country"
    | null;
  const sortOrder = searchParams.get("sortOrder") as "asc" | "desc" | null;
  const page = Number(searchParams.get("page") ?? "1");
  const perPage = Number(searchParams.get("perPage") ?? "18");

  const results = await searchVinyls(query.trim(), {
    genre,
    style,
    year,
    sort,
    sortOrder,
    page,
    perPage,
  });

  return NextResponse.json(results);
}



