import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Find token
    const downloadToken = await prisma.downloadToken.findUnique({
      where: { token },
      include: {
        order: {
          select: {
            id: true,
            status: true,
            userId: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            digitalFileKey: true,
            digitalFileProvider: true,
            isActive: true,
          },
        },
      },
    });

    if (!downloadToken) {
      return new NextResponse("Download link not found or invalid.", { status: 404 });
    }

    // Verify token is active
    if (!downloadToken.isActive) {
      return new NextResponse("This download link has been deactivated.", { status: 403 });
    }

    // Verify order is approved
    if (downloadToken.order.status !== "PAYMENT_APPROVED" && downloadToken.order.status !== "DELIVERED") {
      return new NextResponse("Payment has not been approved for this order.", { status: 403 });
    }

    // Verify product exists
    if (!downloadToken.product.digitalFileKey) {
      return new NextResponse("Digital file not yet available. Please contact support.", { status: 404 });
    }

    // Update download count + last used
    await prisma.downloadToken.update({
      where: { token },
      data: {
        downloadCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });

    // Serve file from local storage
    const provider = downloadToken.product.digitalFileProvider || "local";

    if (provider === "local") {
      const safeKey = path.basename(downloadToken.product.digitalFileKey);
      const filePath = path.join(process.cwd(), "uploads", "products", safeKey);

      try {
        const fileBuffer = await readFile(filePath);
        const ext = safeKey.split(".").pop()?.toLowerCase() || "bin";

        // Determine content type
        const contentTypeMap: Record<string, string> = {
          pdf: "application/pdf",
          zip: "application/zip",
          rar: "application/x-rar-compressed",
          "7z": "application/x-7z-compressed",
          docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          sldasm: "application/octet-stream",
          sldprt: "application/octet-stream",
          wbpj: "application/octet-stream",
        };

        const contentType = contentTypeMap[ext] || "application/octet-stream";
        const filename = `${downloadToken.product.name.replace(/[^a-z0-9]/gi, "_")}.${ext}`;

        return new NextResponse(fileBuffer, {
          headers: {
            "Content-Type": contentType,
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Cache-Control": "no-store, no-cache",
            "X-Content-Type-Options": "nosniff",
          },
        });
      } catch {
        return new NextResponse("File not found on server. Please contact support.", {
          status: 404,
        });
      }
    }

    // Future: add S3, Cloudinary signed URL redirect here
    return new NextResponse("Storage provider not supported.", { status: 500 });
  } catch (error) {
    console.error("GET /download/[token] error:", error);
    return new NextResponse("Download failed. Please try again.", { status: 500 });
  }
}
