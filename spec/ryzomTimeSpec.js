const { ryzomTime } = require('../lib/ryzomTime');

describe('ryzomTime', () => {
  it('finds the cycleNumber', () => {
    const time = ryzomTime({
      server_tick: ['1975414721'],
      season: ['3'],
      cache: [{'$': { created: '1534714874' } }],
    }, 1534714874000);

    expect(time.prettyHour()).toEqual('03:00');
    expect(time.cycleStart).toEqual(3);
    expect(time.season).toEqual(3);
    expect(time.cycleNumber).toEqual(365329);
    expect(time.time()).toEqual('04:37');
  });

  it('offsets the time based on cache generation', () => {
    const time = ryzomTime({
      server_tick: ['1975414721'],
      season: ['3'],
      cache: [{'$': { created: '1534714874' } }],
    }, 1534714974000);

    expect(time.prettyHour()).toEqual('03:00');
    expect(time.cycleStart).toEqual(3);
    expect(time.season).toEqual(3);
    expect(time.cycleNumber).toEqual(365329);
    expect(time.time()).toEqual('05:10');
  });
});
