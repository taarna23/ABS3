/*:
 * @plugindesc v1.00 Action Battle System Battle
 * @author Gilgamar
 * @license MIT
 *
 */

//-----------------------------------------------------------------------------
// ABS Battle
//
// A battle template for ABS.

function ABS_Battle() {
    this.initialize.apply(this, arguments);
}

ABS_Battle.prototype.log = console.log.bind(console);
// ABS_Battle.prototype.log = function() {};

ABS_Battle.prototype.initialize = function(obj) {
    if (this.enemies !== 0)  ABS._cleared = false;
    this.id = obj._eventId;
    if (obj.constructor === ABS_Skill) {
        this.skill = obj;
    } else {
        this.skill = {};
        this.skill.id = 1;
    }
    this._valid = this.validate();
};

ABS_Battle.prototype.validate = function() {
    if (!this.id)                           return false;
    if (this.delta < ABS.attackDelay())     return false;
    if (!this.hasActor())                   return false;
    if (!this.hasEnemy())                   return false;
    if (this.enemy.hp === 0)                return false;
    if (this.skill.id === 1) {
        if (this.actor.isMotionPlaying())   return false;
    }
    return true;
};

ABS_Battle.prototype.hasActor = function() {
    return this._actor && this.actor;
};

ABS_Battle.prototype.hasEnemy = function() {
    return this._enemy && this.enemy;
};

ABS_Battle.prototype.actorAttack = function() {
    this.takeAction(this.skill.id, this.actor, this.enemy);
};

ABS_Battle.prototype.enemyAttack = function() {
    if (this.skill.ranged) return;
    this.takeAction(1, this.enemy, this.actor);
};

ABS_Battle.prototype.takeAction = function(id, a, b) {
    var action  = new Game_Action(a);

    if (id === 1) a.performAttack();
    action.setSkill(id);
    if (!this.skill.ranged) {
        if (action.isValid()) {
            a.useItem(action.item());
        }
        else return;
    }
    action.applyGlobal();
    action.apply(b);

    this.hitAnimation(action, a, b);
};

ABS_Battle.prototype.hitAnimation = function(action, a, b) {
    var target = this.character(b);
    var id = action.item().animationId;
    id = (id === -1) ? a.attackAnimation() : id;
    target.requestAnimation(id);
    this.waitAnimation(target,
        b.startDamagePopup.bind(b)
    );
};

ABS_Battle.prototype.aftermath = function() {
    ABS.aftermath.call(this);
};

ABS_Battle.prototype.actorDied = function() {
    this.log(ABS.LOG.actor_died);
    this.waitAnimation(this._actor,
        ABS.actorDied.bind(this)
    );

};

ABS_Battle.prototype.enemyDied = function() {
    this.log(ABS.LOG.enemy_died);
    this.waitAnimation(this._enemy,
        ABS.enemyDied.bind(this)
    );
};

ABS_Battle.prototype.gainRewards = function() {
    ABS.gainRewards.call(this);
};

ABS_Battle.prototype.victory = function() {
    this.log(ABS.LOG.victory);
    this.waitAnimation(this._enemy,
        ABS.victory.bind(this)
    );
};


ABS_Battle.prototype.checkClear = function() {
    if (this.enemies === 0 && !ABS._cleared) {
        ABS._cleared = true;
        ABS.cleared();
    }
};

ABS_Battle.prototype.waitAnimation = function _wait(e, callback) {
    if (e.isAnimationPlaying()) {
        c = setTimeout(_wait.bind(this), 200, e, callback);
    } else {
        callback(e);
    }
};

ABS_Battle.prototype.fetchLoot = function() {
    var loot = this.pickLoot();
    this.log(ABS.LOG.loot_found, loot);
    this.dropLoot(loot);
};

ABS_Battle.prototype.dropLoot = function(loot) {
    var e = this._enemy;
    if (loot === 'nothing') {
        return $gameMap.eraseEvent(e._eventId);
    }

    var eventId = $gameMap.addEvent(
        ABS.LOOT[loot].mapId,
        ABS.LOOT[loot].eventId,
        e.x, e.y
    );
};

ABS_Battle.prototype.pickLoot = function() {
    var loot = {};
    var total = 0;

    var key, index;
    for (key in ABS.LOOT) {
        var weight = ABS.LOOT[key].weight;
        loot[key] = weight;
        total += weight;
    }

    index = Math.floor(Math.random() * total) + 1;
    total = 0;

    for (key in loot) {
        total += loot[key];
        if (index <= total) break;
    }
    return key;
};

ABS_Battle.prototype.engageEnemy = function() {
    this._enemy._locked = false;
    this._enemy.turnTowardPlayer();
};

ABS_Battle.prototype.shiftActors = function() {
    var actors = this.party._actors;
    actors.push(actors.shift());
    this._actor.refresh();
};

ABS_Battle.prototype.character = function(battler) {
    return (battler == this.actor) ? this._actor : this._enemy;
};

ABS_Battle.prototype.start = function() {
    this._start = performance.now();
};

Object.defineProperties(ABS_Battle.prototype, {
    _actor:   { get: function() { return $gamePlayer; }},
    _enemy:   { get: function() { return $gameMap.event(this.id); }},
    actor:    { get: function() { return this._actor.battler(); }},
    enemy:    { get: function() { return this._enemy.battler(); }},
    party:    { get: function() { return $gameParty; }},
    troop:    { get: function() { return $gameTroop; }},
    delta:    { get: function() { return performance.now() - this._start; }},
    enemies:  { get: function() { return this.troop.aliveMembers().length; }},
    goldRate: { get: function() { return $gameParty.hasGoldDouble() ? 2 : 1; }},
});

//=============================================================================
// Scene_Map - From YEP_ButtonCommonEvents
//=============================================================================
Scene_Map.prototype.updateButtonEvents = function() {
    for (var key in Yanfly.Param.BCEList) {
        var id = Yanfly.Param.BCEList[key];
        if (id <= 0) continue;
        if (!Input.isRepeated(key)) continue;
        ABS.buttonEvent(id);
        break;
    }
};
