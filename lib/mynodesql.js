// constructor
var mysql      	= require('mysql');
var Promise 	= require('bluebird');



const SELECT_TYPE = 1;
const INSERT_TYPE = 2;
const UPDATE_TYPE = 3;
const DELETE_TYPE = 4;

const DEFAULT_EXC = 1;

// mysql where operator list
const OP_LIST = ["=", "!=", ">",">=","<","<=", "IS", "IS NOT",
				 "<==>", "<>", "!=", "IN"]
// supported select functions 
const SUP_FUNC = ["MIN", "MAX", "DISTINCT", "COUNT"];


function nodesqlException(msg, type) {
   	this.message = msg;
   	this.type = type;
  	
   	this.toString = function() {
      return "[-] nodeSLQ Error code " + this.type + " : "+ this.message;
   };
}


/**
* Loads configuration and creates a connection obejct
*
* @constructor
*
* @param {json/string} config
*   Configuration for mysql. @see www.github.com/mysqljs/mysql
*
* @throws config error exception
*/
var nodesql = function(config){
	this.config = config
	this.connected = false;
	this.resetQuery();
	try {
		this.conn = Promise.promisifyAll(mysql.createConnection(config));
	}catch(err){
		throw new nodesqlException(err, DEFAULT_EXC);
	}
	return this;
};


// just for shortening requests
nodesql.prototype.escape = function(arg, noEscape){
	if (!noEscape)
		return this.conn.escape(arg);
	else
		return arg;
}
nodesql.prototype.escapeId = function(arg, noEscape){
	if (!noEscape)
		return this.conn.escapeId(arg);
	else
		return arg;
}
/**
* Connects to the mysql server
*
* @constructor
*
* @throws connection error exception
*/
nodesql.prototype.connect = function(){
	try {
		this.conn.connect()
		this.connected = true;	
	}catch(err){
		throw new nodesqlException(err, DEFAULT_EXC);
	}

	return this;
}

/**
* Loads configuration and creates a connection obejct
*
* @constructor
*
* @param {string} query
* The SQL query to be executed
*
* @param {string} input
* The sql query arguments. This will be properly parsed no
* need to sanitize input
*
* @returns json representation of query result
*/
nodesql.prototype.makeQuery = function(query, input){
	return new Promise((resolve, reject) => {
		this.conn.queryAsync(query, input)
		.then(resolve)
		.catch(reject);
	})
};



nodesql.prototype.sBlockStart = function(){
	// check if in where block or in select
	this.commandCount += 1;
	this.queryLevel += 1;
	
	if (this.prevWhere && this.commandCount - 1 == this.prevWhere){
		this.whereSelect = true;
		this.query += " ( ";
	}
	else if (!this.queryType == INSERT_TYPE){
		this.query += " ";
	}
	else{
		this.query += " ,( ";
	}

	return this;
};

nodesql.prototype.sBlockEnd = function(name){
	this.commandCount += 1;	
	
	if (name && !this.whereSelect){
		this.query += ") AS " + this.escapeId(name) + " ";
	}
	else if (this.queryType == INSERT_TYPE && !this.whereSelect){
		this.query += " ";
	}
	else{
		this.query += ") ";
	}
	if (this.whereSelect){
		this.prevWhere = this.commandCount;
		this.prevWhere = false;
	}
	this.queryLevel -= 1;

	return this;
};

handleSelectFunction = function(op, value){
	if (!SUP_FUNC.includes(op)){
		throw new nodesqlException("SELECT does not  support operation " + op , DEFAULT_EXC);
	}
	var q;
	switch(op){
		case "DISTINCT":
			q = op + " "+ value+ ",";
		break;
		default:
			q = op + "("+ value+ "),";
	}
	return q;
}

nodesql.prototype.select = function(query){
	this.commandCount += 1;
	this.query += "SELECT ";
	if (!this.queryType){
		this.queryType = SELECT_TYPE;
	}
	var q = '';
	for (var i = 0; i < query.length; i++){
		if (typeof query[i]  == 'string'){
			q += query[i] + ','
		}else{
			q += handleSelectFunction(query[i].func, query[i].value);
		}
	}
	this.query += q.slice(0,-1);

	// always adding this to the end for safety
	this.query += " ";
	return this;
};

nodesql.prototype.delete = function(query){
	
	query = query || "";
	this.commandCount += 1;
	this.query += "DELETE " + query;
	if (!this.queryType){
		this.queryType = DELETE_TYPE;
	}	
	this.query += " ";
	return this;
};

