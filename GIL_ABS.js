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

abs.start = function() {
    abs._start = performance.now();
};

abs.delta = function() {
    return performance.now() - abs._start;
};

abs.valid = function() {
    abs._id = this._eventId;
    if (!abs._id) return false;

    var actorInvalid = !(abs._actor && abs.actor);
    var enemyInvalid = !(abs._enemy && abs.enemy);
    if (actorInvalid || enemyInvalid) return false;

    if (abs.enemy.hp === 0) return false;

    return true;
};

abs.battle = function() {
    if (abs.delta() < GIL.abs.attackDelay) return;
    if (!abs.valid.call(this)) return;

    abs.start();
    abs.engageEnemy();
    // Charge attack
    abs.takeAction(1, abs.actor, abs.enemy);
    abs.actor.performAttack();
    abs.takeAction(1, abs.enemy, abs.actor);
    abs.aftermath();
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
    abs._enemy.requestAnimation(117);
    abs._enemy.setOpacity(0);
    abs.gainRewards();
    abs.fetchLoot();
};

abs.gainRewards = function() {
    var exp   = abs.enemy.exp();
    var gold  = abs.enemy.gold() * abs.goldRate;
    var items = abs.enemy.makeDropItems();

    abs.actor.gainExp(exp);
    abs.party.gainGold(gold);
    abs.party.gainItems(items);
};

abs.fetchLoot = function() {
    var loot = abs.pickLoot();
    abs.log('found', loot);
    abs.dropLoot(loot, abs._enemy);
};

abs.dropLoot = function _dropLoot(loot, e) {
    if (e.isAnimationPlaying()) {
        return setTimeout(_dropLoot, 200, loot, e);
    }

    if (loot === 'nothing') return abs.eraseEnemy();

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

abs.eraseEnemy = function() {
    $gameMap.eraseEvent(abs._id);
};

abs.shiftActors = function() {
    var actors = abs.party._actors;
    actors.push(actors.shift());
    abs._actor.refresh();
};

abs.takeAction = function(id, a, b) {
    var action = new Game_Action(a);
    action.setSkill(id);
    a.useItem(action.item());
    action.applyGlobal();
    action.apply(b);
    b.startDamagePopup();
    var animationId = action.item().animationId;
    if (animationId === -1) animationId = a.attackAnimation();
    abs.target(b).requestAnimation(animationId);
};

abs.target = function(battler) {
    if (battler === abs.actor) return abs._actor;
    if (battler === abs.enemy) return abs._enemy;
};

Object.defineProperties(abs, {
    _actor: { get: function() { return $gamePlayer; }},
    _enemy: { get: function() { return $gameMap.event(abs._id); }},
    actor:  { get: function() { return abs._actor.battler(); }},
    enemy:  { get: function() { return abs._enemy.battler(); }},
    party:  { get: function() { return $gameParty; }},
    goldRate: { get: function() { return $gameParty.hasGoldDouble() ? 2 : 1; }},
});
