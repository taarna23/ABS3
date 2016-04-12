/*:
 * @plugindesc v1.01 Overlay
 * @author Gilgamar
 * @license MIT
 *
 * @param Unit Total
 * @desc Default 10
 * @default 10
 *
 * @param Unit Size
 * @desc Default 24
 * @default 24
 *
 * @param Unit AnchorX
 * @desc Default 0
 * @default 0
 *
 * @param Unit AnchorY
 * @desc Default 0
 * @default 0
 *
 * @param Unit ScaleX
 * @desc Default 0.5
 * @default 0.5
 *
 * @param Unit ScaleY
 * @desc Default 0.5
 * @default 0.5
 *
 * @param HUD Line1
 * @default Level: a.level
 *
 * @param HUD Line2
 * @default HP: a.hp/a.mhp
 *
 * @param HUD: Line3
 * @default MP: a.mp/a.mmp
 *
 * @param HUD: Line4
 * @default XP: a.xp/a.nxp
 *
 */

GIL.configure('Overlay');

GIL.Overlay.Unit = {
    total:      GIL.Param.Overlay_UnitTotal,
    size:       GIL.Param.Overlay_UnitSize,
    anchorX:    GIL.Param.Overlay_UnitAnchorX,
    anchorY:    GIL.Param.Overlay_UnitAnchorY,
    scaleX:     GIL.Param.Overlay_UnitScaleX,
    scaleY:     GIL.Param.Overlay_UnitScaleY,
};

//-----------------------------------------------------------------------------
// Overlay
//
// Manages game overlay.

function Overlay() {
    this.initialize.apply(this, arguments);
}

Overlay.prototype = Object.create(Sprite.prototype);
Overlay.prototype.constructor = Overlay;

Overlay.prototype.initialize = function() {
    Sprite.prototype.initialize.call(this);
    this.width  = Graphics.width;
    this.height = Graphics.height;

    this._status = null;
    this._health = null;
    this._hotkey = null;

    this.createDisplayObjects();
};

Overlay.prototype.actor = function() {
    return $gameParty.leader();
};


Overlay.prototype.createDisplayObjects = function() {
    this.createStatusContainer();
    this.createHealthContainer();
    this.createHotkeyContainer();
};

Overlay.prototype.createStatusContainer = function() {
    this._status = new Sprite_Status();
    this.addChild(this._status);
};

Overlay.prototype.createHealthContainer = function() {
    this._health = new Sprite_Health();
    this.addChild(this._health);
};

Overlay.prototype.createHotkeyContainer = function() {
    this._hotkey = new Sprite();
};

Overlay.prototype.update = function() {
    this._status.update();
    this._health.update();
};

//-----------------------------------------------------------------------------
// Sprite_Health
//
// The sprite class for health container.

function Sprite_Health() {
    this.initialize.apply(this, arguments);
}

Sprite_Health.prototype = Object.create(Sprite.prototype);
Sprite_Health.prototype.constructor = Sprite_Health;

Sprite_Health.prototype.initialize = function() {
    Sprite.prototype.initialize.call(this);
    this.unit = GIL.Overlay.Unit;
    this.width  = this.unit.size * this.unit.total;
    this.height = this.unit.size * 2;
    this.x = 0;
    this.y = 0;

    this._bitmap = ImageManager.loadCharacter('Loot');
    this._sprites = [];
};

Sprite_Health.prototype.update = function() {
    this.updateHearts();
    this.updateGems();
};

Sprite_Health.prototype.updateFrame = function(id) {
    var pw = this.bitmap.width / 12;
    var ph = this.bitmap.height / 8;
    var sx = (id < this.unit.total) ? 0 : 1 * pw;
    var sy = 0;
    this._sprites[id].setFrame(sx, sy, pw, ph);
};

Sprite_Health.prototype.updateHearts = function() {
    for (var i = 0; i < this.unit.total; i++) {
        var id = i;
        this._addSprite(id);
        var sprite = this._sprites[id];
        if (this.parent.actor().hearts() > i) {
            sprite.visible = true;
            sprite.x = this.unit.size * i;
        } else if (sprite) {
            sprite.visible = false;
        }
        this.updateFrame(id);
    }
};

