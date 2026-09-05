// =========================================================
// GDSVERIFY - CHECK OTP FUNCTION
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

  // Browser preflight
  if (event.httpMethod === "OPTIONS") {
    return response(200, {
      success: true
    });
  }

  // Only GET is allowed
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

  const orderId =
    event.queryStringParameters?.id ||
    event.queryStringParameters?.orderId;

  if (!orderId) {
    return response(400, {
      success: false,
      message: "Order ID is required."
    });
  }

  try {

    /*
     * Check the current order status on 5SIM.
     *
     * The API key remains on the Netlify server.
     */

    const url =
      `${FIVESIM_BASE_URL}/user/check/${encodeURIComponent(orderId)}`;

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
          "Unable to check the OTP order.",
        provider: data
      });
    }

    return response(200, {
      success: true,
      order: data
    });

  } catch (error) {

    console.error("CHECK OTP ERROR:", error);

    return response(500, {
      success: false,
      message: "Unable to connect to 5SIM."
    });
  }
};
