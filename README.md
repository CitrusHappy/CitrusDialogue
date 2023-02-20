# CitrusDialogue
A Minecraft 1.12.2 [CustomNPCs](https://www.curseforge.com/minecraft/mc-mods/custom-npcs) script that completely reworks the dialogue system to a one similar to games like Celeste, Undertale, and Animal Crossing. Made specifically for my upcoming modpack [Peculicraft](https://discord.gg/5UtE3Sw6Pe) but free for use.


## Features
- Fully functional dialogue system similar to games like Celeste, Banjo Kazooie, and Undertale.
- Customizable variables for tweaking how often or which sounds are made, speed of dialogue, pause duration, and more!
- Tagging system for adding pauses or player names
- Ability to skip dialogue by left clicking the dialogue box
- Fully cancellable at any time.
- Optional & Customizable NPC portrait
- Emotion system for changing portraits mid-dialogue.
- Respects the availability of quests and options
- Wrap around for dialogue that is too long


## Demo
<iframe width="560" height="315"
src="https://www.youtube.com/embed/xp8QxmwI3sQ" 
frameborder="0" 
allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" 
allowfullscreen></iframe>


## F.A.Q
### How do I add pauses in between dialogue text?
To add pauses in the displaying of dialogue, simply add a ``{pause}`` tag anywhere in the dialog text in the NPC editor!

### How do I make the NPC say the player's name inside the chat box?
To make the NPC repeat the player's name, simply add the ``{player}`` tag anywhere in the dialog text in the NPC editor!

### How do I add a portrait for an NPC?
To add a portrait, put an image with the NPC's exact name inside the ``customnpcs\assets\customnpcs\textures\npc\portrait\`` folder, then set ``enablePortait`` to true in the script file! 
- Make sure the image file is a w:98 x h:98 .png file or it will not display properly.
(you can also choose a custom image path, if desired.)

![defaultportrait](/customnpcs/assets/customnpcs/textures/npc/portrait/default.png)

### How do I change emotion mid dialog?
First set ``enableEmotions`` to true.
If the NPC's name is peter and there is a ``{happy}`` tag in the dialog text, this will change the portrait to the image in the path ``customnpcs:textures/npc/portrait/peter/happy.png``.

### How do I add/remove faction points at the start of a dialog?
If you wish to distribute faction points at the beginning of a dialog, don't set it in the NPC editor. Instead do the following:
At the beginning of the dialog text, add ``{faction:FACTION_ID:AMOUNT}``. example ``{faction:0:+10}``
Supports multiple faction tags.

### How do I play a sound at the start if a dialog?
If you wish to play a sound at the beginning, don't set it in the NPC editor. Instead do the following:
At the beginning of the dialog text, add ``{sound:SOUND_PATH}``. example ``{sound:customnpcs:talk1}``
Supports multiple sound tags.

### How do I change availability, command execution, and quest distribution of a dialog?
Simply edit them using the NPC tool in game!



## Acknowledgements 
THANK YOU NOPPES FOR SUCH A ROBUST API, FANTASTIC MOD, AND SUPPORT FOR OLDER VERSIONS!!!!!!!!!
(what a legend.)
