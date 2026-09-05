// =========================================================
// GDSVERIFY - AUTHENTICATION FUNCTION
// Netlify Serverless Function
// =========================================================

const crypto = require("crypto");

// ---------------------------------------------------------
// CORS / RESPONSE HELPERS
// ---------------------------------------------------------

function response(statusCode, data) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
    },
    body: JSON.stringify(data)
  };
}

// ---------------------------------------------------------
// PASSWORD HASHING
// ---------------------------------------------------------

function hashPassword(password) {
  return crypto
    .createHash("sha256")
    .update(password)
    .digest("hex");
}

// ---------------------------------------------------------
// DATABASE CONNECTION
// ---------------------------------------------------------

async function getDatabase() {
  /*
   * We will connect this function to the hosted database
   * after the database provider is configured.
   *
   * Required Netlify environment variable:
   *
   * DATABASE_URL
   */

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not configured in Netlify."
    );
  }

  // Database connection will be enabled in the next backend step.
  return null;
}

// ---------------------------------------------------------
// READ REQUEST BODY
// ---------------------------------------------------------

function getBody(event) {
  try {
    if (!event.body) {
      return {};
    }

    return JSON.parse(event.body);
  } catch (error) {
    return {};
  }
}

// ---------------------------------------------------------
// VALIDATE EMAIL
// ---------------------------------------------------------

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---------------------------------------------------------
// REGISTER
// ---------------------------------------------------------

async function registerUser(data) {
  const {
    firstName,
    lastName,
    email,
    phone,
    password
  } = data;

  if (!firstName || !lastName || !email || !phone || !password) {
    return response(400, {
      success: false,
      message: "Please complete all required fields."
    });
  }

  if (!validEmail(email)) {
    return response(400, {
      success: false,
      message: "Please enter a valid email address."
    });
  }

  if (password.length < 6) {
    return response(400, {
      success: false,
      message: "Password must contain at least 6 characters."
    });
  }

  try {
    const db = await getDatabase();

    /*
     * User creation will be connected to the database
     * after DATABASE_URL is configured.
     */

    return response(200, {
      success: true,
      message: "Registration information received.",
      user: {
        firstName,
        lastName,
        email,
        phone
      }
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return response(500, {
      success: false,
      message: "Registration service is not configured yet."
    });
  }
}

// ---------------------------------------------------------
// LOGIN
// ---------------------------------------------------------

async function loginUser(data) {
  const {
    email,
    password
  } = data;

  if (!email || !password) {
    return response(400, {
      success: false,
      message: "Email and password are required."
    });
  }

  if (!validEmail(email)) {
    return response(400, {
      success: false,
      message: "Please enter a valid email address."
    });
  }

  try {
    const db = await getDatabase();

    /*
     * Login verification will be connected to the database
     * after DATABASE_URL is configured.
     */

    const passwordHash = hashPassword(password);

    console.log(
      "Login request:",
      email,
      passwordHash.substring(0, 10) + "..."
    );

    return response(200, {
      success: true,
      message: "Login request received."
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return response(500, {
      success: false,
      message: "Login service is not configured yet."
    });
  }
}

// ---------------------------------------------------------
// MAIN HANDLER
// ---------------------------------------------------------

exports.handler = async function(event) {

  // Handle browser preflight request
  if (event.httpMethod === "OPTIONS") {
    return response(200, {
      success: true
    });
  }

  if (event.httpMethod !== "POST") {
    return response(405, {
      success: false,
      message: "Method not allowed."
    });
  }

  const data = getBody(event);

  const action = String(data.action || "").toLowerCase();

  if (action === "register") {
    return await registerUser(data);
  }

  if (action === "login") {
    return await loginUser(data);
  }

  return response(400, {
    success: false,
    message: "Invalid authentication action."
  });
};
