var mysql = require('mysql');
var jalaali = require('jalaali-js')

var con = mysql.createConnection({
    host: "localhost",
    user: "kingofmeta_adok",
    password: "NTGePf_Pnn%N",
    database: "kingofmeta_ADok"
});

con.connect(function (err) {
    if (err) throw err;
    console.log("Connected to mysql!");
});

var server = require('http').createServer();
var io = require('socket.io')(server);

var _ip = "188.253.2.147";

var _port = 3010;

let Players = new Map();
var canCheckNotify = 1;
let delivery = new Map();
var allNoties = [];

(function () {

    try {
        var timeout = setInterval(function () {
            GetNotificationMysql();
        }, 10000);
    } catch (e) {
        console.log("2: " + e.message);
    }
})();

(function () {

    try {
        var timeout = setInterval(function () {
            SendNoti();
        }, 15000);
    } catch (e) {
        console.log("2: " + e.message);
    }
})();

io.on('connection', function (socket) {

    var myId = -1;
    var pkgs = [];

    var dtAdd = {
        Meskind: "Connected",
        MesMes: "hi"
    };
    socket.emit('new message', dtAdd);

    socket.on('disconnect', function () {
        PlayerDisonnectedSql(myId);
    });

    socket.on('add', function (msg) {
        try {

            var dt = JSON.parse(msg);
            var playerId = dt.playerId.toString();
            var pkgName = dt.pkgName;
            var phoneNo = dt.phoneNo;

            if (dt.hasOwnProperty('pkgs')) {
                pkgs = dt.pkgs;
            }

            var added = 0;
            myId = playerId;

            var myData = {
                playerId: playerId,
                phoneNo: phoneNo,
                socket: socket,
                pkgs: pkgs,
                alive: 0
            };
            var d = new Date();
            var n = d.getTime();
            if (pkgs != undefined) {
                for (var j = 0; j < pkgs.length; j++) {
                    var idd = playerId;
                    var canLog = 0;
                    if (pkgs[j] == "com.arp.testvideo") {
                        canLog = 1;
                    }


                    if (!Players.has("" + pkgs[j]) && pkgs[j] != "null") {

                        var players = new Map();
                        players.set("" + idd, myData);

                        Players.set("" + pkgs[j], players);

                    } else {

                        let p = Players.get("" + pkgs[j]);
                        p.set("" + idd, myData);
                        Players.set("" + pkgs[j], p);
                    }

                }

                PlayerConnectedSql(playerId, pkgs);
            }
        } catch (e) {
            console.log("addProblem: " + e.message);
        }
        //io.emit('chat message', msg);
    });

    socket.on('Alive', function (msg) {
        try {
            var dt = JSON.parse(msg);
            var playerId = dt.playerId.toString();
            var pkgName = dt.pkgName;
            var phoneNo = dt.phoneNo;

            if (dt.hasOwnProperty('pkgs')) {
                pkgs = dt.pkgs;
            }

            var data = {
                alive: true,
                Meskind: "Alive"
            };
            for (var j = 0; j < pkgs.length; j++) {
                if (Players.has("" + pkgs[j])) {
                    var idd = playerId;
                    let p = Players.get("" + pkgs[j]);
                    var data = p.get("" + idd);
                    data.alive = Date.now();
                    p.set("" + idd, data);
                    Players.set("" + pkgs[j], p);

                    socket.emit('new message', data);
                }
            }
        } catch (e) {
            console.log("Alive: " + e.message);
        }
        //io.emit('chat message', msg);
    });

    socket.on('Deliver', function (msg) {
        try {
            var dt = JSON.parse(msg);
            var playerId = dt.playerId.toString();
            var pkgName = dt.pkgName;
            var phoneNo = dt.phoneNo;

            if (dt.hasOwnProperty('pkgs')) {
                pkgs = dt.pkgs;
            }

            var nid = dt.nid;
            var idd = playerId;

            if (delivery.has("" + nid)) {
                let deliv = delivery.get("" + nid);
                deliv.set("" + idd, 1);
                delivery.set("" + nid, deliv);
            } else {
                let deliv = new Map();
                deliv.set("" + idd, 1);
                delivery.set("" + nid, deliv);
            }

            SetDeliverySql(nid, playerId);
        } catch (e) {
            console.log("Deliver: " + e.message);
        }
        //io.emit('chat message', msg);
    });

});

server.listen(_port);

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
    } else {
        mounth = "" + m;
    }

    if (day < 10) {
        dayOfMounth = "0" + day;
    } else {
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
    } else {
        hour = "" + h;
    }

    if (Min < 10) {
        minute = "0" + Min;
    } else {
        minute = "" + Min;
    }
    tm = hour + minute;
    return tm;
}

