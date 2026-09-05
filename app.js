/* =========================================================
   GDSVERIFY.COM
   CUSTOMER APPLICATION JAVASCRIPT
   PART 1 — CORE / AUTHENTICATION / API
   ========================================================= */

"use strict";

const GDSVERIFY = {
    api: {
        auth: "/.netlify/functions/auth",
        countries: "/.netlify/functions/countries",
        services: "/.netlify/functions/services",
        buyNumber: "/.netlify/functions/buy-number",
        checkOtp: "/.netlify/functions/check-otp",
        wallet: "/.netlify/functions/wallet"
    },

    storage: {
        user: "gdsverify_user",
        token: "gdsverify_token",
        orders: "gdsverify_orders"
    }
};


/* =========================================================
   BASIC HELPERS
   ========================================================= */

function $(id) {
    return document.getElementById(id);
}

function show(element) {
    if (element) {
        element.classList.remove("hidden");
    }
}

function hide(element) {
    if (element) {
        element.classList.add("hidden");
    }
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showMessage(message, type = "info") {
    const box = $("authMessage");

    if (!box) {
        alert(message);
        return;
    }

    box.textContent = message;
    box.className = "auth-message " + type;
    show(box);
}

function getStoredUser() {
    try {
        const data = localStorage.getItem(GDSVERIFY.storage.user);

        if (!data) {
            return null;
        }

        return JSON.parse(data);
    } catch (error) {
        console.error("Unable to read stored user:", error);
        return null;
    }
}

function saveUser(user) {
    localStorage.setItem(
        GDSVERIFY.storage.user,
        JSON.stringify(user)
    );
}

function clearUser() {
    localStorage.removeItem(GDSVERIFY.storage.user);
    localStorage.removeItem(GDSVERIFY.storage.token);
}


/* =========================================================
   API REQUEST HELPER
   ========================================================= */

async function apiRequest(url, options = {}) {
    const config = {
        method: options.method || "GET",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    };

    const token = localStorage.getItem(GDSVERIFY.storage.token);

    if (token) {
        config.headers.Authorization = "Bearer " + token;
    }

    if (options.body !== undefined) {
        config.body =
            typeof options.body === "string"
                ? options.body
                : JSON.stringify(options.body);
    }

    const response = await fetch(url, config);

    let data;

    try {
        data = await response.json();
    } catch (error) {
        data = {
            success: false,
            message: "The server returned an invalid response."
        };
    }

    if (!response.ok) {
        throw new Error(
            data.message ||
            data.error ||
            "Request failed."
        );
    }

    return data;
}


/* =========================================================
   AUTHENTICATION
   ========================================================= */

async function loginUser(email, password) {
    if (!email || !password) {
        throw new Error("Please enter your email and password.");
    }

    const result = await apiRequest(
        GDSVERIFY.api.auth,
        {
            method: "POST",
            body: {
                action: "login",
                email: email.trim().toLowerCase(),
                password: password
            }
        }
    );

    if (result.user) {
        saveUser(result.user);
    }

    if (result.token) {
        localStorage.setItem(
            GDSVERIFY.storage.token,
            result.token
        );
    }

    return result;
}


async function registerUser(formData) {
    const result = await apiRequest(
        GDSVERIFY.api.auth,
        {
            method: "POST",
            body: {
                action: "register",
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email.trim().toLowerCase(),
                phone: formData.phone,
                password: formData.password
            }
        }
    );

    if (result.user) {
        saveUser(result.user);
    }

    if (result.token) {
        localStorage.setItem(
            GDSVERIFY.storage.token,
            result.token
        );
    }

    return result;
}


function logoutUser() {
    clearUser();

    window.location.reload();
}


/* =========================================================
   AUTH SCREEN CONTROL
   ========================================================= */

function showLoginView() {
    const loginView = $("loginView");
    const registerView = $("registerView");

    show(loginView);
    hide(registerView);

    const message = $("authMessage");

    if (message) {
        hide(message);
    }
}


function showRegisterView() {
    const loginView = $("loginView");
    const registerView = $("registerView");

    hide(loginView);
    show(registerView);

    const message = $("authMessage");

    if (message) {
        hide(message);
    }
}


function initializeAuthentication() {

    const loginForm = $("loginForm");
    const registerForm = $("registerForm");

    const showRegisterButton = $("showRegisterBtn");
    const showLoginButton = $("showLoginBtn");

    if (showRegisterButton) {
        showRegisterButton.addEventListener(
            "click",
            function () {
                showRegisterView();
            }
        );
    }

    if (showLoginButton) {
        showLoginButton.addEventListener(
            "click",
            function () {
                showLoginView();
            }
        );
    }


    /* -----------------------------------------------------
       LOGIN
       ----------------------------------------------------- */

    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                const emailInput = $("loginEmail");
                const passwordInput = $("loginPassword");

                const email =
                    emailInput ? emailInput.value.trim() : "";

                const password =
                    passwordInput ? passwordInput.value : "";

                if (!email || !password) {
                    showMessage(
                        "Please enter your email and password.",
                        "error"
                    );
                    return;
                }

                const submitButton =
                    loginForm.querySelector(
                        'button[type="submit"]'
                    );

                if (submitButton) {
                    submitButton.disabled = true;
                    submitButton.textContent = "Signing in...";
                }

                try {

                    const result =
                        await loginUser(email, password);

                    showMessage(
                        result.message ||
                        "Login successful.",
                        "success"
                    );

                    setTimeout(
                        function () {
                            openDashboard();
                        },
                        500
                    );

                } catch (error) {

                    console.error(
                        "Login error:",
                        error
                    );

                    showMessage(
                        error.message ||
                        "Unable to sign in.",
                        "error"
                    );

                } finally {

                    if (submitButton) {
                        submitButton.disabled = false;
                        submitButton.textContent = "Login";
                    }
                }
            }
        );
    }


    /* -----------------------------------------------------
       REGISTRATION
       ----------------------------------------------------- */

    if (registerForm) {

        registerForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                const firstName =
                    $("registerFirstName")?.value.trim() || "";

                const lastName =
                    $("registerLastName")?.value.trim() || "";

                const email =
                    $("registerEmail")?.value.trim() || "";

                const phone =
                    $("registerPhone")?.value.trim() || "";

                const password =
                    $("registerPassword")?.value || "";

                const confirmPassword =
                    $("registerConfirmPassword")?.value || "";

                const terms =
                    $("acceptTerms");

                if (
                    !firstName ||
                    !lastName ||
                    !email ||
                    !phone ||
                    !password ||
                    !confirmPassword
                ) {
                    showMessage(
                        "Please complete all required fields.",
                        "error"
                    );
                    return;
                }

                if (password.length < 6) {
                    showMessage(
                        "Password must contain at least 6 characters.",
                        "error"
                    );
                    return;
                }

                if (password !== confirmPassword) {
                    showMessage(
                        "Passwords do not match.",
                        "error"
                    );
                    return;
                }

                if (terms && !terms.checked) {
                    showMessage(
                        "Please accept the terms and conditions.",
                        "error"
                    );
                    return;
                }

                const submitButton =
                    registerForm.querySelector(
                        'button[type="submit"]'
                    );

                if (submitButton) {
                    submitButton.disabled = true;
                    submitButton.textContent = "Creating account...";
                }

                try {

                    const result =
                        await registerUser({
                            firstName,
                            lastName,
                            email,
                            phone,
                            password
                        });

                    showMessage(
                        result.message ||
                        "Account created successfully.",
                        "success"
                    );

                    setTimeout(
                        function () {
                            openDashboard();
                        },
                        500
                    );

                } catch (error) {

                    console.error(
                        "Registration error:",
                        error
                    );

                    showMessage(
                        error.message ||
                        "Unable to create your account.",
                        "error"
                    );

                } finally {

                    if (submitButton) {
                        submitButton.disabled = false;
                        submitButton.textContent =
                            "Create Account";
                    }
                }
            }
        );
    }
}


