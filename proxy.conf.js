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
			"/edge",
        ],
        target: "https://OKKUNsys.tokyu.co.jp/",
        changeOrigin: true,
        secure: false,
        logLevel: "debug",
        ws: true,
        xfwd: true,
        headers: {
            "Origin": "https://OKKUNsys.tokyu.co.jp",
            "Referer": "https://OKKUNsys.tokyu.co.jp/",
            "X-Forwarded-Host": "OKKUNsys.tokyu.co.jp",
            "X-Forwarded-Proto": "https"
        },
        onProxyRes: function onProxyRes(proxyRes, req, res) {
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        },
    },
];

module.exports = PROXY_CONFIG;