/* =========================================================
   GDSVERIFY.COM
   CUSTOMER APPLICATION
   APP.JS — PART 1
   AUTHENTICATION + DASHBOARD LOCK
   ========================================================= */

"use strict";

/* =========================================================
   GDSVERIFY CONFIGURATION
   ========================================================= */

const GDSVERIFY = {

    /*
     * Frontend API endpoint.
     *
     * IMPORTANT:
     * PHP cannot run directly on Netlify.
     * We will connect this to the final backend when
     * the backend hosting stage is completed.
     */
    apiBase: "/api.php",

    api: {
        countries: "/api.php?action=countries",
        services: "/api.php?action=services",
        availability: "/api.php?action=availability",
        buy: "/api.php?action=buy",
        order: "/api.php?action=order",
        cancel: "/api.php?action=cancel",
        provider: "/api.php?action=provider"
    },

    storage: {
        session: "gdsverify_auth",
        user: "gdsverify_user",
        remember: "gdsverify_remember"
    }
};


/* =========================================================
   DOM HELPERS
   ========================================================= */

function $(id) {
    return document.getElementById(id);
}

function showElement(element) {
    if (element) {
        element.classList.remove("hidden");
    }
}

function hideElement(element) {
    if (element) {
        element.classList.add("hidden");
    }
}


/* =========================================================
   AUTHENTICATION STATE
   ========================================================= */

/*
 * We use browser storage for the frontend stage.
 *
 * This controls the customer interface while we build the
 * complete backend authentication system.
 *
 * Later, real PHP/MySQL authentication will replace this
 * temporary frontend session mechanism.
 */

function getAuthSession() {

    try {

        const session = sessionStorage.getItem(
            GDSVERIFY.storage.session
        );

        if (session === "authenticated") {
            return true;
        }

        const remembered = localStorage.getItem(
            GDSVERIFY.storage.remember
        );

        return remembered === "authenticated";

    } catch (error) {

        console.error(
            "Unable to read authentication state:",
            error
        );

        return false;
    }
}


function getStoredUser() {

    try {

        const user = localStorage.getItem(
            GDSVERIFY.storage.user
        );

        if (!user) {
            return null;
        }

        return JSON.parse(user);

    } catch (error) {

        console.error(
            "Unable to read stored user:",
            error
        );

        return null;
    }
}


/* =========================================================
   SAVE AUTHENTICATION
   ========================================================= */

function saveAuthentication(user, remember = false) {

    try {

        sessionStorage.setItem(
            GDSVERIFY.storage.session,
            "authenticated"
        );

        localStorage.setItem(
            GDSVERIFY.storage.user,
            JSON.stringify(user)
        );

        if (remember) {

            localStorage.setItem(
                GDSVERIFY.storage.remember,
                "authenticated"
            );

        } else {

            localStorage.removeItem(
                GDSVERIFY.storage.remember
            );
        }

        return true;

    } catch (error) {

        console.error(
            "Unable to save authentication:",
            error
        );

        return false;
    }
}


/* =========================================================
   CLEAR AUTHENTICATION
   ========================================================= */

function clearAuthentication() {

    try {

        sessionStorage.removeItem(
            GDSVERIFY.storage.session
        );

        localStorage.removeItem(
            GDSVERIFY.storage.remember
        );

        localStorage.removeItem(
            GDSVERIFY.storage.user
        );

    } catch (error) {

        console.error(
            "Unable to clear authentication:",
            error
        );
    }
}


/* =========================================================
   AUTH MESSAGE
   ========================================================= */

function showAuthMessage(message, type = "info") {

    const messageBox = $("authMessage");

    if (!messageBox) {
        return;
    }

    messageBox.textContent = message;

    messageBox.className =
        "auth-message show " + type;
}


function hideAuthMessage() {

    const messageBox = $("authMessage");

    if (!messageBox) {
        return;
    }

    messageBox.textContent = "";

    messageBox.className = "auth-message";
}


/* =========================================================
   LOGIN / REGISTER VIEW SWITCHING
   ========================================================= */

