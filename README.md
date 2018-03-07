# mynodeSQL


Description
-------
The mysql module for nodejs can sometimes result in code such as 
```javascript
var sql = " SELECT p.id, p.title, p.description" + 
   " FROM posts as p" +
   " INNER JOIN issues AS i ON i.id = p.issue AND i.is_live = 1 AND p.is_live = 1" +
   " WHERE MATCH(p.title) AGAINST( ? IN NATURAL LANGUAGE MODE)" +
   " OR MATCH(p.description) AGAINST( ? IN NATURAL LANGUAGE MODE)" + 
   " ORDER BY ID DESC LIMIT ? OFFSET ?" ;

this.conn.queryAsync(sql, [toSearch, toSearch, limit, offset])
.then((res) => {...})
.catch((err) => {...})
```
This is a module that tries to mask this problem by introducing an easier and eye-friendly interface
in order to perform mySQL queries.

Usage
----------

#### Connect to DB
Connecting to the database is very similar to the mysql package. For more information on the
configuration passes as argument to the mynodesql constructor visit the [mysql package's github](https://github.com/mysqljs/mysql).
```javascript
const ns = require('mynodesql');

const mynodesql = new ns.mynodesql({
	host     : 'localhost',
	user     : 'root',
	password : '',
	database : 'node_sql',
	multipleStatements: true 
}).connect();
```	


Quickstart
----------------

#### SELECT QUERIES
SELECT queries are pretty simple to make. Some example are presented bellow 

```javascript
var sql = "SELECT u.id, u.name, u.surname FROM users as u WHERE u.id > 3";

this.conn.queryAsync(sql, [])
.then((res) => {...})
.catch((err) => {...})
```
Using mynodesql:
```javascript
mynodesql.select(['u.id', 'u.name', 'u.surname'])
.from('users as u').where('id','3')
.execute()
.then((res) => {...})
.catch((err) => {...})
```	

One can even make subqueries 
```javascript
var sql = "SELECT u.name  ,( SELECT COUNT(*)  FROM users  WHERE name = 'John' ) AS johnCount  FROM users as u ";
this.conn.queryAsync(sql, [])
.then((res) => {...})
.catch((err) => {...})
```
Using mynodesql:
```javascript			
mynodesql.select(['u.name', 'u.surname'])
.sBlockStart()
	.select([{'func' : 'COUNT', 'value' : '*'}])
	.from('users')
	.where('name', 'John')
.sBlockEnd('johnCount')
.from('users as u')
```

#### INSERT QUERIES
```javascript
var sql = "INSERT INTO users (name,surname)  VALUES ('Fotis','Bokos')";
this.conn.queryAsync(sql, [])
.then((res) => {...})
.catch((err) => {...})
```
Using mynodesql:
```javascript
mynodesql.insert('users', {
	'name' : 'Fotis', 
	'surname' : 'Bokos', 
}).execute()
.then((res) => {...})
.catch((err) => {...})
```	

#### UPDATE QUERIES
```javascript
var sql = "UPDATE users SET name = 'George',surname = 'Doe' WHERE name = 'John'";

this.conn.queryAsync(sql, [])
.then((res) => {...})
.catch((err) => {...})
```
Using mynodesql:
```javascript
mynodesql.update('users', {
	'name' : 'George', 
	'surname' : 'Doe', 
}).where('name','John')
.execute()
.then((res) => {...})
.catch((err) => {...})
```	

mynodesql also allows the use of JOIN along with UPDATE quries 
```javascript			
mynodesql.update('pets as p')
.join('users as u', 'u.name = \'John\)
.set('p.owner', 'u.id', true)
.execute()
.then((res) => {...})
.catch((err) => {...})
```


### ATTENTION : Project is still in progress!!! 


