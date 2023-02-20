//feel free to change these
var soundName = "customnpcs:default";
var numberOfSounds = 1; // how many sounds share the same name as above name

var maxPitch = 1; // (1 = 100% pitch, 0.5 = 50% pitch, 2 = 200% pitch)
var minPitch = 1;
var speed = 1; // how fast in percentage to play the sound (1 = 100% speed, 0.5 = 50% speed, 2 = 200% speed)
var frequency = 2; // plays a sound per # of characters (generally the longer the soundbyte, the higher the frequency you should have)

var makePredictable = true; // this makes sound effects consistant between talking to the npc
var pauseTime = 1; // duration of each {pause} tag in seconds

var enablePortait = true;
var portraitTexture = ""; // max size w:98/h:98, if not specified image path, will look in "customnpcs:textures/npc/portrait/*.png"

var enableEmotions = true; // Enable to change portait based on emotion tags inside dialog text. Requires enablePortrait to be true. Overrides portraitTexture.
// If the NPC's name is peter and there is a {happy} tag in the dialog text, this will change the portrait to the image in the path "customnpcs:textures/npc/portrait/peter/happy.png".

/**
 *  Due to lack of some critical API functions, some options set in the NPC editor are worthless when using this script so I had to make some work arounds.
 * 
 * 	If you wish to distribute faction points at the beginning of a dialog, don't set it in the NPC editor. Instead do the following:
 * 	At the beginning of the dialog text, add {faction:FACTION_ID:AMOUNT}. example {faction:0:+10}
 * 	Supports multiple faction tags
 * 
 * 	If you wish to play a sound at the beginning, don't set it in the NPC editor. Instead do the following:
 * 	At the beginning of the dialog text, add {sound:SOUND_PATH}. example {sound:customnpcs:talk1}
 * 	Supports multiple sound tags
 */

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
 * ||                                                                                       ||
 * || Free to use in any project!                                                     v1.03 ||
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
var NpcAPI = Java.type("noppes.npcs.api.NpcAPI").Instance();
var potentialNextDialog = {}; // mapping - buttonId (key) : IDialog (value)
var splitDialogs = [];
var currentSplit;
var pauseIndices = [];
var formatCodeIndices = [];
var emotionPositionMap = {}; // mapping - position of emotion (key) : emotion name (value)

//globals
var _HTHREAD;
var _DIALOG;
var _PLAYER;
var _NPC;
var _GUI;
var _LABEL;
var _BUTTON_IDS = [];
var _PORTRAIT;

/**
 * Event function which is called whenever the player interacts with an NPC
 * @param {event} e 
 */
