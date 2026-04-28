import { execFileSync } from "node:child_process";
import { exportJWK, exportPKCS8, generateKeyPair } from "jose";

const deploymentArgs = process.argv.slice(2);

const keys = await generateKeyPair("RS256");
const privateKey = (await exportPKCS8(keys.privateKey)).trimEnd().replace(/\n/g, " ");
const publicKey = await exportJWK(keys.publicKey);
const jwks = JSON.stringify({ keys: [{ use: "sig", ...publicKey }] });

execFileSync("bunx", ["convex", "env", "set", ...deploymentArgs, "--", "JWT_PRIVATE_KEY", privateKey], {
  stdio: "ignore",
});
execFileSync("bunx", ["convex", "env", "set", ...deploymentArgs, "--", "JWKS", jwks], {
  stdio: "ignore",
});

console.log("Configured JWT_PRIVATE_KEY and JWKS.");
