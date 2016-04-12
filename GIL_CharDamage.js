/*:
 * @plugindesc v1.01 Character Damage
 * @author Gilgamar
 * @license MIT
 *
 * @param Player Damage Z
 * @desc Default 5
 * @default 5
 *
 * @param Player Damage Tint
 * @desc Default #ff9900
 * @default #ff9900
 *
 * @param Player Damage ScaleX
 * @desc Default 0.5
 * @default 0.5
 *
 * @param Player Damage ScaleY
 * @desc Default 0.5
 * @default 0.5
 *
 * @param Player Damage OffsetX
 * @desc Default 0
 * @default 0
 *
 * @param Player Damage OffsetY
 * @desc Default 24
 * @default 24
 *
 * @param Enemy Damage Z
 * @desc Default 5
 * @default 5
 *
 * @param Enemy Damage Tint
 * @desc Default #ffffff
 * @default #ffffff
 *
 * @param Enemy Damage ScaleX
 * @desc Default 0.5
 * @default 0.5
 *
 * @param Enemy Damage ScaleY
 * @desc Default 0.5
 * @default 0.5
 *
 * @param Enemy Damage OffsetX
 * @desc Default 0
 * @default 0
 *
 * @param Enemy Damage OffsetY
 * @desc Default 24
 * @default 24
 *
 */

GIL.configure('CharDamage');

//=============================================================================
// DamagePopup
//=============================================================================
GIL.DamagePopup = {};

GIL.DamagePopup.player = {};
GIL.DamagePopup.player.z = Number(GIL.Param.CharDamage_PlayerDamageZ);
GIL.DamagePopup.player.tint = parseInt(GIL.Param.CharDamage_PlayerDamageTint.replace(/^#/, ''), 16);
GIL.DamagePopup.player.scaleX = Number(GIL.Param.CharDamage_PlayerDamageScaleX);
GIL.DamagePopup.player.scaleY = Number(GIL.Param.CharDamage_PlayerDamageScaleY);
GIL.DamagePopup.player.offsetX = Number(GIL.Param.CharDamage_PlayerDamageOffsetX);
GIL.DamagePopup.player.offsetY = Number(GIL.Param.CharDamage_PlayerDamageOffsetY);

GIL.DamagePopup.enemy = {};
GIL.DamagePopup.enemy.z = Number(GIL.Param.CharDamage_EnemyDamageZ);
GIL.DamagePopup.enemy.tint = parseInt(GIL.Param.CharDamage_EnemyDamageTint.replace(/^#/, ''), 16);
GIL.DamagePopup.enemy.scaleX = Number(GIL.Param.CharDamage_EnemyDamageScaleX);
GIL.DamagePopup.enemy.scaleY = Number(GIL.Param.CharDamage_EnemyDamageScaleY);
GIL.DamagePopup.enemy.offsetX = Number(GIL.Param.CharDamage_EnemyDamageOffsetX);
GIL.DamagePopup.enemy.offsetY = Number(GIL.Param.CharDamage_EnemyDamageOffsetY);

//=============================================================================
// Sprite_Character
//=============================================================================
GIL.CharDamage.alias('Sprite_Character.prototype.initMembers');
Sprite_Character.prototype.initMembers = function() {
    GIL.CharDamage.aliasCall('Sprite_Character.prototype.initMembers', this);
    this._damages = [];
};

GIL.CharDamage.alias('Sprite_Character.prototype.update');
Sprite_Character.prototype.update = function() {
    GIL.CharDamage.aliasCall('Sprite_Character.prototype.update', this);
    if (this._battler) {
        this.updateDamagePopup();
    }
};

Sprite_Character.prototype.damagePopup = function() {
    if (this.isPlayer()) return GIL.DamagePopup.player;
    if (this.isEnemy())  return GIL.DamagePopup.enemy;
};

Sprite_Character.prototype.updateDamagePopup = function() {
    this.setupDamagePopup();
    if (this._damages.length > 0) {
        for (var i = 0; i < this._damages.length; i++) {
            this._damages[i].update();
        }
        if (!this._damages[0].isPlaying()) {
            this.parent.removeChild(this._damages[0]);
            this._damages.shift();
        }
    }
};

Sprite_Character.prototype.setupDamagePopup = function() {
    if (!this._battler) return;
    if (this._battler.isDamagePopupRequested()) {
        var sprite = new Sprite_Damage();
        sprite.x = this.x + this.damageOffsetX();
        sprite.y = this.y + this.damageOffsetY();
        sprite.z = this.damagePopup().z;
        sprite.setup(this._battler);
        sprite.children.forEach(function(n) {
            n.tint = this.damagePopup().tint;
            n.scale.x = this.damagePopup().scaleX;
            n.scale.y = this.damagePopup().scaleY;
        }, this);
        this._damages.push(sprite);
        this.parent.addChild(sprite);
        this._battler.clearDamagePopup();
        this._battler._result.clear();
    }
};

Sprite_Character.prototype.damageOffsetX = function() {
    return this.damagePopup().offsetX;
};

Sprite_Character.prototype.damageOffsetY = function() {
    var c = this._character;
    var d = c._direction;

    return (
        this.isPlayer() ? (d === 2 ? -2 :  1) * this.damagePopup().offsetY :
        this.isEnemy()  ? (d === 8 ?  1 : -2) * this.damagePopup().offsetY : 0
    );
};
