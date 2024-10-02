// logger.ts

import * as fs from 'fs';
import * as path from 'path';
import { format, toZonedTime } from 'date-fns-tz';

interface LogEntry {
    timestamp: string;
    event: 'login' | 'logout';
}

interface DayData {
    events: LogEntry[];
    totalHours: string; // Changed from number to string
}

interface GroupedEvents {
    [year: string]: {
        [month: string]: {
            [day: string]: DayData;
        };
    };
}

const logEvent = (event: 'login' | 'logout') => {
    const logFilePath = path.join(__dirname, 'attendance.json');

    let groupedEvents: GroupedEvents = {};

    // Read existing data if the file exists
    if (fs.existsSync(logFilePath)) {
        const rawData = fs.readFileSync(logFilePath, 'utf8');
        if (rawData) {
            groupedEvents = JSON.parse(rawData);
        }
    }

    // Get current date and time adjusted to UTC-3
    const timeZone = 'Etc/GMT+3'; // UTC-3 time zone
    const now = new Date();
    const zonedDate = toZonedTime(now, timeZone);

    // Format the timestamp in ISO 8601 format with the correct time zone offset
    const timestamp = format(zonedDate, "yyyy-MM-dd'T'HH:mm:ssXXX", { timeZone });

    // Extract date components from the zoned date
    const year = zonedDate.getFullYear().toString();
    const month = (zonedDate.getMonth() + 1).toString().padStart(2, '0');
    const day = zonedDate.getDate().toString().padStart(2, '0');

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

    const dayData = groupedEvents[year][month][day];

    // Append the new log entry
    const logEntry: LogEntry = {
        timestamp: timestamp,
        event: event,
    };
    dayData.events.push(logEntry);

    // Recalculate total hours for the day
    dayData.totalHours = calculateDailyWorkHours(dayData.events);

    // Write the updated data back to the file
    fs.writeFileSync(logFilePath, JSON.stringify(groupedEvents, null, 2));
};

// Function to calculate total hours worked in a day and format as 'HH:mm'
const calculateDailyWorkHours = (events: LogEntry[]): string => {
    let totalMilliseconds = 0;
    let loginTime: Date | null = null;

    // Sort events by timestamp
    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    events.forEach((entry) => {
        if (entry.event === 'login') {
            loginTime = new Date(entry.timestamp);
        } else if (entry.event === 'logout' && loginTime) {
            const logoutTime = new Date(entry.timestamp);
            totalMilliseconds += logoutTime.getTime() - loginTime.getTime();
            loginTime = null;
        }
    });

    // If the day ends with a login without a logout, consider current time as logout
    if (loginTime) {
        const now = new Date();
        const timeZone = 'Etc/GMT+3';
        const logoutTime = toZonedTime(now, timeZone);
        totalMilliseconds += logoutTime.getTime() - loginTime.getTime();
    }

    // Convert total milliseconds to hours and minutes
    const totalMinutes = Math.floor(totalMilliseconds / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
    const minutes = (totalMinutes % 60).toString().padStart(2, '0');

    // Return the total hours in 'HH:mm' format
    return `${hours}:${minutes}`;
};

// Get the event type from command-line arguments
const eventType = process.argv[2] as 'login' | 'logout';

if (eventType === 'login' || eventType === 'logout') {
    logEvent(eventType);
} else {
    console.error('Invalid event type. Use "login" or "logout".');
}
