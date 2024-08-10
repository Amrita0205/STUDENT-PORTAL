const express = require('express');
const app = express();
const path = require('path');
const port = 7700;
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config(); //doteenv we gnerally use for security purposes
const collection = require("./mongodb");
const Task = require('./planner_mongo');
const Announcement = require('./announcement_mongo');
const Event = require('./events_mongo');
const Ebooks = require('./e-book_mongo');
const Leaderboard = require('./leaderboard_mongo');
const Contact = require('./email_mongo');
const chat = require('./chat_mongo');
const multer = require('multer');// acts as a middle ware for uploading images
const bcrypt = require('bcrypt'); //we require the modules
const saltRounds = 10; //This does the salting also adding some random string that goes through 2^10 rounds
//varaibles to pass them inside the ejs during rendering
const session = require("express-session");
const { SESSION_SECRET } = process.env;

app.use(session({ secret: SESSION_SECRET }));

const auth = require("./auth"); 

var globalName;
var globalbatch;
var globalemail;
var globalplace;
var globalrole;
var globalbio;
var globalspeciality;
var globaldescription;
var globalimage;

/*app.get,app.use, app.post are some methods in express*/

//this is for my app configuration
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//for using things in the public folder // that are static
app.use(express.static(path.join(__dirname, 'public')));

//set the Template engines
app.set('views', 'views'); // from your views directory 
app.set('view engine', 'ejs'); // that template engine

//creating the routes
app.get("/", auth.isLogout, (req, res) => {  //this is my default path
    return res.render("main");
});

app.get("/login", auth.isLogout , (req, res) => { //creating the route for user login page
    return res.render("login");
});
app.get("/adminlogin", auth.isLogout , (req, res) => { //creating the route for admin login page
    return res.render("admin/adminlogin");
});




app.get("/register", auth.isLogout, (req, res) => {
    return res.render("register");
});

// -----For image storing ------------------------------------------------------
// Set up Multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "../backend/public/images")); // Destination folder for storing uploaded files
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Use original filename for storing the file
        //there can be same name but different files so we differentiate them based on their date
    }

});

// Create a Multer instance with specified storage options
const upload = multer({ storage: storage });


// for  the working of the registration and  login --POST requests handling
//registration is the same for user and admin
app.post("/register", upload.single('profilePicture'), async (req, res) => {
    try {
        const { name, email, password, batch, place, role, bio, speciality, description } = req.body;

        console.log("regstered password:", password);

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).send("Name, email, and password are required.");
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);

        console.log("The hashed pass:", hashedPassword);

        const newUser = new collection({
            name,
            email,
            batch,
            password: hashedPassword,
            place,
            role,
            bio,
            speciality,
            description,
            profilePicture: 'images/' + req.file.filename,
            isBlock: false
        });
        //    profilePicture:req.file ? 'images/' + req.file.filename : '',});
        await newUser.save();
        return res.render("login", { message: "Registration successful. Please log in." }); //this message gets displayed on successful register only
    } catch (error) {
        console.error("Error during registration:", error);
        return res.render('login', { message: 'Registration failed' });
    }
});

app.post("/api/login", async (req, res) => { //this is for the user login only he can login not the admin
    try {
        const user = await collection.findOne({ email: req.body.email }); //that email and all are the ones in the form 

        if (!user) {
            return res.render("login", { error: "Invalid username or password." });
        }
        console.log("Entered password:", req.body.password);
        console.log("Stored hashed password:", user.password);

        const isPasswordMatch = await bcrypt.compare(req.body.password, user.password); //bcrypt.compare() method automatically converts our password into hash and compares it with the user's hashed password

        console.log("Password match result:", isPasswordMatch);
       
        if(user.role==='user'){ 
           
        if (isPasswordMatch && user) {
            // Store user information in session upon successful login
            req.session.user = {
                name: user.name,
                email: user.email
            };

            console.log(req.body);
            globalName = req.body.name; //on logging in it will remember so we can equate it 
            globalemail = req.body.email;
            return res.render("home", { globalName: user.name, globalrole: user.role });
        } else {
            return res.render("login", { message: "Invalid username or password." });
        }
    }else{

        return res.render("login", { message: "You are not a student" });
    } 
} catch (error) {
        console.error("Error during login:", error);
        return res.status(500).send("An error occurred during login.");
    }
});

