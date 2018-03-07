# nodeSQL


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
configuration passes as argument to the nodeSQL constructor visit the [mysql package's github](https://github.com/mysqljs/mysql).
```javascript
const ns = require('nodesql');

const nodesql = new ns.nodeSQL({
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
```javascript
nodesql.select(['u.id', 'u.name', 'u.surname'])
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

```javascript			
sql.select(['u.name', 'u.surname'])
			.sBlockStart()
				.select([{'func' : 'COUNT', 'value' : '*'}])
				.from('users')
				.where('name', 'John')
			.sBlockEnd('johnCount')
			.from('users as u')
```javascript


### ATTENTION : Project is still in progress!!! 