function interact(e){
	if(_HTHREAD != null)
		_HTHREAD.interrupt();
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
		log("====================================================================");
		log(_PLAYER.getName() + " started a dialog with " + _NPC.getName() + "!");
		log("====================================================================");
		if(_DIALOG == null){
			// edgecase: no dialogs set, but still has the script on
			return;
		}
	} else {
		//dialog was called via customGUIButton
	}

	//reset dialogue variables
	_GUI = NpcAPI.createCustomGui(69, 256, 256, false);
	_LABEL = _GUI.addLabel(DIALOG_LABEL_ID, "", -65, 116, 360, 80);
	splitDialogs = [];
	currentSplit = 0;
	var entireDialog = _DIALOG.getText();
	clearButtons();

	// Play sounds at start
	var soundRegex = new RegExp("{sound:(.*?)}", "gi");
	var soundStrings = entireDialog.match(soundRegex);
	if(soundStrings != null){
		//log("soundstring length: " + soundStrings.length);
		for(var s = 0; s < soundStrings.length; s++){
			//log("applying sound string: " + soundStrings[s]);
			soundStrings[s] = soundStrings[s].replace(new RegExp("[{}]", "g"), "");
			var split = soundStrings[s].split(":");
			_PLAYER.playSound(split[1] + ":" + split[2], 1, 1);
			entireDialog = entireDialog.replace(soundRegex, "");
		}
	}

	// Give faction points for each faction tag
	var factionRegex = new RegExp("{faction:(.*?):(.*?)}", "gi");
	var factionStrings = entireDialog.match(factionRegex);
	if(factionStrings != null){
		//log("factionstrings length: " + factionStrings.length);
		for(var b = 0; b < factionStrings.length; b++){
			//log("applying faction string: " + factionStrings[b]);
			factionStrings[b] = factionStrings[b].replace(new RegExp("[{}]", "g"), "");
			var split = factionStrings[b].split(":");
			_PLAYER.addFactionPoints(split[1], split[2]); //id, amount
			entireDialog = entireDialog.replace(factionRegex, "");
		}
	}

	var quest = _DIALOG.getQuest();
	//log("quest found: " + quest.getName());
	if(quest != null && !_PLAYER.hasActiveQuest(quest.getId())){
		_PLAYER.startQuest(quest.getId());
	}
		
	var command = _DIALOG.getCommand()
	if(command != null){
		NpcAPI.executeCommand(_PLAYER.getWorld(), command);
	}

	//TODO: disable escape key if {noescape} is in text
	//TODO: way of giving mail similar to how its done in the NPC editor

	// Process entire dialog
	//find and replace all player tags with player names
	entireDialog = entireDialog.replace(
		new RegExp("{player}", "i"),
		_PLAYER.getDisplayName()
	);

	entireDialog = entireDialog.replace(/\n{3,999}/g, '\n');
	entireDialog = entireDialog.replace(/}{/g, '} {');

	//Create CustomGuiComponents
	_GUI.addTexturedRect(DIALOG_BOX_ID, "customnpcs:textures/gui/chatbox.png", -150, -150 , 256, 256).setScale(2);
	_GUI.addLabel(NPC_NAME_LABEL_ID, _NPC.getName(), -75, 75, 100, 40);
	_LABEL = _GUI.getComponent(DIALOG_LABEL_ID);
	if (enablePortait) {
		if (portraitTexture == "") {
			// try to find texture via NPC name
			portraitTexture = "customnpcs:textures/npc/portrait/" + _NPC.getName() + ".png";
			if(portraitTexture = "customnpcs:textures/npc/portrait/.png")
			{
				//cant find npc portrait, use default
				portraitTexture = "customnpcs:textures/npc/portrait/default.png";
			}
		}

		if(enableEmotions)
			portraitTexture = "customnpcs:textures/npc/portrait/" + _NPC.getName() + "/default.png";

		_PORTRAIT = _GUI.addTexturedRect(NPC_PORTRAIT_ID, portraitTexture, -182, 106, 256, 256).setScale(0.3828125);
	}

	if (e instanceof Java.type("noppes.npcs.api.event.NpcEvent.InteractEvent")) {
		_PLAYER.showCustomGui(_GUI);
	}

	splitDialogs = splitter(entireDialog, MAX_CHARACTERS);

	if (splitDialogs[currentSplit].length == 0) {
		//empty dialog text, so just add a button to close
		_GUI.addTexturedButton(CLOSE_GUI_BUTTON_ID, "", -2000, -2000, 4000, 4000, "customnpcs:textures/gui/blank.png");
		_GUI.update(_PLAYER);
	} else {
		//start printing first split
		_HTHREAD = new Thread(new RunDialog());
		_HTHREAD.start();
	}
}

/**
 * Find and set all indices for current split. Format code positions, Pause position, and emotion position. 
 * @param {string} split 
 * @returns processed split
 */
function ProcessCurrentSplit(split){
	log("processing current split: " + currentSplit + " split text: " + split);

	pauseIndices = [];
	var pausePosition = split.indexOf("{pause}", 0);
	while (pausePosition >= 0) {
		log("pause found at: " + pausePosition);
		pauseIndices.push(pausePosition);
		split = split.replace("{pause}", "");
		pausePosition = split.indexOf("{pause}", pausePosition + 1);
	}

	formatCodeIndices = [];
	var formatPosition = split.indexOf("§", 0);
	while (formatPosition >= 0) {
		log("format code found at: " + formatPosition);
		formatCodeIndices.push(formatPosition);
		formatPosition = split.indexOf("§", formatPosition + 1);
	}

	if(enablePortait && enableEmotions){
		emotionPositionMap = {};
		var emotions = split.match(/{(\w+)}/g) || [];
		for(var v = 0; v < emotions.length; v++){
			var emotionPosition = split.indexOf(emotions[v], 0);
			log("found emotion: " + emotions[v] + " at position " + emotionPosition);
				
			emotionPositionMap[emotionPosition] = "customnpcs:textures/npc/portrait/" + _NPC.getName() + "/" + emotions[v].replace(/[{}]/g, "") + ".png";
			split = split.replace(emotions[v], "");
			
			//fix pause positions
			pauseIndices = pauseIndices.map(function(pausePos){
				if(emotionPosition <= pausePos)
					return pausePos - (emotions[v]).length;
				else
					return pausePos;
			});

		}
	}

	return split;
}

