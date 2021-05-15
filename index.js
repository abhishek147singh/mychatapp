require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const dbConnection = require('./database');
const { body, validationResult } = require('express-validator');
const multer = require('multer');

const app = express();
const http = require('http').createServer(app);

const io = require('socket.io')(http);

app.use(express.urlencoded({extended:false}));

const PORT = process.env.PORT;

// SET OUR VIEWS AND VIEW ENGINE
app.set('views', path.join(__dirname,'views'));
app.set('view engine','ejs');

// app.use(express.static(staticPath));
app.use(express.static("public"));

// APPLY COOKIE SESSION MIDDLEWARE
app.use(cookieSession({
    name: 'session',
    keys: ['key1', 'key2'],
    maxAge:  3600 * 1000 // 1hr
}));

let UserProPic = "";
// DECLARING CUSTOM MIDDLEWARE
const ifNotLoggedin = (req, res, next) => {
    if(!req.session.isLoggedIn){
        return res.render('login-register');
    }
    next();
}

const ifLoggedin = (req,res,next) => {
    if(req.session.isLoggedIn){
        return res.redirect('/');
    }
    next();
}
// END OF CUSTOM MIDDLEWARE

// ROOT PAGE
app.get('/', ifNotLoggedin, (req,res,next) => {
       
    let sql = "SELECT user_id, user_name ,user_pic FROM `users` WHERE user_id = ?";
    dbConnection.query(sql ,[req.session.userID] ,function(err, result1){
        console.log(result1[0].user_id,result1[0].user_name);
        if(err) throw err;
        dbConnection.query( "SELECT user_name , user_pic FROM `users`" ,function(error,result2){
            if(error) throw error;
            res.render('index',{User:result1[0].user_name,_id:result1[0].user_id , userPic:result1[0].user_pic,Another:result2});
        });

    });
      
});// END OF ROOT PAGE


// REGISTER PAGE
app.post('/register', ifLoggedin, 
// post data validation(using express-validator)
[
    body('user_email','Invalid email address!').isEmail().custom((value) => {
        let sql = 'SELECT `user_email` FROM `users` WHERE `user_email`=?';
        return dbConnection.query(sql, [value],function(err,result){
            if(err) throw err;
            if(result.length > 0){
                return Promise.reject('This E-mail already in use!');
            }
            return true;
        });
        
    }),
    body('user_name','Username is Empty!').trim().not().isEmpty(),
    body('user_pass','The password must be of minimum length 6 characters').trim().isLength({ min: 6 }),
],// end of post data validation
(req,res,next) => {

    const validation_result = validationResult(req);
    const {user_name, user_pass, user_email} = req.body;
    // IF validation_result HAS NO ERROR
    if(validation_result.isEmpty()){
        // password encryption (using bcryptjs)
        bcrypt.hash(user_pass, 12).then((hash_pass) => {
            // INSERTING USER INTO DATABASE
            dbConnection.query("INSERT INTO `users`(`user_name`,`user_email`,`user_password`) VALUES(?,?,?)",[user_name,user_email, hash_pass],function(err,result){
                if (err) throw err;
                res.send(`your account has been created successfully, Now you can <a href="/">Login</a>`);
            });
            
        });
    }
    else{
        // COLLECT ALL THE VALIDATION ERRORS
        let allErrors = validation_result.errors.map((error) => {
            return error.msg;
        });
        // REDERING login-register PAGE WITH VALIDATION ERRORS
        res.render('login-register',{
            register_error:allErrors,
            old_data:req.body
        });
    }
});// END OF REGISTER PAGE

// LOGIN PAGE
app.post('/', ifLoggedin, [
    body('user_email').custom((value) => {
        return dbConnection.query('SELECT `user_email` FROM `users` WHERE `user_email`=?', [value] , function(err,result){
            if (err) throw err;
            if(result.length == 1){
                return true;
            }
            return false;
        });
        
    }),
    body('user_pass','Password is empty!').trim().not().isEmpty(),
], (req, res) => {
    const validation_result = validationResult(req);
    const {user_pass, user_email} = req.body;
    if(validation_result.isEmpty()){
        
        dbConnection.query("SELECT * FROM `users` WHERE `user_email`=?",[user_email],function(err,result){
            if (err) throw err;
            
            bcrypt.compare( user_pass , result[0].user_password).then(compare_result => {
                if(compare_result === true){
                    req.session.isLoggedIn = true;
                    req.session.userID = result[0].user_id;

                    res.redirect('/');
                }
                else{
                    res.render('login-register',{
                        login_errors:['Invalid Password!']
                    });
                }
            }).catch(err => {
                if (err) throw err;
            });
        }); 
    }
    else{
        let allErrors = validation_result.errors.map((error) => {
            return error.msg;
        });
        // REDERING login-register PAGE WITH LOGIN VALIDATION ERRORS
        res.render('login-register',{
            login_errors:allErrors
        });
    }
});
// END OF LOGIN PAGE


//--------------uploading a file--------
let storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null, 'public/img/');
    },
    filename:function(req,file,cb){
        console.log(file.originalname);
        UserProPic =(Date.now() + file.originalname);//storing file name for use
        cb(null,Date.now() + file.originalname);
    }
})

let upload = multer({storage:storage});
app.post('/upload/:id',upload.single('pro_file') , function(req,res,next){
    let sql = `UPDATE users SET user_pic = "${UserProPic}" WHERE user_id = ?`;
    dbConnection.query(sql,[req.params.id],function(err,result){
        if(err) throw err;
      console.log('update succsessfuly');
    });
    res.redirect('/');
    next();
});



// LOGOUT
app.get('/logout',(req,res)=>{
    //session destroy
    req.session = null;
    res.redirect('/');
});
// END OF LOGOUT

app.use('/', (req,res) => {
    res.status(404).render('status404.ejs');
});


//--------------------------------------
//this is a object which contain users data who interect with server
const users = {};
const userName = [];

//for accept all the request from users and connect all the users by this method
io.on('connection',socket=>{
  
socket.on('get_data',function(){
    socket.emit('send-data',userName);
});

socket.on('new-user-joined',function (name) {
   users[socket.id] = name;
   if (name != null&&name != undefined) {
       userName.push(name);
   }
   socket.broadcast.emit('user-joined', {
             TotelUser: userName,
             user: name
   });
});
  //when user send any message then this methord send the request all the users except himself
  socket.on('send',message=>{
      socket.broadcast.emit('receive',{ message: message , name: users[socket.id]});
  });

  //when user disconnect from the server then this function is run automatically
   socket.on('disconnect' , message=>{
       socket.broadcast.emit('left',users[socket.id]);
       delete users[socket.id];
   });

});

//-----------------------------------
http.listen( PORT || 3000, () => console.log("Server is Running..."));