# CitrusDialogue
A Minecraft 1.12.2 [CustomNPCs](https://www.curseforge.com/minecraft/mc-mods/custom-npcs) script that completely reworks the dialogue system to a one similar to games like Celeste, Undertale, and Animal Crossing.


## Features
- Fully functional dialogue system similar to games like Celeste, Banjo Kazooie, and Undertale.
- Customizable variables for tweaking how often or which sounds are made, speed of dialogue, pause duration, and more!
- Tagging system for adding pauses or player names
- Ability to skip dialogue by left clicking the dialogue box
- Fully cancellable mid-dialogue.
- Wrap around for dialogue that is too long
- Optional & Customizable NPC portrait


## Demo
soon


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

## Acknowledgements
THANK YOU NOPPES FOR SUCH A ROBUST API, FANTASTIC MOD, AND SUPPORT FOR OLDER VERSIONS!!!!!!!!!
(what a legend.)