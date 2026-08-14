import { useEffect, useState } from "react";
import {
    getLockers,
    getLockerDetails,
    openLocker,
    releaseLocker
} from "../services/api";

import "./Lockers.css";

function Lockers() {
    const [lockers, setLockers] = useState([]);
    const [selectedLocker, setSelectedLocker] = useState(null);
    const [lockerDetails, setLockerDetails] = useState(null);

    const [loading, setLoading] = useState(true);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [opening, setOpening] = useState(false);
    const [releasing, setReleasing] = useState(false);

    const [error, setError] = useState("");

    async function loadLockers() {
        try {
            const data = await getLockers();
            setLockers(data);
        } catch (err) {
            setError(err.message);
        }
    }

    useEffect(() => {
        async function load() {
            await loadLockers();
            setLoading(false);
        }

        load();
    }, []);

    async function handleLockerClick(locker) {
        setSelectedLocker(locker);
        setLockerDetails(null);
        setLoadingDetails(true);

        try {
            const details = await getLockerDetails(
                locker.locker_id
            );

            setLockerDetails(details);
        } catch (err) {
            alert(err.message);
        } finally {
            setLoadingDetails(false);
        }
    }

    async function handleOpenLocker() {
        if (!selectedLocker) {
            return;
        }

        setOpening(true);

        try {
            await openLocker(selectedLocker.locker_id);

            alert(
                `Locker #${selectedLocker.locker_id} opened.`
            );

            await refreshSelectedLocker();
        } catch (err) {
            alert(err.message);
        } finally {
            setOpening(false);
        }
    }

    async function handleReleaseLocker() {
        if (!selectedLocker) {
            return;
        }

        const confirmed = window.confirm(
            `End the reservation for locker #${selectedLocker.locker_id}?`
        );

        if (!confirmed) {
            return;
        }

        setReleasing(true);

        try {
            await releaseLocker(selectedLocker.locker_id);

            alert("Reservation ended successfully.");

            await refreshSelectedLocker();
        } catch (err) {
            alert(err.message);
        } finally {
            setReleasing(false);
        }
    }

    async function refreshSelectedLocker() {
        await loadLockers();

        if (!selectedLocker) {
            return;
        }

        const updatedLocker = await getLockerDetails(
            selectedLocker.locker_id
        );

        setLockerDetails(updatedLocker);

        setSelectedLocker(
            lockers.find(
                locker =>
                    locker.locker_id ===
                    selectedLocker.locker_id
            ) || selectedLocker
        );
    }

    function closeModal() {
        if (opening || releasing) {
            return;
        }

        setSelectedLocker(null);
        setLockerDetails(null);
    }

    if (loading) {
        return (
            <div className="lockers-message">
                Loading  lockers...
            </div>
        );
    }

    if (error) {
        return (
            <div className="lockers-message error">
                Error: {error}
            </div>
        );
    }

    return (
        <div className="lockers">

            <header className="lockers-header">

                <div>
                    <h1> Lockers</h1>

                    <p>
                        Simulated locker system
                    </p>
                </div>

                <div className="status">
                    <span className="status-dot"></span>
                    System Online
                </div>

            </header>


            <section className="locker-section">

                <div className="section-header">

                    <div>
                        <h2>Locker System</h2>

                        <p>
                            Click a locker to interact with it.
                        </p>
                    </div>

                </div>


                <div className="locker-grid">

                    {lockers.map(locker => (

                        <button
                            key={locker.locker_id}
                            className={`locker ${locker.status.toLowerCase()}`}
                            onClick={() =>
                                handleLockerClick(locker)
                            }
                        >

                            <div className="locker-number">
                                #{locker.locker_id}
                            </div>


                            <div className="locker-icon">
                                🔐
                            </div>


                            <h3>
                                {locker.locker_name}
                            </h3>


                            <span className="locker-status">
                                {locker.status}
                            </span>

                        </button>

                    ))}

                </div>

            </section>


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
                                className="close"
                                onClick={closeModal}
                            >
                                ×
                            </button>

                        </div>


                        {loadingDetails ? (

                            <div className="loading">
                                Loading locker...
                            </div>

                        ) : (

                            <>

                                <div className="info">

                                    <div>
                                        <span>
                                            Locker
                                        </span>

                                        <strong>
                                            #
                                            {
                                                selectedLocker.locker_id
                                            }
                                        </strong>
                                    </div>


                                    <div>
                                        <span>
                                            Status
                                        </span>

                                        <strong>
                                            {
                                                lockerDetails?.status ||
                                                selectedLocker.status
                                            }
                                        </strong>
                                    </div>

                                </div>


                                {lockerDetails?.user && (

                                    <div className="reservation">

                                        <h3>
                                            Reserved By
                                        </h3>

                                        <p>
                                            {
                                                lockerDetails.user.full_name
                                            }
                                        </p>

                                        <span>
                                            User ID #
                                            {
                                                lockerDetails.user.user_id
                                            }
                                        </span>

                                    </div>

                                )}


                                {lockerDetails?.reservation && (

                                    <div className="reservation">

                                        <h3>
                                            Reservation
                                        </h3>

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

                                    </div>

                                )}


                                <div className="actions">

                                    <button
                                        className="open-locker-button"
                                        onClick={
                                            handleOpenLocker
                                        }
                                        disabled={
                                            opening ||
                                            selectedLocker.status ===
                                                "Offline"
                                        }
                                    >

                                        {opening
                                            ? "Opening..."
                                            : "🔓 Open Locker"}

                                    </button>


                                    {lockerDetails?.reservation && (

                                        <button
                                            className="release-locker-button"
                                            onClick={
                                                handleReleaseLocker
                                            }
                                            disabled={
                                                releasing
                                            }
                                        >

                                            {releasing
                                                ? "Ending..."
                                                : "End Reservation"}

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

export default Lockers;