/*:
 * @plugindesc v1.07 Action Battle System
 * @author Gilgamar
 * @license MIT
 *
 */

GIL.configure('abs');

GIL.abs.attackDelay = 400;

function abs() {}
abs.log = console.log.bind(console);

abs._loot = {
    heart:   {mapId: 1, eventId: 1, weight: 15},
    gem:     {mapId: 1, eventId: 2, weight:  5},
    nothing: {mapId: 0, eventId: 0, weight: 10},
};

//=============================================================================
// START of Battle Routine
//=============================================================================
abs.start = function() {
    abs._start = performance.now();
};

abs.delta = function() {
    return performance.now() - abs._start;
};

abs.buttonEvent = function(id) {
    if (id === 1) abs.fireball();
};

abs.fireball = function() {
    if (abs.actor._motionPlaying) return;

    var skillId = 9;
    var charge = 1000;

    abs.log('charging');
    abs.actor.requestMotion('chant');

    setTimeout(function(s) {
        abs.log('firing');
        abs.actor.requestMotion('wait');

        var projectile = new Projectile({mapId: 1, eventId: 4, delay: 400});

        projectile.hit = function(e) {
            abs.battle.call(e, s);
        };

    }, charge, skillId);
};

abs.valid = function(eventId) {
    abs._id = eventId;

    var valid = (function() {
        if (abs.delta() < GIL.abs.attackDelay)          return false;
        if (!abs._id)                                   return false;
        if (!abs._actor || !abs.actor)                  return false;
        if (!abs._enemy || !abs.enemy)                  return false;
        if (abs.enemy.hp === 0)                         return false;
        return true;
    }) ();

    if (!valid) {
        abs._id = undefined;
        return false;
    }
    return true;
};

abs.battle = function(skillId) {
    if (!abs.valid(this._eventId)) return;

    // For now think of !skillId as MELEE as this is how we handle MELEE attack
    if (!skillId && abs.actor.isMotionPlaying())   return;

    abs.start();
    abs.engageEnemy();
    abs.takeAction(skillId, abs.actor, abs.enemy);

    if (!skillId) {
        abs.takeAction(1, abs.enemy, abs.actor);
    }
    abs.aftermath();
};

abs.takeAction = function(id, a, b) {
    var subject = abs.character(a);
    var target  = abs.character(b);
    var action  = new Game_Action(a);

    id = id || 1;

    if (id === 1 && typeof a.performAttack == 'function') {
        a.performAttack();
    }

    action.setSkill(id);
    a.useItem(action.item());
    action.applyGlobal();
    action.apply(b);
    b.startDamagePopup();

    var animationId = action.item().animationId;
    if (animationId === -1) {
        animationId = a.attackAnimation();
    }
    target.requestAnimation(animationId);
};

abs.aftermath = function() {
    if (abs.actor.hp === 0) {
        abs.log('player died');
        abs.shiftActors();
    }
    if (abs.enemy.hp === 0) {
        abs.log('enemy died');
        abs.victory();
    }
};

abs.victory = function() {
    var e = abs._enemy;
    abs.gainRewards();
    abs.waitAnimation(e, abs.finish.bind(e));
};

abs.finish = function(e) {
    abs.enemyDeath(e);
    abs.waitAnimation(e, abs.fetchLoot.bind(e));
};

//=============================================================================
// END of Battle Routine
//=============================================================================
abs.gainRewards = function() {
    var exp   = abs.enemy.exp();
    var gold  = abs.enemy.gold() * abs.goldRate;
    var items = abs.enemy.makeDropItems();

    abs.actor.gainExp(exp);
    abs.party.gainGold(gold);
    abs.party.gainItems(items);
};

abs.enemyDeath = function(e) {
    e.requestAnimation(117);
    e.setOpacity(0);
    e._moveType = 0;
};

abs.fetchLoot = function(e) {
    var loot = abs.pickLoot();
    abs.log('found', loot);
    abs.dropLoot(e, loot);
};

abs.waitAnimation = function _wait(e, callback) {
    if (e.isAnimationPlaying()) {
        return setTimeout(_wait.bind(this), 200, e, callback);
    }
    callback(e);
};

abs.dropLoot = function(e, loot) {
    if (loot === 'nothing') {
        return $gameMap.eraseEvent(e._eventId);
    }

    var eventId = $gameMap.addEvent(
        abs._loot[loot].mapId,
        abs._loot[loot].eventId,
        e.x, e.y
    );
};

abs.pickLoot = function() {
    var loot = {};
    var total = 0;

    var key, index;
    for (key in abs._loot) {
        var weight = abs._loot[key].weight;
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

abs.engageEnemy = function() {
    abs._enemy._locked = false;
    abs._enemy.turnTowardPlayer();
};

abs.shiftActors = function() {
    var actors = abs.party._actors;
    actors.push(actors.shift());
    abs._actor.refresh();
};

abs.character = function(battler) {
    return (battler == abs.actor) ? abs._actor : abs._enemy;
};

Object.defineProperties(abs, {
    _actor: { get: function() { return $gamePlayer; }},
    _enemy: { get: function() { return $gameMap.event(abs._id); }},
    actor:  { get: function() { return abs._actor.battler(); }},
    enemy:  { get: function() { return abs._enemy.battler(); }},
    party:  { get: function() { return $gameParty; }},
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
        abs.buttonEvent(id);
        break;
    }
};
