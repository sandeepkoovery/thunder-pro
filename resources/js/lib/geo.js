/**
 * Get a fresh geolocation coordinate with high accuracy.
 * Handles fallbacks for Mac/Desktop where high accuracy might fail.
 */
export const getFreshLocation = () => {
    return new Promise((resolve, reject) => {
        if (!("geolocation" in navigator)) {
            return reject({ code: 0, message: "Geolocation not supported" });
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 10000, // 10 seconds
            maximumAge: 0   // Force fresh location
        };

        console.log("Requesting fresh location...", options);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log("Location obtained:", position.coords.latitude, position.coords.longitude);
                resolve(position);
            },
            (error) => {
                console.error("Geolocation error:", error);

                // Fallback: If high accuracy fails with POSITION_UNAVAILABLE, try once more without it.
                // This is common on desktops/laptops without GPS.
                if (error.code === error.POSITION_UNAVAILABLE && options.enableHighAccuracy) {
                    console.warn("High accuracy failed, retrying with low accuracy...");
                    navigator.geolocation.getCurrentPosition(
                        (pos) => {
                            console.log("Location obtained (low accuracy):", pos.coords.latitude, pos.coords.longitude);
                            resolve(pos);
                        },
                        (err2) => {
                            console.error("Low accuracy fallback failed:", err2);
                            reject(err2);
                        },
                        { ...options, enableHighAccuracy: false }
                    );
                } else {
                    reject(error);
                }
            },
            options
        );
    });
};

/**
 * Helper to get a human-readable error message from GeolocationPositionError
 */
export const getGeoErrorMessage = (error) => {
    let msg = `Location Error (Code: ${error.code}):\n\n`;
    switch (error.code) {
        case 1: // PERMISSION_DENIED
            msg += "Access denied. Please check:\n- Mac System Settings > Privacy & Security > Location Services (MUST be ON).\n- Ensure your browser is allowed in that list.";
            break;
        case 2: // POSITION_UNAVAILABLE
            msg += "Location unavailable. Please ensure Wi-Fi is ON (Macs need Wi-Fi to find location accurately).";
            break;
        case 3: // TIMEOUT
            msg += "Request timed out. Please check your internet and try again.";
            break;
        default:
            msg += error.message || "An unknown error occurred.";
    }
    return msg;
};
