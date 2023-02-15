//feel free to change these
var soundName = "customnpcs:default";
var numberOfSounds = 1; // how many sounds share the same name as above name

var maxPitch = 1;
var minPitch = 1;
var speed = 1; // how fast in ticks to play the sound (lower value - slower text, higher value - faster)
var frequency = 2; // plays a sound per # of characters
var banjoKazooieRandomizer = false; // overrides frequency

var makePredictable = true; // this makes sound effects consistant between talking to the npc
var skipSpaces = false; // whether to count spaces for the frequency of sounds playing
var pauseTime = 1; // duration of each {pause} tag

var enablePortait = false;
var portraitTexture = ""; // max size w:98/h:98, if not specified image path, will look in "customnpcs:textures/npc/portrait/*.png"


/**
 * ||=======================================================================================||
 * ||    _____  _  _                      ______  _         _                               ||
 * ||   /  __ \(_)| |                     |  _  \(_)       | |                              ||
 * ||   | /  \/ _ | |_  _ __  _   _  ___  | | | | _   __ _ | |  ___    __ _  _   _   ___    ||
 * ||   | |    | || __|| '__|| | | |/ __| | | | || | / _` || | / _ \  / _` || | | | / _ \   ||
 * ||   | \__/\| || |_ | |   | |_| |\__ \ | |/ / | || (_| || || (_) || (_| || |_| ||  __/   ||
 * ||    \____/|_| \__||_|    \__,_||___/ |___/  |_| \__,_||_| \___/  \__, | \__,_| \___|   ||
 * ||                                                                  __/ |                ||
 * || Script by: Citrus                                               |___/                 ||
 * ||    Sub-script runDelay by: Runon#5355                                                 ||
 * || Free to use in any project!                                                     v1.01 ||
 * ||=======================================================================================||
 */

//constants
var DIALOG_BOX_ID = 1;
var NPC_NAME_LABEL_ID = 2;
var DIALOG_LABEL_ID = 3;
var NPC_PORTRAIT_ID = 4;
var FAST_FORWARD_BUTTON_ID = 100;
var CONTINUE_GUI_BUTTON_ID = 200;
var CLOSE_GUI_BUTTON_ID = 300;

var DIALOG_OPTIONS_BUTTON_ID = 500;
var ROLE_OPTIONS_BUTTON_ID = 600;
var COMMAND_OPTIONS_BUTTON_ID = 700;

var MAX_CHARACTERS = 426;

//functional variables - do not touch!
var currentDialogString;
var NpcAPI = Java.type("noppes.npcs.api.NpcAPI").Instance();
var potentialNextDialog = {}; // mapping - key : value pair
var skip = false;
var splitDialogs = [];
var currentSplit;
var pauseIndices = [];

//globals
var _TIMERS = [];
var _DIALOG;
var _PLAYER;
var _NPC;
var _GUI;
var _LABEL;
var _BUTTON_IDS = [];

/**
 * Event function which is called whenever the player interacts with an NPC
 * @param {event} e 
 */
