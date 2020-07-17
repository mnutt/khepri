module.exports = {
  packagerConfig: {
    name: "Khepri",
    version: "2.0.1",
    appBundleId: "im.nutt.khepri",
    appCategoryType: "public.app-category.developer-tools",
    icon: "./public/assets/images/icons/Khepri.icns",
    ignore: ["/ember-test(/|$)", "/tests(/|$)"],
    osxSign: {
      identity: "Developer ID Application: Michael Nutt (K2729JKG8V)",
      hardenedRuntime: true,
      entitlements: "./electron-app/entitlements.plist",
      "entitlements-inherit": "./electron-app/entitlements.plist",
      "signature-flags": "library"
    },
    osxNotarize: {
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_ID_PASSWORD
    }
  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "khepri"
      }
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"]
    },
    {
      name: "@electron-forge/maker-deb",
      config: {}
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {}
    }
  ]
};
