# **InstaPhoto**
Aim to let users send freshly taken photos to computer easily.


# Features:
- Take photos from Client-side and instantly shows up on Server-side
- Intergrated PPTXGenJS function
- Easily paste clipboard photo using Ctrl+V
- Thubnail preview for newly added photos 
- Multiple workspace for multiuser scenario (WIP)
- Support hotkeys and remote controlling (WIP)

# How to use:

Simply clone this repo and run `npm install` in console.
To start run `npm start` in console

For Heroku:
Just clone this repo and its now ready to go. 

# Hotkeys:

`x`: Enable / Create PPT file 
`Ctrl + Shift + X`: Disable / Discard PPT file
`\``: Toggle SaveImage
`Enter`: Save PPT file if enabled


# To-Do:
 1. Adding more features / plugins
	a. image compressing if exceed specific size
	b. multiroom through generate / scan qr
 2. Better UI for client side
 3. Server side : Replace initialization screen to mode selection ( CS, Tech, PDF)
 4. Auto lock room from host side to prevent multiple server connected same room
 5. Implement cookie usage for client side to remember last room name
 6. Image rotation for portrait photos
 7. Async photo uploading to prevent overlap
 99. Simplify code
