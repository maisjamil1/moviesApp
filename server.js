'use strict';
require('dotenv').config();
const express = require('express');
const pg = require('pg');
const superagent = require('superagent');
const methodOverride = require('method-override');

const app = express();
const PORT = process.env.PORT || 4000;
const client = new pg.Client(process.env.DATABASE_URL);

app.use(express.urlencoded({ extended: true }))
app.use(express.static('./public'))
app.use(express.json());
app.use(methodOverride('_method'))

app.set('view engine', 'ejs')
//________________________________________________________
//routs
app.get('/', renerHomePage)
app.post('/', whatDoUwant)
app.get('/showResults', showResultsHanndler)
app.post('/addToList', addToListHandler)
app.get('/showmyList', showmyListHanndler)
app.post('/details/:movie_id', showdetailsHanndler)
app.put('/update/:movie_id',updateHanndler)
app.delete('/delete/:movie_id',deleteHanndler)

function deleteHanndler(req,res){
    const VALUES=[req.params.movie_id]
    const SQL ='DELETE FROM movetable WHERE id=$1;'
    client.query(SQL, VALUES).then(results => {
        res.redirect('/showmyList')
    })
    .catch((err) => {
        errorHandler(err, req, res)
    })
}

//________________________________________________________
function renerHomePage(req, res) {
    res.render('index.ejs')
}
//________________________________________________________
let dataARR;
function whatDoUwant(req, res) {
    let Textt = req.body.theText
    let typee = req.body.type
    superagent(`https://api.themoviedb.org/3/search/${typee}?api_key=${process.env.MOVIE_API_KEY}&query=${Textt}`).then((data) => {
        // console.log(data.body);
        // console.log(data.body.results);
        dataARR = data.body.results.map((val) => {
            return new ObjMaker(val)
        })
        // console.log(dataARR);
        res.redirect('/showResults')

    })
        .catch((err) => {
            errorHandler(err, req, res)
        })

}


function ObjMaker(data) {
    this.title = data.name ||data.title|| 'not found'
    this.poster_path = `https://image.tmdb.org/t/p/w500/${data.poster_path}` || 'not found'
    this.vote_count = data.vote_count || 0// هون بستقبل بس ارقام لانو كتبت بالسكيما هيك
    this.overview = data.overview || 'not found'

}

//________________________________________________________
function showResultsHanndler(req, res) {
    // console.log('inside showResultsHanndler ',dataARR);

    res.render('pages/results.ejs', { data: dataARR })
}
//________________________________________________________
function addToListHandler(req, res) {
    const { title, poster_path, vote_count, overview } = req.body
    const VALUES = [title, poster_path, vote_count, overview]

    const SQLcheck = 'SELECT * FROM movetable WHERE title=$1 AND poster_path=$2 AND vote_count=$3 AND overview=$4;'
    const SQL = 'INSERT INTO movetable(title,poster_path,vote_count,overview)VALUES($1,$2,$3,$4);'

    client.query(SQLcheck, VALUES).then(results => {
        if (results.rows.length === 0) {
            client.query(SQL, VALUES).then(results => {
                res.redirect('/showmyList')
            })
        }else{
            res.redirect('/showmyList')
        }
    })
}

//________________________________________________________
function showmyListHanndler(req, res) {
    const SQL = 'SELECT * FROM movetable;'
    client.query(SQL).then(results => {
        res.render('pages/myList.ejs', { data: results.rows })
    })
    .catch((err) => {
        errorHandler(err, req, res)
    })
}

//________________________________________________________

function showdetailsHanndler(req,res){
    const SQL  ='SELECT * FROM movetable WHERE id=$1;'
    const VALUES=[req.params.movie_id]
    client.query(SQL, VALUES).then(results => {
        res.render('pages/details.ejs',{data:results.rows[0]})
    })
    .catch((err) => {
        errorHandler(err, req, res)
    })
}


//________________________________________________________
function updateHanndler (req,res) {
    let { title, poster_path, vote_count, overview } = req.body
    let SQL='UPDATE movetable SET title=$1, poster_path=$2, vote_count=$3, overview=$4 WHERE id=$5;'
const VALUES=[title, poster_path, vote_count, overview,req.params.movie_id]
// console.log(VALUES);
client.query(SQL, VALUES).then(() => {
    const SQL2  ='SELECT * FROM movetable WHERE id=$1;'
    const VALUES2=[req.params.movie_id]
    client.query(SQL2, VALUES2).then(results2 => {
        res.render('pages/details.ejs',{data:results2.rows[0]})
    })

    // res.redirect(`/details/${req.params.movie_id}`);//مفروض يزبط بس مش زابط غريب 
   
    })
    .catch((err) => {
        errorHandler(err, req, res)
    })
}





















//________________________________________________________
app.get('/test', test);
function test(req, res) {
    res.send('hiiiiiiiiiiiiiiiii ')
}
//________________________________________________________
app.use('*', notFoundHandler)
function notFoundHandler(req, res) {
    res.status(404).send('page not found')
}
function errorHandler(err, req, res) {
    res.status(500).send(err)
}
//________________________________________________________
client.on('error', (err) => console.log(err))
client.connect().then(() => {
    app.listen(PORT, () => console.log('up and running on ', PORT))
})