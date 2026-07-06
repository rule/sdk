import * as sdk from '@rule/sdk';

describe('@rule/sdk', () => {
  it('loads without error', () => {
    expect(sdk).toBeDefined();
  });

  it('has named exports', () => {
    expect(Object.keys(sdk).length).toBeGreaterThan(0);
  });
});
