/* Timetable for Paris local transport Module */
/* Magic Mirror
 * Module: MMM-Ratp
 *
 * By Louis-Guillaume MORAND
 * based on a script from Benjamin Angst http://www.beny.ch and Georg Peters (https://lane6.de)
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
        console.log("MMM-Transilien- NodeHelper started");
    },

    /* updateTimetable(transports)
     * Calls processTransports on succesfull response.
     */
    updateTimetable: function() {
        var url = "http://api.transilien.com/gare/"+ this.config.departUIC + "/depart/"+ this.config.arriveeUIC;
        console.log(url);
        var self = this;
        var retry = false;


        // calling this API
        var request = unirest.get(url);
        request.auth({
            user: 'tnhtn613',
            pass: '4i2xsTN7',
            sendImmediately: true
        });
        // from the documentation of the api, it'll will mandatory in next version of the api
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
        
        // console.log(data.response);
        // we convert it to json to be easier to parse
        var responseInJson = null;
        xml2js.parseString(data, { ignoreAttrs : true }, function (err, result) {
                            responseInJson = result;
        });

         console.log("---------------------------- XML TRANSFORMED TO JSON---------------------------------------\r\n");
         console.log(responseInJson);

        this.lineInfo = "Prochains trains en gare de " + this.config.depart + " vers " + this.config.arrivee;
        for (var i = 0, count = responseInJson.passages.train.length; i < 5 /*count*/; i++) {

            var nextTrain = responseInJson.passages.train[i];

            var _date = '' + nextTrain.date;

            this.transports.push({
                name: nextTrain.miss,
                date: _date.substring(_date.lastIndexOf(" ")+1),
                mode: nextTrain.date.mode,
                state: nextTrain.etat
            });
        }

        this.loaded = true;
        this.sendSocketNotification("TRAINS", {
            transports: this.transports,
            lineInfo: this.lineInfo
        });
    },


    /* scheduleUpdate()
     * Schedule next update.
     * argument delay number - Millis econds before next update. If empty, this.config.updateInterval is used.
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