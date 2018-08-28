var net = require("net");
var http = require('http');
var mysql = require('sync-mysql');
var jalaali = require('jalaali-js')

var con = new mysql({
    host: "localhost",
    user: "kingofmeta_adok",
    password: "NTGePf_Pnn%N",
    database: "kingofmeta_ADok"
});

var server = net.createServer();
var StringDecoder = require('string_decoder').StringDecoder;

//var _ip = "94.130.122.236";
var _ip = "188.253.2.147";

var _port = 3010;

var Players = [];
var canCheckNotify = 1;
var delivery = [];
(function () {

    try {
        //var c = 0;
        var timeout = setInterval(function () {
            //console.log(canCheckNotify);
            if (canCheckNotify > 0) {
                canCheckNotify = 0;
                GetNotificationsWeb();
            }

        }, 10000);
    }
    catch (e) {
        console.log("2: " + e.message);
    }
})();


(function () {

    try {
        //var c = 0;
        var timeout = setInterval(function () {
            var query = "update players set isConnected=1 where ";
            var query2 = "update players set isConnected=0 where ";
            var i = 0;
            for (var eachItem in Players) {
                for (var eachPlayer in Players[eachItem].players) {
                    var player = Players[eachItem].players[eachPlayer];
                    if (i == 0) {
                        i++;
                        query += " id=" + player.playerId;
                        query2 += " id<>" + player.playerId;
                    }
                    else {
                        query += " or id=" + player.playerId;
                        query2 += " and id<>" + player.playerId;
                    }

                }
            }

            if (i > 0) {
                PlayersConnection(query, query2);
            }

        }, 120000);
    }
    catch (e) {
        console.log("2: " + e.message);
    }
})();

try {
    var decoder = new StringDecoder('utf8');
    server.on('connection', function (socket) {
        console.log('CONNECTED: ' + socket.remoteAddress + ':' + socket.remotePort);
        var myId = -1;
        var pkgs = [];
        socket.on('data', function (data) {

            try {

                if (data && data.byteLength != undefined) {
                    data = new Buffer(data).toString('utf8');
                }
                

                var dtSplit = data.split("}");

                for (var dataCount = 0; dataCount < dtSplit.length; dataCount++) {
                    dtSplit[dataCount] += "}";
                    console.log(dtSplit[dataCount] + " --- end\n");
                    if (dtSplit[dataCount] != "") {
                        var dt = JSON.parse(dtSplit[dataCount]);
                        var playerId = dt.playerId;
                        var pkgName = dt.pkgName;
                        var phoneNo = dt.phoneNo;

                        if (dt.hasOwnProperty('pkgs')) {
                            pkgs = dt.pkgs;
                        }

                        var knd = dt.kind;
                        var added = 0;
                        myId = playerId;

                        var myData = {
                            playerId: playerId, phoneNo: phoneNo, socket: socket, pkgs: pkgs, alive: 0
                        };
                        var d = new Date();
                        var n = d.getTime();
                        myData.alive = n;

                        if (knd == "add") {

                            if (pkgs != undefined) {
                                for (var j = 0; j < pkgs.length; j++) {
                                    if (Players[pkgs[j]] == undefined) {
                                        Players[pkgs[j]] = { players: [] };
                                        Players[pkgs[j]].players[playerId] = myData;
                                    }
                                    else {
                                        Players[pkgs[j]].players[playerId] = myData;
                                    }
                                }

                                PlayerConnectedWeb(playerId, pkgs);
                            }
                        }

                        else if (knd == "Alive") {
                            var data = {
                                alive: true, Meskind: "Alive"
                            };
                            for (var j = 0; j < pkgs.length; j++) {
                                if (Players[pkgs[j]] != undefined) {
                                    if (Players[pkgs[j]].players[playerId] != undefined) {
                                        Players[pkgs[j]].players[playerId].alive = Date.now();
                                    }
                                }
                            }
                            socket.write(JSON.stringify(data) + "\n");
                        }
                        else if (knd == "Deliver") {
                            var nid = dt.nid;
                            if (delivery[nid] == undefined) {
                                delivery[nid] = { players: [] };
                                delivery[nid].players[playerId] = 1;
                            }
                            else {
                                delivery[nid].players[playerId] = 1;
                            }

                            SetDelivery(nid, playerId);
                        }
                    }
                }

                
            }
            catch (e) {
                console.log("3: " + e.message);
            }
        });

        socket.on('close', function (data) {
            try {
                PlayerDisonnectedWeb(myId);
                for (var j = 0; j < pkgs.length; j++) {
                    if (Players[pkgs[j]] != undefined) {
                        if (Players[pkgs[j]].players[myId] != undefined) {
                            delete Players[pkgs[j]].players[myId];
                        }
                    }
                }
            }
            catch (e) {
                console.log("4: " + e.message);
            }
        });

        socket.on('disconnect', function (data) {
            PlayerDisonnectedWeb(myId);
        });


        socket.on('error', function (data) {
            try {
                for (var j = 0; j < pkgs.length; j++) {
                    if (Players[pkgs[j]] != undefined) {
                        if (Players[pkgs[j]].players[myId] != undefined) {
                            delete Players[pkgs[j]].players[myId];
                        }
                    }
                }
            }
            catch (e) {
                console.log("5: " + e.message);
            }
        });

    });

    server.listen(_port, _ip);
}
catch (e) {
    console.log("6: " + e.message);
}

