/* Timetable for Paris local transport Module */
/* Magic Mirror
 * Module: MMM-Ratp
 *
 * By Louis-Guillaume MORAND
 * MIT Licensed.
 */
const NodeHelper = require("node_helper");
const forge = require('node-forge');
const unirest = require('unirest');
const xml2js = require('xml2js');

module.exports = NodeHelper.create({

    updateTimer: "",
    start: function() {
        this.started = false;
        console.log("\r\nMMM-Transilien- NodeHelper started");
        // console.log("\r\nMMM-Transilien- Debug mode enabled: "+this.config.debugging +"\r\n");
    },

    /* updateTimetable(transports)
     * Calls processTransports on succesfull response.
     */
    updateTimetable: function() {
        var url = "http://api.transilien.com/gare/"+ this.config.departUIC + "/depart/"+ this.config.arriveeUIC;
        if (this.config.debugging) console.log("\r\nURL loaded for transilien:"+url);
        var self = this;
        var retry = false;

        // calling this API
        var request = unirest.get(url);
        request.auth({
            user: this.config.login,
            pass: this.config.password,
            sendImmediately: true
        });

        // from the documentation of the api, it'll be mandatory in next version of the api
        request.headers({'Accept': 'application/vnd.sncf.transilien.od.depart+xml;vers=1.0'});
        request.end(function(r) {
                if (r.error) {
                    console.log(self.name + " : " + r.error);
                    retry = true;
                } else {
                    self.processTransports(r.body);
                }

                if (retry) {
                    console.log("retrying");
                    self.scheduleUpdate((self.loaded) ? -1 : this.config.retryDelay);
                }
            });
    },

    /* processTransports(data)
     * Uses the received data to set the various values.
     */
    processTransports: function(data) {

        this.transports = [];

        // console.log("-------------------------- XML RECEIVED-----------------------------------------\r\n");
        // console.log(data);
        
        // we convert it to json to be easier to parse
        var responseInJson = null;
        xml2js.parseString(data, { ignoreAttrs : true }, function (err, result) {
                            responseInJson = result;
        });

        //  console.log("---------------------------- XML TRANSFORMED TO JSON---------------------------------------\r\n");
        //  console.log(responseInJson);

        // we don't want to return too much trains
        var count = this.config.trainsdisplayed;
        if(responseInJson.passages.train.length < count)
        {
            count = responseInJson.passages.train.length;
        }

        for (var i = 0; i < count; i++) {

            var nextTrain = responseInJson.passages.train[i];

            if(nextTrain !== undefined)
            {
                var _date = '' + nextTrain.date;

                this.transports.push({
                    name: nextTrain.miss,
                    date: _date.substring(_date.lastIndexOf(" ")+1),
                    mode: nextTrain.date.mode,
                    state: nextTrain.etat
                });
            }
        }

        this.loaded = true;
        this.sendSocketNotification("TRAINS", {
            transports: this.transports
        });
    },


    /* scheduleUpdate()
     * Schedule next update.
     * argument delay number - Milliseconds before next update. If empty, this.config.updateInterval is used.
     */
    scheduleUpdate: function(delay) {
        var nextLoad = this.config.updateInterval;

        if (typeof delay !== "undefined" && delay > 0) {
            nextLoad = delay;
        }

        var self = this;
        clearTimeout(this.updateTimer);
        this.updateTimer = setInterval(function() {
            self.updateTimetable();
        }, nextLoad);
    },

    socketNotificationReceived: function(notification, payload) {
        if (payload.debugging) {
            console.log("Notif received: " + notification);
            console.log(payload);
        }

        const self = this;
        if (notification === 'CONFIG' && this.started == false) {
            this.config = payload;
            this.started = true;
            self.scheduleUpdate(this.config.initialLoadDelay);
        }
    }
});