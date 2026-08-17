import { useEffect, useState } from "react";
import {
    getLockers,
    getLockerDetails,
    openLocker,
    closeLocker,
    getDoors,
    getDoorDetails,
    openDoor,
    closeDoor
} from "../services/api";

import "./Lockers.css";

function Lockers() {

    /*
     * =========================
     * VIEW TOGGLE
     * =========================
     */

    const [view, setView] = useState("lockers"); // "lockers" | "doors"

    /*
     * =========================
     * LOCKER STATE
     * =========================
     */

    const [lockers, setLockers] = useState([]);
    const [selectedLocker, setSelectedLocker] = useState(null);
    const [lockerDetails, setLockerDetails] = useState(null);

    const [loading, setLoading] = useState(true);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [openingLocker, setOpeningLocker] = useState(false);
    const [doorOpen, setDoorOpen] = useState(false);

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [displayLockers, setDisplayLockers] = useState([]);

    /*
     * =========================
     * DOOR STATE
     * =========================
     */

    const [doors, setDoors] = useState([]);
    const [selectedDoor, setSelectedDoor] = useState(null);
    const [doorDetails, setDoorDetails] = useState(null);

    const [loadingDoorDetails, setLoadingDoorDetails] = useState(false);
    const [openingDoor, setOpeningDoor] = useState(false);
    const [doorPanelOpen, setDoorPanelOpen] = useState(false);

    const [doorError, setDoorError] = useState("");
    const [doorMessage, setDoorMessage] = useState("");
    const [displayDoors, setDisplayDoors] = useState([]);

    /*
     * =========================
     * LOCKER DATA LOADING
     * =========================
     */

    async function loadLockers(animateOpenDoors = false) {
        try {
            setError("");

            const data = await getLockers();

            setLockers(data);

            if (animateOpenDoors) {
                // Render everything closed first...
                setDisplayLockers(
                    data.map(locker => ({ ...locker, is_open: false }))
                );

                // ...then apply the real state on the next tick,
                // so any locker that's actually open animates in.
                setTimeout(() => {
                    setDisplayLockers(data);
                }, 50);
            } else {
                setDisplayLockers(data);
            }
        } catch (err) {
            setError(err.message);
        }
    }

    /*
     * =========================
     * DOOR DATA LOADING
     * =========================
     */

    async function loadDoors(animateOpenDoors = false) {
        try {
            setDoorError("");

            const data = await getDoors();

            setDoors(data);

            if (animateOpenDoors) {
                setDisplayDoors(
                    data.map(door => ({ ...door, is_open: false }))
                );

                setTimeout(() => {
                    setDisplayDoors(data);
                }, 50);
            } else {
                setDisplayDoors(data);
            }
        } catch (err) {
            setDoorError(err.message);
        }
    }

    /*
     * =========================
     * INITIAL LOAD
     * =========================
     */

    useEffect(() => {
        async function loadData() {
            try {
                await Promise.all([
                    loadLockers(true),
                    loadDoors(true)
                ]);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, []);

    /*
     * =========================
     * LOCKER POLLING
     * =========================
     */

    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const data = await getLockers();

                setLockers(currentLockers => {
                    setDisplayLockers(currentDisplay => {
                        const changed = data.some(newLocker => {
                            const oldLocker = currentDisplay.find(
                                l => l.locker_id === newLocker.locker_id
                            );
                            return oldLocker && !oldLocker.is_open && newLocker.is_open;
                        });

                        if (changed) {
                            const closedVersion = currentDisplay.map(l => {
                                const updated = data.find(d => d.locker_id === l.locker_id);
                                return updated ? { ...updated, is_open: l.is_open } : l;
                            });

                            setTimeout(() => setDisplayLockers(data), 50);
                            return closedVersion;
                        }

                        return data;
                    });

                    return data;
                });
            } catch (err) {
                console.error("Locker polling error:", err);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    /*
     * =========================
     * DOOR POLLING
     * =========================
     */

    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const data = await getDoors();

                setDoors(currentDoors => {
                    setDisplayDoors(currentDisplay => {
                        const changed = data.some(newDoor => {
                            const oldDoor = currentDisplay.find(
                                d => d.door_id === newDoor.door_id
                            );
                            return oldDoor && !oldDoor.is_open && newDoor.is_open;
                        });

                        if (changed) {
                            const closedVersion = currentDisplay.map(d => {
                                const updated = data.find(u => u.door_id === d.door_id);
                                return updated ? { ...updated, is_open: d.is_open } : d;
                            });

                            setTimeout(() => setDisplayDoors(data), 50);
                            return closedVersion;
                        }

                        return data;
                    });

                    return data;
                });
            } catch (err) {
                console.error("Door polling error:", err);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    /*
     * =========================
     * LOCKER CLICK / OPEN / CLOSE
     * =========================
     */

    async function handleLockerClick(locker) {
        setSelectedLocker(locker);
        setLockerDetails(null);
        setDoorOpen(Boolean(locker.is_open));
        setMessage("");
        setLoadingDetails(true);

        try {
            const data = await getLockerDetails(locker.locker_id);
            setLockerDetails(data);
            setDoorOpen(Boolean(data.is_open));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingDetails(false);
        }
    }

    async function handleOpenLocker() {
        if (!selectedLocker) return;

        setOpeningLocker(true);
        setMessage("");
        setError("");
        setDoorOpen(true);

        try {
            const result = await openLocker(selectedLocker.locker_id);

            setMessage(
                result.message || `Locker #${selectedLocker.locker_id} opened`
            );

            await loadLockers();

            const details = await getLockerDetails(selectedLocker.locker_id);
            setLockerDetails(details);

            setTimeout(async () => {
                setDoorOpen(false);

                try {
                    await closeLocker(selectedLocker.locker_id);
                    await loadLockers();

                    const updatedDetails = await getLockerDetails(
                        selectedLocker.locker_id
                    );
                    setLockerDetails(updatedDetails);
                } catch (err) {
                    console.error("Failed to automatically close locker:", err);
                }
            }, 5000);
        } catch (err) {
            setDoorOpen(false);
            setError(err.message);
        } finally {
            setOpeningLocker(false);
        }
    }

    async function handleCloseLocker() {
        if (!selectedLocker) return;

        setOpeningLocker(true);
        setMessage("");
        setError("");
        setDoorOpen(false);

        try {
            const result = await closeLocker(selectedLocker.locker_id);

            setMessage(
                result.message || `Locker #${selectedLocker.locker_id} closed`
            );

            await loadLockers();

            const details = await getLockerDetails(selectedLocker.locker_id);
            setLockerDetails(details);
        } catch (err) {
            setDoorOpen(true);
            setError(err.message);
        } finally {
            setOpeningLocker(false);
        }
    }

    function closeLockerModal() {
        if (openingLocker) return;

        setSelectedLocker(null);
        setLockerDetails(null);
        setMessage("");
        setError("");
    }

    /*
     * =========================
     * DOOR CLICK / OPEN / CLOSE
     * =========================
     */

    async function handleDoorClick(door) {
        setSelectedDoor(door);
        setDoorDetails(null);
        setDoorPanelOpen(Boolean(door.is_open));
        setDoorMessage("");
        setLoadingDoorDetails(true);

        try {
            const data = await getDoorDetails(door.door_id);
            setDoorDetails(data);
            setDoorPanelOpen(Boolean(data.is_open));
        } catch (err) {
            setDoorError(err.message);
        } finally {
            setLoadingDoorDetails(false);
        }
    }

    async function handleOpenDoor() {
        if (!selectedDoor) return;

        setOpeningDoor(true);
        setDoorMessage("");
        setDoorError("");
        setDoorPanelOpen(true);

        try {
            const result = await openDoor(selectedDoor.door_id);

            setDoorMessage(
                result.message || `${selectedDoor.door_name} opened`
            );

            await loadDoors();

            const details = await getDoorDetails(selectedDoor.door_id);
            setDoorDetails(details);

            setTimeout(async () => {
                setDoorPanelOpen(false);

                try {
                    await closeDoor(selectedDoor.door_id);
                    await loadDoors();

                    const updatedDetails = await getDoorDetails(
                        selectedDoor.door_id
                    );
                    setDoorDetails(updatedDetails);
                } catch (err) {
                    console.error("Failed to automatically close door:", err);
                }
            }, 5000);
        } catch (err) {
            setDoorPanelOpen(false);
            setDoorError(err.message);
        } finally {
            setOpeningDoor(false);
        }
    }

    async function handleCloseDoor() {
        if (!selectedDoor) return;

        setOpeningDoor(true);
        setDoorMessage("");
        setDoorError("");
        setDoorPanelOpen(false);

        try {
            const result = await closeDoor(selectedDoor.door_id);

            setDoorMessage(
                result.message || `${selectedDoor.door_name} closed`
            );

            await loadDoors();

            const details = await getDoorDetails(selectedDoor.door_id);
            setDoorDetails(details);
        } catch (err) {
            setDoorPanelOpen(true);
            setDoorError(err.message);
        } finally {
            setOpeningDoor(false);
        }
    }

    function closeDoorModal() {
        if (openingDoor) return;

        setSelectedDoor(null);
        setDoorDetails(null);
        setDoorMessage("");
        setDoorError("");
    }

    /*
     * =========================
     * LOADING
     * =========================
     */

    if (loading) {
        return (
            <div className="lockers-page">
                <div className="message">
                    Loading...
                </div>
            </div>
        );
    }

    /*
     * =========================
     * LOCKER STATS
     * =========================
     */

    const availableCount = lockers.filter(
        locker => locker.status === "Available"
    ).length;

    const reservedCount = lockers.filter(
        locker => locker.status === "Reserved"
    ).length;

    const offlineCount = lockers.filter(
        locker => locker.status === "Offline"
    ).length;

    const sortedLockers = [...displayLockers].sort(
        (a, b) => a.locker_id - b.locker_id
    );

    /*
     * =========================
     * DOOR STATS
     * =========================
     */

    const onlineDoorCount = doors.filter(
        door => door.status === "Online"
    ).length;

    const offlineDoorCount = doors.filter(
        door => door.status === "Offline"
    ).length;

    const sortedDoors = [...displayDoors].sort(
        (a, b) => a.door_id - b.door_id
    );

    return (
        <div className="lockers-page">

            {/* Header */}

            <header className="header">

                <div>
                    <h1>
                        {view === "lockers" ? "Lockers" : "Doors"}
                    </h1>

                    <p>
                        Representation of the
                        SmartLocker access system
                    </p>
                </div>

            </header>


            {/* View Toggle */}

            <div className="view-toggle">

                <button
                    className={`view-toggle-button ${
                        view === "lockers" ? "active" : ""
                    }`}
                    onClick={() => setView("lockers")}
                >
                    🔐 Lockers
                </button>

                <button
                    className={`view-toggle-button ${
                        view === "doors" ? "active" : ""
                    }`}
                    onClick={() => setView("doors")}
                >
                    🚪 Doors
                </button>

            </div>


            {/* ================================================== */}
            {/* LOCKERS VIEW */}
            {/* ================================================== */}

            {view === "lockers" && (

                <>

                    {/* Summary */}

                    <section className="summary">

                        <div className="summary-card">
                            <span>Total</span>
                            <strong>{lockers.length}</strong>
                        </div>

                        <div className="summary-card available">
                            <span>Available</span>
                            <strong>{availableCount}</strong>
                        </div>

                        <div className="summary-card reserved">
                            <span>Reserved</span>
                            <strong>{reservedCount}</strong>
                        </div>

                        <div className="summary-card offline">
                            <span>Offline</span>
                            <strong>{offlineCount}</strong>
                        </div>

                    </section>


                    {/* Error */}

                    {error && (
                        <div className="error">
                            {error}
                        </div>
                    )}


                    {/* Locker Grid */}

                    <section className="locker-section">

                        <div className="section-header">
                            <div>
                                <h2>Locker System</h2>
                                <p>Select a locker to interact with it</p>
                            </div>
                        </div>

                        <div className="locker-grid">

                            {sortedLockers.map(locker => (

                                <button
                                    key={locker.locker_id}
                                    className={`locker ${locker.status.toLowerCase()} ${
                                        locker.is_open ? "opened" : ""
                                    }`}
                                    onClick={() => handleLockerClick(locker)}
                                >

                                    <div className="locker-top">
                                        <span className="locker-number">
                                            #{locker.locker_id}
                                        </span>
                                        <span className="locker-status">
                                            {locker.status}
                                        </span>
                                    </div>

                                    <div className="locker-door">
                                        <div
                                            className={`locker-door-panel ${
                                                locker.is_open ? "is-open" : ""
                                            }`}
                                        >
                                            <div className="locker-handle">▪</div>
                                        </div>
                                    </div>

                                    <h3>{locker.locker_name}</h3>

                                    <span className="locker-action">
                                        View Locker
                                    </span>

                                </button>

                            ))}

                        </div>

                    </section>

                </>

            )}


            {/* ================================================== */}
            {/* DOORS VIEW */}
            {/* ================================================== */}

            {view === "doors" && (

                <>

                    {/* Summary */}

                    <section className="summary">

                        <div className="summary-card">
                            <span>Total</span>
                            <strong>{doors.length}</strong>
                        </div>

                        <div className="summary-card available">
                            <span>Online</span>
                            <strong>{onlineDoorCount}</strong>
                        </div>

                        <div className="summary-card offline">
                            <span>Offline</span>
                            <strong>{offlineDoorCount}</strong>
                        </div>

                    </section>


                    {/* Error */}

                    {doorError && (
                        <div className="error">
                            {doorError}
                        </div>
                    )}


                    {/* Door Grid */}

                    <section className="locker-section">

                        <div className="section-header">
                            <div>
                                <h2>Door System</h2>
                                <p>Select a door to interact with it</p>
                            </div>
                        </div>

                        <div className="locker-grid">

                            {sortedDoors.map(door => (

                                <button
                                    key={door.door_id}
                                    className={`locker ${door.status.toLowerCase()} ${
                                        door.is_open ? "opened" : ""
                                    }`}
                                    onClick={() => handleDoorClick(door)}
                                >

                                    <div className="locker-top">
                                        <span className="locker-number">
                                            #{door.door_id}
                                        </span>
                                        <span className="locker-status">
                                            {door.status}
                                        </span>
                                    </div>

                                    <div className="locker-door">
                                        <div
                                            className={`locker-door-panel ${
                                                door.is_open ? "is-open" : ""
                                            }`}
                                        >
                                            <div className="locker-handle">▪</div>
                                        </div>
                                    </div>

                                    <h3>{door.door_name}</h3>

                                    <span className="locker-action">
                                        View Door
                                    </span>

                                </button>

                            ))}

                        </div>

                    </section>

                </>

            )}


            {/* Locker Modal */}

            {selectedLocker && (

                <div className="modal-overlay" onClick={closeLockerModal}>

                    <div
                        className="modal"
                        onClick={event => event.stopPropagation()}
                    >

                        <div className="modal-header">
                            <div>
                                <h2>{selectedLocker.locker_name}</h2>
                                <p>Locker #{selectedLocker.locker_id}</p>
                            </div>

                            <button className="modal-close" onClick={closeLockerModal}>
                                ×
                            </button>
                        </div>

                        <div className="modal-status">
                            <span className={`status ${selectedLocker.status.toLowerCase()}`}>
                                {selectedLocker.status}
                            </span>
                        </div>

                        {loadingDetails ? (

                            <div className="loading">
                                Loading locker details...
                            </div>

                        ) : (

                            <>

                                <div className="info-grid">

                                    <div>
                                        <span>Locker ID</span>
                                        <strong>#{selectedLocker.locker_id}</strong>
                                    </div>

                                    <div>
                                        <span>Name</span>
                                        <strong>{selectedLocker.locker_name}</strong>
                                    </div>

                                    <div>
                                        <span>Status</span>
                                        <strong>{selectedLocker.status}</strong>
                                    </div>

                                </div>

                                {lockerDetails?.user && (

                                    <div className="reservation">
                                        <h3>Assigned User</h3>

                                        <div className="details">

                                            <div>
                                                <span>Name</span>
                                                <strong>{lockerDetails.user.full_name}</strong>
                                            </div>

                                            <div>
                                                <span>User ID</span>
                                                <strong>#{lockerDetails.user.user_id}</strong>
                                            </div>

                                            <div>
                                                <span>Email</span>
                                                <strong>
                                                    {lockerDetails.user.email || "Not available"}
                                                </strong>
                                            </div>

                                        </div>

                                    </div>

                                )}

                                {lockerDetails?.reservation && (

                                    <div className="reservation">
                                        <h3>Reservation</h3>

                                        <div className="details">

                                            <div>
                                                <span>Reservation ID</span>
                                                <strong>
                                                    #{lockerDetails.reservation.reservation_id}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>Status</span>
                                                <strong>{lockerDetails.reservation.status}</strong>
                                            </div>

                                            {lockerDetails.reservation.start_time && (
                                                <div>
                                                    <span>Start</span>
                                                    <strong>
                                                        {new Date(
                                                            lockerDetails.reservation.start_time
                                                        ).toLocaleString()}
                                                    </strong>
                                                </div>
                                            )}

                                            {lockerDetails.reservation.end_time && (
                                                <div>
                                                    <span>End</span>
                                                    <strong>
                                                        {new Date(
                                                            lockerDetails.reservation.end_time
                                                        ).toLocaleString()}
                                                    </strong>
                                                </div>
                                            )}

                                        </div>

                                    </div>

                                )}

                                {message && (
                                    <div className="success">{message}</div>
                                )}

                                {error && (
                                    <div className="error">{error}</div>
                                )}

                                {!loadingDetails && (

                                    <div className="locker-door modal-door">
                                        <div
                                            className={`locker-door-panel ${
                                                doorOpen ? "is-open" : ""
                                            }`}
                                        >
                                            <div className="locker-handle">▪</div>
                                        </div>
                                    </div>

                                )}

                                <div className="controls">

                                    <h3>Locker Controls</h3>
                                    <p>Send an open request to this locker.</p>

                                    <button
                                        className="open-locker-button"
                                        onClick={
                                            lockerDetails?.is_open
                                                ? handleCloseLocker
                                                : handleOpenLocker
                                        }
                                        disabled={
                                            openingLocker ||
                                            selectedLocker.status === "Offline"
                                        }
                                    >
                                        {openingLocker
                                            ? "Processing..."
                                            : lockerDetails?.is_open
                                            ? "🔒 Close Locker"
                                            : "🔓 Open Locker"}
                                    </button>

                                </div>

                            </>

                        )}

                    </div>

                </div>

            )}


            {/* Door Modal */}

            {selectedDoor && (

                <div className="modal-overlay" onClick={closeDoorModal}>

                    <div
                        className="modal"
                        onClick={event => event.stopPropagation()}
                    >

                        <div className="modal-header">
                            <div>
                                <h2>{selectedDoor.door_name}</h2>
                                <p>Door #{selectedDoor.door_id}</p>
                            </div>

                            <button className="modal-close" onClick={closeDoorModal}>
                                ×
                            </button>
                        </div>

                        <div className="modal-status">
                            <span className={`status ${selectedDoor.status.toLowerCase()}`}>
                                {selectedDoor.status}
                            </span>
                        </div>

                        {loadingDoorDetails ? (

                            <div className="loading">
                                Loading door details...
                            </div>

                        ) : (

                            <>

                                <div className="info-grid">

                                    <div>
                                        <span>Door ID</span>
                                        <strong>#{selectedDoor.door_id}</strong>
                                    </div>

                                    <div>
                                        <span>Name</span>
                                        <strong>{selectedDoor.door_name}</strong>
                                    </div>

                                    <div>
                                        <span>Status</span>
                                        <strong>{selectedDoor.status}</strong>
                                    </div>

                                </div>

                                {doorDetails?.authorized_users && (

                                    <div className="reservation">
                                        <h3>
                                            Authorized Users
                                            {doorDetails.authorized_users.length > 0 &&
                                                ` (${doorDetails.authorized_users.length})`}
                                        </h3>

                                        {doorDetails.authorized_users.length === 0 ? (

                                            <p style={{ color: "#6b7280", margin: 0 }}>
                                                No users currently have access to this door.
                                            </p>

                                        ) : (

                                            <div className="details">

                                                {doorDetails.authorized_users.map(u => (

                                                    <div key={u.user_id}>
                                                        <span>
                                                            {u.full_name} (#{u.user_id})
                                                        </span>
                                                        <strong>
                                                            {u.email || "Not available"}
                                                        </strong>
                                                    </div>

                                                ))}

                                            </div>

                                        )}

                                    </div>

                                )}

                                {doorMessage && (
                                    <div className="success">{doorMessage}</div>
                                )}

                                {doorError && (
                                    <div className="error">{doorError}</div>
                                )}

                                {!loadingDoorDetails && (

                                    <div className="locker-door modal-door">
                                        <div
                                            className={`locker-door-panel ${
                                                doorPanelOpen ? "is-open" : ""
                                            }`}
                                        >
                                            <div className="locker-handle">▪</div>
                                        </div>
                                    </div>

                                )}

                                <div className="controls">

                                    <h3>Door Controls</h3>
                                    <p>Send an open request to this door.</p>

                                    <button
                                        className="open-locker-button"
                                        onClick={
                                            doorDetails?.is_open
                                                ? handleCloseDoor
                                                : handleOpenDoor
                                        }
                                        disabled={
                                            openingDoor ||
                                            selectedDoor.status === "Offline"
                                        }
                                    >
                                        {openingDoor
                                            ? "Processing..."
                                            : doorDetails?.is_open
                                            ? "🔒 Close Door"
                                            : "🔓 Open Door"}
                                    </button>

                                </div>

                            </>

                        )}

                    </div>

                </div>

            )}

        </div>
    );
}

export default Lockers;