function showLoginView() {

    const loginView = $("loginView");
    const registerView = $("registerView");

    showElement(loginView);
    hideElement(registerView);

    hideAuthMessage();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


function showRegisterView() {

    const loginView = $("loginView");
    const registerView = $("registerView");

    hideElement(loginView);
    showElement(registerView);

    hideAuthMessage();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   AUTH SCREEN
   ========================================================= */

function showAuthScreen() {

    const authScreen = $("authScreen");
    const appScreen = $("appScreen");

    showElement(authScreen);
    hideElement(appScreen);

    showLoginView();
}


/* =========================================================
   APPLICATION SCREEN
   ========================================================= */

function showAppScreen() {

    const authScreen = $("authScreen");
    const appScreen = $("appScreen");

    /*
     * Authentication gate:
     *
     * NEVER display the dashboard unless the user is
     * authenticated.
     */

    if (!getAuthSession()) {

        showAuthScreen();

        return false;
    }

    hideElement(authScreen);
    showElement(appScreen);

    initializeCustomerDashboard();

    return true;
}


/* =========================================================
   LOGOUT
   ========================================================= */

function logoutUser() {

    clearAuthentication();

    /*
     * Immediately hide the dashboard.
     */
    hideElement($("appScreen"));

    /*
     * Return to authentication screen.
     */
    showElement($("authScreen"));

    showLoginView();

    showAuthMessage(
        "You have been logged out successfully.",
        "success"
    );

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   PASSWORD VALIDATION
   ========================================================= */

function validatePassword(password) {

    if (!password) {
        return "Please enter your password.";
    }

    if (password.length < 6) {
        return "Password must contain at least 6 characters.";
    }

    return null;
}


function validateEmail(email) {

    if (!email) {
        return "Please enter your email address.";
    }

    const pattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!pattern.test(email)) {
        return "Please enter a valid email address.";
    }

    return null;
}


/* =========================================================
   LOGIN FORM
   ========================================================= */

function handleLogin(event) {

    event.preventDefault();

    hideAuthMessage();

    const emailInput = $("loginEmail");
    const passwordInput = $("loginPassword");
    const rememberInput = $("rememberMe");

    const email =
        emailInput
            ? emailInput.value.trim().toLowerCase()
            : "";

    const password =
        passwordInput
            ? passwordInput.value
            : "";

    const remember =
        rememberInput
            ? rememberInput.checked
            : false;


    /* Validate email */

    const emailError =
        validateEmail(email);

    if (emailError) {

        showAuthMessage(
            emailError,
            "error"
        );

        if (emailInput) {
            emailInput.focus();
        }

        return;
    }


    /* Validate password */

    const passwordError =
        validatePassword(password);

    if (passwordError) {

        showAuthMessage(
            passwordError,
            "error"
        );

        if (passwordInput) {
            passwordInput.focus();
        }

        return;
    }


    /*
     * TEMPORARY FRONTEND LOGIN
     *
     * This lets us build and test the customer interface
     * before connecting the real PHP/MySQL authentication.
     */

    const storedUser =
        getStoredUser();


    /*
     * If the user has previously registered on this browser,
     * verify against the saved account.
     */

    if (storedUser && storedUser.email) {

        if (
            storedUser.email.toLowerCase() !== email
        ) {

            showAuthMessage(
                "No account was found with this email address.",
                "error"
            );

            return;
        }

        if (
            storedUser.password &&
            storedUser.password !== password
        ) {

            showAuthMessage(
                "Incorrect password. Please try again.",
                "error"
            );

            return;
        }

    }


    /*
     * For the temporary frontend stage, if no registered
     * browser account exists, allow the login so we can
     * continue building the interface.
     *
     * Real authentication will be enforced by the backend.
     */

    const user = storedUser || {
        firstName:
            email.split("@")[0] || "Customer",

        lastName: "",

        email: email,

        phone: "",

        password: password
    };


    saveAuthentication(
        user,
        remember
    );


    showAuthMessage(
        "Login successful. Welcome to GDSVERIFY!",
        "success"
    );


    setTimeout(function () {

        showAppScreen();

    }, 500);
}


/* =========================================================
   REGISTRATION FORM
   ========================================================= */

function handleRegistration(event) {

    event.preventDefault();

    hideAuthMessage();


    const firstName =
        $("registerFirstName")
            ? $("registerFirstName").value.trim()
            : "";

    const lastName =
        $("registerLastName")
            ? $("registerLastName").value.trim()
            : "";

    const email =
        $("registerEmail")
            ? $("registerEmail").value.trim().toLowerCase()
            : "";

    const phone =
        $("registerPhone")
            ? $("registerPhone").value.trim()
            : "";

    const password =
        $("registerPassword")
            ? $("registerPassword").value
            : "";

    const confirmPassword =
        $("registerConfirmPassword")
            ? $("registerConfirmPassword").value
            : "";

    const termsAccepted =
        $("acceptTerms")
            ? $("acceptTerms").checked
            : false;


    /* =====================================================
       VALIDATION
       ===================================================== */

    if (!firstName) {

        showAuthMessage(
            "Please enter your first name.",
            "error"
        );

        $("registerFirstName")?.focus();

        return;
    }


    if (!lastName) {

        showAuthMessage(
            "Please enter your last name.",
            "error"
        );

        $("registerLastName")?.focus();

        return;
    }


    const emailError =
        validateEmail(email);

    if (emailError) {

        showAuthMessage(
            emailError,
            "error"
        );

        $("registerEmail")?.focus();

        return;
    }


    if (!phone) {

        showAuthMessage(
            "Please enter your phone number.",
            "error"
        );

        $("registerPhone")?.focus();

        return;
    }


    const passwordError =
        validatePassword(password);

    if (passwordError) {

        showAuthMessage(
            passwordError,
            "error"
        );

        $("registerPassword")?.focus();

        return;
    }


    if (password !== confirmPassword) {

        showAuthMessage(
            "Passwords do not match.",
            "error"
        );

        $("registerConfirmPassword")?.focus();

        return;
    }


    if (!termsAccepted) {

        showAuthMessage(
            "Please accept the Terms of Service to continue.",
            "error"
        );

        return;
    }


    /* =====================================================
       CREATE TEMPORARY CUSTOMER ACCOUNT
       ===================================================== */

    const user = {

        firstName: firstName,

        lastName: lastName,

        email: email,

        phone: phone,

        password: password,

        createdAt:
            new Date().toISOString()
    };


    saveAuthentication(
        user,
        true
    );


    showAuthMessage(
        "Registration successful. Welcome to GDSVERIFY!",
        "success"
    );


    /*
     * Give the customer a moment to see the success message,
     * then unlock the dashboard.
     */

    setTimeout(function () {

        showAppScreen();

    }, 700);
}


/* =========================================================
   INITIAL CUSTOMER DASHBOARD
   ========================================================= */

function initializeCustomerDashboard() {

    const user =
        getStoredUser();


    /*
     * Update customer name wherever the dashboard has a
     * matching element.
     */

    if (user) {

        const fullName =
            (
                (user.firstName || "") +
                " " +
                (user.lastName || "")
            ).trim();


        const possibleNames = [

            $("customerName"),

            $("profileName"),

            $("welcomeName"),

            $("userName")
        ];


        possibleNames.forEach(function (element) {

            if (element && fullName) {

                element.textContent =
                    fullName;
            }

        });
    }


    /*
     * Set authentication-dependent year.
     */

    const authYear =
        $("authYear");

    if (authYear) {

        authYear.textContent =
            new Date().getFullYear();
    }


    /*
     * Continue dashboard initialization.
     *
     * Additional dashboard functions will be added in
     * Part 2 and Part 3.
     */

    if (typeof loadCountries === "function") {

        loadCountries();
    }
}


/* =========================================================
   PASSWORD SHOW / HIDE
   ========================================================= */

function togglePassword(inputId, button) {

    const input =
        $(inputId);

    if (!input) {
        return;
    }


    if (input.type === "password") {

        input.type = "text";

        if (button) {
            button.textContent = "Hide";
        }

    } else {

        input.type = "password";

        if (button) {
            button.textContent = "Show";
        }
    }
}


/* =========================================================
   AUTH EVENT LISTENERS
   ========================================================= */

function setupAuthentication() {

    const loginForm =
        $("loginForm");

    const registerForm =
        $("registerForm");


    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            handleLogin
        );
    }


    if (registerForm) {

        registerForm.addEventListener(
            "submit",
            handleRegistration
        );
    }


    const showRegisterBtn =
        $("showRegisterBtn");

    if (showRegisterBtn) {

        showRegisterBtn.addEventListener(
            "click",
            showRegisterView
        );
    }


    const showLoginBtn =
        $("showLoginBtn");

    if (showLoginBtn) {

        showLoginBtn.addEventListener(
            "click",
            showLoginView
        );
    }


    const logoutBtn =
        $("logoutBtn");

    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            logoutUser
        );
    }


    /*
     * Forgot password is intentionally not fully wired yet.
     * We will connect it to real backend authentication.
     */

    const forgotPasswordBtn =
        $("forgotPasswordBtn");

    if (forgotPasswordBtn) {

        forgotPasswordBtn.addEventListener(
            "click",
            function () {

                showAuthMessage(
                    "Password recovery will be available after the secure account backend is connected.",
                    "info"
                );

            }
        );
    }
}


