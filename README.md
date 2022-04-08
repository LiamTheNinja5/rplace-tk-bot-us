**NEDERLANDSE VERSIE ONDERAAN DE PAGINA**

# PlaceNL Bot (English)

The bot for PlaceNL and their allies! This bot connects with the [command server](https://github.com/PlaceNL/Commando) and gets it's orders from there. You can see the orderhistory [here](https://placenl.noahvdaa.me/).
This bot is made to work with an r/place alternative https://rplace.tk/
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

As far as i know, only 1 bot can be used per IP address

[//]: # (# Docker alternative)

[//]: # ()
[//]: # (This option is mostly useful for people who are already using docker.)

[//]: # ()
[//]: # (It has been confirmed to run on x64&#40;average desktop computer&#41; and armv7&#40;raspberry pi&#41;, but it should also be able to run on arm64&#40;new apple computers&#41;.)

[//]: # ()
[//]: # (1. Install [Docker]&#40;https://docs.docker.com/get-docker/&#41;)

[//]: # (2. Run this command: `docker run --pull=always --restart unless-stopped -it ghcr.io/placenl/placenl-bot <commando server domain without https://>`)

[//]: # ()
[//]: # (-----)