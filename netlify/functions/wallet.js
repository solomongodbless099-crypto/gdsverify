// =========================================================
// GDSVERIFY - WALLET FUNCTION
// Netlify Serverless Function
// =========================================================

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

  if (event.httpMethod !== "GET" && event.httpMethod !== "POST") {
    return response(405, {
      success: false,
      message: "Method not allowed."
    });
  }

  const body = getBody(event);

  const action =
    body.action ||
    event.queryStringParameters?.action ||
    "balance";

  // -------------------------------------------------------
  // GET WALLET BALANCE
  // -------------------------------------------------------

  if (action === "balance") {

    /*
     * Database connection will be added after we configure
     * the hosted database.
     */

    return response(200, {
      success: true,
      balance: 0,
      currency: "NGN",
      message: "Wallet endpoint is ready."
    });
  }

  // -------------------------------------------------------
  // CREATE DEPOSIT
  // -------------------------------------------------------

  if (action === "deposit") {

    const amount = Number(body.amount || 0);

    if (!amount || amount <= 0) {
      return response(400, {
        success: false,
        message: "Enter a valid deposit amount."
      });
    }

    /*
     * Payment gateway integration will be connected here.
     * We will not credit the wallet directly from the browser.
     */

    return response(200, {
      success: true,
      message: "Deposit request received.",
      amount: amount,
      currency: "NGN"
    });
  }

  // -------------------------------------------------------
  // INVALID ACTION
  // -------------------------------------------------------

  return response(400, {
    success: false,
    message: "Invalid wallet action."
  });
};
