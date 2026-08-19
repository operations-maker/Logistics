/**
 * Logistics Operations Control System (LCOS) - State Management
 * Handles local storage persistence, state initialization, and database transactions.
 */

const STORAGE_KEY = 'LCOS_SYSTEM_STATE';

// Initial Seed Data
const INITIAL_BRANCHES = [
    { id: 'BR-CHE', name: 'Chennai', manager: 'Balaji R.', phone: '+91 94412 12345', x: 82, y: 15 },
    { id: 'BR-CBE', name: 'Coimbatore', manager: 'Senthil Kumar', phone: '+91 94412 23456', x: 20, y: 55 },
    { id: 'BR-MDU', name: 'Madurai', manager: 'Pandian M.', phone: '+91 94412 34567', x: 42, y: 70 },
    { id: 'BR-TRY', name: 'Tiruchirappalli', manager: 'Raja Sekhar', phone: '+91 94412 45678', x: 52, y: 55 },
    { id: 'BR-SAL', name: 'Salem', manager: 'Venkatachalam K.', phone: '+91 94412 56789', x: 45, y: 40 },
    { id: 'BR-VEL', name: 'Vellore', manager: 'Karthikeyan S.', phone: '+91 94412 67890', x: 68, y: 22 },
    { id: 'BR-ERD', name: 'Erode', manager: 'Ramasamy P.', phone: '+91 94412 78901', x: 35, y: 48 },
    { id: 'BR-TEN', name: 'Tirunelveli', manager: 'Muthu Krishnan', phone: '+91 94412 89012', x: 35, y: 85 },
    { id: 'BR-TUT', name: 'Thoothukudi', manager: 'Subbiah V.', phone: '+91 94412 90123', x: 48, y: 88 },
    { id: 'BR-DGL', name: 'Dindigul', manager: 'Palanichamy M.', phone: '+91 94412 01234', x: 38, y: 62 },
    { id: 'BR-CUD', name: 'Cuddalore', manager: 'Elangovan A.', phone: '+91 94412 11223', x: 72, y: 38 },
    { id: 'BR-KNC', name: 'Kanchipuram', manager: 'Srinivasan G.', phone: '+91 94412 22334', x: 76, y: 24 },
    { id: 'BR-VLP', name: 'Villupuram', manager: 'Anbarasan T.', phone: '+91 94412 33445', x: 70, y: 32 },
    { id: 'BR-NGP', name: 'Nagapattinam', manager: 'Muruganandam K.', phone: '+91 94412 44556', x: 76, y: 52 }
];

const INITIAL_COMMODITIES = [
    { id: 'COM-RIC', name: 'Rice', unit: 'Bags', weight: 50, value: 2000 },
    { id: 'COM-SUG', name: 'Sugar', unit: 'Bags', weight: 50, value: 2500 },
    { id: 'COM-WHE', name: 'Wheat', unit: 'Bags', weight: 50, value: 1800 },
    { id: 'COM-PUL', name: 'Pulses', unit: 'Bags', weight: 50, value: 3200 },
    { id: 'COM-CEM', name: 'Cement', unit: 'Bags', weight: 50, value: 450 },
    { id: 'COM-STE', name: 'Steel', unit: 'Tons', weight: 1000, value: 65000 }
];

const INITIAL_VEHICLES = [
    { id: 'TN-01-AB-1234', type: 'Lorry', capacity: 15, owner: 'Self Owned', status: 'Available' },
    { id: 'TN-37-CD-5678', type: 'Container', capacity: 25, owner: 'Logistics Partners', status: 'Available' },
    { id: 'TN-59-EF-9012', type: 'Mini Truck', capacity: 5, owner: 'Self Owned', status: 'Available' },
    { id: 'TN-02-GH-3456', type: 'Lorry', capacity: 15, owner: 'Self Owned', status: 'Available' },
    { id: 'TN-07-JK-7890', type: 'Container', capacity: 22, owner: 'Logistics Partners', status: 'Available' },
    { id: 'TN-23-LM-1122', type: 'Lorry', capacity: 12, owner: 'Self Owned', status: 'Available' },
    { id: 'TN-30-NP-3344', type: 'Mini Truck', capacity: 4, owner: 'Logistics Partners', status: 'Available' },
    { id: 'TN-45-QR-5566', type: 'Container', capacity: 28, owner: 'Self Owned', status: 'Available' },
    { id: 'TN-69-ST-7788', type: 'Lorry', capacity: 16, owner: 'Logistics Partners', status: 'Available' },
    { id: 'TN-72-UV-9900', type: 'Mini Truck', capacity: 6, owner: 'Self Owned', status: 'Available' }
];