app.post("/admin/login", async (req, res) => { //this is for the admin login only he can login not the 
    try {
        const user = await collection.findOne({ email: req.body.email }); //that email and all are the ones in the form 

        if (!user) {
            return res.render("admin/adminlogin", { error: "Invalid username or password." });
        }
        console.log("Entered password:", req.body.password);
        console.log("Stored hashed password:", user.password);

        const isPasswordMatch = await bcrypt.compare(req.body.password, user.password); //bcrypt.compare() method automatically converts our password into hash and compares it with the user's hashed password
        
        console.log("Password match result:", isPasswordMatch);
        console.log('role',user.role);
       
        if(user.role==='admin'){
        if (isPasswordMatch && user ) {
            // Store user information in session upon successful login
            req.session.user = {
                name: user.name,
                email: user.email
            };

            console.log(req.body);
            globalName = req.body.name; //on logging in it will remember so we can equate it 
            globalemail = req.body.email;
            
            return res.render("home", { globalName: user.name, globalrole: user.role });
           
        }
        else {
            return res.render("admin/adminlogin", { message: "Invalid username or password." });
        }
    }else{

        return res.render("admin/adminlogin", { message: "You are not an admin" });
    } 
    } catch (error) {
        console.error("Error during login:", error);
        return res.status(500).send("An error occurred during login.");
    }
});

app.get('/users', auth.isLogin, async (req, res) => {  //this fetches all the users
    try {
        const users = await collection.find({ _id: { $nin: [req.session.user._id] } });
        return res.render('admin/users', { currentUser: req.session.user, users });
    } catch (error) {
        console.log(error.message);
        return res.status(500).send('Internal Server Error');
    }
});
// Update user details
app.put('/edit/:userId', async (req, res) => {
    const userId = req.params.userId;
    const { name, email } = req.body;

    try {
        const updatedUser = await collection.findByIdAndUpdate(userId, { name, email }, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json(updatedUser);
    } catch (error) {
        console.error('Error updating user details:', error);
        return res.status(500).json({ message: 'Failed to update user details' });
    }
});

// Delete user
app.delete('/users/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        const deletedUser = await collection.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({ message: 'Failed to delete user' });
    }
});
app.put('/users/block/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const { isBlock } = req.body;

        await collection.findByIdAndUpdate(userId, { isBlock });

        return res.status(200).send('User blocked successfully');
    } catch (error) {
        console.error('Error blocking user:', error);
        return res.status(500).send('Failed to block user');
    }
});

// Unblock user route
app.put('/users/unblock/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const { isBlock } = req.body;

        await collection.findByIdAndUpdate(userId, { isBlock });

        res.status(200).send('User unblocked successfully');
    } catch (error) {
        console.error('Error unblocking user:', error);
        res.status(500).send('Failed to unblock user');
    }
});


app.get('/announcement', auth.isLogin, async (req, res) => {
    try {
        // Retrieve user data based on session or any identifier (e.g., email)
        const userEmail = req.session.user.email; // Assuming user email is stored in session
        const user = await collection.findOne({ email: userEmail });

        if (!user) {
            console.error('User not found');
            return res.status(404).send('User not found');
        }

        const globalrole = user.role; // Assuming user role is stored in the user object

        // Render the announcement view with necessary data
        return res.render('subviews/announcement', { globalrole });

    } catch (error) {
        console.error('Error rendering announcement page:', error);
        return res.status(500).send('Internal Server Error');
    }
});
app.post('/announcements/add', auth.isLogin, async (req, res) => {
    const userEmail = req.session.user.email; // Assuming user email is stored in session

    try {
        // Retrieve user data based on email
        const { batch, message } = req.body;
        const user = await collection.findOne({ email: userEmail });

        if (!user) {
            console.error('User not found');
            return res.status(404).send('User not found');
        }

        // Create a new announcement object
        const newAnnouncement = new Announcement({
            batch: batch,
            message: message,
            createdBy: globalName
        });

        // Save the announcement to the database
        await newAnnouncement.save();

        // Retrieve user role for passing to the view
        const globalrole = user.role;
        // Render the announcement view with necessary data
        return res.render('subviews/announcement', { globalrole });

    } catch (error) {
        console.error('Error adding announcement:', error);
        return res.status(500).json({ error: 'Failed to add announcement' });
    }
});