function interact(e){
	if (e instanceof Java.type("noppes.npcs.api.event.NpcEvent.InteractEvent")) {
		//dialog was called via interaction
		_PLAYER = e.player;
		_NPC = e.npc;

		for(var z = 0; z <= 11; z++){
			var dialog = _NPC.getDialog(z);
			if(dialog != null){
				//log("dialog \"" + dialog.getName() + "\" is available? " + _NPC.getDialog(z).getAvailability().isAvailable(_PLAYER));
				if(dialog.getAvailability().isAvailable(_PLAYER)){
					_DIALOG = dialog;
					break;
				}
			}
		}
		//log("====================================================================");
		//log(_PLAYER.getName() + " started a dialog with " + _NPC.getName() + "!");
		//log("====================================================================");
		if(_DIALOG == null){
			// edgecase: no dialogs set, but still has the script on
			return;
		}
	} else {
		//dialog was called via customGUIButton
	}
	//TODO: instead of hooking into dialog event, stop dialog event from happening and display ours instead
	//var serverUtils = Java.type("noppes.npcs.NoppesUtilServer");
	//serverUtils = serverUtils.class.static;
	//serverUtils.sendOpenGui(_PLAYER.getMCEntity(),Java.type("noppes.npcs.constants.EnumGuiType").PlayerTrader,_NPC.getMCEntity());

	//reset dialogue variables and timers
	_TIMERS = [];
	_GUI = NpcAPI.createCustomGui(69, 256, 256, false);
	_LABEL = _GUI.addLabel(DIALOG_LABEL_ID, "", -65, 115, 365, 80);
	splitDialogs = [];
	currentSplit = 0;
	_NPC.timers.forceStart(0, 1, true);
	var entireDialog = _DIALOG.getText();
	clearButtons();

	if (banjoKazooieRandomizer) {
		frequency = 4 + Math.floor(Math.random() * 4);
	}

	//find and replace all player tags with player names
	entireDialog = entireDialog.replace(
		new RegExp("{player}", "i"),
		_PLAYER.getDisplayName()
	);

	//find and index all pause tags
	pauseIndices = [];
	var pausePosition = entireDialog.indexOf("{pause}", 0);
	while (pausePosition >= 0) {
		pauseIndices.push(pausePosition);
		entireDialog = entireDialog.replace("{pause}", "");
		pausePosition = entireDialog.indexOf("{pause}", pausePosition + 1);
	}

	//TODO: add emotion tagging for changing portraits through dialogue

	//log(entireDialog)
	//log("entire dialog length: " + entireDialog.length)

	_GUI.setBackgroundTexture("");
	_GUI.addTexturedRect(DIALOG_BOX_ID, "customnpcs:textures/gui/chatbox.png", -150, -150 , 256, 256).setScale(2);
	_GUI.addLabel(NPC_NAME_LABEL_ID, _NPC.getName(), -75, 75, 100, 40);
	_LABEL = _GUI.getComponent(DIALOG_LABEL_ID);
	if (enablePortait) {
		if (portraitTexture == "") {
			// try to find texture via NPC name
			portraitTexture = "customnpcs:textures/npc/portrait/" + _NPC.getName() + ".png";
		}
		_GUI.addTexturedRect(NPC_PORTRAIT_ID, portraitTexture, -182, 106, 256, 256).setScale(0.3828125);
	}

	splitDialogs = splitter(entireDialog, MAX_CHARACTERS);
	/*
    for(var j = 0; j < splitDialogs.length; j++)
    {
        log("split: " + j + "    split text: " + splitDialogs[j]);
    }
    */

	if (splitDialogs[currentSplit].length == 0) {
		//empty dialog text, so just add a button to close
		_GUI.addTexturedButton(CLOSE_GUI_BUTTON_ID, "", -2000, -2000, 4000, 4000, "customnpcs:textures/gui/blank.png" );
		_GUI.update(_PLAYER);
	} else {
		createDialogUpdateTimers(splitDialogs[currentSplit]);
	}

	if (e instanceof Java.type("noppes.npcs.api.event.NpcEvent.InteractEvent")) {
		runDelay(0, function () {
			_PLAYER.showCustomGui(_GUI);
		});
	}
}

/**
 * Event function which is called whenever the player interacts with an NPC that has dialogue available, we need to cancel this event asap
 * @param {event} e
 */
function dialog(e) {
	e.setCanceled(true);
}

/**
 * Create a timer for each character in given string
 * @param {string} str a max size dialog string
 */
function createDialogUpdateTimers(splitDialogString) {
	//log("creating timers for: " + splitDialogString)
	
	_GUI.addTexturedButton(FAST_FORWARD_BUTTON_ID, "", -100, 75, 450, 135, "customnpcs:textures/gui/blank.png");
	_GUI.update(_PLAYER);
	var delay = 0;
	currentDialogString = "";
	for (var i = 0; i < splitDialogString.length + 1; i++) {
		//log("current iteration:" + i)
		for (var k = 0; k < pauseIndices.length; k++) {
			if (i == pauseIndices[k]) {
				delay++;
			}
		}
		//log("pause delay: " + delay)
		//log("base delay: " + i*0.05/speed)
		runDelay(
			pauseTime * delay + 0.05 + (i * 0.05) / speed,
			function () {
				if (_PLAYER.getCustomGui() != null && !skip) {
					updateDialog(splitDialogString);
				}
			}
		);
	}
		
}