(function () {

    var timeout = setInterval(function () {
        try {
            SetLeagueState();
        } catch (e) {
            console.log("11: " + e.message);
        }
    }, 30000);

})();

function GetNotificationMysql() {
    try {
        var dateHejri = GetCurrentDate();
        var quer="(SELECT " +
        " notification.id, notification.appId, notification.title, notification.message, notification.url, notification.timeToLive, notification.dateStartSend," +
        " notification.timeStartSend, notification.sound, notification.smalIcon, notification.largeIcon, notification.bigPicture, notification.ledColor, " +
        " notification.accentColor, notification.gId, notification.priority, apps.pkgNameAndroid, apps.pkgNameIos, notification.kind, notification.IsStop, " +
        " notification.lastUpdateTime, notification.bigText, notification.summary, notification.budget, notification.isTest, notification.playerId, " +
        " notification.actionType, notification.hiddenNoti, notification.showTime, appTags.tagName, notification.chanelId, notification.dialogTitle, " +
        " notification.btnYesText, notification.btnNoText, notification.dialogMessage, notification.dialogActionType, notification.dialogActionUrl, " +
        " notification.isVibrate, apps.devEnvId, notification.iconId , notification.oappId" +
        " FROM notification  inner join apps on notification.appId = apps.id inner join appTags on notification.tagId = appTags.id" +
        " where dateStartSend>= " + dateHejri + " and notification.isTest = 1 and notification.isSend = 0)" +
        " UNION " +
        " (SELECT notification.id, notification.appId, notification.title, notification.message, notification.url, notification.timeToLive, notification.dateStartSend," +
        "  notification.timeStartSend, notification.sound, notification.smalIcon, notification.largeIcon, notification.bigPicture, notification.ledColor, " +
        " notification.accentColor, notification.gId, notification.priority, apps.pkgNameAndroid, apps.pkgNameIos, notification.kind, notification.IsStop, " +
        " notification.lastUpdateTime, notification.bigText, notification.summary, notification.budget, notification.isTest, notification.playerId, " +
        " notification.actionType, notification.hiddenNoti, notification.showTime, appTags.tagName, notification.chanelId, notification.dialogTitle, " +
        " notification.btnYesText, notification.btnNoText, notification.dialogMessage, notification.dialogActionType, notification.dialogActionUrl, " +
        " notification.isVibrate, apps.devEnvId, notification.iconId, notification.oappId " +
        " FROM notification  inner join apps on notification.appId = apps.id inner join appTags on notification.tagId = appTags.id " +
        " where dateStartSend>= " + dateHejri + " and notification.IsStop = 0 and  notification.isActive = 1 and notification.isTest = 0)";
        con.query(quer,
            function (err, result, fields) {
                if (!err) {
                    var row = result;

                    
                    for (var i = 0; i < row.length; i++) {
                        var id = row[i].id;
                        var appId = row[i].appId;
                        var oappId = row[i].oappId;
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
                        var budget = row[i].budget;
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
                        var devEnvId = row[i].devEnvId;

                        var iconId = row[i].iconId;

                        var chanelName = "";
                        var chanelDes = "";

                        var additionalData = [];
                        var btns = [];
                        var noti = {
                            id: row[i].id,
                            appId: row[i].appId,
                            title: row[i].title,
                            message: row[i].message,
                            url: row[i].url,
                            timeToLive: row[i].timeToLive,
                            dateStartSend: row[i].dateStartSend,
                            timeStartSend: row[i].timeStartSend,
                            sound: row[i].sound,
                            smalIcon: row[i].smalIcon,
                            largeIcon: row[i].largeIcon,
                            bigPicture: row[i].bigPicture,
                            ledColor: row[i].ledColor,
                            accentColor: row[i].accentColor,
                            gId: row[i].gId,
                            priority: row[i].priority,
                            pkgNameAndroid: row[i].pkgNameAndroid,
                            pkgNameIos: row[i].pkgNameIos,
                            kind: row[i].kind,
                            bigText: row[i].bigText,
                            summary: row[i].summary,
                            actionType: row[i].actionType,
                            hiddenNoti: row[i].hiddenNoti,
                            showTime: row[i].showTime,
                            tagName: row[i].tagName,
                            chanelId: chanelId,
                            chanelName: chanelName,
                            chanelDes: chanelDes,
                            dialogTitle: dialogTitle,
                            btnYesText: btnYesText,
                            btnNoText: btnNoText,
                            dialogMessage: dialogMessage,
                            dialogActionType: dialogActionType,
                            dialogActionUrl: dialogActionUrl,
                            isVibrate: isVibrate,
                            devEnvId: devEnvId,
                            iconId: iconId,
                            isTest: row[i].isTest,
                            IsStop: "0",
                            AdditionalData: additionalData,
                            btns: btns,
                            Meskind: "noti",
                            oappId: oappId
                        };

                        var curtm = GetCurrentTime();

                        //if (noti.timeToLive > curtm) {
                        //    if (budget < 10 && noti.isTest == 0) {
                        //        noti.IsStop = 1;
                        //    }

                        //}
                        //else {
                        //    if (noti.isTest == 0)
                        //        noti.IsStop = 1;
                        //}
                        allNoties[id] = noti;
                    }

                    allNoties.forEach(function (item, index, object) {
                        con.query("SELECT id,nId,dtKey,dtValue FROM notiAdditionalData where nId=" + item.id, function (erradd, resultadd, fieldsadd) {
                            if (!erradd) {
                                for (j = 0; j < resultadd.length; j++) {
                                    var dta = {
                                        "dtKey": resultadd[j].dtKey,
                                        "dtValue": resultadd[j].dtValue
                                    };
                                    var adid = resultadd[j].id;
                                    var adnid = resultadd[j].nId;
                                    allNoties[adnid].AdditionalData[j] = dta;
                                }
                            }
                        });
                    });

                    allNoties.forEach(function (item, index, object) {
                        con.query("SELECT id,nId,btnText,url,icon,actionType,dialogTitle,btnYesText,	btnNoText,dialogMessage,dialogActionType,dialogActionUrl FROM notiBtn where nId=" + item.id, function (errbtn, resultbtn, fieldsbtn) {
                            if (!errbtn) {
                                for (var j = 0; j < resultbtn.length; j++) {

                                    var dtb = {
                                        "id": resultbtn[j].id,
                                        "nId": resultbtn[j].nId,
                                        "btnText": resultbtn[j].btnText,
                                        "url": resultbtn[j].url,
                                        "icon": resultbtn[j].icon,
                                        "dialogTitle": resultbtn[j].dialogTitle,
                                        "btnYesText": resultbtn[j].btnYesText,
                                        "btnNoText": resultbtn[j].btnNoText,
                                        "dialogMessage": resultbtn[j].dialogMessage,
                                        "dialogActionType": resultbtn[j].dialogActionType,
                                        "dialogActionUrl": resultbtn[j].dialogActionUrl,
                                        "actionType": resultbtn[j].actionType
                                    };

                                    var bid = resultbtn[j].id;
                                    var bnid = resultbtn[j].nId;

                                    allNoties[bnid].btns[j] = dtb;
                                }
                            }
                        });
                    });

                    allNoties.forEach(function (item, index, object) {
                        con.query("SELECT id, name, des FROM  notificationChanels where id=" + item.chanelId, function (errchanel, resultchanel, fieldschanel) {
                            if (!errchanel) {
                                if (resultchanel.length > 0) {
                                    allNoties.forEach(function (item, index, object) {
                                        if (item.chanelId == chanelId) {
                                            item.chanelName = resultchanel[0].name;
                                            item.chanelDes = resultchanel[0].des;
                                        }
                                    });
                                }
                            }
                        });
                    });
                }
            });

    } catch (err) {
        console.log("myError: " + err);
        canCheckNotify = 1;
    }
}