/* =========================================================
   SECURITY GATE
   ========================================================= */

function enforceAuthenticationGate() {

    /*
     * ALWAYS start with the dashboard hidden.
     */

    hideElement($("appScreen"));


    /*
     * If authenticated, unlock dashboard.
     */

    if (getAuthSession()) {

        showAppScreen();

        return;
    }


    /*
     * Otherwise show login/register only.
     */

    showAuthScreen();
}


/* =========================================================
   APPLICATION STARTUP
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        /*
         * Set current year.
         */

        const authYear =
            $("authYear");

        if (authYear) {

            authYear.textContent =
                new Date().getFullYear();
        }


        /*
         * Set up login/register buttons.
         */

        setupAuthentication();


        /*
         * LOCK DASHBOARD FIRST.
         *
         * This is deliberately the final startup step so
         * unauthenticated visitors never get access to the
         * customer dashboard.
         */

        enforceAuthenticationGate();

    }
);


/* =========================================================
   GLOBAL ACCESS
   ========================================================= */

window.GDSVERIFY = GDSVERIFY;

window.logoutUser =
    logoutUser;

window.showLoginView =
    showLoginView;

window.showRegisterView =
    showRegisterView;

window.togglePassword =
    togglePassword;

/* =========================================================
   GDSVERIFY.COM
   APP.JS — PART 2
   CUSTOMER DASHBOARD + NAVIGATION
   ========================================================= */


/* =========================================================
   DASHBOARD NAVIGATION
   ========================================================= */

function showSection(sectionName) {

    /*
     * Security check:
     * Never allow dashboard sections when logged out.
     */
    if (!getAuthSession()) {
        showAuthScreen();
        return;
    }

    const sections = [
        "homeSection",
        "servicesSection",
        "ordersSection",
        "profileSection"
    ];

    sections.forEach(function (id) {

        const section = $(id);

        if (section) {
            hideElement(section);
        }
    });


    const selectedSection =
        $(sectionName + "Section");

    if (selectedSection) {
        showElement(selectedSection);
    }


    /*
     * Update bottom navigation.
     */
    const navButtons =
        document.querySelectorAll(
            "[data-nav]"
        );

    navButtons.forEach(function (button) {

        button.classList.remove("active");

        if (
            button.getAttribute("data-nav") ===
            sectionName
        ) {
            button.classList.add("active");
        }
    });


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   NAVIGATION BUTTONS
   ========================================================= */

function setupNavigation() {

    const navButtons =
        document.querySelectorAll(
            "[data-nav]"
        );

    navButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                const section =
                    button.getAttribute(
                        "data-nav"
                    );

                if (section) {
                    showSection(section);
                }
            }
        );
    });


    /*
     * Service cards.
     */

    const serviceCards =
        document.querySelectorAll(
            "[data-service]"
        );

    serviceCards.forEach(function (card) {

        card.addEventListener(
            "click",
            function () {

                const service =
                    card.getAttribute(
                        "data-service"
                    );

                handleServiceSelection(
                    service
                );
            }
        );
    });
}


