import { uploadToCloudinary } from "@/utils/cloudinary";
import { saveFile } from "@/utils/savefile";
import { queue1 } from "@/workers/queue";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("pdf") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const filePath = await saveFile(file, "public/temp");

    const res = await queue1.add(
      "process-pdf",
      JSON.stringify({
        path: filePath,
      })
    );

    // Save file temporarily or process directly
    // For this example, assuming uploadPdfOnCloudinary can handle buffer
    const pdfUrl = await uploadToCloudinary(filePath, "pdfs", file.type);
    // console.log(pdfUrl);

    if (!pdfUrl) {
      return NextResponse.json(
        { error: "Failed to upload PDF" },
        { status: 500 }
      );
    }

    // Add job to queue AFTER upload

    console.log(res.progress);

    return NextResponse.json({
      message: "File uploaded successfully",
      fileUrl: pdfUrl?.secure_url,
      publicId: pdfUrl?.public_id,
    });
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
