import chai, { expect } from "chai"
import spies from "chai-spies"
import flute, { middleware, Model } from "../src"

chai.use(spies);
class Person extends Model {
  static schema = {
    name: String,
    age: Number
  }
}
flute.model(Person);
const PersonModel = flute.model("Person")

class Unit extends Model {
  static routes = {
    only: ["GET", "POST", "PUT"],
    POST: "/api/v2/landlords/buildings/:building_id/units",
    PUT: "/api/v2/landlords/buildings/:building_id/units/:id"
  }
  static schema = {
    user_id: Number,
    building_id: Number,
    unit_type: String,
    _timestamps: true
  }
}
flute.model(Unit);
const UnitModel = flute.model("Unit")

// Shitty stub fetch real quick
const fetch = ()=>Promise.resolve({
  status: 404,
  json: ()=>Promise.resolve({body: { summary: "Not found" }})
})

const fetchSpy = chai.spy(fetch),
      dispatch = chai.spy();
global.fetch = fetchSpy;

// Stub out a redux store for flute
middleware({ dispatch })(function(action){ return action; })({type:"cool"})

describe("Model", ()=>{
  describe("#constructor", ()=>{

    it("should create a pristine version of the model that is not writeable", ()=>{
      const person = new Person({ name: "Kyle", age: 28 })
      person.name = "Jim"
      person.pristineRecord.name = "Jim";
      expect(person.pristineRecord.name).to.equal("Kyle")
    });

  });
  describe("#save", ()=>{
    it("should only save the changed attributes (diff)", ()=>{
      const person = new Person({ id:12983, name: "Kyle", age: 28 })
      person.name = "Jim"
      fetchSpy.reset();
      person.save().catch(e=>{});
      const [lastCall] = fetchSpy.__spy.calls,
            [,{ body:jsonBody }] = lastCall,
            body = JSON.parse(jsonBody);

      expect(body).to.eql({ name: "Jim" })
    })

    it("should save the entire record if diff mode is disabled", ()=>{
      const person = new Person({ name: "Kyle", age: 28 })
      person.name = "Jim"
      fetchSpy.reset();
      flute.setAPI({ diffMode: false })
      person.save().catch(e=>{});
      const [lastCall] = fetchSpy.__spy.calls,
            [,{ body:jsonBody }] = lastCall,
            body = JSON.parse(jsonBody);

      expect(body).to.eql({ name: "Jim", age: 28 })
    })

    it("should be able to interpolate a route when diffMode is on (#BUG)", ()=>{

      const unit = new Unit({
        id:46,
        user_id: 10,
        building_id: 45,
        unit_type: "sfh",
        created_at: "2017-04-06T14:49:46-05:00",
        updated_at:"2017-04-06T14:49:46-05:00"
      })
      unit.unit_type = "town"
      fetchSpy.reset();
      flute.setAPI({ diffMode: true })
      unit.save().catch(e=>{});

      const [lastCall] = fetchSpy.__spy.calls,
            [requestPath,{ body:jsonBody }] = lastCall,
            body = JSON.parse(jsonBody);

      expect(body).to.eql({ unit_type: "town" })
      expect(requestPath).to.eql("/api/v2/landlords/buildings/45/units/46")
    })

    it("should submit all attributes if the record is new (no ID) (#BUG)", ()=>{
      const unit = new Unit({
        user_id: 10,
        building_id: 45,
        unit_type: "sfh"
      })
      fetchSpy.reset();

      unit.save().catch(e=>{});

      const [lastCall] = fetchSpy.__spy.calls,
            [,{ body:jsonBody }] = lastCall,
            body = JSON.parse(jsonBody);

      expect(body).to.eql({ user_id: 10, building_id: 45, unit_type: "sfh" })
    })
  })

  describe("#all", ()=>{
    it("should allow INDEX as a route type", ()=>{
      fetchSpy.reset();
      Person.all().catch(function(){})
      const [lastCall] = fetchSpy.__spy.calls,
            [,{ method }] = lastCall;
      expect("GET").to.eql(method)
    });

    it("should allow custom index routes", ()=>{
      Person.routes.INDEX = "/my-custom-index-route"
      fetchSpy.reset();
      Person.all().catch(function(){})
      const [lastCall] = fetchSpy.__spy.calls,
            [ route ] = lastCall;

      expect(Person.routes.INDEX).to.eql(route)

      delete Person.routes.INDEX
    });

    it("should allow custom index routes without affecting show route", ()=>{
      Person.routes.INDEX = "/my-custom-index-route"
      fetchSpy.reset();
      Person.find("dude-kyle").catch(function(){})
      const [lastCall] = fetchSpy.__spy.calls,
            [ route ] = lastCall;
      expect("/people/dude-kyle").to.eql(route)

      delete Person.routes.INDEX
    })

    it("should fallback to the normal GET route if an INDEX route was not provided for singletons (BUG)", ()=>{
      class Landlord extends Model {
        static routes = {
          only: ["GET", "PUT"],
          GET: "/api/v2/landlords/me",
          PUT: "/api/v2/landlords/me"
        }

        static schema = {
          name: String,
          level: String
        }
      }
      flute.model(Landlord);
      const Me = flute.model("Landlord");
      fetchSpy.reset();
      Me.all().catch(function(){})
      const [lastCall] = fetchSpy.__spy.calls,
            [ route ] = lastCall;

      expect("/api/v2/landlords/me").to.eql(route)
    })
  });
});
