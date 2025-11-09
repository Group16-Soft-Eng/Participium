import { Card } from "../models/models.mjs"

const URI = 'http://localhost:3001/api'

const static_ip_address = "http://localhost:3001/";

async function register(credentials) {

    const bodyObject = {
        name: credentials.name,
        surname: credentials.surname,
        email: credentials.email,
        password: credentials.password
    }
    const response = await fetch(URI + `/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(bodyObject)
    })
    if (response.ok) {
        const user = await response.json();
        return user;

    } else {
        const err = await response.text()
        throw err;
    }
}

async function logIn(credentials) {

    const bodyObject = {
        email: credentials.email,
        password: credentials.password
    }
    const response = await fetch(URI + `/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(bodyObject)
    })
    if (response.ok) {
        const user = await response.json();
        return user;

    } else {
        const err = await response.text()
        throw err;
    }
}


async function logout() {
    const response = await fetch(URI + `/logout`, {
        method: 'POST',
        credentials: 'include',
    });
    if (response.ok)
        return null;
}

export { logIn, logout, static_ip_address };