function SendNoti() {

    allNoties.forEach(function (item, index, object) {
        var noti = item;

        var timeToSend = noti.timeStartSend + noti.timeToLive;
        var sendH = Math.floor(timeToSend / 60);
        var sendM = Math.floor(timeToSend % 60);
        var Days = 0;
        var HAfter = 0;
        if (sendH > 24) {
            Days = Math.floor(sendH / 24);
            HAfter = Math.floor(sendH - (Days * 24));
        } else {
            HAfter = sendH;
        }

        var yy = parseInt(noti.dateStartSend.toString().substr(0, 4));
        var mm = parseInt(noti.dateStartSend.toString().substr(4, 2));
        var dd = parseInt(noti.dateStartSend.toString().substr(6, 2));

        var curDateEnd = "";
        if (Days > 0) {
            dd += Days;
            if (dd > 29 && mm == 12 && y % 4 != 3) {
                dd = dd - 29;
                mm = 1;
                yy++;
            } else if (dd > 30 && mm == 12 && y % 4 == 3) {
                dd = dd - 30;
                mm = 1;
                yy++;
            } else if (dd > 31 && mm <= 6) {
                dd = dd - 31;
                mm++;
            } else if (dd > 30 && mm > 6) {
                dd = dd - 30;
                mm++;
            }
        }

        var year = "" + yy;
        var mounth = "";
        var dayOfMounth = "";
        if (mm < 10) {
            mounth = "0" + mm;
        } else {
            mounth = "" + mm;
        }

        if (dd < 10) {
            dayOfMounth = "0" + dd;
        } else {
            dayOfMounth = "" + dd;
        }

        var curDateEnd = year + "" + mounth + "" + dayOfMounth;

        var hcur = GetCurrentTime().substr(0, 2);

        if (noti.isTest > 0) {
            if (noti.pkgNameAndroid != "") {

                if (Players.has("" + noti.pkgNameAndroid)) {
                    let p = Players.get("" + noti.pkgNameAndroid);
                    if (p.has("" + idd)) {
                        var data = p.get("" + idd);
                        data.socket.emit('new message', SON.stringify(noti));
                    }
                }

                if (noti.oappId != "") {
                    var oapp = noti.oappId.split(",");
                    for (var i = 0; i < oapp.lenght; i++) {
                        var eachN = oapp.split("_");
                        var nt = noti;
                        nt.appId = eachN[0];
                        nt.pkgNameAndroid = eachN[1];
                        if (Players.has("" + nt.pkgNameAndroid)) {
                            let p = Players.get("" + nt.pkgNameAndroid);
                            if (p.has("" + idd)) {
                                var data = p.get("" + idd);
                                data.socket.emit('new message', SON.stringify(nt));
                            }
                        }
                    }
                }
            }
        } else {
            curDatev = "" + noti.dateStartSend;
            if (parseInt(curDatev) < parseInt(curDateEnd) || (parseInt(curDatev) == parseInt(curDateEnd) && parseInt(hcur) <= parseInt(HAfter))) {
                if (noti.IsStop == 0) {

                    if (Players.has("" + noti.pkgNameAndroid)) {
                        let p = Players.get("" + noti.pkgNameAndroid);
                        for (let idd of p.keys()) {
                            var data = p.get("" + idd);
                            if (delivery.has("" + noti.id)) {
                                let deliv = delivery.get("" + noti.id);
                                if (!deliv.has("" + idd)) {
                                    data.socket.emit('new message', JSON.stringify(noti));
                                }
                            } else {
                                data.socket.emit('new message', JSON.stringify(noti));
                            }
                        }
                    }

                    if (noti.oappId != "") {
                        var oapp = noti.oappId.split(",");
                        for (var i = 0; i < oapp.length; i++) {
                            var eachN = oapp[i].split("_");
                            var nt = noti;
                            nt.appId = eachN[0];
                            nt.pkgNameAndroid = eachN[1];

                            if (Players.has("" + nt.pkgNameAndroid)) {
                                let p = Players.get("" + nt.pkgNameAndroid);
                                for (let idd of p.keys()) {
                                    var data = p.get("" + idd);
                                    if (delivery.has("" + nt.id)) {
                                        let deliv = delivery.get("" + nt.id);
                                        if (!deliv.has("" + idd)) {
                                            data.socket.emit('new message', JSON.stringify(nt));
                                        }
                                    } else {
                                        data.socket.emit('new message', JSON.stringify(nt));
                                    }
                                }
                            }
                        }
                    }
                } else {

                }
            }
        }
    });
}

