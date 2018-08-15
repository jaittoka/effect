const Eff = require('../src/index');

test("eff-function creates an effect object", () => {
    const f = () => 'foo';
    const res = Eff.eff(f, 1, 2);
    expect(Eff.willExecute(res, f)).toBeTruthy();
    expect(Eff.getParams(res)).toEqual([1, 2]);
});

test("run-function runs an effect as a promise", () => {
    const f = (a, b) => a + b;
    const eff = Eff.eff(f, 'foo', 'bar');
    return expect(Eff.run(eff)).resolves.toEqual("foobar");
});

test("running unit returns the contained value", () => {
    return expect(Eff.run(Eff.unit('yeah'))).resolves.toEqual('yeah');
});

test("binding passes return value to next function", () => {
    const eff = Eff.bind(Eff.unit('yeah'), (v) => Eff.unit(v));
    return expect(Eff.run(eff)).resolves.toEqual('yeah');
});

test("bind works as expected", () => {

    const read = (filename) => Eff.unit('read:'+filename);
    const write = (data) => Eff.unit('wrote:'+data);

    const eff = Eff.bind(read('myfile'), write)
    return expect(Eff.run(eff)).resolves.toEqual('wrote:read:myfile');
});

test("bind works with a longer chain", () => {
    const f1 = (a) => Eff.unit('F1:'+a);
    const f2 = (a) => Eff.unit('F2:'+a);
    const f3 = (a) => Eff.unit('F3:'+a);
    const eff = Eff.bind(f1('start'), (r1) => 
                Eff.bind(f2(r1), (r2) =>
                Eff.bind(f3(r2), (r3) => 
                Eff.unit(r3))));
    return expect(Eff.run(eff)).resolves.toEqual('F3:F2:F1:start');
});

test("simulate unit", () => {
    let called = false;
    const eff = Eff.unit('foo');
    return Eff.simulate(eff, [
        (eff) => {
            expect(Eff.getParams(eff)).toEqual(['foo']);
            called = true
        }
    ]).then(r => {
        expect(called).toBeTruthy();
    });
});

test("simulate unit with bind", () => {
    let called1 = false, called2 = false;
    const eff = Eff.bind(Eff.unit('foo'), (x) => Eff.unit('bar'));
    return Eff.simulate(eff, [
        (eff) => {
            expect(Eff.getParams(eff)).toEqual(['foo']);
            called1 = true;
        },
        (eff) => {
            expect(Eff.getParams(eff)).toEqual(['bar']);
            called2 = true;
        },
    ]).then(r => {
        expect(called1).toBeTruthy();
        expect(called2).toBeTruthy();
    })

});

test("simulating mode complex function chains", () => {

    const JOHN_ID = 1;
    const ACME_ID = 1;
    const WIDGET_ID = 2;

    const getPerson = (id) => id === JOHN_ID ? Eff.unit({ id, name: 'John', companyId: ACME_ID }) : Eff.unit({ id, name: 'Mary', companyId: WIDGET_ID });
    const getCompany = (id) => id === ACME_ID ? Eff.unit({ id, name: 'Acme Inc' }) : Eff.unit({ id, name: 'Widget Ltd' });

    const getPersonWithCompany = (personId) =>
        Eff.bind(getPerson(1), (p) => 
        Eff.bind(getCompany(p.companyId), (c) => 
        Eff.unit({ ...p, companyName: c.name })));

    return Eff.simulate(getPersonWithCompany(1), [
        () => ({ companyId: 1000 }),
        () => ({ name: 'foobar' }),
        (eff) => {
            expect(Eff.getParams(eff)).toEqual([{ companyId: 1000, companyName: 'foobar' }]);
        }
    ]);
});