/* =========================================================
   SERVICE SELECTION
   ========================================================= */

function handleServiceSelection(service) {

    if (!getAuthSession()) {

        showAuthScreen();

        return;
    }


    switch (service) {

        case "numbers":

            openVirtualNumbers();

            break;


        case "airtime":

            openAirtimeService();

            break;


        case "data":

            openDataService();

            break;


        case "boost":

            openSocialBoostService();

            break;


        default:

            console.warn(
                "Unknown service:",
                service
            );
    }
}


/* =========================================================
   VIRTUAL NUMBERS
   ========================================================= */

function openVirtualNumbers() {

    /*
     * If the virtual numbers modal already exists in the
     * HTML, display it.
     */

    const modal =
        $("virtualNumbersModal");

    if (modal) {

        showElement(modal);

        loadCountries();

        return;
    }


    /*
     * Otherwise use the services section.
     */

    showSection("services");

    loadCountries();
}


/* =========================================================
   AIRTIME
   ========================================================= */

function openAirtimeService() {

    showSection("services");

    const message =
        $("serviceMessage");

    if (message) {

        message.textContent =
            "Airtime purchase will be available here.";

        showElement(message);
    }
}


/* =========================================================
   DATA
   ========================================================= */

function openDataService() {

    showSection("services");

    const message =
        $("serviceMessage");

    if (message) {

        message.textContent =
            "Data bundle purchase will be available here.";

        showElement(message);
    }
}


/* =========================================================
   SOCIAL BOOST
   ========================================================= */

function openSocialBoostService() {

    showSection("services");

    const message =
        $("serviceMessage");

    if (message) {

        message.textContent =
            "Social media boost services will be available here.";

        showElement(message);
    }
}


/* =========================================================
   COUNTRY NORMALIZATION
   ========================================================= */

function normalizeCountry(country) {

    if (!country) {
        return null;
    }


    if (typeof country === "string") {

        return {
            code: country,
            name: country,
            slug: country.toLowerCase()
        };
    }


    return {

        code:
            country.code ||
            country.iso ||
            country.country ||
            "",

        name:
            country.name ||
            country.title ||
            country.country ||
            country.code ||
            "",

        slug:
            country.slug ||
            country.code ||
            country.country ||
            ""
    };
}


/* =========================================================
   SERVICE NORMALIZATION
   ========================================================= */

function normalizeService(service) {

    if (!service) {
        return null;
    }


    if (typeof service === "string") {

        return {

            code: service,

            name: service
        };
    }


    return {

        code:
            service.code ||
            service.slug ||
            service.service ||
            service.name ||
            "",

        name:
            service.name ||
            service.title ||
            service.service ||
            service.code ||
            ""
    };
}


/* =========================================================
   COUNTRY LABEL
   ========================================================= */

function countryLabel(country) {

    const normalized =
        normalizeCountry(country);

    if (!normalized) {
        return "";
    }

    return (
        normalized.name ||
        normalized.code
    );
}


/* =========================================================
   SERVICE LABEL
   ========================================================= */

function serviceLabel(service) {

    const normalized =
        normalizeService(service);

    if (!normalized) {
        return "";
    }

    return (
        normalized.name ||
        normalized.code
    );
}


/* =========================================================
   HTML ESCAPING
   ========================================================= */

function escapeHtml(value) {

    if (value === null ||
        value === undefined) {

        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   API REQUEST HELPER
   ========================================================= */

async function apiRequest(
    url,
    options = {}
) {

    try {

        const response =
            await fetch(
                url,
                {
                    credentials: "include",
                    ...options
                }
            );


        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        let data;


        if (
            contentType.includes(
                "application/json"
            )
        ) {

            data =
                await response.json();

        } else {

            const text =
                await response.text();

            try {

                data =
                    JSON.parse(text);

            } catch {

                data = {
                    success:
                        response.ok,

                    message:
                        text
                };
            }
        }


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Request failed."
            );
        }


        return data;

    } catch (error) {

        console.error(
            "API request error:",
            error
        );

        throw error;
    }
}


/* =========================================================
   LOAD COUNTRIES
   ========================================================= */

async function loadCountries() {

    if (!getAuthSession()) {
        return;
    }


    const countrySelect =
        $("countrySelect");


    if (!countrySelect) {
        return;
    }


    countrySelect.innerHTML =
        '<option value="">Loading countries...</option>';

    countrySelect.disabled = true;


    try {

        const data =
            await apiRequest(
                GDSVERIFY.api.countries
            );


        let countries =
            data.countries ||
            data.data ||
            data.results ||
            [];


        if (!Array.isArray(countries)) {

            countries =
                Object.entries(
                    countries
                ).map(function (
                    entry
                ) {

                    return {
                        code: entry[0],
                        name: entry[1]
                    };
                });
        }


        countrySelect.innerHTML =
            '<option value="">Select country</option>';


        countries.forEach(
            function (country) {

                const normalized =
                    normalizeCountry(
                        country
                    );


                if (
                    !normalized ||
                    !normalized.code
                ) {
                    return;
                }


                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    normalized.code;

                option.textContent =
                    countryLabel(
                        normalized
                    );


                countrySelect.appendChild(
                    option
                );
            }
        );


        countrySelect.disabled = false;

    } catch (error) {

        countrySelect.innerHTML =
            '<option value="">Unable to load countries</option>';

        countrySelect.disabled = false;

        console.error(
            "Country loading failed:",
            error
        );
    }
}


