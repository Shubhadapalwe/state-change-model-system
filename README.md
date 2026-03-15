# Slideshow Builder
An interactive web application that allows users to upload images, organize them into a customizable album using drag-and-drop, and generate a dynamic slideshow player.

The project also includes an advanced UI customization system, enabling users to move and resize interface buttons, save the layout as JSON, and reload it anytime.

This project demonstrates modern frontend  techniques such as:
	•	Dynamic DOM manipulation
	•	Drag-and-drop interaction
	•	Runtime UI customization
	•	Client-side JSON storage

##  Overview
The Slideshow Builder is a client-side web application built using:
	•	HTML5
	•	CSS3
	•	JavaScript (ES6)
	•	jQuery

It allows users to:
	1.	Upload images
	2.	Arrange them in an album
	3.	Create a slideshow
	4.	Customize UI layout
	5.	Save and load slideshow configurations

The application runs entirely in the browser without requiring a backend server.

## Features
### Image Upload System
Users can load multiple images from their local system.

Key capabilities:
	•	Multi-file image upload
	•	Instant preview rendering
	•	Automatic thumbnail generation
	•	Dynamic image grid display

Images are read using the FileReader API and stored as Data URLs, allowing the application to work completely client-side without a backend server.

## Drag - and - drop Album Builder
The application provides an interactive album builder interface.

Users can:
	•	Drag images from the available image panel
	•	Drop them into album slots
	•	Reorder images inside the album
	•	Swap positions between slots
	•	Remove selected images
	•	Clear the entire album

The drag-and-drop system uses:
	•	HTML5 Drag & Drop API
	•	Custom drag preview (ghost element)
	•	Hover highlighting
	•	Slot validation logic

This provides a smooth and intuitive UI experience similar to professional photo organizers.

## Dynamic SLidshow Generator
After building the album, users can create a slideshow.

Slideshow controls include:
	•	Previous slide
	•	Next slide
	•	Play / Pause slideshow
	•	Adjustable delay timing
	•	Slide counter

Users can configure delay using natural inputs such as:
0.5 sec
2 sec
200 ms
1 min
The system automatically parses the input and converts it into milliseconds.

## Advanced UI Customization System
One of the most powerful features of this application is the runtime UI customization system.

Users can modify the interface layout directly inside the browser.

### Edit UI Mode
When the Edit UI button is clicked:
	•	The application enters UI Editing Mode
	•	Editable buttons show a dotted border
	•	Button interactions are temporarily disabled
	•	UI editing tools become visible

Additional buttons appear:
	•	Apply
	•	Save UI
	•	Load UI

### Move Buttons (Drag layout)
In Edit UI Mode, users can drag buttons and reorder them inside toolbars.

For example:
Before Editing

Load Images
Load JSON
Customize
Make Slideshow

After Editing

Customize
Load Images
Make Slideshow
Load JSON
This allows users to create their own preferred workflow layout.

### Resize Buttons
Each button includes a resize handle.

Users can:
	•	Drag the resize handle
	•	Change button width
	•	Change button height

This demonstrates dynamic runtime CSS manipulation.

### Apply UI Layout
After editing the interface, users click Apply.

This action:
	•	Exits edit mode
	•	Locks button positions
	•	Restores normal application functionality

### Save UI Layout
Users can save the customized layout.

When Save UI is clicked:
	•	The layout configuration is exported as a JSON file
	•	The JSON file stores:
        button order
            button width
            button height
            toolbar layout
This allows the layout to be reused later.

### Load UI Layout
Users can restore a saved layout anytime.

Steps:
	1.	Click Load UI
	2.	Select a saved JSON file
	3.	The interface automatically restores the saved configuration

This enables portable and reusable UI layouts.

### Application Architecture
The application uses a multi-state UI architecture.

There are three main pages:
page 1 :- Image Upload & Preview
page 2 :- Album Builder
page 3:- Slidshow Player
State transitions are controlled by a central state manager.
Example flow:
**Upload Images**
      ↓
**Customize Album**
      ↓
**Generate Slideshow**

### Technologies Used 
Core Technologies
	•	HTML5
	•	CSS3
	•	JavaScript (ES6)
	•	jQuery

### Frontend Engineering Concepts
This project demonstrates:
	•	DOM manipulation
	•	Event handling
	•	Drag-and-drop interactions
	•	State management
	•	Dynamic UI rendering
	•	Client-side data storage
	•	JSON serialization and deserialization
	•	Runtime layout customization

### UI / UX Features
The interface includes modern design elements such as:
	•	Animated gradient backgrounds
	•	Hover interactions
	•	Smooth button animations
	•	Responsive layouts
	•	Drag-and-drop visual feedback

These are implemented using modern CSS3 animations and transitions.

### Project Structure
Slideshow-Builder
│
├── index.html
│   Main application layout
│
├── styles.css
│   UI design, animations and responsive layout
│
├── app.js
│   Core application logic
│   Drag-and-drop system
│   Slideshow engine
│   UI customization engine
│
└── README.md
## Aplication WorkFlow
### Step 1: Load Images
Users upload images using the Load Images button.

Images are read using the FileReader API and stored in memory.

### Step 2:- Build Album
Users organize images in the Album Builder.

Images can be:
	•	dragged
	•	dropped
	•	reordered
	•	removed
### Step 3 :- Generate Slidshow
When Make Slideshow is clicked:
	1.	Album sequence is generated
	2.	Slideshow player starts
	3.	Images transition automatically

### Step 4:- Customize Interface
Users can Custumize that UI:

Click Edit UI
      ↓
Move buttons
Resize buttons
      ↓
Click Apply
      ↓
Save layout as JSON

### Step 5:- Reload Layout
Users can reload saved layouts anytime:
Click Load UI
Select JSON file
Interface restored instantly

## How to Run the Project


**Open Project Folder**

**Launch Application**
index.html
in any modern browser.

The project runs entirely on the client side, so no backend server is required.

## Skills Demonstrated
This project demonstrates practical skills in:
	•	Frontend development
	•	Interactive UI design
	•	DOM event management
	•	Drag-and-drop systems
	•	Runtime UI customization
	•	Client-side data persistence
	•	JSON data handling
	•	Responsive design

##  Authors
Shubhada Palwe
MSc Computer Science

Samruddhi Kolge
MSc Computer Science