function SetLeagueState() {
    try {

        console.log("setLeague");
        var curDate = GetCurrentDate();
        var curtime = GetCurrentTime();

        var query = "SELECT id,name,des,logoAdd,limitPlayerCount,playerJoinCount,dateCreated,restHour,startDate,startTime,endDate,endTime,isAutomated,isDaily,isWeekly," +
            "isMounthly, myCount, lastCreteDate, lastCreateTime, startDay, endDay, startMounth, endMounth, isActive, appId, isEnd from league where isActive= 1 and isAutomated= 1";
        con.query(query, function (err, result, fields) {
            if (!err) {

                if (result.length > 0) {
                    var row = result;
                    for (var i = 0; i < row.length; i++) {
                        var id = row[i].id;
                        var name = row[i].name;
                        var des = row[i].des;
                        var logoAdd = row[i].logoAdd;
                        var limitPlayerCount = parseInt(row[i].limitPlayerCount);
                        var playerJoinCount = row[i].playerJoinCount;
                        var dateCreated = row[i].dateCreated;
                        var restHour = row[i].restHour;

                        var startDate = row[i].startDate;
                        var startTime = row[i].startTime;
                        var endDate = row[i].endDate;
                        var endTime = row[i].endTime;
                        var isAutomated = row[i].isAutomated;
                        var isDaily = row[i].isDaily;
                        var isWeekly = row[i].isWeekly;
                        var isMounthly = row[i].isMounthly;
                        var myCount = row[i].myCount;
                        var lastCreteDate = row[i].lastCreteDate;
                        var lastCreateTime = row[i].lastCreateTime;
                        var startDay = row[i].startDay;
                        var endDay = row[i].endDay;
                        var startMounth = row[i].startMounth;
                        var endMounth = row[i].endMounth;
                        var isActive = row[i].isActive;
                        var appId = row[i].appId;
                        var isEnd = parseInt(row[i].isEnd);

                        var qqjoi = ",playerJoinCount=0";

                        if (parseInt(curDate) < parseInt(endDate)) {
                            if (parseInt(isDaily) > 0) {
                                if (parseInt(curtime) > parseInt(endTime)) {
                                    if (parseInt(isEnd) == 0) {
                                        var qq = "INSERT INTO `leagueLog` (`lId`, `name`, `des`, `logoAdd`, `startDate`, `startTime`, `endDate`, `endTime`, `playerJoinCount`," +
                                            "`limitPlayerCount`, `appId`, `dateCreated`, `isAutomated`, `isDaily`, `isWeekly`, `isMounthly`, `restHour`, `myCount`," +
                                            "`lastCreteDate`, `lastCreateTime`, `startDay`, `endDay`, `startMounth`, `endMounth`, `isActive`, `isEnd`) " +
                                            " VALUES(" + id + ", '" + name + "', '" + des + "', '" + logoAdd + "', " + startDate + ", '" + startTime + "', " + endDate + ", '" + endTime + "'," +
                                            " " + playerJoinCount + ", " + limitPlayerCount + ", " + appId + ", " + dateCreated + ", " + isAutomated + ", " + isDaily + "" +
                                            ", " + isWeekly + ", " + isMounthly + ", " + restHour + ", " + myCount + ", " + lastCreteDate + ", '" + lastCreateTime + "', " + startDay + "" +
                                            ", " + endDay + ", " + startMounth + ", " + endMounth + ", " + isActive + ", " + isEnd + "); ";

                                        con.query(qq, function (errqq, resultqq, fieldsqq) {
                                            if (!errqq) {} else {
                                                console.log("err 1: " + errqq);
                                            }
                                        });

                                        setLeagueBest(id, myCount, appId, curDate, curtime);
                                    }
                                } else if (parseInt(curtime) > parseInt(startTime) && parseInt(isEnd) == 1) {
                                    var qq = "update league set isEnd=0 " + qqjoi + "  where id=" + id;
                                    con.query(qq, function (errqq, resultqq, fieldsqq) {
                                        if (!errqq) {} else {
                                            console.log("err 2: " + errqq);
                                        }
                                    });
                                }
                            } else if (parseInt(isWeekly) > 0) {
                                var d = new Date();
                                var n = parseInt(d.getDay());
                                n += 2;
                                if (n > 7) {
                                    n = 1;
                                }

                                if ((n > parseInt(endDay) || n < parseInt(startDay)) && isEnd == 0) {
                                    var qq = "INSERT INTO `leagueLog` (`lId`, `name`, `des`, `logoAdd`, `startDate`, `startTime`, `endDate`, `endTime`, `playerJoinCount`," +
                                        "`limitPlayerCount`, `appId`, `dateCreated`, `isAutomated`, `isDaily`, `isWeekly`, `isMounthly`, `restHour`, `myCount`," +
                                        "`lastCreteDate`, `lastCreateTime`, `startDay`, `endDay`, `startMounth`, `endMounth`, `isActive`, `isEnd`) " +
                                        " VALUES(" + id + ", '" + name + "', '" + des + "', '" + logoAdd + "', " + startDate + ", '" + startTime + "', " + endDate + ", '" + endTime + "'," +
                                        " " + playerJoinCount + ", " + limitPlayerCount + ", " + appId + ", " + dateCreated + ", " + isAutomated + ", " + isDaily + "" +
                                        ", " + isWeekly + ", " + isMounthly + ", " + restHour + ", " + myCount + ", " + lastCreteDate + ", '" + lastCreateTime + "', " + startDay + "" +
                                        ", " + endDay + ", " + startMounth + ", " + endMounth + ", " + isActive + ", " + isEnd + "); ";

                                    con.query(qq, function (errqq, resultqq, fieldsqq) {
                                        if (!errqq) {} else {
                                            console.log("err 3: " + errqq);
                                        }
                                    });

                                    setLeagueBest(id, myCount, appId, curDate, curtime);
                                } else if (n < parseInt(endDay) && n > parseInt(startDay) && isEnd == 1) {
                                    var qq = "update league set isEnd=0 " + qqjoi + "  where id=" + id;
                                    con.query(qq, function (errqq, resultqq, fieldsqq) {
                                        if (!errqq) {} else {
                                            console.log("err 4: " + errqq);
                                        }
                                    });
                                } else if (n == parseInt(endDay)) {
                                    if (parseInt(curtime) >= parseInt(endTime) && isEnd == 0) {
                                        var qq = "INSERT INTO `leagueLog` (`lId`, `name`, `des`, `logoAdd`, `startDate`, `startTime`, `endDate`, `endTime`, `playerJoinCount`," +
                                            "`limitPlayerCount`, `appId`, `dateCreated`, `isAutomated`, `isDaily`, `isWeekly`, `isMounthly`, `restHour`, `myCount`," +
                                            "`lastCreteDate`, `lastCreateTime`, `startDay`, `endDay`, `startMounth`, `endMounth`, `isActive`, `isEnd`) " +
                                            " VALUES(" + id + ", '" + name + "', '" + des + "', '" + logoAdd + "', " + startDate + ", '" + startTime + "', " + endDate + ", '" + endTime + "'," +
                                            " " + playerJoinCount + ", " + limitPlayerCount + ", " + appId + ", " + dateCreated + ", " + isAutomated + ", " + isDaily + "" +
                                            ", " + isWeekly + ", " + isMounthly + ", " + restHour + ", " + myCount + ", " + lastCreteDate + ", '" + lastCreateTime + "', " + startDay + "" +
                                            ", " + endDay + ", " + startMounth + ", " + endMounth + ", " + isActive + ", " + isEnd + "); ";

                                        con.query(qq, function (errqq, resultqq, fieldsqq) {
                                            if (!errqq) {} else {
                                                console.log("err 5: " + errqq);
                                            }
                                        });

                                        setLeagueBest(id, myCount, appId, curDate, curtime);
                                    } else if (isEnd == 1) {
                                        var qq = "update league set isEnd=0 " + qqjoi + "  where id=" + id;
                                        con.query(qq, function (errqq, resultqq, fieldsqq) {
                                            if (!errqq) {} else {
                                                console.log("err 6: " + errqq);
                                            }
                                        });
                                    }
                                } else if (n == parseInt(startDay) && parseInt(curtime) >= parseInt(startTime) && isEnd == 1) {
                                    var qq = "update league set isEnd=0 " + qqjoi + "  where id=" + id;
                                    con.query(qq, function (errqq, resultqq, fieldsqq) {
                                        if (!errqq) {} else {
                                            console.log("err 7: " + errqq);
                                        }
                                    });
                                }
                            } else if (parseInt(isMounthly) > 0) {

                                var dateHijri = GetCurrentDate();
                                var y = parseInt(dateHijri.substr(0, 4));
                                var m = parseInt(dateHijri.substr(4, 2));
                                var day = parseInt(dateHijri.substr(6, 2));

                                if ((day > parseInt(endMounth) || day < parseInt(startMounth)) && isEnd == 0) {
                                    var qq = "INSERT INTO `leagueLog` (`lId`, `name`, `des`, `logoAdd`, `startDate`, `startTime`, `endDate`, `endTime`, `playerJoinCount`," +
                                        "`limitPlayerCount`, `appId`, `dateCreated`, `isAutomated`, `isDaily`, `isWeekly`, `isMounthly`, `restHour`, `myCount`," +
                                        "`lastCreteDate`, `lastCreateTime`, `startDay`, `endDay`, `startMounth`, `endMounth`, `isActive`, `isEnd`) " +
                                        " VALUES(" + id + ", '" + name + "', '" + des + "', '" + logoAdd + "', " + startDate + ", '" + startTime + "', " + endDate + ", '" + endTime + "'," +
                                        " " + playerJoinCount + ", " + limitPlayerCount + ", " + appId + ", " + dateCreated + ", " + isAutomated + ", " + isDaily + "" +
                                        ", " + isWeekly + ", " + isMounthly + ", " + restHour + ", " + myCount + ", " + lastCreteDate + ", '" + lastCreateTime + "', " + startDay + "" +
                                        ", " + endDay + ", " + startMounth + ", " + endMounth + ", " + isActive + ", " + isEnd + "); ";

                                    con.query(qq, function (errqq, resultqq, fieldsqq) {
                                        if (!errqq) {} else {
                                            console.log("err 7: " + errqq);
                                        }
                                    });

                                    setLeagueBest(id, myCount, appId, curDate, curtime);
                                } else if (day < parseInt(endMounth) && day > parseInt(startMounth) && isEnd == 1) {
                                    var qq = "update league set isEnd=0 " + qqjoi + "  where id=" + id;
                                    con.query(qq, function (errqq, resultqq, fieldsqq) {
                                        if (!errqq) {} else {
                                            console.log("err 8: " + errqq);
                                        }
                                    });
                                } else if (day == parseInt(endMounth)) {
                                    if (parseInt(curtime) >= parseInt(endTime) && isEnd == 0) {
                                        var qq = "INSERT INTO `leagueLog` (`lId`, `name`, `des`, `logoAdd`, `startDate`, `startTime`, `endDate`, `endTime`, `playerJoinCount`," +
                                            "`limitPlayerCount`, `appId`, `dateCreated`, `isAutomated`, `isDaily`, `isWeekly`, `isMounthly`, `restHour`, `myCount`," +
                                            "`lastCreteDate`, `lastCreateTime`, `startDay`, `endDay`, `startMounth`, `endMounth`, `isActive`, `isEnd`) " +
                                            " VALUES(" + id + ", '" + name + "', '" + des + "', '" + logoAdd + "', " + startDate + ", '" + startTime + "', " + endDate + ", '" + endTime + "'," +
                                            " " + playerJoinCount + ", " + limitPlayerCount + ", " + appId + ", " + dateCreated + ", " + isAutomated + ", " + isDaily + "" +
                                            ", " + isWeekly + ", " + isMounthly + ", " + restHour + ", " + myCount + ", " + lastCreteDate + ", '" + lastCreateTime + "', " + startDay + "" +
                                            ", " + endDay + ", " + startMounth + ", " + endMounth + ", " + isActive + ", " + isEnd + "); ";

                                        con.query(qq, function (errqq, resultqq, fieldsqq) {
                                            if (!errqq) {} else {
                                                console.log("err 9: " + errqq);
                                            }
                                        });

                                        setLeagueBest(id, myCount, appId, curDate, curtime);
                                    } else if (isEnd == 1) {
                                        var qq = "update league set isEnd=0 " + qqjoi + "  where id=" + id;
                                        con.query(qq, function (errqq, resultqq, fieldsqq) {
                                            if (!errqq) {} else {
                                                console.log("err 10: " + errqq);
                                            }
                                        });
                                    }
                                } else if (day == parseInt(startMounth) && parseInt(curtime) >= parseInt(startTime) && isEnd == 1) {
                                    var qq = "update league set isEnd=0 " + qqjoi + "  where id=" + id;
                                    con.query(qq, function (errqq, resultqq, fieldsqq) {
                                        if (!errqq) {} else {
                                            console.log("err 11: " + errqq);
                                        }
                                    });
                                }
                            }
                        }
                    }
                } else {

                }

            }
        });
    } catch (e) {
        console.log("160: " + e.message);
    }
}

