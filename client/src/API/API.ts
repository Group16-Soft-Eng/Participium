import { getToken } from "../services/auth";

const URI = 'http://localhost:5000/api/v1'

const static_ip_address = "http://localhost:5000";

type Credentials = {
    username: string;
    email: string;
    password: string;
};

async function userLogin(credentials: Credentials) {

    const bodyObject = {
        username: credentials.username,
        password: credentials.password
    }
    
    try {
        const response = await fetch(URI + `/auth/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(bodyObject)
        })
                
        if (response.ok) {
            const token = await response.json();
            return token;
        } else {
            const err = await response.text()
            throw new Error(err || 'Login failed');
        }
    } catch (error) {
        console.error('userLogin - Network or parse error:', error);
        throw error;
    }
}

async function officerLogin(credentials: Credentials) {

    const bodyObject = {
        email: credentials.username, // Backend expects 'email' field for officers
        password: credentials.password
    }

    try {
        const response = await fetch(URI + `/auth/officers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(bodyObject)
        })
        
        if (response.ok) {
            const token = await response.json();
            return token;
        } else {
            const err = await response.text()
            console.error('officerLogin - Error response:', err);
            throw new Error(err || 'Officer login failed');
        }
    } catch (error) {
        console.error('officerLogin - Network or parse error:', error);
        throw error;
    }
}

async function maintainerLogin(credentials: Credentials) {

    const bodyObject = {
        email: credentials.username, // Backend expects 'email' field for maintainers
        password: credentials.password
    }

    try {
        const response = await fetch(URI + `/auth/maintainers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(bodyObject)
        })
        
        if (response.ok) {
            const token = await response.json();
            return token;
        } else {
            const err = await response.text()
            console.error('maintainerLogin - Error response:', err);
            throw new Error(err || 'Maintainer login failed');
        }
    } catch (error) {
        console.error('maintainerLogin - Network or parse error:', error);
        throw error;
    }
}

type User = {
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

type Officer = {
    email: string;
    name: string;
    surname: string;
    password: string;
    Office: string;
    Role: string;
}


async function userRegister(user: User) {

    const response = await fetch(URI + `/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(user)
    });
    if (response.ok) {
        return true;
    }
    else {
        const err = await response.text()

        const match = err.match(/<pre>(.*?)<\/pre>/i);

        const errorType = match ? match[1] : response.statusText;
        
        throw new Error(`${response.status} ${errorType}`);
    }
}

async function officerRegister(officer: Officer) {
    const token = getToken();

    const headers: HeadersInit = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(URI + `/officers`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(officer)
    });
    if (response.ok) {
        return true;
    }
    else {
        const err = await response.text()

        const match = err.match(/<pre>(.*?)<\/pre>/i);

        const errorType = match ? match[1] : response.statusText;
        
        throw new Error(`${response.status} ${errorType}`);
    }
}

async function getAssignedReports() {
    const token = getToken();

    const headers: HeadersInit = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(URI + `/officers/retrievedocs`, {
        method: 'GET',
        headers: headers,
    });
    if (response.ok) {
        const reports = await response.json();
        return reports;
    }
    else {
        const err = await response.text()
        throw err;
    }
}

async function getAvailableOfficerTypes() {
    const token = getToken();
    
    const headers: HeadersInit = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(URI + `/info-types`, {
        method: 'GET',
        headers: headers,
    });
    if (response.ok) {
        const types = await response.json();
        return types;
    }
    else {
        const err = await response.text()
        throw err;
    }
}

async function getUserProfile() {
    const token = getToken();

    const headers: HeadersInit = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(URI + `/users/me`, {
        method: 'GET',
        headers: headers,
    });
    if (response.ok) {
        const profile = await response.json();
        return profile;
    }
    else {
        const err = await response.text()
        throw err;
    }
}

interface UpdatedData {
    telegram?: string;
    emailNotifications?: boolean;
    avatar?: File;
}

async function updateUserProfile(updatedData: UpdatedData) {
    const token = getToken();

    const formData = new FormData();

    if (updatedData.telegram !== undefined) {
        formData.append("telegramUsername", updatedData.telegram);
    }

    if (updatedData.emailNotifications !== undefined) {
        formData.append("emailNotifications", updatedData.emailNotifications ? "true" : "false");
    }

    if (updatedData.avatar instanceof File) {
        formData.append("avatar", updatedData.avatar);
    }
    
    const response = await fetch(URI + `/users/me`, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData
    });

    if (!response.ok) {
        throw await response.text();
    }

    return await response.json();
}

async function getOfficersByOffice(office: string) {
    const token = getToken();

    const headers: HeadersInit = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(URI + `/officers/OfficerByOfficeType/${office}`, {
        method: 'GET',
        headers: headers,
    });
    if (response.ok) {
        const officers = await response.json();
        return officers;
    }
    else {
        const err = await response.text()
        throw err;
    }
}

async function assignOfficer(reportId: number, officerId: number) {
    const token = getToken();

    const headers: HeadersInit = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(URI + `/officers/assign-report`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ reportId, officerId }),
    });
    
    if (response.ok) {
        return true;
    }
    else {
        const err = await response.text()
        throw err;
    }
}

interface Notification {
    id: number;
    userId: number;
    reportId?: number;
    type: 'STATUS_CHANGE' | 'OFFICER_MESSAGE';
    message: string;
    createdAt: string;
    read: boolean;
}

async function getNotifications(unreadOnly: boolean = false): Promise<Notification[]> {
    const token = getToken();

    const headers: HeadersInit = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['Content-Type'] = 'application/json';
    }

    const url = unreadOnly ? URI + `/notifications?unreadOnly=true` : URI + `/notifications`;
    const response = await fetch(url, {
        method: 'GET',
        headers: headers,
    });

    if (response.ok) {
        return await response.json();
    } else {
        const err = await response.text();
        throw new Error(err || 'Failed to fetch notifications');
    }
}

async function markNotificationAsRead(notificationId: number): Promise<{ id: number; read: boolean }> {
    const token = getToken();

    const headers: HeadersInit = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(URI + `/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: headers,
    });

    if (response.ok) {
        return await response.json();
    } else {
        const err = await response.text();
        throw new Error(err || 'Failed to mark notification as read');
    }
}


export { static_ip_address, userLogin, userRegister, officerLogin, maintainerLogin, officerRegister, getAssignedReports, getAvailableOfficerTypes, getUserProfile, updateUserProfile, getOfficersByOffice, assignOfficer, getNotifications, markNotificationAsRead };
export type { Notification };