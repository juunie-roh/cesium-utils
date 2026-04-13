#!/usr/bin/env node

/**
 * Test script to find minimum compatible Cesium version
 *
 * This script tests your library against different Cesium versions
 * to determine the actual minimum compatible version.
 */

import { execSync } from "child_process";

const CESIUM_VERSIONS_TO_TEST = [
  "1.132.0",
  "1.133.0",
  "1.134.0",
  "1.135.0",
  "1.136.0",
  "1.137.0",
  "1.140.0",
];

async function testCesiumVersion(version) {
  console.log(`\n🧪 Testing Cesium ${version}...`);

  try {
    // Install specific Cesium version
    execSync(`pnpm add cesium@${version}`, { stdio: "pipe" });

    // Run build to check compilation
    execSync("pnpm build", { stdio: "pipe" });

    // Run tests to check runtime compatibility
    execSync("pnpm test", { stdio: "pipe" });

    console.log(`✅ Cesium ${version} - COMPATIBLE`);
    return true;
  } catch (error) {
    console.log(`❌ Cesium ${version} - INCOMPATIBLE`);
    console.log(`   Error: ${error.message.split("\n")[0]}`);
    return false;
  }
}

async function findMinimumVersion() {
  console.log("🔍 Finding minimum compatible Cesium version...\n");

  let minVersion = null;

  for (const version of CESIUM_VERSIONS_TO_TEST) {
    const isCompatible = await testCesiumVersion(version);

    if (isCompatible && !minVersion) {
      minVersion = version;
    }
  }

  if (minVersion) {
    console.log(`\n🎉 Minimum compatible version: ${minVersion}`);
    console.log(`\nUpdate your package.json:`);
    console.log(`"cesium": ">=${minVersion}"`);
  } else {
    console.log("\n❌ No compatible version found in test range");
  }

  // Restore latest Cesium version
  execSync("pnpm add cesium@latest", { stdio: "pipe" });
  console.log("\n🔄 Restored latest Cesium version");
}

findMinimumVersion().catch(console.error);
