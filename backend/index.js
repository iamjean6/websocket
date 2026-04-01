import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();


const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));

app.get('/health', (req, res) => {
    res.json({ status: 'ok', activeConnections: io.engine.clientsCount });
});

const server = createServer(app);

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"]
    }
});

const MAX_USERS = 10;
const POLLING_INTERVAL_MS = 10 * 60 * 1000;

let serverFlightCache = null;

let currentIntervalMs = POLLING_INTERVAL_MS;
let pollingTimerId = null;

function startPolling(ms) {
    if (pollingTimerId) clearInterval(pollingTimerId);
    currentIntervalMs = ms;
    pollingTimerId = setInterval(fetchLatestFlights, currentIntervalMs);
    console.log(`[Interval Sync] Polling speed dynamically updated to ${ms / 1000}s`);
}

async function fetchLatestFlights() {
    console.log(`[${new Date().toLocaleTimeString()}] Fetching latest flights...`);
    
    try {
        const apiKey = process.env.AVIATIONSTACK_API_KEY;
        const API_URL = `https://api.aviationstack.com/v1/flights?access_key=${apiKey}&limit=100&offset=0`;
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`API returned status: ${response.status}`);
        }
        
        const data = await response.json();
        serverFlightCache = data;
        broadcastToClients();
    } catch (error) {
        console.error("Error fetching flight data:", error);
    }
}

function processFlightData(data) {
    if (!data || !Array.isArray(data)) return null;

    const stats = {
        totalFlights: data.length,
        activeFlights: 0,
        scheduledFlights: 0,
        delayedFlights: 0,
        totalCodeshares: 0,
        missingData: {
            gates: 0,
            terminals: 0,
            aircraft: 0
        }
    };

    const aggregations = data.reduce((acc, flight) => {
        const airlineName = flight.airline?.name || "Unknown";
        if (!acc.airlines[airlineName]) {
            acc.airlines[airlineName] = { 
                name: airlineName, 
                total_flights: 0, 
                onTime: 0, 
                delayedCount: 0, 
                totalDelayMinutes: 0,
                codeshares: 0
            };
        }
        acc.airlines[airlineName].total_flights += 1;

        const depDelay = flight.departure?.delay || 0;
        const arrDelay = flight.arrival?.delay || 0;
        const isDelayed = depDelay > 0 || arrDelay > 0;
        
        if (isDelayed) {
            acc.airlines[airlineName].delayedCount += 1;
            acc.airlines[airlineName].totalDelayMinutes += depDelay + arrDelay;
            stats.delayedFlights += 1;
        } else {
            acc.airlines[airlineName].onTime += 1;
        }

        if (flight.departure?.iata && flight.arrival?.iata) {
            const routeKey = `${flight.departure.iata} → ${flight.arrival.iata}`;
            if (!acc.routes[routeKey]) {
                acc.routes[routeKey] = { route: routeKey, count: 0 };
            }
            acc.routes[routeKey].count += 1;
        }

        if (flight.flight?.codeshared !== null && flight.flight?.codeshared !== undefined) {
            stats.totalCodeshares += 1;
            acc.airlines[airlineName].codeshares += 1;
        }

        const status = flight.flight_status || "Unknown";
        if (!acc.statuses[status]) {
            acc.statuses[status] = { status: status, value: 0 };
        }
        acc.statuses[status].value += 1;
        if (status === 'active') stats.activeFlights += 1;
        if (status === 'scheduled') stats.scheduledFlights += 1;

        const depAirport = flight.departure?.airport || "Unknown Dep";
        if (!acc.depAirports[depAirport]) acc.depAirports[depAirport] = { airport: depAirport, departures: 0 };
        acc.depAirports[depAirport].departures += 1;

        const arrAirport = flight.arrival?.airport || "Unknown Arr";
        if (!acc.arrAirports[arrAirport]) acc.arrAirports[arrAirport] = { airport: arrAirport, arrivals: 0 };
        acc.arrAirports[arrAirport].arrivals += 1;

        if (flight.departure?.scheduled) {
            const dateObj = new Date(flight.departure.scheduled);
            const hourUTC = dateObj.getUTCHours();
            const hourString = hourUTC.toString().padStart(2, '0') + ":00";
            
            if (!acc.timeline[hourString]) {
                acc.timeline[hourString] = { time: hourString, flights: 0 };
            }
            acc.timeline[hourString].flights += 1;

            let bucket = "Night";
            if (hourUTC >= 5 && hourUTC < 12) bucket = "Morning";
            else if (hourUTC >= 12 && hourUTC < 17) bucket = "Afternoon";
            else if (hourUTC >= 17 && hourUTC < 22) bucket = "Evening";

            if (!acc.timeBuckets[bucket]) acc.timeBuckets[bucket] = { bucket, count: 0 };
            acc.timeBuckets[bucket].count += 1;
        }

        if (flight.departure?.scheduled && flight.arrival?.scheduled) {
            const durationMs = new Date(flight.arrival.scheduled) - new Date(flight.departure.scheduled);
            const durationMins = durationMs / (1000 * 60);
            
            if (durationMins > 0) {
                let durBucket = "Unknown";
                if (durationMins < 180) durBucket = "Short Haul";
                else if (durationMins <= 360) durBucket = "Medium Haul";
                else durBucket = "Long Haul";

                if (!acc.durations[durBucket]) acc.durations[durBucket] = { duration: durBucket, count: 0 };
                acc.durations[durBucket].count += 1;
            }
        }

        if (!flight.departure?.gate && !flight.arrival?.gate) stats.missingData.gates += 1;
        if (!flight.departure?.terminal && !flight.arrival?.terminal) stats.missingData.terminals += 1;
        if (!flight.aircraft || !flight.aircraft.icao24) stats.missingData.aircraft += 1;

        if (flight.aircraft && flight.aircraft.icao24) {
            const icao = flight.aircraft.icao24;
            if (!acc.aircraft[icao]) acc.aircraft[icao] = { icao24: icao, flights: 0 };
            acc.aircraft[icao].flights += 1;
        }

        return acc;
    }, {
        airlines: {},
        statuses: {},
        depAirports: {},
        arrAirports: {},
        timeline: {},
        timeBuckets: {},
        routes: {},
        durations: {},
        aircraft: {}
    });

    const processedAirlines = Object.values(aggregations.airlines).map(airline => {
        airline.avgDelay = airline.delayedCount > 0 
            ? Math.round(airline.totalDelayMinutes / airline.delayedCount) 
            : 0;
        return airline;
    });

    const combinedAirports = {};
    for (const [key, val] of Object.entries(aggregations.depAirports)) {
        combinedAirports[key] = { airport: key, departures: val.departures, arrivals: 0 };
    }
    for (const [key, val] of Object.entries(aggregations.arrAirports)) {
        if (!combinedAirports[key]) combinedAirports[key] = { airport: key, departures: 0, arrivals: 0 };
        combinedAirports[key].arrivals = val.arrivals;
    }
    const combinedAirportChart = Object.values(combinedAirports)
        .sort((a,b) => (b.departures + b.arrivals) - (a.departures + a.arrivals))
        .slice(0, 15);

    const result = {
        summary: stats,
        airlineChart: processedAirlines.sort((a,b) => b.total_flights - a.total_flights),
        statusChart: Object.values(aggregations.statuses),
        airportChart: Object.values(aggregations.depAirports).sort((a,b) => b.departures - a.departures).slice(0, 20),
        arrivalAirportChart: Object.values(aggregations.arrAirports).sort((a,b) => b.arrivals - a.arrivals).slice(0, 10),
        combinedAirportChart: combinedAirportChart,
        timelineChart: Object.values(aggregations.timeline).sort((a,b) => a.time.localeCompare(b.time)),
        timeBucketChart: Object.values(aggregations.timeBuckets),
        routeChart: Object.values(aggregations.routes).sort((a,b) => b.count - a.count).slice(0, 15),
        durationChart: Object.values(aggregations.durations).sort((a,b) => {
             const order = {"Short Haul": 1, "Medium Haul": 2, "Long Haul": 3};
             return order[a.duration] - order[b.duration];
        }),
        aircraftChart: Object.values(aggregations.aircraft).sort((a,b) => b.flights - a.flights).slice(0, 10)
    };

    return result;

}

