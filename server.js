const dns = require("dns");

dns.setServers(["1.1.1.1"]);

dns.resolveSrv(
    "_mongodb._tcp.cluster0.ygj9vbw.mongodb.net",
    (err, addresses) => {
        console.log("ERROR:", err);
        console.log("ADDRESSES:", addresses);
    }
);
