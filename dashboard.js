import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
    collection,
    addDoc,
    getDocs,
    doc,
    setDoc,
    getDoc,
    deleteDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


// =========================
// ELEMENTS
// =========================

const expenseForm =
    document.getElementById("expenseForm");

const budgetForm =
    document.getElementById("budgetForm");

const logoutBtn =
    document.getElementById("logoutBtn");

const totalSpent =
    document.getElementById("totalSpent");

const budget =
    document.getElementById("budget");

const remaining =
    document.getElementById("remaining");

const dateInput =
    document.getElementById("date");

const calendarDate =
    document.getElementById("calendarDate");

const dailyExpense =
    document.getElementById("dailyExpense");

const expenseHistory =
    document.getElementById("expenseHistory");

const searchExpense =
    document.getElementById("searchExpense");

const filterCategory =
    document.getElementById("filterCategory");


// =========================
// VARIABLES
// =========================

let currentUser = null;

let monthlyBudget = 0;

let currentMonthExpenses = [];


// =========================
// SET TODAY DATE
// =========================

function setTodayDate() {

    const today = new Date();

    const year =
        today.getFullYear();

    const month =
        String(
            today.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            today.getDate()
        ).padStart(2, "0");

    dateInput.value =
        `${year}-${month}-${day}`;
}


// =========================
// GET CURRENT MONTH
// =========================

function getCurrentMonth() {

    const today = new Date();

    const year =
        today.getFullYear();

    const month =
        String(
            today.getMonth() + 1
        ).padStart(2, "0");

    return `${year}-${month}`;
}


// =========================
// AUTH CHECK
// =========================

onAuthStateChanged(
    auth,
    async function(user) {

        if (!user) {

            window.location.href =
                "index.html";

            return;
        }

        currentUser = user;

        console.log(
            "Logged in user:",
            user.email
        );

        setTodayDate();

        await loadBudget();

        await loadExpenses();

        await loadExpenseHistory();

    }
);


// =========================
// SET MONTHLY BUDGET
// =========================

budgetForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();

        if (!currentUser) {

            alert(
                "Please login first."
            );

            return;
        }

        const budgetValue =
            Number(
                document.getElementById(
                    "budgetInput"
                ).value
            );

        try {

            await setDoc(

                doc(
                    db,
                    "users",
                    currentUser.uid
                ),

                {
                    monthlyBudget:
                        budgetValue
                },

                {
                    merge: true
                }

            );

            monthlyBudget =
                budgetValue;

            budget.textContent =
                "₹" + monthlyBudget;

            await loadExpenses();

            budgetForm.reset();

            alert(
                "Monthly budget saved!"
            );

        } catch (error) {

            console.error(
                "Budget error:",
                error
            );

            alert(
                "Could not save budget."
            );

        }

    }
);


// =========================
// ADD EXPENSE
// =========================

expenseForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();

        if (!currentUser) {

            alert(
                "Please login first."
            );

            return;
        }

        const amount =
            Number(
                document.getElementById(
                    "amount"
                ).value
            );

        const category =
            document.getElementById(
                "category"
            ).value;

        const description =
            document.getElementById(
                "description"
            ).value;

        const date =
            document.getElementById(
                "date"
            ).value;

        try {

            await addDoc(

                collection(
                    db,
                    "users",
                    currentUser.uid,
                    "expenses"
                ),

                {
                    amount: amount,

                    category: category,

                    description: description,

                    date: date,

                    month:
                        date.substring(0, 7),

                    createdAt:
                        new Date()
                }

            );

            alert(
                "Expense added successfully!"
            );

            expenseForm.reset();

            setTodayDate();

            await loadExpenses();

            await loadExpenseHistory();

            if (
                calendarDate.value === date
            ) {

                await loadDailyExpenses(
                    date
                );

            }

        } catch (error) {

            console.error(
                "Error adding expense:",
                error
            );

            alert(
                "Could not add expense."
            );

        }

    }
);


// =========================
// LOAD BUDGET
// =========================

async function loadBudget() {

    try {

        const userDoc =
            await getDoc(

                doc(
                    db,
                    "users",
                    currentUser.uid
                )

            );

        if (userDoc.exists()) {

            const data =
                userDoc.data();

            monthlyBudget =
                Number(
                    data.monthlyBudget
                ) || 0;

        } else {

            monthlyBudget = 0;

        }

        budget.textContent =
            "₹" + monthlyBudget;

    } catch (error) {

        console.error(
            "Error loading budget:",
            error
        );

    }

}


// =========================
// LOAD CURRENT MONTH EXPENSES
// =========================

