const express = require('express');
const app = express();
const userModel = require('./models/user');
const postModel = require('./models/post');
const cook = require('cookie-parser');
const jwt = require('jsonwebtoken');
const by = require('bcrypt');

app.set("view engine", "ejs");
app.use(cook());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/Signup', function (req, res) {
    res.render("Sign");
});

app.post('/create', async function (req, res) {
    let { name, email, password, im } = req.body;
    let finduser = await userModel.findOne({ email: email }); // find user to match password
    if (finduser) {
        return res.redirect('/login');
    }
    // hash password
    by.genSalt(10, function (err, salt) {
        if (err) {
            return res.status(500).send("Error in password hashing.");
        }
        by.hash(password, salt, async function (err, hash) {
            if (err) {
                return res.status(500).send("Error in password hashing.");
            }
            let createduser = await userModel.create({
                name,
                email,
                im,
                password: hash
            });
            res.redirect('/login');
        });
    });
});

app.get('/login', function (req, res) {
    res.render("login");
});

app.post('/login1', async function (req, res) {
    let { email, password } = req.body;
    let finduser = await userModel.findOne({ email: email });
    if (!finduser) {
        res.status(401).json({ error: 'Incorrect credentials' });
    } else {
        by.compare(password, finduser.password, function (err, result) {
            if (result === true) {
                let token = jwt.sign({ email }, "$143a");
                res.cookie("token", token);
                res.json({ success: true, user: finduser }); // Sending user data
            } else {
                res.status(401).json({ error: 'Incorrect credentials' });
            }
        });
    }
});

app.get('/profile', isLoggedIn, function (req, res) {
    res.render("profile", { user: req.user });
});

app.get('/postpage/:userid', async function (req, res) {
    let user1 = await userModel.findOne({ _id: req.params.userid }).populate("posts");
    res.render("post", { user: user1 });
});

app.post('/createpost/:userid', async function (req, res) {
    let user = req.params.userid;
    let newPost = await postModel.create({
        userid: user,
        postname: req.body.postname,
        content: req.body.content
    });

    let usertofind = await userModel.findOne({ _id: req.params.userid });
    usertofind.posts.push(newPost._id);
    await usertofind.save();

    // Redirect to the post page with the user's _id
    res.redirect('/postpage/' + user);
});

app.get('/myposts/:userid', async function (req, res) {
    let user1 = await userModel.findOne({ _id: req.params.userid }).populate("posts");
    res.render("mypost.ejs", { user: user1 });
});

app.get('/like/:postid', isLoggedIn, async function (req, res) {
    let post = await postModel.findOne({ _id: req.params.postid });
    if (post) {
        if (!post.likedBy.includes(req.user._id)) {
            post.likes += 1;
            post.likedBy.push(req.user._id);
            await post.save();
        }
    }
    const redirectUrl = req.query.redirect || '/allpost';
    res.redirect(redirectUrl);
});


app.get('/full/:postid', isLoggedIn, async function (req, res) {
    let post = await postModel.findOne({ _id: req.params.postid });
    let user=await userModel.findOne({_id: post.userid})
    res.render("full",{post: post, user:user});
});

app.get('/allpost', isLoggedIn, async function (req, res) {
    let users = await userModel.find().populate('posts');
    res.render('allposts', { users: users });
});

app.get('/logout', function (req, res) {
    res.cookie("token", "");
    res.redirect('/Signup');
});

app.post('/delete/:postid',async function(req,res)
{
    let postfound=await postModel.findOneAndDelete({_id: req.params.postid});
    let userfound=await userModel.findOne({_id: postfound.userid});
    userfound.posts.pull(req.params.postid);
    userfound.save();
    res.redirect('/myposts/'+userfound._id);
})

function isLoggedIn(req, res, next) {
    if (!req.cookies.token) {
        return res.render("login");
    }
    jwt.verify(req.cookies.token, "$143a", async function (err, decoded) {
        if (err) {
            return res.render("login");
        }
        let user = await userModel.findOne({ email: decoded.email });
        if (!user) {
            return res.render("login");
        }
        req.user = user;
        next();
    });
}

app.listen(300, () => {
    console.log('Server is running on port 300');
});