app.post('/announcements/fetch', auth.isLogin, async (req, res) => {
    const { batch } = req.body;

    try {
        // Find announcements for the specified batch
        const announcements = await Announcement.find({ batch });

        return res.status(200).json(announcements);
    } catch (error) {
        console.error('Error fetching announcements:', error);
        return res.status(500).json({ error: 'Failed to fetch announcements' });
    }
});
// Update an existing announcement
app.put('/announcements/update/:announcementId', auth.isLogin, async (req, res) => {
    const { announcementId } = req.params;
    const { batch, message } = req.body;

    try {
        // Find and update the announcement by ID
        const updatedAnnouncement = await Announcement.findByIdAndUpdate(
            announcementId,
            { batch, message },
            { new: true } // Return the updated document
        );

        if (!updatedAnnouncement) {
            console.error('Announcement not found');
            return res.status(404).json({ error: 'Announcement not found' });
        }

        return res.status(200).json({ batch, message });
    } catch (error) {
        console.error('Error updating announcement:', error);
        return res.status(500).json({ error: 'Failed to update announcement' });
    }
});
app.delete('/announcements/delete/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await Announcement.findByIdAndDelete(id);
      res.json({ message: 'Event deleted successfully' });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });
const storage1 = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../backend/public/books')); // Destination folder for storing uploaded files
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Use unique filename for storing the file
    }
});
const upload1 = multer({ storage: storage1 }); // sets up the middle ware
app.get('/e-books', async (req, res) => {
    try {
        // Retrieve user data based on session or any identifier (e.g., email)
        const userEmail = req.session.user.email; // Assuming user email is stored in session
        const user = await collection.findOne({ email: userEmail });

        if (!user) {
            console.error('User not found');
            return res.status(404).send('User not found');
        }

        const globalrole = user.role;
        const eBooks = await Ebooks.find();

        return res.render('subviews/e-books/e-book_main', { eBooks, globalrole });
    } catch (error) {
        console.error('Error fetching approved e-books:', error);
        return res.status(500).send('Internal Server Error');
    }
});

// POST route to add a new e-book submission (for admin)
app.post('/e-books/add', upload1.single('file'), async (req, res) => {
    try {
        const { title, author, course, teacher } = req.body;
        const userEmail = req.session.user.email; // Assuming user email is stored in session
        const user = await collection.findOne({ email: userEmail });

        if (!user) {
            console.error('User not found');
            return res.status(404).send('User not found');
        }

        const globalrole = user.role;
        const newEBook = new Ebooks({
            title,
            author,
            course,
            teacher,
            file: 'books/' + req.file.filename
        });
        await newEBook.save();
        const eBooks = await Ebooks.find();

        return res.render('subviews/e-books/e-book_main', { eBooks, globalrole });

        // Redirect to e-books page after successful submission
    } catch (error) {
        console.error('Error adding e-book:', error);
        return res.status(500).send('Failed to add e-book.');
    }
});


app.get('/contactUs', (req, res) => {
    return res.render('subviews/contactUs');
});


app.post('/contact', async (req, res) => { //inside that form it's that method's name
    const { name, email, subject, message } = req.body;

    try {
        // Save contact details to MongoDB
        const newContact = new Contact({ name, email, subject, message });
        await newContact.save();

        // Send contact information via email using Nodemailer
        const transporter = nodemailer.createTransport({
            service: 'gmail', // specified the service it's using is gmail
            auth: {
                user: 'Sujata.nk.kadam@gmail.com', // Sender email address
                pass: 'wokq nkya vxni dgxn' // Sender email password or app password that is created by google and is not the actual account password
            }
        });

        const mailOptions = {
            from: 'Sujata.nk.kadam@gmail.com', // Sender's email address (must be same as auth user)
            to: 'amrita0205kadam@gmail.com', // Receiver's email address
            subject: 'New Contact Form Submission',
            text: `
                Name: ${name}
                Email: ${email}
                Subject: ${subject}
                Message: ${message}
            `
        };

        // Send the email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.render('subviews/contactUs', { message: 'Failed to submit the form.' });
            }
            console.log('Email sent:', info.response);
            return res.render('subviews/contactUs', { message: 'Form submitted successfully!' }); //in ejs you need to give the variables like this that you will be using

        });
    } catch (error) {
        console.error('Error saving contact:', error);
        return res.status(500).send('Failed to submit the form.');
    }
});

