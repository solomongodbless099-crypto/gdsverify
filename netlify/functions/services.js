// =========================================================
// GDSVERIFY - OTP SERVICES FUNCTION
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

exports.handler = async function (event) {

  if (event.httpMethod === "OPTIONS") {
    return response(200, { success: true });
  }

  if (event.httpMethod !== "GET") {
    return response(405, {
      success: false,
      message: "Method not allowed."
    });
  }

  const apiKey = process.env.FIVESIM_API_KEY;

  if (!apiKey) {
    return response(500, {
      success: false,
      message: "5SIM API key is not configured in Netlify."
    });
  }

  const country = event.queryStringParameters?.country;

  if (!country) {
    return response(400, {
      success: false,
      message: "Country is required."
    });
  }

  try {

    /*
     * We request the available products/services for
     * the selected country from 5SIM.
     */

    const url =
      `${FIVESIM_BASE_URL}/guest/products/${encodeURIComponent(country)}/any`;

    const result = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });

    const data = await result.json();

    if (!result.ok) {
      return response(result.status, {
        success: false,
        message:
          data.message ||
          "Unable to load services from 5SIM."
      });
    }

    return response(200, {
      success: true,
      country: country,
      services: data
    });

  } catch (error) {

    console.error("5SIM SERVICES ERROR:", error);

    return response(500, {
      success: false,
      message: "Unable to connect to 5SIM."
    });
  }
};