/* =========================================================
   DASHBOARD AUTH GATE
   ========================================================= */

function openDashboard() {

    const authScreen = $("authScreen");
    const appScreen = $("appScreen");

    hide(authScreen);
    show(appScreen);

    initializeCustomerDashboard();
}


function openAuthentication() {

    const authScreen = $("authScreen");
    const appScreen = $("appScreen");

    show(authScreen);
    hide(appScreen);

    showLoginView();
}


function checkAuthentication() {

    const user = getStoredUser();

    if (user) {
        openDashboard();
    } else {
        openAuthentication();
    }
}


/* =========================================================
   PASSWORD TOGGLE
   ========================================================= */

function togglePassword(inputId, button) {

    const input = $(inputId);

    if (!input) {
        return;
    }

    if (input.type === "password") {
        input.type = "text";

        if (button) {
            button.textContent = "🙈";
        }

    } else {

        input.type = "password";

        if (button) {
            button.textContent = "👁";
        }
    }
}


/* =========================================================
   FORGOT PASSWORD
   ========================================================= */

function initializeForgotPassword() {

    const button = $("forgotPasswordBtn");

    if (!button) {
        return;
    }

    button.addEventListener(
        "click",
        function () {

            alert(
                "Password recovery will be connected to the secure GDSVERIFY backend."
            );

        }
    );
}