nodesql.prototype.update = function(table, params, noEscape){
	this.commandCount += 1;
	this.query = "UPDATE " + table;
	if (!this.queryType){
		this.queryType = UPDATE_TYPE;
	}
	var q = "";
	if (typeof params == 'string'){
		q = params;
	}else if(params){
		var nofKeys = 0;
		q += " SET ";
		for (key in params){
			q +=  this.escapeId(key,noEscape) + " = ";
			q += this.escape(params[key], noEscape) + ",";
			
			nofKeys++;
		}		
		// remove , in last positions 
		q = q.slice(0, -1) + " "; 
	}else{
		q = " ";
	}
	this.query += q;
	if (!this.queryType){
		this.queryType = UPDATE_TYPE;
	}	
	this.query += " ";
	return this;
};

nodesql.prototype.insert = function(table, fields, selectInsert, noEscape){
	this.queryType = INSERT_TYPE;
	this.commandCount += 1;
	var keys = "";
	var values = ""; 
	// array if select insert
	if (selectInsert){
		for (var i = 0; i < fields.length; i++){
			keys += this.escapeId(fields[i], noEscape) + ",";
		}
		// remove last comma
		keys = keys.substring(0, keys.length - 1) + " ";
	}//object
	else{
		// multiple rows
		if (fields instanceof Array){
			var keysFound = false
			var values = " VALUES "
			for (i = 0; i < fields.length; i++){
				var ar = fields[i];
				values += "("
				for (var obj in ar){
					if (!keysFound){
						keys += this.escapeId(obj, noEscape) + ",";
					}
					values += this.escape(ar[obj], noEscape) + ",";
				}
				if (!keysFound){
					keys = keys.substring(0, keys.length - 1) + " ";
					keysFound = true;
				}
				values = values.substring(0, values.length - 1) + "),";
			}
			values = values.substring(0, values.length - 1) + " ";
		}//single row
		else{
			values += " VALUES (";
			for (var obj in fields){
				keys += this.escapeId(obj, noEscape) + ",";
				values += this.escape(fields[obj], noEscape) + ",";
			}
			keys = keys.substring(0, keys.length - 1) + " ";
			values = values.substring(0, values.length - 1) + ") ";
		}
	}
	this.query += "INSERT INTO " + table + " (" + keys + ") "
		+ values;

	this.query += " ";
	return this;
};

nodesql.prototype.set = function(field, value, noEscape){
	this.commandCount += 1;
	if (!field || !value){
		throw new nodesqlException("SET : Invalid parameters" + 
						str(field) + ":" + str(value), DEFAULT_EXC);
	}

	this.query += "SET " + this.escapeId(field, noEscape);
	this.query += " = " + this.escape(value, noEscape);
	this.query += " ";
	return this;

};

nodesql.prototype.from = function(query){
	this.commandCount += 1;
	this.query += " FROM " + query + " ";
	return this;
};

nodesql.prototype.join = function(query, on, type){
	type = type || '';
	this.commandCount += 1;
	if (!query){
		throw new nodesqlException("JOIN: You have to supply query " + 
						str(query), DEFAULT_EXC);
	}

	this.query += " " + type + " JOIN " + query;
	
	if (on)
		this.query += " ON " + on + " ";

	return this;
};


nodesql.prototype.andBlockStart = function(value, op, field){
	this.commandCount += 1;
	
	if (!this.prevWhere || this.prevWhere + 1 != this.commandCount){
		this.query += " WHERE ( ";
	}else{
		this.query += " AND ( ";
	}
	
	this.prevWhere = this.commandCount;
	this.prevBlock = this. commandCount;
	return this;
};

nodesql.prototype.orBlockStart = function(){
	this.commandCount += 1;
	
	if (!this.prevWhere || this.prevWhere + 1 != this.commandCount){
		throw new nodesqlException("Invalid position for OR block", 
			DEFAULT_EXC);
	}
	this.query += " OR ( ";
	
	this.prevWhere = this.commandCount;
	this.prevBlock = this.commandCount;
	return this;
};

nodesql.prototype.blockEnd = function(query){
	this.commandCount += 1;

	this.query += " ) ";
	this.prevWhere = this.commandCount;
	
	return this;

};


