# PlaceNL Bot (English)

The bot for PlaceNL and their allies! This bot connects with the [command server](https://github.com/PlaceNL/Commando) and gets it's orders from there. You can see the orderhistory [here](https://placenl.noahvdaa.me/).
This bot is made to work with an r/place alternative https://rplace.tk/

## User script bot

### Installation instructions

before you start, make sure your cooldown has run out!

1. Install the [Tampermonkey](https://www.tampermonkey.net/) browserextention.
2. Click on this link: [https://github.com/stef1904berg/rplace-tk-bot/raw/master/rplace-tk-bot.user.js](https://github.com/stef1904berg/rplace-tk-bot/raw/master/rplace-tk-bot.user.js). If everything went well you'll see Tampermonkey ask you to add it. Click **Install**.
3. Reload your **r/place** tab. If everything went well, you'll see "Connecting with rplace.tk server" in the top right of your screen. The bot is now active, You'll be able to see what the bot is doing through these messages.

## Headless bot

### Installation instructions

1. Install [NodeJS](https://nodejs.org/).
2. Download the bot via [this link](https://github.com/stef1904berg/rPlaceTKBot/archive/refs/heads/master.zip).
3. Extract the bot anywhere on your desktop
4. Open a command prompt/terminal in this folder
    Windows: Shift+right mousebutton in the folder -> Click on "open Powershell here"
    
    Mac: No clue, sorry!
    
    Linux: Is this necessary?
5. install the dependencies: `npm i`
6. execute the bot `node bot.js <commando server domain without https://>`

As far as I know, only 1 bot can be used per IP address

# Docker alternative


This option is mostly useful for people who are already using docker.


It has been confirmed to run on x64(average desktop computer) and armv7(raspberry pi), but it should also be able to run on arm64(new apple computers).


1. Install [Docker](https://docs.docker.com/get-docker/)

2. Run this command: `docker run --pull=always --restart unless-stopped -d ghcr.io/stef1904berg/rplace-tk-bot <commando server domain without https://>`

-----