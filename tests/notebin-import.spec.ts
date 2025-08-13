import { importFromNotebin, NotebinNote } from "@templates/importers/notebin";

describe("Notebin importer", () => {
    test("should convert Notebin JSON to NewNote structure", async () => {
        const sample: NotebinNote[] = [
            {
                title: "Sample",
                content: "Body text",
                tags: ["a", "b"],
            },
        ];

        const imported = await importFromNotebin(sample);

        expect(imported).toEqual([
            {
                title: "Sample",
                body: "Body text",
                tags: ["a", "b"],
                folder: null,
                todo_due: null,
            },
        ]);
    });
});
