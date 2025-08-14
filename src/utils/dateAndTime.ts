import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import advancedFormat from "dayjs/plugin/advancedFormat";

dayjs.extend(customParseFormat);
dayjs.extend(advancedFormat);

// These are meant to parse the date and time formats
// supported by Joplin. It doesn't support seconds or
// milliseconds.
interface ParsedDate {
    date: number;
    month: number;
    year: number;
}

interface ParsedTime {
    hours: number;
    minutes: number;
    seconds: number;
}

export class DateAndTimeUtils {
    private locale: string;
    private dateFormat: string;
    private timeFormat: string;

    constructor(locale: string, dateFormat: string, timeFormat: string) {
        this.locale = locale;
        this.dateFormat = dateFormat;
        this.timeFormat = timeFormat;

        dayjs.locale(this.locale);
    }

    public getDateFormat(): string {
        return this.dateFormat;
    }

    public getTimeFormat(): string {
        return this.timeFormat;
    }

    public getDateTimeFormat(): string {
        return `${this.dateFormat} ${this.timeFormat}`;
    }

    public formatMsToLocal(ms: number, format: string | null = null): string {
        if (!format) {
            format = this.getDateTimeFormat();
        }
        return dayjs(ms).format(format.replace(/\[\]/g, ""));
    }

    public formatLocalToJoplinCompatibleUnixTime(input: string, format: string | null = null): number {
        if (!format) {
            format = this.getDateTimeFormat();
        }

        let date = dayjs(input, format, true);
        if (!date.isValid() && format.includes("HH") && /a/i.test(format)) {
            const altFormat = format.replace("HH", "hh");
            date = dayjs(input, altFormat, true);
        }
        if (!date.isValid()) {
            throw new Error(`Was not able to parse ${input} according to format ${format}`);
        }

        return date.unix() * 1000;
    }

    public getCurrentTime(format: string | null = null): string {
        return this.formatMsToLocal(new Date().getTime(), format);
    }

    public getBeginningOfWeek(startIndex: number): number {
        // startIndex: 0 for Sunday, 1 for Monday
        const currentDate = new Date();
        const day = currentDate.getDay();
        const diff = day >= startIndex ? day - startIndex : 6 - day;
        return new Date().setDate(currentDate.getDate() - diff);
    }

    public parseDate(input: string, format: string): ParsedDate {
        let date = dayjs(input, format, true);
        if (!date.isValid() && format.includes("HH") && /a/i.test(format)) {
            const altFormat = format.replace("HH", "hh");
            date = dayjs(input, altFormat, true);
        }

        if (!date.isValid()) {
            throw new Error(`Was not able to parse ${input} according to format ${format}`);
        }

        return {
            date: date.date(),
            month: date.month(),
            year: date.year(),
        };
    }

    public parseTime(input: string, format: string): ParsedTime {
        let time = dayjs(input, format, true);
        if (!time.isValid() && format.includes("HH") && /a/i.test(format)) {
            const altFormat = format.replace("HH", "hh");
            time = dayjs(input, altFormat, true);
        }

        if (!time.isValid()) {
            throw new Error(`Was not able to parse ${input} according to format ${format}`);
        }

        return {
            hours: time.hour(),
            minutes: time.minute(),
            seconds: time.second(),
        };
    }
}
