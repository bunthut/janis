import { HandlebarsHelper, HelperConstructorBlock } from "./helper";
import { AttributeValueType, AttributeDefinition, AttributeParser } from "./utils/attributes";
import dayjs from "dayjs";

const format = "format";
const setDate = "set_date";
const setTime = "set_time";
const deltaYears = "delta_years";
const deltaMonths = "delta_months";
const deltaDays = "delta_days";
const deltaHours = "delta_hours";
const deltaMinutes = "delta_minutes";
const deltaSeconds = "delta_seconds";

export const datetimeHelper: HelperConstructorBlock = (ctx) => {
    const schema: AttributeDefinition[] = [
        {
            name: format,
            valueType: AttributeValueType.String,
            defaultValue: ctx.dateAndTimeUtils.getDateTimeFormat()
        },
        {
            name: setDate,
            valueType: AttributeValueType.String,
            defaultValue: ""
        },
        {
            name: setTime,
            valueType: AttributeValueType.String,
            defaultValue: ""
        },
        {
            name: deltaYears,
            valueType: AttributeValueType.Number,
            defaultValue: 0
        },
        {
            name: deltaMonths,
            valueType: AttributeValueType.Number,
            defaultValue: 0
        },
        {
            name: deltaDays,
            valueType: AttributeValueType.Number,
            defaultValue: 0
        },
        {
            name: deltaHours,
            valueType: AttributeValueType.Number,
            defaultValue: 0
        },
        {
            name: deltaMinutes,
            valueType: AttributeValueType.Number,
            defaultValue: 0
        },
        {
            name: deltaSeconds,
            valueType: AttributeValueType.Number,
            defaultValue: 0
        }
    ];

    return new HandlebarsHelper("datetime", function (options) {
        const parser = new AttributeParser(schema);
        const attrs = parser.parse(options.hash);

        let now = dayjs(new Date().getTime());

        if (attrs[setDate]) {
            const parsedDate = ctx.dateAndTimeUtils.parseDate(attrs[setDate] as string, ctx.dateAndTimeUtils.getDateFormat());
            now = now.set("date", parsedDate.date);
            now = now.set("month", parsedDate.month);
            now = now.set("year", parsedDate.year);
        }

        if (attrs[setTime]) {
            const parsedTime = ctx.dateAndTimeUtils.parseTime(attrs[setTime] as string, ctx.dateAndTimeUtils.getTimeFormat());
            now = now.set("hour", parsedTime.hours);
            now = now.set("minute", parsedTime.minutes);
            now = now.set("second", parsedTime.seconds);
            now = now.set("millisecond", 0);
        }

        now = now.add(attrs[deltaYears] as number, "year");
        now = now.add(attrs[deltaMonths] as number, "month");
        now = now.add(attrs[deltaDays] as number, "day");
        now = now.add(attrs[deltaHours] as number, "hour");
        now = now.add(attrs[deltaMinutes] as number, "minute");
        now = now.add(attrs[deltaSeconds] as number, "second");

        return ctx.dateAndTimeUtils.formatMsToLocal(now.toDate().getTime(), attrs[format] as string);
    });
};