/* =========================================================
   LOAD SERVICES
   ========================================================= */

async function loadServices(country) {

    if (!getAuthSession()) {
        return;
    }


    const serviceSelect =
        $("serviceSelect");


    if (!serviceSelect) {
        return;
    }


    if (!country) {

        serviceSelect.innerHTML =
            '<option value="">Select country first</option>';

        serviceSelect.disabled = true;

        return;
    }


    serviceSelect.innerHTML =
        '<option value="">Loading services...</option>';

    serviceSelect.disabled = true;


    try {

        const url =
            GDSVERIFY.api.services +
            "&country=" +
            encodeURIComponent(
                country
            );


        const data =
            await apiRequest(url);


        let services =
            data.services ||
            data.data ||
            data.results ||
            [];


        if (!Array.isArray(services)) {

            services =
                Object.entries(
                    services
                ).map(function (
                    entry
                ) {

                    return {
                        code: entry[0],
                        name: entry[1]
                    };
                });
        }


        serviceSelect.innerHTML =
            '<option value="">Select service</option>';


        services.forEach(
            function (service) {

                const normalized =
                    normalizeService(
                        service
                    );


                if (
                    !normalized ||
                    !normalized.code
                ) {
                    return;
                }


                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    normalized.code;

                option.textContent =
                    serviceLabel(
                        normalized
                    );


                serviceSelect.appendChild(
                    option
                );
            }
        );


        serviceSelect.disabled = false;

    } catch (error) {

        serviceSelect.innerHTML =
            '<option value="">Unable to load services</option>';

        serviceSelect.disabled = false;

        console.error(
            "Service loading failed:",
            error
        );
    }
}


/* =========================================================
   COUNTRY CHANGE
   ========================================================= */

function setupCountryServiceSelectors() {

    const countrySelect =
        $("countrySelect");


    if (countrySelect) {

        countrySelect.addEventListener(
            "change",
            function () {

                loadServices(
                    countrySelect.value
                );
            }
        );
    }
}


/* =========================================================
   WALLET
   ========================================================= */

function getWalletBalance() {

    try {

        const balance =
            localStorage.getItem(
                "gdsverify_wallet_balance"
            );

        return parseFloat(balance) || 0;

    } catch {

        return 0;
    }
}


function setWalletBalance(amount) {

    const numericAmount =
        Number(amount) || 0;


    try {

        localStorage.setItem(
            "gdsverify_wallet_balance",
            numericAmount.toFixed(2)
        );

    } catch (error) {

        console.error(
            "Unable to save wallet balance:",
            error
        );
    }


    updateWalletDisplay();
}


function updateWalletDisplay() {

    const balance =
        getWalletBalance();


    const formatted =
        "₦" +
        balance.toLocaleString(
            "en-NG",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );


    const elements =
        document.querySelectorAll(
            "[data-wallet-balance]"
        );


    elements.forEach(
        function (element) {

            element.textContent =
                formatted;
        }
    );


    const walletBalance =
        $("walletBalance");

    if (walletBalance) {

        walletBalance.textContent =
            formatted;
    }
}


/* =========================================================
   FUND WALLET
   ========================================================= */

function fundWallet() {

    if (!getAuthSession()) {

        showAuthScreen();

        return;
    }


    const amount =
        prompt(
            "Enter the amount you want to fund in NGN:"
        );


    if (amount === null) {
        return;
    }


    const numericAmount =
        parseFloat(amount);


    if (
        !Number.isFinite(
            numericAmount
        ) ||
        numericAmount <= 0
    ) {

        alert(
            "Please enter a valid amount."
        );

        return;
    }


    /*
     * This is a temporary frontend wallet action.
     *
     * Real Flutterwave/payment processing will be connected
     * through the secure backend later.
     */

    const currentBalance =
        getWalletBalance();


    setWalletBalance(
        currentBalance +
        numericAmount
    );


    alert(
        "Wallet updated for testing. Real payment processing will be connected later."
    );
}


/* =========================================================
   ORDERS
   ========================================================= */

function loadRecentOrders() {

    const container =
        $("recentOrders");


    if (!container) {
        return;
    }


    try {

        const orders =
            JSON.parse(
                localStorage.getItem(
                    "gdsverify_orders"
                ) || "[]"
            );


        if (
            !Array.isArray(orders) ||
            orders.length === 0
        ) {

            container.innerHTML =
                '<div class="empty-state">No recent orders yet.</div>';

            return;
        }


        container.innerHTML =
            orders
                .slice(0, 5)
                .map(function (order) {

                    return `
                        <div class="order-item">
                            <div>
                                <strong>
                                    ${escapeHtml(
                                        order.service ||
                                        "Verification"
                                    )}
                                </strong>

                                <small>
                                    ${escapeHtml(
                                        order.status ||
                                        "Pending"
                                    )}
                                </small>
                            </div>

                            <strong>
                                ₦${Number(
                                    order.amount || 0
                                ).toLocaleString(
                                    "en-NG"
                                )}
                            </strong>
                        </div>
                    `;

                })
                .join("");

    } catch (error) {

        console.error(
            "Unable to load orders:",
            error
        );
    }
}