/* =========================================================
   PAGE INITIALIZATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "GDSVERIFY application starting..."
        );

        const yearElements = [
            $("authYear"),
            $("footerYear")
        ];

        const currentYear =
            new Date().getFullYear();

        yearElements.forEach(
            function (element) {

                if (element) {
                    element.textContent =
                        currentYear;
                }

            }
        );

        initializeAuthentication();

        initializeForgotPassword();

        checkAuthentication();

    }
);/* =========================================================
   GDSVERIFY.COM
   CUSTOMER APPLICATION JAVASCRIPT
   PART 2 — DASHBOARD / COUNTRIES / SERVICES / WALLET
   ========================================================= */


/* =========================================================
   DASHBOARD NAVIGATION
   ========================================================= */

function initializeCustomerDashboard() {

    initializeNavigation();
    initializeServiceCards();
    initializeWallet();
    initializeProfile();
    initializeNotifications();
    initializeSupport();

    loadCountries();
    loadServices();

    updateDashboardUser();
    updateWalletBalance();
    loadRecentOrders();
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function initializeNavigation() {

    const navButtons =
        document.querySelectorAll("[data-section]");

    navButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                const sectionName =
                    button.getAttribute("data-section");

                if (sectionName) {
                    showSection(sectionName);
                }

            }
        );

    });

}


function showSection(sectionName) {

    const sections = [
        "home",
        "services",
        "orders",
        "profile"
    ];

    sections.forEach(function (name) {

        const section =
            $(name + "Section");

        if (!section) {
            return;
        }

        if (name === sectionName) {
            show(section);
        } else {
            hide(section);
        }

    });


    const navItems =
        document.querySelectorAll(
            "[data-section]"
        );

    navItems.forEach(function (item) {

        if (
            item.getAttribute("data-section") ===
            sectionName
        ) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }

    });

}


/* =========================================================
   SERVICE CARDS
   ========================================================= */

function initializeServiceCards() {

    const cards =
        document.querySelectorAll(
            "[data-service]"
        );

    cards.forEach(function (card) {

        card.addEventListener(
            "click",
            function () {

                const service =
                    card.getAttribute("data-service");

                switch (service) {

                    case "numbers":
                        openVirtualNumbers();
                        break;

                    case "airtime":
                        showSection("home");
                        alert(
                            "Airtime services are being connected."
                        );
                        break;

                    case "data":
                        showSection("home");
                        alert(
                            "Data services are being connected."
                        );
                        break;

                    case "boost":
                        showSection("home");
                        alert(
                            "Social media services are being connected."
                        );
                        break;

                    default:
                        console.log(
                            "Unknown service:",
                            service
                        );
                }

            }
        );

    });

}


/* =========================================================
   COUNTRIES
   ========================================================= */

let gdsCountries = [];


