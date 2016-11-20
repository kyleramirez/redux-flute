# redux-flute
![](https://circleci.com/gh/kyleramirez/flute.svg?style=shield&circle-token=f96dcd523b80bba77a924ec8d293eb47c0934bd5)

### What does it do?
Flute is an object-relational mapping (ORM) implementation that lets you interact with RESTful APIs. By defining models on the front end, integrating closely with the popular state container, Redux, Flute offers a Ruby-on-Rails-esque, ActiveRecord-ey syntax. Think ActiveRecord for JavaScript. Flute allows you to write syntax like this:

    const userAddress = new Address

    userAddress.address1 = "1100 Congress Ave"
    userAddress.city = "Austin"
    userAddress.state = "TX"

    userAddress.save()
    /* 
      REQUEST:
        Method: POST 
        URL: /api/addresses
        Data: {
          "address1": "1100 Congress Ave",
          "city": "Austin",
          "state": "TX"
        }
      RESPONSE:
        Status: 201 Created
        Body: {
          "_id": "583132c8edc3b79a853b8d69",
          "createdAt": "2016-11-20T05:21:12.988Z",
          "updatedAt": "2016-11-20T05:21:12.988Z",
          "userId": "580432279153ea2679095acd",
          "address1": "1100 Congress Ave",
          "city": "Austin",
          "state": "TX"
        }
    */
    userAddress.id
    // Returns 583132c8edc3b79a853b8d69
    userAddress.destroy()
    // Does what you would expect (A DELETE request to the same resource)

### Installation

    npm install --save-dev redux-flute
    