/* =========================================================
   PROFILE
   ========================================================= */

function updateProfileDisplay() {

    const user =
        getStoredUser();


    if (!user) {
        return;
    }


    const fullName =
        (
            (user.firstName || "") +
            " " +
            (user.lastName || "")
        ).trim();


    const nameElements =
        document.querySelectorAll(
            "[data-user-name]"
        );


    nameElements.forEach(
        function (element) {

            element.textContent =
                fullName ||
                "GDSVERIFY Customer";
        }
    );


    const emailElements =
        document.querySelectorAll(
            "[data-user-email]"
        );


    emailElements.forEach(
        function (element) {

            element.textContent =
                user.email || "";
        }
    );


    const phoneElements =
        document.querySelectorAll(
            "[data-user-phone]"
        );


    phoneElements.forEach(
        function (element) {

            element.textContent =
                user.phone || "";
        }
    );
}


/* =========================================================
   NOTIFICATIONS
   ========================================================= */

function openNotifications() {

    if (!getAuthSession()) {

        showAuthScreen();

        return;
    }


    alert(
        "Your GDSVERIFY notifications will appear here."
    );
}


/* =========================================================
   PROFILE BUTTON
   ========================================================= */

function openProfile() {

    if (!getAuthSession()) {

        showAuthScreen();

        return;
    }


    showSection("profile");
}


/* =========================================================
   WHATSAPP SUPPORT
   ========================================================= */

function openWhatsAppSupport() {

    if (!getAuthSession()) {

        showAuthScreen();

        return;
    }


    const phone =
        "2348123608821";

    const message =
        "Hello GDSVERIFY Support, I need help with my account/service.";

    const whatsappUrl =
        "https://wa.me/" +
        phone +
        "?text=" +
        encodeURIComponent(
            message
        );


    window.location.href =
        whatsappUrl;
}


/* =========================================================
   GENERAL DASHBOARD BUTTONS
   ========================================================= */

function setupDashboardButtons() {

    const fundWalletBtn =
        $("fundWalletBtn");


    if (fundWalletBtn) {

        fundWalletBtn.addEventListener(
            "click",
            fundWallet
        );
    }


    const notificationBtn =
        $("notificationBtn");


    if (notificationBtn) {

        notificationBtn.addEventListener(
            "click",
            openNotifications
        );
    }


    const profileBtn =
        $("profileBtn");


    if (profileBtn) {

        profileBtn.addEventListener(
            "click",
            openProfile
        );
    }


    const whatsappSupportBtn =
        $("whatsappSupportBtn");


    if (whatsappSupportBtn) {

        whatsappSupportBtn.addEventListener(
            "click",
            openWhatsAppSupport
        );
    }
}


/* =========================================================
   DASHBOARD INITIALIZATION
   ========================================================= */

function initializeDashboardFeatures() {

    if (!getAuthSession()) {
        return;
    }


    setupNavigation();

    setupCountryServiceSelectors();

    setupDashboardButtons();

    updateWalletDisplay();

    updateProfileDisplay();

    loadRecentOrders();
}


/* =========================================================
   EXTEND DASHBOARD INITIALIZATION
   ========================================================= */

const originalInitializeCustomerDashboard =
    initializeCustomerDashboard;


initializeCustomerDashboard =
    function () {

        /*
         * Run authentication-safe dashboard setup.
         */

        if (!getAuthSession()) {
            return;
        }


        originalInitializeCustomerDashboard();


        initializeDashboardFeatures();

    };


/* =========================================================
   GLOBAL CUSTOMER FUNCTIONS
   ========================================================= */

window.showSection =
    showSection;

window.loadCountries =
    loadCountries;

window.loadServices =
    loadServices;

window.fundWallet =
    fundWallet;

window.openVirtualNumbers =
    openVirtualNumbers;

window.openWhatsAppSupport =
    openWhatsAppSupport;

window.openProfile =
    openProfile;

window.openNotifications =
    openNotifications;

 /* =========================================================
    GDSVERIFY.COM
    APP.JS — PART 3
    VIRTUAL NUMBERS + OTP PURCHASE + ORDERS
    ========================================================= */


/* =========================================================
   MODAL HELPERS
   ========================================================= */

function closeModal(modalId) {

    const modal = $(modalId);

    if (modal) {
        hideElement(modal);
    }
}


function openModal(modalId) {

    if (!getAuthSession()) {
        showAuthScreen();
        return;
    }

    const modal = $(modalId);

    if (modal) {
        showElement(modal);
    }
}


/* =========================================================
   VIRTUAL NUMBER FORM
   ========================================================= */

function setupVirtualNumberForm() {

    const form = $("virtualNumberForm");

    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            if (!getAuthSession()) {
                showAuthScreen();
                return;
            }


            const countrySelect =
                $("countrySelect");

            const serviceSelect =
                $("serviceSelect");


            const country =
                countrySelect
                    ? countrySelect.value
                    : "";

            const service =
                serviceSelect
                    ? serviceSelect.value
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


            await checkNumberAvailability(
                country,
                service
            );
        }
    );
}


