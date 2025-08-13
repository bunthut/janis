import { ImportModule, FileSystemItem, ImportContext } from "api/types";

const templatesImportModule: ImportModule = {
    format: "templates",
    description: "Templates",
    isNoteArchive: false,
    sources: [FileSystemItem.File, FileSystemItem.Directory],
    async onExec(_context: ImportContext): Promise<void> {
        // TODO: implement template import logic
    },
};

export default templatesImportModule;
