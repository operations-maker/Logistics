/**
 * Logistics Operations Control System (LCOS) - Simulation Engine
 * Manages simulated time progression, background check-in requirements,
 * random incident events, and the 3-strike driver call escalation process.
 */

const LCOS_Sim = {
    timerId: null,
    lastCheckRealTime: null,
    onClockTickCallbacks: [],
    onAlertTriggeredCallbacks: [],

    init() {
        this.lastCheckRealTime = Date.now();
        this.start();
    },

    start() {
        const settings = LCOS_State.getSystemSettings();
        if (!settings.isSimulating) return;

        // Run simulation step every 1000ms
        if (this.timerId) clearInterval(this.timerId);
        this.timerId = setInterval(() => {
            this.step();
        }, 1000);
    },

    stop() {
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
    },

    step() {
        const settings = LCOS_State.getSystemSettings();
        if (!settings.isSimulating) return;

        const now = Date.now();
        const elapsedRealSeconds = (now - this.lastCheckRealTime) / 1000;
        this.lastCheckRealTime = now;

        // Advance simulation clock
        // simulationSpeed represents: 1 real second = X simulated minutes
        const simulatedMinutesToAdd = elapsedRealSeconds * settings.simulationSpeed;
        
        let simTime = new Date(settings.simulationTime);
        simTime.setMinutes(simTime.getMinutes() + simulatedMinutesToAdd);
        settings.simulationTime = simTime.toISOString();
        
        LCOS_State.save();

        // 1. Check for active trips and check-in timeouts
        this.checkTripTimeouts(simTime);

        // 2. Random background events (e.g. breakdown, check-in call)
        this.triggerRandomIncidents(simTime);

        // Notify callbacks
        this.onClockTickCallbacks.forEach(cb => cb(settings.simulationTime));
    },

    checkTripTimeouts(currentSimTime) {
        const trips = LCOS_State.getTrips();
        const settings = LCOS_State.getSystemSettings();
        const thresholdHours = settings.alertTimeThreshold; // e.g. 2 hours

        trips.forEach(trip => {
            if (trip.status === 'IN_TRANSIT' || trip.status === 'DELAYED') {
                const lastUpdate = new Date(trip.lastUpdateTimestamp);
                const diffMs = currentSimTime - lastUpdate;
                const diffHours = diffMs / (1000 * 60 * 60);

                if (diffHours >= thresholdHours) {
                    // Check if we already have an active timeout alert for this trip
                    const existingAlert = LCOS_State.getAlerts().find(
                        a => a.tripId === trip.id && a.type === 'No Update' && a.status === 'Active'
                    );

                    if (!existingAlert) {
                        const driver = LCOS_State.getDrivers().find(d => d.id === trip.driverId);
                        const msg = `ALERT: Trip ${trip.id} (${driver ? driver.name : 'Unknown Driver'}) has not checked in for over ${Math.floor(diffHours)} hours!`;
                        
                        const alert = LCOS_State.addAlert({
                            tripId: trip.id,
                            type: 'No Update',
                            message: msg,
                            severity: 'warning'
                        });

                        this.onAlertTriggeredCallbacks.forEach(cb => cb(alert));
                    }
                }
            }
        });
    },

    triggerRandomIncidents(currentSimTime) {
        // Very small probability per simulated minute to trigger an event
        // We evaluate roughly once per real second. If 1s = 60min, we scale probability.
        const settings = LCOS_State.getSystemSettings();
        const prob = 0.005 * (settings.simulationSpeed / 60); // Base probability adjusted for speed

        if (Math.random() > prob) return;

        const activeTrips = LCOS_State.getTrips().filter(t => t.status === 'IN_TRANSIT');
        if (activeTrips.length === 0) return;

        // Pick a random active trip
        const trip = activeTrips[Math.floor(Math.random() * activeTrips.length)];
        const driver = LCOS_State.getDrivers().find(d => d.id === trip.driverId);
        if (!driver) return;

        const rand = Math.random();
        if (rand < 0.6) {
            // 60% chance: Driver calls in with normal update
            const alert = LCOS_State.addAlert({
                tripId: trip.id,
                type: 'Incoming Call',
                message: `Incoming Check-in Call from Driver ${driver.name} (Trip ${trip.id})`,
                severity: 'info'
            });
            this.onAlertTriggeredCallbacks.forEach(cb => cb(alert));
        } else if (rand < 0.85) {
            // 25% chance: Traffic or breakdown logged
            const isTraffic = Math.random() > 0.4;
            const type = isTraffic ? 'Traffic Jam' : 'Breakdown';
            const location = trip.transitUpdates.length > 0 
                ? trip.transitUpdates[trip.transitUpdates.length - 1].location + ' vicinity'
                : 'National Highway';

            // Change trip status to DELAYED
            trip.status = 'DELAYED';
            trip.transitUpdates.push({
                timestamp: currentSimTime.toISOString(),
                location: location,
                condition: isTraffic ? 'Good' : 'Minor Issue',
                status: 'DELAYED',
                delayReason: type,
                remarks: isTraffic ? 'Heavy vehicular traffic reported.' : 'Engine stalling, inspecting vehicle.'
            });
            trip.lastUpdateTimestamp = currentSimTime.toISOString();

            const alert = LCOS_State.addAlert({
                tripId: trip.id,
                type: type,
                message: `ALERT: Trip ${trip.id} report delay due to ${type} near ${location}`,
                severity: isTraffic ? 'warning' : 'danger'
            });
            
            LCOS_State.save();
            this.onAlertTriggeredCallbacks.forEach(cb => cb(alert));
        } else {
            // 15% chance: No response at all (Unreachable warning)
            const alert = LCOS_State.addAlert({
                tripId: trip.id,
                type: 'Unreachable',
                message: `SYSTEM DETECTED: GPS link simulation heartbeat lost for Trip ${trip.id} (Driver ${driver.name})`,
                severity: 'danger'
            });
            this.onAlertTriggeredCallbacks.forEach(cb => cb(alert));
        }
    },

    // --- Call Escalation Logic (The 3-strike flow) ---
    // Track escalation status for active alerts: { alertId: { attempts: Number, lastAttemptSimTime: String, status: String } }
    escalations: {},

    attemptEscalationCall(alertId) {
        const alert = LCOS_State.getAlerts().find(a => a.id === alertId);
        if (!alert) return { success: false, message: 'Alert not found' };

        const trip = LCOS_State.getTripById(alert.tripId);
        if (!trip) return { success: false, message: 'Trip not found' };

        const driver = LCOS_State.getDrivers().find(d => d.id === trip.driverId);
        if (!driver) return { success: false, message: 'Driver not found' };

        if (!this.escalations[alertId]) {
            this.escalations[alertId] = {
                attempts: 0,
                lastAttemptSimTime: null,
                status: 'Ongoing'
            };
        }

        const esc = this.escalations[alertId];
        const currentSimTimeStr = LCOS_State.getSystemSettings().simulationTime;

        // Check if enough time elapsed since last call (at least 1 simulated hour)
        if (esc.lastAttemptSimTime) {
            const lastCall = new Date(esc.lastAttemptSimTime);
            const currentCall = new Date(currentSimTimeStr);
            const diffHours = (currentCall - lastCall) / (1000 * 60 * 60);
            
            if (diffHours < 0.9) { // Give a tiny buffer for exactly 1 hour
                return {
                    success: false,
                    message: `Cannot call again so soon. Must wait at least 1 hour (simulated) between attempts.`
                };
            }
        }

        esc.attempts += 1;
        esc.lastAttemptSimTime = currentSimTimeStr;

        // Log the outgoing call
        LCOS_State.addCallLog({
            tripId: trip.id,
            type: 'Escalation Call',
            caller: 'Admin Office',
            recipient: `Driver (Attempt ${esc.attempts}/3)`,
            notes: `Called driver ${driver.name} due to active alert: ${alert.message}.`
        });

        // Determine outcome: 40% chance driver answers on attempt 1, 60% on attempt 2, 100% on attempt 3 if normal.
        // If "Unreachable" incident type, driver has a 75% chance of NO RESPONSE on any call.
        const isUnreachableIncident = alert.type === 'Unreachable';
        let answered = false;

        if (!isUnreachableIncident) {
            if (esc.attempts === 1 && Math.random() > 0.5) answered = true;
            else if (esc.attempts === 2 && Math.random() > 0.3) answered = true;
            else if (esc.attempts >= 3) answered = true;
        } else {
            // Heartbeat lost / Unreachable case:
            if (Math.random() > 0.75) answered = true;
        }

        if (answered) {
            esc.status = 'Answered';
            alert.status = 'Resolved';
            
            // Driver answered: update location & status
            trip.status = 'IN_TRANSIT';
            trip.lastUpdateTimestamp = currentSimTimeStr;
            trip.transitUpdates.push({
                timestamp: currentSimTimeStr,
                location: trip.transitUpdates.length > 0 ? trip.transitUpdates[trip.transitUpdates.length - 1].location : 'National Highway',
                condition: 'Good',
                status: 'IN_TRANSIT',
                delayReason: '',
                remarks: 'Driver reached and confirmed safety. Apologized for delay in reporting.'
            });

            LCOS_State.save();
            return {
                success: true,
                answered: true,
                message: `Call Answered by ${driver.name}! Location updated, alert resolved. Status returned to IN_TRANSIT.`
            };
        } else {
            // No answer
            if (esc.attempts >= 3) {
                esc.status = 'Failed';
                alert.status = 'Escalated';
                
                // Issue Warning & Deduct score
                driver.warnings += 1;
                driver.performance = Math.max(0, driver.performance - 15);
                
                let blacklistRecommend = false;
                if (driver.warnings >= 3) {
                    driver.status = 'Suspended';
                    blacklistRecommend = true;
                }

                // Log escalation failure
                LCOS_State.addCallLog({
                    tripId: trip.id,
                    type: 'Escalation Failure',
                    caller: 'System Alert',
                    recipient: 'Admin Office',
                    notes: `3-strike escalation failed. Warning issued to ${driver.name}. Performance score reduced to ${driver.performance}%.`
                });

                LCOS_State.save();

                return {
                    success: true,
                    answered: false,
                    strikesExceeded: true,
                    blacklistRecommend: blacklistRecommend,
                    message: `Attempt ${esc.attempts}/3: No Answer. 3 strikes exceeded! Warning issued. Driver performance score reduced by 15. ${blacklistRecommend ? 'Driver SUSPENDED - Blacklist recommended!' : ''}`
                };
            }

            LCOS_State.save();
            return {
                success: true,
                answered: false,
                message: `Attempt ${esc.attempts}/3: No Answer from driver. Call registered. Try again after 1 simulated hour.`
            };
        }
    },

    registerOnClockTick(cb) {
        this.onClockTickCallbacks.push(cb);
    },

    registerOnAlertTriggered(cb) {
        this.onAlertTriggeredCallbacks.push(cb);
    }
};

// Initialize simulator
LCOS_Sim.init();
window.LCOS_Sim = LCOS_Sim;
