import { getToken } from "../services/auth";

const URI = 'http://localhost:5000/api/v1'

type Credentials = {
    username: string;
    password: string;
};


type OfficerCredentials = {
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
            throw err;
        }
    } catch (e) {
        // fallback to mock token if backend not available
        // return `mock-token-citizen-${bodyObject.username}`;
    }
}

async function officerLogin(credentials: OfficerCredentials) {

    const bodyObject = {
        email: credentials.email,
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
            throw err;
        }
    } catch (e) {
        // fallback mock token for dev when backend unreachable
        // return `mock-token-officer-${bodyObject.username}`;
    }
}

type User = {
    username: string;
    firstName: string;
    lastName: string;
    password: string;
    email: string;
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
        throw err;
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

export { userLogin, userRegister, officerLogin, getAssignedReports };