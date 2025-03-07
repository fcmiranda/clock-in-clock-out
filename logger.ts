import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process'; // Import exec to run shell commands
import { formatInTimeZone } from 'date-fns-tz';

// Existing interfaces
interface LogEntry {
    timestamp: string;
    type: 'startup' | 'shutdown' | 'screenLock' | 'screenUnlock';
}

interface DayData {
    events: LogEntry[];
    totalHours: string;
}

interface GroupedEvents {
    [year: string]: {
        [month: string]: {
            [day: string]: DayData;
        };
    };
}

// Modify logEvent function to include notification
const logEvent = (type: 'startup' | 'shutdown' | 'screenLock' | 'screenUnlock') => {
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
    const timestamp = formatInTimeZone(now, timeZone, "yyyy-MM-dd'T'HH:mm:ssXXX");

    // Extract date components from the now date
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');

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
        type: type,
    };
    dayData.events.push(logEntry);

    // Recalculate total hours for the day
    dayData.totalHours = calculateDailyWorkHours(dayData.events);

    // Write the updated data back to the file
    fs.writeFileSync(logFilePath, JSON.stringify(groupedEvents, null, 2));

    // Send a notification to the user
    sendNotification(type);
};

// Function to calculate total hours worked in a day and format as 'HH:mm'
const calculateDailyWorkHours = (events: LogEntry[]): string => {
    let totalMilliseconds = 0;
    let currentState: 'active' | 'inactive' = 'inactive';
    let lastEventTime: Date | null = null;

    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    for (let i = 0; i < events.length; i++) {
        const entry = events[i];
        const eventTime = new Date(entry.timestamp);

        if (entry.type === 'startup' || entry.type === 'screenUnlock') {
            if (currentState === 'inactive') {
                currentState = 'active';
                lastEventTime = eventTime;
            }
        } else if (entry.type === 'shutdown' || entry.type === 'screenLock') {
            if (currentState === 'active' && lastEventTime) {
                totalMilliseconds += eventTime.getTime() - lastEventTime.getTime();
                currentState = 'inactive';
                lastEventTime = null;
            }
        }
    }

    if (currentState === 'active' && lastEventTime) {
        const now = new Date();
        totalMilliseconds += now.getTime() - lastEventTime.getTime();
    }

    const totalMinutes = Math.floor(totalMilliseconds / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
    const minutes = (totalMinutes % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};

// Function to send desktop notifications using notify-send
const sendNotification = (eventType: 'startup' | 'shutdown' | 'screenLock' | 'screenUnlock') => {
    let message: string;
    switch (eventType) {
        case 'startup':
            message = 'System has started up.';
            break;
        case 'shutdown':
            message = 'System is shutting down.';
            break;
        case 'screenLock':
            message = 'Screen has been locked.';
            break;
        case 'screenUnlock':
            message = 'Screen has been unlocked.';
            break;
        default:
            message = 'Unknown event occurred.';
            break;
    }

    // Use exec to run the notify-send command
    exec(`notify-send  -t 5000 "Event Logged" "${message}"`, (error) => {
        if (error) {
            console.error('Error sending notification:', error);
        }
    });
};

// Get the event type from command-line arguments
const eventType = process.argv[2] as 'startup' | 'shutdown' | 'screenLock' | 'screenUnlock';

if (eventType === 'startup' || eventType === 'shutdown' || eventType === 'screenLock' || eventType === 'screenUnlock') {
    logEvent(eventType);
} else {
    console.error('Invalid event type. Use "startup", "shutdown", "screenLock", or "screenUnlock".');
}
