import chai, { expect } from "chai"
import spies from "chai-spies"
import flute, { middleware, Model } from "../src"

chai.use(spies);

describe("Model", ()=>{
  describe("#constructor", ()=>{
    class Person extends Model {
      static schema = {
        name: String,
        age: Number
      }
    }
    flute.model(Person);
    const PersonModel = flute.model("Person")

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

    it("should create a pristine version of the model that is not writeable", ()=>{
      const person = new Person({ name: "Kyle", age: 28 })
      person.name = "Jim"
      person.pristineRecord.name = "Jim";
      expect(person.pristineRecord.name).to.equal("Kyle")
    });

    it("should only save the changed attributes (diff)", ()=>{
      const person = new Person({ name: "Kyle", age: 28 })
      person.name = "Jim"
      fetchSpy.reset();
      person.save().catch(e=>{});
      const [lastCall] = fetchSpy.__spy.calls,
            [,{ body:jsonBody }] = lastCall,
            body = JSON.parse(jsonBody);

      expect(body).to.eql({name: "Jim" })
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

  });
});