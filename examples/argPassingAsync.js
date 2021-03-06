var flow = require('../index').flow;
var as = require('../index').as;
var fs = require('fs');

var myFlow = flow('myFlow')(
  function readFiles(file1, file2) {
    fs.readFile(file1, 'utf8', this.async(as(1)));
    fs.readFile(file2, 'utf8', this.async(as(1)));
  },
  function end(data1, data2) {
    if (this.err) throw this.err;
    console.log(data1 + data2); // FILE1FILE2
    console.log('done');
    this.next();
  }
);

myFlow('file1', 'file2');