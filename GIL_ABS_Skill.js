/*:
 * @plugindesc v1.00 Action Battle System Skill
 * @author Gilgamar
 * @license MIT
 *
 */

//-----------------------------------------------------------------------------
// ABS Skill
//
// A skill template for ABS.

function ABS_Skill() {
    this.initialize.apply(this, arguments);
}

// ABS_Skill.log = console.log.bind(console);
ABS_Skill.prototype.log = function() {};

ABS_Skill.prototype.constructor = ABS_Skill;
ABS_Skill.prototype.initialize = function(params, subject) {
    this.id         = params.id;
    this.ranged     = params.ranged;
    this.castDelay  = params.castDelay;
    this.subject    = subject || $gamePlayer;
    this.battler    = this.subject.battler();
    this._moveSpeed = this.subject._moveSpeed;
};

ABS_Skill.prototype.valid = function() {
    return !this.battler.isMotionPlaying() && !this.subject.isMoving();

};

ABS_Skill.prototype.setupProjectile = function(settings) {
    this._projectileSettings = settings;
};

ABS_Skill.prototype.projectileSettings = function() {
    return this._projectileSettings;
};

ABS_Skill.prototype.callback = function(charge, fire, hit) {
    this._charge = charge;
    this._fire = fire;
    this._hit = hit;
};

ABS_Skill.prototype.charge = function() {
    var a = this.battler;
    var action = new Game_Action(a);
    action.setSkill(this.id);
    if (action.isValid()) {
        this.log(ABS.LOG.charge);
        a.useItem(action.item());
        this.subject._moveSpeed = -Infinity;
        this.subject._directionFix = true;
        this._charge.call(this);
    }
};

ABS_Skill.prototype.release = function() {
    var fire = this.fire;
    setTimeout(fire.bind(this), this.castDelay);
};

ABS_Skill.prototype.fire = function() {
    this.log(ABS.LOG.fire);
    this.battler.requestMotion('clear');
    this.subject._directionFix = false;
    this.subject._moveSpeed = this._moveSpeed;

    var settings = this.projectileSettings();
    if (settings) {
        this.projectile = new Projectile(settings);
        this.projectile.hit = this.hit.bind(this);
    }

    this._fire.call(this);
};

ABS_Skill.prototype.hit = function(target) {
    this.log(ABS.LOG.hit);
    this._eventId = target._eventId;
    this._hit.call(this);
};
