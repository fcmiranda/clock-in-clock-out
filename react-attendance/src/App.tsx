import { useEffect, useState } from 'react';
import { Button, Container, Typography, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Grid } from '@mui/material';
import { PlayArrow, PowerSettingsNew, Lock, LockOpen } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ptBRLocale from 'date-fns/locale/pt-BR';
import './App.css';

interface LogEntry {
  timestamp: string;
  type: string;
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

function App() {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [data, setData] = useState<GroupedEvents | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch events
  const fetchEvents = async (start?: Date | null, end?: Date | null) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (start) params.append('startDate', start.toISOString().split('T')[0]);
      if (end) params.append('endDate', end.toISOString().split('T')[0]);

      const response = await fetch(`http://localhost:3000/events?${params.toString()}`);
      if (!response.ok) {
        throw new Error('No events found for the specified date range.');
      }
      const result: GroupedEvents = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // UseEffect to fetch events on page load
  useEffect(() => {
    fetchEvents();
  }, []);

  // Function to format the timestamp into "01/10/2024 13h 32m"
  const getHourMinutes = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).replace(':', 'h ') + 'm';
  };

  // Function to format total hours to "01 h 32 m"
  const formatTotalHours = (totalHours: string) => {
    const [hours, minutes] = totalHours.split(':');
    return `${hours}h ${minutes}m`;
  };

  // Function to get an icon with appropriate color for the dark theme
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'startup':
        return <PlayArrow sx={{ color: '#76ff03' }} />; // Light Green for startup
      case 'shutdown':
        return <PowerSettingsNew sx={{ color: '#ff1744' }} />; // Bright Red for shutdown
      case 'screenLock':
        return <Lock sx={{ color: '#ff9800' }} />; // Bright Orange for screen lock
      case 'screenUnlock':
        return <LockOpen sx={{ color: '#00e5ff' }} />; // Cyan for screen unlock
      default:
        return null;
    }
  };

  // Create a dark theme
  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
    },
  });

  return (
    <ThemeProvider theme={darkTheme}>
      <LocalizationProvider dateAdapter={AdapterDateFns} locale={ptBRLocale}>
        <div className="root">
          <Container maxWidth="md" className="app-container">
            <Typography variant="h4" component="h1" align="center" gutterBottom>
              System Logs
            </Typography>

            <Grid container spacing={2} sx={{ marginBottom: 2 }}>
              <Grid item xs={12} sm={4}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  renderInput={(params) => <TextField fullWidth {...params} />}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  renderInput={(params) => <TextField fullWidth {...params} />}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={() => fetchEvents(startDate, endDate)}
                  disabled={loading}
                  style={{ marginTop: '1rem' }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Fetch Events'}
                </Button>
              </Grid>
            </Grid>

            {error && <Alert severity="error" style={{ marginTop: '1rem' }}>{error}</Alert>}

            {data && (
              <TableContainer component={Paper} className="table-container">
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Hours</TableCell>
                      <TableCell>Event Type</TableCell>
                      <TableCell>Total Hours</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.keys(data).map((year) =>
                      Object.keys(data[year]).map((month) =>
                        Object.keys(data[year][month]).map((day) => {
                          const dateKey = `${day}/${month}/${year}`;
                          const dayData = data[year][month][day];

                          // Sort events by timestamp in descending order
                          const sortedEvents = [...dayData.events].sort(
                            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                          );

                          return sortedEvents.map((event, index) => (
                            <TableRow key={`${dateKey}-${index}`}>
                              {index === 0 && (
                                <TableCell rowSpan={sortedEvents.length}>
                                  {dateKey}
                                </TableCell>
                              )}
                              <TableCell>{getHourMinutes(event.timestamp)}</TableCell>
                              <TableCell>
                                <IconButton>{getEventIcon(event.type)}</IconButton>
                              </TableCell>
                              {index === 0 && (
                                <TableCell rowSpan={sortedEvents.length} align="center">
                                  {formatTotalHours(dayData.totalHours)}
                                </TableCell>
                              )}
                            </TableRow>
                          ));
                        })
                      )
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Container>
        </div>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
