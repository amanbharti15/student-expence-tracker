import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import { getAuth }
from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import { getFirestore }
from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


const firebaseConfig = {

    apiKey: "AIzaSyAD9dRtx3jBMWoHNUWG_s4cpg2UJ2p4dBg",

    authDomain:
        "student-expense-tracker-f8be8.firebaseapp.com",

    projectId:
        "student-expense-tracker-f8be8",

    storageBucket:
        "student-expense-tracker-f8be8.firebasestorage.app",

    messagingSenderId:
        "674760325207",

    appId:
        "1:674760325207:web:153f26fd9aa9967cd7cb12"
};


const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


export { auth, db };