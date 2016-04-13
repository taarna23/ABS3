/*:
 * @plugindesc v1.02 Event Enemy
 * @author Gilgamar
 * @license MIT
 *
 * @param Troop Offset
 * @desc Offset for map-based Game_Troop
 * Default 100
 * @default 100
 *
 */

GIL.configure('EventEnemy');
//=============================================================================
// Game_Map
//=============================================================================
Object.defineProperties(Game_Map.prototype, {
    troopId: { get: function() {
        return this._mapId + GIL.Param.EventEnemy_TroopOffset;
    }},
});

// Replacement method
Game_Map.prototype.setupEvents = function() {
    this._events = [];
    this.newTroop();

    for (var i = 0; i < $dataMap.events.length; i++) {
        if ($dataMap.events[i]) {
            this._events[i] = new Game_Event(this._mapId, i);

            var enemyId = this.checkForEnemyId(i);
            if (enemyId) {
                this._events[i]._enemyId = enemyId;
                this.newTroopMember(i, enemyId);
            }
        }
    }
    this._commonEvents = this.parallelCommonEvents().map(function(commonEvent) {
        return new Game_CommonEvent(commonEvent.id);
    });
    this.saveTroop();
    this.refreshTileEvents();
};

Game_Map.prototype.saveTroop = function() {
    $gameTroop.setup(this.troopId);
    this.dataTroop = $dataTroops[this.troopId];
    this.troop = $gameTroop;
};

Game_Map.prototype.loadTroop = function() {
    $dataTroops[this.troopId] = this.dataTroop;
    $gameTroop = this.troop;
};

Game_Map.prototype.checkForEnemyId = function(eventId) {
    var name = $dataMap.events[eventId].name;
    for (var i = 1; i < $dataEnemies.length; i++) {
        var enemy = $dataEnemies[i];
        if (name === enemy.name) return enemy.id;
    }
};

Game_Map.prototype.newTroop = function() {
    var troop = {};
    troop.id = this.troopId;
    troop.name = $dataMap.displayName;
    troop.members = [];
    troop.pages = [{}];
    $dataTroops[this.troopId] = troop;
};

Game_Map.prototype.newTroopMember = function(eventId, enemyId) {
    var member = {};
    member.eventId = eventId;
    member.enemyId = enemyId;
    member.x = 0;
    member.y = 0;
    member.hidden = false;

    var troop = $dataTroops[this.troopId];
    troop.members.push(member);
};

//=============================================================================
// Scene_Map
//=============================================================================
// Replacement method
Scene_Map.prototype.isReady = function() {
    if (!this._mapLoaded && DataManager.isMapLoaded()) {
        this.onMapLoaded();
        $gameMap.loadTroop();
        this._mapLoaded = true;
    }
    return this._mapLoaded && Scene_Base.prototype.isReady.call(this);
};

//=============================================================================
// Game_Troop
//=============================================================================
Game_Troop.prototype.member = function(eventId, result) {
    if (this._troopId < 1)  return;
    this.troop().members.some(function(member, i) {
        if (member.eventId === eventId) {
            return ((result = this._enemies[i]), true);
        }
    }, this);
    return result;
};

//=============================================================================
// Game_Party
//=============================================================================
Game_Party.prototype.gainItems = function(items) {
    items.forEach(function(item) {
        this.gainItem(item, 1);
    }, this);
};

//=============================================================================
// Game_Battler
//=============================================================================
Game_Battler.prototype.attackAnimation = function() {
    if (this.isActor()) return this.attackAnimationId1();
    else                return this._attackAnimation || 1;
};

Game_Battler.prototype.setAttackAnimation = function(attackAnimation) {
    this._attackAnimation = attackAnimation;
};

Game_Battler.prototype.clearResult = function() {
    var scene = SceneManager._scene;
    if (scene.constructor != Scene_Map) this._result.clear();
};

Game_Battler.prototype.performAttack = function() {};

//=============================================================================
// Game_Character
//=============================================================================
Game_Character.prototype.isPlayer = function() {
    return this == $gamePlayer;
};

Game_Character.prototype.isEnemy = function() {
    return !!this._enemyId;
};

Game_Character.prototype.battler = function() {
    if (this.isPlayer())  return $gameParty.leader();
    if (this.isEnemy())   return $gameTroop.member(this._eventId);
};

Game_Character.prototype.isBattler = function() {
    return !!this.battler();
};

//=============================================================================
// Sprite_Character
//=============================================================================
Sprite_Character.prototype.isPlayer = function() {
    return this._character.isPlayer();
};

Sprite_Character.prototype.isEnemy = function() {
    return this._character.isEnemy();
};

Object.defineProperties(Sprite_Character.prototype, {
    _battler: { get: function() { return this._character.battler(); }},
});
