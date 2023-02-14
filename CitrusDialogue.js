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
var DIALOG_BOX_ID = 0;
var NPC_NAME_LABEL_ID = 1;
var DIALOG_LABEL_ID = 2;
var NPC_PORTRAIT_ID = 3;
var FAST_FORWARD_BUTTON_ID = 100;
var CLOSE_GUI_BUTTON_ID = 200;
var CONTINUE_GUI_BUTTON_ID = 300;

var DIALOG_OPTIONS_BUTTON_ID = 500;
var CLOSE_OPTIONS_BUTTON_ID = 600;
var ROLE_OPTIONS_BUTTON_ID = 700;
var COMMAND_OPTIONS_BUTTON_ID = 800;

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
var _GUI = NpcAPI.createCustomGui(69, 256, 256, false);
var _LABEL = _GUI.addLabel(DIALOG_LABEL_ID, "", -65, 115, 365, 80);
var _BUTTON_IDS = [];

/**
 * Event function which is called whenever the player interacts with an NPC that has dialogue available
 * @param {event} e
 */
function dialog(e) {
	if (e instanceof Java.type("noppes.npcs.api.event.DialogEvent")) {
		//dialog was called via interaction
		_PLAYER = e.player;
		_DIALOG = e.dialog;
		_NPC = e.npc;
	} else {
		//dialog was called via customGUIButton
	}
	//reset dialogue variables and timers
	_TIMERS = [];
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
	/*
    for(var j = 0; j < pauseIndices.length; j++)
    {
        log(pauseIndices[j])
    }
    */

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
	createDialogUpdateTimers(splitDialogs[currentSplit]);
	if (e instanceof Java.type("noppes.npcs.api.event.DialogEvent")) {
		runDelay(0, function () {
			_PLAYER.showCustomGui(_GUI);
		});
	}
}

/**
 * Create a the timer for each character in given string
 * @param {string} str a max size dialog string
 */
function createDialogUpdateTimers(splitDialogString) {
	//log("creating timers for: " + splitDialogString)

	if (splitDialogString.length != 0) {
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
						UpdateDialog(splitDialogString);
					}
				}
			);
		}
	} else {
		clearButtons();
		_LABEL = _GUI.getComponent(DIALOG_LABEL_ID);
		_LABEL.setText("");
		_GUI.addTexturedButton(CLOSE_GUI_BUTTON_ID, "", -2000, -2000, 4000, 4000, "customnpcs:textures/gui/blank.png" );
		_GUI.update(_PLAYER);
	}
}

/**
 * Callback function for individual dialogue update timers
 * @returns void
 */
function UpdateDialog(splitDialogString) {
	var pitch;
	var currentCharacter = splitDialogString.charAt(currentDialogString.length); //next character

	log(currentDialogString + " + " + currentCharacter);

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
				_GUI.addTexturedButton(CONTINUE_GUI_BUTTON_ID, "CONTINUE_GUI_BUTTON_ID", -2000, -2000, 4000, 4000, "customnpcs:textures/gui/blank.png");
				_GUI.update(_PLAYER);
			}
		} else {
			// done printing, show next options
			ShowNextOptions();
		}
	}
}

/**
 *
 * @returns
 */