async function loadCountries() {

    try {

        const result =
            await apiRequest(
                GDSVERIFY.api.countries
            );

        let countries = [];

        if (Array.isArray(result)) {
            countries = result;
        } else if (Array.isArray(result.countries)) {
            countries = result.countries;
        } else if (result.data && Array.isArray(result.data)) {
            countries = result.data;
        } else if (
            result.data &&
            Array.isArray(result.data.countries)
        ) {
            countries = result.data.countries;
        }

        gdsCountries = countries;

        populateCountrySelect();

        console.log(
            "Countries loaded:",
            countries.length
        );

    } catch (error) {

        console.error(
            "Country loading error:",
            error
        );

    }

}


function populateCountrySelect() {

    const select =
        $("countrySelect");

    if (!select) {
        return;
    }

    select.innerHTML =
        '<option value="">Select country</option>';

    gdsCountries.forEach(function (country) {

        let code =
            country.iso ||
            country.code ||
            country.country ||
            "";

        let name =
            country.name ||
            country.title ||
            country.country ||
            code;

        code = String(code).trim();
        name = String(name).trim();

        if (!code) {
            return;
        }

        const option =
            document.createElement("option");

        option.value = code;
        option.textContent =
            name + " (" + code + ")";

        select.appendChild(option);

    });

}


/* =========================================================
   SERVICES
   ========================================================= */

let gdsServices = [];


async function loadServices(country = "") {

    try {

        let url =
            GDSVERIFY.api.services;

        if (country) {
            url +=
                "?country=" +
                encodeURIComponent(country);
        }

        const result =
            await apiRequest(url);

        let services = [];

        if (Array.isArray(result)) {
            services = result;
        } else if (Array.isArray(result.services)) {
            services = result.services;
        } else if (result.data && Array.isArray(result.data)) {
            services = result.data;
        } else if (
            result.data &&
            Array.isArray(result.data.services)
        ) {
            services = result.data.services;
        }

        gdsServices = services;

        populateServiceSelect();

        console.log(
            "Services loaded:",
            services.length
        );

    } catch (error) {

        console.error(
            "Service loading error:",
            error
        );

    }

}


function populateServiceSelect() {

    const select =
        $("serviceSelect");

    if (!select) {
        return;
    }

    select.innerHTML =
        '<option value="">Select service</option>';

    gdsServices.forEach(function (service) {

        let code =
            service.code ||
            service.slug ||
            service.service ||
            service.name ||
            "";

        let name =
            service.name ||
            service.title ||
            service.service ||
            code;

        code = String(code).trim();
        name = String(name).trim();

        if (!code) {
            return;
        }

        const option =
            document.createElement("option");

        option.value = code;
        option.textContent = name;

        select.appendChild(option);

    });

}


/* =========================================================
   COUNTRY → SERVICE
   ========================================================= */

function initializeCountryServiceSelector() {

    const countrySelect =
        $("countrySelect");

    if (!countrySelect) {
        return;
    }

    countrySelect.addEventListener(
        "change",
        function () {

            const country =
                countrySelect.value;

            if (!country) {
                const serviceSelect =
                    $("serviceSelect");

                if (serviceSelect) {
                    serviceSelect.innerHTML =
                        '<option value="">Select service</option>';
                }

                return;
            }

            loadServices(country);

        }
    );

}


/* =========================================================
   WALLET
   ========================================================= */

let gdsWalletBalance = 0;


function initializeWallet() {

    const fundButton =
        $("fundWalletBtn");

    if (fundButton) {

        fundButton.addEventListener(
            "click",
            function () {

                openWalletFunding();

            }
        );

    }

}


async function updateWalletBalance() {

    try {

        const result =
            await apiRequest(
                GDSVERIFY.api.wallet +
                "?action=balance"
            );

        if (
            result &&
            typeof result.balance !== "undefined"
        ) {

            gdsWalletBalance =
                Number(result.balance) || 0;

        } else if (
            result &&
            result.data &&
            typeof result.data.balance !== "undefined"
        ) {

            gdsWalletBalance =
                Number(result.data.balance) || 0;

        }

    } catch (error) {

        console.warn(
            "Wallet balance could not be loaded:",
            error
        );

    }

    renderWalletBalance();

}


