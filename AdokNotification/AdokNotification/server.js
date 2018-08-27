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
            console.log(canCheckNotify);
            if (canCheckNotify > 0) {
                canCheckNotify = 0;
                GetNotifications();
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
                con.query(query);
                con.query(query2);
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
                var dt = JSON.parse(data);
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

                        PlayerConnected(playerId, pkgs);
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
                    //var query = "SELECT id,count from nodeDelivery where nid=" + nid + " and playerId=" + playerId + ";";
                    //const resultDelivery = con.query(query);

                    //if (resultDelivery.length > 0) {
                    //    resultDelivery.forEach((row) => {
                    //        var did = row.id;
                    //        var dcount = row.count;
                    //        dcount++;
                    //        var query2 = "update nodeDelivery set  count=" + dcount + " where id=" + did + ";";
                    //        con.query(query2);
                    //    });
                    //}
                    //else {
                    //    var query2 = "insert into nodeDelivery (nid,playerId,count) values (" + nid + "," + playerId + ",1);";
                    //    con.query(query2);
                    //}
                }
            }
            catch (e) {
                console.log("3: " + e.message);
            }
        });

        socket.on('close', function (data) {
            try {
                PlayerDisonnected(myId);
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
            PlayerDisonnected(myId);
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

function PlayerConnected(pid, pkgs) {

    var curDate = GetCurrentDate();
    var tm = GetCurrentTime();


    var sql = "update players set 	isConnected=1,lastTime='" + tm + "',lastDate=" + curDate + " where id=" + pid;
    con.query(sql);

    var pkgEx = pkgs;
    for (var i = 0; i < pkgEx.length; i++) {
        if (pkgEx[i] != "") {
            var pkName = pkgEx[i];
            var sql2 = "select id from playerNotifConnect where  playerId=" + pid + " and pkgName='" + pkName + "'";
            const result2 = con.query(sql2);
            if (result2.length > 0) {
                result2.forEach((row) => {
                    var id = row.id;
                    sql3 = "update playerNotifConnect set time='" + tm + "',date=" + curDate + "  where id=" + id;
                    con.query(sql3);
                });
            }
            else {
                sql3 = "insert into playerNotifConnect (playerId,pkgName,date,time) values (" + pid + ",'" + pkName + "'," + curDate + ",'" + tm + "')";
                con.query(sql3);
            }
        }
    }
}

function PlayerDisonnected(pid) {

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

    var sql = "update players set 	isConnected=0,disTime='" + tm + "',disDate=" + curDate + " where id=" + pid;
    con.query(sql);
    console.log("player: " + pid + " diconnected");
}

function GetNotifications() {
    try {
        var curDate = GetCurrentDate();

        var y = curDate.substr(0,4);
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
                    PlayerDisonnected(player.playerId);
                    delete Players[eachItem].players[eachPlayer];
                }
            }
        }

        var query = "SELECT notification.id,notification.appId,notification.title,notification.message,notification.url,notification.timeToLive,notification.dateStartSend,notification.timeStartSend ";
        query += ",notification.sound, notification.smalIcon, notification.largeIcon, notification.bigPicture, notification.ledColor, notification.accentColor, notification.gId, notification.priority ";
        query += ", apps.pkgNameAndroid, apps.pkgNameIos, notification.kind, notification.IsStop, notification.lastUpdateTime, notification.bigText, notification.summary, notification.budget ";
        query += ", notification.isTest, notification.playerId, notification.actionType, notification.hiddenNoti, notification.showTime, appTags.tagName, notification.chanelId ";
        query += ", notification.dialogTitle, notification.btnYesText, notification.btnNoText, notification.dialogMessage, notification.dialogActionType, notification.dialogActionUrl ";
        query += " FROM notification inner join apps on notification.appId = apps.id inner join appTags on notification.tagId = appTags.id ";
        query += " where dateStartSend>= " + curDate + " and notification.isSend = 0; ";

        //console.log(query);
        const result = con.query(query);
        console.log("noti count: " + result.length);

        result.forEach(row => {
            console.log("row.id: " + row.id);
            var id = row.id;
            var appId = row.appId;
            var title = row.title;
            var message = row.message;
            var url = row.url;
            var timeToLive = row.timeToLive;
            var dateStartSend = row.dateStartSend;
            var timeStartSend = row.timeStartSend;
            var sound = row.sound;
            var smalIcon = row.smalIcon;
            var largeIcon = row.largeIcon;
            var bigPicture = row.bigPicture;
            var ledColor = row.ledColor;
            var accentColor = row.accentColor;
            var gId = row.gId;
            var priority = row.priority;
            var pkgNameAndroid = row.pkgNameAndroid;
            var pkgNameIos = row.pkgNameIos;
            var kind = row.kind;
            var AdditionalData = row.AdditionalData;
            var btns = row.btns;
            var lastUpdateTime = row.lastUpdateTime;
            var IsStop = row.IsStop;
            var bigText = row.bigText;
            var summary = row.summary;
            var isTest = row.isTest;
            var testId = row.playerId;

            var actionType = row.actionType;
            var hiddenNoti = row.hiddenNoti;
            var showTime = row.showTime;
            var tagName = row.tagName;
            var chanelId = row.chanelId;

            var dialogTitle = row.dialogTitle;
            var btnYesText = row.btnYesText;
            var btnNoText = row.btnNoText;
            var dialogMessage = row.dialogMessage;
            var dialogActionType = row.dialogActionType;
            var dialogActionUrl = row.dialogActionUrl;

            var chanelName = "";
            var chanelDes = "";

            var additionalData = [];
            var btns = [];

            var queryad = "select dtKey,dtValue from notiAdditionalData where nid=" + row.id;
            const resultad = con.query(queryad);
            resultad.forEach((rowad) => {
                additionalData.push({ "dtKey": rowad.dtKey, "dtValue": rowad.dtValue });
            });

            //Get btns
            var querybtn = "select id,nId,btnText,url,icon from notiBtn where nid=" + row.id;
            const resultbtn = con.query(querybtn);
            resultbtn.forEach((rowbtn) => {
                btns.push({ "id": rowbtn.id, "nId": rowbtn.nId, "btnText": rowbtn.btnText, "url": rowbtn.url, "icon": rowbtn.icon });
            });

            //Get Chanel
            var queryChanel = "SELECT id,name,des FROM  notificationChanels where id=" + chanelId;
            const resultChanel = con.query(queryChanel);
            if (resultChanel.length > 0) {
                resultChanel.forEach((rowChanel) => {
                    chanelName = rowChanel.name;
                    chanelDes = rowChanel.des;
                });
            }
            else {
                var queryChanelIns = "insert into notificationChanels (appId,name,des) values (" + appId + ",'defAdok','default chanel for adok notifications');";
                con.query(queryChanelIns);
                chanelName = "defAdok";
                chanelDes = "default chanel for adok notifications";

                var queryChanelIdMax = "select max(id) as mxId from notificationChanels where appId=" + appId;
                const resultChanelIdMax = con.query(queryChanelIdMax);
                resultChanelIdMax.forEach((rowChanelIdMax) => {
                    chanelId = rowChanelIdMax.mxId;
                });

                var queryChanelUPd = "update notification set chanelId=" + chanelId + " where id=" + id;
                con.query(queryChanelUPd);
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
                id: row.id, appId: row.appId, title: row.title, message: row.message, url: row.url, timeToLive: row.timeToLive
                , dateStartSend: row.dateStartSend, timeStartSend: row.timeStartSend, sound: row.sound, smalIcon: row.smalIcon, largeIcon: row.largeIcon
                , bigPicture: row.bigPicture, ledColor: row.ledColor, accentColor: row.accentColor, gId: row.gId, priority: row.priority
                , pkgNameAndroid: row.pkgNameAndroid, pkgNameIos: row.pkgNameIos, kind: row.kind,
                bigText: row.bigText, summary: row.summary,
                actionType: row.actionType, hiddenNoti: row.hiddenNoti, showTime: row.showTime, tagName: row.tagName,
                chanelId: chanelId, chanelName: chanelName, chanelDes: chanelDes,
                dialogTitle: dialogTitle, btnYesText: btnYesText, btnNoText: btnNoText, dialogMessage: dialogMessage, dialogActionType: dialogActionType, dialogActionUrl: dialogActionUrl,
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
                                    if (delivery[noti.id] == undefined)
                                    {
                                        delivery[noti.id] = { players: [] };
                                    }

                                    if (delivery[noti.id].players[itemp.playerId] == undefined)
                                    {
                                        console.log("noti.id: " + noti.id + "--- playerId: " + itemp.playerId);
                                        itemp.socket.write(JSON.stringify(noti) + "\n");
                                    }
                                    //var query3 = "SELECT id,count from nodeDelivery where nid=" + noti.id + " and playerId=" + itemp.playerId + ";";
                                    //const resultDelivery = con.query(query3);
                                    //console.log("resultDelivery.length " + resultDelivery.length);
                                    //if (resultDelivery.length > 0) {
                                    //}
                                    //else {
                                    //    var query3 = "insert into nodeDelivery (nid,playerId,count) values (" + noti.id + "," + itemp.playerId + ",0);";
                                    //    con.query(query3);
                                    //    console.log("noti.id: " + noti.id);
                                    //    itemp.socket.write(JSON.stringify(noti) + "\n");
                                    //}
                                }
                            });
                        }
                        else {
                        }
                    }
                }
                else {
                    //stop send
                    var queryst = "update notification set IsStop=1 where id=" + row.id;
                    con.query(queryst);
                }
            }
        });
        canCheckNotify = 1;
    }
    catch (e) {
        canCheckNotify = 1;
        console.log("10: " + e.message);
    }
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
            var curDate = GetCurrentDate();
            var curtime = GetCurrentTime();
            var query = "SELECT id,name,des,logoAdd,limitPlayerCount,playerJoinCount,dateCreated,restHour,startDate,startTime,endDate,endTime,isAutomated,isDaily,isWeekly,isMounthly,myCount,lastCreteDate,lastCreateTime,startDay,endDay,startMounth,endMounth,isActive,appId,isEnd from league where isActive=1 and isAutomated=1;";
            const result = con.query(query);
            if (result.length > 0) {
                result.forEach((row) => {
                    var id = row.id;
                    var startDate = row.startDate;
                    var startTime = row.startTime;
                    var endDate = row.endDate;
                    var endTime = row.endTime;
                    var isAutomated = row.isAutomated;
                    var isDaily = row.isDaily;
                    var isWeekly = row.isWeekly;
                    var isMounthly = row.isMounthly;
                    var myCount = row.myCount;
                    var lastCreteDate = row.lastCreteDate;
                    var lastCreateTime = row.lastCreateTime;
                    var startDay = row.startDay;
                    var endDay = row.endDay;
                    var startMounth = row.startMounth;
                    var endMounth = row.endMounth;
                    var isActive = row.isActive;
                    var appId = row.appId;
                    var isEnd = parseInt(row.isEnd);
                    var limitPlayerCount = parseInt(row.limitPlayerCount);

                    var name = row.name;
                    var des = row.des;
                    var logoAdd = row.logoAdd;
                    var playerJoinCount = row.playerJoinCount;
                    var dateCreated = row.dateCreated;
                    var restHour = row.restHour;

                    var qqjoi = ",playerJoinCount=0";
                    //if (limitPlayerCount > 0)
                    //{
                    //    qqjoi = ",playerJoinCount=0 ";
                    //}

                    if (parseInt(curDate) < parseInt(endDate)) {
                        if (parseInt(isDaily) > 0) {
                            if (parseInt(curtime) > parseInt(endTime)) {
                                if (parseInt(isEnd) == 0) {
                                    var qq = "INSERT INTO `leagueLog` (`lId`, `name`, `des`, `logoAdd`, `startDate`, `startTime`, `endDate`, `endTime`, `playerJoinCount`,`limitPlayerCount`, `appId`, `dateCreated`, `isAutomated`, `isDaily`, `isWeekly`, `isMounthly`, `restHour`, `myCount`, `lastCreteDate`,`lastCreateTime`, `startDay`, `endDay`, `startMounth`, `endMounth`, `isActive`, `isEnd`) VALUES (" + id + ",'" + name + "','" + des + "','" + logoAdd + "'," + startDate + ",'" + startTime + "'," + endDate + ",'" + endTime + "'," + playerJoinCount + "," + limitPlayerCount + "," + appId + "," + dateCreated + "," + isAutomated + "," + isDaily + "," + isWeekly + "," + isMounthly + "," + restHour + "," + myCount + "," + lastCreteDate + ",'" + lastCreateTime + "'," + startDay + "," + endDay + "," + startMounth + "," + endMounth + "," + isActive + "," + isEnd + ");";
                                    con.query(qq);
                                    setLeagueBest(id, myCount, appId, curDate, curtime);
                                }
                            }
                            else if (parseInt(curtime) > parseInt(startTime) && parseInt(isEnd) == 1) {
                                var q = "update league set isEnd=0" + qqjoi + " where id=" + id;
                                con.query(q);
                            }
                        }
                        else if (parseInt(isWeekly) > 0) {
                            var d = new Date();
                            var n = d.getDay();
                            n += 2;
                            if (n > 7) {
                                n = 1;
                            }

                            if ((n > parseInt(endDay) || n < parseInt(startDay)) && isEnd == 0) {
                                var qq = "INSERT INTO `leagueLog` (`lId`, `name`, `des`, `logoAdd`, `startDate`, `startTime`, `endDate`, `endTime`, `playerJoinCount`,`limitPlayerCount`, `appId`, `dateCreated`, `isAutomated`, `isDaily`, `isWeekly`, `isMounthly`, `restHour`, `myCount`, `lastCreteDate`,`lastCreateTime`, `startDay`, `endDay`, `startMounth`, `endMounth`, `isActive`, `isEnd`) VALUES (" + lId + ",'" + name + "','" + des + "','" + logoAdd + "'," + startDate + ",'" + startTime + "'," + endDate + ",'" + endTime + "'," + playerJoinCount + "," + limitPlayerCount + "," + appId + "," + dateCreated + "," + isAutomated + "," + isDaily + "," + isWeekly + "," + isMounthly + "," + restHour + "," + myCount + "," + lastCreteDate + ",'" + lastCreateTime + "'," + startDay + "," + endDay + "," + startMounth + "," + endMounth + "," + isActive + "," + isEnd + ");";
                                con.query(qq);
                                setLeagueBest(id, myCount, appId, curDate, curtime);
                            }
                            else if (n < parseInt(endDay) && n > parseInt(startDay) && isEnd == 1) {
                                var q = "update league set isEnd=0" + qqjoi + " where id=" + id;
                                con.query(q);
                            }
                            else if (n == parseInt(endDay)) {
                                if (parseInt(curtime) >= parseInt(endTime) && isEnd == 0) {
                                    var qq = "INSERT INTO `leagueLog` (`lId`, `name`, `des`, `logoAdd`, `startDate`, `startTime`, `endDate`, `endTime`, `playerJoinCount`,`limitPlayerCount`, `appId`, `dateCreated`, `isAutomated`, `isDaily`, `isWeekly`, `isMounthly`, `restHour`, `myCount`, `lastCreteDate`,`lastCreateTime`, `startDay`, `endDay`, `startMounth`, `endMounth`, `isActive`, `isEnd`) VALUES (" + lId + ",'" + name + "','" + des + "','" + logoAdd + "'," + startDate + ",'" + startTime + "'," + endDate + ",'" + endTime + "'," + playerJoinCount + "," + limitPlayerCount + "," + appId + "," + dateCreated + "," + isAutomated + "," + isDaily + "," + isWeekly + "," + isMounthly + "," + restHour + "," + myCount + "," + lastCreteDate + ",'" + lastCreateTime + "'," + startDay + "," + endDay + "," + startMounth + "," + endMounth + "," + isActive + "," + isEnd + ");";
                                    con.query(qq);
                                    setLeagueBest(id, myCount, appId, curDate, curtime);
                                }
                                else if (isEnd == 1) {
                                    var q = "update league set isEnd=0" + qqjoi + " where id=" + id;
                                    con.query(q);
                                }
                            }
                            else if (n == parseInt(startDay) && parseInt(curtime) >= parseInt(startTime) && isEnd == 1) {
                                var q = "update league set isEnd=0" + qqjoi + " where id=" + id;
                                con.query(q);
                            }
                        }
                        else if (parseInt(isMounthly) > 0) {
                            var d = new Date();
                            var y = d.getFullYear();
                            var m = d.getMonth();
                            var day = d.getDate();

                            var dateHijri = gregorian_to_jalali(y, m, day);
                            y = dateHijri[0];
                            m = dateHijri[1];
                            day = dateHijri[2];

                            if ((day > parseInt(endMounth) || day < parseInt(startMounth)) && isEnd == 0) {
                                var qq = "INSERT INTO `leagueLog` (`lId`, `name`, `des`, `logoAdd`, `startDate`, `startTime`, `endDate`, `endTime`, `playerJoinCount`,`limitPlayerCount`, `appId`, `dateCreated`, `isAutomated`, `isDaily`, `isWeekly`, `isMounthly`, `restHour`, `myCount`, `lastCreteDate`,`lastCreateTime`, `startDay`, `endDay`, `startMounth`, `endMounth`, `isActive`, `isEnd`) VALUES (" + lId + ",'" + name + "','" + des + "','" + logoAdd + "'," + startDate + ",'" + startTime + "'," + endDate + ",'" + endTime + "'," + playerJoinCount + "," + limitPlayerCount + "," + appId + "," + dateCreated + "," + isAutomated + "," + isDaily + "," + isWeekly + "," + isMounthly + "," + restHour + "," + myCount + "," + lastCreteDate + ",'" + lastCreateTime + "'," + startDay + "," + endDay + "," + startMounth + "," + endMounth + "," + isActive + "," + isEnd + ");";
                                con.query(qq);
                                setLeagueBest(id, myCount, appId, curDate, curtime);
                            }
                            else if (day < parseInt(endMounth) && day > parseInt(startMounth) && isEnd == 1) {
                                var q = "update league set isEnd=0" + qqjoi + " where id=" + id;
                                con.query(q);
                            }
                            else if (day == parseInt(endMounth)) {
                                if (parseInt(curtime) >= parseInt(endTime) && isEnd == 0) {
                                    var qq = "INSERT INTO `leagueLog` (`lId`, `name`, `des`, `logoAdd`, `startDate`, `startTime`, `endDate`, `endTime`, `playerJoinCount`,`limitPlayerCount`, `appId`, `dateCreated`, `isAutomated`, `isDaily`, `isWeekly`, `isMounthly`, `restHour`, `myCount`, `lastCreteDate`,`lastCreateTime`, `startDay`, `endDay`, `startMounth`, `endMounth`, `isActive`, `isEnd`) VALUES (" + lId + ",'" + name + "','" + des + "','" + logoAdd + "'," + startDate + ",'" + startTime + "'," + endDate + ",'" + endTime + "'," + playerJoinCount + "," + limitPlayerCount + "," + appId + "," + dateCreated + "," + isAutomated + "," + isDaily + "," + isWeekly + "," + isMounthly + "," + restHour + "," + myCount + "," + lastCreteDate + ",'" + lastCreateTime + "'," + startDay + "," + endDay + "," + startMounth + "," + endMounth + "," + isActive + "," + isEnd + ");";
                                    con.query(qq);
                                    setLeagueBest(id, myCount, appId, curDate, curtime);
                                }
                                else if (isEnd == 1) {
                                    var q = "update league set isEnd=0" + qqjoi + " where id=" + id;
                                    con.query(q);
                                }
                            }
                            else if (day == parseInt(startMounth) && parseInt(curtime) >= parseInt(startTime) && isEnd == 1) {
                                var q = "update league set isEnd=0" + qqjoi + " where id=" + id;
                                con.query(q);
                            }
                        }
                    }
                });
            }

        }
        catch (e) {
            console.log("11: " + e.message);
        }
    }, 60000);

})();

