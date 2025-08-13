import joplin from "api";
import { getSelectedFolder } from "../../src/utils/folders";

describe("getSelectedFolder", () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    test("returns folder id when a folder is selected", async () => {
        const selectedFolderMock = jest.fn().mockResolvedValue({ id: "folder1" });
        (joplin as unknown as { workspace: { selectedFolder: jest.Mock } }).workspace = { selectedFolder: selectedFolderMock };

        const result = await getSelectedFolder();

        expect(selectedFolderMock).toHaveBeenCalled();
        expect(result).toBe("folder1");
    });

    test("returns null when no folder is selected", async () => {
        const selectedFolderMock = jest.fn().mockResolvedValue(null);
        (joplin as unknown as { workspace: { selectedFolder: jest.Mock } }).workspace = { selectedFolder: selectedFolderMock };

        const result = await getSelectedFolder();

        expect(selectedFolderMock).toHaveBeenCalled();
        expect(result).toBeNull();
    });
});
