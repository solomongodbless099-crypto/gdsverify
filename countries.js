// =========================================================
// GDSVERIFY - OTP COUNTRIES FUNCTION
// Netlify Serverless Function
// 5SIM ONLY
// =========================================================

const FIVESIM_BASE_URL = "https://5sim.net/v1";

function response(statusCode, data) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, OPTIONS"
    },
    body: JSON.stringify(data)
  };
}

// ---------------------------------------------------------
// GET 5SIM COUNTRIES
// ---------------------------------------------------------

async function getCountries() {
  const apiKey = process.env.FIVESIM_API_KEY;

  if (!apiKey) {
    return response(500, {
      success: false,
      message: "5SIM API key is not configured in Netlify."
    });
  }

  try {
    const result = await fetch(
      `${FIVESIM_BASE_URL}/guest/countries`,
      {
        method: "GET",
        headers: {
          "Accept": "application/json"
        }
      }
    );

    const data = await result.json();

    if (!result.ok) {
      return response(result.status, {
        success: false,
        message: data.message || "Unable to load countries from 5SIM."
      });
    }

    return response(200, {
      success: true,
      countries: data
    });

  } catch (error) {
    console.error("5SIM COUNTRIES ERROR:", error);

    return response(500, {
      success: false,
      message: "Unable to connect to 5SIM."
    });
  }
}

// ---------------------------------------------------------
// MAIN HANDLER
// ---------------------------------------------------------

exports.handler = async function(event) {

  if (event.httpMethod === "OPTIONS") {
    return response(200, {
      success: true
    });
  }

  if (event.httpMethod !== "GET") {
    return response(405, {
      success: false,
      message: "Method not allowed."
    });
  }

  return await getCountries();
};
