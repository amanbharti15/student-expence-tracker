import { auth } from "./firebase-config.js";

import {
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

const signupForm = document.getElementById("signupForm");

signupForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    try {

        await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

        alert("Account created successfully!");

        window.location.href = "index.html";

    } catch (error) {

        console.error("Signup error:", error);

        if (error.code === "auth/email-already-in-use") {
            alert("This email is already registered.");
        }
        else if (error.code === "auth/weak-password") {
            alert("Password should be at least 6 characters.");
        }
        else if (error.code === "auth/invalid-email") {
            alert("Please enter a valid email.");
        }
        else {
            alert("Signup failed: " + error.message);
        }
    }
});