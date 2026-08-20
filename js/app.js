/**
 * Logistics Operations Control System (LCOS) - Main Application Controller
 * Manages UI interactions, form bindings, SPA tab routing, SVG map renders, and simulation hooks.
 */

const app = {
    activeTab: 'dashboard',
    activeConsoleTripId: null,
    selectedInventoryCommodityId: 'COM-RIC',
    selectedDirectorySub: 'drivers',

    init() {
        this.bindEvents();
        this.setupSimulation();
        // Initial setup complete, user logs in via 3D page
        this.showToast('LCOS Central Operations Portal Initialized.', 'info');
    },

    bindEvents() {
        // Tab switching routing
        document.querySelectorAll('.nav-links li').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = item.getAttribute('data-tab');
                this.switchTab(tab);
            });
        });

        // Role switcher clicks
        // Login Card clicks
        document.getElementById('card-login-tracking')?.addEventListener('click', () => {
            this.login('tracking_team');
        });
        document.getElementById('card-login-manager')?.addEventListener('click', () => {
            this.login('branch_manager');
        });
        document.getElementById('card-login-owner')?.addEventListener('click', () => {
            this.login('owner');
        });

        // Logout Button click
        document.getElementById('btn-logout-action')?.addEventListener('click', () => {
            this.logout();
        });

        // Interactive 3D Perspective Card Tilt Effects
        document.querySelectorAll('.login-card').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                // Max rotation is 15 degrees
                const rotateX = ((centerY - y) / centerY) * 15;
                const rotateY = ((x - centerX) / centerX) * 15;
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
            });
            card.style.transition = 'transform 0.1s ease, box-shadow 0.3s ease, border-color 0.3s ease';
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
            });
        });



        // Quick create trip dispatch button
        document.getElementById('btn-quick-trip').addEventListener('click', () => {
            this.openModal('modal-create-trip');
        });
        document.getElementById('btn-create-trip-from-console').addEventListener('click', () => {
            this.openModal('modal-create-trip');
        });

        // Create trip form submission
        document.getElementById('form-create-trip').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCreateTrip();
        });

        // Console trip selector dropdown
        document.getElementById('console-trip-select').addEventListener('change', (e) => {
            this.activeConsoleTripId = e.target.value;
            this.renderOperationsConsole();
        });

        // Manual log call button
        document.getElementById('btn-manual-call-driver').addEventListener('click', () => {
            if (!this.activeConsoleTripId) return;
            const trip = LCOS_State.getTripById(this.activeConsoleTripId);
            if (!trip) return;

            document.getElementById('call-trip-id').value = trip.id;
            document.getElementById('call-trip-ref').value = `${trip.id} - ${trip.vehicleId}`;
            
            // Auto fill category based on status
            const categorySel = document.getElementById('call-category');
            if (trip.status === 'CREATED') categorySel.value = 'Dispatch Confirmation';
            else if (trip.status === 'ARRIVED') categorySel.value = 'Delivery Confirmation';
            else categorySel.value = 'Transit Update';

            this.openModal('modal-log-call');
        });

        // Log call form submission
        document.getElementById('form-log-call').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogCall();
        });

        // Trips table filters & search
        document.getElementById('trip-search').addEventListener('input', () => this.renderTripsTracker());
        document.getElementById('trip-filter-status').addEventListener('change', () => this.renderTripsTracker());

        // Inventory commodity selection dropdown
        document.getElementById('inventory-commodity-select').addEventListener('change', (e) => {
            this.selectedInventoryCommodityId = e.target.value;
            this.renderInventory();
        });

        // Directory subtab toggles
        document.querySelectorAll('.dir-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.dir-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const sub = btn.getAttribute('data-dir-sub');
                this.selectedDirectorySub = sub;

                document.querySelectorAll('.dir-sub-content').forEach(c => c.style.display = 'none');
                document.getElementById(`dir-${sub}`).style.display = 'block';
                this.renderDirectory();
            });
        });

        // Add Driver form submit
        document.getElementById('form-add-driver').addEventListener('submit', (e) => {
            e.preventDefault();
            LCOS_State.addDriver({
                name: document.getElementById('drv-name').value,
                license: document.getElementById('drv-license').value,
                phone: document.getElementById('drv-phone').value,
                experience: Number(document.getElementById('drv-exp').value)
            });
            document.getElementById('form-add-driver').reset();
            this.showToast('New driver registered successfully.', 'success');
            this.renderDirectory();
        });

        // Add Vehicle form submit
        document.getElementById('form-add-vehicle').addEventListener('submit', (e) => {
            e.preventDefault();
            LCOS_State.addVehicle({
                id: document.getElementById('veh-id').value.toUpperCase(),
                type: document.getElementById('veh-type').value,
                capacity: Number(document.getElementById('veh-capacity').value),
                owner: document.getElementById('veh-owner').value
            });
            document.getElementById('form-add-vehicle').reset();
            this.showToast('New vehicle registered successfully.', 'success');
            this.renderDirectory();
        });

        // Add Branch form submit
        document.getElementById('form-add-branch').addEventListener('submit', (e) => {
            e.preventDefault();
            LCOS_State.addBranch({
                name: document.getElementById('br-name').value,
                manager: document.getElementById('br-manager').value,
                phone: document.getElementById('br-phone').value,
                x: Math.floor(Math.random() * 50 + 20), // random coords
                y: Math.floor(Math.random() * 50 + 30)
            });
            document.getElementById('form-add-branch').reset();
            this.showToast('New branch created successfully.', 'success');
            this.renderDirectory();
            this.renderMap();
        });

        // Add Commodity form submit
        document.getElementById('form-add-commodity').addEventListener('submit', (e) => {
            e.preventDefault();
            LCOS_State.addCommodity({
                name: document.getElementById('com-name').value,
                unit: document.getElementById('com-unit').value,
                weight: Number(document.getElementById('com-weight').value),
                value: Number(document.getElementById('com-value').value)
            });
            document.getElementById('form-add-commodity').reset();
            this.showToast('New commodity added to catalogue.', 'success');
            this.renderDirectory();
        });

        // Request resource type change handler
        document.getElementById('req-resource-type').addEventListener('change', (e) => {
            this.renderRequestFields(e.target.value);
        });

        // Submit request form submit
        document.getElementById('form-submit-request').addEventListener('submit', (e) => {
            e.preventDefault();
            const type = document.getElementById('req-resource-type').value;
            let requestData = {};

            if (type === 'Add Driver') {
                requestData = {
                    name: document.getElementById('req-drv-name').value,
                    license: document.getElementById('req-drv-license').value,
                    phone: document.getElementById('req-drv-phone').value,
                    experience: Number(document.getElementById('req-drv-exp').value)
                };
            } else if (type === 'Add Vehicle') {
                requestData = {
                    id: document.getElementById('req-veh-id').value.toUpperCase(),
                    type: document.getElementById('req-veh-type').value,
                    capacity: Number(document.getElementById('req-veh-capacity').value),
                    owner: document.getElementById('req-veh-owner').value
                };
            } else if (type === 'Add Stock') {
                requestData = {
                    branchId: document.getElementById('req-stock-branch').value,
                    commodityId: document.getElementById('req-stock-commodity').value,
                    quantity: Number(document.getElementById('req-stock-qty').value)
                };
            }

            LCOS_State.addManagerRequest(type, requestData);
            this.showToast('Request submitted to Supervisor for approval.', 'success');
            document.getElementById('form-submit-request').reset();
            this.closeModal('modal-request-resource');
            this.renderAll();
        });

        // Inventory action button (Refill Stock)
        document.getElementById('btn-inventory-action').addEventListener('click', () => {
            const role = LCOS_State.getCurrentRole();
            if (role === 'tracking_team') {
                this.openRequestModal('Add Stock');
            } else {
                // Populate Manager Refill Modal select lists
                const brSel = document.getElementById('mas-branch');
                const comSel = document.getElementById('mas-commodity');
                
                brSel.innerHTML = LCOS_State.getBranches().map(b => `<option value="${b.id}">${b.name}</option>`).join('');
                comSel.innerHTML = LCOS_State.getCommodities().map(c => `<option value="${c.id}">${c.name}</option>`).join('');
                
                this.openModal('modal-manager-add-stock');
            }
        });

        // Manager manual stock refill submit
        document.getElementById('form-manager-add-stock').addEventListener('submit', (e) => {
            e.preventDefault();
            const branchId = document.getElementById('mas-branch').value;
            const commodityId = document.getElementById('mas-commodity').value;
            const qty = Number(document.getElementById('mas-quantity').value);

            LCOS_State.addStockDirectly(branchId, commodityId, qty);
            this.showToast('Warehouse stock directly replenished.', 'success');
            document.getElementById('form-manager-add-stock').reset();
            this.closeModal('modal-manager-add-stock');
            this.renderAll();
        });

        // Call logs search & filter
        document.getElementById('call-search').addEventListener('input', () => this.renderCallLogs());
        document.getElementById('call-filter-type').addEventListener('change', () => this.renderCallLogs());

        // Map Timeframe Filter change
        document.getElementById('map-filter-timeframe')?.addEventListener('change', (e) => {
            const wrap = document.getElementById('map-custom-dates-wrap');
            if (wrap) {
                wrap.style.display = e.target.value === 'custom' ? 'inline-flex' : 'none';
            }
            this.updateMapReport();
        });

        // Map Custom dates changes
        document.getElementById('map-date-start')?.addEventListener('change', () => this.updateMapReport());
        document.getElementById('map-date-end')?.addEventListener('change', () => this.updateMapReport());

        // Map Vehicle selection change
        document.getElementById('map-filter-vehicle')?.addEventListener('change', () => {
            this.updateMapHighlights();
        });
    },

    setupSimulation() {
        // Setup real computer clock sync (Simulator is removed)
        const updateClock = () => {
            const date = new Date();
            const options = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true };
            const formatted = date.toLocaleDateString('en-US', options).replace(',', '');
            
            const clockDisplay = document.getElementById('sim-clock-display');
            if (clockDisplay) clockDisplay.textContent = formatted;
            
            // Set the state's simulationTime to the actual real date ISO string
            // so that all dispatches and logs receive real timestamps!
            const settings = LCOS_State.getSystemSettings();
            settings.simulationTime = date.toISOString();
            LCOS_State.save();
        };
        
        updateClock();
        setInterval(updateClock, 1000);
    },

    switchTab(tabId) {
        document.querySelectorAll('.nav-links li').forEach(item => {
            if (item.getAttribute('data-tab') === tabId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        document.getElementById(`tab-${tabId}`).classList.add('active');
        this.activeTab = tabId;

        // Change View Title
        const titles = {
            dashboard: 'Logistics Operations Dashboard',
            operations: 'Central Dispatch Operations Console',
            trips: 'Shipments & Trips Tracker',
            inventory: 'Branch Warehouse Inventory & Stock Levels',
            directory: 'LCOS Resource Directories',
            calllogs: 'Operator Call Conversation Logs'
        };
        document.getElementById('view-title').textContent = titles[tabId] || 'LCOS Portal';

        this.renderActiveTab();
    },

    login(role) {
        LCOS_State.setCurrentRole(role);
        
        const loginPage = document.getElementById('login-page');
        const appContainer = document.getElementById('app-container');
        
        loginPage.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        loginPage.style.opacity = '0';
        loginPage.style.transform = 'scale(1.05)';
        
        setTimeout(() => {
            loginPage.style.display = 'none';
            appContainer.style.display = 'flex';
            appContainer.style.opacity = '0';
            appContainer.style.transition = 'opacity 0.4s ease';
            
            this.renderAll();
            this.renderMap();
            
            setTimeout(() => {
                appContainer.style.opacity = '1';
            }, 50);
            
            const roleName = role === 'owner' ? 'Owner' : role === 'branch_manager' ? 'Branch Manager' : 'Tracking Team';
            this.showToast(`Logged in successfully as ${roleName}.`, 'success');
        }, 400);
    },

    logout() {
        const loginPage = document.getElementById('login-page');
        const appContainer = document.getElementById('app-container');
        
        appContainer.style.transition = 'opacity 0.3s ease';
        appContainer.style.opacity = '0';
        
        setTimeout(() => {
            appContainer.style.display = 'none';
            
            loginPage.style.display = 'flex';
            loginPage.style.opacity = '1';
            loginPage.style.transform = 'scale(1)';
            
            this.activeConsoleTripId = null;
            this.showToast('Logged out of session.', 'info');
        }, 300);
    },

    renderActiveTab() {
        switch (this.activeTab) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'operations':
                this.renderOperationsConsole();
                break;
            case 'trips':
                this.renderTripsTracker();
                break;
            case 'inventory':
                this.renderInventory();
                break;
            case 'directory':
                this.renderDirectory();
                break;
            case 'calllogs':
                this.renderCallLogs();
                break;
        }
    },

    renderAll() {
        const role = LCOS_State.getCurrentRole();
        const quickTripBtn = document.getElementById('btn-quick-trip');
        if (quickTripBtn) {
            quickTripBtn.style.display = role === 'tracking_team' ? 'inline-flex' : 'none';
        }

        const roleIndicator = document.getElementById('active-role-indicator');
        if (roleIndicator) {
            if (role === 'owner') {
                roleIndicator.innerHTML = `<span class="owner-badge">👑 2 Owners (Executive Mode)</span>`;
            } else if (role === 'branch_manager') {
                roleIndicator.innerHTML = `<span class="badge badge-pending" style="padding: 0.35rem 0.75rem; border-radius: 8px;">💼 Branch Manager (Supervisor)</span>`;
            } else {
                roleIndicator.innerHTML = `<span class="badge badge-transit" style="padding: 0.35rem 0.75rem; border-radius: 8px;">📞 Tracking Team (Operator)</span>`;
            }
        }

        this.renderDashboard();
        this.renderOperationsConsole();
        this.renderTripsTracker();
        this.renderInventory();
        this.renderDirectory();
        this.renderCallLogs();
    },

    // --- Tab Rendering Implementations ---

    renderDashboard() {
        // 1. Calculate and update stats
        const trips = LCOS_State.getTrips();
        const alerts = LCOS_State.getAlerts().filter(a => a.status === 'Active');
        
        const inTransitCount = trips.filter(t => t.status === 'IN_TRANSIT').length;
        const delayedCount = trips.filter(t => t.status === 'DELAYED').length;
        const alertsCount = alerts.length;
        
        // Count trips closed today (simulated day = 04 Aug 2026)
        const deliveredToday = trips.filter(t => {
            if (t.status !== 'CLOSED' || !t.deliveryInfo) return false;
            const closedDate = new Date(t.deliveryInfo.closedTimestamp);
            return closedDate.getDate() === 4 && closedDate.getMonth() === 7 && closedDate.getFullYear() === 2026;
        }).length;

        document.getElementById('stat-transit').textContent = inTransitCount;
        document.getElementById('stat-delayed').textContent = delayedCount;
        document.getElementById('stat-alerts').textContent = alertsCount;
        document.getElementById('stat-delivered').textContent = deliveredToday;

        // 2. Active alerts ticker & box
        const alertsBanner = document.getElementById('alerts-banner');
        const ticker = document.getElementById('alerts-ticker-content');
        const alertsFeed = document.getElementById('alerts-feed-content');
        
        if (alertsCount > 0) {
            alertsBanner.style.display = 'flex';
            ticker.innerHTML = alerts.map(a => `<div class="ticker-item">⚠️ ${a.message}</div>`).join('');
            
            alertsFeed.innerHTML = alerts.map(a => {
                let badgeClass = a.severity === 'danger' ? 'badge-delayed' : 'badge-pending';
                let actionBtn = '';
                const role = LCOS_State.getCurrentRole();

                if (role === 'owner') {
                    actionBtn = `<span class="badge badge-draft" style="font-size:0.7rem; padding:0.15rem 0.35rem;">Owner Monitoring</span>`;
                } else if (a.type === 'Incoming Call') {
                    actionBtn = `<button class="btn btn-primary" style="padding:0.25rem 0.5rem; font-size:0.75rem;" onclick="app.answerSimulatedCall('${a.id}')">Answer</button>`;
                } else if (a.type === 'No Update' || a.type === 'Unreachable' || a.type === 'Breakdown') {
                    if (role === 'tracking_team') {
                        if (a.escalated) {
                            actionBtn = `<span class="badge badge-escalated" style="font-size:0.7rem; padding:0.15rem 0.35rem;">Escalated to Mgr</span>`;
                        } else {
                            actionBtn = `<button class="btn btn-warning" style="padding:0.25rem 0.5rem; font-size:0.75rem;" onclick="app.escalateAlertToManager('${a.id}')">Escalate to Manager</button>`;
                        }
                    } else {
                        // Manager view handles action
                        if (a.type === 'Breakdown') {
                            actionBtn = `<button class="btn btn-danger" style="padding:0.25rem 0.5rem; font-size:0.75rem;" onclick="app.resolveBreakdownAlert('${a.id}')">Resolve Breakdown</button>`;
                        } else {
                            actionBtn = `<button class="btn btn-warning" style="padding:0.25rem 0.5rem; font-size:0.75rem;" onclick="app.startEscalationCall('${a.id}')">Call Driver</button>`;
                        }
                    }
                }

                let cardClass = "flex justify-between align-center";
                if (a.escalated) {
                    cardClass += " alert-escalated-card";
                }

                return `
                    <div class="${cardClass}" style="padding:0.5rem; border-radius:6px; background:rgba(239,68,68,0.06); border:1px solid rgba(239,68,68,0.15); margin-bottom:0.25rem;">
                        <div style="font-size:0.8rem; max-width:70%;">
                            <span class="badge ${badgeClass}" style="padding:0.1rem 0.3rem; font-size:0.65rem;">${a.type}</span>
                            ${a.escalated ? `<span class="badge badge-escalated" style="font-size:0.6rem; padding:0 0.2rem; margin-left:0.25rem;">ESCALATED</span>` : ''}
                            <span style="margin-left:0.25rem; font-weight:500;">${a.message}</span>
                        </div>
                        <div class="flex gap-2">
                            ${actionBtn}
                            ${role !== 'owner' ? `<button class="btn btn-secondary" style="padding:0.25rem 0.5rem; font-size:0.75rem;" onclick="app.dismissAlert('${a.id}')">Dismiss</button>` : ''}
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            alertsBanner.style.display = 'none';
            alertsFeed.innerHTML = `<div style="text-align:center; padding:1rem; color:var(--text-muted); font-size:0.85rem;">All systems operational. No active alerts.</div>`;
        }

        // 3. Driver Leaderboard
        LCOS_Charts.renderDriverLeaderboard('driver-leaderboard-container', LCOS_State.getDrivers());

        // 4. Render Charts (Branch Load and Delay distribution)
        this.renderDashboardCharts();

        // 5. Render Requests (Manager view only)
        const reqBox = document.getElementById('manager-requests-box');
        const reqFeed = document.getElementById('requests-feed-content');
        const role = LCOS_State.getCurrentRole();

        if ((role === 'branch_manager' || role === 'owner') && reqBox && reqFeed) {
            reqBox.style.display = 'block';
            const requests = LCOS_State.getRequests();
            if (requests.length === 0) {
                reqFeed.innerHTML = `<div style="text-align:center; padding:1rem; color:var(--text-muted); font-size:0.8rem;">No pending supervisor requests.</div>`;
            } else {
                reqFeed.innerHTML = requests.map(r => {
                    const isApp = r.status === 'Approved';
                    let badgeClass = isApp ? 'badge-request-approved' : 'badge-request-pending';
                    let actionBtn = '';
                    
                    if (!isApp && role === 'branch_manager') {
                        actionBtn = `<button class="btn btn-success" style="padding:0.2rem 0.4rem; font-size:0.7rem;" onclick="app.approveRequest('${r.id}')">Approve</button>`;
                    } else if (!isApp && role === 'owner') {
                        actionBtn = `<span class="badge badge-request-pending" style="font-size:0.65rem; padding:0.15rem 0.3rem;">Pending</span>`;
                    }

                    let desc = '';
                    if (r.type === 'Add Driver') desc = `Driver: ${r.data.name} (License: ${r.data.license})`;
                    else if (r.type === 'Add Vehicle') desc = `Vehicle: ${r.data.id} (${r.data.type})`;
                    else if (r.type === 'Add Stock') desc = `Stock: +${r.data.quantity} units of ${r.data.commodityId} at ${r.data.branchId}`;

                    return `
                        <div class="request-item-card ${isApp ? 'approved' : ''}">
                            <div style="max-width:70%;">
                                <span class="badge ${badgeClass}" style="padding:0.1rem 0.3rem; font-size:0.6rem;">${r.type}</span>
                                <div style="font-weight:600; margin-top:0.15rem; font-size:0.75rem; color:var(--text-primary);">${desc}</div>
                                <div style="font-size:0.65rem; color:var(--text-muted);">${r.id} | Status: ${r.status}</div>
                            </div>
                            <div>
                                ${actionBtn}
                            </div>
                        </div>
                    `;
                }).reverse().join('');
            }
        } else if (reqBox) {
            reqBox.style.display = 'none';
        }

        // 6. Update Map active routes & reports
        this.updateMapReport();
    },

    renderDashboardCharts() {
        const trips = LCOS_State.getTrips();
        const branches = LCOS_State.getBranches();

        // Calculate branch trip volumes
        const branchData = branches.map(br => {
            const sent = trips.filter(t => t.sourceBranchId === br.id).length;
            const received = trips.filter(t => t.destinationBranchId === br.id).length;
            return { branchName: br.name, sent, received };
        }).filter(b => b.sent > 0 || b.received > 0).slice(0, 8); // Top 8 active branches for chart spacing

        LCOS_Charts.renderBranchVolumeChart('branch-chart-container', branchData);

        // Calculate Delay reason distribution
        const delaysCount = {
            'Traffic': 0,
            'Breakdown': 0,
            'Weather': 0,
            'Loading': 0,
            'Other': 0
        };

        trips.forEach(t => {
            t.transitUpdates.forEach(upd => {
                if (upd.status === 'DELAYED' && upd.delayReason) {
                    const reason = upd.delayReason;
                    if (reason.includes('Traffic')) delaysCount['Traffic']++;
                    else if (reason.includes('Breakdown')) delaysCount['Breakdown']++;
                    else if (reason.includes('Weather')) delaysCount['Weather']++;
                    else if (reason.includes('Loading')) delaysCount['Loading']++;
                    else delaysCount['Other']++;
                }
            });
        });

        const delayChartData = [
            { label: 'Traffic Jam', value: delaysCount['Traffic'] },
            { label: 'Breakdown', value: delaysCount['Breakdown'] },
            { label: 'Weather Delay', value: delaysCount['Weather'] },
            { label: 'Loading Issue', value: delaysCount['Loading'] },
            { label: 'Other Details', value: delaysCount['Other'] }
        ];

        LCOS_Charts.renderDelayReasonChart('delay-chart-container', delayChartData);
    },

    renderOperationsConsole() {
        const select = document.getElementById('console-trip-select');
        const trips = LCOS_State.getTrips();
        
        // Prefill dropdown with created and active trips
        const currentVal = select.value;
        select.innerHTML = '<option value="">-- Choose Active Trip --</option>';
        trips.forEach(t => {
            if (t.status !== 'COMPLETED_RETURN') {
                const com = LCOS_State.getCommodities().find(c => c.id === t.commodityId);
                const comName = com ? com.name : 'Goods';
                select.innerHTML += `<option value="${t.id}">${t.id} - ${comName} (${t.quantity} Units) [${t.status}]</option>`;
            }
        });

        // Keep selection if exists and still active
        const tripExists = trips.some(t => t.id === currentVal && t.status !== 'CLOSED');
        if (tripExists) {
            select.value = currentVal;
            this.activeConsoleTripId = currentVal;
        } else if (!this.activeConsoleTripId) {
            document.getElementById('console-no-trip').style.display = 'block';
            document.getElementById('console-active-trip').style.display = 'none';
            return;
        }

        const trip = LCOS_State.getTripById(this.activeConsoleTripId);
        if (!trip || trip.status === 'CLOSED') {
            document.getElementById('console-no-trip').style.display = 'block';
            document.getElementById('console-active-trip').style.display = 'none';
            this.activeConsoleTripId = null;
            return;
        }

        // Trip is selected and active, render Console
        document.getElementById('console-no-trip').style.display = 'none';
        document.getElementById('console-active-trip').style.display = 'block';

        // Set text fields
        const sourceBr = LCOS_State.getBranches().find(b => b.id === trip.sourceBranchId);
        const destBr = LCOS_State.getBranches().find(b => b.id === trip.destinationBranchId);
        document.getElementById('c-trip-id').textContent = trip.id;
        document.getElementById('c-trip-route').textContent = `${sourceBr ? sourceBr.name : 'Unknown'} → ${destBr ? destBr.name : 'Unknown'}`;
        document.getElementById('c-dispatch-id').textContent = `DISP ID: ${trip.dispatchId}`;

        // Map status
        const statusMap = {
            CREATED: 'Draft Created',
            DISPATCH_APPROVED: 'Dispatch Approved',
            DRIVER_CALLED: 'Driver Called',
            DRIVER_CONFIRMED: 'Driver Confirmed',
            IN_TRANSIT: 'In Transit',
            DELAYED: 'Delayed Stop',
            ARRIVED: 'Arrived Dest',
            DELIVERY_CONFIRMED: 'Delivery Confirmed',
            CLOSED: 'Closed (Receipted)',
            RETURNING: 'Returning Leg',
            COMPLETED_RETURN: 'Returned & Released'
        };
        const statusEl = document.getElementById('c-trip-status');
        statusEl.textContent = statusMap[trip.status] || trip.status;
        statusEl.className = 'badge';
        if (trip.status === 'CREATED') statusEl.classList.add('badge-draft');
        else if (trip.status === 'IN_TRANSIT') statusEl.classList.add('badge-transit');
        else if (trip.status === 'DELAYED') statusEl.classList.add('badge-delayed');
        else if (trip.status === 'ARRIVED' || trip.status === 'DELIVERY_CONFIRMED') statusEl.classList.add('badge-pending');
        else if (trip.status === 'CLOSED') statusEl.classList.add('badge-success');
        else if (trip.status === 'RETURNING') statusEl.classList.add('badge-transit');
        else if (trip.status === 'COMPLETED_RETURN') statusEl.classList.add('badge-success');

        // Set Details Box
        const comObj = LCOS_State.getCommodities().find(c => c.id === trip.commodityId);
        document.getElementById('c-detail-commodity').textContent = `${comObj ? comObj.name : 'Commodity'} (${trip.quantity} ${comObj ? comObj.unit : 'Units'})`;
        document.getElementById('c-detail-vehicle').textContent = trip.vehicleId;
        
        const drvObj = LCOS_State.getDrivers().find(d => d.id === trip.driverId);
        document.getElementById('c-detail-driver').textContent = drvObj ? `${drvObj.name} (${drvObj.phone})` : 'None';
        
        const hlpObj = LCOS_State.getHelpers().find(h => h.id === trip.helperId);
        document.getElementById('c-detail-helper').textContent = hlpObj ? `${hlpObj.name} (${hlpObj.role})` : 'No Helper Assigned';

        // Add creator ID
        const creatorEl = document.getElementById('c-detail-creator');
        if (creatorEl) creatorEl.textContent = trip.createdBy || 'Pre-seeded Default';

        // Set Timings
        const formatDate = (isoStr) => {
            const date = new Date(isoStr);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + date.toLocaleDateString([], { day: '2-digit', month: 'short' });
        };
        document.getElementById('c-detail-dispatch-date').textContent = formatDate(trip.dispatchDate);
        document.getElementById('c-detail-eta').textContent = formatDate(trip.expectedDeliveryDate);

        // 12-Step Progress Stepper
        this.renderTimelineStepper(trip);

        // Logs
        const logsContainer = document.getElementById('c-transit-logs');
        if (trip.transitUpdates.length === 0) {
            logsContainer.innerHTML = `<div style="font-size:0.8rem; color:var(--text-muted); text-align:center; padding:1rem;">No status updates logged yet.</div>`;
        } else {
            logsContainer.innerHTML = trip.transitUpdates.map(u => {
                const isD = u.status === 'DELAYED';
                return `
                    <div style="font-size:0.8rem; border-left: 2px solid ${isD ? 'var(--color-danger)' : 'var(--color-transit)'}; padding-left: 0.5rem; margin-bottom: 0.25rem;">
                        <span style="color:var(--text-muted); font-size:0.7rem; font-family:monospace;">[${formatDate(u.timestamp)}]</span>
                        <strong style="color:${isD ? 'var(--color-warning)' : 'var(--color-transit)'};">${u.location}</strong>: 
                        <span>${u.remarks}</span>
                        ${u.operatorId ? `<span class="badge badge-draft" style="font-size:0.65rem; padding:0.05rem 0.25rem; margin-left:0.25rem; background:rgba(99,102,241,0.15); border:1px solid rgba(99,102,241,0.25);">${u.operatorId}</span>` : ''}
                        ${u.delayReason ? `<span class="badge badge-delayed" style="font-size:0.6rem; padding:0 0.25rem; margin-left:0.25rem;">${u.delayReason}</span>` : ''}
                    </div>
                `;
            }).reverse().join('');
        }

        // Render Action Console Area based on current trip status
        this.renderActionConsoleArea(trip);
    },

    renderTimelineStepper(trip) {
        const stepper = document.getElementById('timeline-stepper-console');
        const progressBar = document.createElement('div');
        progressBar.className = 'timeline-progress-bar';
        
        // Clear stepper
        stepper.innerHTML = '';
        stepper.appendChild(progressBar);

        // Let's define the 12 key operational stages
        const stages = [
            { key: 'CREATED', label: '1. Created' },
            { key: 'DISPATCH_APPROVED', label: '2. Approved' },
            { key: 'DRIVER_CALLED', label: '3. Called' },
            { key: 'DRIVER_CONFIRMED', label: '4. Confirmed' },
            { key: 'JOURNEY_STARTED', label: '5. Started' },
            { key: 'IN_TRANSIT', label: '6. In Transit' },
            { key: 'DELAY_STOP', label: '7. Delay' },
            { key: 'ARRIVED', label: '8. Reached' },
            { key: 'DELIVERY_CONFIRMED', label: '9. Confirm' },
            { key: 'CLOSED', label: '10. Closed Leg' },
            { key: 'RETURNING', label: '11. Returning' },
            { key: 'COMPLETED_RETURN', label: '12. Returned' }
        ];

        // Map trip status to active index
        let activeIdx = 0;
        if (trip.status === 'CREATED') activeIdx = 0;
        else if (trip.status === 'DISPATCH_APPROVED') activeIdx = 1;
        else if (trip.status === 'DRIVER_CALLED') activeIdx = 2;
        else if (trip.status === 'DRIVER_CONFIRMED') activeIdx = 3;
        else if (trip.status === 'IN_TRANSIT') {
            // If has updates, it is in step 6 (In Transit), else step 5 (Journey Started)
            activeIdx = trip.transitUpdates.length > 1 ? 5 : 4;
        }
        else if (trip.status === 'DELAYED') {
            activeIdx = 6; // Delay Monitor
        }
        else if (trip.status === 'ARRIVED') activeIdx = 7;
        else if (trip.status === 'DELIVERY_CONFIRMED') activeIdx = 8;
        else if (trip.status === 'CLOSED') activeIdx = 9;
        else if (trip.status === 'RETURNING') activeIdx = 10;
        else if (trip.status === 'COMPLETED_RETURN') activeIdx = 11;

        // Calculate progress line width percentage
        const progressWidth = (activeIdx / (stages.length - 1)) * 100;
        progressBar.style.width = `${progressWidth}%`;

        stages.forEach((stg, idx) => {
            const node = document.createElement('div');
            node.className = 'step-node';
            
            if (idx < activeIdx) {
                node.classList.add('completed');
            } else if (idx === activeIdx) {
                // Highlight delays in red/warning colors
                if (trip.status === 'DELAYED' && idx === 6) {
                    node.classList.add('warning');
                } else {
                    node.classList.add('active');
                }
            }

            node.innerHTML = `
                <div class="step-circle">${idx < activeIdx ? '✓' : idx + 1}</div>
                <div class="step-label">${stg.label}</div>
            `;
            
            stepper.appendChild(node);
        });
    },

    renderActionConsoleArea(trip) {
        const container = document.getElementById('console-action-area');
        container.innerHTML = '';

        const role = LCOS_State.getCurrentRole();
        
        let empIdHTML = '';
        if (role === 'tracking_team') {
            empIdHTML = `
                <div class="form-group margin-bottom-1" style="border-bottom:1px dashed var(--border-glass); padding-bottom:0.75rem; margin-bottom: 0.75rem;">
                    <label class="form-label" style="font-weight:600; color:var(--color-primary); font-size:0.75rem; margin-bottom:0.25rem;">Operator Employee ID (Emp ID) <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" id="op-emp-id" placeholder="e.g. EMP-101" required value="${this.operatorEmpId || ''}" oninput="app.operatorEmpId = this.value" style="background:rgba(0,0,0,0.35); font-size:0.75rem; padding:0.25rem 0.5rem; height:auto;">
                </div>
            `;
        }

        if (trip.status === 'CREATED') {
            // Stage 1: Created (Needs Dispatch checklist approval)
            const role = LCOS_State.getCurrentRole();
            const checklistComplete = this.isChecklistComplete(trip.checklists.dispatch);
            
            let btnText = 'Approve Dispatch & Generate Dispatch ID';
            let btnDisabled = !checklistComplete;
            let helpText = '';

            if (role === 'branch_manager') {
                btnText = 'View Only: Approved by Tracking Team';
                btnDisabled = true;
                helpText = `<p style="font-size:0.75rem; color:var(--color-warning); font-weight:600; margin-top:0.5rem; text-align:center;">⚠️ Supervisors monitor dispatches. Day-to-day operations checklists are approved by the Tracking Team.</p>`;
            }

            const simTime = new Date(LCOS_State.getSystemSettings().simulationTime);
            const schedTime = new Date(trip.dispatchDate);
            // Require a late dispatch reason only if the delay is more than 15 minutes (grace period)
            const isLate = (simTime.getTime() - schedTime.getTime()) > (15 * 60 * 1000);
            
            let lateRow = '';
            if (isLate && role === 'tracking_team') {
                lateRow = `
                    <div class="form-group" style="margin-top:0.75rem;" id="op-late-dispatch-row">
                        <label class="form-label" style="color:#ef4444; font-weight:600; margin-bottom:0.25rem;">⚠️ Reason for Late Dispatch (Required)</label>
                        <select class="form-control" id="op-late-reason" required>
                            <option value="">-- Select Delay Cause --</option>
                            <option value="Warehouse Loading Delay">Warehouse Cargo Loading Delay</option>
                            <option value="Driver/Helper Check-in Delay">Driver / Helper Check-in Delay</option>
                            <option value="Lorry Maintenance Inspection">Lorry Maintenance / Inspection Delay</option>
                            <option value="Permit Documentation Issue">Permit / Transit Documentation Delay</option>
                            <option value="Bad Local Weather">Bad Local Weather</option>
                        </select>
                    </div>
                `;
            }

            container.innerHTML = empIdHTML + `
                <h5 style="margin-bottom:0.75rem; font-size:0.95rem;">Phase 2: Dispatch Approval Checklist</h5>
                <p style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:0.75rem;">
                    Call Origin Branch Manager <strong>(${LCOS_State.getBranches().find(b => b.id === trip.sourceBranchId).manager})</strong> to verify the cargo loading:
                </p>
                <div style="display:flex; flex-direction:column; gap:0.5rem; margin-bottom:1rem;">
                    <div class="checklist-item ${trip.checklists.dispatch.loaded ? 'checked' : ''}" onclick="app.toggleChecklist('dispatch', 'loaded')">
                        <div class="checkbox-custom"></div>
                        <div class="checklist-label">Cargo loaded correctly in truck</div>
                    </div>
                    <div class="checklist-item ${trip.checklists.dispatch.verified ? 'checked' : ''}" onclick="app.toggleChecklist('dispatch', 'verified')">
                        <div class="checkbox-custom"></div>
                        <div class="checklist-label">Dispatched stock quantity verified</div>
                    </div>
                    <div class="checklist-item ${trip.checklists.dispatch.vehicleReady ? 'checked' : ''}" onclick="app.toggleChecklist('dispatch', 'vehicleReady')">
                        <div class="checkbox-custom"></div>
                        <div class="checklist-label">Vehicle fitness inspection complete</div>
                    </div>
                    <div class="checklist-item ${trip.checklists.dispatch.driverAvailable ? 'checked' : ''}" onclick="app.toggleChecklist('dispatch', 'driverAvailable')">
                        <div class="checkbox-custom"></div>
                        <div class="checklist-label">Driver briefing & licenses validated</div>
                    </div>
                </div>
                ${lateRow}
                <button class="btn btn-success w-100" id="btn-submit-dispatch" ${btnDisabled ? 'disabled' : ''} style="margin-top:0.75rem;">
                    ${btnText}
                </button>
                ${helpText}
            `;

            document.getElementById('btn-submit-dispatch')?.addEventListener('click', () => {
                const empId = this.getConsoleEmpId();
                if (!empId) return;

                if (isLate) {
                    const reason = document.getElementById('op-late-reason').value;
                    if (!reason) {
                        this.showToast('Please select a reason for late dispatch.', 'warning');
                        return;
                    }
                    trip.lateDispatchReason = reason;
                }

                const simTime = LCOS_State.getSystemSettings().simulationTime;
                trip.transitUpdates.push({
                    timestamp: simTime,
                    location: 'Origin Branch',
                    condition: 'Good',
                    status: 'DISPATCH_APPROVED',
                    delayReason: '',
                    remarks: `Dispatch checklist approved. ${isLate ? 'DELAYED DISPATCH REASON: ' + trip.lateDispatchReason : ''}`,
                    operatorId: empId
                });
                trip.lastUpdateTimestamp = simTime;

                LCOS_State.updateTripStatus(trip.id, 'DISPATCH_APPROVED');
                
                // Add Call Log
                LCOS_State.addCallLog({
                    tripId: trip.id,
                    type: 'Dispatch Confirmation',
                    caller: 'Admin Office',
                    recipient: `${LCOS_State.getBranches().find(b => b.id === trip.sourceBranchId).name} Manager`,
                    notes: `Verified checklists. Dispatch approved. Operator: ${empId}. ${isLate ? 'DELAYED DISPATCH REASON: ' + trip.lateDispatchReason : ''}`
                });

                this.showToast('Trip Dispatch Approved. Status updated.', 'success');
                this.renderAll();
            });
        }
        else if (trip.status === 'DISPATCH_APPROVED') {
            // Stage 2: Approved, Needs to call driver
            const drv = LCOS_State.getDrivers().find(d => d.id === trip.driverId);
            const role = LCOS_State.getCurrentRole();
            const btnDisabled = role === 'branch_manager';
            const helpText = btnDisabled ? `<p style="font-size:0.75rem; color:var(--color-warning); font-weight:600; margin-top:0.5rem; text-align:center;">⚠️ View Only: Driver briefings are logged by the Tracking Team.</p>` : '';

            container.innerHTML = empIdHTML + `
                <h5 style="margin-bottom:0.75rem; font-size:0.95rem;">Phase 3: Call Assigned Driver</h5>
                <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:1rem;">
                    Call the driver <strong>${drv ? drv.name : 'Unknown'}</strong> at <strong>${drv ? drv.phone : '--'}</strong> to inform them of trip schedule, routes, and expected checkpoints.
                </p>
                <button class="btn btn-primary w-100" id="btn-call-driver-brief" ${btnDisabled ? 'disabled' : ''}>
                    📞 Log Outgoing Briefing Call
                </button>
                ${helpText}
            `;

            if (!btnDisabled) {
                document.getElementById('btn-call-driver-brief').addEventListener('click', () => {
                    const empId = this.getConsoleEmpId();
                    if (!empId) return;

                    const simTime = LCOS_State.getSystemSettings().simulationTime;
                    trip.transitUpdates.push({
                        timestamp: simTime,
                        location: 'Origin Branch',
                        condition: 'Good',
                        status: 'DRIVER_CALLED',
                        delayReason: '',
                        remarks: `Briefed driver on route parameters.`,
                        operatorId: empId
                    });
                    trip.lastUpdateTimestamp = simTime;

                    LCOS_State.updateTripStatus(trip.id, 'DRIVER_CALLED');
                    LCOS_State.addCallLog({
                        tripId: trip.id,
                        type: 'Transit Update',
                        caller: 'Admin Office',
                        recipient: `Driver (${drv ? drv.name : ''})`,
                        notes: `Briefed driver on route parameters. Operator: ${empId}.`
                    });
                    this.showToast('Driver briefed. Status: DRIVER CALLED.', 'info');
                    this.renderAll();
                });
            }
        }
        else if (trip.status === 'DRIVER_CALLED') {
            // Stage 3: Driver Called, waiting for confirmation call
            const drv = LCOS_State.getDrivers().find(d => d.id === trip.driverId);
            const role = LCOS_State.getCurrentRole();
            const btnDisabled = role === 'branch_manager';
            const helpText = btnDisabled ? `<p style="font-size:0.75rem; color:var(--color-warning); font-weight:600; margin-top:0.5rem; text-align:center;">⚠️ View Only: Driver confirmations are logged by the Tracking Team.</p>` : '';

            container.innerHTML = empIdHTML + `
                <h5 style="margin-bottom:0.75rem; font-size:0.95rem;">Phase 4: Confirm Driver Readiness</h5>
                <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:1rem;">
                    Driver must call back once they inspect the loaded vehicle and verify everything is secure.
                </p>
                <button class="btn btn-primary w-100" id="btn-confirm-readiness" ${btnDisabled ? 'disabled' : ''}>
                    📞 Log Driver Confirmation Call
                </button>
                ${helpText}
            `;

            if (!btnDisabled) {
                document.getElementById('btn-confirm-readiness').addEventListener('click', () => {
                    const empId = this.getConsoleEmpId();
                    if (!empId) return;

                    const simTime = LCOS_State.getSystemSettings().simulationTime;
                    trip.transitUpdates.push({
                        timestamp: simTime,
                        location: 'Origin Branch',
                        condition: 'Good',
                        status: 'DRIVER_CONFIRMED',
                        delayReason: '',
                        remarks: `Driver confirmed vehicle inspection completed. Ready to start.`,
                        operatorId: empId
                    });
                    trip.lastUpdateTimestamp = simTime;

                    LCOS_State.updateTripStatus(trip.id, 'DRIVER_CONFIRMED');
                    LCOS_State.addCallLog({
                        tripId: trip.id,
                        type: 'Transit Update',
                        caller: `Driver (${drv ? drv.name : ''})`,
                        recipient: 'Admin Office',
                        notes: `Driver confirmed vehicle inspection completed. Operator: ${empId}.`
                    });
                    this.showToast('Driver ready confirmed. Status: DRIVER CONFIRMED.', 'success');
                    this.renderAll();
                });
            }
        }
        else if (trip.status === 'DRIVER_CONFIRMED') {
            // Stage 4: Ready, waiting to start journey
            const role = LCOS_State.getCurrentRole();
            const btnDisabled = role === 'branch_manager';
            const helpText = btnDisabled ? `<p style="font-size:0.75rem; color:var(--color-warning); font-weight:600; margin-top:0.5rem; text-align:center;">⚠️ View Only: Departures are logged by the Tracking Team.</p>` : '';

            container.innerHTML = empIdHTML + `
                <h5 style="margin-bottom:0.75rem; font-size:0.95rem;">Phase 5: Record Vehicle Start</h5>
                <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:1rem;">
                    Driver calls as the wheels spin and they leave the origin warehouse gates.
                </p>
                <button class="btn btn-success w-100" id="btn-start-journey" ${btnDisabled ? 'disabled' : ''}>
                    🚚 Log Vehicle Started Call
                </button>
                ${helpText}
            `;

            if (!btnDisabled) {
                document.getElementById('btn-start-journey').addEventListener('click', () => {
                    const empId = this.getConsoleEmpId();
                    if (!empId) return;

                    const simTime = LCOS_State.getSystemSettings().simulationTime;
                    LCOS_State.updateTripStatus(trip.id, 'IN_TRANSIT');
                    trip.transitUpdates.push({
                        timestamp: simTime,
                        location: 'Origin Branch Gates',
                        condition: 'Good',
                        status: 'IN_TRANSIT',
                        delayReason: '',
                        remarks: 'Journey commenced. Vehicle loaded and moving.',
                        operatorId: empId
                    });
                    trip.lastUpdateTimestamp = simTime;
                    LCOS_State.save();

                    LCOS_State.addCallLog({
                        tripId: trip.id,
                        type: 'Transit Update',
                        caller: 'Driver',
                        recipient: 'Admin Office',
                        notes: `Driver called. Confirmed departure from origin. Operator: ${empId}.`
                    });

                    this.showToast('Journey started. Status changed to IN TRANSIT.', 'success');
                    this.renderAll();
                });
            }
        }
        else if (trip.status === 'IN_TRANSIT' || trip.status === 'DELAYED') {
            // Check if there is an active unreachable alert for this trip
            const alert = LCOS_State.getAlerts().find(
                a => a.tripId === trip.id && a.status === 'Active' && (a.type === 'No Update' || a.type === 'Unreachable' || a.type === 'Breakdown')
            );

            const role = LCOS_State.getCurrentRole();

            if (alert && (alert.type === 'No Update' || alert.type === 'Unreachable')) {
                // If there's an active unreachable alert, show escalation console
                const esc = LCOS_Sim.escalations[alert.id] || { attempts: 0 };
                const drv = LCOS_State.getDrivers().find(d => d.id === trip.driverId);
                
                if (alert.escalated && role === 'tracking_team') {
                    container.innerHTML = `
                        <h5 style="margin-bottom:0.5rem; font-size:0.95rem;" class="text-warning">⚠️ Incident Escalated</h5>
                        <div style="font-size:0.75rem; background:rgba(245,158,11,0.06); padding:0.5rem; border-radius:6px; border:1px solid rgba(245,158,11,0.2); margin-bottom:0.75rem; text-align:center;">
                            <strong>AWAITING MANAGER ACTION:</strong> Unresponsive driver alert escalated to Branch Manager at ${new Date(alert.escalatedTimestamp).toLocaleTimeString()}.
                        </div>
                        <p style="font-size:0.8rem; color:var(--text-secondary); text-align:center;">
                            Please wait for the Branch Manager to execute the call escalation or override the driver warning.
                        </p>
                    `;
                } else {
                    let escalateBtn = '';
                    if (!alert.escalated && role === 'tracking_team') {
                        escalateBtn = `<button class="btn btn-warning w-100" style="margin-top:0.5rem;" onclick="app.escalateAlertToManager('${alert.id}')">
                            🚨 Escalate to Branch Manager
                        </button>`;
                    }

                    container.innerHTML = empIdHTML + `
                        <h5 style="margin-bottom:0.5rem; font-size:0.95rem;" class="text-danger">⚠️ Call Escalation Wizard ${alert.escalated ? '(Escalated)' : ''}</h5>
                        <div style="font-size:0.75rem; background:rgba(239,68,68,0.06); padding:0.5rem; border-radius:6px; border:1px solid rgba(239,68,68,0.2); margin-bottom:0.75rem;">
                            <strong>ALERT:</strong> Unresponsive driver. Strike ${esc.attempts}/3.
                        </div>
                        <p style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:0.75rem;">
                            Log outbound call to driver <strong>${drv ? drv.name : 'Unknown'} (${drv ? drv.phone : '--'})</strong>:
                        </p>
                        <div style="display:flex; flex-direction:column; gap:0.5rem; margin-bottom:1rem;">
                            <button class="btn btn-danger w-100" id="btn-escalate-call">
                                📞 Execute Call Attempt ${esc.attempts + 1}
                            </button>
                            ${escalateBtn}
                        </div>
                        <p style="font-size:0.65rem; color:var(--text-muted);">*Must wait at least 1 simulated hour between attempts.</p>
                    `;

                    document.getElementById('btn-escalate-call').addEventListener('click', () => {
                        const empId = this.getConsoleEmpId();
                        if (!empId) return;

                        const result = LCOS_Sim.attemptEscalationCall(alert.id);
                        if (result.answered) {
                            // If they answered, register operator ID in logs
                            const lastLog = LCOS_State.getCallLogs().filter(c => c.tripId === trip.id).pop();
                            if (lastLog) {
                                lastLog.notes += ` Operator: ${empId}.`;
                            }
                        }
                        this.showToast(result.message, result.answered ? 'success' : 'danger');
                        this.renderAll();
                    });
                }
            } else if (alert && alert.type === 'Breakdown') {
                // If it is a breakdown alert
                if (alert.escalated && role === 'tracking_team') {
                    container.innerHTML = `
                        <h5 style="margin-bottom:0.5rem; font-size:0.95rem;" class="text-warning">⚠️ Incident Escalated</h5>
                        <div style="font-size:0.75rem; background:rgba(245,158,11,0.06); padding:0.5rem; border-radius:6px; border:1px solid rgba(245,158,11,0.2); margin-bottom:0.75rem; text-align:center;">
                            <strong>AWAITING MANAGER RESOLUTION:</strong> Breakdown escalated to Branch Manager.
                        </div>
                        <p style="font-size:0.8rem; color:var(--text-secondary); text-align:center;">
                            The manager is currently coordinating vehicle diagnostics or dispatching a helper mechanic.
                        </p>
                    `;
                } else {
                    let managerAction = '';
                    if (role === 'branch_manager') {
                        managerAction = `
                            <button class="btn btn-danger w-100" id="btn-resolve-breakdown-console">
                                Resolve Breakdown & Resume Transit
                            </button>
                        `;
                    } else {
                        managerAction = `
                            <button class="btn btn-warning w-100" onclick="app.escalateAlertToManager('${alert.id}')">
                                🚨 Escalate Breakdown to Manager
                            </button>
                        `;
                    }

                    container.innerHTML = `
                        <h5 style="margin-bottom:0.5rem; font-size:0.95rem;" class="text-danger">⚠️ Vehicle Breakdown Alert</h5>
                        <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:1rem;">
                            Truck reported a mechanical breakdown. Actions required to resolve and clear alert:
                        </p>
                        ${managerAction}
                    `;

                    document.getElementById('btn-resolve-breakdown-console')?.addEventListener('click', () => {
                        this.resolveBreakdownAlert(alert.id);
                    });
                }
            } 
            else {
                if (role === 'branch_manager') {
                    container.innerHTML = `
                        <h5 style="margin-bottom:0.75rem; font-size:0.95rem;">Log Regular Transit Check-in</h5>
                        <p style="font-size:0.75rem; color:var(--text-secondary); text-align:center; padding:1rem; border:1px dashed var(--border-glass); border-radius:8px;">
                            ⚠️ View Only: Regular check-in calls are logged by the Tracking Team.
                        </p>
                    `;
                } else {
                    // Normal In Transit logging form
                    const drv = LCOS_State.getDrivers().find(d => d.id === trip.driverId);
                    container.innerHTML = empIdHTML + `
                        <h5 style="margin-bottom:0.75rem; font-size:0.95rem;">Log Regular Transit Check-in</h5>
                        <div class="form-group">
                            <label class="form-label">Current Highway Location</label>
                            <input type="text" class="form-control" id="op-log-loc" placeholder="e.g. Trichy Bypass, NH-38" required>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Vehicle Condition</label>
                                <select class="form-control" id="op-log-cond">
                                    <option value="Good">Good (Running)</option>
                                    <option value="Minor Issue">Minor Issue</option>
                                    <option value="Need Assistance">Critical Assist</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Check-in Status</label>
                                <select class="form-control" id="op-log-status">
                                    <option value="IN_TRANSIT">In Transit</option>
                                    <option value="DELAYED">Delayed</option>
                                    <option value="ARRIVED">Arrived Destination</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group" id="op-delay-row" style="display:none;">
                            <label class="form-label">Delay Reason</label>
                            <select class="form-control" id="op-log-delay">
                                <option value="">-- Select Reason --</option>
                                <option value="Traffic">Traffic Congestion</option>
                                <option value="Breakdown">Breakdown</option>
                                <option value="Weather">Weather Block</option>
                                <option value="Loading">Loading/Weight Stop</option>
                                <option value="Other">Other Reason</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Operator Notes</label>
                            <input type="text" class="form-control" id="op-log-notes" placeholder="Remarks from call..." required>
                        </div>
                        <button class="btn btn-primary w-100" id="btn-save-transit-call">
                            Log Check-in Call & Update Location
                        </button>
                    `;

                    // Handle delay drop-down display toggle
                    document.getElementById('op-log-status').addEventListener('change', (e) => {
                        const dRow = document.getElementById('op-delay-row');
                        if (e.target.value === 'DELAYED') {
                            dRow.style.display = 'block';
                        } else {
                            dRow.style.display = 'none';
                        }
                    });

                    document.getElementById('btn-save-transit-call').addEventListener('click', () => {
                        const empId = this.getConsoleEmpId();
                        if (!empId) return;

                        const loc = document.getElementById('op-log-loc').value;
                        const cond = document.getElementById('op-log-cond').value;
                        const status = document.getElementById('op-log-status').value;
                        const notes = document.getElementById('op-log-notes').value;
                        const delayReason = document.getElementById('op-log-delay').value;

                        if (!loc || !notes) {
                            this.showToast('Please fill in current location and notes.', 'warning');
                            return;
                        }

                        const simTime = LCOS_State.getSystemSettings().simulationTime;
                        
                        // Update Trip
                        trip.status = status;
                        trip.transitUpdates.push({
                            timestamp: simTime,
                            location: loc,
                            condition: cond,
                            status: status,
                            delayReason: status === 'DELAYED' ? delayReason : '',
                            remarks: notes,
                            operatorId: empId
                        });
                        trip.lastUpdateTimestamp = simTime;

                        // Log Call
                        LCOS_State.addCallLog({
                            tripId: trip.id,
                            type: status === 'ARRIVED' ? 'Arrival Update' : status === 'DELAYED' ? 'Delay Check' : 'Transit Update',
                            caller: `Driver (${drv ? drv.name : ''})`,
                            recipient: 'Admin Office',
                            notes: `Location: ${loc}. Status: ${status}. Condition: ${cond}. Operator: ${empId}. Notes: ${notes}`
                        });

                        // Resolve "No Update" alerts if any
                        const activeAlerts = LCOS_State.getAlerts().filter(a => a.tripId === trip.id && a.status === 'Active');
                        activeAlerts.forEach(alt => LCOS_State.resolveAlert(alt.id));

                        LCOS_State.save();
                        this.showToast(`Transit update logged. Location updated to ${loc}.`, 'success');
                        this.renderAll();
                    });
                }
            }
        }
        else if (trip.status === 'ARRIVED') {
            const manager = LCOS_State.getBranches().find(b => b.id === trip.destinationBranchId).manager;
            const role = LCOS_State.getCurrentRole();
            const checklistComplete = this.isChecklistComplete(trip.checklists.delivery);

            let btnText = 'Log Digital Receipt & Close Trip';
            let btnDisabled = !checklistComplete;
            let helpText = '';

            if (role === 'branch_manager' || role === 'owner') {
                btnText = role === 'owner' ? 'Owner View: Reached Destination' : 'View Only: Approved by Tracking Team';
                btnDisabled = true;
                helpText = `<p style="font-size:0.75rem; color:var(--color-warning); font-weight:600; margin-top:0.5rem; text-align:center;">⚠️ View Only: Day-to-day unloading confirmations are completed by the Tracking Team.</p>`;
            }

            container.innerHTML = empIdHTML + `
                <h5 style="margin-bottom:0.75rem; font-size:0.95rem;">Phase 6: Delivery Confirmation</h5>
                <p style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:0.75rem;">
                    Call Destination Branch Manager <strong>(${manager})</strong> to confirm unloading statistics:
                </p>
                <div style="display:flex; flex-direction:column; gap:0.5rem; margin-bottom:0.75rem;">
                    <div class="checklist-item ${trip.checklists.delivery.quantityMatches ? 'checked' : ''}" onclick="app.toggleChecklist('delivery', 'quantityMatches')">
                        <div class="checkbox-custom"></div>
                        <div class="checklist-label">Quantity unloaded and verified</div>
                    </div>
                    <div class="checklist-item ${trip.checklists.delivery.damagesChecked ? 'checked' : ''}" onclick="app.toggleChecklist('delivery', 'damagesChecked')">
                        <div class="checkbox-custom"></div>
                        <div class="checklist-label">Damage assessment completed</div>
                    </div>
                    <div class="checklist-item ${trip.checklists.delivery.missingChecked ? 'checked' : ''}" onclick="app.toggleChecklist('delivery', 'missingChecked')">
                        <div class="checkbox-custom"></div>
                        <div class="checklist-label">Missing items checked & documented</div>
                    </div>
                    <div class="checklist-item ${trip.checklists.delivery.conditionOk ? 'checked' : ''}" onclick="app.toggleChecklist('delivery', 'conditionOk')">
                        <div class="checkbox-custom"></div>
                        <div class="checklist-label">Physical load quality verified</div>
                    </div>
                </div>
 
                <div class="form-row margin-bottom-1">
                    <div class="form-group" style="margin-bottom:0;">
                        <label class="form-label" style="margin-bottom:0.25rem;">Received Qty</label>
                        <input type="number" class="form-control" id="dl-qty" value="${trip.quantity}" max="${trip.quantity}">
                    </div>
                    <div class="form-group" style="margin-bottom:0;">
                        <label class="form-label" style="margin-bottom:0.25rem;">Damaged Qty</label>
                        <input type="number" class="form-control" id="dl-damages" value="0">
                    </div>
                </div>
                <div class="form-row margin-bottom-1">
                    <div class="form-group" style="margin-bottom:0;">
                        <label class="form-label" style="margin-bottom:0.25rem;">Missing Items</label>
                        <input type="number" class="form-control" id="dl-missing" value="0">
                    </div>
                    <div class="form-group" style="margin-bottom:0;">
                        <label class="form-label" style="margin-bottom:0.25rem;">Cargo Rating</label>
                        <select class="form-control" id="dl-rating">
                            <option value="Good">Good (Perfect)</option>
                            <option value="Fair">Fair (Slight wear)</option>
                            <option value="Poor">Poor (Damaged)</option>
                        </select>
                    </div>
                </div>
 
                <button class="btn btn-success w-100" id="btn-save-delivery" ${btnDisabled ? 'disabled' : ''}>
                    ${btnText}
                </button>
                ${helpText}
            `;

            document.getElementById('btn-save-delivery')?.addEventListener('click', () => {
                const empId = this.getConsoleEmpId();
                if (!empId) return;

                const receivedVal = Number(document.getElementById('dl-qty').value);
                const damagesVal = Number(document.getElementById('dl-damages').value);
                const missingVal = Number(document.getElementById('dl-missing').value);
                const ratingVal = document.getElementById('dl-rating').value;

                if (isNaN(receivedVal) || isNaN(damagesVal) || isNaN(missingVal)) {
                    this.showToast('Please enter numeric confirmation data.', 'warning');
                    return;
                }

                const simTime = LCOS_State.getSystemSettings().simulationTime;
                const recNum = 'RCPT-' + Math.floor(Math.random() * 9000 + 1000);

                trip.transitUpdates.push({
                    timestamp: simTime,
                    location: 'Destination Branch Gates',
                    condition: ratingVal,
                    status: 'CLOSED',
                    delayReason: '',
                    remarks: `Shipment delivered. Receipt generated: ${recNum}. Total received: ${receivedVal}. Damages: ${damagesVal}.`,
                    operatorId: empId
                });

                LCOS_State.closeTripDelivery(trip.id, {
                    receivedQuantity: receivedVal,
                    damagesCount: damagesVal,
                    missingCount: missingVal,
                    condition: ratingVal,
                    receiverName: manager,
                    receiptNumber: recNum,
                    closedTimestamp: simTime
                });

                // Add Call Log
                LCOS_State.addCallLog({
                    tripId: trip.id,
                    type: 'Delivery Confirmation',
                    caller: 'Admin Office',
                    recipient: `${LCOS_State.getBranches().find(b => b.id === trip.destinationBranchId).name} Manager`,
                    notes: `Trip closed. Digital receipt generated: ${recNum}. Total received: ${receivedVal}. Damages: ${damagesVal}. Operator: ${empId}.`
                });

                this.showToast(`Trip ${trip.id} delivered and stock updated! Receipt generated.`, 'success');
                this.renderAll();
                this.viewReceipt(trip.id);
            });
        }
        else if (trip.status === 'CLOSED') {
            const role = LCOS_State.getCurrentRole();
            if (role === 'tracking_team') {
                container.innerHTML = empIdHTML + `
                    <h5 style="margin-bottom:0.75rem; font-size:0.95rem;" class="text-success">✅ Trip Leg Completed</h5>
                    <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:0.75rem;">
                        Delivery completed. Receipt <strong>${trip.deliveryInfo.receiptNumber}</strong> generated and archived in LCOS logs.
                    </p>
                    <p style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:1rem;">
                        Receipt details transmitted to Destination Warehouse Manager <strong>(${trip.deliveryInfo.receiverName})</strong> for digital stock reconciliation.
                    </p>
                    <p style="font-size:0.75rem; color:var(--text-muted); margin-bottom:1rem;">
                        Initiate the return leg so the lorry can transit empty back to the origin home base.
                    </p>
                    <button class="btn btn-primary w-100" id="btn-initiate-return">
                        🚚 Initiate Lorry Return Leg (Home Base)
                    </button>
                `;
                document.getElementById('btn-initiate-return').addEventListener('click', () => {
                    const empId = this.getConsoleEmpId();
                    if (!empId) return;

                    const simTime = LCOS_State.getSystemSettings().simulationTime;
                    trip.transitUpdates.push({
                        timestamp: simTime,
                        location: 'Destination Branch',
                        condition: 'Good',
                        status: 'RETURNING',
                        delayReason: '',
                        remarks: `Initiated empty lorry return leg back to home base.`,
                        operatorId: empId
                    });
                    trip.lastUpdateTimestamp = simTime;

                    LCOS_State.updateTripStatus(trip.id, 'RETURNING');
                    this.showToast('Return leg initiated. Lorry en route to home base.', 'success');
                    this.renderAll();
                });
            } else {
                container.innerHTML = `
                    <h5 style="margin-bottom:0.75rem; font-size:0.95rem;" class="text-success">✅ Trip Leg Closed</h5>
                    <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:0.75rem;">
                        Receipt <strong>${trip.deliveryInfo.receiptNumber}</strong> transmitted to Destination Warehouse for direct stock reconciliation.
                    </p>
                    <p style="font-size:0.75rem; color:var(--color-warning); font-weight:600; text-align:center; padding:0.5rem; border:1px dashed var(--border-glass); border-radius:6px;">
                        ⚠️ View Only: Waiting for operators to initiate the return leg.
                    </p>
                `;
            }
        }
        else if (trip.status === 'RETURNING') {
            const role = LCOS_State.getCurrentRole();
            const sourceBr = LCOS_State.getBranches().find(b => b.id === trip.sourceBranchId);
            
            if (role === 'tracking_team') {
                container.innerHTML = empIdHTML + `
                    <h5 style="margin-bottom:0.75rem; font-size:0.95rem;" class="text-transit">🚚 Return Leg Progress</h5>
                    <p style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:0.75rem;">
                        Track empty vehicle return to home base <strong>(${sourceBr ? sourceBr.name : 'Origin'})</strong>:
                    </p>
                    <div class="form-group">
                        <label class="form-label">Current Highway Location</label>
                        <input type="text" class="form-control" id="ret-log-loc" placeholder="e.g. Trichy Bypass" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Check-in Notes</label>
                        <input type="text" class="form-control" id="ret-log-notes" placeholder="Remarks..." required>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:0.5rem;">
                        <button class="btn btn-primary w-100" id="btn-save-return-log">
                            Log Return Check-in Call
                        </button>
                        <button class="btn btn-success w-100" id="btn-confirm-return-arrival">
                            🏁 Confirm Return Arrival at Home Base
                        </button>
                    </div>
                `;
                document.getElementById('btn-save-return-log').addEventListener('click', () => {
                    const empId = this.getConsoleEmpId();
                    if (!empId) return;

                    const loc = document.getElementById('ret-log-loc').value;
                    const notes = document.getElementById('ret-log-notes').value;
                    if (!loc || !notes) {
                        this.showToast('Please enter current location and remarks.', 'warning');
                        return;
                    }
                    const simTime = LCOS_State.getSystemSettings().simulationTime;
                    trip.transitUpdates.push({
                        timestamp: simTime,
                        location: loc + ' (Return Leg)',
                        condition: 'Good',
                        status: 'RETURNING',
                        delayReason: '',
                        remarks: notes,
                        operatorId: empId
                    });
                    trip.lastUpdateTimestamp = simTime;
                    LCOS_State.addCallLog({
                        tripId: trip.id,
                        type: 'Transit Update',
                        caller: 'Driver',
                        recipient: 'Admin Office',
                        notes: `Return leg checkpoint: ${loc}. Remarks: ${notes}. Operator: ${empId}.`
                    });
                    LCOS_State.save();
                    this.showToast('Return checkpoint logged.', 'success');
                    this.renderAll();
                });

                document.getElementById('btn-confirm-return-arrival').addEventListener('click', () => {
                    const empId = this.getConsoleEmpId();
                    if (!empId) return;

                    const simTime = LCOS_State.getSystemSettings().simulationTime;
                    trip.transitUpdates.push({
                        timestamp: simTime,
                        location: sourceBr ? sourceBr.name : 'Origin Home Base',
                        condition: 'Good',
                        status: 'COMPLETED_RETURN',
                        delayReason: '',
                        remarks: 'Lorry returned empty to home base. Driver and vehicle released.',
                        operatorId: empId
                    });

                    LCOS_State.recordReturnArrival(trip.id);
                    this.showToast('Return leg completed. Lorry and driver are now available.', 'success');
                    this.renderAll();
                });
            } else {
                container.innerHTML = `
                    <h5 style="margin-bottom:0.75rem; font-size:0.95rem;" class="text-transit">🚚 Return Leg (Supervisor View)</h5>
                    <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:1rem; text-align:center;">
                        Vehicle is currently traveling empty back to its origin warehouse.
                    </p>
                    <p style="font-size:0.75rem; color:var(--color-warning); font-weight:600; text-align:center; padding:0.5rem; border:1px dashed var(--border-glass); border-radius:6px;">
                        ⚠️ View Only: Checkpoints are logged by the Tracking Team.
                    </p>
                `;
            }
        }
        else if (trip.status === 'COMPLETED_RETURN') {
            container.innerHTML = `
                <h5 style="margin-bottom:0.5rem; font-size:0.95rem;" class="text-success">🏁 Return Completed</h5>
                <p style="font-size:0.8rem; color:var(--text-secondary); text-align:center; padding:1rem; border:1px dashed var(--border-glass); border-radius:8px;">
                    Lorry and driver successfully returned to origin home base and released back to available registry.
                </p>
            `;
        }
    },

    toggleChecklist(type, field) {
        const role = LCOS_State.getCurrentRole();
        if (role === 'branch_manager' || role === 'owner') {
            this.showToast('Supervisors/Owners have view-only access to console checklists.', 'warning');
            return;
        }

        if (!this.activeConsoleTripId) return;
        const trip = LCOS_State.getTripById(this.activeConsoleTripId);
        if (!trip) return;

        trip.checklists[type][field] = !trip.checklists[type][field];
        LCOS_State.save();
        this.renderOperationsConsole();
    },

    isChecklistComplete(checklistObj) {
        return Object.values(checklistObj).every(v => v === true);
    },

    renderTripsTracker() {
        const query = document.getElementById('trip-search').value.toLowerCase();
        const statusFilter = document.getElementById('trip-filter-status').value;
        const trips = LCOS_State.getTrips();
        const tbody = document.querySelector('#trips-table tbody');
        
        tbody.innerHTML = '';

        const filtered = trips.filter(t => {
            const matchesStatus = statusFilter === '' || t.status === statusFilter || (statusFilter === 'CLOSED' && t.status === 'CLOSED');
            
            const com = LCOS_State.getCommodities().find(c => c.id === t.commodityId);
            const drv = LCOS_State.getDrivers().find(d => d.id === t.driverId);
            const src = LCOS_State.getBranches().find(b => b.id === t.sourceBranchId);
            const dest = LCOS_State.getBranches().find(b => b.id === t.destinationBranchId);

            const searchStr = `${t.id} ${t.vehicleId} ${drv ? drv.name : ''} ${com ? com.name : ''} ${src ? src.name : ''} ${dest ? dest.name : ''}`.toLowerCase();
            const matchesQuery = query === '' || searchStr.includes(query);

            return matchesStatus && matchesQuery;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--text-muted);">No matching shipments found.</td></tr>`;
            return;
        }

        const formatDate = (isoStr) => {
            const date = new Date(isoStr);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString([], { day: '2-digit', month: 'short' });
        };

        filtered.forEach(t => {
            const com = LCOS_State.getCommodities().find(c => c.id === t.commodityId);
            const src = LCOS_State.getBranches().find(b => b.id === t.sourceBranchId);
            const dest = LCOS_State.getBranches().find(b => b.id === t.destinationBranchId);
            const drv = LCOS_State.getDrivers().find(d => d.id === t.driverId);

            let statusBadge = '';
            if (t.status === 'CREATED') statusBadge = '<span class="badge badge-draft">Draft</span>';
            else if (t.status === 'IN_TRANSIT') statusBadge = '<span class="badge badge-transit">In Transit</span>';
            else if (t.status === 'DELAYED') statusBadge = '<span class="badge badge-delayed">Delayed</span>';
            else if (t.status === 'CLOSED') statusBadge = '<span class="badge badge-success">Closed</span>';
            else statusBadge = `<span class="badge badge-pending">${t.status}</span>`;

            let actionBtn = '';
            if (t.status !== 'CLOSED') {
                actionBtn = `<button class="btn btn-secondary" style="padding:0.25rem 0.5rem; font-size:0.75rem;" onclick="app.openTripInConsole('${t.id}')">Console</button>`;
            } else {
                actionBtn = `<button class="btn btn-secondary" style="padding:0.25rem 0.5rem; font-size:0.75rem;" onclick="app.viewReceipt('${t.id}')">Receipt</button>`;
            }

            tbody.innerHTML += `
                <tr>
                    <td style="font-weight:700;">${t.id}</td>
                    <td>${src ? src.name : 'Unknown'} → ${dest ? dest.name : 'Unknown'}</td>
                    <td>${com ? com.name : 'Goods'}</td>
                    <td>${t.quantity} ${com ? com.unit : 'Units'}</td>
                    <td>
                        <div style="font-weight:600;">${t.vehicleId}</div>
                        <div style="font-size:0.75rem; color:var(--text-muted);">${drv ? drv.name : 'Unassigned'}</div>
                    </td>
                    <td>${statusBadge}</td>
                    <td style="font-size:0.75rem; color:var(--text-secondary);">${formatDate(t.lastUpdateTimestamp)}</td>
                    <td>${actionBtn}</td>
                </tr>
            `;
        });
    },

    openTripInConsole(tripId) {
        this.activeConsoleTripId = tripId;
        this.switchTab('operations');
        const select = document.getElementById('console-trip-select');
        select.value = tripId;
        this.renderOperationsConsole();
    },

    renderInventory() {
        const role = LCOS_State.getCurrentRole();
        const invActBtn = document.getElementById('btn-inventory-action');
        if (invActBtn) {
            if (role === 'owner') {
                invActBtn.style.display = 'none';
            } else {
                invActBtn.style.display = 'inline-flex';
                invActBtn.textContent = role === 'tracking_team' ? 'Request Stock Refill' : 'Manually Add Stock';
            }
        }

        const commodities = LCOS_State.getCommodities();
        const select = document.getElementById('inventory-commodity-select');
        
        // Fill dropdown if empty
        if (select.children.length === 0) {
            select.innerHTML = commodities.map(c => `<option value="${c.id}">${c.name} (${c.unit})</option>`).join('');
            select.value = this.selectedInventoryCommodityId;
        }

        const stock = LCOS_State.getStock();
        const branches = LCOS_State.getBranches();
        const tbody = document.querySelector('#inventory-table tbody');
        
        tbody.innerHTML = '';

        branches.forEach(branch => {
            const stObj = stock[branch.id]?.[this.selectedInventoryCommodityId] || { available: 0, inTransit: 0, delivered: 0, pending: 0 };
            
            tbody.innerHTML += `
                <tr>
                    <td style="font-weight:700;">${branch.name} Branch</td>
                    <td style="font-family:monospace; color:var(--text-muted);">${branch.id}</td>
                    <td>${branch.manager}</td>
                    <td style="font-weight:700; color:var(--text-primary);">${stObj.available}</td>
                    <td style="color:var(--color-transit); font-weight:600;">+${stObj.inTransit}</td>
                    <td style="color:var(--color-success);">${stObj.delivered}</td>
                    <td style="color:var(--color-warning);">+${stObj.pending}</td>
                </tr>
            `;
        });
    },

    renderDirectory() {
        const role = LCOS_State.getCurrentRole();
        const forms = [
            { id: 'form-add-driver', type: 'Add Driver' },
            { id: 'form-add-vehicle', type: 'Add Vehicle' },
            { id: 'form-add-branch', type: 'Add Branch' },
            { id: 'form-add-commodity', type: 'Add Commodity' }
        ];

        forms.forEach(f => {
            const formEl = document.getElementById(f.id);
            if (formEl) {
                const parent = formEl.parentElement;
                // Remove old request banner if any
                const oldBanner = parent.querySelector('.req-supervisor-banner');
                if (oldBanner) oldBanner.remove();

                if (role === 'tracking_team') {
                    formEl.style.display = 'none';
                    const banner = document.createElement('div');
                    banner.className = 'req-supervisor-banner';
                    banner.innerHTML = `
                        <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:1rem; text-align:center; line-height:1.4;">
                            ⚠️ Operators cannot directly edit resource directories. Submit a registration request to the Supervisor.
                        </p>
                        <button class="btn btn-primary w-100" type="button" onclick="app.openRequestModal('${f.type}')">
                            Submit Request to Supervisor
                        </button>
                    `;
                    parent.appendChild(banner);
                } else if (role === 'owner') {
                    formEl.style.display = 'none';
                    const banner = document.createElement('div');
                    banner.className = 'req-supervisor-banner';
                    banner.innerHTML = `
                        <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:1rem; text-align:center; line-height:1.4;">
                            👑 View Only: Owner Mode. Managers register directories and assets.
                        </p>
                    `;
                    parent.appendChild(banner);
                } else {
                    formEl.style.display = 'block';
                }
            }
        });

        if (this.selectedDirectorySub === 'drivers') {
            const tbody = document.querySelector('#table-drivers tbody');
            tbody.innerHTML = LCOS_State.getDrivers().map(d => {
                let statusBadge = `<span class="badge ${d.status === 'Available' ? 'badge-success' : d.status === 'On Trip' ? 'badge-transit' : 'badge-delayed'}">${d.status}</span>`;
                return `
                    <tr>
                        <td style="font-weight:700;">${d.name}</td>
                        <td style="font-family:monospace;">${d.license}</td>
                        <td>${d.phone}</td>
                        <td>${d.experience} Years</td>
                        <td style="font-weight:700; color:var(--color-success);">${d.performance}%</td>
                        <td style="color:var(--color-danger); font-weight:700;">${d.warnings}</td>
                        <td>${statusBadge}</td>
                    </tr>
                `;
            }).join('');
        }
        else if (this.selectedDirectorySub === 'vehicles') {
            const tbody = document.querySelector('#table-vehicles tbody');
            tbody.innerHTML = LCOS_State.getVehicles().map(v => {
                let statusBadge = `<span class="badge ${v.status === 'Available' ? 'badge-success' : 'badge-transit'}">${v.status}</span>`;
                return `
                    <tr>
                        <td style="font-weight:700; font-family:monospace;">${v.id}</td>
                        <td>${v.type}</td>
                        <td>${v.capacity} Metric Tons</td>
                        <td>${v.owner}</td>
                        <td>${statusBadge}</td>
                    </tr>
                `;
            }).join('');
        }
        else if (this.selectedDirectorySub === 'branches') {
            const tbody = document.querySelector('#table-branches tbody');
            tbody.innerHTML = LCOS_State.getBranches().map(b => `
                <tr>
                    <td style="font-family:monospace; color:var(--text-muted);">${b.id}</td>
                    <td style="font-weight:700;">${b.name}</td>
                    <td>${b.manager}</td>
                    <td>${b.phone}</td>
                </tr>
            `).join('');
        }
        else if (this.selectedDirectorySub === 'helpers') {
            const tbody = document.querySelector('#table-helpers tbody');
            tbody.innerHTML = LCOS_State.getHelpers().map(h => `
                <tr>
                    <td style="font-weight:700;">${h.name}</td>
                    <td>${h.phone}</td>
                    <td>${h.role}</td>
                    <td><span class="badge ${h.status === 'Available' ? 'badge-success' : 'badge-transit'}">${h.status}</span></td>
                </tr>
            `).join('');
        }
        else if (this.selectedDirectorySub === 'commodities') {
            const tbody = document.querySelector('#table-commodities tbody');
            tbody.innerHTML = LCOS_State.getCommodities().map(c => `
                <tr>
                    <td style="font-family:monospace; color:var(--text-muted);">${c.id}</td>
                    <td style="font-weight:700;">${c.name}</td>
                    <td>${c.unit}</td>
                    <td>${c.weight} kg / unit</td>
                    <td>₹${c.value.toLocaleString()} / unit</td>
                </tr>
            `).join('');
        }
    },

    renderCallLogs() {
        const query = document.getElementById('call-search').value.toLowerCase();
        const typeFilter = document.getElementById('call-filter-type').value;
        const logs = LCOS_State.getCallLogs();
        const tbody = document.querySelector('#calllogs-table tbody');
        
        tbody.innerHTML = '';

        const filtered = logs.filter(l => {
            const matchesType = typeFilter === '' || l.type === typeFilter;
            const searchStr = `${l.id} ${l.tripId || ''} ${l.type} ${l.notes} ${l.caller} ${l.recipient}`.toLowerCase();
            const matchesQuery = query === '' || searchStr.includes(query);
            return matchesType && matchesQuery;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted);">No call logs recorded yet.</td></tr>`;
            return;
        }

        const formatDate = (isoStr) => {
            const date = new Date(isoStr);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString([], { day: '2-digit', month: 'short' });
        };

        filtered.reverse().forEach(l => {
            tbody.innerHTML += `
                <tr>
                    <td style="font-family:monospace; font-weight:700;">${l.id}</td>
                    <td style="font-size:0.75rem; color:var(--text-secondary);">${formatDate(l.timestamp)}</td>
                    <td style="font-weight:600; color:var(--color-secondary);">${l.tripId || '--'}</td>
                    <td><span class="badge badge-draft" style="font-size:0.7rem; padding:0.15rem 0.35rem;">${l.type}</span></td>
                    <td style="font-size:0.8rem; font-weight:600;">${l.caller}</td>
                    <td style="font-size:0.8rem; font-weight:600; color:var(--text-secondary);">${l.recipient}</td>
                    <td style="font-size:0.8rem; max-width: 320px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;" title="${l.notes}">${l.notes}</td>
                </tr>
            `;
        });
    },

    // --- Tamil Nadu SVG Map Renders ---

    renderMap() {
        const svg = document.getElementById('tn-map-svg');
        if (!svg) return;

        let html = `
            <polygon points="70,10 85,15 82,25 74,38 78,50 78,56 70,68 62,75 50,86 42,92 35,95 28,95 32,85 28,75 22,65 15,58 15,48 25,45 35,38 42,32 50,28 62,20 68,10" 
                fill="#0b111e" stroke="rgba(99,102,241,0.15)" stroke-width="1.5" />
        `;

        const branches = LCOS_State.getBranches();

        // Build grid of dotted background lanes
        for (let i = 0; i < branches.length; i++) {
            for (let j = i + 1; j < branches.length; j++) {
                const b1 = branches[i];
                const b2 = branches[j];
                const dist = Math.hypot(b1.x - b2.x, b1.y - b2.y);
                if (dist < 40) {
                    html += `
                        <line x1="${b1.x}" y1="${b1.y}" x2="${b2.x}" y2="${b2.y}" 
                            stroke="rgba(255,255,255,0.03)" stroke-width="1" stroke-dasharray="1 2" />
                    `;
                }
            }
        }

        // Draw very faint reference dots for warehouse bases
        branches.forEach(b => {
            html += `
                <circle cx="${b.x}" cy="${b.y}" r="1.5" fill="rgba(255,255,255,0.1)" />
            `;
        });

        this.mapBaseHTML = html;
        svg.innerHTML = html;
    },

    getTripCurrentCoordinates(trip) {
        const src = LCOS_State.getBranches().find(b => b.id === trip.sourceBranchId);
        const dest = LCOS_State.getBranches().find(b => b.id === trip.destinationBranchId);
        if (!src || !dest) return { x: 50, y: 50 };

        const startStatuses = ['CREATED', 'DISPATCH_APPROVED', 'DRIVER_CALLED', 'DRIVER_CONFIRMED'];
        if (startStatuses.includes(trip.status)) {
            return { x: src.x, y: src.y };
        }

        if (trip.status === 'CLOSED' || trip.status === 'COMPLETED_RETURN') {
            return { x: dest.x, y: dest.y };
        }

        // Calculate transit progress based on real date diff
        const startTime = new Date(trip.lastUpdateTimestamp).getTime();
        const nowTime = new Date(LCOS_State.getSystemSettings().simulationTime).getTime();
        const expectedMs = (trip.expectedHours || 8) * 60 * 60 * 1000;
        const elapsedMs = Math.max(0, nowTime - startTime);

        let progress = Math.min(0.9, elapsedMs / expectedMs);
        if (trip.status === 'ARRIVED') progress = 1.0;

        if (trip.status === 'RETURNING') {
            // Returning empty travels back to origin home base
            return {
                x: dest.x + progress * (src.x - dest.x),
                y: dest.y + progress * (src.y - dest.y)
            };
        } else {
            // Forward transit travels towards destination
            return {
                x: src.x + progress * (dest.x - src.x),
                y: src.y + progress * (dest.y - src.y)
            };
        }
    },

    getFilteredTrips() {
        const timeframe = document.getElementById('map-filter-timeframe')?.value || 'today';
        const trips = LCOS_State.getTrips();
        const now = new Date();
        
        let startBound = new Date();
        let endBound = new Date();
        
        if (timeframe === 'today') {
            startBound.setHours(0, 0, 0, 0);
            endBound.setHours(23, 59, 59, 999);
        } else if (timeframe === 'weekly') {
            startBound.setDate(now.getDate() - 7);
            startBound.setHours(0, 0, 0, 0);
            endBound.setHours(23, 59, 59, 999);
        } else if (timeframe === 'monthly') {
            startBound.setDate(now.getDate() - 30);
            startBound.setHours(0, 0, 0, 0);
            endBound.setHours(23, 59, 59, 999);
        } else if (timeframe === 'yearly') {
            startBound.setDate(now.getDate() - 365);
            startBound.setHours(0, 0, 0, 0);
            endBound.setHours(23, 59, 59, 999);
        } else if (timeframe === 'custom') {
            const startVal = document.getElementById('map-date-start')?.value;
            const endVal = document.getElementById('map-date-end')?.value;
            
            if (startVal) {
                startBound = new Date(startVal);
                startBound.setHours(0, 0, 0, 0);
            } else {
                startBound = new Date(0);
            }
            
            if (endVal) {
                endBound = new Date(endVal);
                endBound.setHours(23, 59, 59, 999);
            } else {
                endBound = new Date();
            }
        }
        
        return trips.filter(t => {
            const isCurrentlyRunning = t.status !== 'CLOSED' && t.status !== 'COMPLETED_RETURN';
            if (isCurrentlyRunning) return true;
            
            const tripDate = new Date(t.lastUpdateTimestamp);
            return tripDate >= startBound && tripDate <= endBound;
        });
    },

    updateMapReport() {
        const filteredTrips = this.getFilteredTrips();
        const vehSelect = document.getElementById('map-filter-vehicle');
        if (!vehSelect) return;
        
        const prevSelected = vehSelect.value;
        vehSelect.innerHTML = '<option value="">-- All Running Trucks --</option>';
        
        const statusMap = {
            CREATED: 'Draft',
            DISPATCH_APPROVED: 'Approved',
            DRIVER_CALLED: 'Driver Called',
            DRIVER_CONFIRMED: 'Driver Ready',
            IN_TRANSIT: 'In Transit',
            DELAYED: 'Delayed',
            ARRIVED: 'Arrived',
            DELIVERY_CONFIRMED: 'Delivering',
            CLOSED: 'Delivered',
            RETURNING: 'Returning',
            COMPLETED_RETURN: 'Returned'
        };

        filteredTrips.forEach(t => {
            const statusLabel = statusMap[t.status] || t.status;
            vehSelect.innerHTML += `<option value="${t.id}">${t.vehicleId} (${statusLabel})</option>`;
        });
        
        if (Array.from(vehSelect.options).some(opt => opt.value === prevSelected)) {
            vehSelect.value = prevSelected;
        }
        
        this.updateMapHighlights();
    },

    updateMapHighlights() {
        const svg = document.getElementById('tn-map-svg');
        if (!svg) return;

        // Reset map to background coastline
        svg.innerHTML = this.mapBaseHTML || '';
        this.hideMapTooltip();

        const selectedVehTripId = document.getElementById('map-filter-vehicle')?.value;

        if (this.activeTab === 'dashboard') {
            const filteredTrips = this.getFilteredTrips();
            
            filteredTrips.forEach(trip => {
                if (!selectedVehTripId || trip.id === selectedVehTripId) {
                    if (trip.status !== 'COMPLETED_RETURN') {
                        const bSrc = LCOS_State.getBranches().find(b => b.id === trip.sourceBranchId);
                        const bDest = LCOS_State.getBranches().find(b => b.id === trip.destinationBranchId);
                        
                        // 1. Draw transit route lane highlight
                        if (bSrc && bDest) {
                            const routeLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
                            routeLine.setAttribute("x1", bSrc.x);
                            routeLine.setAttribute("y1", bSrc.y);
                            routeLine.setAttribute("x2", bDest.x);
                            routeLine.setAttribute("y2", bDest.y);
                            routeLine.setAttribute("class", "map-connection active-path");
                            
                            // Yellow-red for delayed, indigo for healthy
                            routeLine.style.stroke = trip.status === 'DELAYED' ? '#f59e0b' : '#6366f1';
                            routeLine.style.strokeWidth = "2.5px";
                            routeLine.style.opacity = "0.75";
                            svg.appendChild(routeLine);
                        }

                        // 2. Draw live GPS coordinate dot of vehicle
                        const pos = this.getTripCurrentCoordinates(trip);
                        let dotColor = '#38bdf8'; // sky blue for moving
                        if (trip.status === 'DELAYED') dotColor = '#ef4444'; // red for delayed
                        if (trip.status === 'CLOSED') dotColor = '#10b981'; // green for delivered
                        if (trip.status === 'RETURNING') dotColor = '#a855f7'; // purple for return leg

                        // Pulsing ring
                        const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                        ring.setAttribute("cx", pos.x);
                        ring.setAttribute("cy", pos.y);
                        ring.setAttribute("r", "5.5");
                        ring.setAttribute("fill", "none");
                        ring.setAttribute("stroke", dotColor);
                        ring.setAttribute("stroke-width", "0.75");
                        ring.setAttribute("opacity", "0.6");
                        svg.appendChild(ring);

                        // Solid truck dot
                        const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                        dot.setAttribute("cx", pos.x);
                        dot.setAttribute("cy", pos.y);
                        dot.setAttribute("r", "3.2");
                        dot.setAttribute("fill", dotColor);
                        dot.style.cursor = "pointer";
                        dot.style.filter = `drop-shadow(0px 0px 4px ${dotColor})`;
                        svg.appendChild(dot);

                        // Build hover report content
                        const lastUpdate = trip.transitUpdates[trip.transitUpdates.length - 1];
                        const lastLoc = lastUpdate ? lastUpdate.location : 'Origin Warehouse Gate';
                        const statusLabel = trip.status === 'CLOSED' ? 'Delivered' : trip.status === 'RETURNING' ? 'Returning Empty' : 'In Transit';
                        const com = LCOS_State.getCommodities().find(c => c.id === trip.commodityId);
                        const cargoDesc = com ? `${com.name} (${trip.quantity} ${com.unit})` : 'Commodity';
                        const hoverReport = `Vehicle: ${trip.vehicleId} | Cargo: ${cargoDesc} | Status: ${statusLabel} | Current Location: ${lastLoc}`;

                        const onMouseOver = () => {
                            this.showMapTooltip(hoverReport, pos.x, pos.y);
                            dot.setAttribute("r", "4.8");
                            ring.setAttribute("r", "8");
                        };

                        const onMouseOut = () => {
                            this.hideMapTooltip();
                            dot.setAttribute("r", "3.2");
                            ring.setAttribute("r", "5.5");
                        };

                        dot.onmouseover = onMouseOver;
                        dot.onmouseout = onMouseOut;
                    }
                }
            });
        } else if (this.activeConsoleTripId && this.activeTab === 'operations') {
            const trip = LCOS_State.getTripById(this.activeConsoleTripId);
            if (trip && trip.status !== 'CLOSED') {
                const bSrc = LCOS_State.getBranches().find(b => b.id === trip.sourceBranchId);
                const bDest = LCOS_State.getBranches().find(b => b.id === trip.destinationBranchId);
                
                if (bSrc && bDest) {
                    const routeLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
                    routeLine.setAttribute("x1", bSrc.x);
                    routeLine.setAttribute("y1", bSrc.y);
                    routeLine.setAttribute("x2", bDest.x);
                    routeLine.setAttribute("y2", bDest.y);
                    routeLine.setAttribute("class", "map-connection active-path");
                    svg.appendChild(routeLine);
                }
            }
        }
    },

    showMapTooltip(text, x, y) {
        const tip = document.getElementById('map-tip');
        if (!tip) return;
        tip.innerHTML = text.replace(/ \| /g, '<br>');
        tip.style.display = 'block';
        tip.style.left = `${x}%`;
        tip.style.top = `${y - 6}%`;
        tip.style.transform = 'translate(-50%, -50%)';
    },

    hideMapTooltip() {
        const tip = document.getElementById('map-tip');
        if (tip) {
            tip.style.display = 'none';
            tip.style.transform = '';
        }
    },

    handleMapNodeClick(branchId) {
        // District clicks are disabled for routes only map view
    },

    getConsoleEmpId() {
        const role = LCOS_State.getCurrentRole();
        if (role !== 'tracking_team') return 'Manager/Viewer';
        
        const empInput = document.getElementById('op-emp-id');
        const empId = empInput ? empInput.value.trim() : '';
        if (!empId) {
            this.showToast('Please enter your Employee ID (Emp ID) first!', 'warning');
            if (empInput) empInput.focus();
            return null;
        }
        this.operatorEmpId = empId;
        return empId;
    },

    // --- Modal Handling ---

    openModal(modalId) {
        document.getElementById(modalId).classList.add('active');

        // Prepopulate Modal Select fields if creating trip
        if (modalId === 'modal-create-trip') {
            const sourceSelect = document.getElementById('t-source');
            const destSelect = document.getElementById('t-dest');
            const comSelect = document.getElementById('t-commodity');
            const vehSelect = document.getElementById('t-vehicle');
            const drvSelect = document.getElementById('t-driver');
            const hlpSelect = document.getElementById('t-helper');

            const branches = LCOS_State.getBranches();
            const commodities = LCOS_State.getCommodities();
            const vehicles = LCOS_State.getVehicles().filter(v => v.status === 'Available');
            const drivers = LCOS_State.getDrivers().filter(d => d.status === 'Available');
            const helpers = LCOS_State.getHelpers().filter(h => h.status === 'Available');

            sourceSelect.innerHTML = branches.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
            destSelect.innerHTML = branches.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
            
            // Avoid same source and destination default
            if (sourceSelect.children.length > 1) {
                destSelect.selectedIndex = 1;
            }

            comSelect.innerHTML = commodities.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
            
            // Set qty weight label based on default selection
            const updateQtyWeightLabel = () => {
                const comId = comSelect.value;
                const cObj = commodities.find(c => c.id === comId);
                const branchId = sourceSelect.value;
                const availableStock = LCOS_State.getStock()[branchId]?.[comId]?.available || 0;
                document.getElementById('t-qty-label').textContent = `Available stock at source: ${availableStock} ${cObj ? cObj.unit : 'units'} (${cObj ? cObj.weight : 0}kg / unit)`;
                document.getElementById('t-qty').max = availableStock;
                document.getElementById('t-qty').value = Math.min(100, availableStock);
            };

            comSelect.onchange = updateQtyWeightLabel;
            sourceSelect.onchange = updateQtyWeightLabel;
            updateQtyWeightLabel();

            vehSelect.innerHTML = vehicles.length > 0 
                ? vehicles.map(v => `<option value="${v.id}">${v.id} - ${v.type} (Cap: ${v.capacity} MT)</option>`).join('')
                : '<option value="">No Available Vehicles</option>';

            drvSelect.innerHTML = drivers.length > 0
                ? drivers.map(d => `<option value="${d.id}">${d.name} (Exp: ${d.experience}y, Perf: ${d.performance}%)</option>`).join('')
                : '<option value="">No Available Drivers</option>';

            hlpSelect.innerHTML = '<option value="">No Helper assigned</option>' + 
                helpers.map(h => `<option value="${h.id}">${h.name} (${h.role})</option>`).join('');
        }
    },

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    },

    handleCreateTrip() {
        const source = document.getElementById('t-source').value;
        const dest = document.getElementById('t-dest').value;
        const comId = document.getElementById('t-commodity').value;
        const qty = Number(document.getElementById('t-qty').value);
        const vehId = document.getElementById('t-vehicle').value;
        const drvId = document.getElementById('t-driver').value;
        const hlpId = document.getElementById('t-helper').value || null;
        const durationHours = Number(document.getElementById('t-hours').value);

        const empId = document.getElementById('t-emp-id').value.trim();
        if (!empId) {
            this.showToast('Operator Employee ID is required to schedule dispatch.', 'warning');
            return;
        }
        this.operatorEmpId = empId;

        if (source === dest) {
            this.showToast('Source and Destination branches cannot be the same.', 'warning');
            return;
        }

        if (!vehId || !drvId) {
            this.showToast('You must assign an available Vehicle and Driver to schedule dispatch.', 'warning');
            return;
        }

        const availableStock = LCOS_State.getStock()[source]?.[comId]?.available || 0;
        if (qty > availableStock) {
            this.showToast(`Insufficient stock at source branch. Maximum available: ${availableStock}`, 'warning');
            return;
        }

        const simTimeStr = LCOS_State.getSystemSettings().simulationTime;
        const dispatchDate = new Date(simTimeStr);
        const etaDate = new Date(simTimeStr);
        etaDate.setHours(etaDate.getHours() + durationHours);

        const tripId = 'TRIP-' + (LCOS_State.getTrips().length + 1001);
        const dispId = 'DISP-' + (LCOS_State.getTrips().length + 2001);

        LCOS_State.addTrip({
            id: tripId,
            dispatchId: dispId,
            commodityId: comId,
            quantity: qty,
            sourceBranchId: source,
            destinationBranchId: dest,
            vehicleId: vehId,
            driverId: drvId,
            helperId: hlpId,
            dispatchDate: dispatchDate.toISOString(),
            expectedDeliveryDate: etaDate.toISOString(),
            status: 'CREATED',
            createdBy: empId,
            checklists: {
                dispatch: { loaded: false, verified: false, vehicleReady: false, driverAvailable: false },
                delivery: { quantityMatches: false, damagesChecked: false, missingChecked: false, conditionOk: false }
            },
            transitUpdates: [],
            callLogs: [],
            deliveryInfo: null,
            lastUpdateTimestamp: simTimeStr
        });

        // Add Call Log
        LCOS_State.addCallLog({
            tripId: tripId,
            type: 'Dispatch Confirmation',
            caller: 'Admin Office',
            recipient: 'System Scheduler',
            notes: `Scheduled shipment ${tripId} carrying ${qty} units of commodity to ${dest}. Assigned driver and vehicle.`
        });

        this.closeModal('modal-create-trip');
        this.showToast(`New Shipment ${tripId} created. Transitioned to Draft.`, 'success');
        this.renderAll();
        
        // Auto open this trip in Operations console
        this.openTripInConsole(tripId);
    },

    handleLogCall() {
        const tripId = document.getElementById('call-trip-id').value;
        const category = document.getElementById('call-category').value;
        const caller = document.getElementById('call-caller').value;
        const loc = document.getElementById('call-location').value;
        const notes = document.getElementById('call-notes').value;

        const empId = document.getElementById('call-emp-id').value.trim();
        if (!empId) {
            this.showToast('Operator Employee ID is required to log this call.', 'warning');
            return;
        }
        this.operatorEmpId = empId;

        const trip = LCOS_State.getTripById(tripId);
        if (!trip) return;

        LCOS_State.addCallLog({
            tripId,
            type: category,
            caller: caller === 'Driver' ? `Driver (${LCOS_State.getDrivers().find(d => d.id === trip.driverId)?.name || 'Driver'})` : caller,
            recipient: caller === 'Driver' ? 'Admin Office' : 'Driver/Manager',
            notes: `Location: ${loc || '--'}. Operator: ${empId}. Notes: ${notes}`
        });

        // If location is provided, log update
        if (loc) {
            const simTime = LCOS_State.getSystemSettings().simulationTime;
            trip.transitUpdates.push({
                timestamp: simTime,
                location: loc,
                condition: 'Good',
                status: trip.status,
                delayReason: '',
                remarks: notes,
                operatorId: empId
            });
            trip.lastUpdateTimestamp = simTime;
            LCOS_State.save();
        }

        this.closeModal('modal-log-call');
        this.showToast('Phone conversation logged successfully.', 'success');
        this.renderAll();
    },

    // --- Action Operations Controls ---

    answerSimulatedCall(alertId) {
        const alert = LCOS_State.getAlerts().find(a => a.id === alertId);
        if (!alert) return;

        const trip = LCOS_State.getTripById(alert.tripId);
        if (!trip) return;

        LCOS_State.resolveAlert(alertId);
        this.openTripInConsole(trip.id);
        
        // Open Call logs modal prepopulated
        document.getElementById('call-trip-id').value = trip.id;
        document.getElementById('call-trip-ref').value = `${trip.id} - ${trip.vehicleId}`;
        document.getElementById('call-category').value = 'Transit Update';
        document.getElementById('call-caller').value = 'Driver';
        document.getElementById('call-notes').value = 'Driver calling in to report transit parameters. Vehicle moving smoothly.';
        
        this.openModal('modal-log-call');
    },

    startEscalationCall(alertId) {
        const alert = LCOS_State.getAlerts().find(a => a.id === alertId);
        if (!alert) return;

        this.openTripInConsole(alert.tripId);
        this.showToast('Triggered Call Escalation Flow on Trip Console.', 'info');
    },

    resolveBreakdownAlert(alertId) {
        const alert = LCOS_State.getAlerts().find(a => a.id === alertId);
        if (!alert) return;

        const trip = LCOS_State.getTripById(alert.tripId);
        if (!trip) return;

        const simTime = LCOS_State.getSystemSettings().simulationTime;
        
        // Transition back to IN_TRANSIT
        trip.status = 'IN_TRANSIT';
        trip.transitUpdates.push({
            timestamp: simTime,
            location: trip.transitUpdates.length > 0 ? trip.transitUpdates[trip.transitUpdates.length - 1].location : 'Highway',
            condition: 'Good',
            status: 'IN_TRANSIT',
            delayReason: '',
            remarks: 'Breakdown resolved. Mechanics serviced engine. Trip resumed.'
        });
        trip.lastUpdateTimestamp = simTime;

        LCOS_State.resolveAlert(alertId);
        LCOS_State.addCallLog({
            tripId: trip.id,
            type: 'Transit Update',
            caller: 'Admin Office',
            recipient: 'Driver',
            notes: 'Spoke with driver. Confirmed engine service complete, truck moving.'
        });

        LCOS_State.save();
        this.showToast('Vehicle breakdown resolved. Shipments back in transit.', 'success');
        this.renderAll();
    },

    dismissAlert(alertId) {
        LCOS_State.resolveAlert(alertId);
        this.renderDashboard();
        this.showToast('Alert dismissed.', 'info');
    },

    viewReceipt(tripId) {
        const trip = LCOS_State.getTripById(tripId);
        if (!trip || !trip.deliveryInfo) return;

        const com = LCOS_State.getCommodities().find(c => c.id === trip.commodityId);
        const src = LCOS_State.getBranches().find(b => b.id === trip.sourceBranchId);
        const dest = LCOS_State.getBranches().find(b => b.id === trip.destinationBranchId);
        
        const info = trip.deliveryInfo;

        const formatDate = (isoStr) => {
            const date = new Date(isoStr);
            return date.toLocaleString();
        };

        const receiptHTML = `
            <div class="receipt-paper">
                <div class="receipt-header">
                    <h3>TAMIL NADU LOGISTICS</h3>
                    <p>OFFICIAL DIGITAL RECEIPT</p>
                    <p style="font-size:0.75rem; margin-top:0.25rem;">HQ Admin Operations, Chennai</p>
                </div>
                
                <div class="receipt-row">
                    <span>Receipt No:</span>
                    <strong>${info.receiptNumber}</strong>
                </div>
                <div class="receipt-row">
                    <span>Trip Reference:</span>
                    <strong>${trip.id}</strong>
                </div>
                <div class="receipt-row">
                    <span>Dispatch ID:</span>
                    <strong>${trip.dispatchId}</strong>
                </div>
                <div class="receipt-row">
                    <span>Timestamp:</span>
                    <strong>${formatDate(info.closedTimestamp)}</strong>
                </div>
                <div style="border-top:1px dashed #0f172a; margin: 1rem 0;"></div>
                
                <div class="receipt-row">
                    <span>Source Branch:</span>
                    <strong>${src ? src.name : 'Unknown'} (${trip.sourceBranchId})</strong>
                </div>
                <div class="receipt-row">
                    <span>Destination Branch:</span>
                    <strong>${dest ? dest.name : 'Unknown'} (${trip.destinationBranchId})</strong>
                </div>
                <div class="receipt-row">
                    <span>Vehicle No:</span>
                    <strong>${trip.vehicleId}</strong>
                </div>
                
                <table class="receipt-table">
                    <thead>
                        <tr style="border-bottom:1px solid #0f172a;">
                            <th align="left">Description</th>
                            <th align="right">Qty Sent</th>
                            <th align="right">Qty Recd</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${com ? com.name : 'Commodity Load'}</td>
                            <td align="right">${trip.quantity}</td>
                            <td align="right">${info.receivedQuantity}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="receipt-row">
                    <span>Damaged Items:</span>
                    <strong>${info.damagesCount}</strong>
                </div>
                <div class="receipt-row">
                    <span>Missing Items:</span>
                    <strong>${info.missingCount}</strong>
                </div>
                <div class="receipt-row">
                    <span>Cargo Quality Rating:</span>
                    <strong>${info.condition.toUpperCase()}</strong>
                </div>
                
                <div style="border-top:1px dashed #0f172a; margin: 1rem 0;"></div>
                
                <div class="receipt-row">
                    <span>Receiver Manager:</span>
                    <strong>${info.receiverName}</strong>
                </div>
                
                <div class="receipt-footer">
                    <p>*** Thank You for Choosing LCOS Networks ***</p>
                    <p style="font-size:0.65rem; margin-top:0.25rem;">This is a computer-generated confirmation. No physical signature required.</p>
                </div>
            </div>
        `;

        document.getElementById('receipt-modal-content').innerHTML = receiptHTML;
        this.openModal('modal-receipt');
    },

    // --- Toast Notifications ---
    showToast(message, type = 'info') {
        const wrapper = document.getElementById('toasts-wrapper');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            danger: '🚨'
        };

        toast.innerHTML = `
            <div style="font-size:1.25rem;">${icons[type] || 'ℹ️'}</div>
            <div style="font-size:0.85rem; font-weight:600;">${message}</div>
        `;

        wrapper.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'none'; // reset animation to trigger exit
            toast.style.transition = 'all 0.5s ease';
            toast.style.transform = 'translateY(-100px)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 500);
        }, 5000);
    },

    escalateAlertToManager(alertId) {
        LCOS_State.escalateAlertToManager(alertId);
        this.showToast('Incident successfully escalated to Branch Manager.', 'warning');
        this.renderAll();
    },

    approveRequest(reqId) {
        const success = LCOS_State.approveManagerRequest(reqId);
        if (success) {
            this.showToast(`Request ${reqId} approved and resource registered.`, 'success');
            this.renderAll();
        } else {
            this.showToast('Failed to approve request.', 'danger');
        }
    },

    openRequestModal(category) {
        const select = document.getElementById('req-resource-type');
        if (select) {
            select.value = category;
            this.renderRequestFields(category);
        }
        this.openModal('modal-request-resource');
    },

    renderRequestFields(type) {
        const container = document.getElementById('req-fields-container');
        if (!container) return;
        
        if (type === 'Add Driver') {
            container.innerHTML = `
                <div class="form-group">
                    <label class="form-label">Driver Full Name</label>
                    <input type="text" class="form-control" id="req-drv-name" required>
                </div>
                <div class="form-group">
                    <label class="form-label">License Number</label>
                    <input type="text" class="form-control" id="req-drv-license" placeholder="DL-XXXXXXXXXXXXX" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Contact Number</label>
                        <input type="text" class="form-control" id="req-drv-phone" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Experience (Years)</label>
                        <input type="number" class="form-control" id="req-drv-exp" min="0" required>
                    </div>
                </div>
            `;
        } else if (type === 'Add Vehicle') {
            container.innerHTML = `
                <div class="form-group">
                    <label class="form-label">Vehicle Reg Number</label>
                    <input type="text" class="form-control" id="req-veh-id" placeholder="TN-XX-XX-XXXX" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Vehicle Type</label>
                    <select class="form-control" id="req-veh-type">
                        <option value="Lorry">Lorry</option>
                        <option value="Container">Container</option>
                        <option value="Mini Truck">Mini Truck</option>
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Capacity (Metric Tons)</label>
                        <input type="number" class="form-control" id="req-veh-capacity" min="1" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Ownership</label>
                        <select class="form-control" id="req-veh-owner">
                            <option value="Self Owned">Self Owned</option>
                            <option value="Logistics Partners">Logistics Partners</option>
                        </select>
                    </div>
                </div>
            `;
        } else if (type === 'Add Stock') {
            const brOpts = LCOS_State.getBranches().map(b => `<option value="${b.id}">${b.name}</option>`).join('');
            const comOpts = LCOS_State.getCommodities().map(c => `<option value="${c.id}">${c.name}</option>`).join('');
            container.innerHTML = `
                <div class="form-group">
                    <label class="form-label">Target Warehouse Branch</label>
                    <select class="form-control" id="req-stock-branch">${brOpts}</select>
                </div>
                <div class="form-group">
                    <label class="form-label">Commodity to Refill</label>
                    <select class="form-control" id="req-stock-commodity">${comOpts}</select>
                </div>
                <div class="form-group">
                    <label class="form-label">Refill Quantity</label>
                    <input type="number" class="form-control" id="req-stock-qty" min="1" required>
                </div>
            `;
        }
    }
};

window.app = app;

// Initialize app when DOM loaded
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
