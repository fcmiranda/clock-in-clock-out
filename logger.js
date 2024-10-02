"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var date_fns_tz_1 = require("date-fns-tz");
var logEvent = function (type) {
    var logFilePath = path.join(__dirname, 'attendance.json');
    var groupedEvents = {};
    // Read existing data if the file exists
    if (fs.existsSync(logFilePath)) {
        var rawData = fs.readFileSync(logFilePath, 'utf8');
        if (rawData) {
            groupedEvents = JSON.parse(rawData);
        }
    }
    // Get current date and time adjusted to UTC-3
    var timeZone = 'Etc/GMT+3'; // UTC-3 time zone
    var now = new Date();
    // Format the timestamp in ISO 8601 format with the correct time zone offset using formatInTimeZone
    var timestamp = (0, date_fns_tz_1.formatInTimeZone)(now, timeZone, "yyyy-MM-dd'T'HH:mm:ssXXX");
    // Extract date components from the now date
    var year = now.getFullYear().toString();
    var month = (now.getMonth() + 1).toString().padStart(2, '0');
    var day = now.getDate().toString().padStart(2, '0');
    if (!groupedEvents[year]) {
        groupedEvents[year] = {};
    }
    if (!groupedEvents[year][month]) {
        groupedEvents[year][month] = {};
    }
    if (!groupedEvents[year][month][day]) {
        groupedEvents[year][month][day] = {
            events: [],
            totalHours: '00:00',
        };
    }
    var dayData = groupedEvents[year][month][day];
    // Append the new log entry
    var logEntry = {
        timestamp: timestamp,
        type: type,
    };
    dayData.events.push(logEntry);
    // Recalculate total hours for the day
    dayData.totalHours = calculateDailyWorkHours(dayData.events);
    // Write the updated data back to the file
    fs.writeFileSync(logFilePath, JSON.stringify(groupedEvents, null, 2));
};
// Function to calculate total hours worked in a day and format as 'HH:mm'
var calculateDailyWorkHours = function (events) {
    var totalMilliseconds = 0;
    // Explicitly define currentState type
    var currentState = 'inactive';
    var lastEventTime = null;
    // Sort events by timestamp
    events.sort(function (a, b) { return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(); });
    for (var i = 0; i < events.length; i++) {
        var entry = events[i];
        var eventTime = new Date(entry.timestamp);
        if (entry.type === 'startup' || entry.type === 'screenUnlock') {
            if (currentState === 'inactive') {
                currentState = 'active';
                lastEventTime = eventTime;
            }
        }
        else if (entry.type === 'shutdown' || entry.type === 'screenLock') {
            if (currentState === 'active' && lastEventTime) {
                totalMilliseconds += eventTime.getTime() - lastEventTime.getTime();
                currentState = 'inactive';
                lastEventTime = null;
            }
        }
    }
    // If still active after all events, consider current time as shutdown time
    if (currentState === 'active' && lastEventTime) {
        var now = new Date();
        totalMilliseconds += now.getTime() - lastEventTime.getTime();
    }
    // Convert total milliseconds to hours and minutes
    var totalMinutes = Math.floor(totalMilliseconds / (1000 * 60));
    var hours = Math.floor(totalMinutes / 60)
        .toString()
        .padStart(2, '0');
    var minutes = (totalMinutes % 60).toString().padStart(2, '0');
    // Return the total hours in 'HH:mm' format
    return "".concat(hours, ":").concat(minutes);
};
// Get the event type from command-line arguments
var eventType = process.argv[2];
if (eventType === 'startup' ||
    eventType === 'shutdown' ||
    eventType === 'screenLock' ||
    eventType === 'screenUnlock') {
    logEvent(eventType);
}
else {
    console.error('Invalid event type. Use "startup", "shutdown", "screenLock", or "screenUnlock".');
}
