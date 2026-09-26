import { Cashfree } from "cashfree-pg";

const environment =
  process.env.CASHFREE_ENV === "production"
    ? Cashfree.PRODUCTION
    : Cashfree.SANDBOX;

const cashfree = new Cashfree(
  environment,
  process.env.CASHFREE_APP_ID,
  process.env.CASHFREE_SECRET_KEY
);

export default cashfree;