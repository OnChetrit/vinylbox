import { NextResponse } from "next/server";

const DISCOGS_API = "https://api.discogs.com";

function isAllowedPath(path: string) {
  return (
    path === "/oauth/identity" ||
    path === "/database/search" ||
    /^\/releases\/\d+$/.test(path) ||
    /^\/masters\/\d+$/.test(path) ||
    /^\/users\/[^/]+\/collection\/folders(?:\/\d+\/releases(?:\/\d+(?:\/instances\/\d+)?)?)?$/.test(
      path,
    )
  );
}

async function proxy(request: Request) {
  const token = request.headers.get("x-discogs-token")?.trim();
  const url = new URL(request.url);
  const path = url.searchParams.get("path") ?? "";

  if (!token) {
    return NextResponse.json({ error: "A Discogs personal access token is required." }, { status: 401 });
  }

  if (!isAllowedPath(path)) {
    return NextResponse.json({ error: "Unsupported Discogs endpoint." }, { status: 400 });
  }

  const query = new URLSearchParams(url.searchParams);
  query.delete("path");
  const target = `${DISCOGS_API}${path}${query.size ? `?${query.toString()}` : ""}`;

  const response = await fetch(target, {
    method: request.method,
    headers: {
      Authorization: `Discogs token=${token}`,
      "User-Agent": "VinylBox/2.0",
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const text = await response.text();
  const contentType = response.headers.get("content-type") ?? "application/json";

  return new NextResponse(text, {
    status: response.status,
    headers: { "content-type": contentType, "cache-control": "no-store" },
  });
}

export async function GET(request: Request) {
  return proxy(request);
}

export async function PUT(request: Request) {
  return proxy(request);
}

export async function DELETE(request: Request) {
  return proxy(request);
}
