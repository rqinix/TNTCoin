<div align="center">

![pack_icon](./BP/pack_icon.png)

# TNT Coin

Experience the Minecraft TNT Challenge with TNT Coin!

![license](https://img.shields.io/github/license/rqinix/TNTCoin?color=lightgreen&logo=open-source-initiative)
![release](https://img.shields.io/github/v/release/rqinix/TNTCoin?color=purple&logo=github)
![downloads](https://img.shields.io/github/downloads/rqinix/TNTCoin/total?color=brightgreen&logo=github)

</div>

TNT Coin is a Minecraft BE/PE add-on designed to make it easy for players to set up and run the Minecraft TNT Challenge. This challenge, popularized on TikTok live streams, involves players trying to fill a structure with blocks while viewers send virtual gifts that spawn TNT, causing chaos and destruction.

# Overview

- **[🌟 Core Features](#-core-features)**
  - [Save, Load, and Reload Game State](#save-load-and-reload-game-state)
  - [Graphical User Interface (GUI)](#graphical-user-interface-gui)
  - [Structure Creation](#structure-creation)
  - [Gift Goal](#gift-goal)
  - [Events](#events)
  - [Event Actions](#event-actions)
  - [Countdown](#countdown)
  - [Timer](#timer)
  - [Summon Entities](#summon-entities)
  - [Settings](#settings)
  - [Barrier Generation](#barrier-generation)
  - [Block Filling](#block-filling)
  - [Clearing Blocks](#clearing-blocks)
  - [Randomized Block Placement](#randomized-block-placement)
- **[Adding Custom Sounds](#adding-custom-sounds)**
- **[Adding Images or Gifts](#adding-images-or-gifts)**
- **[TikTok Gifts Emoji](#tiktok-gifts-emoji)**
- **[Download](#download)**
- **[Bridging TikTok Live and Minecraft with TikTokLiveMCBE](#bridging-your-tiktok-live-and-minecraft-with-tiktoklivemcbe)**
- **[Contributing](#contributing)**
- **[License](#license)**

## 🌟 Core Features

### Save, Load, and Reload Game State

### Graphical User Interface (GUI)

- Simply open your inventory, navigate to the Items tab, and search for "TNT Coin", and right click to open the GUI.

![img2](./docs/images/image_2.png)

![img3](./docs/images/image_3.png)

### Structure Creation

- Players can select the base and side block types for the structure.
- The width and height of the structure can be customized.

![TNT Coin Structure Configuration](./docs/images/image_1.png)

![TNT Coin Structure](./docs/images/structure.png)

### Gift Goal

The Gift Goal System in TNT Coin allows you to set specific gift targets for your live stream.

- Choose from available gifts with emojis, set the desired target count, and toggle the display on or off as needed.
- To enable live tracking of gift goals, connect your Minecraft world to [TikTokLiveMCBE](https://github.com/rqinix/TikTokLiveMCBE), a WebSocket server. This connection ensures that as viewers send gifts during your TikTok live stream, the progress towards the goal is updated on the action bar.

![Gift Goal Settings](./docs/images/gift_goal_settings.png)

![Gift Goal Actionbar](./docs/images/gift_goal_actionbar.png)

### Events

- The game listens for specific script events (e.g., `tntcoin:join`) received from the WebSocket server.
- Players can enable or disable specific event actions.

![TikTok Events](./docs/images/events.png)

### Event Actions

Players can assign custom actions (e.g., **Summon**, **Fill**, **Clear Blocks**, **Play Sound**, **Screen Title**, **Screen Subtitle**) to specific events, such as receiving a gift or a follow.

![Event Actions Button](./docs/images/event-actions-button.png)

![Event Actions](./docs/images/event-actions.png)

### Countdown

- When the structure is completely filled, a countdown begins. The countdown determines if the player wins the round.
- During the countdown, the player’s camera can be configured to rotate around the structure.
- Players can also configure the starting point of the countdown. Once the countdown ends, the player wins the round.

### Timer

- Players can start, stop, and restart at any time.
- Players can configure the timer’s duration.
- If you run out of time, you will LOSE!
- The timer can be displayed on the action bar.

![Timer Actionbar](./docs/images/timer.png)

### Summon Entities

- Summon any entities within the structure.
- Summon TNT

### Settings

![Game Settings](./docs/images/settings.png)

### Barrier Generation

- Enable/Disable Barriers in settings.

![Barriers](./docs/images/barriers.png)

### Block Filling

- Players can specify which block type should be used for filling in settings.
- Players can start and stop the block filling process at any time.
- Players can modify the speed of filling process in settings.

### Clearing Blocks

### Randomized Block Placement

- This feature allows players to place a random block from a predefined list whenever they use a specific item in the game.
- Update the `RANDOM_BLOCK_ITEM` to the desired item ID.
- Modify the `BLOCKS` array from `scripts/config/config.js` file to include any block IDs you want to be randomly selected when the specified `RANDOM_BLOCK_ITEM` is used.

```ts
/**
 * The item that will be used to place random block.
 */
export const RANDOM_BLOCK_ITEM = 'minecraft:amethyst_block';

/**
 * List of possible blocks when placing random blocks.
 */
export const BLOCKS = [
    "minecraft:pink_wool",
    "minecraft:magenta_wool",
    "minecraft:orange_wool",
    "minecraft:lime_wool",
    "minecraft:yellow_wool",
    // ... add more blocks here`
];
```

## Adding Custom Sounds

To add custom sounds, ensure your files are in `.ogg` format and place them in your **resource pack** in your desired directory (e.g., `sounds/meme/`). Then, define them in the `sounds/sound_definitions.json` file.

Below is an example of how to structure your custom sounds:

```json
{

  "vine_boom": {
      "category": "meme",
      "sounds": ["sounds/meme/vine_boom"]
  },

  "your_custom_sound": {
      "sounds": ["path/to/your/sound"]
  }

}
```

## Adding Images or Gifts

To add new images or gifts to your screen, place your image files (e.g., `gift-new.png`, `360px x 360px`) in the `textures/tnt-coin/gifts/` folder.

After adding your images, reference them in the `gifts.json` file located in the `ui/` folder. This file controls how the images are displayed on the screen.

Each gift occupies `10%` of the total width, allowing a maximum of 10 gifts to be displayed horizontally at once.

```json
{
  "namespace": "gifts",

  "stack_panel": {
    "type": "stack_panel",
    "orientation": "horizontal",
    "size": ["100%", "100%"],
    "controls": [

      {
        "gift_1@gifts.template": {
          "texture": "textures/tnt-coin/gifts/20241129_113143.png"
        }
      },

      {
        "MY_GIFT@gifts.template": {
          "texture": "textures/tnt-coin/gifts/20241129_113143.png"
        }
      }

    ]
  },

  "template": {
    "type": "image",
    "size": ["10%", "100%"],
    "layer": 1,
    "texture": ""
  }
}
```

## TikTok Gifts Emoji

![TikTok Gifts](./RP/font/glyph_E3.png)

Below are some of the TikTok gifts that have emoji. Each gift comes with its own emoji and coin value. 

| Gift Name                 | Emoji | Coins |
|---------------------------|-------|-------|
| Gimme The Vote            |      | 1     |
| Community Fest            |      | 1     |
| Music Play                |      | 1     |
| GG                        |      | 1     |
| Ice Cream Cone            |      | 1     |
| Rose                      |      | 1     |
| TikTok                    |      | 1     |
| Thumbs Up                 |      | 1     |
| Heart                     |      | 1     |
| Cake Slice                |      | 1     |
| Love you                  |      | 1     |
| Football                  |      | 1     |
| Rainbow                   |      | 1     |
| Flame heart               |      | 1     |
| Birthday Cake             |      | 1     |
| Heart Puff                |      | 1     |
| Heart Me                  |      | 1     |
| Team Bracelet             |      | 2     |
| Finger Heart              |      | 5     |
| Potato                    |      | 5     |
| Smart                     |      | 5     |
| Ladybug                   |      | 5     |
| Tofu                      |      | 5     |
| Applause                  |      | 9     |
| Cheer You Up              |      | 9     |
| Friendship Necklace       |      | 10    |
| Rosa                      |      | 10    |
| Tiny Diny                 |      | 10    |
| ASMR Time                 |      | 10    |
| Horseshoe                 |      | 10    |
| Cherry Blossom Bunny      |      | 10    |
| Perfume                   |      | 20    |
| Doughnut                  |      | 30    |
| Sign language love        |      | 49    |
| Butterfly                 |      | 88    |
| Family                    |      | 90    |
| Sending strength          |      | 90    |
| Fist bump                 |      | 90    |
| Paper Crane               |      | 99    |
| Little Crown              |      | 99    |
| Cap                       |      | 99    |
| Hat and Mustache          |      | 99    |
| Honorable Person          |      | 99    |
| Breakthrough Star         |      | 99    |
| Kiss your Heart           |      | 99    |
| Hot Shot                  |      | 99    |
| Guitar                    |      | 99    |
| Like-Pop                  |      | 99    |
| Birthday Crown            |      | 99    |
| Self care mask            |      | 99    |
| Community Crown           |      | 99    |
| Star                      |      | 99    |
| Confetti                  |      | 100   |
| Hand Hearts               |      | 100   |
| Hand Heart                |      | 100   |
| Bear love                 |      | 100   |
| Marvelous Confetti        |      | 100   |
| Socks and Sandals         |       | 150   |
| Sunglasses                |      | 199   |
| Hearts                    |      | 199   |
| Lock and Key              |      | 199   |
| Garland Headpiece         |      | 199   |
| Love You                  |      | 199   |
| Cheer For You             |      | 199   |
| Jungle Hat                |      | 199   |
| Goalkeeper Save           |      | 199   |
| Sending positivity        |      | 199   |
| Meerkat                   |      | 199   |
| Birthday Glasses          |      | 199   |
| Stinging Bee              |      | 199   |
| Massage for You           |      | 199   |
| Pinch Face                |      | 249   |
| Boxing Gloves             |      | 299   |
| Duck                      |      | 299   |
| Corgi                     |      | 299   |
| Dash                      |      | 299   |
| Superpower                |      | 299   |
| Elephant trunk            |      | 299   |
| TikTok Crown              |      | 299   |
| Fruit Friends             |      | 299   |
| Play for you              |      | 299   |

## Download

> [!IMPORTANT]
>
> **Requirement:** Enable "Beta APIs" in your world settings for this add-on to function correctly.
>
> **Version:** This add-on is designed for Minecraft BE/PE version **1.21.22+**. Ensure your game is updated to this version or later for the best experience.

**_Show your support by giving it a ⭐!_**

- [Download TNT Coin](https://github.com/rqinix/TNTCoin/releases)

> **Note:** After importing the TNT Coin Resource Pack and Behavior Pack into Minecraft, move them from the `resource_packs` and `behavior_packs` folders to the `development_resource_packs` and `development_behavior_packs` folders inside the `com.mojang` directory. This step ensures that any changes or modifications you make to the TNT Coin packs are applied globally.

## Bridging your TikTok Live and Minecraft with TikTokLiveMCBE

If you want to connect your TikTok live stream to Minecraft and trigger in-game actions like automatically dropping TNT when someone sends a gift you'll need to set up a WebSocket server. 

See here: [TikTokLiveMCBE](https://github.com/rqinix/TikTokLiveMCBE)

## Contributing

Feel free to contribute by submitting issues or pull requests. Any improvements or new features are welcome!

## License

This project is licensed under the terms of the [MIT License](./LICENSE).
