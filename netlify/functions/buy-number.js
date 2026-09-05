// =========================================================
// GDSVERIFY - BUY VIRTUAL NUMBER
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
      "Access-Control-Allow-Methods": "POST, OPTIONS"
    },
    body: JSON.stringify(data)
  };
}

function getBody(event) {
  try {
    return event.body ? JSON.parse(event.body) : {};
  } catch {
    return {};
  }
}

exports.handler = async function (event) {

  // Browser preflight
  if (event.httpMethod === "OPTIONS") {
    return response(200, {
      success: true
    });
  }

  // Only POST is allowed
  if (event.httpMethod !== "POST") {
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

  const body = getBody(event);

  const country = String(body.country || "").trim();
  const service = String(body.service || "").trim();

  if (!country || !service) {
    return response(400, {
      success: false,
      message: "Country and service are required."
    });
  }

  try {

    /*
     * 5SIM purchase endpoint.
     *
     * The API key is sent only from the Netlify server.
     * It is NEVER exposed to the customer's browser.
     */

    const url =
      `${FIVESIM_BASE_URL}/user/buy/activation/` +
      `${encodeURIComponent(country)}/any/` +
      `${encodeURIComponent(service)}`;

    const result = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json"
      }
    });

    const data = await result.json();

    if (!result.ok) {
      return response(result.status, {
        success: false,
        message:
          data.message ||
          data.error ||
          "5SIM could not complete the purchase.",
        provider: data
      });
    }

    return response(200, {
      success: true,
      message: "Number purchased successfully.",
      order: data
    });

  } catch (error) {

    console.error("BUY NUMBER ERROR:", error);

    return response(500, {
      success: false,
      message: "Unable to connect to 5SIM."
    });
  }
};
