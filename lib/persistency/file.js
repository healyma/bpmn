/**
 * AUTHOR: mrassinger
 * COPYRIGHT: E2E Technologies Ltd.
 */
"use strict";

var JaguarDb = require('jaguarDb').JaguarDb;

/**
 * @param {String} path Path to directory containing the files
 * @constructor
 */
function Persistency(path) {
    this.path = path;
    this.db = new JaguarDb();
}
exports.Persistency = Persistency;

/**
 * @param {{processInstanceId: String}} persistentData
 * @param {Function} done
 */
Persistency.prototype.persist = function(persistentData, done) {
    var db = this.db;

    db.connect(this.path, function(error) {
        if(error) {
            done(error);
        } else {
            var processId = persistentData.processId;
            var query = {processId: processId};
            var fields = {}; // all fields
            db.find(query, fields, function(err, documents) {
                if (documents && documents.length > 0) {
                    if (documents.length === 1) {
                        persistentData._id = documents[0]._id;
                        persistentData._saved = documents[0]._saved;
                        persistentData._updated = Date.now();
                        db.update(persistentData, function(error, updatedData) {
                            if(error) {
                                done(error);
                            } else {
                                done(null, updatedData);
                            }
                        });
                    } else {
                        done(new Error("Process ID: '" + processId + "' is not unique in the DB"));
                    }
                } else {
                    persistentData._saved = Date.now();
                    persistentData._updated = persistentData._saved;
                    db.insert(persistentData, function(error, insertedData) {
                        if(error) {
                            done(error);
                        } else {
                            done(null, insertedData);
                        }
                    });
                }
            });
        }
    });
};

/**
 * @param {String} processInstanceId
 * @param done
 */
Persistency.prototype.load = function(processInstanceId, done) {
    var db = this.db;

    db.connect(this.path, function(error) {
        if(error) {
            done(error);
        } else {
            var query = {processId: processInstanceId};
            var fields = {}; // all fields
            db.find(query, fields, function(err, documents) {
                if (documents && documents.length > 0) {
                    if (documents.length === 1) {
                        if(error) {
                            done(error);
                        } else {
                            done(null, documents[0]);
                        }
                    } else {
                        done(new Error("Persistency: Process ID: '" + processInstanceId + "' is not unique in the DB"));
                    }
                } else {
                    // we allow that nothing has been found because this happens
                    // the very first time when the process is being created
                    done();
                }
            });
        }
    });
};

Persistency.prototype.close = function() {};