function renderWalletBalance() {

    const possibleIds = [
        "walletBalance",
        "balance",
        "homeWalletBalance"
    ];

    possibleIds.forEach(function (id) {

        const element = $(id);

        if (!element) {
            return;
        }

        element.textContent =
            formatNGN(gdsWalletBalance);

    });

}


function formatNGN(amount) {

    const number =
        Number(amount) || 0;

    return "₦" +
        number.toLocaleString(
            "en-NG",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );

}


function openWalletFunding() {

    const amount =
        prompt(
            "Enter the amount you want to fund your wallet (NGN):"
        );

    if (amount === null) {
        return;
    }

    const value =
        Number(
            String(amount)
                .replace(/,/g, "")
                .trim()
        );

    if (!Number.isFinite(value) || value <= 0) {

        alert(
            "Please enter a valid amount."
        );

        return;
    }

    createDeposit(value);

}


async function createDeposit(amount) {

    try {

        const result =
            await apiRequest(
                GDSVERIFY.api.wallet,
                {
                    method: "POST",
                    body: {
                        action: "deposit",
                        amount: amount
                    }
                }
            );

        if (
            result.paymentUrl ||
            result.payment_url
        ) {

            window.location.href =
                result.paymentUrl ||
                result.payment_url;

            return;
        }

        alert(
            result.message ||
            "Your wallet funding request has been received."
        );

    } catch (error) {

        console.error(
            "Deposit error:",
            error
        );

        alert(
            error.message ||
            "Unable to create wallet funding request."
        );

    }

}


/* =========================================================
   USER INFORMATION
   ========================================================= */

function updateDashboardUser() {

    const user =
        getStoredUser();

    if (!user) {
        return;
    }

    const fullName =
        [
            user.firstName,
            user.lastName
        ]
        .filter(Boolean)
        .join(" ") ||
        user.name ||
        "GDSVERIFY User";

    const nameElements = [
        "userName",
        "profileName",
        "welcomeName"
    ];

    nameElements.forEach(function (id) {

        const element = $(id);

        if (element) {
            element.textContent =
                fullName;
        }

    });


    const emailElements = [
        "profileEmail",
        "userEmail"
    ];

    emailElements.forEach(function (id) {

        const element = $(id);

        if (element) {
            element.textContent =
                user.email || "";
        }

    });


    const phoneElements = [
        "profilePhone",
        "userPhone"
    ];

    phoneElements.forEach(function (id) {

        const element = $(id);

        if (element) {
            element.textContent =
                user.phone || "";
        }

    });

}


/* =========================================================
   PROFILE
   ========================================================= */

function initializeProfile() {

    const profileButton =
        $("profileBtn");

    if (profileButton) {

        profileButton.addEventListener(
            "click",
            function () {

                showSection("profile");

            }
        );

    }


    const logoutButton =
        $("logoutBtn");

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            function () {

                const confirmed =
                    confirm(
                        "Are you sure you want to log out?"
                    );

                if (confirmed) {
                    logoutUser();
                }

            }
        );

    }

}


/* =========================================================
   NOTIFICATIONS
   ========================================================= */

function initializeNotifications() {

    const button =
        $("notificationBtn");

    if (!button) {
        return;
    }

    button.addEventListener(
        "click",
        async function () {

            try {

                alert(
                    "You have no new notifications."
                );

            } catch (error) {

                console.error(
                    "Notification error:",
                    error
                );

            }

        }
    );

}


/* =========================================================
   WHATSAPP SUPPORT
   ========================================================= */

function initializeSupport() {

    const button =
        $("whatsappSupportBtn");

    if (!button) {
        return;
    }

    button.addEventListener(
        "click",
        function () {

            const message =
                encodeURIComponent(
                    "Hello GDSVERIFY Support, I need assistance with my account."
                );

            window.open(
                "https://wa.me/2348123608821?text=" +
                message,
                "_blank"
            );

        }
    );

}


/* =========================================================
   RECENT ORDERS
   ========================================================= */

function getLocalOrders() {

    try {

        const data =
            localStorage.getItem(
                GDSVERIFY.storage.orders
            );

        if (!data) {
            return [];
        }

        const orders =
            JSON.parse(data);

        return Array.isArray(orders)
            ? orders
            : [];

    } catch (error) {

        return [];

    }

}