const INITIAL_DRIVERS = [
    { id: 'DRV-101', name: 'Selvam R.', license: 'DL-TN012015001', phone: '+91 98840 12345', experience: 8, performance: 98, warnings: 0, status: 'Available' },
    { id: 'DRV-102', name: 'Kumaravel P.', license: 'DL-TN372018002', phone: '+91 98840 23456', experience: 5, performance: 92, warnings: 0, status: 'Available' },
    { id: 'DRV-103', name: 'Rajesh Nair', license: 'DL-TN592012003', phone: '+91 98840 34567', experience: 12, performance: 80, warnings: 1, status: 'Available' },
    { id: 'DRV-104', name: 'Murugan T.', license: 'DL-TN022014004', phone: '+91 98840 45678', experience: 10, performance: 95, warnings: 0, status: 'Available' },
    { id: 'DRV-105', name: 'Saravanan K.', license: 'DL-TN072020005', phone: '+91 98840 56789', experience: 4, performance: 90, warnings: 0, status: 'Available' },
    { id: 'DRV-106', name: 'Arumugam M.', license: 'DL-TN232011006', phone: '+91 98840 67890', experience: 15, performance: 100, warnings: 0, status: 'Available' },
    { id: 'DRV-107', name: 'Baskaran S.', license: 'DL-TN302016007', phone: '+91 98840 78901', experience: 7, performance: 65, warnings: 2, status: 'Available' },
    { id: 'DRV-108', name: 'Kathiravan G.', license: 'DL-TN452019008', phone: '+91 98840 89012', experience: 6, performance: 94, warnings: 0, status: 'Available' },
    { id: 'DRV-109', name: 'Paneerselvam K.', license: 'DL-TN692010009', phone: '+91 98840 90123', experience: 18, performance: 99, warnings: 0, status: 'Available' },
    { id: 'DRV-110', name: 'Vinoth Kumar', license: 'DL-TN722021010', phone: '+91 98840 01234', experience: 3, performance: 88, warnings: 0, status: 'Available' }
];

const INITIAL_HELPERS = [
    { id: 'HLP-201', name: 'Mani G.', phone: '+91 97760 11223', role: 'Senior Helper', status: 'Available' },
    { id: 'HLP-202', name: 'Sakthi V.', phone: '+91 97760 22334', role: 'Junior Helper', status: 'Available' },
    { id: 'HLP-203', name: 'Loganathan S.', phone: '+91 97760 33445', role: 'Senior Helper', status: 'Available' },
    { id: 'HLP-204', name: 'Velu P.', phone: '+91 97760 44556', role: 'Junior Helper', status: 'Available' },
    { id: 'HLP-205', name: 'Thangaraj K.', phone: '+91 97760 55667', role: 'Senior Helper', status: 'Available' },
    { id: 'HLP-206', name: 'Ramu M.', phone: '+91 97760 66778', role: 'Junior Helper', status: 'Available' }
];

// Seed stock data structure: { branchId: { commodityId: { available, inTransit, delivered, pending } } }
function generateInitialStock() {
    const stock = {};
    INITIAL_BRANCHES.forEach(branch => {
        stock[branch.id] = {};
        INITIAL_COMMODITIES.forEach(com => {
            // Seed randomized stock based on branch size
            let avail = 0;
            if (branch.id === 'BR-CHE') avail = 1500;
            else if (branch.id === 'BR-CBE') avail = 1200;
            else if (branch.id === 'BR-MDU') avail = 800;
            else avail = Math.floor(Math.random() * 8 + 2) * 50; // 100 - 500 bags

            if (com.id === 'COM-STE') {
                avail = Math.floor(avail / 50); // Steel is measured in Tons, so lower number
            }

            stock[branch.id][com.id] = {
                available: avail,
                inTransit: 0,
                delivered: 0,
                pending: 0
            };
        });
    });
    return stock;
}

