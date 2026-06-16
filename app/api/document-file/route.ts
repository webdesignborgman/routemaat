import { NextRequest, NextResponse } from "next/server";

const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

export async function GET(request: NextRequest) {
  const filePath = request.nextUrl.searchParams.get("path")?.trim() ?? "";
  const authorization = request.headers.get("authorization");

  if (!storageBucket) {
    return NextResponse.json(
      { message: "Firebase Storage is nog niet geconfigureerd." },
      { status: 500 }
    );
  }

  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json(
      { message: "Log opnieuw in om dit bestand te openen." },
      { status: 401 }
    );
  }

  if (!isValidTripDocumentPath(filePath)) {
    return NextResponse.json(
      { message: "Bestandspad is ongeldig." },
      { status: 400 }
    );
  }

  const storageUrl = new URL(
    `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodeURIComponent(
      filePath
    )}`
  );
  storageUrl.searchParams.set("alt", "media");

  const storageResponse = await fetch(storageUrl, {
    headers: {
      Authorization: `Firebase ${authorization.slice("Bearer ".length)}`,
    },
    cache: "no-store",
  });

  if (!storageResponse.ok || !storageResponse.body) {
    return NextResponse.json(
      { message: "Bestand ophalen lukt niet." },
      { status: storageResponse.status }
    );
  }

  return new NextResponse(storageResponse.body, {
    status: 200,
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": contentDispositionHeader(filePath),
      "Content-Type":
        storageResponse.headers.get("content-type") ??
        "application/octet-stream",
    },
  });
}

function isValidTripDocumentPath(filePath: string) {
  const pathParts = filePath.split("/");

  return (
    pathParts.length === 5 &&
    pathParts[0] === "trips" &&
    pathParts[1].length > 0 &&
    pathParts[2] === "documents" &&
    pathParts[3].length > 0 &&
    pathParts[4].length > 0 &&
    !pathParts.some((part) => part === "." || part === "..")
  );
}

function contentDispositionHeader(filePath: string) {
  const fileName = filePath.split("/").at(-1) ?? "bestand";
  const safeFileName = fileName.replace(/["\\\r\n]/g, "_");

  return `inline; filename="${safeFileName}"`;
}
