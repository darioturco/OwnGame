# [OwnGame](https://en.ogame.gameforge.com/)

This project is a reconstruction of the server for the game called [Ogame](https://en.ogame.gameforge.com/), a popular browser-based multiplayer real-time online strategy game with a theme of spaceships and future technologies. In this game, each player starts with a planet and can expand their colony by conquering other planets, gaining valuable resources, building fleets, and engaging in battles against other players.

The original game is owned by Gameforge, and this project is exclusively for educational purposes. Built upon version *7.1.0-rc16*, the project not only remakes the existing framework but also introduces enhancements such as new buildings and an improved user interface to elevate the overall gaming experience.

# Implementation

The technologies that this proyecet relies on, are the following:
* **Node.js**: All the application is in JavaScript
* **MongoDB**: The Data Base that save all the data of users in the game.
* **Express**: The framework for 
* **Pug**: is Chosen as the View Template Engine for his simplicity.

The main idea of this stack is to make simple, minimal and redeable all the strucure of the proyecy and at the same time easy to edit and make modifications.

# Instalation

In order to install this proyect you nid to install in your sistem [Node.js](https://nodejs.org/en/download) and [MongoDB](https://www.mongodb.com/docs/manual/installation/). Then clone this repo with this command:

```shell script
git clone https://github.com/darioturco/OwnGame.git
```

Finaly, you need to install the dependences described in the package.json and then start the application (assuming the data base deamon is active).
To do that just run the following commands:

```shell script
npm install
npx start
```



# How to use it

Using it dhaaa



# Documentation

The detailed documentation of this proyect is in the pdf file called document.pdf
In that documentation is explained in detail the aPI provided, the server information and all function that this application provide.

Also you can find more information of the original game in his wiki page: [OgameWiki](http://wiki.ogame.org/index.php?title=Main_Page/en&setlang=en)