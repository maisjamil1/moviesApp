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


//________________________________________________________




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
    this.title = data.name || 'not found'
    this.poster_path = `https://image.tmdb.org/t/p/w500/${data.poster_path}` || 'not found'
    this.vote_count = data.vote_count || 'not found'
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