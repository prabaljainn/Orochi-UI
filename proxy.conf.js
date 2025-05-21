const PROXY_CONFIG = [
    {
        context: [
            "/ui-api",
            "/public",
            "/management",
            "/endpoints",
            "/auth",
            "/oauth2",
            "/saml2",
            "/msgraph",
            "/websocket",
            "/login",
			"/api",
        ],
        target: "https://sudocodes.com/",
        changeOrigin: true,
        secure: true,
        logLevel: "debug",
        ws: true,
        xfwd: true,
        onProxyRes: function onProxyRes(proxyRes, req, res) {},
    },
];

module.exports = PROXY_CONFIG;