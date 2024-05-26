Ian Wallace
CMPM 130
26 May 2024

A Phaser 3 code framework for creating a bare-bones 2D platformer game.

Visual assets provided by Kenney Assets [Pixel Platformer](https://kenney.nl/assets/pixel-platformer) asset pack and Industrial Expansion asset pack with gratitude. 
Audio asset provided by Kenney Assets Impact Audio asset pack, same.

Despite my best efforts, I couldn't convince Phaser to register any collision with the acid or the bottom of the screen.  No collision means no kill trigger, means collecting lives (represented by the hearts) is irrelevant.
Can still do that, though.  Even does what it's supposed to, though there's no feedback on how many you have.

Blocked off the acid so the player can't get stuck under the map.  The long pit was a major offender in this regard.

Click for audio on life pickup.

Left/Right arrows for movement, up for jump, 'R' for manual restart