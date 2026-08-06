import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
export default defineConfig([...nextVitals, globalIgnores([".next/**","out/**","TravelTank300-step-*/**","TravelTank300-backup-*/**"])]);