function setLeagueBest(lId, myCount, appId, curDate, curtime) {
    try {
        var cnt = parseInt(myCount) + 1;
        var q = "update league set lastCreteDate=" + curDate + ",lastCreateTime='" + curtime + "',myCount=" + cnt + ",isEnd=1 where id=" + lId;
        con.query(q);

        var query = "select id,uid from apps where id=" + appId + ";";
        con.query(query);

        if (result.length > 0) {
            result.forEach((row) => {
                var id = row.id;
                var uid = row.uid;
                var tbName = "zz_" + appId + "_" + uid + "_lud";
                var crq = "select ";
                var Cols = [];
                var typs = [];
                var olaviat = [];
                var qCol = "SELECT `COLUMN_NAME`,`DATA_TYPE`  FROM `INFORMATION_SCHEMA`.`COLUMNS` WHERE `TABLE_SCHEMA`='kingofmeta_ADok' AND `TABLE_NAME`='" + tbName + "';";
                var i = 0;
                con.query(qCol);
                resultCol.forEach((rowCol) => {
                    var clName = rowCol.COLUMN_NAME;
                    var clType = rowCol.DATA_TYPE;
                    Cols.push(clName);
                    typs[clName] = clType;

                    if (i == 0) {
                        i++;
                        crq += "tb." + clName;
                    }
                    else {
                        crq += ",tb." + clName;
                    }
                });

                var qOlaviat = "select name,olaviat from leagueData where appId=" + appId + " and leagueId=" + lId + " and olaviat>0 order by olaviat DESC";
                var olvQO = "";
                i = 0;
                con.query(qOlaviat);
                resultOlaviat.forEach((rowOlaviat) => {
                    var olvN = rowOlaviat.name;
                    var olaviatA = rowOlaviat.olaviat;

                    olaviat.push(olvN);
                    if (i == 0) {
                        i++;
                        olvQO += olvN + " DESC ";
                    }
                    else {
                        olvQO += "," + olvN + " DESC ";
                    }
                });

                crq += ",p.nickname from " + tbName + " as tb inner join players as p on tb.playerId=p.id ";
                crq += " where myCount=" + myCount + " and lId=" + lId + " and isShow=1 ";
                crq += " ORDER by " + olvQO + "limit 10000";

                console.log(crq);
                con.query(crq);
                resultRq.forEach((rowRq) => {
                    var qIns = "insert into " + tbName + "_res" + " (";
                    var qValues = "(";
                    i = 0;
                    for (var prop in rowRq) {

                        if (prop == "nickname" || prop == "id")
                        { }
                        else {
                            if (i == 0) {
                                i++;
                                qIns += prop;
                                if (typs[prop] == "int") {
                                    qValues += rowRq[prop];
                                }
                                else {
                                    qValues += "'" + rowRq[prop] + "'";
                                }

                            }
                            else {
                                qIns += "," + prop;
                                if (typs[prop] == "int") {
                                    qValues += "," + rowRq[prop];
                                }
                                else {
                                    qValues += ",'" + rowRq[prop] + "'";
                                }
                            }
                        }
                    }
                    qIns += " ) values " + qValues + ")";
                    console.log(qIns);
                    con.query(qIns);
                });
            });
        }
    }
    catch (e) {
        console.log("11: " + e.message);
    }
}