function gregorian_to_jalali(gy, gm, gd) {
    g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    if (gy > 1600) {
        jy = 979;
        gy -= 1600;
    } else {
        jy = 0;
        gy -= 621;
    }
    gy2 = (gm > 2) ? (gy + 1) : gy;
    days = (365 * gy) + (parseInt((gy2 + 3) / 4)) - (parseInt((gy2 + 99) / 100)) + (parseInt((gy2 + 399) / 400)) - 80 + gd + g_d_m[gm - 1];
    jy += 33 * (parseInt(days / 12053));
    days %= 12053;
    jy += 4 * (parseInt(days / 1461));
    days %= 1461;
    if (days > 365) {
        jy += parseInt((days - 1) / 365);
        days = (days - 1) % 365;
    }
    jm = (days < 186) ? 1 + parseInt(days / 31) : 7 + parseInt((days - 186) / 30);
    jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
    return [jy, jm, jd];
}


function jalali_to_gregorian(jy, jm, jd) {
    if (jy > 979) {
        gy = 1600;
        jy -= 979;
    } else {
        gy = 621;
    }
    days = (365 * jy) + ((parseInt(jy / 33)) * 8) + (parseInt(((jy % 33) + 3) / 4)) + 78 + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
    gy += 400 * (parseInt(days / 146097));
    days %= 146097;
    if (days > 36524) {
        gy += 100 * (parseInt(--days / 36524));
        days %= 36524;
        if (days >= 365) days++;
    }
    gy += 4 * (parseInt(days / 1461));
    days %= 1461;
    if (days > 365) {
        gy += parseInt((days - 1) / 365);
        days = (days - 1) % 365;
    }
    gd = days + 1;
    sal_a = [0, 31, ((gy % 4 == 0 && gy % 100 != 0) || (gy % 400 == 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    for (gm = 0; gm < 13; gm++) {
        v = sal_a[gm];
        if (gd <= v) break;
        gd -= v;
    }
    return [gy, gm, gd];
}

function GetCurrentDate() {
    var d = new Date();
    var y = d.getFullYear();
    var m = d.getMonth();
    m++;
    var day = d.getDate();
    var dateHijri = gregorian_to_jalali(y, m, day);
    y = dateHijri[0];
    m = dateHijri[1];
    day = dateHijri[2];
    var mounth = "";
    var dayOfMounth = "";
    if (m < 10) {
        mounth = "0" + m;
    }
    else {
        mounth = "" + m;
    }

    if (day < 10) {
        dayOfMounth = "0" + day;
    }
    else {
        dayOfMounth = "" + day;
    }

    var curDate = y + "" + mounth + "" + dayOfMounth;
    return curDate;
}

function GetCurrentTime() {
    var d = new Date();
    var localTime = d.getTime();
    var localOffset = d.getTimezoneOffset() * 60000;
    var utc = localTime + localOffset;
    var offset = 3.8;
    var teh = utc + (3600000 * offset);
    nd = new Date(teh);

    var h = nd.getHours();
    var Min = nd.getMinutes();

    var hour = "";
    var minute = "";
    var tm = "";

    Min += 41;
    if (Min > 59) {
        Min -= 59;
        h++;
    }

    if (h > 24) {
        h = 1;
    }

    if (h < 10) {
        hour = "0" + h;
    }
    else {
        hour = "" + h;
    }

    if (Min < 10) {
        minute = "0" + Min;
    }
    else {
        minute = "" + Min;
    }
    tm = hour + minute;
    return tm;
}

(function () {

    var timeout = setInterval(function () {
        try {
            SetLeagueState();
        }
        catch (e) {
            console.log("11: " + e.message);
        }
    }, 60000);

})();

function GetNotificationsWeb() {
    try {
        var dataQS = {
            var1: "something",
            var2: "something else"
        };

        var querystring = require("querystring");
        var qs = querystring.stringify(dataQS);
        var qslength = qs.length;
        var options = {
            hostname: "adok.ir",
            port: 80,
            path: "/GamesData/ADok/GetNotifications.php",
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': qslength
            }
        };

        var buffer = "";
        var req = http.request(options, function (res) {
            res.on('data', function (chunk) {
                buffer += chunk;
            });
            res.on('end', function () {

                var curDate = GetCurrentDate();

                var y = curDate.substr(0, 4);
                var m = curDate.substr(4, 2);
                var day = curDate.substr(6, 2);
                day -= 3;
                if (day < 1) {
                    m--;
                    if (m < 1) {
                        m = 12;
                        if (y % 4 == 3) {
                            day = 30 + day + 1;
                            y--;
                        }
                        else {
                            day = 29 + day + 1;
                        }
                    }
                    else if (m <= 6) {
                        day = 31 + day + 1;
                    }
                    else {
                        day = 30 + day + 1;
                    }
                }

                var curtime = GetCurrentTime();

                for (var eachItem in Players) {
                    for (var eachPlayer in Players[eachItem].players) {
                        var player = Players[eachItem].players[eachPlayer];
                        var dif = Date.now() - player.alive;
                        if (dif > 150000) {
                            PlayerDisonnectedWeb(player.playerId);
                            delete Players[eachItem].players[eachPlayer];
                        }
                    }
                }

                var row = JSON.parse(buffer);

                for (var i = 0; i < row.length; i++) {
                    //console.log("row.id: " + row[i].id);
                    var id = row[i].id;
                    var appId = row[i].appId;
                    var title = row[i].title;
                    var message = row[i].message;
                    var url = row[i].url;
                    var timeToLive = row[i].timeToLive;
                    var dateStartSend = row[i].dateStartSend;
                    var timeStartSend = row[i].timeStartSend;
                    var sound = row[i].sound;
                    var smalIcon = row[i].smalIcon;
                    var largeIcon = row[i].largeIcon;
                    var bigPicture = row[i].bigPicture;
                    var ledColor = row[i].ledColor;
                    var accentColor = row[i].accentColor;
                    var gId = row[i].gId;
                    var priority = row[i].priority;
                    var pkgNameAndroid = row[i].pkgNameAndroid;
                    var pkgNameIos = row[i].pkgNameIos;
                    var kind = row[i].kind;
                    var AdditionalData = row[i].AdditionalData;
                    var btns = row[i].btns;
                    var lastUpdateTime = row[i].lastUpdateTime;
                    var IsStop = row[i].IsStop;
                    var bigText = row[i].bigText;
                    var summary = row[i].summary;
                    var isTest = row[i].isTest;
                    var testId = row[i].playerId;

                    var actionType = row[i].actionType;
                    var hiddenNoti = row[i].hiddenNoti;
                    var showTime = row[i].showTime;
                    var tagName = row[i].tagName;
                    var chanelId = row[i].chanelId;

                    var dialogTitle = row[i].dialogTitle;
                    var btnYesText = row[i].btnYesText;
                    var btnNoText = row[i].btnNoText;
                    var dialogMessage = row[i].dialogMessage;
                    var dialogActionType = row[i].dialogActionType;
                    var dialogActionUrl = row[i].dialogActionUrl;
                    var isVibrate = row[i].isVibrate;

                    var chanelName = row[i].chanelName;;
                    var chanelDes = row[i].chanelDes;;

                    var additionalData = [];
                    var btns = [];

                    for (var j = 0; j < row[i].additionalData.length; j++) {
                        additionalData.push({ "dtKey": row[i].additionalData[j].dtKey, "dtValue": row[i].additionalData[j].dtValue });
                    }

                    //Get btns
                    for (var j = 0; j < row[i].btns.length; j++) {
                        btns.push({ "id": row[i].btns[j].id, "nId": row[i].btns[j].nId, "btnText": row[i].btns[j].btnText, "url": row[i].btns[j].url, "icon": row[i].btns[j].icon, "actionType": row[i].btns[j].actionType });
                    }

                    var timeToSend = timeStartSend + timeToLive;
                    var sendH = Math.floor(timeToSend / 60);
                    var sendM = Math.floor(timeToSend % 60);
                    var Days = 0;
                    var HAfter = 0;
                    if (sendH > 24) {
                        Days = Math.floor(sendH / 24);
                        HAfter = Math.floor(sendH - (Days * 24));
                    }
                    else {
                        HAfter = sendH;
                    }

                    var yy = parseInt(dateStartSend.toString().substr(0, 4));
                    var mm = parseInt(dateStartSend.toString().substr(4, 2));
                    var dd = parseInt(dateStartSend.toString().substr(6, 2));

                    var curDateEnd = "";
                    if (Days > 0) {
                        dd += Days;
                        if (dd > 29 && mm == 12 && y % 4 != 3) {
                            dd = dd - 29;
                            mm = 1;
                            yy++;
                        }
                        else if (dd > 30 && mm == 12 && y % 4 == 3) {
                            dd = dd - 30;
                            mm = 1;
                            yy++;
                        }
                        else if (dd > 31 && mm <= 6) {
                            dd = dd - 31;
                            mm++;
                        }
                        else if (dd > 30 && mm > 6) {
                            dd = dd - 30;
                            mm++;
                        }
                    }

                    var year = "" + yy;
                    var mounth = "";
                    var dayOfMounth = "";
                    if (mm < 10) {
                        mounth = "0" + mm;
                    }
                    else {
                        mounth = "" + mm;
                    }

                    if (dd < 10) {
                        dayOfMounth = "0" + dd;
                    }
                    else {
                        dayOfMounth = "" + dd;
                    }

                    var curDateEnd = year + "" + mounth + "" + dayOfMounth;

                    var hcur = GetCurrentTime().substr(0, 2);

                    var noti = {
                        id: row[i].id, appId: row[i].appId, title: row[i].title, message: row[i].message, url: row[i].url, timeToLive: row[i].timeToLive
                        , dateStartSend: row[i].dateStartSend, timeStartSend: row[i].timeStartSend, sound: row[i].sound, smalIcon: row[i].smalIcon, largeIcon: row[i].largeIcon
                        , bigPicture: row[i].bigPicture, ledColor: row[i].ledColor, accentColor: row[i].accentColor, gId: row[i].gId, priority: row[i].priority
                        , pkgNameAndroid: row[i].pkgNameAndroid, pkgNameIos: row[i].pkgNameIos, kind: row[i].kind,
                        bigText: row[i].bigText, summary: row[i].summary,
                        actionType: row[i].actionType, hiddenNoti: row[i].hiddenNoti, showTime: row[i].showTime, tagName: row[i].tagName,
                        chanelId: chanelId, chanelName: chanelName, chanelDes: chanelDes,
                        dialogTitle: dialogTitle, btnYesText: btnYesText, btnNoText: btnNoText, dialogMessage: dialogMessage, dialogActionType: dialogActionType, dialogActionUrl: dialogActionUrl, isVibrate: isVibrate,
                        AdditionalData: additionalData, btns: btns, Meskind: "noti"
                    };

                    if (isTest > 0) {
                        if (pkgNameAndroid != "") {
                            if (Players[pkgNameAndroid] != undefined) {
                                if (Players[pkgNameAndroid].players[testId] != undefined) {
                                    Players[pkgNameAndroid].players[testId].socket.write(JSON.stringify(noti) + "\n");
                                    object.splice(index, 1);
                                }
                            }
                        }

                        if (pkgNameIos != "") {
                            if (Players[pkgNameIos] != undefined) {
                                if (Players[pkgNameIos].players[testId] != undefined) {
                                    Players[pkgNameIos].players[testId].socket.write(JSON.stringify(noti) + "\n");
                                    object.splice(index, 1);
                                }
                            }
                        }
                    }
                    else {
                        curDatev = "" + dateStartSend;
                        if (parseInt(curDatev) < parseInt(curDateEnd) || (parseInt(curDatev) == parseInt(curDateEnd) && parseInt(hcur) <= parseInt(HAfter))) {
                            if (IsStop == 0) {

                                if (Players[pkgNameAndroid] != undefined) {
                                    Players[pkgNameAndroid].players.forEach(function (itemp, indexp, objectp) {

                                        if (itemp.socket == undefined) {
                                            objectp.splice(indexp, 1);
                                        }
                                        else {
                                            if (delivery[noti.id] == undefined) {
                                                delivery[noti.id] = { players: [] };
                                            }

                                            if (delivery[noti.id].players[itemp.playerId] == undefined) {
                                                //console.log("noti.id: " + noti.id + "--- playerId: " + itemp.playerId);
                                                itemp.socket.write(JSON.stringify(noti) + "\n");
                                            }
                                        }
                                    });
                                }
                                else {
                                }
                            }
                        }
                    }
                }

            });
        });
        canCheckNotify = 1;
        req.write(qs);
        req.end();
    }
    catch (e) {
        canCheckNotify = 1;
        console.log("120: " + e.message);
    }
}

function PlayerConnectedWeb(pid, pkgs) {
    try {
        var dataQS = {
            var1: pid,
            var2: pkgs
        };

        var querystring = require("querystring");
        var qs = querystring.stringify(dataQS);
        var qslength = qs.length;
        var options = {
            hostname: "adok.ir",
            port: 80,
            path: "/GamesData/ADok/PlayerConnectedND.php",
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': qslength
            }
        };

        var buffer = "";
        var req = http.request(options, function (res) {
            res.on('data', function (chunk) {
                buffer += chunk;
            });
            res.on('end', function () {
                console.log(buffer);
            });
        });

        req.write(qs);
        req.end();
    }
    catch (e) {
        console.log("130: " + e.message);
    }
}

function PlayerDisonnectedWeb(pid) {
    try {
        var dataQS = {
            var1: pid,
            var2: "sth"
        };

        var querystring = require("querystring");
        var qs = querystring.stringify(dataQS);
        var qslength = qs.length;
        var options = {
            hostname: "adok.ir",
            port: 80,
            path: "/GamesData/ADok/PlayerDisonnectedND.php",
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': qslength
            }
        };

        var buffer = "";
        var req = http.request(options, function (res) {
            res.on('data', function (chunk) {
                buffer += chunk;
            });
            res.on('end', function () {
                console.log(buffer);
            });
        });

        req.write(qs);
        req.end();
    }
    catch (e) {
        console.log("140: " + e.message);
    }
}

