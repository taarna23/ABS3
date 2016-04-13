/*:
 * @plugindesc v1.02 Add projectiles to game
 * @author Gilgamar
 * @license MIT
 *
 */

GIL.configure('Projectile');

//-----------------------------------------------------------------------------
// Game_Projectile
//
// A wrapper class for a projectile event.

Projectile._projectiles = [];
function Projectile() {
    this.initialize.apply(this, arguments);
}

Projectile.add    = function(obj) { Projectile._projectiles[obj.id] = obj; };
Projectile.get    = function(id)  { return Projectile._projectiles[id]; };
Projectile.clear  = function()    { Projectile._projectiles = []; };
Projectile.start  = function()    { Projectile._start = performance.now(); };

Projectile.erased = function() {
    return Projectile._projectiles.filter(function(projectile) {
        return projectile._erased === true;
    });
};

Projectile.prototype.erase = function() { this._erased = true; };

Projectile.prototype.initialize = function(param, id) {
    if (this.isReady(param, id)) {
        this._param = param;
        this.hit = this._param.hit;
        this._erased = false;
        this.setup(id);
    }
};

Projectile.prototype.isReady = function(param, id) {
    if (id === undefined) {
        var elapsed = performance.now() - Projectile._start;
        // console.log(elapsed);
        if (elapsed < param.delay) return false;
        Projectile.start();
    }
    return true;
};

Projectile.prototype.setup = function(id) {
    this.setPosition(id);

    if (this.isAvailable()) {
        Projectile.add(this);
        var e = $gameMap.event(this.id);
        e.initialize(e._mapId, e._eventId);
    } else {
        this.id = $gameMap.addEvent(
            this._param.mapId,
            this._param.eventId,
            this.x, this.y
        );
        Projectile.add(this);
    }
};

Projectile.prototype.setPosition = function(id) {
    var e;
    if (id > 0) e = $gameMap.event(id);
    else        e = $gamePlayer;
    this.d = e._direction;
    this.x = e._x;
    this.y = e._y;
};

Projectile.prototype.isAvailable = function() {
    var erased = Projectile.erased();

    erased.some(function(e) {
        if (this._param.eventId === e._param.eventId) {
            this.id = erased.pop().id;
            return true;
        }
    }, this);
    return this.id > 0;
};

//=============================================================================
// Game_Map
//=============================================================================
GIL.Projectile.alias('Game_Map.prototype.setup');
Game_Map.prototype.setup = function(mapId) {
    Projectile.clear();
    GIL.Projectile.aliasCall('Game_Map.prototype.setup', this, [mapId]);
};

//=============================================================================
// Game_Event
//=============================================================================
GIL.Projectile.alias('Game_Event.prototype.initialize');
Game_Event.prototype.initialize = function(mapId, eventId) {
    GIL.Projectile.aliasCall('Game_Event.prototype.initialize', this, [mapId, eventId]);

    var projectile = Projectile.get(this._eventId);
    if (projectile) this.initProjectile(projectile);
};

Game_Event.prototype.initProjectile = function(projectile) {
    this._projectile = projectile;
    this.setDirectionFix(false);
    this.setDirection(projectile.d);
    this.setDirectionFix(true);
    this.locate(projectile.x, projectile.y);
};

Game_Event.prototype.isProjectile = function() {
    return !!this._projectile;
};

GIL.Projectile.alias('Game_Event.prototype.update');
Game_Event.prototype.update = function() {
    GIL.Projectile.aliasCall('Game_Event.prototype.update', this);
    this.updateProjectile();
};

Game_Event.prototype.updateProjectile = function() {
    if (this._erased) return;
    if (!this.isProjectile()) return;
    if (!this.isMoving() && this._projectile._hit) {
        this.removeProjectile();
    }
    if (this.isMovementSucceeded()) return;
    this.projectileHit();
};

Game_Event.prototype.projectileHit = function() {
    var d = this._direction;
    var x = $gameMap.roundXWithDirection(this._x, d);
    var y = $gameMap.roundYWithDirection(this._y, d);

    if (this.isCollidedWithPlayerCharacters(x, y)) {
        this._projectile.hit($gamePlayer);
        return this.projectileHitCharacter();
    }
    else {
        var events = $gameMap.eventsXy(x, y);
        for (var i = 0; i < events.length; i++) {
            var e = events[i];
            if (e.isBattler()) {
                this._projectile.hit(e);
                return this.projectileHitCharacter();
            }
        }
    }
    this.removeProjectile();
};

Game_Event.prototype.projectileHitCharacter = function() {
    this.setThrough(true);
    this.moveStraight();
    this._projectile._hit = true;
};

Game_Event.prototype.removeProjectile = function() {
    this.erase();
    this._projectile.erase();
};

Game_Event.prototype.knockback = function(d) {
    if (this.canPass(this._x, this._y, d)) {
        this.setDirectionFix(true);
        this.moveStraight(d);
        this.setDirectionFix(false);
    }
};
