import { v2 as cloudinary, UploadApiOptions } from "cloudinary";
import "dotenv/config";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_CLOUD_KEY,
  api_secret: process.env.CLOUDINARY_CLOUD_SECRET,
});

interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  resource_type: string;
  format: string;
  bytes: number;
}
const uploadToCloudinary = async (
  filePath: string,
  type: string,
  folder?: string
): Promise<CloudinaryUploadResult | null> => {
  try {
    // Determine resource type based on file type
    const resourceType = getResourceType(type);
    console.log(resourceType);

    const uploadOptions: UploadApiOptions = {
      resource_type: resourceType,
      folder: folder || "default_folder",
    };
    const result = await cloudinary.uploader.upload(filePath, uploadOptions);
    // Clean up temporary file
    fs.unlinkSync(filePath);

    return {
      secure_url: result.secure_url,
      public_id: result.public_id,
      resource_type: result.resource_type,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error) {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    console.error("Upload error:", error);
    return null;
  }
};

// Helper function to determine resource type
function getResourceType(mimeType: string): "image" | "video" | "raw" | "auto" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "application/pdf") return "raw";
  return "auto"; // Cloudinary will auto-detect
}

const deletePdfByUrl = async (publicId: string) => {
  //   const publicId = extractRawPublicId(url);

  return cloudinary.uploader.destroy(publicId, {
    resource_type: "raw",
  });
};

export { uploadToCloudinary, deletePdfByUrl };