/**
 * Event function which is called whenever the player interacts with an NPC that has dialogue available, we need to cancel this event asap
 * @param {event} e
 */
function dialog(e) {
	e.setCanceled(true);
}


/**
 * ! THREADED FUNCTION
 * Calls updateDialog() for each character in given string, handles delay and speed, as well as the termination of itself
 * Create a thread with this to print the current split
 */
var Run = Java.type("java.lang.Runnable");
var Thread = Java.type("java.lang.Thread");
var RunDialog = Java.extend(Run, {
	run: function(){
		var thisThread = Thread.currentThread();
		if(thisThread.isInterrupted()){
			return;
		}
		splitDialogs[currentSplit] = ProcessCurrentSplit(splitDialogs[currentSplit]);
		
		var currentDialogString = "";
		var splitDialogString = splitDialogs[currentSplit];
		
	
		while(!thisThread.isInterrupted() && currentDialogString.length != splitDialogString.length) {
			//early thread termination if GUI is not open.
			if(_PLAYER.getCustomGui() == null){
				thisThread.interrupt();
			}

			if(currentDialogString.length == 3){
				_GUI.addTexturedButton(FAST_FORWARD_BUTTON_ID, "", -100, 75, 450, 135, "customnpcs:textures/gui/blank.png");
			}

			var currentCharacter = splitDialogString.charAt(currentDialogString.length);
			var delay = 0;
	
			//check for emotion tag
			if(enablePortait && enableEmotions){
				for (var emotionPosition in emotionPositionMap) {
					log(currentDialogString.length + " == " + emotionPosition);
					if (currentDialogString.length == emotionPosition) {
						//emotion tag found
						_PORTRAIT.setTexture(emotionPositionMap[emotionPosition]);
					}
				}
			}

			//check for {pause} tag indices
			if(pauseIndices.length != 0) {
				for (var k = 0; k < pauseIndices.length; k++) {
					if (currentDialogString.length == pauseIndices[k]) {
						//{pause} found
						delay = 1;
						break;
					}
				}
			}

			
			log(currentDialogString.length + " - " + currentDialogString + " + " + currentCharacter);
			if(currentCharacter.charCodeAt(0) == "§".charCodeAt(0)){
				//minecraft formatting code §, don't make a delay for it
				//log("found format code.")
				currentDialogString = currentDialogString + currentCharacter + splitDialogString.charAt(currentDialogString.length + 1);
				_LABEL = _GUI.getComponent(DIALOG_LABEL_ID);
				_LABEL.setText(currentDialogString);
				_GUI.update(_PLAYER);
			}
			else{
				Thread.sleep(pauseTime*1000*delay + 50 / speed);
				currentDialogString = currentDialogString + currentCharacter;
				updateDialog(currentDialogString);
			}
		}
	
		//done printing text
		//log("done printing dialog");
		//log("current split: " + currentSplit + " <= splitDialogs.length: " + splitDialogs.length)
		_GUI.removeComponent(FAST_FORWARD_BUTTON_ID);
	
		if (currentSplit < splitDialogs.length - 1) {
			// not done printing splits, need to print the next split
			if (splitDialogs.length != 0) { 
				_GUI.addTexturedButton(CONTINUE_GUI_BUTTON_ID, "", -2000, -2000, 4000, 4000, "customnpcs:textures/gui/blank.png");
				_GUI.update(_PLAYER);
			}
		} else {
			// done printing, show next options
			showNextOptions();
		}
	}
});



/**
 * Called once per valid character in a string, handles display and sound only
 * @param {string} stringToDisplay 
 */
