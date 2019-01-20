const test = require("blue-tape");
const Eff = require("../src/index");
const simulate = require("../src/simulate");

test("eff-function creates an effect object", t => {
  t.plan(2);
  const f = () => "foo";
  const res = Eff.eff(f, 1, 2);
  t.equal(res.executor, f, "with correct executor");
  t.deepEqual(res.params, [1, 2], "with correct parameters");
});

test("run-function runs an effect as a promise", t => {
  const f = (a, b) => a + b;
  const eff = Eff.eff(f, "foo", "bar");
  return Eff.run(eff).then(actual =>
    t.equal(actual, "foobar", "with correct result")
  );
});

test("running unit", t => {
  return Eff.run(Eff.unit("yeah")).then(actual =>
    t.equal(actual, "yeah", "returns the contained value")
  );
});

test("binding passes return value to next function", t => {
  const eff = Eff.bind(Eff.unit("yeah"), v => Eff.unit(v));
  return Eff.run(eff).then(actual => t.equal(actual, "yeah", "correct result"));
});

test("bind with unit chain", t => {
  const read = filename => Eff.unit("read:" + filename);
  const write = data => Eff.unit("wrote:" + data);

  const eff = Eff.bind(read("myfile"), write);
  return Eff.run(eff).then(actual =>
    t.equal(actual, "wrote:read:myfile", "gives correct result")
  );
});

test("bind with longer chain", t => {
  const f1 = a => Eff.unit("F1:" + a);
  const f2 = a => Eff.unit("F2:" + a);
  const f3 = a => Eff.unit("F3:" + a);
  const eff = Eff.bind(f1("start"), r1 =>
    Eff.bind(f2(r1), r2 => Eff.bind(f3(r2), r3 => Eff.unit(r3)))
  );
  return Eff.run(eff).then(actual =>
    t.equal(actual, "F3:F2:F1:start", "gives correct result")
  );
});

test("simulate unit", t => {
  let called = false;
  const eff = Eff.unit("foo");
  return simulate(eff, [
    param => {
      t.equal(param, "foo", "correct paramter to mock");
      called = true;
    }
  ]).then(r => {
    t.equal(called, true, "mock has been called");
  });
});

test("simulate unit with bind", t => {
  let called = 0;

  const eff = Eff.bind(Eff.unit("foo"), x => Eff.unit("bar"));
  return simulate(eff, [
    param => {
      t.equal(param, "foo", "param to first mock");
      called++;
    },
    param => {
      t.equal(param, "bar", "param to second mock");
      called++;
    }
  ]).then(r => {
    t.equal(called, 2, "Both mocks called");
  });
});

test("simulate more complex chains", t => {
  const getPerson = id => Eff.eff("getPersonIO", id);
  const getCompany = id => Eff.eff("getCompanyIO", id);
  const getPersonWithCompany = personId =>
    Eff.bind(getPerson(personId), p =>
      Eff.bind(getCompany(p.companyId), c =>
        Eff.unit({ ...p, companyName: c.name })
      )
    );

  const PersonId = 100;
  const PersonName = "John";
  const CompanyId = 200;
  const CompanyName = "Acme Inc";

  let called = 0;

  return simulate(getPersonWithCompany(PersonId), [
    id => {
      t.equal(id, PersonId, "Param to first mock");
      called++;
      return { id, name: PersonName, companyId: CompanyId };
    },
    companyId => {
      t.equal(companyId, CompanyId, "Param to second mock");
      called++;
      return { id: companyId, name: CompanyName };
    },
    person => {
      t.deepEqual(
        person,
        {
          id: PersonId,
          name: PersonName,
          companyId: CompanyId,
          companyName: CompanyName
        },
        "Param to third mock"
      );
      called++;
    }
  ]).then(() => {
    t.equal(called, 3, "All mocks called");
  });
});

test("Giving too few mocks", t => {
  const eff = Eff.bind(Eff.unit("foo"), x => Eff.unit("bar"));
  return simulate(eff, [x => x])
    .then(() => t.fail("Should throw an error"))
    .catch(e =>
      t.equal(
        e.message,
        "The effect chain contains more steps than was given in the mocks",
        "Should throw a correct error"
      )
    );
});
