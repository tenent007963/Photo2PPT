# **InstaPhoto**
Customized platform to create powerpoint files in a simple way.


# Features:
- Take photos from Client-side(phone) and immediately send it to Server-side(PC)
- Integrated PPTXGenJS function to easily create PPT files
- Directly paste photos from clipboard using Ctrl+V
- Thumbnail preview to track added photos 
- Multiple workspaces for multi-user scenario
- Support hotkeys
- Support drag-n-drop image files
- Predefined common file name prefix to easily label image files
- Dual mode (CS / Tech)


# How to deploy:

!!! IN PROGRESS !!!
Local Environment: 
 1. Clone this repo : `git clone tenent007963/Photo2PPT` 
 2. Run `npm install` for dependencies installations (Use `npm install -force` if necessary)
 3. Install postgres from https://www.postgresql.org/download/ and setup postgres database, note down the credentials
 4. Define DATABASE_URL with credentials inside, e.g `$env:DATABASE_URL = "postgres://postgres:postgres@localhost:5432/postgres"` on PowerShell
 5. Start with `npm start` in console

On Heroku: 
 1. Clone this repo
 2. Install Heroku Postgres add-on
 3. Start up the dyno app


# How to use:

!!! IN PROGRESS !!!
1. Goto https://instaphoto.gq on PC and phone
2. On PC, select `PC - SIDE`, then select your role
3. On phone, select `PHONE - SIDE`, wait for the page to load up a QR scanner
4. Use the QR scanner to scan the QR code that shows on PC

[CS Mode demo video](https://youtu.be/rvji88DFuSM)
[Tech Mode demo video](https://youtu.be/9MBMMFiP4mQ)


# Hotkeys:

`x`: Enable / Create PPT file\
`Ctrl + Shift + z`: Disable / Discard PPT file\
`` ` ``: Toggle SaveImage\
`Enter`: Save PPT file (For more than 1 photo)


# To-Do:
 0. Make the whole damn code async and simplify the heck out of it
 1. Host side ping check for server side status
 2. To use local SQLite file instead of spinning up new database
 3. P2P encryption for security enhancement
 4. Implement https://jam.dev/