nodesql.prototype.where = function(field, value, op, noEscape){
	
	this.commandCount += 1;
	op = op || "=";

	if (isNaN(op)) op = op.toUpperCase();

	if (!OP_LIST.includes(op)){
		throw new nodesqlException("Operation " + op + " not supported", 
			DEFAULT_EXC);
	}

	if (!field){
		throw new nodesqlException("WHERE: Invalid parameters" + 
						field + ":" + value, DEFAULT_EXC);
	}

	var action = null;
	if (this.prevBlock && this.prevBlock + 1 == this.commandCount){
		action = "";
	}
	else if (!this.prevWhere || this.prevWhere + 1 != this.commandCount){
		action = " WHERE "
	}else{
		action = " AND "
	}
	this.query +=  action + this.escapeId(field, noEscape);
	this.query += " " + op + " ";
	if (!value){
		if (!["IN", "NOT IN"].includes(op)){
			throw new nodesqlException("Operator needs to supply value", 
					DEFAULT_EXC);
		}
		this.query += " ";
	}else{
		this.query += this.escape(value, noEscape) + " ";
	}

	this.prevWhere = this.commandCount;
	return this;
};

nodesql.prototype.whereOr = function(field, value, op, noEscape){
	this.commandCount += 1;
	op = op || "=";

	if (!OP_LIST.includes(op)){
		throw new nodesqlException("Operation " + op + "not supported", 
			DEFAULT_EXC);
	}

	if (!field || !value){
		throw new nodesqlException("OR WHERE: Invalid parameters" + 
						str(field) + ":" + str(value), DEFAULT_EXC);
	}

	// if there was not previous where command 
	if (this.prevWhere + 1 != this.commandCount){
		throw new nodesqlException("OR WHERE: No previous where was found" + 
						str(field) + ":" + str(value), DEFAULT_EXC);
	}
	this.query += " OR  " + this.escapeId(field);
	this.query += op + this.escape(value) + " ";

	this.prevWhere = this.commandCount;
	return this;
};

nodesql.prototype.like = function(field, value, noEscape){
	this.commandCount += 1;

	if (!field || !value){
		throw new nodesqlException("LIKE: Invalid parameters" + 
						str(field) + ":" + str(value), DEFAULT_EXC);
	}

	// if there was not previous where command 
	if (this.prevWhere + 1!= this.commandCount){
		throw new nodesqlException("LIKE: No previous where was found" + 
						str(field) + ":" + str(value), DEFAULT_EXC);
	}
	this.query += this.escapeId(field) + " LIKE ";
	this.query += "%" + this.escape(value)  + "%"  + " ";

	this.prevWhere = this.commandCount;
	return this;
};

nodesql.prototype.orderBy = function(field, asc, noEscape){
	this.commandCount += 1;
	asc = asc || false;
	
	if (!field){
		throw new nodesqlException("ORDER BY: You have to supply ORDER BY field ",
			DEFAULT_EXC);
	}

	this.query += " ORDER BY " + this.escapeId(field, noEscape) + " ";
	if (asc){
		this.query += " ASC ";
	}else{
		this.query += " DESC ";
	}
	return this;
};

nodesql.prototype.groupBy = function(field, noEscape){
	if (!field){
		throw new nodesqlException("ORDER BY: You have to supply GROUP BY field ", 
			DEFAULT_EXC);
	}
	this.commandCount += 1;
	this.query += " GROUP BY " + this.escapeId(field, noEscape) + " ";
	return this;
};

nodesql.prototype.limit = function(value, noEscape){
	if (!value || isNaN(value)){
		throw new nodesqlException("ORDER BY: You have to supply LIMIT value ",
			DEFAULT_EXC);
	}
	this.commandCount += 1;
	
	this.query += " LIMIT " + this.escape(value, noEscape) + " ";
	return this;
};

nodesql.prototype.offset = function(value, noEscape){
	if (!value || isNaN(value)){
		throw new nodesqlException("ORDER BY: You have to supply offset value ",
			DEFAULT_EXC);
	}
	this.commandCount += 1;
	
	this.query += " OFFSET " + this.escape(value, noEscape) + " ";
	return this;
};


nodesql.prototype.union = function(query){
	this.commandCount += 1;
	return this;
};

nodesql.prototype.resetQuery = function(){
	this.query = "";
	this.queryType = null;
	this.commandCount = 0;
	this.prevWhere = null;
	this.prevBlock = 0;
	this.queryLevel = 0;	
	this.whereSelect = false;
	return this;
}

// returns query string
nodesql.prototype.queryString = function(){
	return this.query;
};

// execute async
nodesql.prototype.execute = function(){
	return new Promise((resolve, reject) => {
		this.conn.queryAsync(this.query)
		.then((result) => {
			this.resetQuery();
			resolve(result);
		})
		.catch((err) => {
			this.resetQuery();
			reject(err);
		});
	})
};

// closes connection to db async
nodesql.prototype.closeConnection = function(){
	return new Promise((resolve, reject) => {
		this.conn.end(function(err) {
			if (err) reject(err);
			else resolve();
		});
	})
};


module.exports = nodesql;