//saeed

function setLeagueBest(lId, myCount, appId, curDate, curtime) {
    cnt = parseInt(myCount) + 1;
    q = "select id,uid from apps where id=" + appId;
    con.query(q, function (err, result, fields) {
        if (!err) {

            if (result.length > 0) {
                var row = result;
                for (var i = 0; i < row.length; i++) {
                    var id = row[i].id;
                    var uid = row[i].uid;
                    var tbName = "zz_" + appId + "_" + uid + "_lud";
                    var crq = "select ";
                    var Cols = [];
                    var typs = [];
                    var olaviat = [];

                    var qCol = "SELECT `COLUMN_NAME`,`DATA_TYPE`  FROM `INFORMATION_SCHEMA`.`COLUMNS` WHERE `TABLE_SCHEMA`='kingofmeta_ADok' AND `TABLE_NAME`='" + tbName + "';";
                    var k = 0;
                    con.query(qCol, function (errCol, resultCol, fieldsCol) {
                        if (!errCol) {
                            for (j = 0; j < resultCol.length; j++) {
                                var clName = resultCol[j].COLUMN_NAME;
                                var clType = resultCol[j].DATA_TYPE;
                                Cols.push(clName);
                                typs[clName] = clType;

                                if (j == 0) {
                                    k++;
                                    crq += "tb." + clName;
                                } else {
                                    crq += ",tb." + clName;
                                }

                                var qOlaviat = "select name,olaviat from leagueData where appId=" + appId + "  and leagueId=" + lId + "  and olaviat>0 order by olaviat DESC";
                                var olvQO = "";
                                k = 0;

                                con.query(qOlaviat, function (errOlaviat, resultOlaviat, fieldsOlaviat) {
                                    if (!errOlaviat) {
                                        for (j = 0; j < resultOlaviat.length; j++) {
                                            var olvN = resultOlaviat[j].name;
                                            var olaviatA = resultOlaviat[j].olaviat;

                                            olaviat.push(olvN);
                                            if (j == 0) {
                                                k++;
                                                olvQO += olvN + " DESC ";
                                            } else {
                                                olvQO += "," + olvN + "  DESC ";
                                            }
                                        }
                                    } else {
                                        console.log("err errOlaviat: " + errOlaviat);
                                    }

                                    crq += ",p.nickname from " + tbName + "  as tb inner join players as p on tb.playerId=p.id ";
                                    crq += " where myCount=" + myCount + "  and lId=" + lId + "  and isShow=1 ";
                                    crq += " ORDER by " + olvQO + "limit 10000";

                                    console.log("--- " + crq + " --- ");
                                    Cols.push("nickname");
                                    con.query(crq, function (errcrq, resultcrq, fieldscrq) {
                                        if (!errcrq) {
                                            for (j = 0; j < resultcrq.length; j++) {
                                                var qIns = "insert into  " + tbName + "_res (";
                                                var qValues = "(";
                                                k = 0;

                                                var rowRq = resultcrq[j];
                                                for (l = 0; l < rowRq.length; l++) {
                                                    var prop = Cols[l];
                                                    if (prop == "nickname" || prop == "id") {} else {
                                                        if (k == 0) {
                                                            k++;
                                                            qIns += prop;
                                                            if (typs[prop] == "int") {
                                                                qValues += rowRq[l];
                                                            } else {
                                                                qValues += "' " + rowRq[l] + " '";
                                                            }
                                                        } else {
                                                            qIns += ", prop";
                                                            if (typs[prop] == "int") {
                                                                qValues += "," + rowRq[l];
                                                            } else {
                                                                qValues += ",' " + rowRq[l] + " '";
                                                            }
                                                        }
                                                    }
                                                }

                                                qIns += " ) values  (" + qValues + ")";
                                                con.query(qIns, function (errqIns, resultqIns, fieldsqIns) {
                                                    if (!errqIns) {} else {
                                                        console.log("err errqIns: " + errqIns);
                                                    }
                                                });

                                            }

                                        } else {
                                            console.log("err errqIns: " + errcrq);
                                        }
                                    });
                                });

                            }
                        } else {
                            console.log("err errCol: " + errCol);
                        }
                    });
                }
            } else {

            }

        }
    });
}

