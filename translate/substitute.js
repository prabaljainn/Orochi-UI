var fs = require("fs");
fs.readFile(
    "src/environments/environment.prod.ts",
    "utf8",
    function (err, data) {
        if (err) {
            return console.log(err);
        }
        var result = data.replace(/\$BUILD/g, process.env.BUILD);

        console.log("changed build to: " + process.env.BUILD);

        fs.writeFile(
            "src/environments/environment.prod.ts",
            result,
            "utf8",
            function (err) {
                if (err) return console.log(err);
            }
        );
    }
);
