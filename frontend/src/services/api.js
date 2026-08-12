const API_URL = "http://52.5.26.213:8000";

export async function getUsers() {
    const response = await fetch(`${API_URL}/users`);

    if (!response.ok) {
        throw new Error("Failed to fetch users");
    }

    return response.json();
}

export async function getLockers() {
    const response = await fetch(`${API_URL}/lockers`);

    if (!response.ok) {
        throw new Error("Failed to fetch lockers");
    }

    return response.json();
}

export async function getLockerDetails(lockerId) {
    const response = await fetch(`${API_URL}/lockers/${lockerId}`);

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
        `${API_URL}/users/${userId}/locker`
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

async function handleUserClick(user) {
    setSelectedUser(user);
    setUserLocker(null);
    setLoadingUser(true);

    try {
        const lockerData = await getUserLocker(user.user_id);

        console.log("USER LOCKER RESPONSE:", lockerData);

        setUserLocker(lockerData);
    } catch (err) {
        console.error("Failed to load user locker:", err);
        setUserLocker(null);
    } finally {
        setLoadingUser(false);
    }
}