function saveLocalOrder(order) {

    const orders =
        getLocalOrders();

    orders.unshift(order);

    if (orders.length > 20) {
        orders.length = 20;
    }

    localStorage.setItem(
        GDSVERIFY.storage.orders,
        JSON.stringify(orders)
    );

}


function loadRecentOrders() {

    const container =
        $("recentOrders");

    if (!container) {
        return;
    }

    const orders =
        getLocalOrders();

    if (!orders.length) {

        container.innerHTML =
            '<div class="empty-state">No recent orders yet.</div>';

        return;
    }

    container.innerHTML =
        orders.slice(0, 5).map(
            function (order) {

                return `
                    <div class="order-item">
                        <div>
                            <strong>
                                ${escapeHtml(
                                    order.service ||
                                    "Virtual Number"
                                )}
                            </strong>
                            <small>
                                ${escapeHtml(
                                    order.country || ""
                                )}
                            </small>
                        </div>

                        <div>
                            <strong>
                                ${escapeHtml(
                                    order.status ||
                                    "Pending"
                                )}
                            </strong>
                        </div>
                    </div>
                `;

            }
        ).join("");

}


/* =========================================================
   INITIALIZE DASHBOARD EXTRAS
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeCountryServiceSelector();

    }
);

/* =========================================================
   GDSVERIFY.COM
   CUSTOMER APPLICATION JAVASCRIPT
   PART 3 — VIRTUAL NUMBERS / AVAILABILITY / OTP / ORDERS
   ========================================================= */


/* =========================================================
   VIRTUAL NUMBER STATE
   ========================================================= */

let currentNumberOrder = null;


/* =========================================================
   OPEN VIRTUAL NUMBERS
   ========================================================= */

function openVirtualNumbers() {

    const modal =
        $("virtualNumbersModal");

    if (!modal) {

        alert(
            "Virtual number interface is not available yet."
        );

        return;
    }

    show(modal);

    const result =
        $("availabilityResult");

    if (result) {
        result.innerHTML = "";
    }

    loadCountries();

    const countrySelect =
        $("countrySelect");

    const serviceSelect =
        $("serviceSelect");

    if (countrySelect) {
        countrySelect.value = "";
    }

    if (serviceSelect) {
        serviceSelect.innerHTML =
            '<option value="">Select service</option>';
    }

}


/* =========================================================
   CLOSE VIRTUAL NUMBER MODAL
   ========================================================= */

function closeVirtualNumbers() {

    const modal =
        $("virtualNumbersModal");

    if (modal) {
        hide(modal);
    }

    currentNumberOrder = null;

}


/* =========================================================
   AVAILABILITY CHECK
   ========================================================= */

async function checkNumberAvailability() {

    const countrySelect =
        $("countrySelect");

    const serviceSelect =
        $("serviceSelect");

    const resultBox =
        $("availabilityResult");

    const country =
        countrySelect
            ? countrySelect.value.trim()
            : "";

    const service =
        serviceSelect
            ? serviceSelect.value.trim()
            : "";

    if (!country) {

        if (resultBox) {
            resultBox.innerHTML =
                '<div class="error">Please select a country.</div>';
        }

        return;
    }

    if (!service) {

        if (resultBox) {
            resultBox.innerHTML =
                '<div class="error">Please select a service.</div>';
        }

        return;
    }


    if (resultBox) {

        resultBox.innerHTML =
            '<div class="loading">Checking availability...</div>';

    }


    try {

        const url =
            GDSVERIFY.api.buyNumber +
            "?action=availability" +
            "&country=" +
            encodeURIComponent(country) +
            "&service=" +
            encodeURIComponent(service);

        const response =
            await apiRequest(url);

        const available =
            response.available ??
            response.stock ??
            response.count ??
            response.data?.available ??
            response.data?.stock ??
            0;

        if (Number(available) > 0) {

            if (resultBox) {

                resultBox.innerHTML = `
                    <div class="success">
                        <strong>Available</strong>
                        <br>
                        ${escapeHtml(String(available))}
                        number(s) available.
                    </div>
                `;

            }

        } else {

            if (resultBox) {

                resultBox.innerHTML = `
                    <div class="error">
                        No number is currently available
                        for this country and service.
                    </div>
                `;

            }

        }

    } catch (error) {

        console.error(
            "Availability error:",
            error
        );

        if (resultBox) {

            resultBox.innerHTML = `
                <div class="error">
                    ${escapeHtml(
                        error.message ||
                        "Unable to check availability."
                    )}
                </div>
            `;

        }

    }

}


