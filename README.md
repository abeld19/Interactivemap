# Interactive Map Project

## Overview
The Interactive Map project is a web application designed to allow users to log, view, and interact with wildlife sightings in a nature reserve. The platform integrates user authentication, image classification, and an interactive map interface to enhance user engagement. It is built using Node.js, Express, MySQL, and EJS templates, with additional support for AI-powered species identification using Hugging Face.

## Features
- **User Authentication**: Secure registration, login, and session management using Passport.js.
- **Interactive Map**: Leaflet-based map with points of interest and user-submitted sightings.
- **Log Sightings**: Users can log sightings with GPS coordinates, descriptions, and images.
- **Image Classification**: AI-powered species identification using Hugging Face.
- **Sighting**: View all logged sightings, like/unlike posts, and add comments.
- **Contact Form**: Users can send feedback to administrators.
- **Responsive Design**: Mobile-first design with media queries for larger screens.

## Prerequisites
To run this project, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v20 LTS recommended)
- [MySQL](https://www.mysql.com/) (v8 or higher)
- [Python](https://www.python.org/) (v3.10 or higher)
- [Git](https://git-scm.com/)

## Installation
Follow these steps to set up and run the project:

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Interactivemap
```

### 2. Install Node.js Dependencies
```bash
npm install
```

### 3. Set Up Python Environment
- Navigate to the `myenv1` directory:
```bash
cd myenv1
```
- Activate the virtual environment:
```bash
source bin/activate
```
- Install required Python packages:
```bash
pip install -r requirements.txt
```

### 4. Configure MySQL Database
- Create the database and tables:
```bash
mysql -u root -p < create_db.sql
```
- Insert test data (optional):
```bash
mysql -u root -p < insert_test_data.sql
```
- Update the `db.js` file with your MySQL credentials if necessary.

### 5. Set Up Environment Variables
- Create a `.env` file in the project root and add the following:
```
HUGGING_FACE_API_KEY=<your-hugging-face-api-key>
```

### 6. Start the Server
- Run the server:
```bash
npm start
```
- The application will be available at `http://localhost:8000`.

## Usage
1. **Register**: Create a new account.
2. **Login**: Log in to access the interactive map and gallery.
3. **Log a Sighting**: Navigate to the "Log a New Sighting" section, select coordinates, upload an image, and submit details.
4. **View Sighting**: Browse all sightings, like/unlike posts, and add comments.
5. **Contact Admin**: Use the contact form to send feedback.

## Project Structure
```
/                 Application root
|-- index.js               Express entry point
|-- db.js                  MySQL connection pool
|-- upload.js              Multer wrapper for file uploads
|-- imageClassifier.js     Image classification logic
|-- classify.py            Python script for image classification
|-- create_db.sql          SQL script to create the database schema
|-- insert_test_data.sql   SQL script to insert test data
|-- config/                Configuration files
|   |-- passport.js        Passport.js configuration
|-- middleware/            Custom middleware
|   |-- auth.js            Authentication middleware
|-- models/                Database models
|   |-- comment.js         Comment model
|   |-- like.js            Like model
|   |-- models.js          General models
|   |-- userModel.js       User model
|-- routes/                Route handlers
|   |-- user.js            User-related routes
|-- views/                 EJS templates
|-- public/                Static assets
|   |-- css/               Stylesheets
|   |-- images/            Image assets
|   |-- uploads/           User-uploaded images
```

## Testing
### Unit Testing
- Use Jest and Supertest for testing API endpoints and middleware.
- Example:
```bash
npm test
```

### Functional Testing
- Verify workflows such as registration, login, logging sightings, and gallery interactions.

## Security
- **Input Sanitization**: `express-sanitizer` strips dangerous HTML from user inputs.
- **Password Hashing**: `bcrypt` hashes passwords before storage.
- **SQL Injection Defense**: Parameterized queries with `mysql2` prevent SQL injection.

## Known Issues
- Ensure the Hugging Face API key is valid and has sufficient permissions.
- Large image uploads may cause delays; ensure the file size is within the 10MB limit.


## Contributors
- Abel Daniel - Developer

## Acknowledgments
- [Leaflet.js](https://leafletjs.com/) for the interactive map.
- [Hugging Face](https://huggingface.co/) for AI-powered image classification.
- [EJS](https://ejs.co/) for server-side rendering.

---
Feel free to reach out for any questions or contributions!