/**
 * Callback function for individual dialogue update timers
 * @returns void
 */
function updateDialog(splitDialogString) {
	var pitch;
	var currentCharacter = splitDialogString.charAt(currentDialogString.length); //next character

	//log(currentDialogString + " + " + currentCharacter);

	currentDialogString = currentDialogString + currentCharacter;

	_LABEL = _GUI.getComponent(DIALOG_LABEL_ID);
	_LABEL.setText(currentDialogString);
	_GUI.update(_PLAYER);

	//skip spaces
	if (skipSpaces && currentCharacter == " ") {
		return;
	}

	//controlling sounds
	if (currentDialogString.length % frequency == 0) {
		if (makePredictable) {
			var hashCode = currentCharacter.hashCode();
			var predictableIndex;
			if (numberOfSounds == 1) {
				predictableIndex = 1;
			} else {
				predictableIndex = hashCode % numberOfSounds;
			}

			var minPitchInt = Math.ceil(minPitch * 100);
			var maxPitchInt = Math.ceil(maxPitch * 100);
			var pitchRangeInt = maxPitchInt - minPitchInt;
			//zero range case
			if (pitchRangeInt != 0) {
				var predictablePitchInt =
					(hashCode % pitchRangeInt) + minPitchInt;
				var predictablePitch = predictablePitchInt / 100;
				pitch = predictablePitch;
			} else {
				pitch = minPitch;
			}
		} else {
			//randomized pitch
			pitch = Math.random() * (maxPitch - minPitch) + minPitch;
		}

		_PLAYER.playSound(soundName + predictableIndex, 1, pitch);
	}

	//log("currentDialogString.length: " + currentDialogString.length + " >= splitDialogString.length: " + splitDialogString.length)
	if (currentDialogString.length >= splitDialogString.length - 1) {
		//done printing text
		//log("current split: " + currentSplit + " <= splitDialogs.length: " + splitDialogs.length)

		_GUI.removeComponent(FAST_FORWARD_BUTTON_ID);

		if (currentSplit < splitDialogs.length - 1) {
			// not done printing, need to print the next split
			if (splitDialogs.length != 0) { 
				_GUI.addTexturedButton(CONTINUE_GUI_BUTTON_ID, "", -2000, -2000, 4000, 4000, "customnpcs:textures/gui/blank.png");
				_GUI.update(_PLAYER);
			}
		} else {
			// done printing, show next options
			showNextOptions();
		}
	}
}

/**
 * Displays all the options for the current dialog.
 * @returns void
 */