function broadcastToClients() {
    if (serverFlightCache) {
        const rawFlightsArray = serverFlightCache.data || [];
        const processedData = processFlightData(rawFlightsArray);
        io.emit('flight_update', {
            raw_data: serverFlightCache,
            processed_data: processedData,
            interval: currentIntervalMs
        });
    }
}

fetchLatestFlights();

startPolling(POLLING_INTERVAL_MS);

io.on('connection', (socket) => {
    const activeClients = io.engine.clientsCount;
    if (activeClients > MAX_USERS) {
        console.log(`Connection rejected. Max capacity (${MAX_USERS}) reached.`);
        socket.emit('error', 'Server at maximum capacity. Try again later.');
        socket.disconnect(true);
        return;
    }
    
    console.log(`New client connected: ${socket.id} - Total clients: ${activeClients}`);

    if (serverFlightCache) {
        const rawFlightsArray = serverFlightCache.data || [];
        const processedData = processFlightData(rawFlightsArray);
        socket.emit('flight_update', {
            raw_data: serverFlightCache,
            processed_data: processedData,
            interval: currentIntervalMs
        });
    }

    socket.on('update_interval', (ms) => {
        const newMs = parseInt(ms, 10);
        if (newMs >= 5000) {
            startPolling(newMs);
            fetchLatestFlights();
        }
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id} - Total clients: ${io.engine.clientsCount}`);
    });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`-------------------------------------------`);
    console.log(`WebSocket Server listening on port ${PORT}`);
    console.log(`Max Users: ${MAX_USERS}`);
    console.log(`-------------------------------------------`);
});