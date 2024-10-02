// server.ts

import express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import type { Request, Response } from 'express';


interface LogEntry {
    timestamp: string;
    event: 'login' | 'logout';
}

interface DayData {
    events: LogEntry[];
    totalHours: number;
}

interface GroupedEvents {
    [year: string]: {
        [month: string]: {
            [day: string]: DayData;
        };
    };
}

interface RequestParams { }

interface ResponseBody { }

interface RequestBody { }

interface RequestQuery {
    startDate: string;
    endDate: string;
}

const app = express();
const PORT = 3000;

// Helper function to read attendance data
const readAttendanceData = (): GroupedEvents => {
    const logFilePath = path.join(__dirname, 'attendance.json');

    if (!fs.existsSync(logFilePath)) {
        console.error('attendance.json file not found.');
        return {};
    }

    const rawData = fs.readFileSync(logFilePath, 'utf8');
    const groupedEvents: GroupedEvents = JSON.parse(rawData);
    return groupedEvents;
};

// Endpoint to get all events
app.get('/events', (req: Request<RequestParams, ResponseBody, RequestBody, RequestQuery>, res) => {
    const { startDate, endDate } = req.query;

    const groupedEvents = readAttendanceData();

    console.log('req.query', req.query);

    if (startDate || endDate) {
        // Filter events by date range
        const start = startDate ? new Date(startDate) : new Date('1970-01-01');
        const end = endDate ? new Date(endDate) : new Date();

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
        }

        if (start > end) {
            return res.status(400).json({ error: 'startDate must be before or equal to endDate.' });
        }

        console.log('filtrado');

        const filteredEvents: { [date: string]: DayData } = {};

        for (const year in groupedEvents) {
            for (const month in groupedEvents[year]) {
                for (const day in groupedEvents[year][month]) {
                    const currentDateStr = `${year}-${month}-${day}`;
                    const currentDate = new Date(currentDateStr);

                    if (currentDate >= start && currentDate <= end) {
                        const key = currentDateStr;
                        filteredEvents[key] = groupedEvents[year][month][day];
                    }
                }
            }
        }

        if (Object.keys(filteredEvents).length > 0) {
            return res.json(filteredEvents);
        } else {
            return res.status(404).json({ error: 'No events found for the specified date range.' });
        }
    } else {
        // Return all events
        return res.json(groupedEvents);
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
