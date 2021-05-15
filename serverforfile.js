const express = require('express');
const multer = require('multer');
const path = require('path');


const app = express();
app.use(express.urlencoded({extended:false}));

// SET OUR VIEWS AND VIEW ENGINE
app.set('views', path.join(__dirname,'views'));
app.set('view engine','ejs');

app.use(express.static("public"));
//--------------uploading a file--------
let storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null, 'public/img/');
    },
    filename:function(req,file,cb){
        console.log(file.originalname);
        cb(null,Date.now() + file.originalname);
    }
})

let upload = multer({storage:storage});
app.post('/upload',upload.single('pro_file') , function(req,res,next){
    console.log("helo");
    next();
});


app.use('/', (req,res) => {
    return res.render('file');
});

app.listen(3000, () => console.log("Server is Running..."));