/* =========================================================
   BUY VIRTUAL NUMBER
   ========================================================= */

async function buyVirtualNumber() {

    const countrySelect =
        $("countrySelect");

    const serviceSelect =
        $("serviceSelect");

    const country =
        countrySelect
            ? countrySelect.value.trim()
            : "";

    const service =
        serviceSelect
            ? serviceSelect.value.trim()
            : "";

    if (!country) {

        alert(
            "Please select a country."
        );

        return;
    }

    if (!service) {

        alert(
            "Please select a service."
        );

        return;
    }


    const confirmed =
        confirm(
            "Buy a virtual number for " +
            service +
            " in " +
            country +
            "?"
        );

    if (!confirmed) {
        return;
    }


    try {

        const response =
            await apiRequest(
                GDSVERIFY.api.buyNumber,
                {
                    method: "POST",
                    body: {
                        country: country,
                        service: service
                    }
                }
            );


        const order =
            response.order ||
            response.data ||
            response;


        currentNumberOrder =
            order;


        const localOrder = {

            id:
                order.id ||
                order.order ||
                Date.now(),

            country:
                country,

            service:
                service,

            phone:
                order.phone ||
                order.number ||
                "",

            status:
                order.status ||
                "PENDING",

            price:
                order.price ||
                0,

            createdAt:
                new Date().toISOString()

        };


        saveLocalOrder(
            localOrder
        );


        updateWalletBalance();

        loadRecentOrders();


        displayPurchasedNumber(
            localOrder
        );


    } catch (error) {

        console.error(
            "Purchase error:",
            error
        );

        alert(
            error.message ||
            "Unable to purchase the number."
        );

    }

}


/* =========================================================
   DISPLAY PURCHASED NUMBER
   ========================================================= */

function displayPurchasedNumber(order) {

    const resultBox =
        $("availabilityResult");

    if (!resultBox) {

        alert(
            "Number purchased successfully."
        );

        return;
    }


    const phone =
        order.phone ||
        order.number ||
        "Waiting for number";


    resultBox.innerHTML = `

        <div class="success">

            <strong>
                Number purchased successfully
            </strong>

            <div style="margin-top:10px;">
                <strong>Number:</strong>
                ${escapeHtml(phone)}
            </div>

            <div style="margin-top:6px;">
                <strong>Service:</strong>
                ${escapeHtml(order.service)}
            </div>

            <div style="margin-top:6px;">
                <strong>Country:</strong>
                ${escapeHtml(order.country)}
            </div>

            <div style="margin-top:6px;">
                <strong>Status:</strong>
                ${escapeHtml(order.status)}
            </div>

            <div style="margin-top:14px;">

                <button
                    type="button"
                    id="checkOtpButton"
                    class="primary-btn"
                >
                    Check OTP
                </button>

                <button
                    type="button"
                    id="cancelOrderButton"
                    class="secondary-btn"
                >
                    Cancel
                </button>

            </div>

            <div
                id="otpResult"
                style="margin-top:12px;"
            ></div>

        </div>

    `;


    const checkButton =
        $("checkOtpButton");

    if (checkButton) {

        checkButton.addEventListener(
            "click",
            function () {

                checkOrderOtp(
                    order.id
                );

            }
        );

    }


    const cancelButton =
        $("cancelOrderButton");

    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            function () {

                cancelNumberOrder(
                    order.id
                );

            }
        );

    }

}


/* =========================================================
   CHECK OTP
   ========================================================= */

