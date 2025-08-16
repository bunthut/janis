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
    await joplin.views.panels.addScript(viewHandle, "./views/webview.css");

    const stripHtml = notes
        .map(note => `<span class="timeline-strip-item" data-id="${note.id}">${formatDate(note.created_time)}</span>`) 
        .join("");

    const notesHtml = notes
        .map(note => `<div class="timeline-note" data-id="${note.id}">${encode(note.title)}</div>`)
        .join("");

    const html = `
        <div class="timeline-container">
            <div class="timeline-strip">${stripHtml}</div>
            <div class="timeline-notes">${notesHtml}</div>
        </div>
    `;

    await joplin.views.panels.setHtml(viewHandle, html);
};

