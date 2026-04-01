import React, { useEffect, useState, useRef } from 'react'
import { Plane, Clock, AlertTriangle, CheckCircle, Navigation, Lightbulb, LightbulbOff } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'
import KpiCard from './KpiCard'
import Footer from './Footer'

const INTERVAL_OPTIONS = [
    { label: "5 Seconds", value: 5000 },
    { label: "15 Seconds", value: 15000 },
    { label: "30 Seconds", value: 30000 },
    { label: "1 Minute", value: 60000 },
    { label: "10 Minutes", value: 600000 },
    { label: "15 Minutes", value: 900000 },
    { label: "30 Minutes", value: 1800000 },
    { label: "1 Hour", value: 3600000 },
    { label: "2 Hours", value: 7200000 },
    { label: "4 Hours", value: 14400000 },
    { label: "8 Hours", value: 28800000 },
    { label: "16 Hours", value: 57600000 },
    { label: "24 Hours", value: 86400000 }
];

const Dashboard = ({ isDark }) => {
    const [flightData, setFlightData] = useState();
    const [isConnected, setIsConnected] = useState(false);
    const [pollInterval, setPollInterval] = useState(600000);

    const socketRef = useRef(null);

    useEffect(() => {
        socketRef.current = io("http://localhost:8080");
        const socket = socketRef.current;

        setIsConnected(socket.connected);
        if (!socket.connected) {
            toast.loading("Connecting to socket...", { id: 'socket-status' });
        } else {
            toast.success("Socket Connected", { id: 'socket-status' });
        }

        function onConnect() {
            setIsConnected(true);
            toast.success("Socket Connected", { id: 'socket-status' });
        }

        function onDisconnect(reason) {
            setIsConnected(false);
            if (reason === "io server disconnect") {
                toast.error("Disconnected by server.", { id: 'socket-status' });
            } else if (reason !== "io client disconnect") {
                toast.error(`Connection lost: ${reason}`, { id: 'socket-status' });
            } else {
                toast("Socket manually paused.", { icon: '⏸️', id: 'socket-status' });
            }
        }

        function onConnectError(err) {
            toast.error(`Connection failed: ${err.message}`, { id: 'socket-status' });
        }

        function onFlightUpdate(payload) {
            console.log("✈️ Flight Update Received:", payload.processed_data);
            setFlightData(payload.processed_data);

            if (payload.interval) {
                setPollInterval(payload.interval);
            }

            toast.success("Polled new flight data!", { id: 'flight-poll', icon: '🚀' });
        }

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('connect_error', onConnectError);
        socket.on('flight_update', onFlightUpdate);

        return () => {
            socket.disconnect();
            socket.removeAllListeners();
        };
    }, []);

    const defaultFlightData = {
        summary: { totalFlights: 0, activeFlights: 0, totalAirlines: 0, scheduledFlights: 0, delayedFlights: 0, totalCodeshares: 0 },
        airlineChart: [],
        statusChart: [],
        airportChart: [],
        arrivalAirportChart: [],
        combinedAirportChart: [],
        timelineChart: [],
        timeBucketChart: [],
        routeChart: [],
        durationChart: []
    };

    const {
        summary,
        routeChart,
        airlineChart,
        statusChart,
        airportChart,
        timelineChart,
        combinedAirportChart,
        durationChart,
        timeBucketChart
    } = flightData || defaultFlightData;

    const handleIntervalChange = (e) => {
        const newInterval = parseInt(e.target.value);
        setPollInterval(newInterval);

        const socket = socketRef.current;
        if (socket && socket.connected) {
            socket.emit('update_interval', newInterval);
            toast.success(
                `Poll speed changed to ${INTERVAL_OPTIONS.find(opt => opt.value === newInterval)?.label}`,
                { id: 'interval-update' }
            );
        } else {
            toast.error("Socket must be connected to change poll speed.");
        }
    };

    const THEME_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];
    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
        if (cx == null || cy == null || innerRadius == null || outerRadius == null) {
            return null;
        }
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const ncx = Number(cx);
        const x = ncx + radius * Math.cos(-(midAngle ?? 0) * RADIAN);
        const ncy = Number(cy);
        const y = ncy + radius * Math.sin(-(midAngle ?? 0) * RADIAN);
        return (
            <text x={x} y={y} fill="currentColor" className="text-white font-semibold text-xs drop-shadow-md" textAnchor={x > ncx ? 'start' : 'end'} dominantBaseline="central">
                {`${((percent ?? 1) * 100).toFixed(0)}%`}
            </text>
        );
    };

    const codeshares = summary.totalCodeshares || 0;
    const directFlights = Math.max(0, summary.totalFlights - codeshares);
    const codeshareData = [
        { name: 'Codeshare', value: codeshares },
        { name: 'Direct', value: directFlights }
    ];

    const tooltipStyle = {
        backgroundColor: 'var(--card)',
        color: 'var(--card-foreground)',
        borderRadius: '8px',
        border: '1px solid var(--border)',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
    };

    return (
        <div className="min-h-screen pt-8 pb-12 transition-colors duration-300 overflow-x-hidden bg-background">
            <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">

                    <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end space-y-6 md:space-y-0">
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">Global Flight Operations</h1>
                            <p className="mt-1 text-sm text-muted-foreground">Live network status and performance metrics.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 bg-card/50 p-4 rounded-xl border border-border/50">

                        <div className="flex items-center space-x-2 border-r pr-4 border-border">
                            <label className="text-sm font-semibold text-muted-foreground whitespace-nowrap">Poll Rate:</label>
                            <select
                                value={pollInterval}
                                onChange={handleIntervalChange}
                                disabled={!isConnected}
                                className="bg-muted text-foreground text-sm rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-primary border border-border disabled:opacity-50 cursor-pointer"
                            >
                                {INTERVAL_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center space-x-2 border-r pr-4 border-border">
                            <span className="text-sm font-semibold text-muted-foreground">
                                {isConnected ? 'Socket Connected' : 'Socket Disconnected'}
                            </span>
                            <button
                                onClick={() => {
                                    const socket = socketRef.current;
                                    if (!socket) return;

                                    if (isConnected) {
                                        socket.disconnect();
                                    } else {
                                        toast.loading("Reconnecting...", { id: 'socket-status' });
                                        socket.connect();
                                    }
                                }}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${isConnected ? 'bg-primary' : 'bg-muted'}`}
                            >
                                <span className={`flex items-center justify-center h-4 w-4 transform rounded-full bg-primary-foreground transition-transform duration-300 ${isConnected ? 'translate-x-6' : 'translate-x-1'}`} >
                                    {isConnected ? <Lightbulb className="w-3 h-3 text-primary" /> : <LightbulbOff className="w-3 h-3 text-muted-foreground" />}
                                </span>
                            </button>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="relative flex h-3 w-3">
                                {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                                <span className={`relative inline-flex rounded-full h-3 w-3 ${isConnected ? 'bg-emerald-500' : 'bg-destructive'}`}></span>
                            </span>
                            <span className="text-sm font-medium text-foreground">
                                {isConnected ? 'System Live' : 'Disconnected'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <KpiCard title="Active En-Route" value={summary.activeFlights} trend="up" trendValue="Live" icon={Navigation} isDark={isDark} />
                    <KpiCard title="Scheduled" value={summary.scheduledFlights} trend="neutral" trendValue="" icon={Clock} isDark={isDark} />
                    <KpiCard title="Total Airlines" value={airlineChart.length} trend="neutral" trendValue="" icon={Plane} isDark={isDark} />
                    <KpiCard title="Delayed" value={summary.delayedFlights} trend={summary.delayedFlights > 0 ? "down" : "up"} trendValue="" icon={AlertTriangle} isDark={isDark} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">

                    <div className="p-6 rounded-2xl shadow-sm border col-span-1 md:col-span-8 overflow-x-auto bg-card border-border">
                        <h3 className="text-lg font-semibold mb-6 text-foreground">Top 10 Performing Airlines</h3>
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b bg-muted/50 border-border text-muted-foreground">
                                    <th className="p-3 text-sm font-medium">Airline</th>
                                    <th className="p-3 text-sm font-medium">Total Flights</th>
                                    <th className="p-3 text-sm font-medium">Delay Events</th>
                                    <th className="p-3 text-sm font-medium">Delay Min</th>
                                    <th className="p-3 text-sm font-medium">Codeshares</th>
                                    <th className="p-3 text-sm font-medium">Avg Delay</th>
                                </tr>
                            </thead>
                            <tbody>
                                {airlineChart.slice(0, 10).map((airline, index) => (
                                    <tr key={index} className="border-b border-border hover:bg-muted/30 text-foreground transition-colors">
                                        <td className="p-3 font-medium">{airline.name}</td>
                                        <td className="p-3">{airline.total_flights}</td>
                                        <td className="p-3">{airline.delayedCount}</td>
                                        <td className="p-3">{airline.totalDelayMinutes}</td>
                                        <td className="p-3">{airline.codeshares}</td>
                                        <td className="p-3">{airline.avgDelay || 0} min</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-6 rounded-2xl shadow-sm border col-span-1 md:col-span-4 bg-card border-border">
                        <h3 className="text-lg font-semibold mb-6 text-foreground">Top 10 Market Share</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={airlineChart.slice(0, 10)}
                                    labelLine={false}
                                    label={renderCustomizedLabel}
                                    cx="50%" cy="50%" outerRadius={110}
                                    dataKey="total_flights"
                                    nameKey="name"
                                    stroke="var(--background)"
                                    strokeWidth={2}
                                >
                                    {airlineChart.slice(0, 10).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={THEME_COLORS[index % THEME_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: 'var(--foreground)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">

                    <div className="p-6 rounded-2xl shadow-sm border col-span-1 md:col-span-4 bg-card border-border">
                        <h3 className="text-lg font-semibold mb-6 text-foreground">Flight Traffic Over Time</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={timelineChart} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorFlights" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="time" stroke="var(--muted-foreground)" />
                                <YAxis stroke="var(--muted-foreground)" />
                                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: 'var(--foreground)' }} />
                                <Area type="monotone" dataKey="flights" stroke="var(--chart-1)" strokeWidth={3} fillOpacity={1} fill="url(#colorFlights)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="p-6 rounded-2xl shadow-sm border col-span-1 md:col-span-8 bg-card border-border">
                        <h3 className="text-lg font-semibold mb-6 text-foreground">Terminal Traffic Comparison</h3>
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={combinedAirportChart} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="airport" stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} interval={0} angle={-45} textAnchor="end" height={80} />
                                <YAxis stroke="var(--muted-foreground)" />
                                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: 'var(--foreground)' }} />
                                <Legend verticalAlign="top" height={36} wrapperStyle={{ color: 'var(--foreground)' }} />
                                <Bar dataKey="departures" name="Departures" fill="var(--chart-2)" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="arrivals" name="Arrivals" fill="var(--chart-3)" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
                    <div className="p-6 rounded-2xl shadow-sm border col-span-1 md:col-span-6 lg:col-span-6 bg-card border-border">
                        <h3 className="text-lg font-semibold mb-6 text-foreground">Busiest Routes</h3>
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={routeChart} layout="vertical" margin={{ top: 10, right: 30, left: 50, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border)" />
                                <XAxis type="number" stroke="var(--muted-foreground)" />
                                <YAxis dataKey="route" type="category" width={110} stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
                                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: 'var(--foreground)' }} />
                                <Bar dataKey="count" fill="var(--chart-4)" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="p-6 rounded-2xl shadow-sm border col-span-1 md:col-span-6 bg-card border-border">
                        <h3 className="text-lg font-semibold mb-6 text-foreground">Flight Status Distribution</h3>
                        <ResponsiveContainer width="100%" height={350}>
                            <PieChart>
                                <Pie data={statusChart} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value" nameKey="status" stroke="var(--background)" strokeWidth={2}>
                                    {statusChart.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={THEME_COLORS[index % THEME_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: 'var(--foreground)' }} />
                                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: 'var(--foreground)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
                    <div className="p-6 rounded-2xl shadow-sm border col-span-1 md:col-span-4 bg-card border-border">
                        <h3 className="text-lg font-semibold mb-6 text-foreground">Flight Durations</h3>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={durationChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="duration" stroke="var(--muted-foreground)" tick={{ fontSize: 12 }} />
                                <YAxis stroke="var(--muted-foreground)" />
                                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: 'var(--foreground)' }} />
                                <Bar dataKey="count" fill="var(--chart-5)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="p-6 rounded-2xl shadow-sm border col-span-1 md:col-span-4 bg-card border-border">
                        <h3 className="text-lg font-semibold mb-6 text-foreground">Codeshare Distribution</h3>
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie data={codeshareData} cx="50%" cy="50%" outerRadius={90} dataKey="value" nameKey="name" label stroke="var(--background)" strokeWidth={2}>
                                    <Cell fill="var(--chart-2)" />
                                    <Cell fill="var(--chart-3)" />
                                </Pie>
                                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: 'var(--foreground)' }} />
                                <Legend wrapperStyle={{ color: 'var(--foreground)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="p-6 rounded-2xl shadow-sm border col-span-1 md:col-span-4 bg-card border-border">
                        <h3 className="text-lg font-semibold mb-6 text-foreground">Flights by Time of Day</h3>
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie data={timeBucketChart} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="count" nameKey="bucket" stroke="var(--background)" strokeWidth={2}>
                                    <Cell fill="var(--chart-1)" />
                                    <Cell fill="var(--chart-2)" />
                                    <Cell fill="var(--chart-4)" />
                                </Pie>
                                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: 'var(--foreground)' }} />
                                <Legend wrapperStyle={{ color: 'var(--foreground)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                </div>
            </div>
            <Footer />
        </div>
    )
}

export default Dashboard
