import { NextRequest, NextResponse } from "next/server";
import { QdrantClient } from "@qdrant/js-client-rest";
import { deletePdfByUrl } from "@/utils/cloudinary";

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");
    const publicId = searchParams.get("publicId");

    const client = new QdrantClient({
      url: process.env.QDRANT_HOST,
      apiKey: process.env.QDRANT_API_KEY,
    });

    if (name) {
      await client.deleteCollection(name);
    }

    if (publicId) {
      await deletePdfByUrl(publicId);
    }

    console.log("✅ Collection deleted");
    return NextResponse.json({
      message: "Collection deleted successfully",
    });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
