# Jaudu — Websocket powered CSRF protection
   Jaudu is CSRF protection which uses websockets instead of cookies and session, resulting in tokens which cannot be parsed from DOM. Since many crackers and spammers use this method to bypass CSRF, Jaudu provides extra protection compared to formal CSRF protections. Jaudu also supports client side form timelocks and IP banning, which can be easily added by modifying jaudu.js javascript file.

##Pre-requirements:
   [Redis](http://redis.io/) - Jaudu uses redis to store keys

##Installation:   
1. ```$ npm install jaudu```
2. Customize your choice of jaudu.js from /js folder. Please see docs folder for more information.

##Usage:
```javascript
var jaudu = require('jaudu');

// Connect to redis host
jaudu.Database(<redis_host>, <redis_password>, <port>);

app.configure(function(){
// Add bodyParser middleware if you already don't have it enabled
app.use(express.bodyParser());
// Add jaudu middleware
app.use(jaudu);
});
```

##Defaults
   By default Jaudu will start websocket server on port 3012.

###License (MIT)
   Copyright (c) 2012-2013 Juuso Haavisto <juuso@mail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