function PlayersConnection(q1,q2) {
    try {
        var dataQS = {
            var1: q1,
            var2: q2
        };

        var querystring = require("querystring");
        var qs = querystring.stringify(dataQS);
        var qslength = qs.length;
        var options = {
            hostname: "adok.ir",
            port: 80,
            path: "/GamesData/ADok/PlayersConnection.php",
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': qslength
            }
        };

        var buffer = "";
        var req = http.request(options, function (res) {
            res.on('data', function (chunk) {
                buffer += chunk;
            });
            res.on('end', function () {
                console.log(buffer);
            });
        });

        req.write(qs);
        req.end();
    }
    catch (e) {
        console.log("150: " + e.message);
    }
}

function SetDelivery(nid, playerId) {
    try {
        var dataQS = {
            var1: nid,
            var2: playerId
        };

        var querystring = require("querystring");
        var qs = querystring.stringify(dataQS);
        var qslength = qs.length;
        var options = {
            hostname: "adok.ir",
            port: 80,
            path: "/GamesData/ADok/SetDelivery.php",
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': qslength
            }
        };

        var buffer = "";
        var req = http.request(options, function (res) {
            res.on('data', function (chunk) {
                buffer += chunk;
            });
            res.on('end', function () {
                console.log(buffer);
            });
        });

        req.write(qs);
        req.end();
    }
    catch (e) {
        console.log("150: " + e.message);
    }
}

function SetLeagueState()
{
    try {
        var dataQS = {
            var1: "sth1",
            var2: "sth2"
        };

        var querystring = require("querystring");
        var qs = querystring.stringify(dataQS);
        var qslength = qs.length;
        var options = {
            hostname: "adok.ir",
            port: 80,
            path: "/GamesData/ADok/SetLeagueState.php",
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': qslength
            }
        };

        var buffer = "";
        var req = http.request(options, function (res) {
            res.on('data', function (chunk) {
                buffer += chunk;
            });
            res.on('end', function () {
                console.log(buffer);
            });
        });

        req.write(qs);
        req.end();
    }
    catch (e) {
        console.log("160: " + e.message);
    }
}