/* =========================================================
   CHECK NUMBER AVAILABILITY
   ========================================================= */

async function checkNumberAvailability(
    country,
    service
) {

    if (!getAuthSession()) {
        showAuthScreen();
        return;
    }


    const resultBox =
        $("availabilityResult");


    if (resultBox) {

        resultBox.innerHTML =
            "Checking available numbers...";

        showElement(resultBox);
    }


    try {

        const url =
            GDSVERIFY.api.availability +
            "&country=" +
            encodeURIComponent(country) +
            "&service=" +
            encodeURIComponent(service);


        const data =
            await apiRequest(url);


        displayAvailabilityResult(
            data,
            country,
            service
        );

    } catch (error) {

        console.error(
            "Availability error:",
            error
        );


        if (resultBox) {

            resultBox.innerHTML =
                `
                <div class="service-message error">
                    Unable to check availability right now.
                    Please try again.
                </div>
                `;
        }
    }
}


/* =========================================================
   DISPLAY AVAILABILITY
   ========================================================= */

function displayAvailabilityResult(
    data,
    country,
    service
) {

    const resultBox =
        $("availabilityResult");


    if (!resultBox) {
        return;
    }


    const available =
        data.available ??
        data.stock ??
        data.count ??
        0;


    const price =
        data.price ??
        data.selling_price ??
        data.amount ??
        0;


    if (
        Number(available) <= 0
    ) {

        resultBox.innerHTML =
            `
            <div class="service-message warning">
                No numbers are currently available
                for this service.
            </div>
            `;

        return;
    }


    resultBox.innerHTML =
        `
        <div class="availability-card">

            <div class="availability-info">

                <strong>
                    Number Available
                </strong>

                <span>
                    ${escapeHtml(
                        String(available)
                    )}
                </span>

            </div>


            <div class="availability-info">

                <strong>
                    Price
                </strong>

                <span>
                    ₦${Number(
                        price
                    ).toLocaleString(
                        "en-NG"
                    )}
                </span>

            </div>


            <button
                type="button"
                class="btn-primary"
                id="buyNumberBtn"
            >
                Buy Number
            </button>

        </div>
        `;


    const buyButton =
        $("buyNumberBtn");


    if (buyButton) {

        buyButton.addEventListener(
            "click",
            function () {

                confirmNumberPurchase(
                    country,
                    service,
                    price
                );
            }
        );
    }
}


/* =========================================================
   PURCHASE CONFIRMATION
   ========================================================= */

function confirmNumberPurchase(
    country,
    service,
    price
) {

    if (!getAuthSession()) {

        showAuthScreen();

        return;
    }


    const amount =
        Number(price) || 0;


    const countryName =
        countryLabel(country);


    const serviceName =
        serviceLabel(service);


    const confirmed =
        window.confirm(
            "Buy " +
            serviceName +
            " number for " +
            countryName +
            "?\n\n" +
            "Price: ₦" +
            amount.toLocaleString(
                "en-NG"
            )
        );


    if (!confirmed) {
        return;
    }


    purchaseNumber(
        country,
        service,
        amount
    );
}


/* =========================================================
   PURCHASE NUMBER
   ========================================================= */

async function purchaseNumber(
    country,
    service,
    amount
) {

    if (!getAuthSession()) {

        showAuthScreen();

        return;
    }


    const balance =
        getWalletBalance();


    if (balance < amount) {

        alert(
            "Insufficient wallet balance. Please fund your wallet first."
        );

        return;
    }


    try {

        const data =
            await apiRequest(
                GDSVERIFY.api.buy,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        country:
                            country,

                        service:
                            service
                    })
                }
            );


        if (
            data.success === false
        ) {

            throw new Error(
                data.message ||
                "Purchase failed."
            );
        }


        /*
         * Deduct customer wallet balance.
         */

        setWalletBalance(
            balance - amount
        );


        /*
         * Save order locally for the frontend stage.
         */

        saveOrder({

            id:
                data.order_id ||
                data.id ||
                Date.now(),

            country:
                country,

            service:
                service,

            amount:
                amount,

            status:
                "Active",

            number:
                data.number ||
                "",

            createdAt:
                new Date().toISOString()
        });


        /*
         * Display the purchased number.
         */

        displayPurchasedNumber(
            data
        );


        loadRecentOrders();

    } catch (error) {

        console.error(
            "Number purchase failed:",
            error
        );


        alert(
            error.message ||
            "Unable to purchase number."
        );
    }
}


/* =========================================================
   DISPLAY PURCHASED NUMBER
   ========================================================= */

