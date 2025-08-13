import joplin from "api";
import { onFileDrop } from "../src/index";

describe("onFileDrop", () => {
    test("creates a resource and note for dropped files", async () => {
        const file = { name: "test.txt" } as any;
        const selectedFolderMock = jest.fn().mockResolvedValue({ id: "folder1" });
        (joplin as any).workspace = { selectedFolder: selectedFolderMock } as any;
        const postMock = jest.spyOn(joplin.data, "post").mockImplementation(async (path: string[], data: any) => {
            if (path[0] === "resources") {
                return { id: "res1" };
            }
            if (path[0] === "notes") {
                return { id: "note1" };
            }
            return {};
        });

        await onFileDrop({ files: [file] });

        expect(selectedFolderMock).toHaveBeenCalledTimes(1);
        expect(postMock).toHaveBeenCalledTimes(2);
        expect(postMock).toHaveBeenCalledWith(["resources"], file);
        expect(postMock).toHaveBeenCalledWith(["notes"], {
            title: "test.txt",
            body: "[](:/res1)",
            parent_id: "folder1",
        });
    });
});
