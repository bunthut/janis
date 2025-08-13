import { NewNote } from "@templates/parser";

export interface NotebinNote {
    title: string;
    content: string;
    tags?: string[];
}

/**
 * Convert Notebin JSON data to the internal NewNote structure used by the plugin.
 * The Notebin format is expected to be an array of notes in the form:
 * [{ title: string, content: string, tags?: string[] }]
 */
export async function importFromNotebin(data: string | NotebinNote[]): Promise<NewNote[]> {
    const entries: NotebinNote[] = typeof data === "string" ? JSON.parse(data) : data;

    return entries.map(entry => ({
        title: entry.title,
        body: entry.content,
        tags: entry.tags ?? [],
        folder: null,
        todo_due: null,
    }));
}
