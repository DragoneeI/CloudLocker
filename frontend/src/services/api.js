const API_URL = "https://2p1fovsrld.execute-api.us-east-1.amazonaws.com";

export async function getUsers() {
    const response = await fetch(`${API_URL}/users`, {
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error("Failed to fetch users");
    }

    return response.json();
}

export async function getUser(userId) {
    const response = await fetch(`${API_URL}/users/${userId}`, {
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error("Failed to fetch user");
    }

    return response.json();
}


export async function getLockers() {
    const response = await fetch(`${API_URL}/lockers`, {
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error("Failed to fetch lockers");
    }

    return response.json();
}

export async function getLockerDetails(lockerId) {
    const response = await fetch(`${API_URL}/lockers/${lockerId}`, {
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error("Failed to fetch locker details");
    }

    return response.json();
}

export async function updateLockerStatus(lockerId, status) {
    const response = await fetch(
        `${API_URL}/lockers/${lockerId}/status`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                status: status,
            }),
        }
    );

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        throw new Error(
            data.detail || "Failed to update locker status"
        );
    }

    return response.json();
}

export async function openLocker(lockerId) {
    const response = await fetch(
        `${API_URL}/lockers/${lockerId}/open`,
        {
            method: "POST"
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to open locker");
    }

    return response.json();
}

export async function releaseLocker(lockerId) {
    const response = await fetch(
        `${API_URL}/lockers/${lockerId}/release`,
        {
            method: "POST",
        }
    );

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        throw new Error(
            data.detail || "Failed to release locker"
        );
    }

    return response.json();
}

export async function getUserLocker(userId) {
    const response = await fetch(
        `${API_URL}/users/${userId}/locker`,
        {
            cache: "no-store",
        }
    );

    if (!response.ok) {
        if (response.status === 404) {
            return null;
        }

        throw new Error("Failed to fetch user locker");
    }

    const data = await response.json();

    if (!data.locker) {
        return null;
    }

    return data.locker;
}

export async function forceReleaseUser(userId) {
    const response = await fetch(
        `${API_URL}/reservations/force-release/user/${userId}`,
        {
            method: "POST",
        }
    );

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        throw new Error(
            data.detail || "Failed to force end reservation"
        );
    }

    return response.json();
}

export async function deactivateUser(userId) {
    const response = await fetch(
        `${API_URL}/users/${userId}/deactivate`,
        {
            method: "PATCH",
        }
    );

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        throw new Error(
            data.detail || "Failed to deactivate user"
        );
    }

    return response.json();
}

export async function activateUser(userId) {
    const response = await fetch(
        `${API_URL}/users/${userId}/activate`,
        {
            method: "PATCH",
        }
    );

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        throw new Error(
            data.detail || "Failed to activate user"
        );
    }

    return response.json();
}

export async function faceAccess(imageBlob) {
    const formData = new FormData();
    formData.append("image", imageBlob, "capture.jpg");

    const response = await fetch(`${API_URL}/face/access`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message =
            typeof data.detail === "string"
                ? data.detail
                : Array.isArray(data.detail)
                ? data.detail.map(d => d.msg).join(", ")
                : "Face access failed";
        throw new Error(message);
    }

    return response.json();
}

export async function closeLocker(lockerId) {
    const response = await fetch(
        `${API_URL}/lockers/${lockerId}/close`,
        {
            method: "POST"
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to close locker");
    }

    return response.json();
}
