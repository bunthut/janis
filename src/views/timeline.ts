import joplin from "api";
import { encode } from "html-entities";

export interface TimelineNote {
    id: string;
    title: string;
    created_time: number;
}

const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString();
};

export const setTimelineView = async (viewHandle: string, notes: TimelineNote[]): Promise<void> => {
    await joplin.views.dialogs.addScript(viewHandle, "./views/webview.css");

    const html = `
        <h2> Timeline </h2>
        <ul class="timeline">
            ${notes.map(note => `<li><span class="date">${formatDate(note.created_time)}</span>${encode(note.title)}</li>`).join("")}
        </ul>
    `;

    await joplin.views.dialogs.setHtml(viewHandle, html);
    await joplin.views.dialogs.setButtons(viewHandle, [{ id: "ok" }]);
};

