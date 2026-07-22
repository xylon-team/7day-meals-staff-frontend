export interface SettingResponse {
    setting_id: number;
    delivery_radius: number;
    latitude: number | string;
    longitude: number | string;
    delivery_fee: number | string;
}

export interface SaveSettingsRequest {
    delivery_radius: number;
    delivery_fee: number;
    latitude: number;
    longitude: number;
}

const getApiUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
};

export const getSettings = async (token: string): Promise<SettingResponse> => {
    const response = await fetch(`${getApiUrl()}/settings`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (response.status === 404) {
        throw new Error('404_NOT_FOUND');
    }

    if (!response.ok) {
        throw new Error('Failed to fetch settings from the server.');
    }

    return response.json();
};

export const createSettings = async (token: string, data: SaveSettingsRequest): Promise<SettingResponse> => {
    const response = await fetch(`${getApiUrl()}/settings`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to initialize settings on the server.');
    }

    return response.json();
};

export const updateSettings = async (token: string, data: SaveSettingsRequest): Promise<SettingResponse> => {
    const response = await fetch(`${getApiUrl()}/settings`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update settings on the server.');
    }

    return response.json();
};