app.get('/events', auth.isLogin, async (req, res) => {
    try {
        const userEmail = req.session.user.email;
        const user = await collection.findOne({ email: userEmail });

        if (!user) {
            console.error('User not found');
            return res.status(404).send('User not found');
        }

        const globalrole = user.role;

        const events = await Event.find().sort({ createdAt: -1 });
        return res.render('subviews/events', { events, globalrole });
    } catch (error) {
        console.error('Error rendering events page:', error);
        return res.status(500).send('Internal Server Error');
    }
});
// Route to add a new event (admin only)
app.post('/events/add', async (req, res) => {
    const { title, description } = req.body;

    try {
        const newEvent = new Event({
            title,
            description,
            createdBy: globalName
        });
        await newEvent.save();
        return res.status(201).json(newEvent);
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
});

app.get('/events/fetch', async (req, res) => {
    try {
      const events = await Event.find();
      return res.json(events);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  });
    
  // Update an event
  app.put('/events/update/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description } = req.body;
    try {
      const updatedEvent = await Event.findByIdAndUpdate(id, { title, description }, { new: true });
      return res.json(updatedEvent);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  });
  
  // Delete an event
  app.delete('/events/delete/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await Event.findByIdAndDelete(id);
      return res.json({ message: 'Event deleted successfully' });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  });


app.get('/home', async (req, res) => {
    try {
        // Retrieve user data based on session or any identifier (e.g., email)
        const userEmail = req.session.user.email; // Assuming user email is stored in session
        const user = await collection.findOne({ email: userEmail });

        if (!user) {
            console.error('User not found');
            return res.status(404).send('User not found');
        }

        const globalName = user.name;
        const globalrole = user.role; // Assuming 'role' is a field in your user document

        // Pass globalName and globalrole to the home template
        return res.render('home', { globalName, globalrole });

    } catch (error) {
        console.error('Error rendering home page:', error);
        return res.status(500).send('Internal Server Error');
    }
});

app.get('/leaderboard', auth.isLogin, async (req, res) => {
    try {
        // Retrieve user data based on session or any identifier (e.g., email)
        const userEmail = req.session.user.email; // Assuming user email is stored in session
        const user = await collection.findOne({ email: userEmail });

        if (!user) {
            console.error('User not found');
            return res.status(404).send('User not found');
        }

        const globalrole = user.role; // Assuming user role is stored in the user object

        // Render the announcement view with necessary data
        return res.render('subviews/leaderboard', { globalrole });

    } catch (error) {
        console.error('Error rendering leaderboard page:', error);
        return res.status(500).send('Internal Server Error');
    }
});



app.post('/leaderboard/add', async (req, res) => {
    const { name, email, batch, cgpa, extra_activity } = req.body;

    try {
        // Check if the student exists in the collection database
        const existingStudent = await collection.findOne({ email });

        if (!existingStudent) {
            // Student not found, return 400 status with a message
            return res.status(400).json({ message: 'Student is not registered' });
        }
        // Create a new entry in the leaderboard
        const newEntry = await Leaderboard.create({
            name,
            email,
            batch,
            cgpa,
            extra_activity

        });

        // Entry created successfully, return 201 status with the new entry as JSON
        return res.status(201).json(newEntry);
    } catch (error) {
        // Error occurred during database operation or entry creation
        console.error('Error adding leaderboard entry:', error);
        return res.status(500).json({ message: 'Failed to add leaderboard entry' });
    }
});

// Route to fetch leaderboard entries by batch
app.post('/leaderboard/fetch', async (req, res) => {
    const { batch } = req.body;

    try {
        const entries = await Leaderboard.find({ batch }).sort({ cgpa: 1 }).exec();
        // it will get the array of batch wise students and arranges in ascending order as 1 if it's descending then -1

        return res.status(200).json(entries);
    } catch (error) {
        console.error('Error fetching leaderboard entries:', error);
        return res.status(500).json({ message: 'Failed to fetch leaderboard entries' });
    }
});
// ------------------>original e

app.get('/planner', auth.isLogin, async (req, res) => {
    try {
        // Fetch all tasks from the database
        const tasks = await Task.find({ userEmail: globalemail });

        // Render the 'planner.ejs' template with the tasks data
        return res.render('subviews/planner', { todos: tasks }); // 'todos' variable matches what's used in 'planner.ejs'
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return res.status(500).send('Internal Server Error'); // Handle error appropriately
    }
});
app.post('/todos', async (req, res) => {

    try {
        const { task, dueDate } = req.body; // Extract task details from the form submission

        // Validate task data
        if (!task || !dueDate) {
            return res.status(400).send('Task and due date are required.');
        }

        // Create a new Task document with the extracted task details
        const newTask = new Task({
            task: task,
            dueDate: dueDate,
            userEmail: globalemail //

        });

        // Save the new task document to the database
        await newTask.save();

        // Redirect back to the '/planner' page after adding the task
        return res.redirect('/planner');
    } catch (error) {
        // Log detailed error message to console
        console.error('Error adding task:', error);

        // Send an internal server error response with error message
        return res.status(500).send('Internal Server Error: ' + error.message);
    }
});

// POST route to update task completion status
app.post('/todos/:id/complete', async (req, res) => {
    const taskId = req.params.id;

    try {
        const task = await Task.findById(taskId);

        if (!task) {
            return res.status(404).send('Task not found.');
        }

        task.completed = !task.completed; // Toggle the completion status

        await task.save(); // Save the updated task to the database

        return res.redirect('/planner'); // Redirect back to the planner page
    } catch (error) {
        console.error('Error updating task completion status:', error);
        return res.status(500).send('Internal Server Error');
    }
});


// POST route for deleting a task
app.post('/todos/:id/delete', async (req, res) => {
    const taskId = req.params.id; // Extract the task ID from the URL parameter

    try {
        // Find the task by its ID and delete it from the database
        const deletedTask = await Task.findByIdAndDelete(taskId);

        if (!deletedTask) {
            return res.status(404).send('Task not found');
        }

        // Redirect back to the '/planner' page after successful deletion
        return res.redirect('/planner');
    } catch (error) {
        console.error('Error deleting task:', error);
        return res.status(500).send('Internal Server Error');
    }
});
// Update task completion status
app.put('/todos/:id/toggle', async (req, res) => {
    const { id } = req.params;
    try {
        const task = await Task.findById(id);
        if (!task) {
            return res.status(404).send('Task not found');
        }
        task.completed = !task.completed; // Toggle completed field
        await task.save(); // Save updated task
        return res.send('Task completion status updated successfully');
    } catch (error) {
        console.error('Error updating task completion:', error);
        return res.status(500).send('Internal Server Error');
    }
});

app.get('/profile', auth.isLogin, async (req, res) => {
    // you are using async- await function as you need to wait until it 
    const data = await collection.findOne({ name: globalName });

    console.log(data); // as the user name logged in you will be finding and from there you can fetch all the data
    console.log(globalName); // as the user name logged in you will be finding and from there you can fetch all the data
    // if(req.session.data){
    if (data.name === globalName) {
        globalplace = data.place;
        globalbatch = data.batch;
        globalrole = data.role;
        globalbio = data.bio;
        globalspeciality = data.speciality;
        globaldescription = data.description; //After login it remembers the user
        globalimage = data.profilePicture; //After login it remembers the user
        console.log('This is global speciality', globalspeciality, globalName);
        return res.render('subviews/profile', { globalName, globalspeciality, globalemail, globalbio, globalplace, globaldescription, globalrole, globalimage });
    }

    else {
        return res.render("profile", { error: "Error occured" });

    }
});

app.get('/chats', auth.isLogin, async (req, res) => {
    try {
        const userEmail = req.session.user.email; // Assuming user email is stored in session
        const messages = await chat.find().sort({ createdAt: -1 });
        const userr= await collection.findOne({email: globalemail});
        const block= userr.isBlock;
        return res.render('subviews/chat', { messages, currentUser: req.session.user.name ,block});
    } catch (err) {
        console.error('Error fetching messages:', err);
        return res.status(500).send('Internal Server Error');
    }
});

// Route to fetch all messages (for AJAX request)
app.get('/messages/fetch', async (req, res) => {
    try {
        const messages = await chat.find().sort({ createdAt: 1 });
        return res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        return res.status(500).json({ message: 'Failed to fetch messages' });
    }
});

// Route to add a new message
app.post('/messages/add', async (req, res) => {
    const { text_msg } = req.body;
    const user = req.session.user.name; // Assuming user name is stored in the session

    if (!user || !text_msg) {
        return res.status(400).json({ message: 'User and text_msg are required' });
    }

    try {
        const newMessage = new chat({ user, text_msg });
        await newMessage.save();
        return res.status(201).json(newMessage);
    } catch (error) {
        console.error('Error adding message:', error);
        return res.status(500).json({ message: 'Failed to add message' });
    }
});





//for the timetable
app.get('/timetable', auth.isLogin, (req, res) => {
    return res.render('subviews/timetable');
});

app.get('/cs22', auth.isLogin, (req, res) => {
    return res.render('subviews/EJS/cs22');
});
app.get('/cs21', auth.isLogin, (req, res) => {
    return res.render('subviews/EJS/cs21');
});
app.get('/cs20', auth.isLogin, (req, res) => {
    return res.render('subviews/EJS/cs20');
});
app.get('/ad23', auth.isLogin, (req, res) => {
    return res.render('subviews/EJS/ad23');
});
app.get('/cs23', auth.isLogin, (req, res) => {
    return res.render('subviews/EJS/cs23');
});

app.get('/logout', auth.isLogin, (req, res) => {
    try {
        req.session.destroy(); //the login user's session ends
        return res.redirect("/");
    } catch (error) {
        console.log(error.message);

    }
});
app.listen(port, () => {
    console.log("Server is running on port", port);
}).on('error', (err) => {
    console.error('Server failed to start:', err.message);
});

