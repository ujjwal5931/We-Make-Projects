import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import fs from "fs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: segments } = await params;
    if (!segments || segments.length === 0) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Sanitize subpath to prevent path traversal
    const safeSegments = segments.map((s) => path.basename(s));
    const subpath = safeSegments.join(path.sep);

    // Look in public/uploads first, then in uploads
    const publicPath = path.join(process.cwd(), "public", "uploads", subpath);
    const rootPath = path.join(process.cwd(), "uploads", subpath);

    let filePath = "";
    if (fs.existsSync(publicPath)) {
      filePath = publicPath;
    } else if (fs.existsSync(rootPath)) {
      filePath = rootPath;
    } else {
      return new NextResponse("Not Found", { status: 404 });
    }

    const fileBuffer = await readFile(filePath);
    const ext = subpath.split(".").pop()?.toLowerCase();
    const contentType =
      ext === "png"
        ? "image/png"
        : ext === "jpg" || ext === "jpeg"
        ? "image/jpeg"
        : ext === "webp"
        ? "image/webp"
        : ext === "svg"
        ? "image/svg+xml"
        : ext === "gif"
        ? "image/gif"
        : "application/octet-stream";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    return new NextResponse("File not found", { status: 404 });
  }
}
