import { useEffect, useState } from "react";

import {
    getUsers,
    getLockers,
    getUserLocker,
    forceReleaseUser,
    getLockerDetails,
    updateLockerStatus,
    releaseLocker
} from "../services/api";

import "./Dashboard.css";

function Dashboard() {
    const [users, setUsers] = useState([]);
    const [lockers, setLockers] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // User modal
    const [selectedUser, setSelectedUser] = useState(null);
    const [userLocker, setUserLocker] = useState(null);
    const [loadingUser, setLoadingUser] = useState(false);
    const [releasing, setReleasing] = useState(false);

    // Locker modal
    const [selectedLocker, setSelectedLocker] = useState(null);
    const [lockerDetails, setLockerDetails] = useState(null);
    const [loadingLocker, setLoadingLocker] = useState(false);
    const [updatingLocker, setUpdatingLocker] = useState(false);

    /*
     * LOAD DASHBOARD DATA
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

            /*
             * Reload the user's locker after release.
             */
            const updatedLockerData = await getUserLocker(
                selectedUser.user_id
            );

            const updatedLocker =
                updatedLockerData?.locker ??
                updatedLockerData ??
                null;

            setUserLocker(updatedLocker);

            /*
             * Update selected user.
             */
            const updatedUser = usersData.find(
                user =>
                    user.user_id === selectedUser.user_id
            );

            setSelectedUser(
                updatedUser || selectedUser
            );

            alert("Reservation ended successfully.");
        } catch (err) {
            alert(err.message);
        } finally {
            setReleasing(false);
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

    async function handleLockerStatusChange(status) {
        if (!selectedLocker) {
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

            setSelectedLocker(
                updatedLocker || selectedLocker
            );

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

            const lockersData = await getLockers();

            setLockers(lockersData);

            const updatedLocker = lockersData.find(
                locker =>
                    locker.locker_id ===
                    selectedLocker.locker_id
            );

            setSelectedLocker(
                updatedLocker || selectedLocker
            );

            const details = await getLockerDetails(
                selectedLocker.locker_id
            );

            setLockerDetails(details);

            const usersData = await getUsers();

            setUsers(usersData);

            /*
             * If a user modal is currently open,
             * refresh its reservation too.
             */
            if (selectedUser) {
                const updatedLockerData =
                    await getUserLocker(
                        selectedUser.user_id
                    );

                const updatedUserLocker =
                    updatedLockerData?.locker ??
                    updatedLockerData ??
                    null;

                setUserLocker(updatedUserLocker);
            }

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
    }

    function closeLockerModal() {
        if (updatingLocker) {
            return;
        }

        setSelectedLocker(null);
        setLockerDetails(null);
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

    /*
     * =========================
     * SORTING
     * =========================
     */

    const sortedLockers = [...lockers].sort(
        (a, b) => a.locker_id - b.locker_id
    );

    const sortedUsers = [...users].sort(
        (a, b) => a.user_id - b.user_id
    );

    /*
     * =========================
     * RENDER
     * =========================
     */

    return (
        <div className="dashboard">

            {/* HEADER */}

            <header className="dashboard-header">
                <div>
                    <h1>SmartLocker</h1>

                    <p>
                        Locker management dashboard
                    </p>
                </div>
            </header>


            {/* SUMMARY CARDS */}

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


            {/* LOCKER STATUS */}

            <section className="dashboard-section">

                <div className="section-header">

                    <div>
                        <h2>Locker Status</h2>

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


            {/* USERS */}

            <section className="dashboard-section">

                <div className="section-header">

                    <div>
                        <h2>Users</h2>

                        <p>
                            Registered SmartLocker users
                        </p>
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


            {/* USER DETAILS MODAL */}

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


                        {/* RESERVATION */}

                        {userLocker && (

                            <div className="reservation-box">

                                <h3>
                                    Reservation
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
                                            Reservation ID
                                        </span>

                                        <strong>
                                            #{userLocker.reservation_id}
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
                                            ? "Ending Reservation..."
                                            : "Force End Reservation"}
                                    </button>

                                )}

                            </div>

                        )}

                    </div>

                </div>

            )}


            {/* LOCKER DETAILS MODAL */}

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
                                            Reservation
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
                                            Reservation
                                        </h3>

                                        <p>
                                            No active reservation.
                                        </p>

                                    </div>

                                )}


                                <div className="locker-controls">

                                    <h3>
                                        Locker Controls
                                    </h3>

                                    <p>
                                        Change the current locker
                                        status.
                                    </p>


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
                                            disabled={updatingLocker}
                                        >
                                            Available
                                        </button>


                                        <button
                                            className={`locker-status-button reserved ${
                                                selectedLocker.status ===
                                                "Reserved"
                                                    ? "selected"
                                                    : ""
                                            }`}
                                            onClick={() =>
                                                handleLockerStatusChange(
                                                    "Reserved"
                                                )
                                            }
                                            disabled={updatingLocker}
                                        >
                                            Reserved
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
                                            disabled={updatingLocker}
                                        >
                                            Offline
                                        </button>

                                    </div>


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