function showNextOptions() {
	//create buttons for options
	var options = _DIALOG.getOptions();
	_BUTTON_IDS = [];

	if (options.length == 0) {
		// no options left, create close button
		_GUI.addTexturedButton(CLOSE_GUI_BUTTON_ID, "", -2000, -2000, 4000, 4000, "customnpcs:textures/gui/blank.png");
		_GUI.update(_PLAYER);
		return;
	}
	for (var i = 0; i < options.length; i++) {
		var dialogOption = _DIALOG.getOption(i);
		var buttonId = null;

		switch (dialogOption.getType()) {
			case 4: //COMMAND_BLOCK
				buttonId = COMMAND_OPTIONS_BUTTON_ID + i;
				break;
			case 3: //ROLE_OPTION
				buttonId = ROLE_OPTIONS_BUTTON_ID + i;
				break;
			case 2: //DISABLED
				continue;
			case 1: //DIALOG_OPTION
				if(dialogOption.getDialog().getAvailability().isAvailable(_PLAYER)){
					buttonId = DIALOG_OPTIONS_BUTTON_ID + i;
					potentialNextDialog[buttonId] = _DIALOG
						.getOption(i)
						.getDialog();
				} else {
					continue;
				}
				break;
			case 0: //QUIT_OPTION
				buttonId = CLOSE_GUI_BUTTON_ID + i;
				break;
			default:
				continue;
		}

		//log("DIALOG OPTION: " + _DIALOG.getOption(i).getName() + " |   DIALOG TYPE: " + dialogOption.getType() + " |   BUTTON ID: " + buttonId);

		if(buttonId != null){
			_BUTTON_IDS.push(buttonId);
			//TODO: Add color based on the option's color hex. Need more support from API since no function exists for it.
			_GUI.addButton(buttonId, _DIALOG.getOption(i).getName(), 20, 215 + 25 * i);
		}
	}
	if (_BUTTON_IDS.length > 3) {
		//need to offset buttons to fit screen

		//move first three to left
		for (var j = 0; j <= 2; j++) {
			_GUI.getComponent(_BUTTON_IDS[j]).setPos(-90, 215 + 25 * j);
		}

		//move last three to right and up
		for (var k = 3; k < _BUTTON_IDS.length; k++) {
			_GUI.getComponent(_BUTTON_IDS[k]).setPos(130, 215 + 25 * (k - 3));	
		}
	}	

	_GUI.update(_PLAYER);
}

/**
 * Event function which is called when a player presses any CustomGUIButton
 * @param {event} e
 * @returns void
 */
function customGuiButton(e) {
	//log("button id pressed: " + e.buttonId + " rounded to: " + Math.round(e.buttonId/100)*100);
	clearButtons();
	switch(Math.round(e.buttonId/100)*100){
		case CLOSE_GUI_BUTTON_ID:
			_PLAYER.closeGui();
			break;
		case FAST_FORWARD_BUTTON_ID:
			// skip through dialog
		
			//reset variables
			skip = true;
			_TIMERS = [];
		
			//update label
			/*
        	var components = _GUI.getComponents();
        	for(var j = 0; j < components.length; j++)
        	{
        	    log("component id: " + components[j].getID());
        	}
        	*/
		
			_LABEL = _GUI.getComponent(DIALOG_LABEL_ID);
			_LABEL.setText(splitDialogs[currentSplit]);
			if (currentSplit < splitDialogs.length - 1) {
				// not done printing, need to print the next split
				_GUI.addTexturedButton(CONTINUE_GUI_BUTTON_ID, "", -2000, -2000, 4000, 4000, "customnpcs:textures/gui/blank.png");
			} else {
				// done printing, show next options
				showNextOptions();
			}
			skip = false;
			break;
		case CONTINUE_GUI_BUTTON_ID:
			_GUI.removeComponent(CONTINUE_GUI_BUTTON_ID);
			_LABEL.setText("");
			currentSplit++;
			if (currentSplit < splitDialogs.length) {
				createDialogUpdateTimers(splitDialogs[currentSplit]);
			}
			break;
		case DIALOG_OPTIONS_BUTTON_ID:
			for (var key in potentialNextDialog) {
				//log("does key: " + key + " == " + e.buttonId + " ?")
				if (key == e.buttonId) {
					//log("key: " + key)
					//log("value: " + potentialNextDialog[key])

					_DIALOG = potentialNextDialog[key];
					potentialNextDialog = {};
					interact(e);
				}
			}
			break;
		case ROLE_OPTIONS_BUTTON_ID:
			_PLAYER.closeGui();
			performRole();
			break;
		default:
			break;
	}
	_GUI.update(_PLAYER);
}

/**
 * Performs the role of the current NPC
 */
