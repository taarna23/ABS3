/*:
 * @plugindesc v1.07 Action Battle System
 * @author Gilgamar
 * @license MIT
 *
 */

GIL.configure('ABS');

function ABS() {}
ABS.log = console.log.bind(console);

ABS.LOG = {
    // Battle Log
    actor_died: 'player died',
    enemy_died: 'enemy died',
    loot_found: 'found',
    victory:    'victory',

    // Skill Log
    charge:     'charging',
    fire:       'firing',
    hit:        'impact',
};

ABS.LOOT = {
    heart:   {mapId: 1, eventId: 1, weight: 15},
    gem:     {mapId: 1, eventId: 2, weight:  5},
    nothing: {mapId: 0, eventId: 0, weight: 10},
};

ABS.attackDelay = function() {
    return 400;
};
ABS.deathAnimation = function() {
    return 117; // Light Pillar 1
};
ABS.clearAnimation = function() {
    return 99;  // Light All 2
};

//=============================================================================
// Assign Skills
//=============================================================================
ABS.buttonEvent = function(id) {
    if (id === 1) ABS.fireball();
};

//=============================================================================
// Define Skills
//=============================================================================
ABS.fireball = function(subject) {
    //-----------------------------------------------------------------------------
    // Setup
    //
    var s = new ABS_Skill({
        id: 9,
        ranged: true,
        castDelay: 700,     // Incantantion time
    }, subject);

    s.setupProjectile({
        delay: 400,         // Firing delay
        mapId: 1,           // Source mapId
        eventId: 4,         // Source eventId
    });

    if (!s.valid()) return;

    //-----------------------------------------------------------------------------
    // Customize
    //
    function charge() {
        this.battler.requestMotion('chant');
        this.release();
    }

    function fire() {

    }

    function hit() {
        ABS.battle.call(this);
    }

    //-----------------------------------------------------------------------------
    // Activate
    //
    s.callback(charge, fire, hit);
    s.charge();
};

//=============================================================================
// START of Battle Routine
//=============================================================================
ABS.battle = function(obj) {
    var battle = new ABS_Battle(this, obj);
    if (!battle._valid) return;

    battle.start();
    battle.engageEnemy();
    battle.actorAttack();
    battle.enemyAttack();
    battle.aftermath();
};

ABS.aftermath = function() {
    if (this.actor.hp === 0) {
        this.actorDied();
    }
    if (this.enemy.hp === 0) {
        this.enemyDied();
    }
};

ABS.actorDied = function() {
    // Script player death here; i.e. collapse animation, lose gold, ...
    this.shiftActors();
};

ABS.enemyDied = function() {
    // Script enemy death here; i.e. death animation, drop item, gold, xp, ...
    this._enemy.setOpacity(0);
    this._enemy._moveType = 0;
    this._enemy.requestAnimation(ABS.deathAnimation());

    this.gainRewards();
    this.victory();
};

ABS.gainRewards = function() {
    var exp   = this.enemy.exp();
    var gold  = this.enemy.gold() * this.goldRate;
    var items = this.enemy.makeDropItems();

    this.actor.gainExp(exp);
    this.party.gainGold(gold);
    this.party.gainItems(items);
};

ABS.victory = function() {
    this.checkClear();
    this.fetchLoot();
};

ABS.cleared = function() {
    var x = Graphics._width / 48;
    var y = Graphics._height / 48;
    var eventId = $gameMap.addEvent(0, 0, x, y);
    var e = $gameMap.event(eventId);
    e.requestAnimation(ABS.clearAnimation());
};
