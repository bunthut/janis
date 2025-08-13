import joplin from "api";
import { ImportModule, FileSystemItem, ImportContext } from "api/types";

const templatesImportModule: ImportModule = {
    format: "templates",
    description: "Templates",
    isNoteArchive: false,
    sources: [FileSystemItem.File, FileSystemItem.Directory],
    async onExec(context: ImportContext): Promise<void> {
        const fs = joplin.require("fs-extra");
        const path = joplin.require("path");

        const createNote = async (filePath: string) => {
            const raw = await fs.readFile(filePath, "utf8");
            const firstLineIndex = raw.indexOf("\n");
            const title = firstLineIndex >= 0
                ? raw.slice(0, firstLineIndex).trim() || path.basename(filePath, path.extname(filePath))
                : path.basename(filePath, path.extname(filePath));
            const body = firstLineIndex >= 0 ? raw.slice(firstLineIndex + 1) : raw;

            await joplin.data.post(["notes"], null, { title, body });
        };

        try {
            const stat = await fs.stat(context.sourcePath);
            if (stat.isDirectory()) {
                const files = (await fs.readdir(context.sourcePath)).sort();
                for (const file of files) {
                    const filePath = path.join(context.sourcePath, file);
                    if ((await fs.stat(filePath)).isFile()) {
                        await createNote(filePath);
                    }
                }
            } else {
                await createNote(context.sourcePath);
            }
        } catch (error) {
            await joplin.views.dialogs.showMessageBox(`Failed to import templates: ${error}`);
        }
    },
};

export default templatesImportModule;
