/*:
 * @plugindesc v1.01 Character motions
 * @author Gilgamar
 * @license MIT
 *
 */

//=============================================================================
// Configure script
//=============================================================================
GIL.configure('CharMotion');

GIL.CharMotion.motionSpeed = 5;

//=============================================================================
// Game_Battler
//=============================================================================
Game_Battler.prototype.isMotionPlaying = function() {
    return this._motionPlaying;
};

//=============================================================================
// Sprite_Character
//=============================================================================
GIL.CharMotion.alias('Sprite_Character.prototype.initialize');
Sprite_Character.prototype.initialize = function(character) {
    GIL.CharMotion.aliasCall('Sprite_Character.prototype.initialize', this, [character]);
    this.initMotion();
};

Sprite_Character.prototype.initMotion = function() {
    if (this.isPlayer()) {
        this._motion = null;
        this._motionCount = 0;
        this._pattern = 0;
        this._motionSprite = null;
        this._motionBitmap = null;
    }
};

Sprite_Character.prototype.loadMotionBitmap = function(motionType) {
    var filename = this._characterName + '_' + motionType;
    var folder = 'img/characters/';
    if (GIL.fileExists(folder, filename, '.png')) return ImageManager.loadCharacter(filename);
};

GIL.CharMotion.alias('Sprite_Character.prototype.update');
Sprite_Character.prototype.update = function() {
    GIL.CharMotion.aliasCall('Sprite_Character.prototype.update', this);
    if (this.isPlayer()) {
        this.updateMotion();
        this.updateMotionFrame();
    }
};

Sprite_Character.prototype.updateMotion = function() {
    this.setupMotion();
    // this.setupWeaponAnimation();
    if (this._battler.isMotionRefreshRequested()) {
        this.refreshMotion();
        this._battler.clearMotion();
    }
    this.updateMotionCount();
};

Sprite_Character.prototype.setupMotion = function() {
    if (this._battler.isMotionRequested()) {
        var motionType = this._battler.motionType();
        if (motionType == 'clear')  return (this._motion = null);
        this._battler.clearMotion();
        this._motionBitmap = this.loadMotionBitmap(motionType);
        this.startMotion(motionType);
    }
};

Sprite_Character.prototype.startMotion = function(motionType) {
    var newMotion = Sprite_Actor.MOTIONS[motionType];
    if (this._motion !== newMotion) {
        this._motion = newMotion;
        this._motionCount = 0;
        this._pattern = 0;
        this._battler._motionPlaying = true;
    }
};

Sprite_Character.prototype.updateMotionCount = function() {
    if (this._motion && ++this._motionCount >= this.motionSpeed()) {
        if (this._motion.loop) {
            this._pattern = (this._pattern + 1) % this.motionFrames();
            // console.log(this._pattern);
        } else if (this._pattern < this.motionFrames() - 1) {
            this._pattern++;
            // console.log(this._pattern);
        } else {
            this.refreshMotion();
            this._battler.clearMotion();
        }
        this._motionCount = 0;
    }
};

Sprite_Character.prototype.motionFrames = function() {
    var bitmap = this._motionBitmap;
    if (bitmap) return bitmap.width / (bitmap.height / 4);
};

Sprite_Character.prototype.refreshMotion = function() {
    var motionType = this._battler.motionType();
    this.startMotion(motionType);
};

Sprite_Character.prototype.motionSpeed = function() {
    return GIL.CharMotion.motionSpeed;
};

Sprite_Character.prototype.updateMotionFrame = function() {
    this.updateMotionSprite();
    var bitmap = this._motionBitmap;
    if (bitmap) {
        // var motionIndex = this._motion ? this._motion.index : 0;
        var pattern = this._pattern;
        var ch = bitmap.height / 4;
        var cw = ch;
        var cx = pattern;
        var cy = this.characterPatternY();
        this._motionSprite.setFrame(cx * cw, cy * ch, cw, ch);
    }
};

Sprite_Character.prototype.updateMotionSprite = function() {
    if (this._motion) {
        this.createMotionSprite();
        this.visible = false;
        this._motionSprite.bitmap = this._motionBitmap;
        this._motionSprite.visible = true;
        this._motionSprite.x = this.x;
        this._motionSprite.z = this.z;
        this._motionSprite.y = this.y;
    } else if (this._motionSprite) {
        this.visible = true;
        this._motionSprite.visible = false;
        this._battler._motionPlaying = false;
    }
};

Sprite_Character.prototype.createMotionSprite = function() {
    if (!this._motionSprite) {
        this._motionSprite = new Sprite();
        this._motionSprite.anchor.x = 0.5;
        this._motionSprite.anchor.y = 1;
        this.parent.addChild(this._motionSprite);
    }
};

GIL.CharMotion.alias('Sprite_Animation.prototype.updateCellSprite');
Sprite_Animation.prototype.updateCellSprite = function(sprite, cell) {
    GIL.CharMotion.aliasCall('Sprite_Animation.prototype.updateCellSprite', this, [sprite, cell]);
    var pattern = cell[0];
    if (pattern >= 0) {
        var target = this._target;
        var motionSprite = target._motionSprite || {};
        sprite.visible = target.visible || motionSprite.visible;    // Gilgamar 2016.04.06
    } else {
        sprite.visible = false;
    }
};
