import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const DEFAULT_DIR = "generated-pdfs";

export function getStorageDir() {
  const configured = process.env.PDF_STORAGE_DIR;
  const dir = configured || path.join(process.cwd(), DEFAULT_DIR);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return dir;
}

export function getFilePath(fileName) {
  return path.join(getStorageDir(), fileName);
}

export function fileExists(filePath) {
  return fs.existsSync(filePath);
}

export async function generatePdf({ fileName, title, content }) {
  const filePath = getFilePath(fileName);

  const doc = new PDFDocument();
  const stream = fs.createWriteStream(filePath);

  doc.pipe(stream);

  doc.fontSize(22).text(title || "Generated PDF", {
    align: "center",
  });

  doc.moveDown();
  doc.fontSize(14).text(content || "No content provided");

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  return {
    fileName,
    filePath,
    generatedAt: new Date().toISOString(),
  };
}