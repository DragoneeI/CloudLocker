import { useEffect, useState } from "react";

import {
    getUsers,
    getLockers,
    getUserLocker,
    forceReleaseUser,
    getLockerDetails,
    updateLockerStatus,
    releaseLocker,
    openLocker,
    closeLocker,
    createReservation,
    createAutoReservation,
    createUser
} from "../services/api";

import "./Dashboard.css";

function Dashboard() {
    const [users, setUsers] = useState([]);
    const [lockers, setLockers] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Active left-panel tab
    const [activeTab, setActiveTab] = useState("overview");

    // User modal
    const [selectedUser, setSelectedUser] = useState(null);
    const [userLocker, setUserLocker] = useState(null);
    const [loadingUser, setLoadingUser] = useState(false);
    const [releasing, setReleasing] = useState(false);
    const [showAddUserForm, setShowAddUserForm] = useState(false);
    const [newUserName, setNewUserName] = useState("");
    const [newUserEmail, setNewUserEmail] = useState("");
    const [addingUser, setAddingUser] = useState(false);

    // Locker modal
    const [selectedLocker, setSelectedLocker] = useState(null);
    const [lockerDetails, setLockerDetails] = useState(null);
    const [loadingLocker, setLoadingLocker] = useState(false);
    const [updatingLocker, setUpdatingLocker] = useState(false);
    const [controllingLocker, setControllingLocker] = useState(false);

    // Reservation form — User modal
    const [showReserveForm, setShowReserveForm] = useState(false);
    const [autoAssign, setAutoAssign] = useState(false);
    const [reserveLockerId, setReserveLockerId] = useState("");
    const [reserveStart, setReserveStart] = useState("");
    const [reserveEnd, setReserveEnd] = useState("");
    const [reserving, setReserving] = useState(false);

    // Reservation form — Locker modal
    const [showLockerReserveForm, setShowLockerReserveForm] = useState(false);
    const [reserveUserId, setReserveUserId] = useState("");
    const [lockerReserveStart, setLockerReserveStart] = useState("");
    const [lockerReserveEnd, setLockerReserveEnd] = useState("");
    const [lockerReserving, setLockerReserving] = useState(false);

    /*
     * =========================
     * LOAD DASHBOARD DATA
     * =========================
     */

    useEffect(() => {
        async function loadData() {
            try {
                const [usersData, lockersData] = await Promise.all([
                    getUsers(),
                    getLockers()
                ]);

                setUsers(usersData);
                setLockers(lockersData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, []);

    /*
     * =========================
     * USER FUNCTIONS
     * =========================
     */

    async function handleAddUser() {
        if (!newUserName.trim() || !newUserEmail.trim()) {
            alert("Please enter both name and email.");
            return;
        }

        setAddingUser(true);

        try {
            await createUser({
                full_name: newUserName.trim(),
                email: newUserEmail.trim(),
            });

            const usersData = await getUsers();
            setUsers(usersData);

            setShowAddUserForm(false);
            setNewUserName("");
            setNewUserEmail("");

            alert("User added successfully.");
        } catch (err) {
            alert(err.message);
        } finally {
            setAddingUser(false);
        }
    }

    async function handleUserClick(user) {
        setSelectedUser(user);
        setUserLocker(null);
        setLoadingUser(true);

        try {
            const lockerData = await getUserLocker(user.user_id);

            console.log("User locker response:", lockerData);

            /*
             * Backend response:
             *
             * {
             *     user_id: 1,
             *     locker: {
             *         locker_id: 1,
             *         locker_name: "L001",
             *         status: "Reserved",
             *         reservation_id: 11,
             *         start_time: "...",
             *         end_time: "..."
             *     }
             * }
             *
             * Store the locker object itself.
             *
             * The fallback also supports the case where
             * the API function returns the locker directly.
             */

            const locker = lockerData?.locker ?? lockerData ?? null;

            setUserLocker(locker);
        } catch (err) {
            console.error("Failed to load user locker:", err);
            setUserLocker(null);
        } finally {
            setLoadingUser(false);
        }
    }

    async function handleForceRelease() {
        if (!selectedUser) {
            return;
        }

        const confirmed = window.confirm(
            `Force end the reservation for ${selectedUser.full_name}?`
        );

        if (!confirmed) {
            return;
        }

        setReleasing(true);

        try {
            await forceReleaseUser(selectedUser.user_id);

            const [usersData, lockersData] = await Promise.all([
                getUsers(),
                getLockers()
            ]);

            setUsers(usersData);
            setLockers(lockersData);

            const updatedLockerData = await getUserLocker(
                selectedUser.user_id
            );

            setUserLocker(updatedLockerData?.locker || null);

            const updatedUser = usersData.find(
                user => user.user_id === selectedUser.user_id
            );

            setSelectedUser(updatedUser || selectedUser);

            alert("Reservation ended successfully.");
        } catch (err) {
            alert(err.message);
        } finally {
            setReleasing(false);
        }
    }

    async function handleCreateReservation() {
        if (!selectedUser) return;

        if (!reserveStart || !reserveEnd) {
            alert("Please set both start and end time.");
            return;
        }

        if (!autoAssign && !reserveLockerId) {
            alert("Please select a locker or switch on automatic assignment.");
            return;
        }

        setReserving(true);

        try {
            const payload = {
                user_id: selectedUser.user_id,
                start_time: new Date(reserveStart).toISOString(),
                end_time: new Date(reserveEnd).toISOString(),
            };

            if (autoAssign) {
                await createAutoReservation(payload);
            } else {
                await createReservation({
                    ...payload,
                    locker_id: Number(reserveLockerId),
                });
            }

            const [usersData, lockersData] = await Promise.all([
                getUsers(),
                getLockers(),
            ]);

            setUsers(usersData);
            setLockers(lockersData);

            const updatedLockerData = await getUserLocker(selectedUser.user_id);
            const locker = updatedLockerData?.locker ?? updatedLockerData ?? null;
            setUserLocker(locker);

            setShowReserveForm(false);
            setAutoAssign(false);
            setReserveLockerId("");
            setReserveStart("");
            setReserveEnd("");

            alert("Locker reserved successfully.");
        } catch (err) {
            alert(err.message);
        } finally {
            setReserving(false);
        }
    }

    async function handleCreateLockerReservation() {
        if (!selectedLocker) return;

        if (!reserveUserId) {
            alert("Please enter a user ID.");
            return;
        }

        if (!lockerReserveStart || !lockerReserveEnd) {
            alert("Please set both start and end time.");
            return;
        }

        setLockerReserving(true);

        try {
            await createReservation({
                user_id: Number(reserveUserId),
                locker_id: selectedLocker.locker_id,
                start_time: new Date(lockerReserveStart).toISOString(),
                end_time: new Date(lockerReserveEnd).toISOString(),
            });

            const [usersData, lockersData] = await Promise.all([
                getUsers(),
                getLockers(),
            ]);

            setUsers(usersData);
            setLockers(lockersData);

            const updatedLocker = lockersData.find(
                locker => locker.locker_id === selectedLocker.locker_id
            );
            setSelectedLocker(updatedLocker || selectedLocker);

            const details = await getLockerDetails(selectedLocker.locker_id);
            setLockerDetails(details);

            setShowLockerReserveForm(false);
            setReserveUserId("");
            setLockerReserveStart("");
            setLockerReserveEnd("");

            alert("Locker reserved successfully.");
        } catch (err) {
            alert(err.message);
        } finally {
            setLockerReserving(false);
        }
    }

    /*
     * =========================
     * LOCKER FUNCTIONS
     * =========================
     */

    async function handleLockerClick(locker) {
        setSelectedLocker(locker);
        setLockerDetails(null);
        setLoadingLocker(true);

        try {
            const data = await getLockerDetails(
                locker.locker_id
            );

            setLockerDetails(data);
        } catch (err) {
            console.error(err);
            alert(err.message);
        } finally {
            setLoadingLocker(false);
        }
    }

    async function handleOpenLocker() {
        if (!selectedLocker) {
            return;
        }

        setControllingLocker(true);

        try {
            const result = await openLocker(
                selectedLocker.locker_id
            );

            alert(
                result.message ||
                `Locker #${selectedLocker.locker_id} opened successfully.`
            );

            const [lockersData, details] = await Promise.all([
                getLockers(),
                getLockerDetails(selectedLocker.locker_id)
            ]);

            setLockers(lockersData);
            setLockerDetails(details);

            const updatedLocker = lockersData.find(
                locker =>
                    locker.locker_id ===
                    selectedLocker.locker_id
            );

            setSelectedLocker(
                updatedLocker || selectedLocker
            );

            // Automatically close after 5 seconds
            setTimeout(async () => {
                try {
                    await closeLocker(
                        selectedLocker.locker_id
                    );

                    const [updatedLockers, updatedDetails] =
                        await Promise.all([
                            getLockers(),
                            getLockerDetails(
                                selectedLocker.locker_id
                            )
                        ]);

                    setLockers(updatedLockers);
                    setLockerDetails(updatedDetails);

                    const closedLocker = updatedLockers.find(
                        locker =>
                            locker.locker_id ===
                            selectedLocker.locker_id
                    );

                    setSelectedLocker(
                        closedLocker || selectedLocker
                    );

                } catch (err) {
                    console.error(
                        "Failed to automatically close locker:",
                        err
                    );
                }
            }, 5000);

        } catch (err) {
            alert(err.message);
        } finally {
            setControllingLocker(false);
        }
    }

    async function handleCloseLocker() {
        if (!selectedLocker) {
            return;
        }

        setControllingLocker(true);

        try {
            const result = await closeLocker(
                selectedLocker.locker_id
            );

            alert(
                result.message ||
                `Locker #${selectedLocker.locker_id} closed successfully.`
            );

            const [lockersData, details] = await Promise.all([
                getLockers(),
                getLockerDetails(selectedLocker.locker_id)
            ]);

            setLockers(lockersData);
            setLockerDetails(details);

            const updatedLocker = lockersData.find(
                locker =>
                    locker.locker_id ===
                    selectedLocker.locker_id
            );

            setSelectedLocker(
                updatedLocker || selectedLocker
            );

        } catch (err) {
            alert(err.message);
        } finally {
            setControllingLocker(false);
        }
    }

    async function handleLockerStatusChange(status) {
        if (!selectedLocker) {
            return;
        }

        /*
         * A Reserved locker cannot be manually
         * changed to Offline.
         *
         * The reservation must be released first.
         */
        if (
            selectedLocker.status === "Reserved" &&
            status === "Offline"
        ) {
            alert(
                "This locker is currently reserved. Release the locker before setting it Offline."
            );
            return;
        }

        /*
         * Only Available and Offline are allowed
         * as manual locker status changes.
         */
        if (
            status !== "Available" &&
            status !== "Offline"
        ) {
            return;
        }

        if (selectedLocker.status === status) {
            return;
        }

        setUpdatingLocker(true);

        try {
            await updateLockerStatus(
                selectedLocker.locker_id,
                status
            );

            const [usersData, lockersData] = await Promise.all([
                getUsers(),
                getLockers()
            ]);

            setUsers(usersData);
            setLockers(lockersData);

            const updatedLocker = lockersData.find(
                locker =>
                    locker.locker_id ===
                    selectedLocker.locker_id
            );

            const newSelectedLocker =
                updatedLocker || selectedLocker;

            setSelectedLocker(newSelectedLocker);

            const details = await getLockerDetails(
                selectedLocker.locker_id
            );

            setLockerDetails(details);
        } catch (err) {
            alert(err.message);
        } finally {
            setUpdatingLocker(false);
        }
    }

    async function handleReleaseLocker() {
        if (!selectedLocker) {
            return;
        }

        const confirmed = window.confirm(
            `Release locker #${selectedLocker.locker_id}?`
        );

        if (!confirmed) {
            return;
        }

        setUpdatingLocker(true);

        try {
            await releaseLocker(
                selectedLocker.locker_id
            );

            const [usersData, lockersData] = await Promise.all([
                getUsers(),
                getLockers()
            ]);

            setUsers(usersData);
            setLockers(lockersData);

            const updatedLocker = lockersData.find(
                locker =>
                    locker.locker_id ===
                    selectedLocker.locker_id
            );

            const newSelectedLocker =
                updatedLocker || selectedLocker;

            setSelectedLocker(newSelectedLocker);

            const details = await getLockerDetails(
                selectedLocker.locker_id
            );

            setLockerDetails(details);

            alert("Locker released successfully.");
        } catch (err) {
            alert(err.message);
        } finally {
            setUpdatingLocker(false);
        }
    }

    /*
     * =========================
     * CLOSE MODALS
     * =========================
     */

    function closeUserModal() {
        if (releasing) {
            return;
        }

        setSelectedUser(null);
        setUserLocker(null);
        setShowReserveForm(false);
        setAutoAssign(false);
        setReserveLockerId("");
        setReserveStart("");
        setReserveEnd("");
    }

    function closeLockerModal() {
        if (updatingLocker || controllingLocker) {
            return;
        }

        setSelectedLocker(null);
        setLockerDetails(null);
        setShowLockerReserveForm(false);
        setReserveUserId("");
        setLockerReserveStart("");
        setLockerReserveEnd("");
    }

    /*
     * =========================
     * LOADING / ERROR
     * =========================
     */

    if (loading) {
        return (
            <div className="dashboard-message">
                Loading...
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-message error">
                Error: {error}
            </div>
        );
    }

    /*
     * =========================
     * STATISTICS
     * =========================
     */

    const availableLockers = lockers.filter(
        locker => locker.status === "Available"
    ).length;

    const reservedLockers = lockers.filter(
        locker => locker.status === "Reserved"
    ).length;

    const offlineLockers = lockers.filter(
        locker => locker.status === "Offline"
    ).length;

    const activeUsers = users.filter(
        user => user.is_active
    ).length;

    const deactivatedUsers = users.filter(
        user => !user.is_active
    ).length;

    const sortedLockers = [...lockers].sort(
        (a, b) => a.locker_id - b.locker_id
    );

    const sortedUsers = [...users].sort(
        (a, b) => a.user_id - b.user_id
    );

    /*
     * =========================
     * OVERVIEW TAB
     * =========================
     */

    function renderOverview() {
        return (
            <>
                <div className="page-title">
                    <h1>Overview</h1>

                    <p>
                        SmartLocker system overview
                    </p>
                </div>

                <section className="stats-grid">

                    <div className="stat-card">
                        <div className="stat-icon">
                            👤
                        </div>

                        <div>
                            <p>Total Users</p>
                            <h2>{users.length}</h2>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">
                            🔐
                        </div>

                        <div>
                            <p>Total Lockers</p>
                            <h2>{lockers.length}</h2>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">
                            ✓
                        </div>

                        <div>
                            <p>Available</p>
                            <h2>{availableLockers}</h2>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">
                            🔒
                        </div>

                        <div>
                            <p>Reserved</p>
                            <h2>{reservedLockers}</h2>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">
                            ⚠
                        </div>

                        <div>
                            <p>Offline</p>
                            <h2>{offlineLockers}</h2>
                        </div>
                    </div>

                </section>


            </>
        );
    }

    /*
     * =========================
     * LOCKERS TAB
     * =========================
     */

    function renderLockers() {
        return (
            <>

                <section className="dashboard-section">

                    <div className="section-header">

                        <div>
                            <h2>Lockers Status</h2>

                            <p>
                                Current status of all lockers
                            </p>
                        </div>

                    </div>

                    <div className="locker-grid">

                        {sortedLockers.map(locker => (

                            <div
                                className={`locker-card ${locker.status.toLowerCase()}`}
                                key={locker.locker_id}
                                onClick={() =>
                                    handleLockerClick(locker)
                                }
                                role="button"
                                tabIndex={0}
                                onKeyDown={event => {

                                    if (
                                        event.key === "Enter" ||
                                        event.key === " "
                                    ) {
                                        event.preventDefault();

                                        handleLockerClick(
                                            locker
                                        );
                                    }

                                }}
                            >

                                <div className="locker-card-header">

                                    <span className="locker-number">
                                        #{locker.locker_id}
                                    </span>

                                    <span className="status-badge">
                                        {locker.status}
                                    </span>

                                </div>

                                <h3>
                                    {locker.locker_name}
                                </h3>

                                {locker.status === "Reserved" && (
                                    <p className="locker-user">
                                        Reserved
                                    </p>
                                )}

                                {locker.status === "Available" && (
                                    <p className="locker-user">
                                        Ready to use
                                    </p>
                                )}

                                {locker.status === "Offline" && (
                                    <p className="locker-user">
                                        Currently unavailable
                                    </p>
                                )}

                            </div>

                        ))}

                    </div>

                </section>
            </>
        );
    }

    /*
     * =========================
     * USERS TAB
     * =========================
     */

    function renderUsers() {
        return (
            <>

                <section className="dashboard-section">

                    <div className="section-header">

                       <div>
                            <div className="section-title-row">
                                <h2>Users</h2>
                                <button
                                    className="add-user-button"
                                    onClick={() => setShowAddUserForm(true)}
                                >
                                    + Add User
                                </button>
                            </div>
                            <p>Registered SmartLocker users</p>
                        </div>

                        <div className="user-summary">

                            <span className="summary-active">
                                {activeUsers} Active
                            </span>

                            <span className="summary-inactive">
                                {deactivatedUsers} Deactivated
                            </span>

                        </div>

                    </div>

                    <div className="users-list">

                        {sortedUsers.map(user => (

                            <div
                                className={`user-card ${
                                    !user.is_active
                                        ? "deactivated"
                                        : ""
                                }`}
                                key={user.user_id}
                                onClick={() =>
                                    handleUserClick(user)
                                }
                                role="button"
                                tabIndex={0}
                                onKeyDown={event => {

                                    if (
                                        event.key === "Enter" ||
                                        event.key === " "
                                    ) {
                                        event.preventDefault();

                                        handleUserClick(
                                            user
                                        );
                                    }

                                }}
                            >

                                <div className="user-avatar">
                                    {user.full_name
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>

                                <div className="user-info">

                                    <div className="user-name-row">

                                        <h3>
                                            {user.full_name}
                                        </h3>

                                        <span
                                            className={`user-status ${
                                                user.is_active
                                                    ? "active"
                                                    : "inactive"
                                            }`}
                                        >
                                            {user.is_active
                                                ? "Active"
                                                : "Deactivated"}
                                        </span>

                                    </div>

                                    <p>
                                        User ID: {user.user_id}
                                    </p>

                                </div>

                            </div>

                        ))}

                    </div>

                </section>
            </>
        );
    }

    /*
     * =========================
     * ACCESS LOG TAB
     * =========================
     *
     * IMPORTANT:
     * This uses the reservation/access information
     * already available from the existing API.
     *
     * It does NOT change the backend.
     */

    function renderAccessLog() {
        const activeAccess = sortedLockers.filter(
            locker => locker.status === "Reserved"
        );

        return (
            <>
                <div className="page-title">

                    <h1>Access Log</h1>

                    <p>
                        Monitor current locker access
                    </p>

                </div>

                <section className="dashboard-section">

                    <div className="section-header">

                        <div>
                            <h2>Current Access</h2>

                            <p>
                                Active locker access assignments
                            </p>
                        </div>

                    </div>

                    {activeAccess.length === 0 ? (

                        <div className="empty-state">

                            <div>
                                🔓
                            </div>

                            <h3>
                                No active access
                            </h3>

                            <p>
                                There are currently no active
                                locker access assignments.
                            </p>

                        </div>

                    ) : (

                        <div className="access-log-list">

                            {activeAccess.map(locker => (

                                <div
                                    className="access-log-item"
                                    key={locker.locker_id}
                                    onClick={() =>
                                        handleLockerClick(
                                            locker
                                        )
                                    }
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={event => {

                                        if (
                                            event.key === "Enter" ||
                                            event.key === " "
                                        ) {
                                            event.preventDefault();

                                            handleLockerClick(
                                                locker
                                            );
                                        }

                                    }}
                                >

                                    <div className="access-log-icon">
                                        🔒
                                    </div>

                                    <div className="access-log-info">

                                        <h3>
                                            {locker.locker_name}
                                        </h3>

                                        <p>
                                            Locker #
                                            {locker.locker_id}
                                        </p>

                                    </div>

                                    <div className="access-log-status">

                                        <span className="status-badge reserved">
                                            Reserved
                                        </span>

                                        <span>
                                            View details →
                                        </span>

                                    </div>

                                </div>

                            ))}

                        </div>

                    )}

                </section>
            </>
        );
    }

    /*
     * =========================
     * TAB CONTENT
     * =========================
     */

    function renderTabContent() {
        switch (activeTab) {
            case "lockers":
                return renderLockers();

            case "users":
                return renderUsers();

            case "access":
                return renderAccessLog();

            case "overview":
            default:
                return renderOverview();
        }
    }

    /*
     * =========================
     * RENDER
     * =========================
     */

    return (
        <div className="dashboard-layout">

            {/* LEFT SIDEBAR */}

            <aside className="dashboard-sidebar">

                <div className="sidebar-brand">

                    <div className="sidebar-logo">
                        🔐
                    </div>

                    <div>
                        <h2>SmartLocker</h2>

                        <span>
                            Management
                        </span>
                    </div>

                </div>

                <nav className="sidebar-nav">

                    <button
                        className={`sidebar-nav-item ${
                            activeTab === "overview"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            setActiveTab("overview")
                        }
                    >
                        <span className="sidebar-icon">
                            📊
                        </span>

                        <span>
                            Overview
                        </span>
                    </button>

                    <button
                        className={`sidebar-nav-item ${
                            activeTab === "lockers"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            setActiveTab("lockers")
                        }
                    >
                        <span className="sidebar-icon">
                            🔐
                        </span>

                        <span>
                            Lockers
                        </span>
                    </button>

                    <button
                        className={`sidebar-nav-item ${
                            activeTab === "users"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            setActiveTab("users")
                        }
                    >
                        <span className="sidebar-icon">
                            👥
                        </span>

                        <span>
                            Users
                        </span>
                    </button>

                    <button
                        className={`sidebar-nav-item ${
                            activeTab === "access"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            setActiveTab("access")
                        }
                    >
                        <span className="sidebar-icon">
                            📋
                        </span>

                        <span>
                            Access Log
                        </span>
                    </button>

                </nav>

                <div className="sidebar-footer">

                    <div className="sidebar-status-dot"></div>

                    <div>

                        <span className="sidebar-status-title">
                            System Online
                        </span>

                        <span className="sidebar-status-text">
                            SmartLocker connected
                        </span>

                    </div>

                </div>

            </aside>

            {/* MAIN CONTENT */}

            <main className="dashboard-main">

                {renderTabContent()}

            </main>

            {/* USER MODAL */}

            {selectedUser && (

                <div
                    className="user-modal-overlay"
                    onClick={closeUserModal}
                >

                    <div
                        className="user-modal"
                        onClick={event =>
                            event.stopPropagation()
                        }
                    >

                        <div className="user-modal-header">

                            <div>

                                <h2>
                                    {selectedUser.full_name}
                                </h2>

                                <p>
                                    User ID:{" "}
                                    {selectedUser.user_id}
                                </p>

                            </div>

                            <button
                                className="modal-close"
                                onClick={closeUserModal}
                            >
                                ×
                            </button>

                        </div>

                        <div className="user-modal-status">

                            <span
                                className={`user-status ${
                                    selectedUser.is_active
                                        ? "active"
                                        : "inactive"
                                }`}
                            >
                                {selectedUser.is_active
                                    ? "Active"
                                    : "Deactivated"}
                            </span>

                        </div>

                        <div className="user-modal-info">
                            
                            <div className="info-item">
                                <span>Door</span>
                                <strong>{userLocker ? (userLocker.is_open ? "Open" : "Closed") : "N/A"}</strong>
                            </div>

                            <div className="info-item">

                                <span>
                                    Email
                                </span>

                                <strong>
                                    {selectedUser.email ||
                                        "Not available"}
                                </strong>

                            </div>

                            <div className="info-item">

                                <span>
                                    Locker
                                </span>

                                {loadingUser ? (

                                    <strong>
                                        Loading...
                                    </strong>

                                ) : userLocker ? (

                                    <strong>
                                        Locker #
                                        {userLocker.locker_id}
                                    </strong>

                                ) : (

                                    <strong>
                                        No locker assigned
                                    </strong>

                                )}

                            </div>

                        </div>
                        {!userLocker && selectedUser.is_active && (

                            <div className="reservation-box">

                                {!showReserveForm ? (

                                    <button
                                        className="force-release-button"
                                        onClick={() => setShowReserveForm(true)}
                                    >
                                        Create a Reservation
                                    </button>

                                ) : (

                                    <>
                                        <h3>Create a Reservation</h3>

                                        <div className="info-item">
                                            <span>Automatic Locker Assignment</span>
                                            <label className="switch">
                                                <input
                                                    type="checkbox"
                                                    checked={autoAssign}
                                                    onChange={e => {
                                                        setAutoAssign(e.target.checked);
                                                        setReserveLockerId("");
                                                    }}
                                                />
                                                <span className="slider" />
                                            </label>
                                        </div>

                                        {!autoAssign && (
                                            <div className="info-item">
                                                <span>Locker</span>
                                                <select
                                                    value={reserveLockerId}
                                                    onChange={e => setReserveLockerId(e.target.value)}
                                                >
                                                    <option value="">Select a locker</option>
                                                    {lockers
                                                        .filter(l => l.status === "Available")
                                                        .map(l => (
                                                            <option key={l.locker_id} value={l.locker_id}>
                                                                {l.locker_name} (#{l.locker_id})
                                                            </option>
                                                        ))}
                                                </select>
                                            </div>
                                        )}

                                        <div className="info-item">
                                            <span>Start Time</span>
                                            <input
                                                type="datetime-local"
                                                value={reserveStart}
                                                onChange={e => setReserveStart(e.target.value)}
                                            />
                                        </div>

                                        <div className="info-item">
                                            <span>End Time</span>
                                            <input
                                                type="datetime-local"
                                                value={reserveEnd}
                                                onChange={e => setReserveEnd(e.target.value)}
                                            />
                                        </div>

                                        <button
                                            className="force-release-button"
                                            onClick={handleCreateReservation}
                                            disabled={reserving}
                                        >
                                            {reserving ? "Reserving..." : "Confirm Reservation"}
                                        </button>

                                        <button
                                            className="modal-close"
                                            onClick={() => {
                                                setShowReserveForm(false);
                                                setAutoAssign(false);
                                                setReserveLockerId("");
                                            }}
                                            disabled={reserving}
                                        >
                                            Cancel
                                        </button>
                                    </>

                                )}

                            </div>

                        )}

                        {userLocker && (

                            <div className="reservation-box">

                                <h3>
                                    Current Access
                                </h3>

                                <div className="reservation-details">

                                    <div>
                                        <span>
                                            Locker
                                        </span>

                                        <strong>
                                            #{userLocker.locker_id}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Locker Name
                                        </span>

                                        <strong>
                                            {userLocker.locker_name ||
                                                "Not available"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Status
                                        </span>

                                        <strong>
                                            {userLocker.status ||
                                                "Reserved"}
                                        </strong>
                                    </div>

                                    {userLocker.start_time && (
                                        <div>
                                            <span>
                                                Start
                                            </span>

                                            <strong>
                                                {new Date(
                                                    userLocker.start_time
                                                ).toLocaleString()}
                                            </strong>
                                        </div>
                                    )}

                                    {userLocker.end_time && (
                                        <div>
                                            <span>
                                                End
                                            </span>

                                            <strong>
                                                {new Date(
                                                    userLocker.end_time
                                                ).toLocaleString()}
                                            </strong>
                                        </div>
                                    )}

                                </div>

                                {selectedUser.is_active && (

                                    <button
                                        className="force-release-button"
                                        onClick={
                                            handleForceRelease
                                        }
                                        disabled={releasing}
                                    >
                                        {releasing
                                            ? "Ending Access..."
                                            : "Force End Access"}
                                    </button>

                                )}

                            </div>

                        )}

                    </div>

                </div>

            )}

            {/* ADD USER MODAL */}

            {showAddUserForm && (

                <div
                    className="user-modal-overlay"
                    onClick={() => !addingUser && setShowAddUserForm(false)}
                >

                    <div
                        className="user-modal"
                        onClick={event => event.stopPropagation()}
                    >

                        <div className="user-modal-header">

                            <div>
                                <h2>Add User</h2>
                                <p>Create a new SmartLocker user</p>
                            </div>

                            <button
                                className="modal-close"
                                onClick={() => setShowAddUserForm(false)}
                                disabled={addingUser}
                            >
                                ×
                            </button>

                        </div>

                        <div className="reservation-box">

                            <div className="info-item">
                                <span>Full Name</span>
                                <input
                                    type="text"
                                    value={newUserName}
                                    onChange={e => setNewUserName(e.target.value)}
                                    placeholder="Enter full name"
                                />
                            </div>

                            <div className="info-item">
                                <span>Email</span>
                                <input
                                    type="email"
                                    value={newUserEmail}
                                    onChange={e => setNewUserEmail(e.target.value)}
                                    placeholder="Enter email"
                                />
                            </div>

                            <button
                                className="force-release-button"
                                onClick={handleAddUser}
                                disabled={addingUser}
                            >
                                {addingUser ? "Adding..." : "Add User"}
                            </button>

                        </div>

                    </div>

                </div>

            )}

            {/* LOCKER MODAL */}

            {selectedLocker && (

                <div
                    className="user-modal-overlay"
                    onClick={closeLockerModal}
                >

                    <div
                        className="user-modal locker-modal"
                        onClick={event =>
                            event.stopPropagation()
                        }
                    >

                        <div className="user-modal-header">

                            <div>

                                <h2>
                                    {selectedLocker.locker_name}
                                </h2>

                                <p>
                                    Locker #
                                    {selectedLocker.locker_id}
                                </p>

                            </div>

                            <button
                                className="modal-close"
                                onClick={closeLockerModal}
                            >
                                ×
                            </button>

                        </div>

                        <div className="user-modal-status">

                            <span
                                className={`status-badge ${selectedLocker.status.toLowerCase()}`}
                            >
                                {selectedLocker.status}
                            </span>

                        </div>

                        {loadingLocker ? (

                            <div className="locker-modal-loading">
                                Loading locker details...
                            </div>

                        ) : (

                            <>

                                <div className="user-modal-info">

                                    <div className="info-item">

                                        <span>
                                            Locker ID
                                        </span>

                                        <strong>
                                            #{selectedLocker.locker_id}
                                        </strong>

                                    </div>

                                    <div className="info-item">

                                        <span>
                                            Locker Name
                                        </span>

                                        <strong>
                                            {selectedLocker.locker_name}
                                        </strong>

                                    </div>

                                    <div className="info-item">

                                        <span>
                                            Current Status
                                        </span>

                                        <strong>
                                            {selectedLocker.status}
                                        </strong>

                                    </div>

                                </div>

                                {lockerDetails?.user && (

                                    <div className="reservation-box">

                                        <h3>
                                            Assigned User
                                        </h3>

                                        <div className="reservation-details">

                                            <div>
                                                <span>
                                                    User
                                                </span>

                                                <strong>
                                                    {
                                                        lockerDetails.user.full_name
                                                    }
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    User ID
                                                </span>

                                                <strong>
                                                    #
                                                    {
                                                        lockerDetails.user.user_id
                                                    }
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Email
                                                </span>

                                                <strong>
                                                    {
                                                        lockerDetails.user.email ||
                                                        "Not available"
                                                    }
                                                </strong>
                                            </div>

                                        </div>

                                    </div>

                                )}

                                {lockerDetails?.reservation && (

                                    <div className="reservation-box">

                                        <h3>
                                            Access Information
                                        </h3>

                                        <div className="reservation-details">

                                            <div>
                                                <span>
                                                    Reservation ID
                                                </span>

                                                <strong>
                                                    #
                                                    {
                                                        lockerDetails
                                                            .reservation
                                                            .reservation_id
                                                    }
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Status
                                                </span>

                                                <strong>
                                                    {
                                                        lockerDetails
                                                            .reservation
                                                            .status
                                                    }
                                                </strong>
                                            </div>

                                            {lockerDetails.reservation.start_time && (

                                                <div>
                                                    <span>
                                                        Start
                                                    </span>

                                                    <strong>
                                                        {new Date(
                                                            lockerDetails
                                                                .reservation
                                                                .start_time
                                                        ).toLocaleString()}
                                                    </strong>
                                                </div>

                                            )}

                                            {lockerDetails.reservation.end_time && (

                                                <div>
                                                    <span>
                                                        End
                                                    </span>

                                                    <strong>
                                                        {new Date(
                                                            lockerDetails
                                                                .reservation
                                                                .end_time
                                                        ).toLocaleString()}
                                                    </strong>
                                                </div>

                                            )}

                                        </div>

                                    </div>

                                )}

                                {!lockerDetails?.reservation && (

                                    <div className="reservation-box">

                                        <h3>
                                            Access Information
                                        </h3>

                                        <p>
                                            No active access assignment.
                                        </p>

                                    </div>

                                )}

                                {selectedLocker.status === "Available" && (

                                    <div className="reservation-box">

                                        {!showLockerReserveForm ? (

                                            <button
                                                className="force-release-button"
                                                onClick={() => setShowLockerReserveForm(true)}
                                            >
                                                Create a Reservation
                                            </button>

                                        ) : (

                                            <>
                                                <h3>Create a Reservation</h3>

                                                <div className="info-item">
                                                    <span>User ID</span>
                                                    <input
                                                        type="number"
                                                        value={reserveUserId}
                                                        onChange={e => setReserveUserId(e.target.value)}
                                                        placeholder="Enter user ID"
                                                    />
                                                </div>

                                                <div className="info-item">
                                                    <span>Start Time</span>
                                                    <input
                                                        type="datetime-local"
                                                        value={lockerReserveStart}
                                                        onChange={e => setLockerReserveStart(e.target.value)}
                                                    />
                                                </div>

                                                <div className="info-item">
                                                    <span>End Time</span>
                                                    <input
                                                        type="datetime-local"
                                                        value={lockerReserveEnd}
                                                        onChange={e => setLockerReserveEnd(e.target.value)}
                                                    />
                                                </div>

                                                <button
                                                    className="force-release-button"
                                                    onClick={handleCreateLockerReservation}
                                                    disabled={lockerReserving}
                                                >
                                                    {lockerReserving ? "Reserving..." : "Confirm Reservation"}
                                                </button>

                                                <button
                                                    className="modal-close"
                                                    onClick={() => setShowLockerReserveForm(false)}
                                                    disabled={lockerReserving}
                                                >
                                                    Cancel
                                                </button>
                                            </>

                                        )}

                                    </div>

                                )}

                                <div className="locker-controls">

                                    <h3>
                                        Locker Controls
                                    </h3>

                                    <p>
                                        Control the locker door or change its system status.
                                    </p>

                                    {!loadingLocker && (

                                        <div className="locker-door modal-door">
                                            <div
                                                className={`locker-door-panel ${
                                                    selectedLocker.is_open ? "is-open" : ""
                                                }`}
                                            >
                                                <div className="locker-handle">▪</div>
                                            </div>
                                        </div>

                                    )}

                                    <div className="locker-door-buttons">

                                        <button
                                            className="locker-door-button open"
                                            onClick={handleOpenLocker}
                                            disabled={
                                                controllingLocker ||
                                                selectedLocker.status !== "Reserved"
                                            }
                                        >
                                            {controllingLocker
                                                ? "Processing..."
                                                : "🔓 Open Locker"}
                                        </button>

                                        <button
                                            className="locker-door-button close"
                                            onClick={handleCloseLocker}
                                            disabled={controllingLocker}
                                        >
                                            {controllingLocker
                                                ? "Processing..."
                                                : "🔒 Close Locker"}
                                        </button>

                                    </div>

                                    <div className="locker-status-buttons">

                                        <button
                                            className={`locker-status-button available ${
                                                selectedLocker.status ===
                                                "Available"
                                                    ? "selected"
                                                    : ""
                                            }`}
                                            onClick={() =>
                                                handleLockerStatusChange(
                                                    "Available"
                                                )
                                            }
                                            disabled={
                                                updatingLocker
                                            }
                                        >
                                            Available
                                        </button>

                                        <button
                                            className={`locker-status-button offline ${
                                                selectedLocker.status ===
                                                "Offline"
                                                    ? "selected"
                                                    : ""
                                            }`}
                                            onClick={() =>
                                                handleLockerStatusChange(
                                                    "Offline"
                                                )
                                            }
                                            disabled={
                                                updatingLocker ||
                                                selectedLocker.status ===
                                                    "Reserved"
                                            }
                                            title={
                                                selectedLocker.status ===
                                                "Reserved"
                                                    ? "Release the reservation before setting this locker Offline"
                                                    : ""
                                            }
                                        >
                                            Offline
                                        </button>

                                    </div>

                                    {selectedLocker.status ===
                                        "Reserved" && (

                                        <div className="locker-reserved-warning">
                                            <strong>
                                                This locker is reserved.
                                            </strong>

                                            <p>
                                                You must release the
                                                current reservation
                                                before the locker can
                                                be set to Offline.
                                            </p>
                                        </div>

                                    )}

                                    {selectedLocker.status ===
                                        "Reserved" && (

                                        <button
                                            className="force-release-button"
                                            onClick={
                                                handleReleaseLocker
                                            }
                                            disabled={
                                                updatingLocker
                                            }
                                        >
                                            {updatingLocker
                                                ? "Releasing..."
                                                : "Release Locker"}
                                        </button>

                                    )}

                                </div>

                            </>

                        )}

                    </div>

                </div>

            )}

        </div>
    );
}

export default Dashboard;