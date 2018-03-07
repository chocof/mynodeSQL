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
.then(...)
.catch(...)
```
This is a module that tries to mask this problem by introducing an easier and eye-friendly interface
in order to perform mySQL queries
