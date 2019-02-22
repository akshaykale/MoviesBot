const bodyParser = require('body-parser'),
  express = require('express');
  
const app = express();

// Tell express to use the body-parser middleware and to not parse extended bodies
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ extended: false }));
app.use(bodyParser.raw({ extended: false }));

//app port
app.set('port', process.env.PORT || 5000);

/* START
* Movies info chat bot for dialogflow
*/
app.post('/imdb/movie', (req, res) => {
  callImdbApi(req.body.movieName).then((movie) => {
    res.send(movie)
  }).catch((err) => {
    res.send('Error')
  })
});

const { WebhookClient } = require('dialogflow-fulfillment');
const {Text, Card, Image, Suggestion, Payload} = require('dialogflow-fulfillment');

app.post('/getMovieInfo', (request, response) => {
  console.log('hit');
  const agent = new WebhookClient({request, response});
  let intentMap = new Map();
  intentMap.set('GetReleaseYearByTitle', moviesIntentHandler);
  agent.handleRequest(intentMap);
});

moviesIntentHandler =  async (agent) => {
  const API_KEY = process.env.IMDB_API;
  const params = agent.parameters;
  console.log(params);
  const movieToSearch = params.movieName || 'The Godfather';
  await callImdbApi(movieToSearch).then( async (movie) => {
    let dataToSend = movieToSearch === 'The Godfather' ? `I don't have the required info on that. Here's some info on 'The Godfather' instead.\n` : '';
    dataToSend += `${movie.Title} is a ${movie.Actors} starer ${movie.Genre} movie, released in ${movie.Year}. It was directed by ${movie.Director}`;
    console.log(dataToSend)

    const card = new Card(movie.Title);
    card.setImage(movie.Poster);
    card.setText(dataToSend)
    card.setButton({text:'Details', url: movie.Website || 'www.google.com'})
    await agent.add(card).catch((err) => {console.log(err)});
    
  }).catch((err) => {console.log('Error')});
};

callImdbApi = (movieName) => {
  return new Promise((resolve, reject) => {
    const API_KEY = process.env.IMDB_API;
    const http = require('http');
    console.log(movieName);
    const reqUrl = encodeURI(`http://www.omdbapi.com/?t=${movieName}&apikey=${API_KEY}`);
    http.get(reqUrl, (responseFromAPI) => {
        let completeResponse = '';
        responseFromAPI.on('data', (chunk) => {
            completeResponse += chunk;
        });
        responseFromAPI.on('end',  () => {
          const movie = JSON.parse(completeResponse);
          resolve(movie)
        });
    }, (error) => {
      console.log('Error in IMDB API.')
      reject('error')
    });
  })
};
/* END
* Movies info chat bot for dialogflow
*/

// Tell our app to listen on port 
app.listen(app.get('port'), function () {
  logger.log('Node app is running on port', app.get('port'));
});