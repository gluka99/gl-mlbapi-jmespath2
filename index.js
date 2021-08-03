const axios = require('axios');
const http = require("http");
const Service = require('node-windows').Service;
const James = require('jmespath');

//var userName = "";
//var passWord = "";
var id_token = "";
var refresh_token = "wkKYhpG8gP-9Bkcnlbybb-7G6d52z9z5bErmd07Dp2s"; //for glenn.luke@daktronics.com developer account, should be perpetual
var access_token = "";
var token_type = "";

function get_query(url) {
    return axios.get("https://statsapi.mlb.com" + url, { headers: { 'Authorization': "Bearer " + access_token }, });
}
const server = http.createServer(async(req, res) => {
    //    console.log(req.get_query());
    const qpars = new URLSearchParams(req.url);
    const oPars = {};
    for (const key of qpars.keys()) {
        if (qpars.getAll(key).length > 1) {
            oPars[key] = qpars.getAll(key);
        } else {
            oPars[key] = qpars.get(key);
        }
    }
    let data_resp = await get_query(req.url);
    let data_wrap = data_resp.data;
    if (oPars['filter'] != null) {
        let split1 = James.search(data_wrap, oPars.filter) || {};
        res.end(JSON.stringify(split1, null, 2));
    } else {
        res.end(JSON.stringify(data_wrap, null, 2));
    }
})

function authenticateUser(user, password) {

    let token = user + ":" + password;
    let hash = new Buffer.from(token, 'utf8').toString('base64');

    return "Basic " + hash;
}

async function connectToMLB() {

    try {
        let header = "";
        /*
        //this is if my access token stops working you'll have to provider your developer account info
        header = authenticateUser(userName, passWord);
        const aresp = await axios.post("https://statsapi.mlb.com/api/v1/authentication/okta/token", {}, { headers: { 'Authorization': header }, });
        access_token = aresp.data.access_token;
        id_token = aresp.data.id_token;
        token_type = aresp.data.token_type;
        //refresh_token = aresp.data.refresh_token; starting with refresh token after initial fire-up basic auth user creds for developer account
        */
        const aresp = await axios.post("https://statsapi.mlb.com/api/v1/authentication/okta/token/refresh?refreshToken=" + refresh_token, {});
        access_token = aresp.data.access_token;
        id_token = aresp.data.id_token;
        token_type = aresp.data.token_type;
        console.log("renew access token");

    } catch (err) {
        console.error(err);
    }
}
const svc = new Service({
    name: 'Dak MLB Oauth forwarder',
    description: "Nodejs windows service for providing http access to MLB API",
    script: 'C:\\Users\\gluka\\rest-api\\index.js'
});
/*
// Listen for the "uninstall" event so we know when it's done.
svc.on('uninstall', function() {
    console.log('Uninstall complete.');
    console.log('The service exists: ', svc.exists);
});

// Uninstall the service.
svc.uninstall();
*/
/*
// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install', function() {
    svc.start();
});

svc.install();
*/
connectToMLB();
//using an interval and not expiration to renew access token
setInterval(connectToMLB, 1000 * 60 * 58);
server.listen(4243, () => {
    console.log('MLB Server is running ....');
});