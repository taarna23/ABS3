/*:
 * @plugindesc v1.03 Game settings
 * @author Gilgamar
 * @license MIT
 *
 * @param Open Console
 * @desc Start game with debug console open?
 * @default false
 *
 * @param Full Screen
 * @desc Start game full screen?
 * @default false
 *
 * @param Optimize Speed
 * @desc Optimize canvas render speed?
 * @default true
 *
 * @param Hide Cursor
 * @desc Hide system cursor?
 * @default false
 *
 * @param Disable Cursor
 * @desc Disable system cursor?
 * @default false
 *
 * @param Mute Volume
 * @desc Mute all sound?
 * @default false
 *
 * @param Skip Title
 * @desc Skip title screen?
 * @default false
 *
 * @param No Title BGM Fade
 * @desc Disable title music fade?
 * @default false
 *
 * @param Pixelate
 * @desc Set pixel size for filter. Set 0 to disable.
 * @default 0
 *
 * @param Add Fonts
 * @desc Enter font names from gamefont.css separated by commas.
 * @default
 *
 * @param Title Font
 * @desc Change title font?
 * Default GameFont
 * @default GameFont
 *
 * @param Option Command Code
 * @desc Enter format code for Window_Options command.
 * @default
 *
 * @param Option Percent Code
 * @desc Enter format code for Window_Options percent.
 * @default
 *
 * @param Option Status Code
 * @desc Enter format code for Window_Options status.
 * @default
 *
 */

// NOTE: Disable cursor does not disable Yanfly hover effects
GIL.configure('Setup');

//=============================================================================
// Open Console
//=============================================================================
GIL.Setup.alias('SceneManager.run');
SceneManager.run = function(sceneClass) {
    GIL.Setup.aliasCall('SceneManager.run', this, [sceneClass]);
    if (GIL.Param.Setup_OpenConsole) this.openConsole();
};

SceneManager.openConsole = function() {
    if (Utils.isNwjs() && Utils.isOptionValid('test')) {
      var _debugWindow = require('nw.gui').Window.get().showDevTools();
      _debugWindow.moveTo(0, 0);
      window.focus();
    }
};

//=============================================================================
// Full Screen | Hide Cursor | Disable Cursor | Mute Volume | Skip Title
//=============================================================================
GIL.Setup.alias('Scene_Boot.prototype.start');
Scene_Boot.prototype.start = function() {
    // console.log(GIL.Param);
    if (GIL.Param.Setup_FullScreen)         Graphics._switchFullScreen();
    if (GIL.Param.Setup_OptimizeSpeed)      Graphics._canvas.style.imageRendering = "optimizeSpeed";
    if (GIL.Param.Setup_HideCursor)         document.body.style.cursor = 'none';
    if (GIL.Param.Setup_DisableCursor)      TouchInput.update = function() {};
    if (GIL.Param.Setup_MuteVolume)         this.muteVolume();
    if (GIL.Param.Setup_SkipTitle)          this.skipTitle();
    else                                    GIL.Setup.aliasCall('Scene_Boot.prototype.start', this);
};

//=============================================================================
// Mute Volume
//=============================================================================
Scene_Boot.prototype.muteVolume = function() {
    console.log('Mute Volume');
    ConfigManager.bgmVolume = 0;
    ConfigManager.bgsVolume = 0;
    ConfigManager.meVolume = 0;
    ConfigManager.seVolume = 0;
};

//=============================================================================
// Skip Title
//=============================================================================
Scene_Boot.prototype.skipTitle = function() {
    Scene_Base.prototype.start.call(this);
    SoundManager.preloadImportantSounds();
    if (DataManager.isBattleTest()) {
        DataManager.setupBattleTest();
        SceneManager.goto(Scene_Battle);
    } else if (DataManager.isEventTest()) {
        DataManager.setupEventTest();
        SceneManager.goto(Scene_Map);
    } else {
        this.checkPlayerLocation();
        DataManager.setupNewGame();
        // SceneManager.goto(Scene_Title);
        // Window_TitleCommand.initCommandPosition();
        SceneManager.goto(Scene_Map);
    }
    this.updateDocumentTitle();
};

//=============================================================================
// No Title BGM Fade
//=============================================================================
GIL.Setup.alias('Scene_Title.prototype.commandNewGame');
Scene_Title.prototype.commandNewGame = function() {
    if (GIL.Param.Setup_NoTitleBGMFade) {
        DataManager.setupNewGame();
        this._commandWindow.close();
        //this.fadeOutAll();
        SceneManager.goto(Scene_Map);
    } else {
        GIL.Setup.aliasCall('Scene_Title.prototype.commandNewGame', this);
    }
};

//=============================================================================
// Pixelate (not compatible with Terrax Lighting)
//=============================================================================
GIL.Setup.alias('Scene_Map.prototype.initialize');
Scene_Map.prototype.initialize = function() {
    GIL.Setup.aliasCall('Scene_Map.prototype.initialize', this);
    if (GIL.Param.Setup_Pixelate) {
        this.pixelateFilter = new PIXI.PixelateFilter();
        this.pixelateFilter.size.x = GIL.Param.Setup_Pixelate;
        this.pixelateFilter.size.y = GIL.Param.Setup_Pixelate;
    }
};

GIL.Setup.alias('Scene_Map.prototype.update');
Scene_Map.prototype.update = function() {
    GIL.Setup.aliasCall('Scene_Map.prototype.update', this);
    if (GIL.Param.Setup_Pixelate) this.children[0].filters = [this.pixelateFilter];
};

//=============================================================================
// Add Fonts
//=============================================================================
GIL.Setup.alias('Graphics._createGameFontLoader');
Graphics._createGameFontLoader = function() {
    GIL.Setup.aliasCall('Graphics._createGameFontLoader', this);

    var fonts = GIL.Param.Setup_AddFonts.split(',').map(function(v) {return v.trim();});
    for (var i = 0; i < fonts.length; i++) {
        var font = fonts[i];
        // console.log(font);
        this._createFontLoader(font);
    }
};

//=============================================================================
// Change Title Font
//=============================================================================
GIL.Setup.alias('Scene_Title.prototype.drawGameTitle');
Scene_Title.prototype.drawGameTitle = function() {
    this._gameTitleSprite.bitmap.fontFace = GIL.Param.Setup_TitleFont;
    GIL.Setup.aliasCall('Scene_Title.prototype.drawGameTitle', this);
};

//=============================================================================
// Option Window Formatting
//=============================================================================
GIL.Setup.alias('Window_Options.prototype.drawItem');
Window_Options.prototype.drawItem = function(index) {
    var commandCode = GIL.Param.Setup_OptionCommandCode;
    var statusCode  = GIL.Param.Setup_OptionStatusCode;
    var percentCode = GIL.Param.Setup_OptionPercentCode;

    if (commandCode === '' && statusCode === '' && percentCode === '') {
        return GIL.Setup.aliasCall('Window_Options.prototype.drawItem', this, [index]);
    }

    var code = this.statusText(index).contains('%') ? percentCode : statusCode;
    var rect = this.itemRectForText(index);
    var statusWidth = this.statusWidth();
    var titleWidth = rect.width - statusWidth;
    this.resetTextColor();
    this.changePaintOpacity(this.isCommandEnabled(index));
    this.drawText(commandCode + this.commandName(index), rect.x, rect.y, titleWidth, 'left');
    this.drawText(code + this.statusText(index), titleWidth, rect.y, statusWidth, 'right');
};
