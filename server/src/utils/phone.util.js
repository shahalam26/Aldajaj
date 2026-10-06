const normalizePhone = (phone) => {
  if (typeof phone !== "string") {
    return "";
  }

  let normalizedPhone = phone.trim().replace(/[\s()-]/g, "");

  if (normalizedPhone.startsWith("+91")) {
    normalizedPhone = normalizedPhone.slice(3);
  } else if (
    normalizedPhone.startsWith("91") &&
    normalizedPhone.length === 12
  ) {
    normalizedPhone = normalizedPhone.slice(2);
  } else if (
    normalizedPhone.startsWith("0") &&
    normalizedPhone.length === 11
  ) {
    normalizedPhone = normalizedPhone.slice(1);
  }

  return normalizedPhone;
};

const isValidPhone = (phone) => {
  return /^[6-9]\d{9}$/.test(phone);
};

export { normalizePhone, isValidPhone };