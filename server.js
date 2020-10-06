const express = require('express'); 
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex')


const db = knex({
	client: 'pg',
	connection: {
		host : '127.0.0.1',
		user : 'postgres',
		password : 'test',
		database : 'smart-brain'
	}
});

 
const app = express();

app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(cors());

const database = {
	users: [
		{
			id: '123',
			name: 'john',
			password: 'cookies',
			email: 'john@gmail.com',
			entries : 0,
			joined: new Date()
		},
		{
			id: '124',
			name: 'sally',
			password: 'bananas',
			email: 'sally@gmail.com', 
			entries : 0,
			joined: new Date()
		}
	], 
	login: [
		{
			id: '987',
			hash: '',
			email: 'john@gmail.com'
		}
	]
}

app.get('/', (req, res) => {
	res.send(database.users);
})

app.post('/signin', (req, res)=> {
	bcrypt.compare("apples", '$2a$10$gWodaEbDSVE8LzkUrd1HwOPhYpe8R6/umyoGSpl3qtteMkwsgcVJO'
	, function(err, res) {
	    console.log('first guess', res)
	});
	bcrypt.compare("veggies", '$2a$10$gWodaEbDSVE8LzkUrd1HwOPhYpe8R6/umyoGSpl3qtteMkwsgcVJO'
	, function(err, res) {
	    console.log('second guess', res)
	});
	if (req.body.email===database.users[0].email && 
		req.body.password===database.users[0].password) {
		res.json(database.users[0]);
	} else {
		res.status(400).json('error logging in');
	}
	res.json('singin');
})

app.post('/register', (req, res)=> {
	const {email, name, password} = req.body;
	const hash = bcrypt.hashSync(password);
	db.transaction(trx => {
		trx.insert({
			hash: hash, 
			email: email
		})
		.into('login')
		.returning('email')
		.then(loginEmail => {
			return trx('users')
				.returning('*')
				.insert({
					email: loginEmail[0],
					name: name,
					joined: new Date()
				})
				.then(user =>{
					res.json(user[0]);
				})
		})
		.then(trx.commit)
		.catch(trx.rollback)
	})	
	.catch(err => res.status(400).json('user already exists'))

})

app.get('/profile/:id', (req, res) => {
	const { id } = req.params; 
	db.select('*').from('users').where({id})
		.then(user=> {
			if(user.length) {
				res.json(user[0])
			}else {
				res.status(400).json('Not found')
			}
		})
		.catch(err => res.status(400).json('error getting user'))
})

app.put('/image', (req,res) => {
	const { id } = req.body; 
	db('users').where('id', '=', id)
  	.increment('entries', 1)
  	.returning('entries')
  	.then(entries => res.json(entries))
  	.catch(err=> res.status(400).json('unable to get entries'))
})




app.listen(3001, ()=> {
	console.log('app is running on port 3001');
})