function performRole(){
	var serverUtils = Java.type("noppes.npcs.NoppesUtilServer");
	serverUtils = serverUtils.class.static;

	var role = _NPC.getRole().getType();
	switch(role){
		case 0: //NONE
		return;

		case 1: //TRADER
		serverUtils.sendOpenGui(_PLAYER.getMCEntity(),Java.type("noppes.npcs.constants.EnumGuiType").PlayerTrader,_NPC.getMCEntity());
		break;

		case 2: //FOLLOWER
		if(!_NPC.getRole().isFollowing()){
			serverUtils.sendOpenGui(_PLAYER.getMCEntity(),Java.type("noppes.npcs.constants.EnumGuiType").PlayerFollowerHire,_NPC.getMCEntity());
		} else{
			serverUtils.sendOpenGui(_PLAYER.getMCEntity(),Java.type("noppes.npcs.constants.EnumGuiType").PlayerFollower,_NPC.getMCEntity());
		}
		break;

		case 3: //BANK
		//TODO: instead of opening a generic small bank, it should open the bank that the NPC has been assigned
		serverUtils.sendOpenGui(_PLAYER.getMCEntity(),Java.type("noppes.npcs.constants.EnumGuiType").PlayerBankSmall,_NPC.getMCEntity());
		break;

		case 4: //TRANSPORTER
		serverUtils.sendOpenGui(_PLAYER.getMCEntity(),Java.type("noppes.npcs.constants.EnumGuiType").PlayerTransporter,_NPC.getMCEntity());
		break;

		case 5: //MAILMAN
		serverUtils.sendOpenGui(_PLAYER.getMCEntity(),Java.type("noppes.npcs.constants.EnumGuiType").PlayerMailman,_NPC.getMCEntity());
		break;

		case 6: //COMPANION
		serverUtils.sendOpenGui(_PLAYER.getMCEntity(),Java.type("noppes.npcs.constants.EnumGuiType").CompanionTrader,_NPC.getMCEntity());
		break;

		case 7: //DIALOG
		return;

		case 8: //MAXSIZE
		return;
	}
	
}

/**
 * Removes all buttons from the UI
 */
function clearButtons() {
	//log("clearing buttons...");
	/*
    var components = _GUI.getComponents();
    for(var j = 0; j < components.length; j++)
    {
        log("component id: " + components[j].getID());
    }
	*/
	for (var i = 0; i <= _BUTTON_IDS.length; i++) {
		if(_BUTTON_IDS[i] != null){
			//log("removing button id: " + _BUTTON_IDS[i]);
			_GUI.removeComponent(_BUTTON_IDS[i]);
		}
	}
	_GUI.removeComponent(FAST_FORWARD_BUTTON_ID);
	_GUI.removeComponent(CLOSE_GUI_BUTTON_ID);
	_GUI.removeComponent(CONTINUE_GUI_BUTTON_ID);
	_GUI.update(_PLAYER);
}

/**
 * This function is called whenever a timer is finished
 * @param {timer} t
 */
function timer(t) {
	if (t.id == 0) {
		//timer that happens every tick
		runDelayTick(); //To make runDelay work
	}
}




/**
 * Splits a string and makes sure not to chop words up
 * @param {*} str string to split
 * @param {*} l length of each split
 * @returns array of splits
 */
function splitter(str, l) {
	var strs = [];
	while (str.length > l) {
		var pos = str.substring(0, l).lastIndexOf(" ");
		pos = pos <= 0 ? l : pos;
		strs.push(str.substring(0, pos));
		var i = str.indexOf(" ", pos) + 1;
		if (i < pos || i > pos + l) i = pos;
		str = str.substring(i);
	}
	strs.push(str);
	return strs;
}

/**
 * runDelay Script by Runon#5355
 *
 * Executes a function after a certain amount of time
 * @param {int} seconds Time in seconds
 * @param {Function} callback Function to execute
 */
function runDelay(seconds, callback) {
	var time = new Date().getTime() + seconds * 1000;
	//log("timer set for: " + time)
	_TIMERS.push({
		end: time,
		callback: callback,
	});
}

/**
 * Used in tick function to let runDelay work
 */
function runDelayTick() {
	if (_TIMERS.length > 0) {
		var _newTimers = [];
		var _curTime = new Date().getTime();

		var timer;
		for (var i = 0; i < _TIMERS.length; i++) {
			timer = _TIMERS[i];
			if (_curTime >= timer.end) {
				timer.callback();
			} else {
				_newTimers.push(timer);
			}
		}

		_TIMERS = _newTimers;
	}
}
