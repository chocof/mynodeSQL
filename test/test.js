const nodesql = require('../index');

//init chance in order to create random strings
var Chance 		= require('chance');
var chance 		= new Chance();
var expect 		= require('chai').expect;
var should 		= require('should');

const sql = new nodesql.nodeSQL({
	host     : 'localhost',
	user     : 'root',
	password : '',
	database : 'node_sql',
	multipleStatements: true 
}).connect()

describe('------------------nodeSQL------------------',function(){
	// close database when test is over
	after('Close Database Connection',function(done){
		sql.delete().from('pets')
		sql.execute()
		.then(function(res){
			return sql.delete()
			.from('users')
			.execute();
		})
		.then(function(){
			return sql.closeConnection()
		})
		.then(function(err){
           expect(err).to.not.exist;
           done();
		})
		.catch(function(err){
			done(err);
		})
	})

	describe('INSERT', function(){
		after(function(done){
			sql.delete().from('users')
			.execute()
			.then(function(res){
				done()			
			})
			.catch(function(err){
				done(err);
			})
		})

		it('Should Insert Single Row',function(done){
			var q = "INSERT INTO users (`name`,`surname` )  VALUES ('Fotis','Bokos')  ";

			sql.insert('users', {
				'name' : 'Fotis', 
				'surname' : 'Bokos', 
			})

			expect(sql.queryString()).to.equal(q);			
			sql.execute()
			.then(function(res){
				expect(res.affectedRows).to.equal(1);
				done();
			})
			.catch(function(err){
				expect(err).to.not.exist;
				done();
			})
		})

		it('Should Insert Multiple Rows',function(done){
			var q = "INSERT INTO users (`name`,`surname` )  VALUES (\'John\',\'Lemon\'),(\'Bokolis\',\'Ognostos\')  ";

			sql.insert('users', [
				{'name' : 'John', 
				'surname' : 'Lemon'},
				{'name' : 'Bokolis', 
				'surname' : 'Ognostos'}])
			expect(sql.queryString()).to.equal(q);			
			sql.execute()
			.then(function(res){
				expect(res.affectedRows).to.equal(2);
				done();
			})
			.catch(function(err){
				expect(err).to.not.exist;
				done();
			})
		})
	})

	describe('UPDATE', function(){
		before(function(done){
			sql.insert('users', [
				{'name' : 'John', 
				'surname' : 'Lemon'},
				{'name' : 'Bokolis', 
				'surname' : 'Ognostos'}])
			.execute()
			.then(function(res){
				done();
			})
			.catch(function(err){
				done();
			})
		})
		after(function(done){
			sql.delete().from('users')
			.execute()
			.then(function(res){
				done()			
			})
			.catch(function(err){
				done(err);
			})
		})

		it('Should Update Selected Rows',function(done){
			var q = "UPDATE users SET `name` = \'Neos\',`surname` = \'Anthropos\'   WHERE `name` = \'John\' ";

			sql.update('users', {
				'name' : 'Neos', 
				'surname' : 'Anthropos', 
			}).where('name','John');

			expect(sql.queryString()).to.equal(q);			
			sql.execute()
			.then(function(res){
				expect(res.affectedRows).to.equal(1);
				done();
			})
			.catch(function(err){
				expect(err).to.not.exist;
				done();
			})
		})

		it('Should Update All Rows',function(done){
			var q = "UPDATE users SET `name` = \'Babis\',`surname` = \'Tselios\'  ";

			sql.update('users', {
				'name' : 'Babis', 
				'surname' : 'Tselios', 
			})

			expect(sql.queryString()).to.equal(q);			
			sql.execute()
			.then(function(res){
				expect(res.affectedRows).to.equal(2);
				done();
			})
			.catch(function(err){
				expect(err).to.not.exist;
				done();
			})
		})
	})

	describe('SELECT', function(){
		before(function(done){
			sql.insert('users', [
				{'name' : 'John', 
				'surname' : 'Lemon'},
				{'name' : 'Bokolis', 
				'surname' : 'Ognostos'}])
			.execute()
			.then(function(res){
				return sql.insert('pets', [
					{'name' : 'Lamas', 
					'species' : 'Lama'},
					{'name' : 'Lamas', 
					'species' : 'Lama'}
				]).execute();
			})
			.then(function(res){
				return sql.update('pets as p')
				.join('users as u', 'u.name = \'John\'')
				.set('p.owner', 'u.id', true)
				.execute();	
			})
			.then(function(res){
				done();
			})
			.catch(function(err){
				done();
			})
		})
		after(function(done){

			sql.delete().from('pets')
			.execute()
			.then(function(res){
				return sql.delete().from('users')
				.execute();
			})
			.then(function(res){
				done()			
			})
			.catch(function(err){
				done(err);
			})
		})

		it('Should Perform Basic Queries',function(done){
			var q = "SELECT u.id,u.name,u.surname  FROM users as u ";

			sql.select(['u.id','u.name','u.surname']).from('users as u');

			expect(sql.queryString()).to.equal(q);			
			sql.execute()
			.then(function(res){
				expect(res.length).to.equal(2);
				done();
			})
			.catch(function(err){
				expect(err).to.not.exist;
				done();
			})
		})

		it('MIN, MAX, COUNT queries',function(done){
			var q = "SELECT MAX(u.id)  FROM users as u ";

			sql.select([{func : 'MAX', value : 'u.id'}]).from('users as u');
			expect(sql.queryString()).to.equal(q);			
			sql.execute()
			.then(function(res){
				expect(res).to.exist;
				done();
			})
			.catch(function(err){
				expect(err).to.not.exist;
				done();
			})
		})

		it('Perform Joins',function(done){
			var q = "SELECT u.name,u.surname,p.name,p.species  FROM users as u   JOIN pets as p ON p.owner = u.id ";

			sql.select(['u.name', 'u.surname', 'p.name','p.species'])
			.from('users as u')
			.join('pets as p', 'p.owner = u.id');

			expect(sql.queryString()).to.equal(q);			
			sql.execute()
			.then(function(res){
				expect(res).to.exist;
				done();
			})
			.catch(function(err){
				expect(err).to.not.exist;
				done();
			})
		})

		it('Perform Subqueries',function(done){
			var q = "SELECT u.name  ,( SELECT COUNT(*)  FROM users  WHERE `name` = \'John\' ) AS `johnCount`  FROM users as u ";

			sql.select(['u.name'])
			.sBlockStart()
				.select([{'func' : 'COUNT', 'value' : '*'}])
				.from('users')
				.where('name', 'John')
			.sBlockEnd('johnCount')
			.from('users as u')
			
			expect(sql.queryString()).to.equal(q);			
			sql.execute()
			.then(function(res){
				expect(res).to.exist;
				done();
			})
			.catch(function(err){
				expect(err).to.not.exist;
				done();
			})
		})

		it('Perform Subqueries in WHERE functions',function(done){
			var q = "SELECT u.name  FROM users as u  WHERE `u`.`id` IN   ( SELECT owner  FROM pets ) ";

			sql.select(['u.name'])
			.from('users as u')
			.where('u.id',null, 'IN')
			.sBlockStart()
				.select(['owner'])
				.from('pets')
			.sBlockEnd()
			
			expect(sql.queryString()).to.equal(q);			
			sql.execute()
			.then(function(res){
				expect(res).to.exist;
				done();
			})
			.catch(function(err){
				expect(err).to.not.exist;
				done();
			})
		})
	})
})