function displayPurchasedNumber(data) {

    const number =
        data.number ||
        data.phone ||
        data.phone_number ||
        "";


    const orderId =
        data.order_id ||
        data.id ||
        "";


    const sms =
        data.sms ||
        data.code ||
        "";


    const resultBox =
        $("availabilityResult");


    if (!resultBox) {
        return;
    }


    resultBox.innerHTML =
        `
        <div class="number-result">

            <div class="number-result-title">
                Number Purchased Successfully
            </div>


            <div class="number-display">
                ${escapeHtml(
                    number ||
                    "Number assigned"
                )}
            </div>


            ${
                orderId
                ?
                `
                <div class="order-reference">
                    Order ID:
                    ${escapeHtml(
                        String(orderId)
                    )}
                </div>
                `
                :
                ""
            }


            <div
                id="otpDisplay"
                class="otp-display"
            >
                ${
                    sms
                    ?
                    "OTP: " +
                    escapeHtml(
                        String(sms)
                    )
                    :
                    "Waiting for OTP..."
                }
            </div>


            ${
                orderId
                ?
                `
                <button
                    type="button"
                    class="btn-primary"
                    id="checkOtpBtn"
                    data-order-id="${escapeHtml(
                        String(orderId)
                    )}"
                >
                    Check OTP
                </button>
                `
                :
                ""
            }

        </div>
        `;


    const checkOtpBtn =
        $("checkOtpBtn");


    if (checkOtpBtn) {

        checkOtpBtn.addEventListener(
            "click",
            function () {

                checkOTP(
                    checkOtpBtn.getAttribute(
                        "data-order-id"
                    )
                );
            }
        );
    }
}


/* =========================================================
   CHECK OTP
   ========================================================= */

async function checkOTP(orderId) {

    if (!getAuthSession()) {

        showAuthScreen();

        return;
    }


    if (!orderId) {

        alert(
            "Order ID is missing."
        );

        return;
    }


    const otpDisplay =
        $("otpDisplay");


    if (otpDisplay) {

        otpDisplay.textContent =
            "Checking for OTP...";
    }


    try {

        const url =
            GDSVERIFY.api.order +
            "&id=" +
            encodeURIComponent(
                orderId
            );


        const data =
            await apiRequest(url);


        const otp =
            data.otp ||
            data.code ||
            data.sms ||
            data.status;


        if (otp) {

            if (otpDisplay) {

                otpDisplay.textContent =
                    "OTP: " +
                    String(otp);
            }

        } else {

            if (otpDisplay) {

                otpDisplay.textContent =
                    "No OTP received yet. Try again.";
            }
        }

    } catch (error) {

        console.error(
            "OTP check failed:",
            error
        );


        if (otpDisplay) {

            otpDisplay.textContent =
                "Unable to check OTP right now.";
        }
    }
}


/* =========================================================
   CANCEL ORDER
   ========================================================= */

async function cancelOrder(orderId) {

    if (!getAuthSession()) {

        showAuthScreen();

        return;
    }


    if (!orderId) {
        return;
    }


    const confirmed =
        window.confirm(
            "Are you sure you want to cancel this order?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const data =
            await apiRequest(
                GDSVERIFY.api.cancel ||
                "/api.php?action=cancel",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        id:
                            orderId
                    })
                }
            );


        if (
            data.success === false
        ) {

            throw new Error(
                data.message ||
                "Unable to cancel order."
            );
        }


        alert(
            "Order cancelled successfully."
        );


        loadRecentOrders();

    } catch (error) {

        console.error(
            "Order cancellation failed:",
            error
        );


        alert(
            error.message ||
            "Unable to cancel order."
        );
    }
}


/* =========================================================
   SAVE ORDER
   ========================================================= */

function saveOrder(order) {

    try {

        const existing =
            JSON.parse(
                localStorage.getItem(
                    "gdsverify_orders"
                ) || "[]"
            );


        if (!Array.isArray(existing)) {
            return;
        }


        existing.unshift(order);


        localStorage.setItem(
            "gdsverify_orders",
            JSON.stringify(
                existing.slice(0, 50)
            )
        );

    } catch (error) {

        console.error(
            "Unable to save order:",
            error
        );
    }
}


/* =========================================================
   VIRTUAL NUMBER MODAL CONTROLS
   ========================================================= */

function setupModalControls() {

    const closeButtons =
        document.querySelectorAll(
            "[data-close-modal]"
        );


    closeButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const modalId =
                        button.getAttribute(
                            "data-close-modal"
                        );

                    if (modalId) {
                        closeModal(modalId);
                    }
                }
            );
        }
    );


    /*
     * Clicking the dark backdrop closes the modal.
     */

    document
        .querySelectorAll(".modal")
        .forEach(
            function (modal) {

                modal.addEventListener(
                    "click",
                    function (event) {

                        if (
                            event.target ===
                            modal
                        ) {

                            hideElement(
                                modal
                            );
                        }
                    }
                );
            }
        );
}


/* =========================================================
   ESC KEY
   ========================================================= */

function setupEscapeKey() {

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key !==
                "Escape"
            ) {
                return;
            }


            document
                .querySelectorAll(".modal")
                .forEach(
                    function (modal) {

                        hideElement(
                            modal
                        );
                    }
                );
        }
    );
}


/* =========================================================
   EXTEND DASHBOARD INITIALIZATION AGAIN
   ========================================================= */

const previousDashboardFeatures =
    initializeDashboardFeatures;


initializeDashboardFeatures =
    function () {

        if (!getAuthSession()) {
            return;
        }


        previousDashboardFeatures();


        setupVirtualNumberForm();

        setupModalControls();

        setupEscapeKey();

        updateWalletDisplay();

        updateProfileDisplay();

        loadRecentOrders();
    };


/* =========================================================
   GLOBAL VIRTUAL NUMBER FUNCTIONS
   ========================================================= */

window.checkNumberAvailability =
    checkNumberAvailability;

window.purchaseNumber =
    purchaseNumber;

window.checkOTP =
    checkOTP;

window.cancelOrder =
    cancelOrder;

window.closeModal =
    closeModal;

window.openModal =
    openModal;