async function loadExpenses() {

    try {

        const snapshot =
            await getDocs(

                collection(
                    db,
                    "users",
                    currentUser.uid,
                    "expenses"
                )

            );

        let total = 0;

        const currentMonth =
            getCurrentMonth();

        snapshot.forEach(
            function(expenseDoc) {

                const expense =
                    expenseDoc.data();

                const expenseMonth =
                    expense.month ||
                    (
                        expense.date
                            ? expense.date.substring(
                                0,
                                7
                            )
                            : ""
                    );

                if (
                    expenseMonth ===
                    currentMonth
                ) {

                    total +=
                        Number(
                            expense.amount
                        );

                }

            }
        );

        totalSpent.textContent =
            "₹" + total;

        const remainingAmount =
            monthlyBudget - total;

        remaining.textContent =
            "₹" + remainingAmount;

    } catch (error) {

        console.error(
            "Error loading expenses:",
            error
        );

    }

}


// =========================
// CALENDAR DATE CHANGE
// =========================

calendarDate.addEventListener(
    "change",
    async function() {

        const selectedDate =
            calendarDate.value;

        if (!selectedDate) {

            dailyExpense.innerHTML =
                "<p>Please select a date.</p>";

            return;
        }

        await loadDailyExpenses(
            selectedDate
        );

    }
);


// =========================
// LOAD DAILY EXPENSES
// =========================

async function loadDailyExpenses(
    selectedDate
) {

    try {

        const snapshot =
            await getDocs(

                collection(
                    db,
                    "users",
                    currentUser.uid,
                    "expenses"
                )

            );

        let total = 0;

        let expenses = [];

        snapshot.forEach(
            function(expenseDoc) {

                const expense =
                    expenseDoc.data();

                if (
                    expense.date ===
                    selectedDate
                ) {

                    total +=
                        Number(
                            expense.amount
                        );

                    expenses.push(
                        expense
                    );

                }

            }
        );

        const dateObject =
            new Date(
                selectedDate +
                "T00:00:00"
            );

        const readableDate =
            dateObject.toLocaleDateString(
                "en-IN",
                {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                }
            );

        if (expenses.length === 0) {

            dailyExpense.innerHTML = `

                <div class="daily-header">

                    <h3>
                        ${readableDate}
                    </h3>

                    <p class="daily-total">
                        Total Spent: ₹0
                    </p>

                </div>

                <div class="no-expense">

                    <p>
                        No expenses on this date.
                    </p>

                </div>

            `;

            return;
        }

        let expenseHTML = "";

        expenses.forEach(
            function(expense) {

                expenseHTML += `

                    <div class="daily-item">

                        <div>

                            <strong>
                                ${expense.category}
                            </strong>

                            <p>
                                ${
                                    expense.description ||
                                    "No description"
                                }
                            </p>

                        </div>

                        <span>
                            ₹${expense.amount}
                        </span>

                    </div>

                `;

            }
        );

        dailyExpense.innerHTML = `

            <div class="daily-header">

                <h3>
                    ${readableDate}
                </h3>

                <p class="daily-total">
                    Total Spent: ₹${total}
                </p>

            </div>

            <div class="daily-list">

                ${expenseHTML}

            </div>

        `;

    } catch (error) {

        console.error(
            "Error loading daily expenses:",
            error
        );

        dailyExpense.innerHTML = `
            <p>
                Could not load expenses.
            </p>
        `;

    }

}


// =========================
// LOAD CURRENT MONTH HISTORY
// =========================

async function loadExpenseHistory() {

    try {

        const snapshot =
            await getDocs(

                collection(
                    db,
                    "users",
                    currentUser.uid,
                    "expenses"
                )

            );

        const currentMonth =
            getCurrentMonth();

        currentMonthExpenses = [];


        snapshot.forEach(
            function(expenseDoc) {

                const expense =
                    expenseDoc.data();

                const expenseMonth =
                    expense.month ||
                    (
                        expense.date
                            ? expense.date.substring(
                                0,
                                7
                            )
                            : ""
                    );

                if (
                    expenseMonth ===
                    currentMonth
                ) {

                    currentMonthExpenses.push({

                        id:
                            expenseDoc.id,

                        ...expense

                    });

                }

            }
        );


        displayExpenseHistory(
            currentMonthExpenses
        );

    } catch (error) {

        console.error(
            "Error loading expense history:",
            error
        );

        expenseHistory.innerHTML = `

            <p>
                Could not load expense history.
            </p>

        `;

    }

}


// =========================
// DISPLAY EXPENSE HISTORY
// =========================

