import { useEffect, useRef, useState } from "react";
import {
  faceAccess,
  getUser,
  getUserLocker,
  openLocker,
  forceReleaseUser,
} from "../services/api";
import "./Kiosk.css";

function Kiosk() {
  /*
  ==================================================
  STATE
  ==================================================
  */
  const [screen, setScreen] = useState("idle");
  const [user, setUser] = useState(null);
  const [locker, setLocker] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [openingLocker, setOpeningLocker] = useState(false);
  const [endingReservation, setEndingReservation] = useState(false);
  const [cameraError, setCameraError] = useState("");

  /*
  ==================================================
  REFS
  ==================================================
  */
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  /*
  ==================================================
  START KIOSK
  ==================================================
  */
  async function startKiosk() {
    setError("");
    setCameraError("");
    setUser(null);
    setLocker(null);

    try {
      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        throw new Error(
          "Camera access is not supported by this browser."
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setScreen("camera");
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError(
        "Unable to access the camera. Please allow camera access."
      );
      setScreen("camera-error");
    }
  }

  /*
  ==================================================
  STOP CAMERA
  ==================================================
  */
  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  /*
  ==================================================
  CAPTIVE PHOTO & FACE ACCESS
  ==================================================
  */
  async function capturePhoto() {
    if (!videoRef.current || loading) return;

    setLoading(true);
    setError("");

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video.videoWidth || !video.videoHeight) {
        throw new Error("Camera is not ready yet.");
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageBlob = await new Promise((resolve) => {
        canvas.toBlob(
          (blob) => {
            resolve(blob);
          },
          "image/jpeg",
          0.9
        );
      });

      if (!imageBlob) {
        throw new Error("Failed to capture image.");
      }

      stopCamera();
      setScreen("verifying");

      const accessData = await faceAccess(imageBlob);
      console.log("FACE ACCESS RESPONSE:", accessData);

      if (accessData.status === "unknown") {
        setError("We could not recognize your face.");
        setScreen("verification-error");
        return;
      }

      if (accessData.status === "inactive") {
        setError("Your account is inactive.");
        setScreen("verification-error");
        return;
      }

      if (accessData.status === "no_reservation") {
        const userData = await getUser(accessData.user_id);
        console.log("USER RESPONSE:", userData);

        setUser(userData);
        setLocker(null);
        setError("You do not have an active locker reservation.");
        setScreen("recognized-no-reservation");
        return;
      }

      if (accessData.status === "match") {
        const userData = await getUser(accessData.user_id);
        console.log("RECOGNIZED USER:", userData);

        let lockerData = null;
        try {
          lockerData = await getUserLocker(accessData.user_id);
        } catch (err) {
          console.error("Failed to get user locker:", err);
          lockerData = accessData.locker || null;
        }

        if (!lockerData) {
          lockerData = accessData.locker || null;
        }

        setUser(userData);
        setLocker(lockerData);
        setScreen("recognized");
        return;
      }

      throw new Error(
        accessData.message || "Unable to verify identity."
      );
    } catch (err) {
      console.error("Face access error:", err);
      setError(err.message || "Face verification failed.");
      setScreen("verification-error");
    } finally {
      setLoading(false);
    }
  }

  /*
  ==================================================
  OPEN LOCKER
  ==================================================
  */
  async function handleOpenLocker() {
    if (!locker || openingLocker) return;

    setOpeningLocker(true);
    setError("");

    try {
      await openLocker(locker.locker_id);
      setScreen("locker-opened");
    } catch (err) {
      console.error("Open locker error:", err);
      setError(err.message || "Unable to open locker.");
    } finally {
      setOpeningLocker(false);
    }
  }

  /*
  ==================================================
  END RESERVATION
  ==================================================
  */
  async function handleEndReservation() {
    if (!user || endingReservation) return;

    const confirmed = window.confirm(
      "Are you sure you want to end your locker reservation?"
    );

    if (!confirmed) return;

    setEndingReservation(true);
    setError("");

    try {
      await forceReleaseUser(user.user_id);
      setLocker(null);
      setScreen("reservation-ended");
    } catch (err) {
      console.error("End reservation error:", err);
      setError(err.message || "Unable to end reservation.");
    } finally {
      setEndingReservation(false);
    }
  }

  /*
  ==================================================
  RESET KIOSK
  ==================================================
  */
  function resetKiosk() {
    stopCamera();
    setUser(null);
    setLocker(null);
    setError("");
    setCameraError("");
    setLoading(false);
    setOpeningLocker(false);
    setEndingReservation(false);
    setScreen("idle");
  }

  /*
  ==================================================
  CLEANUP & AUTO RESET EFFECTS
  ==================================================
  */
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, []);

  useEffect(() => {
    if (
      screen === "reservation-ended" ||
      screen === "locker-opened"
    ) {
      const timer = setTimeout(() => {
        resetKiosk();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [screen]);

  /*
  ==================================================
  RENDER SCREENS
  ==================================================
  */
  if (screen === "idle") {
    return (
      <div className="kiosk">
        <div className="kiosk-idle">
          <div className="kiosk-logo">🔐</div>
          <h1>SmartLocker</h1>
          <p>Secure locker access</p>
          <button className="kiosk-start-button" onClick={startKiosk}>
            Click to Start
          </button>
        </div>
      </div>
    );
  }

  if (screen === "camera-error") {
    return (
      <div className="kiosk">
        <div className="kiosk-panel">
          <div className="kiosk-icon error-icon">⚠</div>
          <h1>Camera Unavailable</h1>
          <p>{cameraError}</p>
          <button className="kiosk-primary-button" onClick={startKiosk}>
            Try Again
          </button>
          <button className="kiosk-secondary-button" onClick={resetKiosk}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (screen === "camera") {
    return (
      <div className="kiosk">
        <div className="kiosk-camera-screen">
          <div className="kiosk-top-bar">
            <h1>SmartLocker</h1>
            <span>Face Verification</span>
          </div>

          <div className="camera-container">
            <video
              ref={videoRef}
              className="kiosk-video"
              autoPlay
              playsInline
              muted
            />
            <div className="face-frame">
              <div className="face-corner top-left" />
              <div className="face-corner top-right" />
              <div className="face-corner bottom-left" />
              <div className="face-corner bottom-right" />
            </div>
          </div>

          <div className="camera-instructions">
            <h2>Position your face inside the frame</h2>
            <p>Look directly at the camera</p>
          </div>

          <button
            className="capture-button"
            onClick={capturePhoto}
            disabled={loading}
          >
            <span className="capture-circle" />
            {loading ? "Processing..." : "Take Picture"}
          </button>

          <button className="camera-cancel-button" onClick={resetKiosk}>
            Cancel
          </button>

          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
      </div>
    );
  }

  if (screen === "verifying") {
    return (
      <div className="kiosk">
        <div className="kiosk-panel">
          <div className="loading-spinner" />
          <h1>Verifying...</h1>
          <p>Please wait while we verify your identity.</p>
        </div>
      </div>
    );
  }

  if (screen === "verification-error") {
    return (
      <div className="kiosk">
        <div className="kiosk-panel">
          <div className="kiosk-icon error-icon">✕</div>
          <h1>Verification Failed</h1>
          <p>{error}</p>
          <button className="kiosk-primary-button" onClick={startKiosk}>
            Try Again
          </button>
          <button className="kiosk-secondary-button" onClick={resetKiosk}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (screen === "recognized-no-reservation") {
    return (
      <div className="kiosk">
        <div className="kiosk-panel">
          <div className="kiosk-icon success-icon">✓</div>
          <h1>User Recognized</h1>

          <div className="kiosk-user-card">
            <div className="kiosk-avatar">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <h2>{user?.full_name || "User"}</h2>
              <p>User ID: #{user?.user_id}</p>
              {user?.email && <p>{user.email}</p>}
            </div>
          </div>

          <div className="kiosk-warning-box">{error}</div>

          <button className="kiosk-secondary-button" onClick={resetKiosk}>
            Done
          </button>
        </div>
      </div>
    );
  }

  if (screen === "recognized") {
    return (
      <div className="kiosk">
        <div className="kiosk-panel kiosk-user-panel">
          <div className="kiosk-icon success-icon">✓</div>
          <h1>Welcome</h1>

          {/* USER INFO */}
          <div className="kiosk-user-card">
            <div className="kiosk-avatar">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <h2>{user?.full_name || "User"}</h2>
              <p>User ID: #{user?.user_id}</p>
              {user?.email && <p>{user.email}</p>}
            </div>
          </div>

          {/* RESERVATION INFO */}
          {locker && (
            <div className="kiosk-reservation">
              <div className="reservation-icon">🔐</div>
              <div>
                <span>Reserved Locker</span>
                <strong>#{locker.locker_id}</strong>
                <p>{locker.locker_name}</p>
              </div>
            </div>
          )}

          {/* START TIME */}
          {locker?.start_time && (
            <div className="kiosk-time-row">
              <span>Start</span>
              <strong>
                {new Date(locker.start_time).toLocaleString()}
              </strong>
            </div>
          )}

          {/* END TIME */}
          {locker?.end_time && (
            <div className="kiosk-time-row">
              <span>End</span>
              <strong>
                {new Date(locker.end_time).toLocaleString()}
              </strong>
            </div>
          )}

          {/* ACTIONS */}
          <div className="kiosk-actions">
            <button
              className="kiosk-open-button"
              onClick={handleOpenLocker}
              disabled={openingLocker}
            >
              {openingLocker ? "Opening..." : "Open Locker"}
            </button>

            <button
              className="kiosk-end-button"
              onClick={handleEndReservation}
              disabled={endingReservation}
            >
              {endingReservation ? "Ending..." : "End Reservation"}
            </button>
          </div>

          <button className="kiosk-secondary-button" onClick={resetKiosk}>
            Done
          </button>
        </div>
      </div>
    );
  }

  if (screen === "locker-opened") {
    return (
      <div className="kiosk">
        <div className="kiosk-panel">
          <div className="kiosk-icon success-icon">🔓</div>
          <h1>Locker Opened!</h1>
          <p>Please retrieve or store your items and close the door tightly.</p>
          <button className="kiosk-primary-button" onClick={resetKiosk}>
            Done
          </button>
        </div>
      </div>
    );
  }

  if (screen === "reservation-ended") {
    return (
      <div className="kiosk">
        <div className="kiosk-panel">
          <div className="kiosk-icon success-icon">✓</div>
          <h1>Reservation Ended</h1>
          <p>Thank you for using SmartLocker.</p>
          <button className="kiosk-primary-button" onClick={resetKiosk}>
            Done
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default Kiosk;