async function checkOrderOtp(orderId) {

    if (!orderId) {

        alert(
            "Order ID is missing."
        );

        return;
    }


    const resultBox =
        $("otpResult");


    if (resultBox) {

        resultBox.innerHTML =
            '<div class="loading">Checking for OTP...</div>';

    }


    try {

        const url =
            GDSVERIFY.api.checkOtp +
            "?id=" +
            encodeURIComponent(orderId);


        const response =
            await apiRequest(url);


        const order =
            response.order ||
            response.data ||
            response;


        const sms =
            order.sms ||
            order.code ||
            order.otp ||
            order.message ||
            "";


        const status =
            order.status ||
            "PENDING";


        if (sms) {

            if (resultBox) {

                resultBox.innerHTML = `

                    <div class="success">

                        <strong>OTP received</strong>

                        <div
                            style="
                                font-size:28px;
                                font-weight:bold;
                                margin-top:10px;
                            "
                        >
                            ${escapeHtml(String(sms))}
                        </div>

                    </div>

                `;

            }

        } else {

            if (resultBox) {

                resultBox.innerHTML = `

                    <div class="info">

                        <strong>
                            No OTP yet
                        </strong>

                        <br>

                        Status:
                        ${escapeHtml(String(status))}

                        <br><br>

                        Tap "Check OTP" again
                        after the SMS arrives.

                    </div>

                `;

            }

        }


        updateLocalOrderStatus(
            orderId,
            status
        );


    } catch (error) {

        console.error(
            "OTP error:",
            error
        );

        if (resultBox) {

            resultBox.innerHTML = `

                <div class="error">

                    ${escapeHtml(
                        error.message ||
                        "Unable to check OTP."
                    )}

                </div>

            `;

        }

    }

}


/* =========================================================
   CANCEL NUMBER ORDER
   ========================================================= */

async function cancelNumberOrder(orderId) {

    if (!orderId) {

        alert(
            "Order ID is missing."
        );

        return;
    }


    const confirmed =
        confirm(
            "Are you sure you want to cancel this number?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await apiRequest(
                GDSVERIFY.api.buyNumber,
                {
                    method: "DELETE",
                    body: {
                        id: orderId
                    }
                }
            );


        updateLocalOrderStatus(
            orderId,
            "CANCELLED"
        );


        alert(
            response.message ||
            "Order cancelled successfully."
        );


        updateWalletBalance();

        loadRecentOrders();


        closeVirtualNumbers();


    } catch (error) {

        console.error(
            "Cancellation error:",
            error
        );

        alert(
            error.message ||
            "Unable to cancel this order."
        );

    }

}


/* =========================================================
   LOCAL ORDER STATUS
   ========================================================= */

function updateLocalOrderStatus(
    orderId,
    status
) {

    const orders =
        getLocalOrders();


    const updated =
        orders.map(
            function (order) {

                if (
                    String(order.id) ===
                    String(orderId)
                ) {

                    return {
                        ...order,
                        status: status
                    };

                }

                return order;

            }
        );


    localStorage.setItem(
        GDSVERIFY.storage.orders,
        JSON.stringify(updated)
    );


    loadRecentOrders();

}


/* =========================================================
   VIRTUAL NUMBER FORM
   ========================================================= */

function initializeVirtualNumberForm() {

    const form =
        $("virtualNumberForm");


    if (form) {

        form.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();

                buyVirtualNumber();

            }
        );

    }


    const availabilityButton =
        $("checkAvailabilityBtn");


    if (availabilityButton) {

        availabilityButton.addEventListener(
            "click",
            function () {

                checkNumberAvailability();

            }
        );

    }


    const closeButton =
        $("closeVirtualNumbersBtn");


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            function () {

                closeVirtualNumbers();

            }
        );

    }


    const modal =
        $("virtualNumbersModal");


    if (modal) {

        modal.addEventListener(
            "click",
            function (event) {

                if (event.target === modal) {

                    closeVirtualNumbers();

                }

            }
        );

    }

}


/* =========================================================
   ESC KEY
   ========================================================= */

function initializeEscapeHandler() {

    document.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Escape") {

                closeVirtualNumbers();

            }

        }
    );

}


/* =========================================================
   FINAL DASHBOARD INITIALIZATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeVirtualNumberForm();

        initializeEscapeHandler();

        console.log(
            "GDSVERIFY customer features initialized."
        );

    }
);
