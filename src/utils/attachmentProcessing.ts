import joplin from "api";
import * as fs from "fs";

export async function processAttachment(resourceId: string, noteId: string): Promise<void> {
    try {
        const resource: any = await joplin.data.get(["resources", resourceId], { fields: ["id", "mime"] });
        if (!resource || !resource.mime) return;

        if (resource.mime.startsWith("image/")) {
            let sharp: any;
            try {
                sharp = require("sharp");
            } catch (error) {
                console.warn("sharp module not available. Skipping thumbnail generation.");
                return;
            }

            const resourcePath: string = await joplin.data.resourcePath(resourceId);
            const thumbnailBuffer: Buffer = await sharp(resourcePath).resize(256, 256, { fit: "inside" }).toBuffer();
            const thumbnail = await joplin.data.post(["resources"], null, {
                data: thumbnailBuffer,
                filename: `thumb_${resourceId}.png`,
                mime: resource.mime,
            });
            await joplin.data.post(["notes", noteId, "resources"], null, { id: thumbnail.id });
        } else if (resource.mime === "application/pdf") {
            let pdfParse: any;
            try {
                pdfParse = require("pdf-parse");
            } catch (error) {
                console.warn("pdf-parse module not available. Skipping PDF text extraction.");
                return;
            }

            const resourcePath: string = await joplin.data.resourcePath(resourceId);
            const dataBuffer = await fs.promises.readFile(resourcePath);
            const pdfData = await pdfParse(dataBuffer);
            const sentences = pdfData.text.replace(/\s+/g, " ").split(/(?<=[.!?])\s+/).slice(0, 2).join(" ");
            const note: any = await joplin.data.get(["notes", noteId], { fields: ["id", "body"] });
            const newBody = `${sentences}\n\n${note.body}`;
            await joplin.data.put(["notes", noteId], null, { body: newBody });
        }
    } catch (error) {
        console.error("Attachment processing failed", error);
    }
}

export default processAttachment;
