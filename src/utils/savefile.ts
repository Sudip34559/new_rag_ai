import fs from "fs";
import path from "path";

export const saveFile = async (
  file: File,
  destinationFolder: string
): Promise<string> => {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const destDir = path.join(process.cwd(), destinationFolder);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  const extension = file.type.split("/")[1];
  const fileName = `file-${Date.now()}.${extension}`;
  const filePath = path.join(destDir, fileName);
  fs.writeFileSync(filePath, buffer);

  return filePath;
};
