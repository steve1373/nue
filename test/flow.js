var nue = require('../lib/nue');
var flow = nue.flow;
var assert = require('assert');

describe('flow', function() {
  it('should chain functions with "next"', function (done) {
    flow(
      function () {
        this.next();
      },
      function () {
        this.next();
      },
      function () {
        this.next();
      },
      function () {
        if (this.err) throw this.err;
        done();
      }
    )();
  });

  it('should chain functions with "callback"', function (done) {
    flow(
      function () {
        this.callback();
      },
      function () {
        this.callback();
      },
      function () {
        this.callback();
      },
      function () {
        if (this.err) throw this.err;
        done();
      }
    )();
  });

  it('should chain functions with specified batch size', function (done) {
    flow(1)(
      function () {
        this.next();
      },
      function () {
        this.next();
      },
      function () {
        this.next();
      },
      function () {
        if (this.err) throw this.err;
        done();
      }
    )();
  });

  it('should jump with "end"', function (done) {
    flow(
      function () {
        this.next();
      },
      function () {
        this.end('ERROR', 'aaa', 123);
      },
      function () {
        assert.ok(false);
      },
      function (string, number) {
        assert.strictEqual(this.err, 'ERROR');
        assert.strictEqual(string, 'aaa');
        assert.strictEqual(number, 123);
        done();
      }
    )();
  });

  it('should jump inner flow', function (done) {
    flow(
      function () {
        this.next();
      },
      flow(
        function () {
          this.end('ERROR');
        },
        function () {
          assert.ok(false);
        },
        function () {
          assert.strictEqual(this.err, 'ERROR');
          this.next();
        }
      ),
      function () {
        this.next();
      },
      function () {
        done();
      }
    )();
  });

  it('should accept arguments on startup', function (done) {
    flow(
      function (number, bool, string) {
        assert.strictEqual(number, 1);
        assert.strictEqual(bool, true);
        assert.strictEqual(string, 'hoge');
        done();
      }
    )(1, true, 'hoge');
  });

  it('should pass arguments with "next" between functions"', function (done) {
    flow(
      function () {
        this.next(1, true, 'hoge');
      },
      function (number, bool, string) {
        assert.strictEqual(number, 1);
        assert.strictEqual(bool, true);
        assert.strictEqual(string, 'hoge');
        this.next(2, false, 'foo');
      },
      function (number, bool, string) {
        assert.strictEqual(this.err, undefined);
        assert.strictEqual(number, 2);
        assert.strictEqual(bool, false);
        assert.strictEqual(string, 'foo');
        done();
      }
    )();
  });

  it('should pass arguments with "callback" between functions"', function (done) {
    flow(
      function () {
        this.callback(null, 1, true, 'hoge');
      },
      function (number, bool, string) {
        assert.strictEqual(number, 1);
        assert.strictEqual(bool, true);
        assert.strictEqual(string, 'hoge');
        this.callback(null, 2, false, 'foo');
      },
      function (number, bool, string) {
        assert.strictEqual(this.err, undefined);
        assert.strictEqual(number, 2);
        assert.strictEqual(bool, false);
        assert.strictEqual(string, 'foo');
        done();
      }
    )();
  });

  it('should ignore duplicated next function calls"', function (done) {
    flow(
      function () {
        this.next(this);
      },
      function (prevContext) {
        prevContext.next();
        done();
      }
    )();
  });

  it('should share data', function (done) {
    flow(
      function () {
        this.data = 'a'; 
        this.next();
      },
      function () {
        this.data += 'b';
        this.next();
      },
      function () {
        this.data += 'c';
        this.next();
      },
      function () {
        assert.strictEqual(this.data, 'abc');
        done();
      }
    )();
  });

  it('should exit from chain with the end function', function (done) {
    flow(
      function () {
        this.data = 'a';
        this.next();
      },
      function () {
        this.data += 'b';
        this.end();
      },
      function () {
        this.data += 'c';
        this.next();
      },
      function () {
        assert.strictEqual(this.data, 'ab');
        done();
      }
    )();
  });

  it('should emit "done" event', function (done) {
    var myFlow = flow(
      function () {
        this.data = 'a';
        this.next(1);
      },
      function (i) {
        this.data += 'b';
        this.next(i + 1);
      },
      flow(1)(
        function (i) {
          this.data += 'x';
          this.next(i + 1);
        },
        function (i) {
          this.data += 'y';
          this.next(i + 1);
        }
      ),
      function (i) {
        this.data += 'c';
        this.next(i + 1);
      },
      function (i) {
        if (this.err) throw this.err;
        this.data += 'd';
        this.next(i);
      }
    );

    myFlow.on('done', function (argument) {
      assert.strictEqual(argument, 5);
      assert.strictEqual(this.data, 'abxycd');      
      done();
    })();
  });

  it('should handle empty tasks', function (done) {
    var myFlow = flow();
    myFlow.on('done', function() {
      done();
    })();
  });

  it('should handle single task', function (done) {
    var myFlow = flow(
      function () {
        this.next();
      }
    );
    myFlow.on('done', function() {
      done();
    })();
  });
});