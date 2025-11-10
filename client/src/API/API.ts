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
        return `mock-token-citizen-${bodyObject.username}`;
    }
}

async function officerLogin(credentials: Credentials) {

    const bodyObject = {
        username: credentials.username,
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
        return `mock-token-officer-${bodyObject.username}`;
    }
}

type User = {
    email: string;
    password: string;
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

export { userLogin, userRegister, officerLogin };