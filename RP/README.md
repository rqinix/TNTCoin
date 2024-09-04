# TNT Coin Resource Pack

## Download

- [Download TNT Coin Resource Pack](https://github.com/rqinix/BP-TNT-Coin/releases/tag/v0.1.0)

## Add Custom Sounds

- Ensure your sounds are in `.ogg` format and place them in your resource pack under the appropriate directory (e.g., `sounds/meme/`).

To add custom sounds, place your `.ogg` files in the appropriate folder and then define them in the `sounds/sound_definitions.json` file. Below is an example of how to structure your custom sounds:

```json
{
    "vine_boom": {
        "category": "meme",
        "sounds": ["sounds/meme/vine_boom"]
    },

    "your_custom_sound": {
        "sounds": [
            "path/to/your/sound"
        ]
    }
}
```

## Add Images or Gifts

To add new images or gifts to your screen is to place your image files (e.g., `gift-new.png`) in the `textures/tnt-coin/gifts/` folder.

Once your images are in place, you need to reference them in the `gifts.json` file located in the `ui/` folder. This file defines how the images will be displayed in your screen.

- Each gift takes up 10% of the total width, as defined in the `template`. you can display a maximum of 10 gifts horizontally at once.

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
          "texture": "textures/tnt-coin/gifts/gift-rose.png"
        }
      },

      {
        "MY_GIFT@gifts.template": {
          "texture": "textures/tnt-coin/gifts/MY-GIFT.png"
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

![TikTok Gifts](./font/glyph_E3.png)

Below are some of the TikTok gifts that are available. Each gift comes with its own icon and coin value. 

| Gift Name                 | Icon  | Coins |
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