function ShowNextOptions() {
	//create buttons for options
	var options = _DIALOG.getOptions();
	potentialNextDialog = {};

	if (options.length == 0) {
		// no options left, create close button
		_GUI.addTexturedButton(CLOSE_GUI_BUTTON_ID, "", -2000, -2000, 4000, 4000, "customnpcs:textures/gui/blank.png");
		_GUI.update(_PLAYER);
		return;
	}
	for (var i = 0; i < options.length; i++) {
		var dialogType = _DIALOG.getOption(i).getType();
		var buttonId;
		//log("DIALOG OPTION: " + _DIALOG.getOption(i).getName() + "    DIALOG TYPE: " + dialogType)
		switch (dialogType) {
			case 4:
				//COMMAND_BLOCK
				buttonId = COMMAND_OPTIONS_BUTTON_ID + i;
				break;
			case 3:
				//ROLE_OPTION
				buttonId = ROLE_OPTIONS_BUTTON_ID + i;
				break;
			case 2:
				//DISABLED
				continue;
			case 1:
				//DIALOG_OPTION
				buttonId = DIALOG_OPTIONS_BUTTON_ID + i;
				potentialNextDialog[buttonId] = _DIALOG
					.getOption(i)
					.getDialog();
				break;
			case 0:
				//QUIT_OPTION
				_GUI.addButton(CLOSE_GUI_BUTTON_ID + i, _DIALOG.getOption(i).getName(), 20, 215 + 25 * i);
				break;
			default:
				continue;
		}

		_GUI.addButton(
			DIALOG_OPTIONS_BUTTON_ID + i,
			_DIALOG.getOption(i).getName(),
			20,
			215 + 25 * i
		);
	}
	if (options.length > 3) {
		//need to offset buttons

		//move first three to left
		for (var j = 0; j <= 2; j++) {
			if (_GUI.getComponent(DIALOG_OPTIONS_BUTTON_ID + j) != null)
				_GUI.getComponent(DIALOG_OPTIONS_BUTTON_ID + j).setPos(-90, 215 + 25 * j);
			if (_GUI.getComponent(CLOSE_GUI_BUTTON_ID + j) != null)
				_GUI.getComponent(CLOSE_GUI_BUTTON_ID + j).setPos(-90, 215 + 25 * j);
		}

		//move last three to right and up
		for (var k = 3; k <= 5; k++) {
			var comp = _GUI.getComponent(DIALOG_OPTIONS_BUTTON_ID + k);
			if (comp != null) {
				comp.setPos(130, 215 + 25 * (k - 3));
			}
			if (_GUI.getComponent(CLOSE_GUI_BUTTON_ID + k) != null)
				_GUI.getComponent(CLOSE_GUI_BUTTON_ID + k).setPos(130, 215 + 25 * (k - 3));	
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
	if (e.buttonId >= CLOSE_GUI_BUTTON_ID && e.buttonId <= CLOSE_GUI_BUTTON_ID + 5) {
		//it was the close dialog button
		_PLAYER.closeGui();
		return;
	}
	if (e.buttonId == FAST_FORWARD_BUTTON_ID) {
		// skip through dialog

		//reset variables
		skip = true;
		_TIMERS = [];
		clearButtons();

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
		_GUI.update(_PLAYER);

		currentDialogString = splitDialogs[currentSplit];
		if (currentSplit < splitDialogs.length - 1) {
			// not done printing, need to print the next split
			_GUI.addTexturedButton(CONTINUE_GUI_BUTTON_ID, "", -2000, -2000, 4000, 4000, "customnpcs:textures/gui/blank.png");
			_GUI.update(_PLAYER);
		} else {
			// done printing, show next options
			ShowNextOptions();
		}
		skip = false;
		return;
	}
	if (e.buttonId == CONTINUE_GUI_BUTTON_ID) {
		_GUI.removeComponent(CONTINUE_GUI_BUTTON_ID);
		_LABEL.setText("");
		_GUI.update(_PLAYER);
		currentSplit++;
		if (currentSplit < splitDialogs.length) {
			createDialogUpdateTimers(splitDialogs[currentSplit]);
		}
		return;
	}

	for (var key in potentialNextDialog) {
		//log("does key: " + key + " == " + e.buttonId + " ?")
		if (key == e.buttonId) {
			//log("key: " + key)
			//log("value: " + potentialNextDialog[key])

			clearButtons();
			_DIALOG = potentialNextDialog[key];
			dialog(e);
		}
	}
}

/**
 * Removes all buttons from the UI
 */
function clearButtons() {
	log("clearing buttons...");
	/*
    var components = _GUI.getComponents();
    for(var j = 0; j < components.length; j++)
    {
        log("component id: " + components[j].getID());
    }
    */
	for (var i = 0; i <= _BUTTON_IDS.length; i++) {
		log("removing button id: " + _BUTTON_IDS[i]);
		_GUI.removeComponent(_BUTTON_IDS[i]);
	}
	_GUI.removeComponent(FAST_FORWARD_BUTTON_ID);
	_GUI.removeComponent(CLOSE_GUI_BUTTON_ID);
	_GUI.removeComponent(CONTINUE_GUI_BUTTON_ID);
	_GUI.update(_PLAYER);
	_BUTTON_IDS = [];
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
