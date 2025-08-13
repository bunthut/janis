import { HandlebarsHelper, HelperConstructorBlock } from "./helper";
import { AttributeValueType, AttributeDefinition, AttributeParser } from "./utils/attributes";
import * as moment from "moment";

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

        const now = moment(new Date().getTime());

        if (attrs[setDate]) {
            const parsedDate = ctx.dateAndTimeUtils.parseDate(attrs[setDate] as string, ctx.dateAndTimeUtils.getDateFormat());
            now.set("date", parsedDate.date);
            now.set("month", parsedDate.month);
            now.set("year", parsedDate.year);
        }

        if (attrs[setTime]) {
            const parsedTime = ctx.dateAndTimeUtils.parseTime(attrs[setTime] as string, ctx.dateAndTimeUtils.getTimeFormat());
            now.set("hours", parsedTime.hours);
            now.set("minutes", parsedTime.minutes);
            now.set("seconds", parsedTime.seconds);
            now.set("milliseconds", 0);
        }

        now.add(attrs[deltaYears] as number, "years");
        now.add(attrs[deltaMonths] as number, "months");
        now.add(attrs[deltaDays] as number, "days");
        now.add(attrs[deltaHours] as number, "hours");
        now.add(attrs[deltaMinutes] as number, "minutes");
        now.add(attrs[deltaSeconds] as number, "seconds");

        return ctx.dateAndTimeUtils.formatMsToLocal(now.toDate().getTime(), attrs[format] as string);
    });
};
