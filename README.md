# [OwnGame](https://en.ogame.gameforge.com/)

This project is a reconstruction of the server for the game called [Ogame](https://en.ogame.gameforge.com/), a popular browser-based multiplayer real-time online strategy game with a theme of spaceships and future technologies. In this game, each player starts with a planet and can expand their colony by conquering other planets, gaining valuable resources, building fleets, and engaging in battles against other players.

The original game is owned by Gameforge, and this project is exclusively for educational purposes. Built upon version *7.1.0-rc16*, the project not only remakes the existing framework but also introduces enhancements such as new buildings and an improved user interface to elevate the overall gaming experience.

![Overview of Player](public/Imagenes/Scrennshots/Screenshot_Overview.png?raw=true "Overview")

## Implementation

The technologies that this project relies on are the following:
* **Node.js**: The entire application is in JavaScript.
* **MongoDB**: The database that saves all user data in the game.
* **Express**: The framework for server development.
* **Pug**: Chosen as the View Template Engine for its simplicity.

The main idea of this stack is to make the structure of the project simple, minimal, readable, and, at the same time, easy to edit and make modifications.

# Instalation

In order to install this project, you need to install [Node.js](https://nodejs.org/en/download) and [MongoDB](https://www.mongodb.com/docs/manual/installation/) in your system. Then clone this repo with the command:

```shell script
git clone https://github.com/darioturco/OwnGame.git
```

Then enter the directory and create the .env file with the commands:

```shell script
cd ./OwnGame
echo $'MONGO_URL=mongodb://localhost:27017/\nUNIVERSE_NAME=Universo1\nJUGADORES=jugadores\nPLANETAS=universo\nPLAYER=dturco' > .env
```

Afterward, you need to install the dependencies described in the package.json and then start the application (assuming the database **daemon is active**).
To do that, just run the following commands:

```shell script
npm install
npm run start 
```

Finally, you can connect to the server by opening your browser and entering http://localhost:3000. You can customize the port used by the app by adding the variable `PORT` in the `.env` file. If you don't, the default port used is _3000_.

# How to use it

Initially, the data is going to be empty, that means you have an empty universe. In order to create some players in the universe, you need to uncomment lines 28 and 29 (`uni.createUniverse` and `uni.addPlayer`). Then go to the developer route (http://localhost:3000/), and the code will be executed, creating the universe and a player.

After that, you can go to the route http://localhost:3000/Ogame_Overview.html to play as the recently created player. Also, you can modify the resources of the planet, add planets to a player, or even add a moon with custom buildings by uncommenting functions of the developing route.

**Now you can play and have fun!!!**

Here are some screenshots of the game and the new elements that this has, especially in the moon section where some new buildings were added:


![Overview of Player](public/Imagenes/Scrennshots/Screenshot_Resources.png?raw=true "Overview")

![Overview of Player](public/Imagenes/Scrennshots/Screenshot_Galaxy.png?raw=true "Overview")

![Overview of Player](public/Imagenes/Scrennshots/Screenshot_Moon.png?raw=true "Overview")

# Documentation

The detailed documentation of this project is in the PDF file called document.pdf. In that documentation, the API provided, the server information, and all functions that this application provides are explained in detail.

You can also find more information about the original game on its wiki page: [OgameWiki](http://wiki.ogame.org/index.php?title=Main_Page/en&setlang=en)