Sprite_Health.prototype.updateGems = function() {
    for (var i = 0; i < this.unit.total; i++) {
        var id = i + this.unit.total;
        this._addSprite(id);
        var sprite = this._sprites[id];
        if (this.parent.actor().gems() > i) {
            sprite.visible = true;
            sprite.x = this.unit.size * i;
            sprite.y = this.unit.size;
        } else if (sprite) {
            sprite.visible = false;
        }
        this.updateFrame(id);
    }
};

Sprite_Health.prototype._addSprite = function(id) {
    var sprite = this._sprites[id];
    if (!sprite) {
        sprite = new Sprite(this._bitmap);
        sprite.anchor.x = this.unit.anchorX;
        sprite.anchor.y = this.unit.anchorY;
        sprite.scale.x = this.unit.scaleX;
        sprite.scale.y = this.unit.scaleY;
        this.addChild(sprite);
        this._sprites[id] = sprite;
    }
};

//=============================================================================
// Game_Actor
//=============================================================================
Game_Actor.prototype.hearts = function() {
    var unit = GIL.Overlay.Unit;
    return (this.hp * unit.total) / this.mhp;
};

Game_Actor.prototype.gems = function() {
    var unit = GIL.Overlay.Unit;
    return (this.mp * unit.total) / this.mmp;
};

//-----------------------------------------------------------------------------
// Sprite_Status
//
// The sprite class for status container.

function Sprite_Status() {
    this.initialize.apply(this, arguments);
}

Sprite_Status.prototype = Object.create(Sprite.prototype);
Sprite_Status.prototype.constructor = Sprite_Status;

Sprite_Status.prototype.initialize = function() {
    Sprite.prototype.initialize.call(this);
    this.line = Sprite_Status.LINE;
    this.width  = 120;
    this.height = 120;
    this.x = Graphics.width - this.width;
    this.y = 0;
    this._sprites = [];
};

Sprite_Status.LINE = {
    padding: 10,
    height: 24,
    fontFace: 'GameFont',
    fontSize: 18,
};

Sprite_Status.prototype.update = function() {
    var actor = this.parent.actor();
    var lines = [
        String('Level: ' + actor.level),
        String('HP: ' + actor.hp + '/' + actor.mhp),
        String('MP: ' + actor.mp + '/' + actor.mmp),
        String('XP: ' + actor.currentExp() + '/' + actor.nextLevelExp())
    ];
    lines.forEach(function(text, i) { this.updateLine(i, text); }, this);
};

Sprite_Status.prototype.updateLine = function(index, text) {
    var sprite = this._sprites[index];
    if (!sprite) {
        sprite = new Sprite();
        sprite.width  = this.width  - this.line.padding;
        sprite.height = this.height - this.line.padding;
        sprite.x = this.line.padding >> 1;
        sprite.y = this.line.padding >> 1;
        this._sprites[index] = sprite;
        this.addChild(sprite);
    }
    sprite.bitmap = new Bitmap(sprite.width, sprite.height);

    var x = 0;
    var y = index * this.line.height;
    var maxWidth = this.width - this.line.padding << 1;
    sprite.bitmap.fontFace = this.line.fontFace;
    sprite.bitmap.fontSize = this.line.fontSize;
    sprite.bitmap.drawText(text, x, y, maxWidth, this.line.height);
};

//=============================================================================
// Spriteset_Map
//=============================================================================
GIL.Overlay.alias('Spriteset_Map.prototype.createLowerLayer');
Spriteset_Map.prototype.createLowerLayer = function() {
    GIL.Overlay.aliasCall('Spriteset_Map.prototype.createLowerLayer', this);
    this.createOverlay();
};

GIL.Overlay.alias('Spriteset_Map.prototype.update');
Spriteset_Map.prototype.update = function() {
    GIL.Overlay.aliasCall('Spriteset_Map.prototype.update', this);
    this.updateOverlay();
};

Spriteset_Map.prototype.createOverlay = function() {
    this._overlay = new Overlay();
    this.addChild(this._overlay);
    // console.log(this);
};

Spriteset_Map.prototype.updateOverlay = function() {
    this._overlay.update();
};
