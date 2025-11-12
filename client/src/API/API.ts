import { getToken } from "../services/auth";

const URI = 'http://localhost:5000/api/v1'

const static_ip_address = "http://localhost:5000/";

type Credentials = {
    username: string;
    password: string;
};

async function userLogin(credentials: Credentials) {

    const bodyObject = {
        username: credentials.username,
        password: credentials.password
    }
    console.log('userLogin - Sending request to:', URI + `/auth/users`);
    console.log('userLogin - Body:', bodyObject);
    
    try {
        const response = await fetch(URI + `/auth/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(bodyObject)
        })
        
        console.log('userLogin - Response status:', response.status);
        
        if (response.ok) {
            const token = await response.json();
            console.log('userLogin - Token received:', token);
            return token;
        } else {
            const err = await response.text()
            console.error('userLogin - Error response:', err);
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
    console.log('officerLogin - Sending request to:', URI + `/auth/officers`);
    console.log('officerLogin - Body:', bodyObject);
    
    try {
        const response = await fetch(URI + `/auth/officers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(bodyObject)
        })
        
        console.log('officerLogin - Response status:', response.status);
        
        if (response.ok) {
            const token = await response.json();
            console.log('officerLogin - Token received:', token);
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
        throw err;
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

export { userLogin, userRegister, officerLogin, officerRegister, getAssignedReports, getAvailableOfficerTypes };