function displayExpenseHistory(
    expenses
) {

    if (expenses.length === 0) {

        expenseHistory.innerHTML = `

            <div class="no-expense">

                <p>
                    No expenses found.
                </p>

            </div>

        `;

        return;
    }


    let historyHTML = "";


    expenses.forEach(
        function(expense) {

            historyHTML += `

                <div class="history-item">

                    <div class="history-info">

                        <h3>
                            ${expense.category}
                        </h3>

                        <p>
                            ${
                                expense.description ||
                                "No description"
                            }
                        </p>

                        <small>
                            ${expense.date}
                        </small>

                    </div>


                    <div class="history-right">

                        <strong>
                            ₹${expense.amount}
                        </strong>


                        <div class="history-actions">

                            <button
                                class="edit-btn"
                                data-id="${expense.id}"
                            >
                                Edit
                            </button>

                            <button
                                class="delete-btn"
                                data-id="${expense.id}"
                            >
                                Delete
                            </button>

                        </div>

                    </div>

                </div>

            `;

        }
    );


    expenseHistory.innerHTML =
        historyHTML;


    // =========================
    // EDIT BUTTONS
    // =========================

    const editButtons =
        document.querySelectorAll(
            ".edit-btn"
        );


    editButtons.forEach(
        function(button) {

            button.addEventListener(
                "click",
                async function() {

                    const expenseId =
                        button.getAttribute(
                            "data-id"
                        );


                    try {

                        const expenseDoc =
                            await getDoc(

                                doc(
                                    db,
                                    "users",
                                    currentUser.uid,
                                    "expenses",
                                    expenseId
                                )

                            );


                        if (
                            !expenseDoc.exists()
                        ) {

                            alert(
                                "Expense not found."
                            );

                            return;
                        }


                        const expense =
                            expenseDoc.data();


                        const newAmount =
                            prompt(
                                "Enter new amount:",
                                expense.amount
                            );


                        if (
                            newAmount === null
                        ) {

                            return;
                        }


                        if (
                            newAmount === "" ||
                            Number(newAmount) <= 0
                        ) {

                            alert(
                                "Please enter a valid amount."
                            );

                            return;
                        }


                        const newDescription =
                            prompt(
                                "Enter new description:",
                                expense.description ||
                                ""
                            );


                        if (
                            newDescription === null
                        ) {

                            return;
                        }


                        await updateDoc(

                            doc(
                                db,
                                "users",
                                currentUser.uid,
                                "expenses",
                                expenseId
                            ),

                            {
                                amount:
                                    Number(
                                        newAmount
                                    ),

                                description:
                                    newDescription
                            }

                        );


                        alert(
                            "Expense updated successfully!"
                        );


                        await loadExpenses();

                        await loadExpenseHistory();


                        if (
                            calendarDate.value
                        ) {

                            await loadDailyExpenses(
                                calendarDate.value
                            );

                        }

                    } catch (error) {

                        console.error(
                            "Edit error:",
                            error
                        );

                        alert(
                            "Could not update expense."
                        );

                    }

                }
            );

        }
    );


    // =========================
    // DELETE BUTTONS
    // =========================

    const deleteButtons =
        document.querySelectorAll(
            ".delete-btn"
        );


    deleteButtons.forEach(
        function(button) {

            button.addEventListener(
                "click",
                async function() {

                    const expenseId =
                        button.getAttribute(
                            "data-id"
                        );


                    const confirmDelete =
                        confirm(
                            "Are you sure you want to delete this expense?"
                        );


                    if (!confirmDelete) {

                        return;
                    }


                    try {

                        await deleteDoc(

                            doc(
                                db,
                                "users",
                                currentUser.uid,
                                "expenses",
                                expenseId
                            )

                        );


                        alert(
                            "Expense deleted successfully!"
                        );


                        await loadExpenses();

                        await loadExpenseHistory();


                        if (
                            calendarDate.value
                        ) {

                            await loadDailyExpenses(
                                calendarDate.value
                            );

                        }

                    } catch (error) {

                        console.error(
                            "Delete error:",
                            error
                        );

                        alert(
                            "Could not delete expense."
                        );

                    }

                }
            );

        }
    );

}


// =========================
// SEARCH EXPENSE
// =========================

if (searchExpense) {

    searchExpense.addEventListener(
        "input",
        function() {

            applyExpenseFilter();

        }
    );

}


// =========================
// FILTER CATEGORY
// =========================

if (filterCategory) {

    filterCategory.addEventListener(
        "change",
        function() {

            applyExpenseFilter();

        }
    );

}


// =========================
// APPLY SEARCH + FILTER
// =========================

function applyExpenseFilter() {

    const searchText =
        searchExpense.value
            .toLowerCase()
            .trim();

    const selectedCategory =
        filterCategory.value;


    const filteredExpenses =
        currentMonthExpenses.filter(
            function(expense) {

                const category =
                    (
                        expense.category ||
                        ""
                    ).toLowerCase();

                const description =
                    (
                        expense.description ||
                        ""
                    ).toLowerCase();

                const matchesSearch =
                    category.includes(
                        searchText
                    ) ||
                    description.includes(
                        searchText
                    );

                const matchesCategory =
                    selectedCategory ===
                    "All" ||
                    expense.category ===
                    selectedCategory;

                return (
                    matchesSearch &&
                    matchesCategory
                );

            }
        );


    if (
        filteredExpenses.length === 0
    ) {

        expenseHistory.innerHTML = `

            <div class="no-expense">

                <p>
                    No matching expenses found.
                </p>

            </div>

        `;

        return;
    }


    displayExpenseHistory(
        filteredExpenses
    );

}


// =========================
// LOGOUT
// =========================

logoutBtn.addEventListener(
    "click",
    async function() {

        try {

            await signOut(auth);

            window.location.href =
                "index.html";

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );

        }

    }
);