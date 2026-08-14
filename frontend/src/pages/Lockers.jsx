import { useEffect, useState } from "react";
import {
    getLockers,
    getLockerDetails,
    openLocker,
    closeLocker
} from "../services/api";

import "./Lockers.css";

function Lockers() {
    const [lockers, setLockers] = useState([]);
    const [selectedLocker, setSelectedLocker] = useState(null);
    const [lockerDetails, setLockerDetails] = useState(null);

    const [loading, setLoading] = useState(true);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [openingLocker, setOpeningLocker] = useState(false);
    const [doorOpen, setDoorOpen] = useState(false);

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    async function loadLockers() {
        try {
            setError("");

            const data = await getLockers();

            setLockers(data);
        } catch (err) {
            setError(err.message);
        }
    }

    useEffect(() => {
        async function loadData() {
            try {
                await loadLockers();
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, []);

    async function handleLockerClick(locker) {
        setSelectedLocker(locker);
        setLockerDetails(null);

        // Set initial door state
        setDoorOpen(Boolean(locker.is_open));

        setMessage("");
        setLoadingDetails(true);

        try {
            const data = await getLockerDetails(
                locker.locker_id
            );

            setLockerDetails(data);

            // Make sure animation state matches backend
            setDoorOpen(Boolean(data.is_open));

        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingDetails(false);
        }
    }

    async function handleOpenLocker() {
        if (!selectedLocker) {
            return;
        }

        setOpeningLocker(true);
        setMessage("");
        setError("");

        // OPEN THE DOOR VISUALLY IMMEDIATELY
        setDoorOpen(true);

        try {
            const result = await openLocker(
                selectedLocker.locker_id
            );

            setMessage(
                result.message ||
                `Locker #${selectedLocker.locker_id} opened`
            );

            await loadLockers();

            const details = await getLockerDetails(
                selectedLocker.locker_id
            );

            setLockerDetails(details);

            // Automatically close after 5 seconds
            setTimeout(async () => {
                // CLOSE THE DOOR VISUALLY IMMEDIATELY
                setDoorOpen(false);

                try {
                    await closeLocker(
                        selectedLocker.locker_id
                    );

                    await loadLockers();

                    const updatedDetails =
                        await getLockerDetails(
                            selectedLocker.locker_id
                        );

                    setLockerDetails(updatedDetails);

                } catch (err) {
                    console.error(
                        "Failed to automatically close locker:",
                        err
                    );
                }
            }, 5000);

        } catch (err) {
            // If opening failed, put the door back to closed
            setDoorOpen(false);
            setError(err.message);

        } finally {
            setOpeningLocker(false);
        }
    }


    async function handleCloseLocker() {
        if (!selectedLocker) {
            return;
        }

        setOpeningLocker(true);
        setMessage("");
        setError("");

        // CLOSE THE DOOR VISUALLY IMMEDIATELY
        setDoorOpen(false);

        try {
            const result = await closeLocker(
                selectedLocker.locker_id
            );

            setMessage(
                result.message ||
                `Locker #${selectedLocker.locker_id} closed`
            );

            await loadLockers();

            const details = await getLockerDetails(
                selectedLocker.locker_id
            );

            setLockerDetails(details);

        } catch (err) {
            // If closing failed, put it back to open
            setDoorOpen(true);
            setError(err.message);

        } finally {
            setOpeningLocker(false);
        }
    }

    function closeModal() {
        if (openingLocker) {
            return;
        }

        setSelectedLocker(null);
        setLockerDetails(null);
        setMessage("");
        setError("");
    }

    if (loading) {
        return (
            <div className="lockers-page">
                <div className="message">
                    Loading lockers...
                </div>
            </div>
        );
    }

    const availableCount = lockers.filter(
        locker => locker.status === "Available"
    ).length;

    const reservedCount = lockers.filter(
        locker => locker.status === "Reserved"
    ).length;

    const offlineCount = lockers.filter(
        locker => locker.status === "Offline"
    ).length;

    const sortedLockers = [...lockers].sort(
        (a, b) => a.locker_id - b.locker_id
    );

    return (
        <div className="lockers-page">

            {/* Header */}

            <header className="header">

                <div>
                    <h1>Lockers</h1>

                    <p>
                        Representation of the
                        SmartLocker system
                    </p>
                </div>

            </header>


            {/* Summary */}

            <section className="summary">

                <div className="summary-card">

                    <span>
                        Total
                    </span>

                    <strong>
                        {lockers.length}
                    </strong>

                </div>


                <div className="summary-card available">

                    <span>
                        Available
                    </span>

                    <strong>
                        {availableCount}
                    </strong>

                </div>


                <div className="summary-card reserved">

                    <span>
                        Reserved
                    </span>

                    <strong>
                        {reservedCount}
                    </strong>

                </div>


                <div className="summary-card offline">

                    <span>
                        Offline
                    </span>

                    <strong>
                        {offlineCount}
                    </strong>

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
                        <h2>
                            Locker System
                        </h2>

                        <p>
                            Select a locker to interact with it
                        </p>
                    </div>

                </div>


                <div className="locker-grid">

                    {sortedLockers.map(locker => (

                        <button
                            key={locker.locker_id}
                            className={`locker ${locker.status.toLowerCase()} ${
                                locker.is_open ? "opened" : ""
                            }`}
                            
                            onClick={() =>
                                handleLockerClick(locker)
                            }
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
                                    <div className="locker-handle">
                                        ▪
                                    </div>
                                </div>
                            </div>


                            <h3>
                                {locker.locker_name}
                            </h3>


                            <span className="locker-action">
                                View Locker
                            </span>

                        </button>

                    ))}

                </div>

            </section>


            {/* Locker Modal */}

            {selectedLocker && (

                <div
                    className="modal-overlay"
                    onClick={closeModal}
                >

                    <div
                        className="modal"
                        onClick={event =>
                            event.stopPropagation()
                        }
                    >

                        {/* Modal Header */}

                        <div className="modal-header">

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
                                onClick={closeModal}
                            >
                                ×
                            </button>

                        </div>


                        {/* Status */}

                        <div className="modal-status">

                            <span
                                className={`status ${selectedLocker.status.toLowerCase()}`}
                            >
                                {selectedLocker.status}
                            </span>

                        </div>


                        {loadingDetails ? (

                            <div className="loading">
                                Loading locker details...
                            </div>

                        ) : (

                            <>

                                {/* Locker Information */}

                                <div className="info-grid">

                                    <div>
                                        <span>
                                            Locker ID
                                        </span>

                                        <strong>
                                            #{selectedLocker.locker_id}
                                        </strong>
                                    </div>


                                    <div>
                                        <span>
                                            Name
                                        </span>

                                        <strong>
                                            {selectedLocker.locker_name}
                                        </strong>
                                    </div>


                                    <div>
                                        <span>
                                            Status
                                        </span>

                                        <strong>
                                            {selectedLocker.status}
                                        </strong>
                                    </div>

                                </div>


                                {/* Assigned User */}

                                {lockerDetails?.user && (

                                    <div className="reservation">

                                        <h3>
                                            Assigned User
                                        </h3>

                                        <div className="details">

                                            <div>
                                                <span>
                                                    Name
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


                                {/* Reservation */}

                                {lockerDetails?.reservation && (

                                    <div className="reservation">

                                        <h3>
                                            Reservation
                                        </h3>

                                        <div className="details">

                                            <div>
                                                <span>
                                                    Reservation ID
                                                </span>

                                                <strong>
                                                    #
                                                    {
                                                        lockerDetails.reservation.reservation_id
                                                    }
                                                </strong>
                                            </div>


                                            <div>
                                                <span>
                                                    Status
                                                </span>

                                                <strong>
                                                    {
                                                        lockerDetails.reservation.status
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
                                                            lockerDetails.reservation.start_time
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
                                                            lockerDetails.reservation.end_time
                                                        ).toLocaleString()}
                                                    </strong>
                                                </div>

                                            )}

                                        </div>

                                    </div>

                                )}


                                {/* Message */}

                                {message && (

                                    <div className="success">
                                        {message}
                                    </div>

                                )}


                                {/* Error */}

                                {error && (

                                    <div className="error">
                                        {error}
                                    </div>

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

                                {/* Open Locker */}

                                <div className="controls">

                                    <h3>
                                        Locker Controls
                                    </h3>

                                    <p>
                                        Send an open request to
                                        this locker.
                                    </p>


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

        </div>
    );
}

export default Lockers;