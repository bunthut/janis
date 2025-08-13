import joplin from "api";
import { ImportModule, FileSystemItem, ImportModuleOutputFormat } from "api/types";

const fs = joplin.require("fs-extra");
const path = joplin.require("path");

const NotebinImport: ImportModule = {
    format: "notebin",
    description: "Notebin",
    isNoteArchive: false,
    sources: [FileSystemItem.File, FileSystemItem.Directory],
    fileExtensions: ["notebin"],
    outputFormat: ImportModuleOutputFormat.Markdown,
    async onExec(context) {
        const processFile = async (filePath: string) => {
            const raw = await fs.readFile(filePath, "utf8");
            let title = path.basename(filePath, path.extname(filePath));
            let body = raw;
            try {
                const parsed = JSON.parse(raw);
                if (parsed.title) title = parsed.title;
                if (parsed.content) body = parsed.content;
            } catch (err) {
                const firstLineIndex = raw.indexOf("\n");
                if (firstLineIndex >= 0) {
                    title = raw.slice(0, firstLineIndex).trim();
                    body = raw.slice(firstLineIndex + 1);
                }
            }
            await joplin.data.post(["notes"], null, { title, body });
        };

        const stat = await fs.stat(context.sourcePath);
        if (stat.isDirectory()) {
            const files = await fs.readdir(context.sourcePath);
            for (const file of files) {
                if (file.toLowerCase().endsWith(".notebin")) {
                    await processFile(path.join(context.sourcePath, file));
                }
            }
        } else {
            await processFile(context.sourcePath);
        }
    }
};

export default NotebinImport;