// Global state model
const LCOS_State = {
    // Current application state
    data: {
        branches: [],
        commodities: [],
        vehicles: [],
        drivers: [],
        helpers: [],
        trips: [],
        callLogs: [],
        stock: {},
        alerts: [],
        requests: [], // Tracking team requests to manager
        systemSettings: {
            simulationTime: '2026-08-04T08:00:00+05:30', // Start clock at 8:00 AM
            simulationSpeed: 60, // 1 real min = 60 simulated mins (i.e. 1s = 1min)
            isSimulating: true,
            alertTimeThreshold: 2, // alert if no status update in 2 simulated hours
            currentRole: 'tracking_team' // default role is tracking team
        }
    },

    init() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                this.data = JSON.parse(saved);
                return;
            } catch (e) {
                console.error("Failed to parse saved state, re-initializing", e);
            }
        }
        this.resetToDefaults();
    },

    save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    },

    resetToDefaults() {
        this.data.branches = JSON.parse(JSON.stringify(INITIAL_BRANCHES));
        this.data.commodities = JSON.parse(JSON.stringify(INITIAL_COMMODITIES));
        this.data.vehicles = JSON.parse(JSON.stringify(INITIAL_VEHICLES));
        this.data.drivers = JSON.parse(JSON.stringify(INITIAL_DRIVERS));
        this.data.helpers = JSON.parse(JSON.stringify(INITIAL_HELPERS));
        this.data.stock = generateInitialStock();
        this.data.callLogs = [];
        this.data.alerts = [];
        this.data.requests = [];
        this.data.systemSettings = {
            simulationTime: '2026-08-04T08:00:00+05:30',
            simulationSpeed: 60,
            isSimulating: true,
            alertTimeThreshold: 2,
            currentRole: 'tracking_team'
        };
        this.data.trips = this.generateSeedTrips();
        
        // Adjust status of assigned vehicles & drivers in seed trips
        this.recalculateResourceStatuses();
        this.save();
    },

    recalculateResourceStatuses() {
        // Reset all statuses first
        this.data.vehicles.forEach(v => v.status = 'Available');
        this.data.drivers.forEach(d => {
            if (d.status !== 'Suspended' && d.status !== 'Blacklisted') {
                d.status = 'Available';
            }
        });
        this.data.helpers.forEach(h => h.status = 'Available');

        // Mark assigned resources as Active/Busy if their trip is active
        const activeStatuses = ['DISPATCH_APPROVED', 'DRIVER_CALLED', 'DRIVER_CONFIRMED', 'IN_TRANSIT', 'DELAYED', 'ARRIVED', 'DELIVERY_CONFIRMED', 'RETURNING'];
        this.data.trips.forEach(trip => {
            if (activeStatuses.includes(trip.status)) {
                const isReturning = trip.status === 'RETURNING';
                const v = this.data.vehicles.find(veh => veh.id === trip.vehicleId);
                if (v) v.status = isReturning ? 'Returning' : 'In Transit';

                const d = this.data.drivers.find(drv => drv.id === trip.driverId);
                if (d) d.status = isReturning ? 'Returning' : 'On Trip';

                if (trip.helperId) {
                    const h = this.data.helpers.find(hlp => hlp.id === trip.helperId);
                    if (h) h.status = isReturning ? 'Returning' : 'On Trip';
                }
            }
        });
    },

    generateSeedTrips() {
        const t1Time = '2026-08-04T08:00:00+05:30';
        const t2Time = '2026-08-04T08:15:00+05:30';
        const t3Time = '2026-08-04T08:30:00+05:30';
        const t4Time = '2026-08-03T14:00:00+05:30';

        // 1. Created (Draft) Trip
        const trip1 = {
            id: 'TRIP-1001',
            dispatchId: 'DISP-2001',
            commodityId: 'COM-RIC',
            quantity: 200,
            sourceBranchId: 'BR-CHE',
            destinationBranchId: 'BR-MDU',
            vehicleId: 'TN-01-AB-1234',
            driverId: 'DRV-101', // Selvam R.
            helperId: 'HLP-201', // Mani G.
            dispatchDate: '2026-08-04T09:30:00+05:30',
            expectedDeliveryDate: '2026-08-04T17:30:00+05:30',
            status: 'CREATED',
            checklists: {
                dispatch: { loaded: false, verified: false, vehicleReady: false, driverAvailable: false },
                delivery: { quantityMatches: false, damagesChecked: false, missingChecked: false, conditionOk: false }
            },
            transitUpdates: [],
            callLogs: [],
            deliveryInfo: null,
            lastUpdateTimestamp: t1Time
        };
        // Add pending stock to destination
        this.data.stock['BR-MDU']['COM-RIC'].pending += 200;

        // 2. In Transit Trip
        const trip2 = {
            id: 'TRIP-1002',
            dispatchId: 'DISP-2002',
            commodityId: 'COM-CEM',
            quantity: 300,
            sourceBranchId: 'BR-CBE',
            destinationBranchId: 'BR-SAL',
            vehicleId: 'TN-59-EF-9012',
            driverId: 'DRV-105', // Saravanan K.
            helperId: 'HLP-202', // Sakthi V.
            dispatchDate: '2026-08-04T08:30:00+05:30',
            expectedDeliveryDate: '2026-08-04T12:30:00+05:30',
            status: 'IN_TRANSIT',
            checklists: {
                dispatch: { loaded: true, verified: true, vehicleReady: true, driverAvailable: true },
                delivery: { quantityMatches: false, damagesChecked: false, missingChecked: false, conditionOk: false }
            },
            transitUpdates: [
                {
                    timestamp: '2026-08-04T08:45:00+05:30',
                    location: 'Palladam Toll Plaza, NH-81',
                    condition: 'Good',
                    status: 'IN_TRANSIT',
                    delayReason: '',
                    remarks: 'Vehicle moving smoothly. Expected to cross Tiruppur in 30 mins.'
                }
            ],
            callLogs: ['CL-001', 'CL-002'],
            deliveryInfo: null,
            lastUpdateTimestamp: '2026-08-04T08:45:00+05:30'
        };
        // Update stock: Source Available decreases, Destination In-Transit increases
        this.data.stock['BR-CBE']['COM-CEM'].available -= 300;
        this.data.stock['BR-SAL']['COM-CEM'].inTransit += 300;

        // Seed call logs for Trip 2
        this.data.callLogs.push(
            {
                id: 'CL-001',
                tripId: 'TRIP-1002',
                timestamp: '2026-08-04T08:15:00+05:30',
                type: 'Dispatch Confirmation',
                caller: 'Admin Office',
                recipient: 'BR-CBE Manager (Senthil)',
                notes: 'Completed dispatch checklist. Cargo loaded, documents signed.'
            },
            {
                id: 'CL-002',
                tripId: 'TRIP-1002',
                timestamp: '2026-08-04T08:45:00+05:30',
                type: 'Transit Update',
                caller: 'Driver (Saravanan K.)',
                recipient: 'Admin Office',
                notes: 'Driver reported cross Palladam Toll Plaza. Speed 60 km/h, road clear.'
            }
        );

        // 3. Delayed Trip (Breakdown)
        const trip3 = {
            id: 'TRIP-1003',
            dispatchId: 'DISP-2003',
            commodityId: 'COM-STE',
            quantity: 12,
            sourceBranchId: 'BR-VEL',
            destinationBranchId: 'BR-KNC',
            vehicleId: 'TN-37-CD-5678',
            driverId: 'DRV-103', // Rajesh Nair (Warning count: 1, Perf: 80)
            helperId: null,
            dispatchDate: '2026-08-04T07:30:00+05:30',
            expectedDeliveryDate: '2026-08-04T10:30:00+05:30',
            status: 'DELAYED',
            checklists: {
                dispatch: { loaded: true, verified: true, vehicleReady: true, driverAvailable: true },
                delivery: { quantityMatches: false, damagesChecked: false, missingChecked: false, conditionOk: false }
            },
            transitUpdates: [
                {
                    timestamp: '2026-08-04T07:45:00+05:30',
                    location: 'Ranipet Bypass',
                    condition: 'Good',
                    status: 'IN_TRANSIT',
                    delayReason: '',
                    remarks: 'Journey started. Weather clear.'
                },
                {
                    timestamp: '2026-08-04T09:00:00+05:30',
                    location: 'Kaveripakkam (Stopped)',
                    condition: 'Minor Issue',
                    status: 'DELAYED',
                    delayReason: 'Breakdown',
                    remarks: 'Engine overheating. Driver stopped on highway. Waiting for coolant cooldown.'
                }
            ],
            callLogs: ['CL-003', 'CL-004'],
            deliveryInfo: null,
            lastUpdateTimestamp: '2026-08-04T09:00:00+05:30'
        };
        // Update stock: Source Available decreases, Destination In-Transit increases
        this.data.stock['BR-VEL']['COM-STE'].available -= 12;
        this.data.stock['BR-KNC']['COM-STE'].inTransit += 12;

        this.data.callLogs.push(
            {
                id: 'CL-003',
                tripId: 'TRIP-1003',
                timestamp: '2026-08-04T07:45:00+05:30',
                type: 'Transit Update',
                caller: 'Driver (Rajesh Nair)',
                recipient: 'Admin Office',
                notes: 'Journey started. Confirmed vehicle loaded with steel rods.'
            },
            {
                id: 'CL-004',
                tripId: 'TRIP-1003',
                timestamp: '2026-08-04T09:00:00+05:30',
                type: 'Delay Check',
                caller: 'Admin Office',
                recipient: 'Driver (Rajesh Nair)',
                notes: 'Admin noticed vehicle stopped for 30 minutes on GPS simulator. Driver confirmed radiator leak/overheat breakdown.'
            }
        );

        // Add an active alert for the breakdown
        this.data.alerts.push({
            id: 'ALT-101',
            tripId: 'TRIP-1003',
            timestamp: '2026-08-04T09:00:00+05:30',
            type: 'Breakdown',
            message: 'Trip TRIP-1003 (Steel) reports Breakdown at Kaveripakkam.',
            severity: 'danger',
            status: 'Active'
        });

        // 4. Closed (Completed) Trip
        const trip4 = {
            id: 'TRIP-1004',
            dispatchId: 'DISP-2004',
            commodityId: 'COM-PUL',
            quantity: 150,
            sourceBranchId: 'BR-TRY',
            destinationBranchId: 'BR-CBE',
            vehicleId: 'TN-07-JK-7890',
            driverId: 'DRV-106', // Arumugam M.
            helperId: 'HLP-203', // Loganathan S.
            dispatchDate: '2026-08-03T14:30:00+05:30',
            expectedDeliveryDate: '2026-08-03T20:30:00+05:30',
            status: 'CLOSED',
            checklists: {
                dispatch: { loaded: true, verified: true, vehicleReady: true, driverAvailable: true },
                delivery: { quantityMatches: true, damagesChecked: true, missingChecked: true, conditionOk: true }
            },
            transitUpdates: [
                {
                    timestamp: '2026-08-03T16:30:00+05:30',
                    location: 'Karur Bypass',
                    condition: 'Good',
                    status: 'IN_TRANSIT',
                    delayReason: '',
                    remarks: 'All okay. Highway traffic light.'
                },
                {
                    timestamp: '2026-08-03T18:45:00+05:30',
                    location: 'Kangeyam NH Road',
                    condition: 'Good',
                    status: 'IN_TRANSIT',
                    delayReason: '',
                    remarks: 'Dinner break complete. Resuming journey.'
                },
                {
                    timestamp: '2026-08-03T20:45:00+05:30',
                    location: 'Coimbatore Branch',
                    condition: 'Good',
                    status: 'ARRIVED',
                    delayReason: '',
                    remarks: 'Arrived at destination branch. Waiting for manager.'
                }
            ],
            callLogs: ['CL-005', 'CL-006', 'CL-007', 'CL-008'],
            deliveryInfo: {
                receivedQuantity: 150,
                damagesCount: 0,
                missingCount: 0,
                condition: 'Good',
                receiverName: 'Senthil Kumar (CBE Mgr)',
                receiptNumber: 'RCPT-9004',
                closedTimestamp: '2026-08-03T21:15:00+05:30'
            },
            lastUpdateTimestamp: '2026-08-03T21:15:00+05:30'
        };
        // Update stock: Source Available decreases, Destination Available increases, Destination Delivered increases
        this.data.stock['BR-TRY']['COM-PUL'].available -= 150;
        this.data.stock['BR-CBE']['COM-PUL'].available += 150;
        this.data.stock['BR-CBE']['COM-PUL'].delivered += 150;

        this.data.callLogs.push(
            {
                id: 'CL-005',
                tripId: 'TRIP-1004',
                timestamp: '2026-08-03T14:15:00+05:30',
                type: 'Dispatch Confirmation',
                caller: 'Admin Office',
                recipient: 'BR-TRY Manager (Raja)',
                notes: 'Confirmed 150 bags of pulses loaded on container TN-07-JK-7890.'
            },
            {
                id: 'CL-006',
                tripId: 'TRIP-1004',
                timestamp: '2026-08-03T16:30:00+05:30',
                type: 'Transit Update',
                caller: 'Driver (Arumugam M.)',
                recipient: 'Admin Office',
                notes: 'Driver reporting in from Karur. Clear run.'
            },
            {
                id: 'CL-007',
                tripId: 'TRIP-1004',
                timestamp: '2026-08-03T20:45:00+05:30',
                type: 'Arrival Update',
                caller: 'Driver (Arumugam M.)',
                recipient: 'Admin Office',
                notes: 'Driver reporting arrival at CBE warehouse gate.'
            },
            {
                id: 'CL-008',
                tripId: 'TRIP-1004',
                timestamp: '2026-08-03T21:15:00+05:30',
                type: 'Delivery Confirmation',
                caller: 'Admin Office',
                recipient: 'BR-CBE Manager (Senthil)',
                notes: 'Manager confirmed unloading. Handed physical invoice. Counts matching exactly.'
            }
        );

        return [trip1, trip2, trip3, trip4];
    },

    // --- State Transactions & Helpers ---

    getBranches() { return this.data.branches; },
    getCommodities() { return this.data.commodities; },
    getVehicles() { return this.data.vehicles; },
    getDrivers() { return this.data.drivers; },
    getHelpers() { return this.data.helpers; },
    getTrips() { return this.data.trips; },
    getCallLogs() { return this.data.callLogs; },
    getAlerts() { return this.data.alerts; },
    getSystemSettings() { return this.data.systemSettings; },
    getStock() { return this.data.stock; },

    getTripById(id) {
        return this.data.trips.find(t => t.id === id);
    },

    addTrip(trip) {
        this.data.trips.push(trip);
        
        // Update pending stock at destination branch
        if (this.data.stock[trip.destinationBranchId] && this.data.stock[trip.destinationBranchId][trip.commodityId]) {
            this.data.stock[trip.destinationBranchId][trip.commodityId].pending += Number(trip.quantity);
        }
        
        this.recalculateResourceStatuses();
        this.save();
    },

    updateTripStatus(tripId, newStatus) {
        const trip = this.getTripById(tripId);
        if (!trip) return;

        const oldStatus = trip.status;
        trip.status = newStatus;
        trip.lastUpdateTimestamp = this.data.systemSettings.simulationTime;

        // Stock Transitions based on status:
        if (newStatus === 'IN_TRANSIT' && oldStatus !== 'IN_TRANSIT') {
            // Source Available decreases
            if (this.data.stock[trip.sourceBranchId]?.[trip.commodityId]) {
                this.data.stock[trip.sourceBranchId][trip.commodityId].available -= Number(trip.quantity);
            }
            // Destination In-Transit increases, Destination Pending decreases
            if (this.data.stock[trip.destinationBranchId]?.[trip.commodityId]) {
                this.data.stock[trip.destinationBranchId][trip.commodityId].inTransit += Number(trip.quantity);
                this.data.stock[trip.destinationBranchId][trip.commodityId].pending = Math.max(0, 
                    this.data.stock[trip.destinationBranchId][trip.commodityId].pending - Number(trip.quantity)
                );
            }
        } else if (newStatus === 'CLOSED' && oldStatus !== 'CLOSED') {
            // Un-assign resources
            this.recalculateResourceStatuses();
        }

        this.recalculateResourceStatuses();
        this.save();
    },

    closeTripDelivery(tripId, deliveryInfo) {
        const trip = this.getTripById(tripId);
        if (!trip) return;

        trip.status = 'CLOSED';
        trip.deliveryInfo = deliveryInfo;
        trip.lastUpdateTimestamp = this.data.systemSettings.simulationTime;

        // Final Stock Update
        const qtyDispatched = Number(trip.quantity);
        const qtyReceived = Number(deliveryInfo.receivedQuantity);

        // Destination In-Transit decreases by what was dispatched
        if (this.data.stock[trip.destinationBranchId]?.[trip.commodityId]) {
            this.data.stock[trip.destinationBranchId][trip.commodityId].inTransit = Math.max(0, 
                this.data.stock[trip.destinationBranchId][trip.commodityId].inTransit - qtyDispatched
            );
            // Destination Available increases by what was received
            this.data.stock[trip.destinationBranchId][trip.commodityId].available += qtyReceived;
            // Destination Delivered increases by received qty
            this.data.stock[trip.destinationBranchId][trip.commodityId].delivered += qtyReceived;
        }

        // Adjust driver's performance score based on damages/missing or delays
        const driver = this.data.drivers.find(d => d.id === trip.driverId);
        if (driver) {
            let reduction = 0;
            if (deliveryInfo.damagesCount > 0) reduction += 10;
            if (deliveryInfo.missingCount > 0) reduction += 5;
            
            // Check if there was breakdown delay in updates
            const hasBreakdown = trip.transitUpdates.some(u => u.delayReason === 'Breakdown');
            if (hasBreakdown) reduction += 5;

            driver.performance = Math.max(0, driver.performance - reduction);
        }

        this.recalculateResourceStatuses();
        this.save();
    },

    addCallLog(log) {
        const id = 'CL-' + String(this.data.callLogs.length + 101);
        const newLog = {
            id,
            timestamp: this.data.systemSettings.simulationTime,
            ...log
        };
        this.data.callLogs.push(newLog);

        // Also associate log with trip if tripId is provided
        if (log.tripId) {
            const trip = this.getTripById(log.tripId);
            if (trip) {
                if (!trip.callLogs.includes(id)) {
                    trip.callLogs.push(id);
                }
                trip.lastUpdateTimestamp = this.data.systemSettings.simulationTime;
            }
        }
        this.save();
        return id;
    },

    addAlert(alert) {
        const id = 'ALT-' + String(this.data.alerts.length + 101);
        const newAlert = {
            id,
            timestamp: this.data.systemSettings.simulationTime,
            status: 'Active',
            ...alert
        };
        this.data.alerts.push(newAlert);
        this.save();
        return newAlert;
    },

    resolveAlert(alertId) {
        const alert = this.data.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.status = 'Resolved';
            this.save();
        }
    },

    addDriver(driver) {
        const id = 'DRV-' + String(this.data.drivers.length + 101);
        this.data.drivers.push({
            id,
            performance: 100,
            warnings: 0,
            status: 'Available',
            ...driver
        });
        this.save();
    },

    addVehicle(vehicle) {
        this.data.vehicles.push({
            status: 'Available',
            ...vehicle
        });
        this.save();
    },

    addBranch(branch) {
        const id = 'BR-' + branch.name.slice(0, 3).toUpperCase();
        const newBranch = { id, ...branch };
        this.data.branches.push(newBranch);
        
        // Initialize stock for the new branch
        this.data.stock[id] = {};
        this.data.commodities.forEach(com => {
            this.data.stock[id][com.id] = { available: 0, inTransit: 0, delivered: 0, pending: 0 };
        });
        
        this.save();
    },

    addCommodity(commodity) {
        const id = 'COM-' + commodity.name.slice(0, 3).toUpperCase();
        const newCom = { id, ...commodity };
        this.data.commodities.push(newCom);

        // Update branch stocks to include this new commodity
        this.data.branches.forEach(branch => {
            if (!this.data.stock[branch.id]) this.data.stock[branch.id] = {};
            this.data.stock[branch.id][id] = { available: 0, inTransit: 0, delivered: 0, pending: 0 };
        });
        this.save();
    },

    // --- Role-Separation Helpers ---
    getCurrentRole() {
        return this.data.systemSettings.currentRole || 'tracking_team';
    },

    setCurrentRole(role) {
        this.data.systemSettings.currentRole = role;
        this.save();
    },

    escalateAlertToManager(alertId) {
        const alert = this.data.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.escalated = true;
            alert.escalatedTimestamp = this.data.systemSettings.simulationTime;

            // Add call log for record
            this.addCallLog({
                tripId: alert.tripId,
                type: 'Escalation Call',
                caller: 'Tracking Team Operator',
                recipient: 'Branch Manager (Admin)',
                notes: `CRITICAL ESCALATION: Tracking Team escalated alert [${alert.type}] to Branch Manager. Details: ${alert.message}`
            });
            this.save();
        }
    },

    getRequests() {
        return this.data.requests || [];
    },

    addManagerRequest(type, requestData) {
        const id = 'REQ-' + (this.data.requests.length + 101);
        const req = {
            id,
            type,
            data: requestData,
            status: 'Pending',
            timestamp: this.data.systemSettings.simulationTime
        };
        this.data.requests.push(req);
        this.save();
        return req;
    },

    approveManagerRequest(reqId) {
        const req = this.data.requests.find(r => r.id === reqId);
        if (!req || req.status !== 'Pending') return false;

        req.status = 'Approved';
        req.approvedTimestamp = this.data.systemSettings.simulationTime;

        // Perform the requested action
        if (req.type === 'Add Driver') {
            this.addDriver(req.data);
        } else if (req.type === 'Add Vehicle') {
            this.addVehicle(req.data);
        } else if (req.type === 'Add Branch') {
            this.addBranch(req.data);
        } else if (req.type === 'Add Commodity') {
            this.addCommodity(req.data);
        } else if (req.type === 'Add Stock') {
            const { branchId, commodityId, quantity } = req.data;
            if (this.data.stock[branchId]?.[commodityId]) {
                this.data.stock[branchId][commodityId].available += Number(quantity);
            }
        }

        // Add call log for action record
        this.addCallLog({
            type: 'Dispatch Confirmation',
            caller: 'Branch Manager (Admin)',
            recipient: 'System Logs',
            notes: `Supervisor Approved Request [${req.id}]: Completed action for [${req.type}].`
        });

        this.save();
        return true;
    },

    addStockDirectly(branchId, commodityId, qty) {
        if (this.data.stock[branchId]?.[commodityId]) {
            this.data.stock[branchId][commodityId].available += Number(qty);
            
            // Add Call Log
            this.addCallLog({
                type: 'Dispatch Confirmation',
                caller: 'Branch Manager (Admin)',
                recipient: 'Warehouse Database',
                notes: `Manager manually added stock directly: ${qty} units of ${commodityId} to ${branchId}`
            });
            this.save();
            return true;
        }
        return false;
    },

    recordReturnArrival(tripId) {
        const trip = this.getTripById(tripId);
        if (!trip) return false;

        trip.status = 'COMPLETED_RETURN';
        trip.lastUpdateTimestamp = this.data.systemSettings.simulationTime;

        // Log Call
        this.addCallLog({
            tripId: trip.id,
            type: 'Arrival Update',
            caller: 'Driver',
            recipient: 'Admin Office',
            notes: `Vehicle returned to Origin Branch base gates. Driver and Helper checked in physically. Vehicle released back to available pool.`
        });

        this.recalculateResourceStatuses();
        this.save();
        return true;
    }
};

// Initialize State
LCOS_State.init();
window.LCOS_State = LCOS_State; // Expose globally for modular imports