function updateDialog(stringToDisplay) {
	var pitch;

	//update dialog text
	_LABEL = _GUI.getComponent(DIALOG_LABEL_ID);
	_LABEL.setText(stringToDisplay);
	_GUI.update(_PLAYER);

	//controlling sounds
	//log(stringToDisplay.length % frequency);
	if (stringToDisplay.length % frequency == 0) {
		if (makePredictable) {
			var hashCode = splitDialogs[currentSplit].charAt(stringToDisplay.length).hashCode();
			var predictableIndex;
			if (numberOfSounds == 1) {
				predictableIndex = "";
			} else {
				//log("picked sound number: " + (hashCode % numberOfSounds + 1));
				predictableIndex = hashCode % numberOfSounds + 1;
			}

			var minPitchInt = Math.ceil(minPitch * 100);
			var maxPitchInt = Math.ceil(maxPitch * 100);
			var pitchRangeInt = maxPitchInt - minPitchInt;
			//zero range case
			if (pitchRangeInt != 0) {
				var predictablePitchInt = (hashCode % pitchRangeInt) + minPitchInt;
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
}

/**
 * Displays all the options for the current dialog.
 * @returns void
 */
function showNextOptions() {
	//log("==SHOWING NEXT OPTIONS==");
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
			_HTHREAD.interrupt();
			_LABEL = _GUI.getComponent(DIALOG_LABEL_ID);
			_LABEL.setText(splitDialogs[currentSplit]);

			//set emotion to last one in list
			if(enablePortait && enableEmotions){
				if(emotionPositionMap != {})
					_PORTRAIT.setTexture(emotionPositionMap[Object.keys(emotionPositionMap)[Object.keys(emotionPositionMap).length - 1]]);
			}
			
			if (currentSplit < splitDialogs.length - 1) {
				// not done printing, need to print the next split
				_GUI.addTexturedButton(CONTINUE_GUI_BUTTON_ID, "", -2000, -2000, 4000, 4000, "customnpcs:textures/gui/blank.png");
			} else {
				// done printing, show next options
				showNextOptions();
			}
			break;
		case CONTINUE_GUI_BUTTON_ID:
			_GUI.removeComponent(CONTINUE_GUI_BUTTON_ID);
			_LABEL.setText("");
			currentSplit++;
			if (currentSplit < splitDialogs.length) {
				_HTHREAD = new Thread(new RunDialog());
				_HTHREAD.start();
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
		case COMMAND_OPTIONS_BUTTON_ID:
			//TODO: API Limitation: can't access command from an IDialogOption
			//NpcAPI.executeCommand(_PLAYER.getWorld(), "");
			_PLAYER.closeGui();
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
		if(_NPC.getRole().getDays() == 0){
			serverUtils.sendOpenGui(_PLAYER.getMCEntity(),Java.type("noppes.npcs.constants.EnumGuiType").PlayerFollowerHire,_NPC.getMCEntity());
		} else if(!_NPC.getRole().getGuiDisabled()){
			serverUtils.sendOpenGui(_PLAYER.getMCEntity(),Java.type("noppes.npcs.constants.EnumGuiType").PlayerFollower,_NPC.getMCEntity());
		}
		break;

		case 3: //BANK
		//TODO: Api limitation: instead of opening a generic small bank, it should open the bank that the NPC has been assigned
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
	/**
	log("==CLEARING BUTTONS==");
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
 * Splits a string and makes sure not to chop words up
 * @param {*} str string to split
 * @param {*} l length of each split
 * @returns array of splits
 */
function splitter(str, l) { //l = 426
	var strs = [];
	while (str.length > l) {
		var split = "§r" + str.substring(0, l);
		var formatCount = (split.match(/§/g) || []).length;
		var newLineCount = (split.match(/\r\n|\r|\n/g) || []).length;
		//log("format code count: " + formatCount);
		//log("new line count: " + newLineCount);
		//log("pushing split text: " + split);

		strs.push("§r" + str.substring(0, l + formatCount - (l/7) * newLineCount/2));
		str = str.substring(l + formatCount - (l/7) * newLineCount/2);
	}
	strs.push("§r" + str);
	return strs;
}