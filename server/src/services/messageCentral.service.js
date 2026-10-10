
const BASE_URL = (
  process.env.MESSAGE_CENTRAL_BASE_URL ||
  "https://cpaas.messagecentral.com"
).replace(/\/+$/, "");

let cachedAuthToken = null;
let tokenExpiresAt = 0;

const getRequiredEnv = (name) => {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
};

const parseResponse = async (response, operation) => {
  const text = await response.text();

  let data;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { rawResponse: text.slice(0, 500) };
  }

  if (!response.ok) {
    console.error(`Message Central ${operation} failed:`, {
      httpStatus: response.status,
      responseCode: data?.responseCode,
      message: data?.message || data?.error,
      responseBody: data?.rawResponse,
    });

    throw new Error(
      data?.message ||
        data?.error ||
        `Message Central ${operation} failed (HTTP ${response.status})`
    );
  }

  return data;
};

async function requestToken({ forceRefresh = false } = {}) {
  if (
    !forceRefresh &&
    cachedAuthToken &&
    Date.now() < tokenExpiresAt
  ) {
    return cachedAuthToken;
  }

  const customerId = getRequiredEnv(
    "MESSAGE_CENTRAL_CUSTOMER_ID"
  );
  const email = getRequiredEnv(
    "MESSAGE_CENTRAL_EMAIL"
  );
  const key = getRequiredEnv(
    "MESSAGE_CENTRAL_PASSWORD_BASE64"
  );

  const params = new URLSearchParams({
    customerId,
    key,
    scope: "NEW",
    country: "91",
    email,
  });

  let response;

  try {
    response = await fetch(
      `${BASE_URL}/auth/v1/authentication/token?${params}`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
        },
        signal: AbortSignal.timeout(15000),
      }
    );
  } catch (error) {
    console.error("Message Central token network error:", {
      message: error.message,
    });

    throw new Error(
      "Unable to connect to Message Central token API"
    );
  }

  const result = await parseResponse(
    response,
    "token generation"
  );

  const token = result?.token || result?.data?.token;

  if (typeof token !== "string" || !token.trim()) {
    console.error("Message Central token missing:", {
      httpStatus: response.status,
      responseCode: result?.responseCode,
      message: result?.message,
      responseKeys: Object.keys(result || {}),
    });

    throw new Error(
      "Message Central returned no usable authentication token"
    );
  }

  cachedAuthToken = token.trim();

  // Cache locally; actual token expiry depends on the provider.
  tokenExpiresAt = Date.now() + 20 * 60 * 60 * 1000;

  console.log("Message Central authentication token ready.");

  return cachedAuthToken;
}

export const sendProviderOTP = async (phone) => {
  const authToken = await requestToken();
  const customerId = getRequiredEnv(
    "MESSAGE_CENTRAL_CUSTOMER_ID"
  );

  const params = new URLSearchParams({
    customerId,
    countryCode: "91",
    flowType: "SMS",
    mobileNumber: String(phone).trim(),
    otpLength: "6",
  });

  let response;

  try {
    response = await fetch(
      `${BASE_URL}/verification/v3/send?${params}`,
      {
        method: "POST",
        headers: {
          authToken,
          accept: "application/json",
        },
        signal: AbortSignal.timeout(15000),
      }
    );
  } catch (error) {
    console.error("Message Central send network error:", {
      message: error.message,
    });

    throw new Error(
      "Unable to connect to Message Central OTP API"
    );
  }

  const result = await parseResponse(response, "OTP sending");
  const data = result?.data;
  const verificationId = data?.verificationId;

  if (
    String(result?.responseCode) !== "200" ||
    !verificationId
  ) {
    console.error("Unexpected OTP send response:", {
      responseCode: result?.responseCode,
      message: result?.message,
      dataKeys: Object.keys(data || {}),
    });

    throw new Error(
      result?.message ||
        "Message Central did not return a verification ID"
    );
  }

  console.log("Message Central OTP request accepted:", {
    hasVerificationId: true,
    timeoutSeconds: Number(data?.timeout) || 60,
  });

  return {
    verificationId: String(verificationId),
    timeoutSeconds: Number(data?.timeout) || 60,
  };
};

export const verifyProviderOTP = async ({
  verificationId,
  code,
}) => {
  if (!verificationId || !code) {
    throw new Error(
      "verificationId and OTP code are required"
    );
  }

  const authToken = await requestToken();

  // Validation parameters: verificationId and code.
  const params = new URLSearchParams({
    verificationId: String(verificationId).trim(),
    code: String(code).trim(),
  });

  let response;

  try {
    response = await fetch(
      `${BASE_URL}/verification/v3/validateOtp?${params}`,
      {
        method: "GET",
        headers: {
          authToken,
          accept: "application/json",
        },
        signal: AbortSignal.timeout(15000),
      }
    );
  } catch (error) {
    console.error("Message Central validation network error:", {
      message: error.message,
    });

    throw new Error(
      "Unable to connect to Message Central validation API"
    );
  }

  const result = await parseResponse(
    response,
    "OTP verification"
  );

  const status =
    result?.data?.verificationStatus ||
    result?.verificationStatus;

  console.log("Message Central verification result:", {
    httpStatus: response.status,
    responseCode: result?.responseCode,
    verificationStatus: status || "not provided",
    message: result?.message,
  });

  return (
    String(result?.responseCode) === "200" &&
    (
      status === "VERIFICATION_COMPLETED" ||
      status === "VERIFIED"
    )
  );
};
