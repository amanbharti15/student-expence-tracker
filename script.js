import { auth } from "./firebase-config.js";

import {
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        alert("Login successful!");

        window.location.href = "dashboard.html";

    } catch (error) {

        console.error("Login error:", error);

        if (error.code === "auth/invalid-credential") {
            alert("Invalid email or password.");
        }
        else if (error.code === "auth/user-not-found") {
            alert("Account does not exist.");
        }
        else if (error.code === "auth/wrong-password") {
            alert("Wrong password.");
        }
        else {
            alert("Login failed: " + error.message);
        }
    }
});