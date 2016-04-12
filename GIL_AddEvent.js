/*:
 * @plugindesc v1.01 Add event from another map
 * @author Gilgamar
 * @license MIT
 *
 */

GIL.configure('AddEvent');

OtherMapData = null;

//=============================================================================
// Game_Event
//=============================================================================
GIL.AddEvent.alias('Game_Event.prototype.initialize');
Game_Event.prototype.initialize = function(mapId, eventId) {
    var source = ($gameMap || {})._sourceData;
    if (source) {
        this._sourceData = source;
        this._eventData  = source.eventData;
        delete this._sourceData.eventData;
        $gameMap._sourceData = null;
    }
    GIL.AddEvent.aliasCall('Game_Event.prototype.initialize', this, [mapId, eventId]);
};

GIL.AddEvent.alias('Game_Event.prototype.event');
Game_Event.prototype.event = function() {
    if (this._eventData) {
        return this._eventData;
    }
    return GIL.AddEvent.aliasCall('Game_Event.prototype.event', this);
};

//=============================================================================
// Game_Map
//=============================================================================
Game_Map.prototype.addEvent = function(mapId, eventId, x, y) {
    var isInteger = Number.isInteger(mapId);
    if (isInteger) {
        var nextId;

        // Check for event at x,y
        var e = $gameMap.eventsXy(x, y)[0];
        if (e) nextId = e._eventId;
        else   nextId = this.nextId();

        this._sourceData = {
            eventData: null,
            mapId:   mapId,
            eventId: eventId,
            nextId: nextId,
            x: x,
            y: y,
        };
        if (mapId === this._mapId)  this.updateNewEvent();
        else                        this.loadOtherMapData(mapId);
        return nextId;
    }
    return null;
};

Game_Map.prototype.updateNewEvent = function() {
    var source  = this._sourceData;
    var mapId   = source.mapId;
    var eventId = source.eventId;
    var nextId  = source.nextId;

    var eventData;
    if (OtherMapData)       eventData = OtherMapData.events[eventId];
    else                    eventData = $dataMap.events[eventId];
    OtherMapData = null;

    source.eventData = JsonEx.makeDeepCopy(eventData);
    source.eventData.x = source.x;
    source.eventData.y = source.y;
    source.eventData._eventId = nextId;

    // Check for event at x,y
    var e = $gameMap.eventsXy(source.x, source.y)[0];
    if (e) {
        e.initialize(e._mapId, e._eventId); // Swap events
    } else {
        this.addNewEvent(mapId, nextId);
    }


};

Game_Map.prototype.addNewEvent = function(mapId, nextId) {
    var newEvent = new Game_Event(mapId, nextId);
    $gameMap._events[nextId] = newEvent;

    var scene = SceneManager._scene;
    if (scene instanceof Scene_Map) {
        var sprite = new Sprite_Character(newEvent);
        var spriteset = scene._spriteset;
        spriteset._characterSprites.push(sprite);
        spriteset._tilemap.addChild(sprite);
    }
};

Game_Map.prototype.nextId = function() {
    var events = this.events();
    var length = events.length;
    for (var i = 0; i < length; i++) {
        var prevId = (events[i-1] || {})._eventId || 0;
        var currId = (events[i]   || {})._eventId;
        var diff = (currId - prevId);
        if (diff > 1) return prevId + 1;
    }
    return events[length-1]._eventId + 1;
};

Game_Map.prototype.loadOtherMapData = function(mapId) {
    if (mapId > 0) {
        OtherMapData = {};
        var filename = 'Map%1.json'.format(mapId.padZero(3));
        DataManager.loadDataFile('OtherMapData', filename);
    }
};

//=============================================================================
// DataManager
//=============================================================================
// Replacement method
DataManager.onLoad = function(object) {
    var array;
    if (object === OtherMapData || object === $dataMap) {       // Gilgamar 2016.04.09
        this.extractMetadata(object);
        array = object.events;
    } else {
        array = object;
    }
    if (Array.isArray(array)) {
        for (var i = 0; i < array.length; i++) {
            var data = array[i];
            if (data && data.note !== undefined) {
                this.extractMetadata(data);
            }
        }
    }
    if (object === OtherMapData) $gameMap.updateNewEvent();     // Gilgamar 2016.04.09
};