function SetDeliverySql(nid, playerId) {
    try {
        con.query("update notification set isSend=1 where id=" + nid, function (err, result, fields) {});

        con.query("SELECT id,count from nodeDelivery where nid=" + nid + " and playerId=" + playerId, function (errsel, resultsel, fieldssel) {
            if (!errsel) {
                if (resultsel.length > 0) {
                    for (var j = 0; j < resultsel.length; j++) {
                        did = resultsel[j].id;
                        dcount = parseInt(resultsel[j].count);
                        dcount++;
                        con.query("update nodeDelivery set  count=" + dcount + " where id=" + did, function (errupd, resultupd, fieldsupd) {});
                    }
                } else {
                    con.query("insert into nodeDelivery (nid,playerId,count) values (" + nid + "," + playerId + ",1);", function (errupd, resultupd, fieldsupd) {});
                }

            }
        });

        // console.log(string1);
    } catch (err) {
        // do something
    }

}

function PlayerDisonnectedSql(pid) {
    curDate = GetCurrentDate();
    tm = GetCurrentTime();
    con.query("update players set 	isConnected=0,disTime='" + tm + "',disDate=" + curDate + " where id=" + pid, function (errupd, resultupd, fieldsupd) {});
}

function PlayerConnectedSql(pid, pkgs) {
    curDate = GetCurrentDate();
    tm = GetCurrentTime();
    con.query("update players set 	isConnected=1,lastTime='" + tm + "',lastDate=" + curDate + " where id=" + pid, function (errupd, resultupd, fieldsupd) {});
}