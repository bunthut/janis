import joplin from "api";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
export const fetchAllItems = async (path: string[], query: any): Promise<any[]> => {
    let pageNum = 1;
    let response: any;
    const items: any[] = [];

    do {
        response = await joplin.data.get(path, { ...query, page: pageNum });
        items.push(...response.items);
        pageNum++;
    } while (response.has_more);

    return items;
}
